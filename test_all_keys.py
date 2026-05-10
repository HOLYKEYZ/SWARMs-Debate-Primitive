"""
Smoke test all configured API keys and models
"""
import asyncio
import os
from dotenv import load_dotenv
from core.llm_client import LLMClient

load_dotenv()

async def test_nvidia_key(key: str, model: str, key_name: str):
    """Test a single NVIDIA key with a model"""
    print(f"\n{'='*60}")
    print(f"Testing {key_name}")
    print(f"Key: ...{key[-4:]}")
    print(f"Model: {model}")
    print(f"{'='*60}")
    
    client = LLMClient(api_keys=[key])
    
    try:
        response = await asyncio.wait_for(
            client.generate(
                api_key=key,
                model=model,
                system_prompt="You are a helpful assistant.",
                user_prompt="What is 2+2? Answer in one sentence.",
                temperature=0.7,
            ),
            timeout=30.0
        )
        print(f"✅ SUCCESS")
        print(f"Response: {response.text[:200]}")
        return True
    except Exception as e:
        print(f"❌ FAILED")
        print(f"Error: {str(e)[:300]}")
        return False

async def test_gemini_key(key: str, key_name: str):
    """Test a Gemini key"""
    print(f"\n{'='*60}")
    print(f"Testing {key_name}")
    print(f"Key: ...{key[-4:]}")
    print(f"Provider: Google Gemini")
    print(f"{'='*60}")
    
    try:
        import google.generativeai as genai
        genai.configure(api_key=key)
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content("What is 2+2? Answer in one sentence.")
        print(f"✅ SUCCESS")
        print(f"Response: {response.text[:200]}")
        return True
    except Exception as e:
        print(f"❌ FAILED")
        print(f"Error: {str(e)[:300]}")
        return False

async def main():
    print("\n" + "="*60)
    print("SMOKE TEST: All API Keys and Models")
    print("="*60)
    
    results = {}
    
    # Test NVIDIA keys
    nvidia_keys = [
        (os.getenv("NVIDIA_API_KEY"), os.getenv("NVIDIA_MODEL"), "NVIDIA_API_KEY"),
        (os.getenv("NVIDIA_API_KEY2"), os.getenv("NVIDIA_MODEL2"), "NVIDIA_API_KEY2"),
        (os.getenv("NVIDIA_API_KEY3"), os.getenv("NVIDIA_MODEL3"), "NVIDIA_API_KEY3"),
        (os.getenv("NVIDIA_API_KEY4"), os.getenv("NVIDIA_MODEL4"), "NVIDIA_API_KEY4"),
    ]
    
    for key, model, name in nvidia_keys:
        if key and model:
            results[name] = await test_nvidia_key(key, model, name)
        else:
            print(f"\n⚠️  {name} not configured")
            results[name] = False
    
    # Test Gemini keys
    gemini_keys = [
        (os.getenv("GEMINI_API_KEY"), "GEMINI_API_KEY"),
        (os.getenv("GEMINI_API_KEY2"), "GEMINI_API_KEY2"),
    ]
    
    for key, name in gemini_keys:
        if key:
            results[name] = await test_gemini_key(key, name)
        else:
            print(f"\n⚠️  {name} not configured")
            results[name] = False
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    
    working_keys = [k for k, v in results.items() if v]
    failed_keys = [k for k, v in results.items() if not v]
    
    print(f"\n✅ Working keys: {len(working_keys)}")
    for key in working_keys:
        print(f"   - {key}")
    
    print(f"\n❌ Failed keys: {len(failed_keys)}")
    for key in failed_keys:
        print(f"   - {key}")
    
    print("\n" + "="*60)
    
    if len(working_keys) == 0:
        print("⚠️  NO WORKING KEYS - You are completely rate limited or keys are invalid")
    elif len(working_keys) < 4:
        print(f"⚠️  Only {len(working_keys)} working keys - Consider adding more for better throughput")
    else:
        print(f"✅ {len(working_keys)} working keys - Good for multi-agent deliberation")

if __name__ == "__main__":
    asyncio.run(main())
