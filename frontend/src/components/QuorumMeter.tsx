import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface QuorumMeterProps {
  confidence: number;
  threshold?: number;
}

export default function QuorumMeter({ confidence, threshold = 0.75 }: QuorumMeterProps) {
  const isReached = confidence >= threshold;
  const percentage = Math.round(confidence * 100);
  const threshPercentage = Math.round(threshold * 100);

  return (
    <div className="flex flex-col items-center justify-center p-6 glass-panel rounded-2xl w-full max-w-sm mx-auto">
      <div className="text-sm font-bold tracking-widest uppercase text-white/50 mb-6">Quorum Consensus</div>
      
      <div className="relative w-40 h-40 flex items-center justify-center">
        {/* Background Track */}
        <svg className="absolute w-full h-full transform -rotate-90">
          <circle 
            cx="80" cy="80" r="70" 
            fill="none" 
            stroke="rgba(255,255,255,0.05)" 
            strokeWidth="8" 
          />
          {/* Progress fill */}
          <circle 
            cx="80" cy="80" r="70" 
            fill="none" 
            stroke={isReached ? "#4ade80" : "#3b82f6"} 
            strokeWidth="10" 
            strokeDasharray={440}
            strokeDashoffset={440 - (440 * percentage) / 100}
            className="transition-all duration-1000 ease-in-out"
            strokeLinecap="round"
          />
          {/* Threshold marker */}
          <circle 
            cx="80" cy="80" r="70" 
            fill="none" 
            stroke="rgba(255,0,0,0.5)" 
            strokeWidth="12" 
            strokeDasharray={`2 ${440 - 2}`}
            strokeDashoffset={440 - (440 * threshPercentage) / 100}
          />
        </svg>

        <div className="flex flex-col items-center justify-center">
          <span className={cn(
            "text-4xl font-bold tracking-tighter transition-colors duration-500",
            isReached ? "text-green-400" : "text-white"
          )}>
            {percentage}%
          </span>
          <span className="text-xs text-white/40 mt-1 font-medium bg-black/40 px-2 py-0.5 rounded-full border border-white/5">
            Req {threshPercentage}%
          </span>
        </div>
      </div>
      
      <div className={cn(
        "mt-6 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider transition-all duration-500 border",
        isReached 
          ? "bg-green-500/20 text-green-400 border-green-500/30 shadow-[0_0_15px_rgba(74,222,128,0.3)]" 
          : "bg-white/5 text-white/50 border-white/10"
      )}>
        {isReached ? 'Status: Quorum Reached' : 'Status: No Quorum'}
      </div>
    </div>
  );
}
