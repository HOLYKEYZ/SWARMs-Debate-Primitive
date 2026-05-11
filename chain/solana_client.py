import json
import time
from solana.rpc.api import Client
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solders.instruction import Instruction
from solders.message import Message
from solders.transaction import VersionedTransaction
from solders.signature import Signature
import config

MEMO_PROGRAM_ID = Pubkey.from_string("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr")

class SolanaClient:
    def __init__(self):
        self.client = Client(config.SOLANA_RPC_URL)
        try:
            with open(config.WALLET_PATH, 'r') as f:
                key_bytes = json.load(f)
                self.keypair = Keypair.from_bytes(bytes(key_bytes))
        except FileNotFoundError:
            raise Exception(f"Wallet file not found. Ensure {config.WALLET_PATH} exists.")

    def _send_memo(self, memo_content: str, label: str, wait_seconds: int = 1) -> str:
        memo_ix = Instruction(
            program_id=MEMO_PROGRAM_ID,
            accounts=[],
            data=memo_content.encode("utf-8")
        )

        resp = self.client.get_latest_blockhash()
        blockhash = resp.value.blockhash
        msg = Message.new_with_blockhash([memo_ix], self.keypair.pubkey(), blockhash)
        tx = VersionedTransaction(msg, [self.keypair])

        try:
            print(f"Logging {label} to Devnet ({self.keypair.pubkey()})...")
            tx_resp = self.client.send_transaction(tx)
            signature = str(tx_resp.value)
            print(f"{label} tx: {signature}")
            time.sleep(wait_seconds)
            return signature
        except Exception as e:
            if "insufficient" in str(e).lower() or "0 lamports" in str(e).lower():
                raise Exception("Insufficient funds. Please fund the devnet wallet.")
            raise Exception(f"Failed to log {label} on-chain: {str(e)}")
    
    def log_hash_to_chain(self, session_id: str, transcript_hash: str) -> str:
        """
        Write hash on-chain using Memo Program.
        Returns TX signature string.
        """
        return self._send_memo(f"SWARM:{session_id}:{transcript_hash}", "transcript", 15)

    def log_decision_artifact(self, session_id: str, transcript_hash: str, final_answer: str, quorum: bool, confidence: float) -> str:
        payload = {
            "type": "DEBATE_ARTIFACT",
            "session": session_id,
            "hash": transcript_hash,
            "answer": final_answer[:120],
            "quorum": quorum,
            "confidence": round(float(confidence or 0), 4),
        }
        return self._send_memo(json.dumps(payload, separators=(",", ":")), "decision artifact")

    def log_staking_settlement(self, session_id: str, agent_id: str, stake_sol: float, delta_sol: float, matched_consensus: bool) -> str:
        payload = {
            "type": "AGENT_STAKE",
            "session": session_id,
            "agent": agent_id,
            "stake": stake_sol,
            "delta": round(delta_sol, 4),
            "matched": matched_consensus,
        }
        return self._send_memo(json.dumps(payload, separators=(",", ":")), "agent stake")

    def log_governance_result(self, session_id: str, transcript_hash: str, final_answer: str) -> str:
        payload = {
            "type": "DAO_PREVOTE",
            "session": session_id,
            "hash": transcript_hash,
            "recommendation": final_answer[:160],
        }
        return self._send_memo(json.dumps(payload, separators=(",", ":")), "dao prevote")

    def log_bounty_resolution(self, session_id: str, transcript_hash: str, bounty_sol: float, resolved: bool) -> str:
        payload = {
            "type": "BOUNTY_RESOLUTION",
            "session": session_id,
            "hash": transcript_hash,
            "bounty": bounty_sol,
            "resolved": resolved,
        }
        return self._send_memo(json.dumps(payload, separators=(",", ":")), "bounty resolution")

    def verify_on_chain(self, signature_str: str) -> dict:
        """
        Fetch TX by signature, extract memo, confirm contents.
        Returns {verified: bool, memo: str}
        """
        try:
            sig = Signature.from_string(signature_str)
            tx_info = self.client.get_transaction(
                sig, 
                max_supported_transaction_version=0
            )
            
            if tx_info.value is None:
                return {"verified": False, "memo": "Transaction not found or not confirmed yet"}
                
            # Extract memo from log messages
            log_messages = tx_info.value.transaction.meta.log_messages
            memo = None
            
            if log_messages:
                for log in log_messages:
                    if "Program log: Memo" in log:
                        # extract the actual memo part after the length
                        parts = log.split('): ', 1)
                        if len(parts) > 1:
                            memo = parts[1].strip('"')
                            break
                            
            if not log_messages and getattr(tx_info.value.transaction.meta, "err", None) is not None:
                return {"verified": False, "memo": "Transaction failed on chain"}
                
            return {
                "verified": memo is not None and memo.startswith("SWARM:"),
                "memo": memo if memo else "No valid memo found"
            }
        except Exception as e:
            return {"verified": False, "memo": f"Verification error: {str(e)}"}

    def log_agent_reputation(self, agent_id: str, session_id: str, delta: float) -> str:
        """
        Log an agent's reputation change to the Solana Devnet via Memo Program.
        """
        if not agent_id:
            return "No agent ID, skipping map log."
            
        try:
            return self._send_memo(f"AGENT_REP:{agent_id}:{session_id}:{delta}", "agent reputation")
        except Exception as e:
            print(f"Failed to log reputation on-chain: {str(e)}")
            return ""
