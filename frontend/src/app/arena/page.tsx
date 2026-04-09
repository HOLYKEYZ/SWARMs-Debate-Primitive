import DebateArena from '@/components/DebateArena';
import { Activity } from 'lucide-react';

export default function ArenaPage() {
  return (
    <main className="min-h-screen pt-32 px-6 flex flex-col items-center relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-6xl mb-12 flex flex-col items-center text-center">
         <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-4 text-[10px] uppercase tracking-widest font-bold text-white/50">
            <Activity className="w-3 h-3 text-red-500 animate-pulse" /> LIVE STREAM
         </div>
         <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Deliberation Arena
         </h1>
         <p className="text-white/50 max-w-2xl">
            Submit a complex problem and watch the swarm converge on a consensus through multi-round debate. All final results are verifiable on the Solana blockchain.
         </p>
      </div>

      <DebateArena />
    </main>
  );
}
