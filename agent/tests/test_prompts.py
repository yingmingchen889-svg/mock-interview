"""Tests for prompt construction."""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from prompts import build_system_prompt, get_phase_instruction, PHASE_INSTRUCTIONS
from state_machine import InterviewPhase


class TestBuildSystemPrompt:
    def test_contains_job_role(self) -> None:
        prompt = build_system_prompt(
            job_role="前端工程师",
            tech_stack="React, TypeScript",
            difficulty="medium",
        )
        assert "前端工程师" in prompt

    def test_contains_tech_stack(self) -> None:
        prompt = build_system_prompt(
            job_role="后端工程师",
            tech_stack="Go, PostgreSQL",
            difficulty="hard",
        )
        assert "Go, PostgreSQL" in prompt

    def test_difficulty_easy(self) -> None:
        prompt = build_system_prompt(
            job_role="SWE",
            tech_stack="Python",
            difficulty="easy",
        )
        assert "初级" in prompt

    def test_difficulty_hard(self) -> None:
        prompt = build_system_prompt(
            job_role="SWE",
            tech_stack="Python",
            difficulty="hard",
        )
        assert "高级" in prompt

    def test_unknown_difficulty_defaults_to_medium(self) -> None:
        prompt = build_system_prompt(
            job_role="SWE",
            tech_stack="Python",
            difficulty="unknown-level",
        )
        assert "中级" in prompt

    def test_prompt_includes_rules(self) -> None:
        prompt = build_system_prompt(
            job_role="SWE",
            tech_stack="Python",
            difficulty="medium",
        )
        assert "面试规则" in prompt


class TestGetPhaseInstruction:
    def test_all_phases_have_instructions(self) -> None:
        for phase in InterviewPhase:
            instruction = get_phase_instruction(phase)
            assert isinstance(instruction, str)
            assert len(instruction) > 10

    def test_intro_mentions_welcome(self) -> None:
        instruction = get_phase_instruction(InterviewPhase.INTRO)
        assert "欢迎" in instruction

    def test_technical_mentions_questions(self) -> None:
        instruction = get_phase_instruction(InterviewPhase.TECHNICAL)
        assert "技术" in instruction

    def test_phase_instructions_dict_complete(self) -> None:
        assert set(PHASE_INSTRUCTIONS.keys()) == set(InterviewPhase)
