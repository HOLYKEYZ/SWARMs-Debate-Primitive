"use client";

import React, { useEffect, useState } from 'react';
import { Database, ShieldCheck, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { apiUrl } from '@/lib/api';

interface SessionRecord {
  session_id: string;
  question: string;
  status: string;
  mechanism: string;
  transcript_hash?: string;
  chain_signature?: string;
  chain_verified?: boolean;
  created_at: string;
  final_answer?: string;
  quorum_reached?: boolean;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl("/api/sessions"))
      .then(res => res.json())
      .then(data => {
        setSessions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load sessions", err);
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen pt-32 px-6 flex flex-col items-center relative overflow-hidden pb-20">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-5xl mb-12 flex flex-col items-center text-center">
         <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-4 text-[10px] uppercase tracking-widest font-bold text-white/50">
            <Database className="w-3 h-3 text-purple-400" /> AUDIT TRAIL
         </div>
         <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Governance History
         </h1>
         <p className="text-white/50 max-w-2xl">
            A complete, tamper-proof record of all agent deliberations. Every consensus reached is hashed and verified on the Solana Devnet.
         </p>
      </div>

      <div className="w-full max-w-5xl flex flex-col gap-6">
        {loading ? (
          <div className="flex justify-center py-20">
             <Loader2 className="w-8 h-8 text-white/30 animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20 text-white/40">
             No sessions found. <Link href="/arena" className="text-blue-400 hover:underline">Start a deliberation</Link>.
          </div>
        ) : (
          sessions.map((session) => (
            <div key={session.session_id} className="glass-panel p-6 rounded-2xl flex flex-col gap-4 transition-all hover:border-white/10">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
                <div>
                   <h3 className="text-lg font-bold text-white line-clamp-1">{session.question || 'N/A'}</h3>
                   <div className="flex items-center gap-4 mt-2">
                     <span className="text-xs text-white/40 font-mono">{new Date(session.created_at).toLocaleString()}</span>
                     <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider ${
                        session.mechanism === 'debate' ? 'bg-purple-500/20 text-purple-300' : 
                        session.mechanism === 'vote' ? 'bg-green-500/20 text-green-300' :
                        'bg-white/10 text-white/50'
                     }`}>
                        {session.mechanism || 'Pending'}
                     </span>
                     <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider flex items-center gap-1 ${
                        session.quorum_reached ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
                        session.status === 'complete' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        'bg-blue-500/20 text-blue-400 animate-pulse border border-blue-500/30'
                     }`}>
                        {session.status === 'complete' 
                           ? (session.quorum_reached ? <><ShieldCheck className="w-3 h-3"/> QUORUM REACHED</> : 'QUORUM FAILED') 
                           : session.status}
                     </span>
                   </div>
                </div>
                
                {session.chain_signature && (
                  <a 
                    href={`https://explorer.solana.com/tx/${session.chain_signature}?cluster=devnet`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-black/40 hover:bg-black/60 border border-white/10 px-4 py-2 rounded-lg text-xs font-mono text-white/60 hover:text-white transition-colors whitespace-nowrap"
                  >
                    View TX <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                 <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                    <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-2">Final Consensus</div>
                    <div className="text-sm text-white/90 font-medium">
                       {session.final_answer || 'Still deliberating...'}
                    </div>
                 </div>
                 <div className="bg-black/20 rounded-xl p-4 border border-white/5 overflow-hidden">
                    <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-2">Transcript Hash</div>
                    <div className="font-mono text-xs text-white/60 break-all">
                       {session.transcript_hash || 'Pending...'}
                    </div>
                 </div>
              </div>

            </div>
          ))
        )}
      </div>
    </main>
  );
}
