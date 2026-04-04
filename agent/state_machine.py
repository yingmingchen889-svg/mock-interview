from enum import Enum


class InterviewPhase(str, Enum):
    INTRO = "INTRO"
    TECHNICAL = "TECHNICAL"
    BEHAVIORAL = "BEHAVIORAL"
    QA = "QA"


_PHASE_ORDER = [
    InterviewPhase.INTRO,
    InterviewPhase.TECHNICAL,
    InterviewPhase.BEHAVIORAL,
    InterviewPhase.QA,
]


class InterviewStateMachine:
    """Tracks which phase of the interview we are in."""

    def __init__(self) -> None:
        self._index = 0

    @property
    def current_phase(self) -> InterviewPhase:
        return _PHASE_ORDER[self._index]

    @property
    def is_final_phase(self) -> bool:
        return self._index >= len(_PHASE_ORDER) - 1

    def advance(self) -> InterviewPhase:
        """Move to the next phase. Returns the new current phase.

        If already on the final phase, stays there.
        """
        if self._index < len(_PHASE_ORDER) - 1:
            self._index += 1
        return self.current_phase
