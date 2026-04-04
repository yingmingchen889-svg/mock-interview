"""Entry point for the mock-interview voice agent.

Run with:
    python main.py dev
"""

from livekit.agents import WorkerOptions, cli

from interview_agent import entrypoint


def main() -> None:
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
        )
    )


if __name__ == "__main__":
    main()
