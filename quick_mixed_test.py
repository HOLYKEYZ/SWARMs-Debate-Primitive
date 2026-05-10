"""Quick test of mixed providers"""
import asyncio
from core.multi_provider_client import create_mixed_provider_client

async def main():
    client = create_mixed_provider_client()
    
    print(f"Configured providers: {len(client.providers)}")
    for i, p in enumerate(client.providers):
        print(f"  {i}: {p['provider']} - {p['model']}")
    
    print("\nTesting each provider:")
    for i in range(len(client.providers)):
        provider = client.providers[i]
        print(f"\n{i+1}. {provider['provider']} ({provider['model']})")
        try:
            response = await client.generate(
                provider_index=i,
                system_prompt="You are helpful.",
                user_prompt="What is 2+2? Answer in 3 words max.",
                temperature=0.7,
                max_tokens=50,
            )
            print(f"   ✅ {response.text[:50]}")
        except Exception as e:
            print(f"   ❌ {str(e)[:100]}")

if __name__ == "__main__":
    asyncio.run(main())
