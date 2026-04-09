import React from 'react';
import { ShieldCheck, Copy, Database, Network } from 'lucide-react';

interface ChainReceiptProps {
  signature: string;
  hash: string;
  explorerUrl: string;
}

export default function ChainReceipt({ signature, hash, explorerUrl }: ChainReceiptProps) {
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="glass-panel p-8 rounded-2xl animate-in zoom-in-95 duration-700 w-full max-w-4xl mx-auto border border-green-500/30 bg-green-500/5 relative overflow-hidden">
      
      {/* Background glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-green-500/20 rounded-full blur-3xl" />
      
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/40 shadow-[0_0_20px_rgba(74,222,128,0.4)]">
          <ShieldCheck className="w-6 h-6 text-green-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">On-Chain Receipt</h2>
          <p className="text-green-400/80 text-sm font-medium flex items-center gap-2">
            <Network className="w-3 h-3" /> Confirmed on Solana Devnet
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-black/40 rounded-xl p-4 border border-white/5 group relative">
          <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
            <Database className="w-3 h-3" /> Transcript Hash
          </div>
          <div className="font-mono text-xs text-white/80 break-all">{hash}</div>
          <button 
            onClick={() => copyToClipboard(hash)}
            className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-black/40 rounded-xl p-4 border border-white/5 group relative">
          <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
            <Network className="w-3 h-3" /> Transaction Signature
          </div>
          <div className="font-mono text-xs text-white/80 break-all">{signature}</div>
          <button 
            onClick={() => copyToClipboard(signature)}
            className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <a 
          href={explorerUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-green-500 hover:bg-green-400 text-black px-6 py-3 rounded-lg font-bold transition-all shadow-[0_0_15px_rgba(74,222,128,0.3)] hover:shadow-[0_0_25px_rgba(74,222,128,0.5)] flex items-center gap-2"
        >
          View on Explorer <ArrowUpRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

function ArrowUpRight({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17l9.2-9.2M17 17V7H7" />
    </svg>
  );
}
