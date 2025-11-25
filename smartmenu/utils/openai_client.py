"""Reusable OpenAI client helper.

Loads the API key from environment variables (or .env) on demand and lazily
instantiates the official OpenAI client. This prevents FastAPI startup crashes
when the key is missing or the module is imported before dotenv is loaded.
"""

from __future__ import annotations

import os
from functools import lru_cache

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - optional dependency
    load_dotenv = None

from openai import OpenAI

if load_dotenv:
    load_dotenv(dotenv_path=".env", override=True)


class MissingOpenAIKeyError(RuntimeError):
    """Raised when the OPENAI_API_KEY environment variable is not configured."""


def _load_api_key() -> str:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise MissingOpenAIKeyError(
            "OPENAI_API_KEY is not set. Define it in your environment or .env file."
        )
    return api_key


@lru_cache(maxsize=1)
def get_openai_client() -> OpenAI:
    """Return a cached OpenAI client configured with the current API key."""

    api_key = _load_api_key()
    return OpenAI(api_key=api_key)
