"use client";

import { useWallet } from '@solana/wallet-adapter-react';
import { Wallet } from 'lucide-react';

export default function WalletButton() {
  const { publicKey, connect, disconnect, select, wallet } = useWallet();

  const handleConnect = async () => {
    try {
      if (wallet) {
        await select(wallet.adapter.name);
        await connect();
      } else {
        console.error('No wallet available');
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Wallet disconnect error:', error);
    }
  };

  return (
    <button
      onClick={publicKey ? handleDisconnect : handleConnect}
      className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
    >
      <Wallet className="w-4 h-4" />
      {publicKey ? `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}` : 'Connect Wallet'}
    </button>
  );
}
