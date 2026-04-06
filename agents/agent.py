import os
import json
import anthropic
import config

class Agent:
    PERSONAS = {
        "Analyst": "You are an Analyst. You focus on data, logic, and factual accuracy. Break problems down systematically.",
        "Critic": "You are a Critic. Your role is to find flaws, edge cases, and weaknesses in proposed ideas or peer opinions.",
        "Advocate": "You are an Advocate. Your role is to find the most optimistic and beneficial aspects of ideas, supporting them constructively.",
        "Skeptic": "You are a Skeptic. You question assumptions deeply and require high evidence thresholds before agreeing with any conclusion."
    }

    def __init__(self, name: str, persona_type: str):
        if persona_type not in self.PERSONAS:
            raise ValueError(f"Unknown persona type: {persona_type}")
        self.name = name
        self.persona_type = persona_type
        self.system_prompt = self.PERSONAS[persona_type]
        self.client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)

    def generate_response(self, question: str, context: str = "", peer_opinions: list = None) -> dict:
        """
        Generate a structured response given the question, context, and peer opinions.
        Returns a dict: {"answer": str, "confidence": float, "reasoning": str}
        """
        # Construct the user message
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

        user_content += """
Please provide your response strictly in the following JSON format without any markdown blocks or extra text:
{
    "answer": "Your final concise answer",
    "confidence": 0.95,
    "reasoning": "Step-by-step reasoning explaining how you arrived at this answer based on your persona."
}
"""

        try:
            response = self.client.messages.create(
                model=config.MODEL,
                max_tokens=1024,
                system=self.system_prompt,
                messages=[
                    {"role": "user", "content": user_content}
                ]
            )
            
            # Parse response text
            # The model is instructed to output plain JSON, but we'll try to extract it safely
            response_text = response.content[0].text
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}')
            
            if start_idx != -1 and end_idx != -1:
                json_str = response_text[start_idx:end_idx+1]
                return json.loads(json_str)
            else:
                return {
                    "answer": "Error parsing output",
                    "confidence": 0.0,
                    "reasoning": "Failed to parse json."
                }
        except Exception as e:
            # Handle API errors with a fallback response
            return {
                "answer": "API Error",
                "confidence": 0.0,
                "reasoning": str(e)
            }
