import os
import base64

try:
    from dotenv import load_dotenv
except ModuleNotFoundError:
    def load_dotenv(path: str = ".env"):
        if not os.path.exists(path):
            return
        with open(path, "r", encoding="utf-8") as env_file:
            for raw_line in env_file:
                line = raw_line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, value = line.split("=", 1)
                os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))

# Load environment variables from .env file if it exists
load_dotenv()

# Handle Railway wallet deployment (base64 encoded)
WALLET_PATH = "wallet.json"
wallet_b64 = os.getenv("WALLET_JSON_BASE64")
if wallet_b64 and not os.path.exists(WALLET_PATH):
    try:
        with open(WALLET_PATH, "wb") as f:
            f.write(base64.b64decode(wallet_b64))
        print(f"✅ Wallet decoded from WALLET_JSON_BASE64")
    except Exception as e:
        print(f"⚠️  Failed to decode wallet: {e}")

# api keys (support multiple for rotation/rate limit bypass)
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "nvidia").lower()

NVIDIA_BASE_URL = os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1").rstrip("/")
# Generic API Keys - supports any provider
API_KEYS = []
API_MODELS = []
for i in range(1, 10):
    key_name = "API_KEY" if i == 1 else f"API_KEY{i}"
    model_name = "API_MODEL" if i == 1 else f"API_MODEL{i}"
    nvidia_key_name = "NVIDIA_API_KEY" if i == 1 else f"NVIDIA_API_KEY{i}"
    nvidia_model_name = "NVIDIA_MODEL" if i == 1 else f"NVIDIA_MODEL{i}"
    key = os.getenv(key_name, "") or os.getenv(nvidia_key_name, "")
    model = os.getenv(model_name, "") or os.getenv(nvidia_model_name, "")
    if key:
        API_KEYS.append(key)
        API_MODELS.append(model or os.getenv("API_MODEL", "") or os.getenv("NVIDIA_MODEL", "meta/llama-3.1-70b-instruct"))

# solana configuration
SOLANA_RPC_URL = "https://api.devnet.solana.com"
WALLET_PATH = "wallet.json"

# swarm coordination configuration
NUM_AGENTS = 4
DEBATE_ROUNDS = 3
QUORUM_THRESHOLD = 0.75
