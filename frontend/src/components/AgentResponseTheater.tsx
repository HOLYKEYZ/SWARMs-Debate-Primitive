import React from 'react';
import { Brain, Coins, ShieldAlert, Sparkles, ThumbsDown, ThumbsUp, Trophy } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AgentResponseTheaterProps {
  name?: string;
  persona?: string;
  status?: 'idle' | 'thinking' | 'responded';
  answer?: string;
  reasoning?: string;
  confidence?: number;
  finalAnswer?: string;
  quorumReached?: boolean;
  modeLabel: string;
}

const personaThemes: Record<string, string> = {
  Analyst: 'from-cyan-500/25 via-blue-500/10 to-transparent border-cyan-400/30 text-cyan-300',
  Critic: 'from-rose-500/25 via-red-500/10 to-transparent border-rose-400/30 text-rose-300',
  Advocate: 'from-emerald-500/25 via-green-500/10 to-transparent border-emerald-400/30 text-emerald-300',
  Skeptic: 'from-amber-500/25 via-orange-500/10 to-transparent border-amber-400/30 text-amber-300',
};

function getEconomicOutcome(answer?: string, finalAnswer?: string, quorumReached?: boolean, confidence = 0) {
  if (!answer || !finalAnswer || quorumReached === undefined) {
    return { label: 'pending settlement', delta: 'awaiting quorum', positive: null as boolean | null };
  }

  if (!quorumReached) {
    return { label: 'coordination slash', delta: '-0.010 devnet SOL', positive: false };
  }

  const matched = answer.trim().toLowerCase() === finalAnswer.trim().toLowerCase();
  const amount = matched ? (0.01 + confidence * 0.04).toFixed(3) : (confidence * 0.025).toFixed(3);
  return matched
    ? { label: 'consensus reward', delta: `+${amount} devnet SOL`, positive: true }
    : { label: 'dissent slash', delta: `-${amount} devnet SOL`, positive: false };
}

export default function AgentResponseTheater({
  name,
  persona,
  status,
  answer,
  reasoning,
  confidence = 0,
  finalAnswer,
  quorumReached,
  modeLabel,
}: AgentResponseTheaterProps) {
  const theme = personaThemes[persona || ''] || 'from-purple-500/25 via-blue-500/10 to-transparent border-white/10 text-white';
  const settlement = getEconomicOutcome(answer, finalAnswer, quorumReached, confidence);
  const hasResponse = Boolean(answer || reasoning);

  return (
    <section className={cn('glass-panel relative overflow-hidden rounded-[2rem] border p-8 min-h-[520px]', theme)}>
      <div className="absolute inset-0 bg-gradient-to-br opacity-80 pointer-events-none" />
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="absolute -bottom-32 left-12 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-white/45">
              <Sparkles className="h-3.5 w-3.5 text-blue-300" /> {modeLabel} deliberation theater
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white md:text-5xl">
              {name || 'Select an agent'}
            </h2>
            <p className="mt-2 text-sm font-bold uppercase tracking-[0.3em] text-white/40">
              {persona || 'agent response viewer'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-[360px]">
            <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-white/35">status</div>
              <div className="mt-2 text-sm font-bold capitalize text-white">{status || 'idle'}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-white/35">confidence</div>
              <div className="mt-2 text-sm font-bold text-white">{Math.round(confidence * 100)}%</div>
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-300/80">
                <Coins className="h-3.5 w-3.5" /> stake
              </div>
              <div className="mt-2 text-sm font-black text-emerald-200">0.050 devnet SOL</div>
            </div>
          </div>
        </div>

        {!hasResponse ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-black/20 text-center">
            <Brain className="mb-4 h-10 w-10 animate-pulse text-white/30" />
            <p className="text-lg font-bold text-white/55">Waiting for agent intelligence...</p>
            <p className="mt-2 max-w-lg text-sm text-white/35">As agents respond, their complete reasoning appears here in a judge-readable command center view.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-black/35 p-6">
                <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-white/35">
                  <Trophy className="h-4 w-4 text-yellow-300" /> position
                </div>
                <p className="whitespace-pre-wrap break-words text-2xl font-black leading-relaxed text-white">
                  {answer || 'No position yet.'}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/25 p-6">
                <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-white/35">
                  <Brain className="h-4 w-4 text-blue-300" /> full reasoning
                </div>
                <p className="whitespace-pre-wrap break-words text-lg leading-9 text-white/80">
                  {reasoning || 'No reasoning received yet.'}
                </p>
              </div>
            </div>

            <aside className="space-y-4">
              <div className={cn('rounded-3xl border p-5', settlement.positive === false ? 'border-rose-400/30 bg-rose-400/10' : settlement.positive ? 'border-emerald-400/30 bg-emerald-400/10' : 'border-white/10 bg-black/25')}>
                <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/45">
                  {settlement.positive === false ? <ThumbsDown className="h-4 w-4 text-rose-300" /> : <ThumbsUp className="h-4 w-4 text-emerald-300" />}
                  economic settlement
                </div>
                <div className="text-2xl font-black text-white">{settlement.delta}</div>
                <div className="mt-2 text-xs font-bold uppercase tracking-widest text-white/45">{settlement.label}</div>
              </div>

              <div className="rounded-3xl border border-purple-400/20 bg-purple-400/10 p-5">
                <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-purple-200/80">
                  <ShieldAlert className="h-4 w-4" /> crypto primitive
                </div>
                <p className="text-sm leading-6 text-white/70">Transcript and reputation deltas are committed to Solana Devnet as verifiable memo artifacts after quorum.</p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}
