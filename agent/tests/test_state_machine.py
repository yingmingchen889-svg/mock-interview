"""Tests for the interview state machine."""

import sys
import os

# Allow imports from the agent package root
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from state_machine import InterviewPhase, InterviewStateMachine


class TestInterviewPhase:
    def test_phase_values(self) -> None:
        assert InterviewPhase.INTRO == "INTRO"
        assert InterviewPhase.TECHNICAL == "TECHNICAL"
        assert InterviewPhase.BEHAVIORAL == "BEHAVIORAL"
        assert InterviewPhase.QA == "QA"

    def test_phase_is_str(self) -> None:
        assert isinstance(InterviewPhase.INTRO, str)


class TestInterviewStateMachine:
    def test_initial_phase_is_intro(self) -> None:
        sm = InterviewStateMachine()
        assert sm.current_phase == InterviewPhase.INTRO

    def test_advance_moves_through_all_phases(self) -> None:
        sm = InterviewStateMachine()
        expected = [
            InterviewPhase.TECHNICAL,
            InterviewPhase.BEHAVIORAL,
            InterviewPhase.QA,
        ]
        for phase in expected:
            result = sm.advance()
            assert result == phase

    def test_is_final_phase(self) -> None:
        sm = InterviewStateMachine()
        assert not sm.is_final_phase
        sm.advance()  # TECHNICAL
        assert not sm.is_final_phase
        sm.advance()  # BEHAVIORAL
        assert not sm.is_final_phase
        sm.advance()  # QA
        assert sm.is_final_phase

    def test_advance_past_final_stays_on_final(self) -> None:
        sm = InterviewStateMachine()
        sm.advance()  # TECHNICAL
        sm.advance()  # BEHAVIORAL
        sm.advance()  # QA
        result = sm.advance()  # should stay QA
        assert result == InterviewPhase.QA
        assert sm.is_final_phase

    def test_multiple_advances_past_end(self) -> None:
        sm = InterviewStateMachine()
        for _ in range(10):
            sm.advance()
        assert sm.current_phase == InterviewPhase.QA
