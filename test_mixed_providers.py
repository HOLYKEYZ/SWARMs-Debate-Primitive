"""Test mixed provider setup: 2 NVIDIA + 2 Gemini"""
import asyncio
from agents.agent import Agent

async def main():
    print("="*60)
    print("Testing Mixed Provider Setup")
    print("="*60)
    
    agents = [
        Agent("Agent_1_Analyst", "Analyst", start_key_index=0),
        Agent("Agent_2_Critic", "Critic", start_key_index=1),
        Agent("Agent_3_Advocate", "Advocate", start_key_index=2),
        Agent("Agent_4_Skeptic", "Skeptic", start_key_index=3),
    ]
    
    question = "What is 2+2?"
    
    for agent in agents:
        provider = agent.current_provider["provider"]
        model = agent.current_provider["model"]
        print(f"\n{agent.name} ({agent.persona_type})")
        print(f"  Provider: {provider}")
        print(f"  Model: {model}")
        
        try:
            response = await agent.generate_response(question, "", None)
            print(f"  ✅ SUCCESS")
            print(f"  Answer: {response['answer']}")
            print(f"  Confidence: {response['confidence']}")
            if response.get('reasoning'):
                print(f"  Reasoning: {response['reasoning'][:150]}")
        except Exception as e:
            print(f"  ❌ FAILED: {str(e)[:200]}")
    
    print("\n" + "="*60)
    print("Summary:")
    print("  Agent 1-2: NVIDIA (moonshotai/kimi-k2.6)")
    print("  Agent 3-4: Gemini (gemini-1.5-flash)")
    print("="*60)

if __name__ == "__main__":
    asyncio.run(main())
