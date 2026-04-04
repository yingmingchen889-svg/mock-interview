"""In-memory transcript store for a single interview session.

Accumulates speech entries from both the interviewer (agent) and the
candidate (user), and can format the data for the Next.js API.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field, asdict
from typing import Any

from state_machine import InterviewPhase


@dataclass
class TranscriptEntry:
    role: str  # "agent" | "user"
    content: str
    phase: str
    timestamp: float = field(default_factory=time.time)
    question_index: int | None = None


class TranscriptStore:
    """Holds all transcript entries for one interview session."""

    def __init__(self, interview_id: str) -> None:
        self.interview_id = interview_id
        self._entries: list[TranscriptEntry] = []
        self._question_counter: int = 0

    # ------------------------------------------------------------------
    # Recording
    # ------------------------------------------------------------------

    def add_agent_message(self, content: str, phase: InterviewPhase) -> None:
        """Record something the interviewer said."""
        self._entries.append(
            TranscriptEntry(
                role="agent",
                content=content,
                phase=phase.value,
                question_index=self._question_counter,
            )
        )

    def add_user_message(self, content: str, phase: InterviewPhase) -> None:
        """Record something the candidate said."""
        self._entries.append(
            TranscriptEntry(
                role="user",
                content=content,
                phase=phase.value,
                question_index=self._question_counter,
            )
        )

    def increment_question(self) -> int:
        """Advance the question counter and return the new value."""
        self._question_counter += 1
        return self._question_counter

    # ------------------------------------------------------------------
    # Querying
    # ------------------------------------------------------------------

    @property
    def entries(self) -> list[TranscriptEntry]:
        return list(self._entries)

    @property
    def question_count(self) -> int:
        return self._question_counter

    def conversation_history(self) -> list[dict[str, str]]:
        """Return entries formatted for LLM chat context.

        Each item is ``{"role": "assistant"|"user", "content": "..."}``
        which maps directly to the OpenAI chat format.
        """
        out: list[dict[str, str]] = []
        for entry in self._entries:
            role = "assistant" if entry.role == "agent" else "user"
            out.append({"role": role, "content": entry.content})
        return out

    # ------------------------------------------------------------------
    # API payload
    # ------------------------------------------------------------------

    def to_api_payload(self) -> dict[str, Any]:
        """Build the JSON body to POST to the Next.js transcript endpoint."""
        return {
            "interviewId": self.interview_id,
            "entries": [asdict(e) for e in self._entries],
            "questionCount": self._question_counter,
        }
