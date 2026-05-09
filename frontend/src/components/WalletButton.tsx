"use client";

import { useWallet } from '@solana/wallet-adapter-react';
import { Wallet } from 'lucide-react';

export default function WalletButton() {
  const { publicKey, connect, disconnect } = useWallet();

  return (
    <button
      onClick={publicKey ? disconnect : connect}
      className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
    >
      <Wallet className="w-4 h-4" />
      {publicKey ? `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}` : 'Connect Wallet'}
    </button>
  );
}
