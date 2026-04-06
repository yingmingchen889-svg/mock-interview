"""Main voice-interview agent built on the LiveKit Agents SDK.

The agent joins a LiveKit room, reads room metadata to learn the interview
configuration, then runs a voice pipeline that:
  - Transcribes candidate speech  (Deepgram STT)
  - Generates interviewer replies (OpenAI LLM)
  - Synthesises interviewer voice (ElevenLabs TTS)

On session end it POSTs the full transcript to the Next.js API.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx
from livekit.agents import (
    AutoSubscribe,
    JobContext,
    WorkerOptions,
    llm as agents_llm,
)
from livekit.agents.voice import VoicePipelineAgent
from livekit.plugins import deepgram, openai, elevenlabs, silero

from config import Config
from prompts import build_system_prompt, get_phase_instruction
from state_machine import InterviewPhase, InterviewStateMachine
from transcript_store import TranscriptStore

logger = logging.getLogger("interview-agent")

# Model -> provider mapping
_MODEL_PROVIDERS: dict[str, dict[str, str]] = {
    "deepseek-chat":     {"api_key_attr": "DEEPSEEK_API_KEY", "base_url": "https://api.deepseek.com/v1"},
    "deepseek-reasoner": {"api_key_attr": "DEEPSEEK_API_KEY", "base_url": "https://api.deepseek.com/v1"},
    "gpt-4o-mini":       {"api_key_attr": "OPENAI_API_KEY",   "base_url": "https://api.openai.com/v1"},
    "gpt-4o":            {"api_key_attr": "OPENAI_API_KEY",   "base_url": "https://api.openai.com/v1"},
    "claude-sonnet":     {"api_key_attr": "ANTHROPIC_API_KEY", "base_url": "https://api.anthropic.com/v1"},
}


def _create_llm(model_name: str) -> openai.LLM:
    """Create an OpenAI-compatible LLM client based on the model name."""
    provider_info = _MODEL_PROVIDERS.get(model_name)
    if provider_info:
        api_key = getattr(Config, provider_info["api_key_attr"], "")
        base_url = provider_info["base_url"]
    else:
        # Unknown model — try DeepSeek as default fallback
        api_key = Config.DEEPSEEK_API_KEY or Config.OPENAI_API_KEY
        base_url = "https://api.deepseek.com/v1"
        logger.warning("Unknown model %s, falling back to DeepSeek", model_name)

    return openai.LLM(api_key=api_key, base_url=base_url, model=model_name)


def _parse_room_metadata(metadata: str) -> dict[str, str]:
    """Parse ``jobRole|techStack|difficulty|model|interviewId`` from room metadata."""
    parts = metadata.split("|")
    keys = ["jobRole", "techStack", "difficulty", "model", "interviewId"]
    return {k: (parts[i] if i < len(parts) else "") for i, k in enumerate(keys)}


async def _post_transcript(store: TranscriptStore) -> None:
    """Send the completed transcript to the Next.js API."""
    url = f"{Config.NEXT_API_URL}/api/interview/{store.interview_id}/transcript"
    headers = {"Authorization": f"Bearer {Config.AGENT_API_SECRET}"}
    payload = store.to_api_payload()
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            logger.info("Transcript posted successfully for interview %s", store.interview_id)
    except httpx.HTTPError as exc:
        logger.error("Failed to post transcript: %s", exc)


async def entrypoint(ctx: JobContext) -> None:
    """LiveKit agent entrypoint — called once per room."""

    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # Wait for the first participant to join
    participant = await ctx.wait_for_participant()

    # ---- Parse interview config from room metadata ----
    metadata = ctx.room.metadata or ""
    config = _parse_room_metadata(metadata)
    job_role = config.get("jobRole", "软件工程师")
    tech_stack = config.get("techStack", "Python, JavaScript")
    difficulty = config.get("difficulty", "medium")
    model_name = config.get("model", "gpt-4o-mini")
    interview_id = config.get("interviewId", ctx.room.name)

    # ---- Build prompt & state ----
    system_prompt = build_system_prompt(
        job_role=job_role,
        tech_stack=tech_stack,
        difficulty=difficulty,
    )
    state = InterviewStateMachine()
    store = TranscriptStore(interview_id)

    # Combine system prompt with current phase instruction
    initial_instructions = (
        system_prompt + "\n\n" + get_phase_instruction(state.current_phase)
    )

    initial_ctx = agents_llm.ChatContext()
    initial_ctx.append(role="system", text=initial_instructions)

    # ---- Create voice pipeline ----
    agent = VoicePipelineAgent(
        vad=silero.VAD.load(),
        stt=deepgram.STT(
            api_key=Config.DEEPGRAM_API_KEY,
            language="zh",
        ),
        llm=_create_llm(model_name),
        tts=elevenlabs.TTS(
            api_key=Config.ELEVENLABS_API_KEY,
        ),
        chat_ctx=initial_ctx,
    )

    # ---- Event handlers for transcript tracking ----

    @agent.on("user_speech_committed")
    def _on_user_speech(msg: agents_llm.ChatMessage) -> None:
        text = msg.content or ""
        if text.strip():
            store.add_user_message(text, state.current_phase)
            logger.debug("[USER] %s", text[:80])

    @agent.on("agent_speech_committed")
    def _on_agent_speech(msg: agents_llm.ChatMessage) -> None:
        text = msg.content or ""
        if text.strip():
            store.add_agent_message(text, state.current_phase)
            logger.debug("[AGENT] %s", text[:80])

    # ---- Shutdown handler ----

    @ctx.add_shutdown_callback
    async def _on_shutdown() -> None:
        logger.info("Session ending — posting transcript (%d entries)", len(store.entries))
        await _post_transcript(store)

    # ---- Start the agent ----
    agent.start(ctx.room, participant)
    await agent.say(
        "你好！欢迎参加今天的面试。我是你的面试官。在我们开始之前，请简单介绍一下你自己。",
        allow_interruptions=True,
    )
