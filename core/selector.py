import json
import time
import config
from core.llm_client import LLMClient


class MetaAgent:
    """
    ai-powered governance routing agent.
    analyzes questions using llm reasoning to decide debate vs vote,
    then logs its decision rationale on-chain for auditability.
    """

    SYSTEM_PROMPT = (
        "You are a Governance Routing Agent for a multi-agent coordination system. "
        "Your job is to analyze incoming questions and decide the optimal deliberation mechanism.\n\n"
        "MECHANISMS:\n"
        "- DEBATE: Multi-round deliberation where agents exchange opinions and can change positions. "
        "Use for complex, ethical, strategic, multi-stakeholder, or subjective questions. "
        "Also use for questions involving risk assessment, security audits, or deployment decisions.\n"
        "- VOTE: Independent parallel voting where each agent answers without seeing others. "
        "Use for factual, binary, low-stakes, or questions with clear objective answers.\n\n"
        "Respond ONLY with valid JSON, no markdown blocks:\n"
        '{"mechanism": "debate" or "vote", "confidence": 0.0-1.0, '
        '"reasoning": "2-3 sentence explanation of why this mechanism is appropriate"}'
    )

    def __init__(self, api_key: str = None):
        self.api_key = api_key if api_key else config.API_KEYS[0]
        self.llm = LLMClient(api_keys=config.API_KEYS)

    def analyze(self, question: str, num_agents: int = None) -> dict:
        """
        analyze a question and decide mechanism via llm reasoning.
        returns: {"mechanism": str, "reasoning": str, "confidence": float, "source": str}
        """
        if num_agents is None:
            num_agents = config.NUM_AGENTS

        # hard constraint: not enough agents for debate
        if num_agents < 3:
            return {
                "mechanism": "vote",
                "reasoning": f"Insufficient agents for debate ({num_agents} < 3). Defaulting to vote.",
                "confidence": 1.0,
                "source": "constraint"
            }

        # try ai-powered analysis
        try:
            return self._ai_decide(question)
        except Exception as e:
            masked = f"...{self.api_key[-4:]}" if hasattr(self, 'api_key') and self.api_key else "unknown"
            err_msg = f"API Error (key {masked}): {str(e)[:100]}"
            print(f"  [meta-agent] {err_msg}")
            
            # no fallback - fail if api is unavailable
            return {
                "mechanism": "vote",
                "reasoning": f"API Error: {err_msg}. Cannot determine mechanism without AI.",
                "confidence": 0.0,
                "source": "error"
            }

    def _ai_decide(self, question: str) -> dict:
        """use the configured llm to reason about the question and pick a mechanism."""
        prompt = (
            f"Analyze this question and decide the optimal deliberation mechanism:\n\n"
            f'Question: "{question}"\n\n'
            f"Return your decision as JSON."
        )

        # retry logic for rate limits
        for attempt in range(3):
            try:
                response = self.llm.generate_sync(
                    api_key=self.api_key,
                    model=self.llm.model_for_index(0),
                    system_prompt=self.SYSTEM_PROMPT,
                    user_prompt=prompt,
                    temperature=0.3,
                )

                # parse json from response
                text = response.text
                start = text.find('{')
                end = text.rfind('}')
                if start != -1 and end != -1:
                    result = json.loads(text[start:end + 1])
                    return {
                        "mechanism": result.get("mechanism", "vote").lower(),
                        "reasoning": result.get("reasoning", "No reasoning provided."),
                        "confidence": float(result.get("confidence", 0.8)),
                        "source": "ai"
                    }

                raise ValueError("failed to parse json from meta-agent response")

            except Exception as e:
                error_str = str(e).lower()
                is_retryable = "429" in error_str or "rate limit" in error_str or "quota" in error_str or "timeout" in error_str or "timed out" in error_str
                if is_retryable and attempt < 2:
                    delay = 10 * (2 ** attempt)
                    print(f"  [meta-agent] transient api error, waiting {delay}s (attempt {attempt + 1}/3)...")
                    time.sleep(delay)
                    continue
                raise


def decide_mechanism(question: str, num_agents: int = None) -> tuple[str, str]:
    """
    backward-compatible wrapper for the meta-agent.
    returns: (mechanism_name, reason_string)
    """
    meta = MetaAgent()
    result = meta.analyze(question, num_agents)
    return result["mechanism"], result["reasoning"]
