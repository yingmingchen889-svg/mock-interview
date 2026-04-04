"""Tests for the transcript store."""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from transcript_store import TranscriptStore, TranscriptEntry
from state_machine import InterviewPhase


class TestTranscriptEntry:
    def test_defaults(self) -> None:
        entry = TranscriptEntry(role="agent", content="hello", phase="INTRO")
        assert entry.role == "agent"
        assert entry.content == "hello"
        assert entry.phase == "INTRO"
        assert entry.timestamp > 0
        assert entry.question_index is None


class TestTranscriptStore:
    def test_empty_store(self) -> None:
        store = TranscriptStore("test-id")
        assert store.entries == []
        assert store.question_count == 0

    def test_add_agent_message(self) -> None:
        store = TranscriptStore("test-id")
        store.add_agent_message("Welcome!", InterviewPhase.INTRO)
        assert len(store.entries) == 1
        assert store.entries[0].role == "agent"
        assert store.entries[0].content == "Welcome!"
        assert store.entries[0].phase == "INTRO"

    def test_add_user_message(self) -> None:
        store = TranscriptStore("test-id")
        store.add_user_message("Thank you", InterviewPhase.INTRO)
        assert len(store.entries) == 1
        assert store.entries[0].role == "user"

    def test_increment_question(self) -> None:
        store = TranscriptStore("test-id")
        assert store.question_count == 0
        result = store.increment_question()
        assert result == 1
        assert store.question_count == 1

    def test_conversation_history_format(self) -> None:
        store = TranscriptStore("test-id")
        store.add_agent_message("Hi there", InterviewPhase.INTRO)
        store.add_user_message("Hello", InterviewPhase.INTRO)
        store.add_agent_message("Let's begin", InterviewPhase.TECHNICAL)

        history = store.conversation_history()
        assert len(history) == 3
        assert history[0] == {"role": "assistant", "content": "Hi there"}
        assert history[1] == {"role": "user", "content": "Hello"}
        assert history[2] == {"role": "assistant", "content": "Let's begin"}

    def test_to_api_payload(self) -> None:
        store = TranscriptStore("interview-123")
        store.add_agent_message("Welcome", InterviewPhase.INTRO)
        store.increment_question()
        store.add_user_message("Thanks", InterviewPhase.INTRO)

        payload = store.to_api_payload()
        assert payload["interviewId"] == "interview-123"
        assert payload["questionCount"] == 1
        assert len(payload["entries"]) == 2
        assert payload["entries"][0]["role"] == "agent"
        assert payload["entries"][1]["role"] == "user"

    def test_entries_returns_copy(self) -> None:
        store = TranscriptStore("test-id")
        store.add_agent_message("msg", InterviewPhase.INTRO)
        entries = store.entries
        entries.clear()
        # Original should be unaffected
        assert len(store.entries) == 1
