import React, { useState } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Brain, User, RefreshCw, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';

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
}

const personaColors: Record<string, string> = {
  Analyst: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/5',
  Critic: 'text-red-400 border-red-400/30 bg-red-400/5',
  Advocate: 'text-green-400 border-green-400/30 bg-green-400/5',
  Skeptic: 'text-amber-400 border-amber-400/30 bg-amber-400/5',
};

// Determine stance from answer text
function getStance(answer?: string): 'support' | 'against' | 'neutral' {
  if (!answer) return 'neutral';
  
  const lower = answer.toLowerCase();
  
  // Strong support indicators
  const supportWords = ['yes', 'support', 'agree', 'approve', 'favor', 'should', 'recommend', 'positive', 'beneficial', 'true', 'correct'];
  const againstWords = ['no', 'against', 'disagree', 'reject', 'oppose', 'should not', 'shouldn\'t', 'negative', 'harmful', 'false', 'incorrect'];
  
  const supportCount = supportWords.filter(word => lower.includes(word)).length;
  const againstCount = againstWords.filter(word => lower.includes(word)).length;
  
  if (supportCount > againstCount) return 'support';
  if (againstCount > supportCount) return 'against';
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
  retryMessage
}: AgentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const colorClass = personaColors[persona] || 'text-white border-white/30 bg-white/5';
  const hasContent = (status === 'responded' || answer) && !retryMessage;
  const stance = getStance(answer);
  
  const stanceConfig = {
    support: { icon: ThumbsUp, color: 'text-green-400 bg-green-400/10 border-green-400/30', label: 'Supporting' },
    against: { icon: ThumbsDown, color: 'text-red-400 bg-red-400/10 border-red-400/30', label: 'Against' },
    neutral: { icon: Minus, color: 'text-gray-400 bg-gray-400/10 border-gray-400/30', label: 'Neutral' },
  };
  
  const StanceIcon = stanceConfig[stance].icon;
  
  return (
    <div className={cn(
      "glass-panel rounded-2xl p-6 transition-all duration-500 relative overflow-hidden flex flex-col",
      isActive ? `ring-2 ring-white/20 shadow-[0_0_30px_rgba(255,255,255,0.05)] scale-[1.02]` : "opacity-70 scale-100",
      colorClass.split(' ')[2],
      isExpanded ? "min-h-[500px]" : "min-h-[260px]"
    )}>
      
      {/* Position Change Indicator */}
      {positionChanged && (
        <div className="absolute top-0 right-0 bg-yellow-500/20 text-yellow-300 text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1 animate-pulse">
          <RefreshCw className="w-3 h-3" /> Position Changed
        </div>
      )}
      
      {/* Stance Indicator */}
      {hasContent && (
        <div className={cn(
          "absolute top-4 right-4 px-3 py-1.5 rounded-lg border flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider",
          stanceConfig[stance].color
        )}>
          <StanceIcon className="w-3.5 h-3.5" />
          {stanceConfig[stance].label}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center border",
            colorClass.split(' ').slice(0, 2).join(' ')
          )}>
            {status === 'thinking' ? (
               <Brain className="w-5 h-5 animate-pulse" />
            ) : (
               <User className="w-5 h-5" />
            )}
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-black text-white/90 tracking-tight">{name}</h3>
            <span className={cn("text-[10px] font-black uppercase tracking-widest", retryMessage ? 'text-amber-400 animate-pulse' : colorClass.split(' ')[0])}>
              {retryMessage ? 'Rate Limited' : persona}
            </span>
          </div>
        </div>
        
        {hasContent && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-white/60" />
            ) : (
              <ChevronDown className="w-4 h-4 text-white/60" />
            )}
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col justify-start relative">
        {retryMessage ? (
          <div className="flex flex-col gap-2 items-center text-center animate-in fade-in zoom-in">
            <p className="text-xs font-medium text-amber-400/80 italic">{retryMessage}</p>
            <div className="flex gap-1">
              <div className="w-1 h-1 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1 h-1 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1 h-1 rounded-full bg-amber-500 animate-bounce" />
            </div>
          </div>
        ) : status === 'idle' && !answer ? (
          <div className="text-white/30 text-sm font-medium flex items-center justify-center h-full gap-2">
            Waiting for turn...
          </div>
        ) : status === 'thinking' ? (
          <div className="text-white/60 text-sm font-medium flex items-center gap-2 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin" /> Analyzing context...
          </div>
        ) : null}

        {hasContent && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Position */}
            <div className="bg-black/40 rounded-xl p-4 border border-white/5">
              <div className="flex justify-between items-center mb-3">
                <div className="text-xs text-white/40 uppercase tracking-widest font-semibold">
                  Position
                </div>
                {confidence !== undefined && confidence !== null && confidence >= 0 && (
                  <div className="text-xs text-white/60 font-bold">
                    {Math.round(confidence * 100)}% Confidence
                  </div>
                )}
              </div>
              <div className={cn(
                "text-base font-bold text-white break-words leading-relaxed",
                !isExpanded && "line-clamp-2"
              )}>
                {answer || 'N/A'}
              </div>
            </div>
            
            {/* Reasoning */}
            {reasoning && (
              <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                <div className="text-xs text-white/40 uppercase tracking-widest font-semibold mb-3">
                  Reasoning
                </div>
                <div className={cn(
                  "text-sm text-white/80 leading-relaxed whitespace-pre-wrap break-words",
                  !isExpanded && "line-clamp-3"
                )}>
                  {reasoning}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
