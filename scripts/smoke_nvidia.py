import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import config
from core.llm_client import LLMClient


async def main():
    client = LLMClient()
    for index, api_key in enumerate(config.NVIDIA_API_KEYS):
        model = config.NVIDIA_MODELS[index]
        response = await client.generate(
            api_key,
            model,
            "Return only JSON.",
            "Return ok true as JSON.",
            0.1,
            128,
        )
        print(f"{index + 1}: {model} -> {response.text[:120]}")


if __name__ == "__main__":
    asyncio.run(main())
