# SWARMs Debate Primitive

A multi-agent debate and vote coordination system that turns AI deliberation into verifiable coordination infrastructure on Solana Devnet. Agents assume distinct personas (Analyst, Critic, Advocate, Skeptic, Exploit Hunter) to debate or vote on complex questions. Once quorum is reached, the session transcript is serialized, SHA256-hashed, and recorded through Solana Memo transactions with additional artifacts for reputation, staking settlement, DAO prevotes, and bounty resolution.

## 🎯 Key Features

### Multi-Provider AI Architecture
- **Hybrid Intelligence**: Combines NVIDIA NIM, Google Gemini, Groq, and Cerebras
- **Exploit Hunter Routing**: Uses the secondary Groq key for adversarial security review when configured
- **Cerebras Fallback**: Adds an OpenAI-compatible fallback provider for failed model calls
- **Automatic Failover**: Rotates providers on quota, rate limit, and timeout failures

### Real-Time Deliberation Visualization
- **5-Agent Swarm**: Analyst, Critic, Advocate, Skeptic, and Exploit Hunter
- **5-Step Pipeline**: Mechanism Selection → Swarm Deliberation → Consensus Synthesis → Transcript Hashing → Chain Logging
- **Stance Indicators**: Each agent displays Support/Against/Neutral badges
- **Live Updates**: Server-Sent Events (SSE) for real-time agent responses
- **Deliberation Theater**: Clickable agent tiles with a large response panel for full reasoning

### Blockchain Verification
- **Immutable Proof**: SHA256 transcript hash logged to Solana Devnet
- **Decision Artifacts**: Structured Solana Memo payloads for quorum result metadata
- **Agent Settlements**: Reputation and stake-settlement artifacts emitted after consensus
- **DAO and Bounty Artifacts**: DAO prevote and bounty-resolution receipts for relevant questions

### Professional UI/UX
- **Modern Design**: Glass-morphism with smooth animations
- **Responsive**: Works on desktop and mobile
- **Wallet Integration**: Solana wallet connection for on-chain interactions
- **Session History**: Browse and replay past deliberations
- **Agent Memory**: Relevant prior decisions are injected into new deliberations

## Recent Updates

### Latest (Hackathon Build)
- **Exploit Hunter**: Added an adversarial red-team agent for DAO, bounty, smart contract, and treasury risk review
- **Provider Resilience**: Added Groq2 routing for Exploit Hunter and Cerebras as a fallback provider
- **On-Chain Artifact Stream**: Added transcript, decision, DAO prevote, bounty resolution, reputation, and staking settlement memo receipts
- **Agent Memory**: Previous relevant consensus outcomes can influence later sessions
- **Deliberation Theater**: Reworked response display so judges can read full agent reasoning without tiny scrolling cards

### Previous Updates
- **Session History Loading**: Fixed session history click to properly load and display past session data
- **UI Fixes**: Fixed timestamp clipping, session card overlapping, and debate graph z-index issues
- **Data Loading**: Added missing confidence_score to quorumResult and fixed ChainReceipt field name
- **Wallet Integration**: Custom wallet button with better styling and clickability
- **Performance**: Increased agent API timeout from 20s to 60s for longer responses
- **Reputation Scoring**: Fixed agent reputation scoring to compute from actual session data

## How It Works

1. **Routing**: A meta-agent analyzes the user's question and selects either independent voting or multi-round debate.
2. **Coordination**: Five specialized agents deliberate, including an Exploit Hunter that red-teams governance, escrow, incentives, and smart contract risk.
3. **Memory**: Relevant completed sessions are summarized and injected into new prompts when the current question overlaps prior decisions.
4. **Quorum**: A final tally checks whether a quorum threshold was reached and records the confidence score.
5. **On-Chain Receipt**: If quorum is met, the transcript hash and structured decision artifacts are written to Solana Devnet Memo transactions.

## Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+ (for frontend)
- NVIDIA NIM API key
- Google Gemini API key
- Groq API key
- Cerebras API key
- Funded Solana Devnet wallet

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

# Groq
GROQ_API_KEY=your-groq-key-here
GROQ_API_KEY2=your-exploit-hunter-groq-key-here
GROQ_MODEL=llama-3.3-70b-versatile

# Cerebras fallback
CEREBRAS_API_KEY=your-cerebras-key-here
CEREBRAS_MODEL=gpt-oss-120b
CEREBRAS_BASE_URL=https://api.cerebras.ai/v1

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

The backend will run on `http://127.0.0.1:8000`.

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

1. **DAO Treasury Proposal** - "Should this DAO allocate 15% of treasury to a new grants program?"
2. **Smart Contract Audit** - "Audit this escrow design for exploit paths before deployment."
3. **Bounty Marketplace** - "Resolve this protocol risk bounty after quorum."
4. **AGI Open Source Debate** - "AGI should be open-sourced immediately upon creation."
5. **Privacy vs Security** - Ethical dilemma with split decisions
6. **Investment Decision** - Startup funding evaluation

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
  [Agent_5_ExploitHunter] red-teaming...

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
- **Multi-Provider LLM Client** - NVIDIA NIM + Google Gemini + Groq + Cerebras
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
- **Groq** - Exploit Hunter routing and fallback
- **Cerebras** - OpenAI-compatible fallback

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
│ Multi-LLM Pool│ │ Vote/Debate│ │  Devnet    │
└───────────────┘ └────────────┘ └────────────┘
```

## Rate Limits & Best Practices

### Recommendations
1. Configure multiple providers for better throughput
2. Keep a funded Devnet wallet available for memo writes
3. Monitor backend logs for provider failover and chain receipts
4. Consider paid tiers for production demos

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

**Built for hackathon submission** | **Powered by NVIDIA NIM, Gemini, Groq & Cerebras** | **Verified on Solana Devnet**
