import asyncio
import json
from dataclasses import dataclass
from urllib import request, error

import config


@dataclass
class LLMResponse:
    text: str


class LLMClient:
    def __init__(self, api_keys: list[str] | None = None, models: list[str] | None = None):
        if config.LLM_PROVIDER != "nvidia":
            raise ValueError(f"Unsupported LLM provider: {config.LLM_PROVIDER}")

        self.api_keys = [key for key in (api_keys or config.NVIDIA_API_KEYS) if key]
        self.models = models or config.NVIDIA_MODELS
        if not self.api_keys:
            raise ValueError("No NVIDIA API keys configured.")

    def model_for_index(self, index: int) -> str:
        if self.models:
            return self.models[index % len(self.models)]
        return "moonshotai/kimi-k2-thinking"

    async def generate(
        self,
        api_key: str,
        model: str,
        system_prompt: str,
        user_prompt: str,
        temperature: float,
        max_tokens: int = 4096,
    ) -> LLMResponse:
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": temperature,
            "top_p": 0.95,
            "max_tokens": max_tokens,
            "stream": False,
        }
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        data = await asyncio.to_thread(self._post_json, headers, payload)
        content = data.get("choices", [{}])[0].get("message", {}).get("content")
        if not content:
            raise ValueError(f"empty llm response: {json.dumps(data)[:500]}")
        return LLMResponse(text=content)

    def _post_json(self, headers: dict, payload: dict) -> dict:
        req = request.Request(
            f"{config.NVIDIA_BASE_URL}/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST",
        )
        try:
            with request.urlopen(req, timeout=60) as response:
                return json.loads(response.read().decode("utf-8"))
        except error.HTTPError as exc:
            details = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"{exc.code} {details[:800]}") from exc

    def generate_sync(
        self,
        api_key: str,
        model: str,
        system_prompt: str,
        user_prompt: str,
        temperature: float,
        max_tokens: int = 4096,
    ) -> LLMResponse:
        return asyncio.run(
            self.generate(api_key, model, system_prompt, user_prompt, temperature, max_tokens)
        )
