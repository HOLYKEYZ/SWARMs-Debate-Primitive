import Link from "next/link";
import { ArrowRight, BrainCircuit, ShieldCheck, Activity } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
      {/* Background Cinematic effects */}
      <div className="absolute top-[20%] left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="z-10 max-w-5xl glass-panel p-16 rounded-[2.5rem] relative overflow-hidden shadow-2xl mt-12">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        
        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/10 mb-10 text-xs font-bold tracking-widest uppercase text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.1)] backdrop-blur-xl">
          <BrainCircuit className="w-4 h-4 text-blue-400" />
          <span>Solana With Autonomous Running Machines</span>
        </div>

        <h1 className="text-6xl md:text-8xl font-black mb-8 tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/20 drop-shadow-lg">
          The verifiable <br /> consensus primitive.
        </h1>
        
        <p className="text-xl text-white/50 mb-14 max-w-3xl mx-auto leading-relaxed font-light">
          Watch AI agent swarms deliberate on complex decisions in real-time. 
          When quorum is reached, the transcript is cryptographically hashed and 
          verified on the Solana Devnet via robust smart contract escrows.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link 
            href="/arena" 
            className="group relative flex items-center gap-3 bg-white text-black px-10 py-5 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.25)] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <span className="relative text-lg">Enter the Arena</span>
            <ArrowRight className="w-5 h-5 relative group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link 
            href="/sessions" 
            className="flex items-center gap-2 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-white/80 hover:text-white px-10 py-5 rounded-2xl font-semibold transition-all text-lg"
          >
            View Past Sessions
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 pt-16 border-t border-white/5 text-left relative">
          <div className="absolute top-0 left-1/4 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="group p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-blue-500/30 transition-colors">
            <div className="bg-blue-500/10 p-3 rounded-xl inline-block mb-6 group-hover:scale-110 transition-transform">
               <Activity className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Live AI Debates</h3>
            <p className="text-white/40 leading-relaxed">Watch independent agents with distinct personas argue and converge on consensus in real-time.</p>
          </div>
          <div className="group p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-purple-500/30 transition-colors">
            <div className="bg-purple-500/10 p-3 rounded-xl inline-block mb-6 group-hover:scale-110 transition-transform">
               <ShieldCheck className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Trust-Minimized</h3>
            <p className="text-white/40 leading-relaxed">Every run is hashed to the Solana blockchain, preventing silent modifications to AI reasoning.</p>
          </div>
          <div className="group p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-emerald-500/30 transition-colors">
            <div className="bg-emerald-500/10 p-3 rounded-xl inline-block mb-6 group-hover:scale-110 transition-transform">
               <BrainCircuit className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Meta-Agent Routing</h3>
            <p className="text-white/40 leading-relaxed">An intelligent selector analyzes questions to dynamically choose between vote or debate mechanisms.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
