import os
import json
import time
from google import genai
from google.genai import types
import config

# max retries for api calls
MAX_RETRIES = 5
BASE_RETRY_DELAY = 15


class Agent:
    PERSONAS = {
        "Analyst": "You are an Analyst. You focus on data, logic, and factual accuracy. Break problems down systematically.",
        "Critic": "You are a Critic. Your role is to find flaws, edge cases, and weaknesses in proposed ideas or peer opinions.",
        "Advocate": "You are an Advocate. Your role is to find the most optimistic and beneficial aspects of ideas, supporting them constructively.",
        "Skeptic": "You are a Skeptic. You question assumptions deeply and require high evidence thresholds before agreeing with any conclusion."
    }

    def __init__(self, name: str, persona_type: str, api_key: str = None):
        if persona_type not in self.PERSONAS:
            raise ValueError(f"Unknown persona type: {persona_type}")
        self.name = name
        self.persona_type = persona_type
        self.system_prompt = self.PERSONAS[persona_type]
        
        # Use provided key, or fallback to the first key in config
        key_to_use = api_key if api_key else config.GEMINI_API_KEYS[0]
        self.client = genai.Client(api_key=key_to_use)

    def _build_prompt(self, question: str, context: str = "", peer_opinions: list = None) -> str:
        """build the user prompt from question, context, and peer opinions."""
        user_content = f"Question: {question}\n\n"
        if context:
            user_content += f"Context: {context}\n\n"

        if peer_opinions and len(peer_opinions) > 0:
            user_content += "Here are the recent opinions from other agents:\n"
            for op in peer_opinions:
                user_content += f"--- {op['name']} ({op['persona']}) ---\n"
                user_content += f"Answer: {op['response']['answer']}\n"
                user_content += f"Reasoning: {op['response']['reasoning']}\n\n"
            user_content += "Use these opinions carefully to formulate or revise your answer.\n\n"

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

    def generate_response(self, question: str, context: str = "", peer_opinions: list = None) -> dict:
        """
        generate a structured response given the question, context, and peer opinions.
        includes retry logic with exponential backoff for rate limits.
        returns a dict: {"answer": str, "confidence": float, "reasoning": str}
        """
        user_content = self._build_prompt(question, context, peer_opinions)

        for attempt in range(MAX_RETRIES):
            try:
                response = self.client.models.generate_content(
                    model=config.MODEL,
                    contents=user_content,
                    config=types.GenerateContentConfig(
                        system_instruction=self.system_prompt,
                        temperature=0.7,
                    ),
                )
                return self._parse_response(response.text)

            except Exception as e:
                error_str = str(e).lower()
                is_retryable = "429" in error_str or "resource" in error_str or "rate" in error_str or "quota" in error_str
                if is_retryable and attempt < MAX_RETRIES - 1:
                    delay = BASE_RETRY_DELAY * (2 ** attempt)
                    print(f"    [error details] {str(e)[:100]}...")
                    print(f"    [retry] {self.name} hit rate limit, waiting {delay}s "
                          f"(attempt {attempt + 1}/{MAX_RETRIES})...")
                    time.sleep(delay)
                    continue
                # non-retryable or exhausted retries
                return {
                    "answer": "API Error",
                    "confidence": 0.0,
                    "reasoning": str(e)
                }
