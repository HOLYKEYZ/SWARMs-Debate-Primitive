import React from 'react';
import { BookOpen, AlertCircle, CheckCircle, Lightbulb } from 'lucide-react';

interface ConsensusReportProps {
  summary: string;
  agreement: string[];
  disagreement: string[];
  synthesis: string;
}

export default function ConsensusReport({ summary, agreement, disagreement, synthesis }: ConsensusReportProps) {
  return (
    <div className="glass-panel p-8 rounded-[2.5rem] border-amber-500/20 bg-amber-500/5 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-amber-500/20 p-2 rounded-xl">
          <BookOpen className="w-5 h-5 text-amber-400" />
        </div>
        <h3 className="text-xl font-bold text-white tracking-tight">Consensus Synthesis Report</h3>
      </div>
      
      <p className="text-white/70 mb-8 leading-relaxed italic">
        {summary}
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-green-400 flex items-center gap-2">
            <CheckCircle className="w-3 h-3" /> Points of Agreement
          </h4>
          <ul className="flex flex-col gap-2">
            {agreement.length > 0 ? agreement.map((item, i) => (
              <li key={i} className="text-sm text-white/50 flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500/30 shrink-0" />
                {item}
              </li>
            )) : (
              <li className="text-sm text-white/30 italic">No agreement points identified</li>
            )}
          </ul>
        </div>
        
        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-3 h-3" /> Points of Contention
          </h4>
          <ul className="flex flex-col gap-2">
            {disagreement.length > 0 ? disagreement.map((item, i) => (
              <li key={i} className="text-sm text-white/50 flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-500/30 shrink-0" />
                {item}
              </li>
            )) : (
              <li className="text-sm text-white/30 italic">No contention points identified</li>
            )}
          </ul>
        </div>
      </div>
      
      <div className="bg-white/5 rounded-3xl p-6 border border-white/5 shadow-inner">
        <h4 className="text-xs font-black uppercase tracking-widest text-blue-400 flex items-center gap-2 mb-3">
          <Lightbulb className="w-3 h-3" /> The Synthesis (Recommended Action)
        </h4>
        <p className="text-white font-bold leading-relaxed">
          {synthesis}
        </p>
      </div>
    </div>
  );
}
