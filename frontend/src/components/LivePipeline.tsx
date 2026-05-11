import React from 'react';
import { CheckCircle2, Loader2, Sparkles, Binary, Link as LinkIcon, Database, AlertCircle } from 'lucide-react';

interface LivePipelineProps {
  currentStatus: string;
  errorStep?: string;
}

const steps = [
  { id: 'selecting', label: 'Mechanism Selection', icon: Sparkles },
  { id: 'running', label: 'Swarm Deliberation', icon: Binary },
  { id: 'synthesizing', label: 'Consensus Synthesis', icon: Database },
  { id: 'hashing', label: 'Transcript Hashing', icon: Database },
  { id: 'chain', label: 'On-Chain Proof', icon: LinkIcon },
];

export default function LivePipeline({ currentStatus, errorStep }: LivePipelineProps) {
  // map internal status to step index
  const getStepIndex = (status: string, errorStep?: string) => {
    if (status === 'selecting') return 0;
    if (status === 'running') return 1;
    if (status === 'synthesizing') return 2;
    if (status === 'hashing') return 3;
    if (status === 'chain') return 4;
    if (status === 'complete') return 5;
    if (status === 'error' && errorStep) {
      const stepIndex = steps.findIndex(s => s.id === errorStep);
      return stepIndex >= 0 ? stepIndex : -1;
    }
    return -1;
  };

  const currentIndex = getStepIndex(currentStatus, errorStep);

  return (
    <div className="w-full glass-panel p-4 rounded-2xl border-white/5 mb-8 overflow-x-auto">
      <div className="flex justify-between items-center gap-4 min-w-max">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isCompleted = currentIndex > index || currentStatus === 'complete';
        const isActive = currentIndex === index;
        const isError = currentStatus === 'error' && errorStep === step.id;
        
        return (
          <div key={step.id} className="flex items-center gap-3 relative group">
            <div className={`
              w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500
              ${isError ? 'bg-red-500/20 text-red-400' : 
                isCompleted ? 'bg-green-500/20 text-green-400' : 
                isActive ? 'bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.4)] text-white animate-pulse' : 
                'bg-white/5 text-white/20'}
            `}>
              {isError ? <AlertCircle className="w-5 h-5" /> : 
               isActive ? <Loader2 className="w-5 h-5 animate-spin" /> : 
               isCompleted ? <CheckCircle2 className="w-5 h-5" /> : 
               <Icon className="w-5 h-5" />}
            </div>
            
            <div className="flex flex-col">
              <span className={`text-[10px] uppercase tracking-widest font-black transition-colors ${isError ? 'text-red-400' : isActive ? 'text-blue-400' : isCompleted ? 'text-green-500/70' : 'text-white/20'}`}>
                Step 0{index + 1}
              </span>
              <span className={`text-sm font-bold transition-colors whitespace-nowrap ${isError ? 'text-red-400' : isActive ? 'text-white' : isCompleted ? 'text-white/60' : 'text-white/10'}`}>
                {step.label}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div className="w-8 h-[1px] bg-white/5 mx-2" />
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
}
