"""System prompt construction and per-phase instructions for the interview agent."""

from __future__ import annotations

from state_machine import InterviewPhase


# ---------------------------------------------------------------------------
# Phase-specific instructions
# ---------------------------------------------------------------------------

PHASE_INSTRUCTIONS: dict[InterviewPhase, str] = {
    InterviewPhase.INTRO: (
        "你现在处于【开场介绍】阶段。\n"
        "- 用中文热情但专业地欢迎候选人。\n"
        "- 简短介绍面试流程（技术问答、行为面试、候选人提问）。\n"
        "- 询问候选人是否准备好开始。\n"
        "- 不要在此阶段提出技术问题。"
    ),
    InterviewPhase.TECHNICAL: (
        "你现在处于【技术面试】阶段。\n"
        "- 根据职位和技术栈提出技术问题。\n"
        "- 每个问题后根据候选人的回答进行追问，最多追问两次。\n"
        "- 如果候选人回答不完整，给予适当引导。\n"
        "- 注意控制难度，根据配置的难度级别调整问题深度。\n"
        "- 在此阶段提出 3-5 个技术问题。"
    ),
    InterviewPhase.BEHAVIORAL: (
        "你现在处于【行为面试】阶段。\n"
        "- 使用 STAR 方法提问（情境、任务、行动、结果）。\n"
        "- 围绕团队协作、冲突解决、项目管理等方面提问。\n"
        "- 根据候选人的回答进行追问以获取更多细节。\n"
        "- 在此阶段提出 2-3 个行为问题。"
    ),
    InterviewPhase.QA: (
        "你现在处于【候选人提问】阶段。\n"
        "- 邀请候选人提出任何问题。\n"
        "- 以面试官的身份回答关于职位和团队的问题。\n"
        "- 当候选人没有更多问题时，礼貌地结束面试。\n"
        "- 感谢候选人的时间并告知后续流程。"
    ),
}


# ---------------------------------------------------------------------------
# Difficulty modifiers
# ---------------------------------------------------------------------------

_DIFFICULTY_HINTS: dict[str, str] = {
    "easy": "面试难度：初级。提问基础概念，不要涉及过于深入的底层原理。",
    "medium": "面试难度：中级。可以提问中等难度的设计和实现问题。",
    "hard": "面试难度：高级。可以深入探讨系统设计、性能优化和底层原理。",
}


# ---------------------------------------------------------------------------
# Public helpers
# ---------------------------------------------------------------------------


def build_system_prompt(
    *,
    job_role: str,
    tech_stack: str,
    difficulty: str,
) -> str:
    """Return the full system prompt for the interviewer persona.

    Parameters
    ----------
    job_role:
        The target position, e.g. "前端工程师".
    tech_stack:
        Comma-separated technologies, e.g. "React, TypeScript, Next.js".
    difficulty:
        One of "easy", "medium", "hard".
    """
    difficulty_hint = _DIFFICULTY_HINTS.get(difficulty.lower(), _DIFFICULTY_HINTS["medium"])

    return (
        "你是一位专业的技术面试官。你的风格是温和但严谨的，善于引导候选人展示真实水平。\n"
        "你全程使用中文进行面试。\n\n"
        f"目标职位：{job_role}\n"
        f"技术栈：{tech_stack}\n"
        f"{difficulty_hint}\n\n"
        "面试规则：\n"
        "1. 每次只问一个问题，等待候选人回答。\n"
        "2. 根据回答质量决定是否追问（最多追问两次）。\n"
        "3. 如果候选人完全答不上来，给予适当提示后转入下一个问题。\n"
        "4. 保持专业、友好的语气。\n"
        "5. 不要透露标准答案。\n"
    )


def get_phase_instruction(phase: InterviewPhase) -> str:
    """Return the instruction text for the given interview phase."""
    return PHASE_INSTRUCTIONS[phase]
