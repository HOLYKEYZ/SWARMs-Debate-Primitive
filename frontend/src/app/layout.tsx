import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SolanaProvider from "@/components/SolanaProvider";
import Link from 'next/link';
import WalletButton from "@/components/WalletButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col selection:bg-blue-500/30">
        <SolanaProvider>
          <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-5xl z-50 pointer-events-none">
            <div className="glass-panel px-6 py-4 flex justify-between items-center pointer-events-auto rounded-full border border-white/10 shadow-2xl">
               <div className="font-bold text-2xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  <Link href="/">SWARMs</Link>
               </div>
               <div className="flex gap-6 items-center">
                  <Link href="/arena" className="text-sm font-semibold text-white/60 hover:text-white transition-colors">Arena</Link>
                  <Link href="/sessions" className="text-sm font-semibold text-white/60 hover:text-white transition-colors">Sessions</Link>
                  <Link href="/agents" className="text-sm font-semibold text-white/60 hover:text-white transition-colors">Agents</Link>
                  <div className="pl-4 border-l border-white/10">
                    <WalletButton />
                  </div>
               </div>
            </div>
          </div>
          {children}
        </SolanaProvider>
      </body>
    </html>
  );
}
