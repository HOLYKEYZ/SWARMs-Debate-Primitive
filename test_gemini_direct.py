"""Direct test of Gemini API"""
import json
import os
from urllib import request
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
model = "gemini-2.5-flash"

print(f"Testing Gemini API")
print(f"Key: ...{api_key[-4:]}")
print(f"Model: {model}")

payload = {
    "contents": [{
        "parts": [{"text": "What is 2+2? Answer in one sentence."}]
    }],
    "generationConfig": {
        "temperature": 0.7,
        "maxOutputTokens": 100,
    }
}

url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

req = request.Request(
    url,
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"},
    method="POST",
)

try:
    with request.urlopen(req, timeout=30) as response:
        data = json.loads(response.read().decode("utf-8"))
        print("\n✅ SUCCESS")
        print(json.dumps(data, indent=2))
except Exception as e:
    print(f"\n❌ FAILED")
    print(f"Error: {e}")
    if hasattr(e, 'read'):
        print(f"Details: {e.read().decode('utf-8')}")
