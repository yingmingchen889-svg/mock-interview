import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    LIVEKIT_URL: str = os.environ.get("LIVEKIT_URL", "")
    LIVEKIT_API_KEY: str = os.environ.get("LIVEKIT_API_KEY", "")
    LIVEKIT_API_SECRET: str = os.environ.get("LIVEKIT_API_SECRET", "")
    DEEPGRAM_API_KEY: str = os.environ.get("DEEPGRAM_API_KEY", "")
    OPENAI_API_KEY: str = os.environ.get("OPENAI_API_KEY", "")
    DEEPSEEK_API_KEY: str = os.environ.get("DEEPSEEK_API_KEY", "")
    ANTHROPIC_API_KEY: str = os.environ.get("ANTHROPIC_API_KEY", "")
    ELEVENLABS_API_KEY: str = os.environ.get("ELEVENLABS_API_KEY", "")
    NEXT_API_URL: str = os.environ.get("NEXT_API_URL", "http://localhost:3000")
    AGENT_API_SECRET: str = os.environ.get("AGENT_API_SECRET", "dev-secret")
