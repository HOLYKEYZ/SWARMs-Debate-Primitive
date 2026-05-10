# SWARMs Debate Primitive

A multi-agent debate and vote coordination system that turns AI deliberation into trust-minimized coordination infrastructure on the Solana blockchain. Agents assume distinct personas (Analyst, Critic, Advocate, Skeptic) to debate or vote on complex questions. Once quorum is reached, the full session transcript and outcomes are serialized, hashed, and permanently recorded on the Solana Devnet via the Memo program, providing a verifiable block-proof of AI consensus.

## 🎯 Key Features

### Multi-Provider AI Architecture
- **Hybrid Intelligence**: Combines NVIDIA NIM (Kimi K2.6) and Google Gemini (2.5 Flash)
- **Agents 1-2**: NVIDIA NIM for deep reasoning
- **Agents 3-4**: Google Gemini for fast, diverse perspectives
- **Automatic Failover**: Seamless provider switching on rate limits

### Real-Time Deliberation Visualization
- **5-Step Pipeline**: Mechanism Selection → Swarm Deliberation → Consensus Synthesis → Transcript Hashing → Chain Logging
- **Stance Indicators**: Each agent displays Support/Against/Neutral badges
- **Live Updates**: Server-Sent Events (SSE) for real-time agent responses
- **Expandable Cards**: Click to view full reasoning and confidence scores

### Blockchain Verification
- **Immutable Proof**: SHA256 transcript hash logged to Solana Devnet
- **Verifiable**: Every deliberation has an on-chain receipt
- **Transparent**: Full audit trail from question to consensus

### Professional UI/UX
- **Modern Design**: Glass-morphism with smooth animations
- **Responsive**: Works on desktop and mobile
- **Wallet Integration**: Solana wallet connection for on-chain interactions
- **Session History**: Browse and replay past deliberations

## Recent Updates

### Latest (Hackathon Build)
- **Multi-Provider Support**: Added Gemini alongside NVIDIA for better rate limit handling
- **Stance Indicators**: Visual badges showing agent positions (Support/Against/Neutral)
- **Complete Pipeline**: All 5 steps now visible in real-time
- **UI Polish**: Opaque navbar, fixed wallet connection, expandable agent cards
- **Demo Questions**: 8 curated examples including AGI open-source debate

### Previous Updates
- **Session History Loading**: Fixed session history click to properly load and display past session data
- **UI Fixes**: Fixed timestamp clipping, session card overlapping, and debate graph z-index issues
- **Data Loading**: Added missing confidence_score to quorumResult and fixed ChainReceipt field name
- **Wallet Integration**: Custom wallet button with better styling and clickability
- **Performance**: Increased agent API timeout from 20s to 60s for longer responses
- **Reputation Scoring**: Fixed agent reputation scoring to compute from actual session data

## How It Works

1. **Routing**: A heuristic selector analyzes the user's question. Simple factual queries trigger an independent parallel **Vote**, while complex ethical or strategic questions trigger a multi-round decentralized **Debate** where agents share and build upon peer opinions.
2. **Coordination**: Agents deliberate, tracking position changes. A final tally is taken in the final round to check if a consensus (quorum) has been reached.
3. **On-Chain Receipt**: If quorum is met, the transcript of the entire session (including all agent interactions, reasons, and the final answer) is JSON-serialized and strictly SHA256 hashed. The hash is pushed to the Solana blockchain, acting as a permanent and verifiable receipt of the AI's collective decision.

## Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+ (for frontend)
- NVIDIA NIM API Key (free tier: 40 RPM)
- Google Gemini API Key (optional, for mixed provider setup)

### Backend Setup

1. **Install Dependencies**:

```bash
pip install -r requirements.txt
```

2. **Configuration**:
   Create a `.env` file in the root directory:

```env
# NVIDIA NIM (Primary)
NVIDIA_API_KEY=nvapi-your-key-here
NVIDIA_MODEL=moonshotai/kimi-k2.6
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1

# Google Gemini (Optional - for mixed provider)
GEMINI_API_KEY=your-gemini-key-here
GEMINI_MODEL=gemini-2.5-flash

# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com

# Provider
LLM_PROVIDER=nvidia
```

**Getting NVIDIA NIM API Key**:
1. Go to https://build.nvidia.com/settings/api-keys
2. Sign in and create a Personal API Key
3. Select "NGC Catalog" and "Public API Endpoints"
4. Copy the key (starts with `nvapi-`)

**Getting Gemini API Key** (Optional):
1. Go to https://aistudio.google.com/
2. Create a new API key
3. Copy the key (starts with `AIza`)

3. **Generate Solana Wallet**:

```bash
python -c "from solders.keypair import Keypair; import json; kp = Keypair(); json.dump(list(bytes(kp)), open('wallet.json','w')); print('Public key:', kp.pubkey())"
```

4. **Fund Wallet (Devnet)**:
   Go to [Solana Devnet Faucet](https://faucet.solana.com/) to drop 1 SOL onto your generated Public Key.

### Frontend Setup

```bash
cd frontend
npm install
```

## How to Run

### Start Backend

```bash
python -m uvicorn server.api:app --host 127.0.0.1 --port 8000
```

The backend will run on `http://localhost:8000`.

### Start Frontend

```bash
cd frontend
npm run dev
```

The frontend will run on `http://localhost:4000`.

Open your browser to `http://localhost:4000/arena` to start deliberating!

### CLI Mode (Optional)

You can also run the main pipeline natively:

```bash
python main.py "Should AI systems be required to explain their decisions?"
```

Or run the automated integration test suite:

```bash
python test_run.py
```

## Demo Questions

Try these curated questions to showcase different deliberation scenarios:

1. **AGI Open Source Debate** - "AGI should be open-sourced immediately upon creation."
2. **Smart Contract Audit** - Security vulnerability analysis
3. **Simple Math** - Quick vote mechanism demonstration
4. **UBI Debate** - Complex economic policy discussion
5. **Privacy vs Security** - Ethical dilemma with split decisions
6. **DAO Governance** - Token allocation proposal
7. **Medical Decision** - Treatment option analysis
8. **Investment Decision** - Startup funding evaluation

## Example Output

```text
================================================================================
 SWARMs DEBATE PRIMITIVE
================================================================================

STEP 1: SELECTOR DECISION
  Mechanism: DEBATE
  Reasoning: Question contains complex/analytical signal ('should'). Requires debate.

STEP 2: AGENT COORDINATION
  [Agent_1_Analyst] (NVIDIA) deliberating...
  [Agent_2_Critic] (NVIDIA) deliberating...
  [Agent_3_Advocate] (Gemini) deliberating...
  [Agent_4_Skeptic] (Gemini) deliberating...

STEP 3: QUORUM CHECK
  Final Answer: Yes
  Status: REACHED (Confidence: 1.00)
  Stance Distribution: 3 Support, 1 Against

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

### Backend
- **Python 3.11+** - Core runtime
- **FastAPI** - REST API and SSE streaming
- **Multi-Provider LLM Client** - NVIDIA NIM + Google Gemini
- **Solana.py & Solders** - Blockchain integration
- **SQLite** - Session persistence

### Frontend
- **Next.js 16** - React framework with Turbopack
- **React 19** - UI components
- **TailwindCSS 4** - Styling
- **Solana Wallet Adapter** - Wallet integration
- **Lucide Icons** - Icon library

### AI Providers
- **NVIDIA NIM** - Kimi K2.6 (1T parameter MoE model)
- **Google Gemini** - 2.5 Flash (fast reasoning model)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  Next.js + React + TailwindCSS + Solana Wallet Adapter     │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP + SSE
┌─────────────────────▼───────────────────────────────────────┐
│                      Backend API                            │
│              FastAPI + Session Manager                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
┌───────▼──────┐ ┌───▼────────┐ ┌─▼──────────┐
│ Multi-Provider│ │  Selector  │ │  Solana    │
│  LLM Client   │ │   Logic    │ │  Client    │
│ NVIDIA+Gemini │ │ Vote/Debate│ │  Devnet    │
└───────────────┘ └────────────┘ └────────────┘
```

## Rate Limits & Best Practices

### NVIDIA NIM Free Tier
- **40 requests per minute** per API key
- **Solution**: Mixed provider setup (2 NVIDIA + 2 Gemini agents)

### Google Gemini Free Tier
- **15 requests per minute** per API key
- **60 requests per day** per API key

### Recommendations
1. Use mixed provider setup for better throughput
2. Add delays between rounds for large deliberations
3. Monitor backend logs for rate limit warnings
4. Consider upgrading to paid tiers for production use

## Troubleshooting

### Rate Limit Errors
- **Symptom**: Agents show "API Error" or "Rate limit exhausted"
- **Solution**: Wait 60 seconds or use mixed provider setup

### Wallet Connection Issues
- **Symptom**: "No wallet available" error
- **Solution**: Install Phantom wallet extension and refresh page

### Frontend Not Loading
- **Symptom**: Blank page or build errors
- **Solution**: Clear `.next` folder and run `npm run dev` again

### Backend Errors
- **Symptom**: 500 errors or agent failures
- **Solution**: Check `.env` file has valid API keys and restart backend

## Contributing

This is a hackathon project. For production use, consider:
- Adding authentication and rate limiting
- Implementing proper error boundaries
- Adding comprehensive test coverage
- Setting up CI/CD pipelines
- Migrating to Solana mainnet

## Reference

Based on concepts from the research paper ["Debate or Vote?"](https://arxiv.org/abs/2502.13110) (NeurIPS 2025).

## License

MIT License - See LICENSE file for details

---

**Built for hackathon submission** | **Powered by NVIDIA NIM & Google Gemini** | **Verified on Solana Devnet**
