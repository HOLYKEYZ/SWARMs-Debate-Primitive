import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Shield, BrainCircuit, Vote } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BannerProps {
  mechanism?: string;
  reasoning?: string;
  confidence?: number;
  source?: string;
}

export default function MetaAgentBanner({ mechanism, reasoning, confidence, source }: BannerProps) {
  if (!mechanism) return null;

  const isDebate = mechanism === 'debate';

  return (
    <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 border-l-blue-500 animate-in fade-in slide-in-from-top-4">
      <div className="flex items-center gap-4">
        <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20 text-blue-400">
          {isDebate ? <BrainCircuit className="w-6 h-6" /> : <Vote className="w-6 h-6" />}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            Governance Routing Agent
            {source === 'ai' && <span className="bg-blue-500/20 text-blue-300 text-[10px] px-2 py-0.5 rounded shadow-sm border border-blue-500/30">AI ASSISTED</span>}
          </h4>
          <p className="text-white/60 text-sm mt-1 max-w-2xl">
            {reasoning}
          </p>
        </div>
      </div>
      <div className="bg-black/30 px-4 py-2 rounded-lg text-center min-w-32 border border-white/5">
         <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">Selected Mechanism</div>
         <div className={cn(
             "text-lg font-bold capitalize",
             isDebate ? "text-purple-400" : "text-green-400"
         )}>
             {mechanism}
         </div>
      </div>
    </div>
  );
}
