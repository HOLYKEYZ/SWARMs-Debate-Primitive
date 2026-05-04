import React from 'react';
import { History, Clock, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';

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
    <div className="flex flex-col gap-4 w-full md:w-72 shrink-0">
      <div className="flex items-center gap-2 px-2 text-white/50 mb-2">
        <History className="w-4 h-4" />
        <h3 className="text-xs font-black uppercase tracking-widest">Recent Sessions</h3>
      </div>
      
      <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {sessions.length === 0 && (
          <div className="p-8 border border-dashed border-white/10 rounded-2xl text-center">
            <p className="text-xs text-white/20 italic">No history yet</p>
          </div>
        )}
        
        {sessions.map((s) => (
          <button
            key={s.session_id}
            onClick={() => onSelect(s.session_id)}
            className={`
              group p-4 rounded-2xl border text-left transition-all duration-300
              ${activeId === s.session_id ? 
                'bg-blue-600/10 border-blue-500/50 shadow-[0_0_20px_rgba(37,99,235,0.1)]' : 
                'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/[0.07]'}
            `}
          >
            <div className="flex justify-between items-start mb-2">
              <span className={`text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded bg-black/40 ${s.mechanism === 'debate' ? 'text-purple-400' : 'text-green-400'}`}>
                {s.mechanism || 'Pending'}
              </span>
              {s.status === 'complete' ? (
                <CheckCircle2 className="w-3 h-3 text-green-500/50" />
              ) : s.status === 'failed' ? (
                <XCircle className="w-3 h-3 text-red-500/50" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              )}
            </div>
            
            <p className="text-sm font-bold text-white/80 line-clamp-2 mb-3 group-hover:text-white transition-colors">
              {s.question}
            </p>
            
            <div className="flex justify-between items-center text-[10px] text-white/30 font-medium">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <ChevronRight className={`w-3 h-3 transition-transform ${activeId === s.session_id ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'}`} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
