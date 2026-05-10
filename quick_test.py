"""Quick test to verify API is working right now"""
import asyncio
import os
from dotenv import load_dotenv
from agents.agent import Agent

load_dotenv()

async def main():
    print("Testing NVIDIA API with Agent class...")
    
    agent = Agent(
        name="Test_Agent",
        persona_type="Analyst",
        start_key_index=0
    )
    
    try:
        response = await agent.generate_response(
            question="What is 2+2?",
            context="",
            peer_opinions=None
        )
        
        print("\n✅ SUCCESS - API is working!")
        print(f"Answer: {response.get('answer')}")
        print(f"Confidence: {response.get('confidence')}")
        print(f"Reasoning: {response.get('reasoning', '')[:100]}...")
        
    except Exception as e:
        print(f"\n❌ FAILED - API error")
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())
