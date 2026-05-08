import asyncio
import json
import time
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
        max_retries: int = 3,
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

        # Retry logic with exponential backoff
        for attempt in range(max_retries):
            try:
                data = await asyncio.to_thread(self._post_json, headers, payload)
                content = data.get("choices", [{}])[0].get("message", {}).get("content")
                if not content:
                    raise ValueError(f"empty llm response: {json.dumps(data)[:500]}")
                return LLMResponse(text=content)
            except Exception as e:
                error_str = str(e).lower()
                is_retryable = (
                    "429" in error_str or 
                    "rate limit" in error_str or 
                    "timeout" in error_str or 
                    "connection" in error_str or
                    "resource" in error_str
                )
                
                if is_retryable and attempt < max_retries - 1:
                    delay = 2 ** attempt * 1  # Exponential backoff: 1s, 2s, 4s
                    print(f"[LLM Client] Retry {attempt + 1}/{max_retries} after {delay}s delay. Error: {str(e)[:100]}")
                    await asyncio.sleep(delay)
                    continue
                else:
                    raise

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
