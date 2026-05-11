"use client";

import React, { useEffect, useState } from 'react';
import { Network, Trophy, Activity, Loader2, ArrowUpRight } from 'lucide-react';
import { apiUrl } from '@/lib/api';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';

interface AgentStat {
  persona: string;
  agent_id: string;
  reputation_score: number;
  sessions_participated: number;
}

const personaColors: Record<string, {text: string, border: string, bg: string, ring: string, grad: string, shadow: string}> = {
  Analyst: { text: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'bg-cyan-500/5', ring: 'group-hover:ring-cyan-500/50', grad: 'from-cyan-500/20 to-blue-500/5', shadow: 'hover:shadow-cyan-500/20' },
  Critic: { text: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-500/5', ring: 'group-hover:ring-rose-500/50', grad: 'from-rose-500/20 to-red-600/5', shadow: 'hover:shadow-rose-500/20' },
  Advocate: { text: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', ring: 'group-hover:ring-emerald-500/50', grad: 'from-emerald-500/20 to-green-600/5', shadow: 'hover:shadow-emerald-500/20' },
  Skeptic: { text: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/5', ring: 'group-hover:ring-amber-500/50', grad: 'from-amber-500/20 to-orange-600/5', shadow: 'hover:shadow-amber-500/20' },
  ExploitHunter: { text: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-500/5', ring: 'group-hover:ring-purple-500/50', grad: 'from-purple-500/20 to-fuchsia-600/5', shadow: 'hover:shadow-purple-500/20' },
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl("/api/agents"))
      .then(res => res.json())
      .then(data => {
        setAgents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load agents", err);
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen pt-40 px-6 flex flex-col items-center relative overflow-hidden pb-20">
      <div className="w-full max-w-5xl mb-16 flex flex-col items-center text-center z-10">
         <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/5 mb-6 text-[11px] uppercase tracking-[0.2em] font-bold text-white/40 backdrop-blur-md">
            <Network className="w-3.5 h-3.5 text-blue-400" /> PROVABLE IDENTITY
         </div>
         <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-6">
            Agent Reputation
         </h1>
         <p className="text-lg text-white/40 max-w-2xl font-medium leading-relaxed">
            Each AI persona is anchored by a persistent UUID. Their historical performance in driving toward consensus is tracked and cryptographically logged on the Solana Devnet.
         </p>
      </div>

      <div className="w-full max-w-5xl space-y-12">
        <AnalyticsDashboard />
        
        {loading ? (
          <div className="flex justify-center py-20">
             <Loader2 className="w-10 h-10 text-white/30 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 z-10 relative">
            {agents.map((agent, index) => {
              const theme = personaColors[agent.persona] || { text: 'text-white', border: 'border-white/30', bg: 'bg-white/5', ring: 'group-hover:ring-white/50', grad: 'from-white/10 to-transparent' };
              const reputationScore = Number.isFinite(agent.reputation_score) ? agent.reputation_score : 0;
              
              return (
                <div key={agent.agent_id} className={`group glass-panel relative overflow-hidden rounded-3xl transition-glass hover:-translate-y-1 hover:shadow-2xl ${theme.shadow} ring-1 ring-transparent ${theme.ring} border ${theme.border}`}>
                  {/* Huge background number */}
                  <div className="absolute -right-6 -bottom-10 text-[12rem] font-black text-white/[0.02] pointer-events-none select-none transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-3">
                    {index + 1}
                  </div>
                  
                  {/* Subtle top gradient glow */}
                  <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-b ${theme.grad} opacity-50 pointer-events-none`} />

                  <div className="relative p-8 flex flex-col h-full justify-between gap-8 z-10">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <h3 className={`text-3xl font-black tracking-tight ${theme.text} flex items-center gap-3 drop-shadow-md`}>
                          {agent.persona}
                          {index === 0 && <Trophy className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />}
                        </h3>
                        <div className="text-lg font-black text-white/20">
                          #{index + 1}
                        </div>
                      </div>
                      <div className="font-mono text-sm text-white/50 truncate bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5 inline-block max-w-full">
                        {agent.agent_id}
                      </div>
                    </div>

                    <div className="flex gap-6 items-end">
                      <div className="flex-1 bg-black/20 rounded-2xl p-4 border border-white/5">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2">Sessions</div>
                        <div className="text-2xl font-bold text-white flex items-center gap-2">
                          <Activity className="w-5 h-5 text-white/30" /> {agent.sessions_participated}
                        </div>
                      </div>
                      <div className={`flex-1 bg-gradient-to-br ${theme.bg} rounded-2xl p-4 border ${theme.border}`}>
                        <div className={`text-[10px] uppercase tracking-widest ${theme.text} opacity-70 font-bold mb-2`}>Reputation</div>
                        <div className={`text-3xl font-black ${theme.text} tracking-tighter`}>
                          {reputationScore > 0 ? '+' : ''}{reputationScore}
                        </div>
                      </div>
                    </div>

                    <a
                      href={`https://explorer.solana.com/address/${agent.agent_id}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-xs font-black uppercase tracking-widest text-white/45 transition-colors hover:text-white"
                    >
                      verify reputation trail <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
