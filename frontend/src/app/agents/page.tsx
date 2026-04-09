"use client";

import React, { useEffect, useState } from 'react';
import { Network, Trophy, Activity, Loader2 } from 'lucide-react';

interface AgentStat {
  persona: string;
  agent_id: string;
  reputation_score: number;
  sessions_participated: number;
}

const personaColors: Record<string, string> = {
  Analyst: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10',
  Critic: 'text-red-400 border-red-400/30 bg-red-400/10',
  Advocate: 'text-green-400 border-green-400/30 bg-green-400/10',
  Skeptic: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/agents")
      .then(res => res.json())
      .then(data => {
        setAgents(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load agents", err);
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen pt-32 px-6 flex flex-col items-center relative overflow-hidden pb-20">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-4xl mb-12 flex flex-col items-center text-center">
         <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-4 text-[10px] uppercase tracking-widest font-bold text-white/50">
            <Network className="w-3 h-3 text-blue-400" /> PROVABLE IDENTITY
         </div>
         <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Agent Reputation
         </h1>
         <p className="text-white/50 max-w-2xl">
            Each AI persona has a persistent UUID. Their historical performance in finding consensus is tracked and logged on the Solana Devnet.
         </p>
      </div>

      <div className="w-full max-w-4xl flex flex-col gap-4">
        {loading ? (
          <div className="flex justify-center py-20">
             <Loader2 className="w-8 h-8 text-white/30 animate-spin" />
          </div>
        ) : (
          agents.map((agent, index) => {
            const colorClass = personaColors[agent.persona] || 'text-white border-white/30 bg-white/10';
            const bgTint = colorClass.split(' ')[2];
            
            return (
              <div key={agent.agent_id} className={`glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:scale-[1.01] ${bgTint}`}>
                <div className="flex items-center gap-6 w-full md:w-auto">
                   <div className="text-3xl font-bold text-white/20 w-8 text-center">
                      #{index + 1}
                   </div>
                   <div>
                     <h3 className="text-xl font-bold text-white flex items-center gap-2">
                       {agent.persona}
                       {index === 0 && <Trophy className="w-4 h-4 text-yellow-400" />}
                     </h3>
                     <div className="font-mono text-xs text-white/40 mt-1 break-all bg-black/40 px-2 py-1 rounded inline-block">
                       {agent.agent_id}
                     </div>
                   </div>
                </div>

                <div className="flex gap-8 w-full md:w-auto justify-between md:justify-end border-t border-white/10 md:border-t-0 pt-4 md:pt-0 mt-2 md:mt-0">
                   <div className="text-center">
                      <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Sessions</div>
                      <div className="text-xl font-bold text-white flex items-center justify-center gap-1">
                        <Activity className="w-4 h-4 text-white/30" /> {agent.sessions_participated}
                      </div>
                   </div>
                   <div className="text-center">
                      <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Reputation</div>
                      <div className={`text-2xl font-bold ${colorClass.split(' ')[0]}`}>
                        {agent.reputation_score > 0 ? '+' : ''}{agent.reputation_score}
                      </div>
                   </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
