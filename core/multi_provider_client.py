"""
Multi-provider LLM client supporting NVIDIA NIM, Google Gemini, and Groq
"""
import asyncio
import json
import os
from dataclasses import dataclass
from urllib import request, error
from typing import Literal

import config


@dataclass
class LLMResponse:
    text: str


class MultiProviderClient:
    """LLM client that supports multiple providers (NVIDIA, Gemini, Groq)"""
    
    def __init__(self, provider_configs: list[dict]):
        """
        provider_configs: list of dicts with keys:
            - provider: "nvidia" or "gemini" or "groq"
            - api_key: str
            - model: str
        """
        self.providers = provider_configs
        
    async def generate(
        self,
        provider_index: int,
        system_prompt: str,
        user_prompt: str,
        temperature: float,
        max_tokens: int = 4096,
    ) -> LLMResponse:
        """Generate response using the specified provider"""
        provider_config = self.providers[provider_index % len(self.providers)]
        provider = provider_config["provider"]
        
        if provider == "nvidia":
            return await self._generate_nvidia(
                api_key=provider_config["api_key"],
                model=provider_config["model"],
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=temperature,
                max_tokens=max_tokens,
            )
        elif provider == "gemini":
            return await self._generate_gemini(
                api_key=provider_config["api_key"],
                model=provider_config["model"],
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=temperature,
                max_tokens=max_tokens,
            )
        elif provider == "groq":
            return await self._generate_groq(
                api_key=provider_config["api_key"],
                model=provider_config["model"],
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=temperature,
                max_tokens=max_tokens,
            )
        else:
            raise ValueError(f"Unsupported provider: {provider}")
    
    async def _generate_nvidia(
        self,
        api_key: str,
        model: str,
        system_prompt: str,
        user_prompt: str,
        temperature: float,
        max_tokens: int,
    ) -> LLMResponse:
        """Generate using NVIDIA NIM"""
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

        data = await asyncio.to_thread(self._post_json_nvidia, headers, payload)
        content = data.get("choices", [{}])[0].get("message", {}).get("content")
        if not content:
            raise ValueError(f"empty llm response: {json.dumps(data)[:500]}")
        return LLMResponse(text=content)
    
    async def _generate_gemini(
        self,
        api_key: str,
        model: str,
        system_prompt: str,
        user_prompt: str,
        temperature: float,
        max_tokens: int,
    ) -> LLMResponse:
        """Generate using Google Gemini"""
        # Combine system and user prompts for Gemini
        combined_prompt = f"{system_prompt}\n\n{user_prompt}"
        
        payload = {
            "contents": [{
                "parts": [{"text": combined_prompt}]
            }],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
                "topP": 0.95,
            }
        }
        
        headers = {
            "Content-Type": "application/json",
        }
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        
        data = await asyncio.to_thread(self._post_json_gemini, url, headers, payload)
        
        try:
            content = data["candidates"][0]["content"]["parts"][0]["text"]
            return LLMResponse(text=content)
        except (KeyError, IndexError) as e:
            raise ValueError(f"Invalid Gemini response: {json.dumps(data)[:500]}") from e
    
    def _post_json_nvidia(self, headers: dict, payload: dict) -> dict:
        """POST to NVIDIA NIM API"""
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
    
    def _post_json_gemini(self, url: str, headers: dict, payload: dict) -> dict:
        """POST to Gemini API"""
        req = request.Request(
            url,
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
    
    async def _generate_groq(
        self,
        api_key: str,
        model: str,
        system_prompt: str,
        user_prompt: str,
        temperature: float,
        max_tokens: int,
    ) -> LLMResponse:
        """Generate using Groq"""
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        data = await asyncio.to_thread(self._post_json_groq, headers, payload)
        content = data.get("choices", [{}])[0].get("message", {}).get("content")
        if not content:
            raise ValueError(f"empty llm response: {json.dumps(data)[:500]}")
        return LLMResponse(text=content)
    
    def _post_json_groq(self, headers: dict, payload: dict) -> dict:
        """POST to Groq API"""
        req = request.Request(
            "https://api.groq.com/openai/v1/chat/completions",
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


def create_mixed_provider_client() -> MultiProviderClient:
    """
    Create a client with mixed providers:
    - Agents 1-2: NVIDIA
    - Agents 3-4: Gemini
    - Fallback: Groq (if others fail)
    """
    providers = []
    
    # Agent 1: NVIDIA
    nvidia_key1 = os.getenv("NVIDIA_API_KEY")
    nvidia_model1 = os.getenv("NVIDIA_MODEL", "moonshotai/kimi-k2.6")
    if nvidia_key1:
        providers.append({
            "provider": "nvidia",
            "api_key": nvidia_key1,
            "model": nvidia_model1,
        })
    
    # Agent 2: NVIDIA
    nvidia_key2 = os.getenv("NVIDIA_API_KEY2", nvidia_key1)
    nvidia_model2 = os.getenv("NVIDIA_MODEL2", nvidia_model1)
    if nvidia_key2:
        providers.append({
            "provider": "nvidia",
            "api_key": nvidia_key2,
            "model": nvidia_model2,
        })
    
    # Agent 3: Gemini
    gemini_key1 = os.getenv("GEMINI_API_KEY")
    gemini_model1 = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    if gemini_key1:
        providers.append({
            "provider": "gemini",
            "api_key": gemini_key1,
            "model": gemini_model1,
        })
    
    # Agent 4: Gemini
    gemini_key2 = os.getenv("GEMINI_API_KEY2", gemini_key1)
    gemini_model2 = os.getenv("GEMINI_MODEL2", gemini_model1)
    if gemini_key2:
        providers.append({
            "provider": "gemini",
            "api_key": gemini_key2,
            "model": gemini_model2,
        })
    
    # Fallback: Groq for all 4 agents (if configured)
    groq_key = os.getenv("GROQ_API_KEY")
    groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    if groq_key:
        # Add Groq 4 times (one fallback per agent)
        for _ in range(4):
            providers.append({
                "provider": "groq",
                "api_key": groq_key,
                "model": groq_model,
            })
    
    if not providers:
        raise ValueError("No API keys configured for any provider")
    
    return MultiProviderClient(providers)
