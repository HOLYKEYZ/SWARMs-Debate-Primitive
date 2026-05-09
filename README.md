# SWARMs Debate Primitive

A multi-agent debate and vote coordination system that turns AI deliberation into trust-minimized coordination infrastructure on the Solana blockchain. Agents assume distinct personas (Analyst, Critic, Advocate, Skeptic) to debate or vote on complex questions. Once quorum is reached, the full session transcript and outcomes are serialized, hashed, and permanently recorded on the Solana Devnet via the Memo program, providing a verifiable block-proof of AI consensus.

## Recent Updates

- **Session History Loading**: Fixed session history click to properly load and display past session data
- **UI Fixes**: Fixed timestamp clipping (increased min-width to 80px), session card overlapping, and debate graph z-index issues
- **Data Loading**: Added missing confidence_score to quorumResult and fixed ChainReceipt field name (tx_url → explorer_url)
- **Wallet Integration**: Replaced dynamic wallet import with custom button for better styling and clickability
- **Performance**: Increased agent API timeout from 20s to 60s for longer responses
- **Reputation Scoring**: Fixed agent reputation scoring to compute from actual session data
- **Sidebar**: Added fallback values for missing session data fields to prevent rendering issues

## How It Works

1. **Routing**: A heuristic selector analyzes the user’s question. Simple factual queries trigger an independent parallel **Vote**, while complex ethical or strategic questions trigger a multi-round decentralized **Debate** where agents share and build upon peer opinions.
2. **Coordination**: Agents deliberate, tracking position changes. A final tally is taken in the final round to check if a consensus (quorum) has been reached.
3. **On-Chain Receipt**: If quorum is met, the transcript of the entire session (including all agent interactions, reasons, and the final answer) is JSON-serialized and strictly SHA256 hashed. The hash is pushed to the Solana blockchain, acting as a permanent and verifiable receipt of the AI's collective decision.

## Setup Instructions

1. **Prerequisites**: Minimum Python 3.11+.
2. **Install Dependencies**:

```bash
pip install -r requirements.txt
# Alternatively: pip install google-genai solana solders python-dotenv
```

3. **Configuration**:
   Create a `.env` file in the root directory and add your API Keys (supports any provider):

```env
API_KEY_1="your-api-key-1"
API_KEY_2="your-api-key-2"
API_KEY_3="your-api-key-3"
API_KEY_4="your-api-key-4"
API_MODEL="meta/llama-3.1-70b-instruct"
```

For NVIDIA specifically, you can also use:
```env
NVIDIA_API_KEY_1="your-nvidia-api-key-1"
NVIDIA_API_KEY_2="your-nvidia-api-key-2"
NVIDIA_API_KEY_3="your-nvidia-api-key-3"
NVIDIA_API_KEY_4="your-nvidia-api-key-4"
```

4. **Generate Solana Wallet**:

```bash
python -c "from solders.keypair import Keypair; import json; kp = Keypair(); json.dump(list(bytes(kp)), open('wallet.json','w')); print('Public key:', kp.pubkey())"
```

5. **Fund Wallet (Devnet)**:
   Go to [Solana Devnet Faucet](https://faucet.solana.com/) to drop 1 SOL onto your generated Public Key.

## How to Run

Start the backend server:

```bash
python server/api.py
```

The backend will run on `http://localhost:8000`.

Start the frontend (in a separate terminal):

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:4000`.

You can also run the main pipeline natively:

```bash
python main.py -- ask a question e.g #"Should AI systems be required to explain their decisions?"
```

Or run the automated integration test suite:

```bash
python test_run.py
```

## Example Output

```text
================================================================================
 SWARMs DEBATE PRIMITIVE
================================================================================

STEP 1: SELECTOR DECISION
  Mechanism: DEBATE
  Reasoning: Question contains complex/analytical signal ('should'). Requires debate.

STEP 2: AGENT COORDINATION
  [Agent_1_Analyst] deliberating...
  [Agent_2_Critic] deliberating...
  [Agent_3_Advocate] deliberating...
  [Agent_4_Skeptic] deliberating...

STEP 3: QUORUM CHECK
  Final Answer: Yes
  Status: REACHED (Confidence: 1.00)

STEP 4: TRANSCRIPT HASHING & ON-CHAIN STORAGE
Logging transcript to Devnet...
Transaction submitted: 4sH...
Waiting for confirmation (15s)...

================================================================================
 ON-CHAIN RECEIPT
================================================================================
Question:       Should AI systems be required to explain their decisions?
Mechanism:      debate
Final Answer:   Yes
Quorum:         REACHED
Session ID:     d7f25182-608c-4d0b-8253-10d1c999a3a3
Transcript Hash: ba78728dcb9a051e9923f852fd979f459d3b0f20cfb6...
TX Signature:   4sHpTp...
Verifiable at:  https://explorer.solana.com/tx/4sHpTp...?cluster=devnet
```

## Tech Stack

- Python 3.11+
- [Google GenAI SDK](https://github.com/googleapis/python-genai) (Gemini Models via API)
- [Solana.py](https://michaelhly.github.io/solana-py/) & Solders (Solana Blockchain integration)

## Reference

Based on concepts from the research paper ["Debate or Vote?"](https://arxiv.org/abs/2502.13110) (NeurIPS 2025).
