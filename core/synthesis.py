import json
import config
from core.llm_client import LLMClient

class SynthesisAgent:
    """
    Final stage agent that analyzes a non-consensus debate 
    and provides a summarized compromise or 'majority view' report.
    """
    
    SYSTEM_PROMPT = (
        "You are a Consensus Synthesis Agent. Your role is to analyze a debate between AI agents "
        "that failed to reach a full quorum. You must summarize the main points of agreement and "
        "the core reasons for disagreement. Finally, propose a 'Middle Path' or a 'Majority Synthesis'.\n\n"
        "Respond ONLY with valid JSON:\n"
        '{"summary": "2-3 sentence overview", '
        '"agreement": ["point 1", "point 2"], '
        '"disagreement": ["point 1", "point 2"], '
        '"synthesis": "Final recommended course of action based on the debate"}'
    )

    def __init__(self, api_key: str = None):
        self.api_key = api_key if api_key else config.NVIDIA_API_KEYS[0]
        self.llm = LLMClient(api_keys=config.NVIDIA_API_KEYS)

    def synthesize(self, question: str, rounds: list) -> dict:
        """Analyze the full debate history and synthesize a final report."""
        debate_text = f"Question: {question}\n\nDebate History:\n"
        
        for r in rounds:
            debate_text += f"\n--- Round {r['round']} ---\n"
            for resp in r['responses']:
                debate_text += f"Agent {resp['name']} ({resp['persona']}): {resp['response']['answer']}\n"
                debate_text += f"Reasoning: {resp['response']['reasoning']}\n"

        prompt = f"Please synthesize this debate history into a final consensus report:\n\n{debate_text}"

        try:
            response = self.llm.generate_sync(
                api_key=self.api_key,
                model=self.llm.model_for_index(0),
                system_prompt=self.SYSTEM_PROMPT,
                user_prompt=prompt,
                temperature=0.4,
            )
            
            text = response.text
            start = text.find('{')
            end = text.rfind('}')
            if start != -1 and end != -1:
                return json.loads(text[start:end+1])
            return {"summary": "Failed to parse synthesis.", "synthesis": "Inconclusive debate."}
            
        except Exception as e:
            return {"summary": f"Synthesis error: {str(e)}", "synthesis": "Error during processing."}
