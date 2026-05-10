"use client";

import React from 'react';
import { X, User, Brain } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AgentResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  persona: string;
  answer?: string;
  reasoning?: string;
  confidence?: number;
}

const personaColors: Record<string, string> = {
  Analyst: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/5',
  Critic: 'text-red-400 border-red-400/30 bg-red-400/5',
  Advocate: 'text-green-400 border-green-400/30 bg-green-400/5',
  Skeptic: 'text-amber-400 border-amber-400/30 bg-amber-400/5',
};

export default function AgentResponseModal({
  isOpen,
  onClose,
  name,
  persona,
  answer,
  reasoning,
  confidence,
}: AgentResponseModalProps) {
  if (!isOpen) return null;

  const colorClass = personaColors[persona] || 'text-white border-white/30 bg-white/5';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto glass-panel p-8 rounded-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5 text-white/60" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/10">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center border-2",
            colorClass.split(' ').slice(0, 2).join(' ')
          )}>
            <Brain className="w-8 h-8" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-black text-white tracking-tight">{name}</h2>
            <span className={cn("text-xs font-black uppercase tracking-widest", colorClass.split(' ')[0])}>
              {persona}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Position */}
          <div className="bg-black/40 rounded-xl p-6 border border-white/5">
            <div className="flex justify-between items-center mb-4">
              <div className="text-xs text-white/40 uppercase tracking-widest font-semibold">
                Position
              </div>
              {confidence !== undefined && confidence !== null && (
                <div className="flex items-center gap-2">
                  <div className="text-xs text-white/40 uppercase tracking-widest font-semibold">
                    Confidence
                  </div>
                  <div className="text-lg font-bold text-white">
                    {Math.round(confidence * 100)}%
                  </div>
                </div>
              )}
            </div>
            <div className="text-2xl font-bold text-white leading-relaxed break-words">
              {answer || 'No response provided'}
            </div>
          </div>

          {/* Reasoning */}
          {reasoning && (
            <div className="bg-black/20 rounded-xl p-6 border border-white/5">
              <div className="text-xs text-white/40 uppercase tracking-widest font-semibold mb-4">
                Reasoning
              </div>
              <div className="text-lg text-white/90 leading-relaxed whitespace-pre-wrap break-words">
                {reasoning}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
