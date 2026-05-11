import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from core.multi_provider_client import create_mixed_provider_client


async def main():
    client = create_mixed_provider_client()
    seen = []
    for index, provider in enumerate(client.providers):
        identity = (provider.get("provider"), provider.get("model"), provider.get("base_url", ""))
        if identity in seen:
            continue
        seen.append(identity)
        try:
            response = await asyncio.wait_for(
                client.generate(
                    provider_index=index,
                    system_prompt="Return only plain text.",
                    user_prompt="Reply with exactly: ok",
                    temperature=0,
                    max_tokens=512,
                ),
                timeout=25,
            )
            print(f"OK {index}: {provider.get('provider')} / {provider.get('model')} -> {response.text[:120]!r}")
        except Exception as exc:
            print(f"FAIL {index}: {provider.get('provider')} / {provider.get('model')} -> {str(exc)[:300]}")


if __name__ == "__main__":
    asyncio.run(main())
