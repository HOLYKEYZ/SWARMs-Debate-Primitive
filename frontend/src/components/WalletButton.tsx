"use client";

import dynamic from 'next/dynamic';

const WalletConnectButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export default function WalletButton() {
  return <WalletConnectButton />;
}
