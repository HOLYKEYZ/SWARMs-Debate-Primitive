"use client";

import React, { useState, useEffect, useRef } from 'react';
import AgentCard from './AgentCard';
import MetaAgentBanner from './MetaAgentBanner';
import QuorumMeter from './QuorumMeter';
import ChainReceipt from './ChainReceipt';
import LivePipeline from './LivePipeline';
import SessionHistory from './SessionHistory';
import ConsensusReport from './ConsensusReport';
import { Send, Loader2, Play, LayoutGrid } from 'lucide-react';

interface EventData {
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
}

interface SelectorResult {
  mechanism?: string;
  reasoning?: string;
  confidence?: number;
  source?: string;
}

interface QuorumResult {
  confidence_score: number;
  [key: string]: unknown;
}

interface ChainReceiptData {
  signature: string;
  explorer_url: string;
}

export default function DebateArena() {
  const [question, setQuestion] = useState("");
  const [rounds, setRounds] = useState<number>(3);
  const [quorumThreshold, setQuorumThreshold] = useState<number>(0.75);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [status, setStatus] = useState<string>("idle");
  const [messages, setMessages] = useState<EventData[]>([]);
  
  // State from events
  const [selectorResult, setSelectorResult] = useState<SelectorResult | null>(null);
  const [quorumResult, setQuorumResult] = useState<QuorumResult | null>(null);
  const [chainReceipt, setChainReceipt] = useState<ChainReceiptData | null>(null);
  const [synthesisReport, setSynthesisReport] = useState<any | null>(null);
  
  // Agents State
  const [agents, setAgents] = useState<{
      [name: string]: {
          persona: string;
          status: 'idle' | 'thinking' | 'responded';
          answer?: string;
          reasoning?: string;
          confidence?: number;
          positionChanged?: boolean;
          retryMessage?: string;
      }
  }>({});

  const [history, setHistory] = useState<any[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    fetchHistory();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/sessions");
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || status === "running") return;

    // Reset state
    setSelectorResult(null);
    setQuorumResult(null);
    setChainReceipt(null);
    setSynthesisReport(null);
    setMessages([]);
    setAgents({});
    setStatus("submitting");

    try {
      const res = await fetch("http://localhost:8000/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
           question,
           rounds: rounds,
           quorum_threshold: quorumThreshold
        }),
      });
      const data = await res.json();
      connectSSE(data.session_id);
    } catch (err) {
      console.error("Failed to start session", err);
      setStatus("failed");
    }
  };

  const connectSSE = (id: string) => {
    setStatus("running");
    const es = new EventSource(`http://localhost:8000/api/session/${id}/stream`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        
        if (payload.event === "heartbeat") return;

        setMessages((prev) => [...prev, payload]);
        
        handleEvent(payload.event, payload.data);

        if (payload.event === "session_complete" || payload.event === "error") {
          es.close();
          setStatus(payload.event === "error" ? "failed" : "complete");
          fetchHistory(); // Refresh history
        }
      } catch (e) {
        console.error("Error parsing SSE data", e);
      }
    };

    es.onerror = () => {
      console.log("SSE Connection closed or error");
      es.close();
      if (status === "running") {
         setStatus("complete");
      }
    };
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEvent = (eventType: string, data: Record<string, unknown> | any) => {
    if (eventType === "selector_decision") {
      setSelectorResult(data);
    }
    
    if (eventType === "debate_start" || eventType === "vote_start") {
       // eslint-disable-next-line @typescript-eslint/no-explicit-any
       const initialAgents: Record<string, any> = {};
       // eslint-disable-next-line @typescript-eslint/no-explicit-any
       (data.agents as any[]).forEach((a: any) => {
           initialAgents[a.name] = {
               persona: a.persona,
               status: 'idle'
           };
       });
       setAgents(initialAgents);
    }

    if (eventType === "agent_thinking") {
       setAgents(prev => ({
           ...prev,
           [data.agent]: { ...prev[data.agent], status: 'thinking', positionChanged: false }
       }));
    }

    if (eventType === "agent_response") {
       setAgents(prev => ({
           ...prev,
           [data.agent]: { 
               ...prev[data.agent], 
               status: 'responded',
               answer: data.answer,
               reasoning: data.reasoning,
               confidence: data.confidence,
               positionChanged: data.positionChanged,
               retryMessage: undefined
           }
       }));
    }

    if (eventType === "agent_retry") {
       setAgents(prev => ({
           ...prev,
           [data.agent]: { 
               ...prev[data.agent], 
               status: 'thinking',
               retryMessage: data.message
           }
       }));
    }

    if (eventType === "quorum_result") {
       setQuorumResult(data);
    }

    if (eventType === "chain_receipt") {
       setChainReceipt(data);
    }

    if (eventType === "synthesis_report") {
       setSynthesisReport(data);
    }
  };

  const isIdle = status === "idle";
  const isRunning = status === "running" || status === "submitting";

  // Pre-fill agent layout if no agents are running yet to show empty boxes
  const renderedAgents = Object.keys(agents).length > 0 
    ? Object.entries(agents).map(([name, state]) => ({ name, ...state }))
    : [
        { name: "Agent_1_Analyst", persona: "Analyst", status: 'idle' as const },
        { name: "Agent_2_Critic", persona: "Critic", status: 'idle' as const },
        { name: "Agent_3_Advocate", persona: "Advocate", status: 'idle' as const },
        { name: "Agent_4_Skeptic", persona: "Skeptic", status: 'idle' as const },
      ];

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-12 pb-20 items-start pt-32 px-6">
      
      {/* Left Sidebar: History */}
      <div className="hidden lg:block sticky top-32">
        <SessionHistory 
          sessions={history} 
          onSelect={(id) => {
             setActiveSessionId(id);
          }} 
          activeId={activeSessionId || undefined} 
        />
      </div>

      <div className="flex-1 flex flex-col gap-10 w-full max-w-4xl">
        {/* Header & Pipeline */}
        <div className="flex flex-col gap-6">
           <div className="flex justify-between items-end">
              <div>
                <h1 className="text-4xl font-black tracking-tighter text-white mb-2">Arena</h1>
                <p className="text-sm text-white/30 font-medium">Provable multi-agent deliberation</p>
              </div>
              {sessionActive && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Live</span>
                </div>
              )}
           </div>
           
           {(status !== 'idle' || activeSessionId) && (
             <div className="p-1">
               <LivePipeline currentStatus={status} />
             </div>
           )}
        </div>

        {/* Input Section */}
      <div className="glass-panel p-6 rounded-2xl border-white/10 animate-in fade-in slide-in-from-top-4 duration-700">
        <h2 className="text-sm font-bold tracking-widest uppercase text-white/50 mb-4 flex items-center gap-2">
            <Play className="w-4 h-4" /> Start Deliberation
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-4">
            <textarea 
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={isRunning}
              rows={question.includes('\n') ? Math.min(question.split('\n').length, 10) : 1}
              placeholder="e.g. Should we deploy this smart contract to mainnet?"
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-white/20 resize-none font-sans leading-relaxed"
            />
            <div className="flex justify-end">
              <button 
                type="submit" 
                disabled={isRunning || !question.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white px-10 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all min-w-[160px]"
              >
                {isRunning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {isRunning ? 'Processing...' : 'Submit'}
              </button>
            </div>
          </div>
          
          {/* Advanced Settings Toggle */}
          <div className="flex justify-between items-center mt-2">
            <button 
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-white/40 hover:text-white transition-colors flex items-center gap-1"
            >
              {showAdvanced ? "Hide Advanced Settings" : "Show Advanced Settings"}
            </button>
          </div>

          {/* Advanced Settings Panel */}
          {showAdvanced && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
               <div className="flex flex-col gap-2">
                  <label className="text-xs text-white/50 uppercase tracking-wider font-bold">
                     Debate Rounds: {rounds}
                  </label>
                  <input 
                     type="range" 
                     min="1" 
                     max="5" 
                     step="1"
                     value={rounds}
                     onChange={(e) => setRounds(parseInt(e.target.value))}
                     className="w-full accent-blue-500"
                  />
                  <span className="text-[10px] text-white/30">Number of deliberation cycles before finalizing consensus.</span>
               </div>
               
               <div className="flex flex-col gap-2">
                  <label className="text-xs text-white/50 uppercase tracking-wider font-bold">
                     Quorum Threshold: {Math.round(quorumThreshold * 100)}%
                  </label>
                  <input 
                     type="range" 
                     min="0.51" 
                     max="1.0" 
                     step="0.01"
                     value={quorumThreshold}
                     onChange={(e) => setQuorumThreshold(parseFloat(e.target.value))}
                     className="w-full accent-green-500"
                  />
                  <span className="text-[10px] text-white/30">Percentage of agents required to agree.</span>
               </div>
            </div>
          )}

          {!isRunning && isIdle && (
            <div className="flex gap-2 mt-4">
               <button 
                 type="button"
                 onClick={() => setQuestion("CODE AUDIT:\n\n```rust\n#[program]\npub mod vault {\n  pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {\n    // No owner check\n    **ctx.accounts.vault.try_borrow_mut_lamports()? -= amount;\n    **ctx.accounts.user.try_borrow_mut_lamports()? += amount;\n    Ok(())\n  }\n}\n```\n\nShould this smart contract be deployed to devnet? Identify any vulnerabilities.")}
                 className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20 transition-colors"
               >
                 Try Demo: Smart Contract Audit
               </button>
               <button 
                 type="button"
                 onClick={() => setQuestion("Is 25 x 4 + 10 equal to 110?")}
                 className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 transition-colors"
               >
                 Try Demo: Simple Math (Vote)
               </button>
            </div>
          )}
        </form>
      </div>

      {/* Meta-Agent Selector Banner */}
      {selectorResult && (
        <MetaAgentBanner {...selectorResult} />
      )}

      {/* Agents Arena */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderedAgents.map((agent) => (
          <AgentCard 
            key={agent.name}
            name={agent.name}
            persona={agent.persona}
            status={agent.status}
            answer={agent.answer}
            reasoning={agent.reasoning}
            confidence={agent.confidence}
            isActive={agent.status === 'thinking'}
            positionChanged={agent.positionChanged}
            retryMessage={agent.retryMessage}
          />
        ))}
      </div>

        {/* Quorum / Receipt Section */}
        {(quorumResult || synthesisReport) && (
          <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700 mt-8">
             {quorumResult && <QuorumMeter confidence={quorumResult.confidence_score} />}
             
             {synthesisReport && (
               <ConsensusReport {...synthesisReport} />
             )}
             
             {chainReceipt && (
                <ChainReceipt 
                  signature={chainReceipt.signature}
                  hash={messages.find(m => m.event === 'transcript_hashed')?.data.hash || ''}
                  explorerUrl={chainReceipt.explorer_url}
                />
             )}
          </div>
        )}

      </div>
    </div>
  );
}
