import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

for i in range(1, 5):
    key_name = "GEMINI_API_KEY" if i == 1 else f"GEMINI_API_KEY{i}"
    key = os.environ.get(key_name)
    if not key:
        print(f"{key_name} not found")
        continue

    print(f"Testing {key_name}: {key[:10]}...")
    client = genai.Client(api_key=key)
    try:
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents='hello'
        )
        print("Success:", response.text.replace("\n", " "))
    except Exception as e:
        print("Error:", str(e))
