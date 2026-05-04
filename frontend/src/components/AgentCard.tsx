import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Brain, User, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

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
  
  const colorClass = personaColors[persona] || 'text-white border-white/30 bg-white/5';
  
  return (
    <div className={cn(
      "glass-panel rounded-2xl p-6 transition-all duration-500 relative overflow-hidden flex flex-col h-full",
      isActive ? `ring-2 ring-white/20 shadow-[0_0_30px_rgba(255,255,255,0.05)] scale-[1.02]` : "opacity-70 scale-100",
      colorClass.split(' ')[2] // apply background tint
    )}>
      
      {/* Position Change Indicator */}
      {positionChanged && (
        <div className="absolute top-0 right-0 bg-yellow-500/20 text-yellow-300 text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1 animate-pulse">
          <RefreshCw className="w-3 h-3" /> Position Changed
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
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
          <h3 className="text-sm font-black text-white/90 tracking-tight group-hover:text-white transition-colors">{name}</h3>
          <span className={cn("text-[10px] font-black uppercase tracking-widest", retryMessage ? 'text-amber-400 animate-pulse' : colorClass.split(' ')[0])}>
            {retryMessage ? 'Rate Limited' : persona}
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col justify-center min-h-[60px] relative">
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

        {(status === 'responded' || answer) && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="bg-black/40 rounded-xl p-4 border border-white/5">
              <div className="text-xs text-white/40 uppercase tracking-widest font-semibold mb-2 flex justify-between">
                <span>Position</span>
                {confidence && <span className="text-white/60">{(confidence * 100).toFixed(0)}% Conf</span>}
              </div>
              <div className="text-lg font-bold text-white">{answer || 'N/A'}</div>
            </div>
            
            {reasoning && (
              <div className="text-sm text-white/70 leading-relaxed border-l-2 border-white/10 pl-3">
                {reasoning}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
