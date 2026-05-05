import os
import json
import time
import asyncio
from google import genai
from google.genai import types
import config

# max retries for api calls
MAX_RETRIES = 5
BASE_RETRY_DELAY = 15


class Agent:
    PERSONAS = {
        "Analyst": "You are an Analyst. You focus on data, logic, and factual accuracy. Break problems down systematically. If you see contradictions in peer data, point them out.",
        "Critic": "You are a Critic. Your role is to find flaws, edge cases, and weaknesses in proposed ideas or peer opinions. Be rigorous but constructive.",
        "Advocate": "You are an Advocate. Your role is to find the most optimistic and beneficial aspects of ideas, supporting them constructively. Try to build bridges between disagreeing agents.",
        "Skeptic": "You are a Skeptic. You question assumptions deeply and require high evidence thresholds before agreeing. You should remain cautious until at least round 2."
    }

    def __init__(self, name: str, persona_type: str, api_keys: list[str] = None, api_key: str = None, on_retry: callable = None):
        if persona_type not in self.PERSONAS:
            raise ValueError(f"Unknown persona type: {persona_type}")
        self.name = name
        self.persona_type = persona_type
        self.system_prompt = self.PERSONAS[persona_type]
        self.on_retry = on_retry
        
        self.api_keys = api_keys or ([api_key] if api_key else config.GEMINI_API_KEYS)
        self.current_key_index = 0
        self._init_client()

    def _init_client(self):
        """initialize the genai client with the current key."""
        key = self.api_keys[self.current_key_index % len(self.api_keys)]
        self.client = genai.Client(api_key=key)

    def _rotate_key(self):
        """switch to the next available key in the pool."""
        self.current_key_index += 1
        self._init_client()
        print(f"    [failover] {self.name} rotating to key #{self.current_key_index % len(self.api_keys) + 1}")

    def _build_prompt(self, question: str, context: str = "", peer_opinions: list = None) -> str:
        """build the user prompt from question, context, and peer opinions."""
        user_content = f"Question: {question}\n\n"
        if context:
            user_content += f"Context: {context}\n\n"

        if peer_opinions and len(peer_opinions) > 0:
            user_content += "Here are the most recent perspectives from the swarm:\n"
            recent_opinions = peer_opinions[-6:] 
            for op in recent_opinions:
                user_content += f"--- {op['name']} ({op['persona']}) ---\n"
                user_content += f"Answer: {op['response']['answer']}\n"
                user_content += f"Reasoning: {op['response']['reasoning']}\n\n"
            user_content += "Critically evaluate these perspectives. If you agree with a peer, explain why. If you disagree, provide a logical counter-argument.\n\n"

        user_content += (
            "Please provide your response strictly in the following JSON format "
            "without any markdown blocks or extra text:\n"
            "{\n"
            '    "answer": "Your final concise answer",\n'
            '    "confidence": 0.95,\n'
            '    "reasoning": "Step-by-step reasoning explaining how you arrived '
            'at this answer based on your persona."\n'
            "}\n"
        )
        return user_content

    def _parse_response(self, response_text: str) -> dict:
        """safely extract json from model response text."""
        start_idx = response_text.find('{')
        end_idx = response_text.rfind('}')

        if start_idx != -1 and end_idx != -1:
            json_str = response_text[start_idx:end_idx + 1]
            return json.loads(json_str)

        return {
            "answer": "Error parsing output",
            "confidence": 0.0,
            "reasoning": "Failed to parse json from model response."
        }

    async def generate_response(self, question: str, context: str = "", peer_opinions: list = None) -> dict:
        """
        generate a structured response given the question, context, and peer opinions.
        includes retry logic with exponential backoff for rate limits.
        returns a dict: {"answer": str, "confidence": float, "reasoning": str}
        """
        user_content = self._build_prompt(question, context, peer_opinions)

        for attempt in range(MAX_RETRIES):
            try:
                response = await asyncio.wait_for(
                    self.client.aio.models.generate_content(
                        model=config.MODEL,
                        contents=user_content,
                        config=types.GenerateContentConfig(
                            system_instruction=self.system_prompt,
                            temperature=0.7,
                        ),
                    ),
                    timeout=20.0
                )
                return self._parse_response(response.text)

            except Exception as e:
                error_str = str(e).lower()
                is_retryable = "429" in error_str or "resource" in error_str or "rate" in error_str or "quota" in error_str or "timeout" in error_str

                if is_retryable:
                    if attempt < len(self.api_keys):
                        self._rotate_key()
                        if self.on_retry:
                            self.on_retry(self.name, attempt + 1, 0)
                        continue 
                    
                    if attempt < MAX_RETRIES - 1:
                        delay = BASE_RETRY_DELAY * (2 ** (attempt - len(self.api_keys) + 1))
                        print(f"    [retry] {self.name} pool exhausted, waiting {delay}s (attempt {attempt + 1}/{MAX_RETRIES})...")
                        
                        if self.on_retry:
                            self.on_retry(self.name, attempt + 1, delay)
                            
                        await asyncio.sleep(delay)
                        continue
                    
                # non-retryable or exhausted retries
                masked_key = f"...{self.api_keys[self.current_key_index % len(self.api_keys)][-4:]}"
                return {
                    "answer": "API Error",
                    "confidence": 0.0,
                    "reasoning": f"Failed using key {masked_key}. Error details: {str(e)}"
                }

    def generate_response_sync(self, question: str, context: str = "", peer_opinions: list = None) -> dict:
        """run the async generator from synchronous cli code."""
        return asyncio.run(self.generate_response(question, context, peer_opinions))
