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
    
    def log_hash_to_chain(self, session_id: str, transcript_hash: str) -> str:
        """
        Write hash on-chain using Memo Program.
        Returns TX signature string.
        """
        memo_content = f"SWARM:{session_id}:{transcript_hash}"
        
        # Build memo instruction
        memo_ix = Instruction(
            program_id=MEMO_PROGRAM_ID,
            accounts=[], # Memo program needs no accounts
            data=memo_content.encode("utf-8")
        )
        
        # Get latest blockhash
        resp = self.client.get_latest_blockhash()
        blockhash = resp.value.blockhash
        
        # Compile message
        msg = Message.new_with_blockhash(
            [memo_ix],
            self.keypair.pubkey(),
            blockhash
        )
        
        # Sign tx
        tx = VersionedTransaction(msg, [self.keypair])
        
        # Send
        try:
            print(f"Logging transcript to Devnet ({self.keypair.pubkey()})...")
            tx_resp = self.client.send_transaction(tx)
            signature = str(tx_resp.value)
            print(f"Transaction submitted: {signature}")
            
            # Wait a specific amount of time to verify inclusion
            print("Waiting for confirmation (15s)...")
            time.sleep(15) 
            
            return signature
            
        except Exception as e:
            # specifically catch insufficient funds and give clear instructions
            if "insufficient" in str(e).lower() or "0 lamports" in str(e).lower():
                raise Exception("Insufficient funds. Please fund the devnet wallet.")
            raise Exception(f"Failed to log hash on-chain: {str(e)}")

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
