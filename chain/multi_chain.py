from abc import ABC, abstractmethod
from typing import Dict, Optional
import config


class ChainClient(ABC):
    """Abstract base class for blockchain clients."""
    
    @abstractmethod
    def get_chain_id(self) -> int:
        """Get the chain ID."""
        pass
    
    @abstractmethod
    def get_explorer_url(self, tx_signature: str) -> str:
        """Get the explorer URL for a transaction."""
        pass
    
    @abstractmethod
    def verify_transaction(self, tx_signature: str) -> Dict:
        """Verify a transaction on-chain."""
        pass


class SolanaClient(ChainClient):
    """Solana blockchain client."""
    
    def __init__(self):
        self.chain_id = 1399811940  # Solana devnet
        self.explorer_base = "https://explorer.solana.com"
    
    def get_chain_id(self) -> int:
        return self.chain_id
    
    def get_explorer_url(self, tx_signature: str) -> str:
        return f"{self.explorer_base}/tx/{tx_signature}?cluster=devnet"
    
    def verify_transaction(self, tx_signature: str) -> Dict:
        """Verify a transaction on Solana devnet."""
        try:
            from chain.solana_client import SolanaClient as SolanaClientImpl
            client = SolanaClientImpl()
            return client.verify_on_chain(tx_signature)
        except Exception as e:
            return {
                "verified": False,
                "error": str(e)
            }


class EthereumClient(ChainClient):
    """Ethereum blockchain client (placeholder for future implementation)."""
    
    def __init__(self, network: str = "sepolia"):
        self.network = network
        self.chain_id = 11155111 if network == "sepolia" else 1
        self.explorer_base = "https://sepolia.etherscan.io" if network == "sepolia" else "https://etherscan.io"
    
    def get_chain_id(self) -> int:
        return self.chain_id
    
    def get_explorer_url(self, tx_signature: str) -> str:
        return f"{self.explorer_base}/tx/{tx_signature}"
    
    def verify_transaction(self, tx_signature: str) -> Dict:
        """Verify a transaction on Ethereum (placeholder)."""
        # TODO: Implement actual Ethereum verification
        return {
            "verified": False,
            "error": "Ethereum verification not yet implemented"
        }


class PolygonClient(ChainClient):
    """Polygon blockchain client (placeholder for future implementation)."""
    
    def __init__(self, network: str = "amoy"):
        self.network = network
        self.chain_id = 80002 if network == "amoy" else 137
        self.explorer_base = "https://amoy.polygonscan.com" if network == "amoy" else "https://polygonscan.com"
    
    def get_chain_id(self) -> int:
        return self.chain_id
    
    def get_explorer_url(self, tx_signature: str) -> str:
        return f"{self.explorer_base}/tx/{tx_signature}"
    
    def verify_transaction(self, tx_signature: str) -> Dict:
        """Verify a transaction on Polygon (placeholder)."""
        # TODO: Implement actual Polygon verification
        return {
            "verified": False,
            "error": "Polygon verification not yet implemented"
        }


class ArbitrumClient(ChainClient):
    """Arbitrum blockchain client (placeholder for future implementation)."""
    
    def __init__(self, network: str = "sepolia"):
        self.network = network
        self.chain_id = 421614 if network == "sepolia" else 42161
        self.explorer_base = "https://sepolia.arbiscan.io" if network == "sepolia" else "https://arbiscan.io"
    
    def get_chain_id(self) -> int:
        return self.chain_id
    
    def get_explorer_url(self, tx_signature: str) -> str:
        return f"{self.explorer_base}/tx/{tx_signature}"
    
    def verify_transaction(self, tx_signature: str) -> Dict:
        """Verify a transaction on Arbitrum (placeholder)."""
        # TODO: Implement actual Arbitrum verification
        return {
            "verified": False,
            "error": "Arbitrum verification not yet implemented"
        }


class MultiChainManager:
    """Manages multiple blockchain clients."""
    
    def __init__(self):
        self.clients: Dict[str, ChainClient] = {
            "solana": SolanaClient(),
            "ethereum": EthereumClient(),
            "polygon": PolygonClient(),
            "arbitrum": ArbitrumClient(),
        }
        self.default_chain = config.DEFAULT_CHAIN if hasattr(config, 'DEFAULT_CHAIN') else "solana"
    
    def get_client(self, chain: Optional[str] = None) -> ChainClient:
        """Get a blockchain client for the specified chain."""
        chain = chain or self.default_chain
        if chain not in self.clients:
            raise ValueError(f"Unsupported chain: {chain}")
        return self.clients[chain]
    
    def get_supported_chains(self) -> list:
        """Get list of supported chains."""
        return list(self.clients.keys())
    
    def set_default_chain(self, chain: str):
        """Set the default blockchain."""
        if chain not in self.clients:
            raise ValueError(f"Unsupported chain: {chain}")
        self.default_chain = chain


# Singleton instance
multi_chain_manager = MultiChainManager()


def get_chain_client(chain: Optional[str] = None) -> ChainClient:
    """Convenience function to get a chain client."""
    return multi_chain_manager.get_client(chain)


def get_supported_chains() -> list:
    """Convenience function to get supported chains."""
    return multi_chain_manager.get_supported_chains()
