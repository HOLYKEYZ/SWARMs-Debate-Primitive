import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Brain, ChevronDown, ChevronUp, Coins, RefreshCw, ThumbsDown, ThumbsUp, User } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AgentCardProps {
  name: string;
  persona: string;
  isActive: boolean;
  status: 'idle' | 'thinking' | 'responded';
  answer?: string;
  reasoning?: string;
  confidence?: number;
  positionChanged?: boolean;
  retryMessage?: string;
  selected?: boolean;
  onSelect?: () => void;
  finalAnswer?: string;
  quorumReached?: boolean;
  stakeDelta?: number;
  settled?: boolean;
  expanded?: boolean;
}

const personaColors: Record<string, string> = {
  Analyst: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/5',
  Critic: 'text-red-400 border-red-400/30 bg-red-400/5',
  Advocate: 'text-green-400 border-green-400/30 bg-green-400/5',
  Skeptic: 'text-amber-400 border-amber-400/30 bg-amber-400/5',
};

function getStance(answer?: string): 'support' | 'against' | 'neutral' {
  if (!answer) return 'neutral';
  
  const text = answer.toLowerCase().trim();
  
  const opening = text.substring(0, 50);
  
  if (/^(no|not|never|reject|oppose|against|disagree|agi should not|should not)/i.test(opening)) {
    return 'against';
  }
  
  if (/^(yes|support|agree|approve|favor|agi should|should be|recommend)/i.test(opening)) {
    return 'support';
  }
  
  if (/should\s*n[o']t|shouldn't|must\s*not|cannot|can't\s+(be|support)/i.test(text)) {
    return 'against';
  }
  
  if (/\b(conditional|tiered|framework|depends|nuanced|complex|both sides|however|although)\b/.test(text)) {
    return 'neutral';
  }
  
  const againstWords = (text.match(/\b(not|no\b|never|reject|oppose|against|disagree|harmful|dangerous|risk|threat)\b/g) || []).length;
  const supportWords = (text.match(/\b(yes|should|agree|support|favor|beneficial|positive|safe|good)\b/g) || []).length;
  
  if (againstWords > supportWords + 1) return 'against';
  if (supportWords > againstWords + 1) return 'support';
  
  return 'neutral';
}

export default function AgentCard({ 
  name, 
  persona, 
  isActive, 
  status, 
  answer, 
  reasoning,
  confidence, 
  positionChanged,
  retryMessage,
  selected,
  onSelect,
  finalAnswer,
  quorumReached,
  stakeDelta,
  settled: settledProp,
  expanded,
}: AgentCardProps) {
  const colorClass = personaColors[persona] || 'text-white border-white/30 bg-white/5';
  const hasContent = (status === 'responded' && answer) && !retryMessage;
  const stance = getStance(answer);
  const matchedConsensus = Boolean(answer && finalAnswer && answer.trim().toLowerCase() === finalAnswer.trim().toLowerCase());
  const settled = Boolean(settledProp ?? (finalAnswer && quorumReached !== undefined && hasContent));
  const stakeLabel = settled
    ? (typeof stakeDelta === 'number'
        ? `${stakeDelta >= 0 ? '+' : ''}${stakeDelta.toFixed(4)} SOL`
        : matchedConsensus ? '+reward pending' : 'slashed')
    : '0.05 SOL staked';
  
  const stanceConfig = {
    support: { icon: ThumbsUp, color: 'text-green-400 bg-green-400/10 border-green-400/30', label: 'Supporting' },
    against: { icon: ThumbsDown, color: 'text-red-400 bg-red-400/10 border-red-400/30', label: 'Against' },
    neutral: { icon: User, color: 'text-gray-400 bg-gray-400/10 border-gray-400/30', label: 'Neutral' },
  };
  
  const StanceIcon = stanceConfig[stance].icon;
  
  return (
    <button type="button" onClick={onSelect} className={cn(
      "glass-panel rounded-2xl p-5 text-left transition-all duration-500 relative overflow-hidden flex flex-col isolate border min-h-[220px]",
      selected ? "ring-2 ring-blue-400/60 border-blue-400/40 shadow-[0_0_35px_rgba(59,130,246,0.2)]" : "border-white/5 hover:border-white/15",
      isActive ? "scale-[1.02] z-10" : "opacity-95 scale-100 z-0",
      colorClass.split(' ')[2]
    )}>
      
      {positionChanged && (
        <div className="absolute top-0 right-0 bg-yellow-500/20 text-yellow-300 text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1 animate-pulse z-20">
          <RefreshCw className="w-3 h-3" /> Position Changed
        </div>
      )}
      
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className={cn(
            "w-10 h-10 shrink-0 rounded-full flex items-center justify-center border",
            colorClass.split(' ').slice(0, 2).join(' ')
          )}>
            {status === 'thinking' ? (
               <Brain className="w-5 h-5 animate-pulse" />
            ) : (
               <User className="w-5 h-5" />
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="break-words text-sm font-black leading-tight tracking-tight text-white/90">{name}</h3>
            <span className={cn("text-[10px] font-black uppercase tracking-widest", retryMessage ? 'text-amber-400 animate-pulse' : colorClass.split(' ')[0])}>
              {retryMessage ? 'Retrying API' : persona}
            </span>
          </div>
        </div>
        {hasContent && (
          <div className="flex shrink-0 flex-col items-end gap-2">
            <div className={cn(
              "rounded-lg border px-2 py-1 text-[9px] font-bold uppercase tracking-wider",
              stanceConfig[stance].color
            )}>
              <div className="flex items-center gap-1">
                <StanceIcon className="h-3 w-3" />
                {stanceConfig[stance].label}
              </div>
            </div>
            <div className="text-white/40">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between gap-4 relative">
        {retryMessage ? (
          <div className="flex flex-col gap-2 items-start animate-in fade-in zoom-in">
            <p className="text-xs font-medium text-amber-400/80 italic">{retryMessage}</p>
            <div className="flex gap-1">
              <div className="w-1 h-1 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1 h-1 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1 h-1 rounded-full bg-amber-500 animate-bounce" />
            </div>
          </div>
        ) : status === 'idle' && !answer ? (
          <div className="text-white/30 text-sm font-medium flex items-center h-full gap-2">
            Waiting for turn...
          </div>
        ) : status === 'thinking' && !answer ? (
          <div className="text-white/60 text-sm font-medium flex items-center gap-2 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin" /> Analyzing context...
          </div>
        ) : null}

        {hasContent && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="bg-black/40 rounded-xl p-4 border border-white/5">
              <div className="text-[10px] text-white/40 uppercase tracking-widest font-semibold mb-2">argument</div>
              <div className={cn("text-base font-black text-white break-words leading-relaxed", !expanded && "line-clamp-3")}>{answer || 'N/A'}</div>
            </div>

            {expanded && reasoning && (
              <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-1 text-[10px] text-white/40 uppercase tracking-widest font-semibold mb-2">
                  <Brain className="h-3 w-3" /> reasoning
                </div>
                <div className="text-sm text-white/75 break-words leading-relaxed whitespace-pre-wrap">{reasoning}</div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/5 bg-black/25 p-3">
                <div className="text-[10px] uppercase tracking-widest text-white/35 font-black">confidence</div>
                <div className="mt-1 text-lg font-black text-white">{Math.round((confidence || 0) * 100)}%</div>
              </div>
              <div className={cn("rounded-xl border p-3", settled ? (matchedConsensus ? "border-emerald-400/25 bg-emerald-400/10" : "border-rose-400/25 bg-rose-400/10") : "border-white/5 bg-black/25")}>
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-white/35 font-black">
                  <Coins className="h-3 w-3" /> stake
                </div>
                <div className={cn("mt-1 text-sm font-black", settled ? (matchedConsensus ? "text-emerald-300" : "text-rose-300") : "text-white")}>
                  {stakeLabel}
                </div>
              </div>
            </div>

            {!expanded && reasoning && (
              <div className="text-[10px] uppercase tracking-widest text-white/30 font-black">tap to view full argument</div>
            )}
          </div>
        )}
      </div>

    </button>
  );
}
