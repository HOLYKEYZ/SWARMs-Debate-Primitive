import os
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

# API Keys (support multiple for rotation/rate limit bypass)
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
MODEL = "gemini-2.5-flash"
QUORUM_THRESHOLD = 0.75
