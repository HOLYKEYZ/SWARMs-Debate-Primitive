import os
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

# API Keys
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Solana configuration
SOLANA_RPC_URL = "https://api.devnet.solana.com"
WALLET_PATH = "wallet.json"

# SWARM Coordination configuration
NUM_AGENTS = 4
DEBATE_ROUNDS = 3
MODEL = "gemini-2.5-pro"
QUORUM_THRESHOLD = 0.75
