import DebateArena from "@/components/DebateArena";
import { Activity, ShieldCheck, Workflow } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen pt-32 px-6 pb-20">
      <section className="w-full max-w-7xl mx-auto mb-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 border-b border-white/10 pb-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 border border-white/10 mb-5 text-[10px] uppercase tracking-widest font-bold text-white/50">
              <Activity className="w-3 h-3 text-red-400 animate-pulse" /> live multi-agent consensus
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white mb-5">
              SWARMs Debate Primitive
            </h1>
            <p className="text-lg text-white/55 max-w-2xl leading-relaxed">
              Submit a decision, watch specialized agents deliberate in real time, then preserve the final transcript with a verifiable Solana Devnet receipt when quorum is reached.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full lg:w-[360px]">
            <div className="glass-panel rounded-lg p-4">
              <Workflow className="w-5 h-5 text-blue-400 mb-4" />
              <div className="text-[10px] uppercase tracking-widest text-white/35 font-black mb-1">routing</div>
              <div className="text-sm font-bold text-white">vote or debate</div>
            </div>
            <div className="glass-panel rounded-lg p-4">
              <ShieldCheck className="w-5 h-5 text-emerald-400 mb-4" />
              <div className="text-[10px] uppercase tracking-widest text-white/35 font-black mb-1">proof</div>
              <div className="text-sm font-bold text-white">hashed transcript</div>
            </div>
          </div>
        </div>
      </section>

      <DebateArena />
    </main>
  );
}
