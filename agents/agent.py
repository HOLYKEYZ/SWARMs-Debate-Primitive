import json
import asyncio
import config
from core.multi_provider_client import create_mixed_provider_client, MultiProviderClient

# max retries for api calls
MAX_RETRIES = 6
BASE_RETRY_DELAY = 4


class Agent:
    PERSONAS = {
        "Analyst": "You are an Analyst. You focus on data, logic, and factual accuracy. Break problems down systematically. If you see contradictions in peer data, point them out.",
        "Critic": "You are a Critic. Your role is to find flaws, edge cases, and weaknesses in proposed ideas or peer opinions. Be rigorous but constructive.",
        "Advocate": "You are an Advocate. Your role is to find the most optimistic and beneficial aspects of ideas, supporting them constructively. Try to build bridges between disagreeing agents.",
        "Skeptic": "You are a Skeptic. You question assumptions deeply and require high evidence thresholds before agreeing. You should remain cautious until at least round 2.",
        "ExploitHunter": "You are an Exploit Hunter. Your role is to red-team DAO proposals, smart contracts, treasury actions, incentives, and governance processes. Identify attack paths, abuse cases, rug-pull signals, escrow failures, and concrete mitigations before any human vote or deployment."
    }

    def __init__(self, name: str, persona_type: str, api_keys: list[str] = None, api_key: str = None, on_retry: callable = None, start_key_index: int = 0):
        if persona_type not in self.PERSONAS:
            raise ValueError(f"Unknown persona type: {persona_type}")
        self.name = name
        self.persona_type = persona_type
        self.system_prompt = self.PERSONAS[persona_type]
        self.on_retry = on_retry
        
        # Use multi-provider client
        self.llm = create_mixed_provider_client()
        self.provider_index = start_key_index
        if self.persona_type == "ExploitHunter":
            for index, provider in enumerate(self.llm.providers):
                if provider.get("role") == "exploit_hunter":
                    self.provider_index = index
                    break
        self.current_provider = self.llm.providers[self.provider_index % len(self.llm.providers)]

    def _rotate_key(self):
        """switch to the next available provider."""
        self.provider_index += 1
        self.current_provider = self.llm.providers[self.provider_index % len(self.llm.providers)]
        provider_type = self.current_provider["provider"]
        model = self.current_provider["model"]
        print(f"    [failover] {self.name} rotating to {provider_type} ({model})")

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
            user_content += (
                "Do not assume these perspectives are correct. First identify the strongest flaw, missing context, or hidden assumption in the prior answers. "
                "Then answer the original question independently. Agree with peers only if the original question and practical objective still support their answer after that critique.\n\n"
            )

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
            try:
                data = json.loads(json_str)
            except json.JSONDecodeError:
                pass
            else:
                if isinstance(data, dict) and all(k in data for k in ("answer", "confidence", "reasoning")):
                    return data

        return {
            "answer": "Error parsing output",
            "confidence": 0.0,
            "reasoning": "Failed to parse json from model response."
        }

    def _format_api_error(self, error: Exception) -> str:
        """produce a concise user-facing error from verbose provider payloads."""
        error_text = str(error)
        lower_error = error_text.lower()

        if "429" in error_text or "resource_exhausted" in lower_error or "quota" in lower_error:
            provider = self.current_provider["provider"]
            return f"{provider.upper()} API quota or rate limit was exhausted for the configured key pool. Deliberation could not complete until quota resets or fresh keys are provided."

        if "not_found" in lower_error or "404" in error_text:
            model = self.current_provider["model"]
            provider = self.current_provider["provider"]
            return f"{provider.upper()} model '{model}' is not available for the configured API key."

        return error_text[:500]

    async def generate_response(self, question: str, context: str = "", peer_opinions: list = None) -> dict:
        """
        generate a structured response given the question, context, and peer opinions.
        includes retry logic with exponential backoff for rate limits.
        returns a dict: {"answer": str, "confidence": float, "reasoning": str}
        """
        user_content = self._build_prompt(question, context, peer_opinions)

        total_attempts = max(MAX_RETRIES, len(self.llm.providers))
        for attempt in range(total_attempts):
            try:
                response = await asyncio.wait_for(
                    self.llm.generate(
                        provider_index=self.provider_index,
                        system_prompt=self.system_prompt,
                        user_prompt=user_content,
                        temperature=0.7,
                        max_tokens=4096,
                    ),
                    timeout=60.0
                )
                return self._parse_response(response.text)

            except Exception as e:
                error_str = str(e).lower()
                
                # rotate through the full provider pool without waiting
                if attempt < total_attempts - 1:
                    self._rotate_key()
                    if self.on_retry:
                        self.on_retry(self.name, attempt + 1, 0)
                    continue
                
                # exhausted all retries - return error response
                provider = self.current_provider["provider"]
                key = self.current_provider["api_key"]
                masked_key = f"...{key[-4:]}"
                return {
                    "answer": "API Error",
                    "confidence": 0.0,
                    "reasoning": f"Failed using {provider} key {masked_key}. {self._format_api_error(e)}"
                }

    def generate_response_sync(self, question: str, context: str = "", peer_opinions: list = None) -> dict:
        """run the async generator from synchronous cli code."""
        return asyncio.run(self.generate_response(question, context, peer_opinions))
