import type { Metadata } from "next";
import "./globals.css";
import SolanaProvider from "@/components/SolanaProvider";
import Link from 'next/link';
import WalletButton from "@/components/WalletButton";

export const metadata: Metadata = {
  title: "SWARMs Debate Primitive",
  description: "Autonomous agents deliberating on-chain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col selection:bg-blue-500/30">
        <SolanaProvider>
          <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl z-50 pointer-events-none">
            <div className="glass-panel px-8 py-3 flex justify-between items-center pointer-events-auto rounded-2xl border border-white/5 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] backdrop-blur-xl">
               <div className="font-black text-xl tracking-tighter text-white flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <Link href="/">SWARMs</Link>
               </div>
               <div className="flex gap-8 items-center">
                  <nav className="flex gap-6 items-center">
                    <Link href="/arena" className="text-[11px] uppercase tracking-widest font-black text-white/40 hover:text-white transition-all">Arena</Link>
                    <Link href="/sessions" className="text-[11px] uppercase tracking-widest font-black text-white/40 hover:text-white transition-all">Sessions</Link>
                    <Link href="/agents" className="text-[11px] uppercase tracking-widest font-black text-white/40 hover:text-white transition-all">Agents</Link>
                  </nav>
                  <div className="pl-6 border-l border-white/5">
                    <WalletButton />
                  </div>
               </div>
            </div>
          </div>
          <div className="flex-1 overflow-auto pt-12">
            {children}
          </div>
        </SolanaProvider>
      </body>
    </html>
  );
}
