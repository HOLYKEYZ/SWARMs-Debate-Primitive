import React from 'react';
import { ShieldCheck, Copy, Database, Network, ArrowUpRight, Gem, Coins, Fingerprint } from 'lucide-react';

interface ChainReceiptProps {
  signature: string;
  hash: string;
  explorerUrl: string;
  artifacts?: Array<{ type: string; signature: string; explorer_url: string }>;
  settlements?: Array<{
    persona: string;
    reputation_delta: number;
    stake_delta_sol: number;
    matched_consensus: boolean;
    explorer_url: string;
  }>;
}

export default function ChainReceipt({ signature, hash, explorerUrl, artifacts = [], settlements = [] }: ChainReceiptProps) {
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="glass-panel p-8 rounded-[2rem] animate-in zoom-in-95 duration-700 w-full max-w-5xl mx-auto border border-green-500/30 bg-green-500/5 relative overflow-hidden">
      
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-green-500/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-28 -left-20 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl" />
      
      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between mb-8">
        <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-green-500/20 flex items-center justify-center border border-green-500/40 shadow-[0_0_20px_rgba(74,222,128,0.4)]">
          <ShieldCheck className="w-6 h-6 text-green-400" />
        </div>
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-green-200">
            <Gem className="h-3.5 w-3.5" /> debate artifact
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">Verifiable Consensus Receipt</h2>
          <p className="text-green-400/80 text-sm font-medium flex items-center gap-2">
            <Network className="w-3 h-3" /> Confirmed on Solana Devnet
          </p>
        </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:min-w-[340px]">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="text-[10px] font-black uppercase tracking-widest text-white/35">artifact type</div>
            <div className="mt-2 text-sm font-black text-white">NFT-ready receipt</div>
          </div>
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-200/80">
              <Coins className="h-3.5 w-3.5" /> rep
            </div>
            <div className="mt-2 text-sm font-black text-emerald-100">on-chain deltas</div>
          </div>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4">
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

      <div className="relative z-10 mt-4 rounded-2xl border border-blue-400/20 bg-blue-400/10 p-5">
        <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-blue-200/80">
          <Fingerprint className="h-4 w-4" /> metadata payload
        </div>
        <p className="text-sm leading-6 text-white/65">
          This decision artifact anchors the swarm transcript hash, consensus outcome, and agent reputation settlement trail to Solana Memo. It is structured as NFT-ready metadata without claiming a mint until the NFT program is wired.
        </p>
      </div>

      {(artifacts.length > 0 || settlements.length > 0) && (
        <div className="relative z-10 mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {artifacts.length > 0 && (
            <div className="rounded-2xl border border-purple-400/20 bg-purple-400/10 p-5">
              <div className="mb-3 text-[10px] font-black uppercase tracking-[0.25em] text-purple-200/80">artifact tx stream</div>
              <div className="space-y-2">
                {artifacts.map((artifact) => (
                  <a key={`${artifact.type}-${artifact.signature}`} href={artifact.explorer_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-white/70 hover:text-white">
                    <span className="font-black uppercase tracking-widest">{artifact.type.replaceAll('_', ' ')}</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {settlements.length > 0 && (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5">
              <div className="mb-3 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-200/80">agent stake settlements</div>
              <div className="space-y-2">
                {settlements.map((settlement, index) => (
                  <a key={`${settlement.persona}-${index}`} href={settlement.explorer_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-white/70 hover:text-white">
                    <span className="font-black">{settlement.persona}</span>
                    <span className={settlement.matched_consensus ? "text-emerald-300" : "text-rose-300"}>
                      {settlement.stake_delta_sol > 0 ? '+' : ''}{settlement.stake_delta_sol.toFixed(4)} SOL
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="relative z-10 mt-8 flex justify-end">
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
