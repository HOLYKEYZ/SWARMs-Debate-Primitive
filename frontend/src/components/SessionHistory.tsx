import React from 'react';
import { History, ChevronRight } from 'lucide-react';

interface Session {
  session_id: string;
  question: string;
  status: string;
  mechanism: string;
  created_at: string;
  final_answer?: string;
}

interface SessionHistoryProps {
  sessions: Session[];
  onSelect: (id: string) => void;
  activeId?: string;
}

export default function SessionHistory({ sessions, onSelect, activeId }: SessionHistoryProps) {
  return (
    <div className="flex flex-col gap-6 w-full md:w-80 shrink-0">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <History className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40">Recent Sessions</h3>
        </div>
        <div className="text-[10px] font-bold text-white/20 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
          {sessions.length}
        </div>
      </div>
      
      <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-3 custom-scrollbar">
        {sessions.length === 0 && (
          <div className="p-10 border border-dashed border-white/5 rounded-3xl text-center flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
               <History className="w-5 h-5 text-white/10" />
            </div>
            <p className="text-[11px] text-white/20 font-medium tracking-wide">No deliberation history</p>
          </div>
        )}
        
        {sessions.map((s) => (
          <button
            key={s.session_id}
            onClick={() => onSelect(s.session_id)}
            className={`
              group relative p-5 rounded-[2rem] border text-left transition-all duration-500 overflow-hidden
              ${activeId === s.session_id ? 
                'bg-[#0a0a0a] border-blue-500/40 shadow-[0_20px_50px_-20px_rgba(37,99,235,0.2)]' : 
                'bg-[#080808] border-white/[0.03] hover:border-white/10 hover:bg-[#0a0a0a]'}
            `}
          >
            {activeId === s.session_id && (
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
            )}

            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-full border ${
                  s.mechanism === 'debate' ? 'text-purple-400 border-purple-500/20 bg-purple-500/5' : 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5'
                }`}>
                  {s.mechanism}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-white/20">
                   {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {s.status === 'complete' ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                )}
              </div>
            </div>
            
            <p className="text-[13px] font-bold text-white/70 leading-relaxed mb-4 group-hover:text-white transition-colors line-clamp-2">
              {s.question}
            </p>
            
            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-1.5">
                   {[1,2,3].map(i => (
                     <div key={i} className="w-4 h-4 rounded-full border border-black bg-white/5" />
                   ))}
                </div>
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">4 Agents</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 text-blue-500 transition-all duration-500 ${activeId === s.session_id ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'}`} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
