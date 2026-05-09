import os

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

# api keys (support multiple for rotation/rate limit bypass)
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "nvidia").lower()

NVIDIA_BASE_URL = os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1").rstrip("/")
# Generic API Keys - supports any provider
API_KEYS = []
API_MODELS = []
for i in range(1, 10):
    key_name = "API_KEY" if i == 1 else f"API_KEY{i}"
    model_name = "API_MODEL" if i == 1 else f"API_MODEL{i}"
    key = os.getenv(key_name, "")
    model = os.getenv(model_name, "")
    if key:
        API_KEYS.append(key)
        API_MODELS.append(model or os.getenv("API_MODEL", "meta/llama-3.1-70b-instruct"))

# Legacy support for NVIDIA keys (fallback)
NVIDIA_API_KEYS = []
NVIDIA_MODELS = []
for i in range(1, 10):
    key_name = "NVIDIA_API_KEY" if i == 1 else f"NVIDIA_API_KEY{i}"
    model_name = "NVIDIA_MODEL" if i == 1 else f"NVIDIA_MODEL{i}"
    key = os.getenv(key_name, "")
    model = os.getenv(model_name, "")
    if key:
        NVIDIA_API_KEYS.append(key)
        NVIDIA_MODELS.append(model or os.getenv("NVIDIA_MODEL", "moonshotai/kimi-k2-thinking"))

# Use generic keys if available, otherwise fall back to NVIDIA
if not API_KEYS and NVIDIA_API_KEYS:
    API_KEYS = NVIDIA_API_KEYS
    API_MODELS = NVIDIA_MODELS

GEMINI_API_KEYS = []
for i in range(1, 10):
    key_name = "GEMINI_API_KEY" if i == 1 else f"GEMINI_API_KEY{i}"
    k = os.getenv(key_name, "")
    if k:
        GEMINI_API_KEYS.append(k)

# fallback if empty
if not GEMINI_API_KEYS:
    GEMINI_API_KEYS = [os.getenv("GEMINI_API_KEY", "")]

# Solana configuration
SOLANA_RPC_URL = "https://api.devnet.solana.com"
WALLET_PATH = "wallet.json"

# SWARM Coordination configuration
NUM_AGENTS = 4
DEBATE_ROUNDS = 3
MODEL = os.getenv("MODEL", "gemini-2.0-flash")
QUORUM_THRESHOLD = 0.75
