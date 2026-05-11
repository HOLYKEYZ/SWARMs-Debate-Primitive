# SWARMs Debate Primitive

Multi-agent AI deliberation as verifiable on-chain coordination. Five specialized agents debate or vote on a question, reach quorum, and anchor the result to Solana Devnet as a Memo receipt.

Live demo: https://debate-primitive.vercel.app

## Features

- **5-agent swarm** — Analyst, Critic, Advocate, Skeptic, Exploit Hunter
- **Meta-agent routing** — picks debate or vote based on the question
- **Multi-provider LLM pool** — NVIDIA NIM, Gemini, Groq, Cerebras with automatic failover on any provider error
- **Exploit Hunter routing** — uses a dedicated Groq key to red-team DAO proposals, escrow designs, treasury actions, and smart contracts
- **Agent memory** — relevant past consensus outcomes are injected into new sessions
- **Real-time deliberation theater** — SSE-streamed agent thinking, positions, confidence, full reasoning
- **Stance + position tracking** — Support / Against / Neutral badges, position-change indicators across rounds
- **On-chain artifacts on Solana Devnet** — transcript hash, decision metadata, DAO prevote, bounty resolution, reputation deltas, staking settlements
- **Modes** — General Swarm, DAO Governance, Exploit Hunt, SOL Bounty
- **Solana wallet integration** — Phantom via Solana Wallet Adapter
- **Session history** — collapsible drawer; click to replay any past deliberation

## Stack

- **Backend** — Python 3.11+, FastAPI, SSE, SQLite, Solana.py / Solders
- **Frontend** — Next.js 16, React 19, Tailwind 4, Solana Wallet Adapter, Lucide
- **AI** — NVIDIA NIM (Kimi K2.6), Google Gemini 2.5 Flash, Groq Llama 3.3 70B, Cerebras OpenAI-compatible

## Prerequisites

- Python 3.11+
- Node.js 18+
- At least one of: NVIDIA NIM, Gemini, Groq, or Cerebras API key (more = better failover)
- Funded Solana Devnet wallet (`wallet.json` in repo root)

## Setup

```bash
pip install -r requirements.txt
cd frontend && npm install && cd ..
```

Create `.env` in repo root:

```env
# at least one provider is required; more keys = more failover headroom
NVIDIA_API_KEY=nvapi-...
NVIDIA_API_KEY2=nvapi-...
NVIDIA_MODEL=moonshotai/kimi-k2.6
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1

GEMINI_API_KEY=AIza...
GEMINI_API_KEY2=AIza...
GEMINI_MODEL=gemini-2.5-flash

GROQ_API_KEY=gsk_...
GROQ_API_KEY2=gsk_...        # used by the Exploit Hunter agent
GROQ_MODEL=llama-3.3-70b-versatile

CEREBRAS_API_KEY=csk-...
CEREBRAS_MODEL=gpt-oss-120b
CEREBRAS_BASE_URL=https://api.cerebras.ai/v1

SOLANA_RPC_URL=https://api.devnet.solana.com
```

Generate a Devnet wallet and fund it:

```bash
python -c "from solders.keypair import Keypair; import json; kp = Keypair(); json.dump(list(bytes(kp)), open('wallet.json','w')); print('Public key:', kp.pubkey())"
```

Then airdrop from https://faucet.solana.com/.

## Run

Backend:

```bash
python -m uvicorn server.api:app --host 127.0.0.1 --port 8000
```

Frontend:

```bash
cd frontend && npm run dev
```

Open `http://localhost:4000/arena`.

CLI:

```bash
python main.py "Should AI systems be required to explain their decisions?"
```

## How it works

1. **Routing** — meta-agent picks debate or vote.
2. **Coordination** — five agents deliberate over N rounds; Exploit Hunter red-teams.
3. **Memory** — prior overlapping decisions are summarized into the prompt.
4. **Quorum** — confidence threshold gates whether the result is anchored.
5. **On-chain** — transcript SHA256, decision artifact, DAO/bounty/reputation/staking memos written to Solana Devnet.

## Scope notes

The build uses real Solana Devnet Memo transactions for every artifact. Compressed NFT minting and real escrow SOL release are scaffolded but require deployed program IDs/IDLs to go live.

## Reference

Inspired by ["Debate or Vote?"](https://arxiv.org/abs/2502.13110) (NeurIPS 2025).

## License

MIT
