import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SolanaProvider from "@/components/SolanaProvider";
import Link from 'next/link';

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
          <div className="fixed top-0 left-0 w-full p-6 flex justify-between items-center z-50 pointer-events-none">
             <div className="font-bold text-xl tracking-tighter text-white pointer-events-auto">
                <Link href="/">SWARMs</Link>
             </div>
             <div className="flex gap-4 pointer-events-auto items-center">
                <Link href="/arena" className="text-sm font-medium text-white/50 hover:text-white transition-colors">Arena</Link>
                <Link href="/sessions" className="text-sm font-medium text-white/50 hover:text-white transition-colors">Sessions</Link>
                <Link href="/agents" className="text-sm font-medium text-white/50 hover:text-white transition-colors">Agents</Link>
                {/* Dynamically load the wallet connect button later */}
             </div>
          </div>
          {children}
        </SolanaProvider>
      </body>
    </html>
  );
}
