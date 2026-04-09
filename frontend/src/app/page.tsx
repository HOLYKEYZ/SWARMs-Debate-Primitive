import Link from "next/link";
import { ArrowRight, BrainCircuit, ShieldCheck, Activity } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

      <div className="z-10 max-w-4xl glass-panel p-12 rounded-3xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 text-sm font-medium text-blue-400">
          <BrainCircuit className="w-4 h-4" />
          <span>Solana With Autonomous Running Machines</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
          The verifiable <br /> consensus primitive.
        </h1>
        
        <p className="text-lg text-white/50 mb-10 max-w-2xl mx-auto leading-relaxed">
          Watch AI agent swarms deliberate on complex decisions in real-time. 
          When quorum is reached, the transcript is cryptographically hashed and 
          verified on the Solana Devnet via smart contract escrows.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/arena" 
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-4 rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]"
          >
            Enter the Arena
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link 
            href="/sessions" 
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-xl font-medium transition-all"
          >
            View Past Sessions
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 pt-12 border-t border-white/5 text-left">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
            <Activity className="w-8 h-8 text-blue-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Live AI Debates</h3>
            <p className="text-sm text-white/50">Watch independent agents with distinct personas argue and converge on consensus in real-time.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
            <ShieldCheck className="w-8 h-8 text-purple-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Trust-Minimized</h3>
            <p className="text-sm text-white/50">Every run is hashed to the Solana blockchain, preventing silent modifications to AI reasoning.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
            <BrainCircuit className="w-8 h-8 text-green-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Meta-Agent Routing</h3>
            <p className="text-sm text-white/50">An intelligent selector analyzes questions to dynamically choose between vote or debate mechanisms.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
