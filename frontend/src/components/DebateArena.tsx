"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import AgentCard from './AgentCard';
import MetaAgentBanner from './MetaAgentBanner';
import QuorumMeter from './QuorumMeter';
import ChainReceipt from './ChainReceipt';
import LivePipeline from './LivePipeline';
import SessionHistory from './SessionHistory';
import ConsensusReport from './ConsensusReport';
import DebateGraph from './DebateGraph';
import { Send, Loader2, Play, Gauge, Users, Radio } from 'lucide-react';
import { apiUrl } from '@/lib/api';

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
  final_answer?: string;
  quorum_reached?: boolean;
  [key: string]: unknown;
}

interface ChainReceiptData {
  signature: string;
  explorer_url: string;
  verified?: boolean;
}

interface SynthesisReportData {
  summary: string;
  agreement: string[];
  disagreement: string[];
  synthesis: string;
}

interface SessionRecord {
  session_id: string;
  question: string;
  status: string;
  mechanism: string;
  created_at: string;
  final_answer?: string;
}

interface AgentState {
  persona: string;
  status: 'idle' | 'thinking' | 'responded';
  answer?: string;
  reasoning?: string;
  confidence?: number;
  positionChanged?: boolean;
  retryMessage?: string;
}

export default function DebateArena() {
  const [question, setQuestion] = useState("");
  const [rounds, setRounds] = useState<number>(3);
  const [quorumThreshold, setQuorumThreshold] = useState<number>(0.75);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPersonas, setShowPersonas] = useState(true);
  
  const [status, setStatus] = useState<string>("idle");
  const [statusMessage, setStatusMessage] = useState<string>("ready for a new swarm run");
  const [currentRound, setCurrentRound] = useState<number | null>(null);
  const [messages, setMessages] = useState<EventData[]>([]);
  
  // state from events
  const [selectorResult, setSelectorResult] = useState<SelectorResult | null>(null);
  const [quorumResult, setQuorumResult] = useState<QuorumResult | null>(null);
  const [chainReceipt, setChainReceipt] = useState<ChainReceiptData | null>(null);
  const [synthesisReport, setSynthesisReport] = useState<SynthesisReportData | null>(null);
  
  // agents state
  const [agents, setAgents] = useState<Record<string, AgentState>>({});

  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/api/sessions"));
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  }, []);

  const loadSession = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(apiUrl(`/api/session/${sessionId}`));
      const data = await res.json();

      setSelectorResult(data.selector_result);

      setQuorumResult({
        quorum_reached: data.quorum_reached,
        final_answer: data.final_answer,
        winning_answer: data.winning_answer,
        confidence_score: data.confidence_score ?? 0,
      });

      setChainReceipt(data.chain_signature ? {
        signature: data.chain_signature,
        explorer_url: `https://explorer.solana.com/tx/${data.chain_signature}?cluster=devnet`,
      } : null);

      setSynthesisReport(data.synthesis_report);
      setMessages(data.transcript_data?.rounds?.flatMap((r: any) => r.responses) || []);
      // Don't clear agents - preserve their responses
      if (data.status === 'complete') {
        setAgents({});
      }
      setStatus(data.status === 'complete' ? 'complete' : 'idle');
      setStatusMessage(data.status === 'complete' ? 'Session complete' : 'Session loaded');
      setCurrentRound(null);
      setActiveSessionId(sessionId);

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    } catch (err) {
      console.error("Failed to load session", err);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHistory();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [fetchHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || status === "running") return;

    // reset state
    setSelectorResult(null);
    setQuorumResult(null);
    setChainReceipt(null);
    setSynthesisReport(null);
    setMessages([]);
    setAgents({});
    setStatus("submitting");
    setStatusMessage("creating session...");
    setCurrentRound(null);

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const res = await fetch(apiUrl("/api/session"), {
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
    setActiveSessionId(id);
    const streamUrl = apiUrl(`/api/session/${id}/stream`);
    console.log("Connecting to SSE:", streamUrl);
    const es = new EventSource(streamUrl);
    eventSourceRef.current = es;

    es.onopen = () => {
      console.log("SSE connection opened");
    };

    es.onerror = (error) => {
      console.error("SSE connection error:", error);
      console.error("EventSource readyState:", es.readyState);
      es.close();
      setStatus("failed");
      setStatusMessage("Connection failed");
    };

    const consumeEvent = (eventType: string, rawData: string) => {
      try {
        const payload = JSON.parse(rawData);

        if (eventType === "heartbeat") return;

        const normalizedPayload = {
          event: payload.event ?? eventType,
          data: payload.data ?? payload,
          timestamp: payload.timestamp ?? new Date().toISOString(),
        };

        setMessages((prev) => [...prev, normalizedPayload]);
          handleEvent(normalizedPayload.event, normalizedPayload.data);

          if (normalizedPayload.event === "session_complete" || normalizedPayload.event === "error") {
            es.close();
            setStatus(normalizedPayload.event === "error" ? "failed" : "complete");
            fetchHistory();
          }
        } catch (e) {
          console.error("Error parsing SSE data", e);
        }
      };

    const eventTypes = [
      "status",
      "selector_decision",
      "debate_start",
      "vote_start",
      "round_start",
      "agent_thinking",
      "agent_response",
      "agent_retry",
      "round_complete",
      "quorum_result",
      "synthesis_report",
      "transcript_hashed",
      "chain_receipt",
      "chain_error",
      "session_complete",
      "error",
      "heartbeat",
    ];

    eventTypes.forEach((eventType) => {
      es.addEventListener(eventType, (event) => consumeEvent(eventType, event.data));
    });

    es.onmessage = (event) => consumeEvent("message", event.data);

    es.onerror = () => {
      console.log("SSE Connection closed or error");
      es.close();
      setStatus((currentStatus) => currentStatus === "running" ? "complete" : currentStatus);
    };
  };

  // Reconnect to SSE when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && activeSessionId && status === 'running') {
        console.log("Tab became visible, reconnecting to SSE");
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
        // Fetch current session state to catch up
        loadSession(activeSessionId);
        // Reconnect to SSE for live updates
        connectSSE(activeSessionId);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeSessionId, status, loadSession]);

  const handleEvent = (eventType: string, data: Record<string, unknown>) => {
    const agentName = typeof data.agent === "string" ? data.agent : null;

    if (eventType === "selector_decision") {
      setSelectorResult({
        mechanism: typeof data.mechanism === "string" ? data.mechanism : undefined,
        reasoning: typeof data.reasoning === "string" ? data.reasoning : undefined,
        confidence: typeof data.confidence === "number" ? data.confidence : undefined,
        source: typeof data.source === "string" ? data.source : undefined,
      });
    }

    if (eventType === "status" && typeof data.status === "string") {
      setStatus(data.status);
      setStatusMessage(typeof data.message === "string" ? data.message : data.status);
    }

    if (eventType === "round_start" && typeof data.round === "number") {
      setCurrentRound(data.round);
    }
    
    if (eventType === "debate_start" || eventType === "vote_start") {
       const initialAgents: Record<string, AgentState> = {};
       (data.agents as Array<{ name: string; persona: string }>).forEach((a) => {
           initialAgents[a.name] = {
               persona: a.persona,
               status: 'idle'
           };
       });
       setAgents(initialAgents);
    }

    if (eventType === "agent_thinking" && agentName) {
       setAgents(prev => ({
           ...prev,
           [agentName]: { ...prev[agentName], status: 'thinking', positionChanged: false }
       }));
    }

    if (eventType === "agent_response" && agentName) {
       setAgents(prev => ({
           ...prev,
           [agentName]: { 
               ...prev[agentName], 
               status: 'responded',
               answer: typeof data.answer === "string" ? data.answer : undefined,
               reasoning: typeof data.reasoning === "string" ? data.reasoning : undefined,
               confidence: typeof data.confidence === "number" ? data.confidence : undefined,
               positionChanged: Boolean(data.position_changed),
               retryMessage: undefined
           }
       }));
    }

    if (eventType === "agent_retry" && agentName) {
       setAgents(prev => ({
           ...prev,
           [agentName]: { 
               ...prev[agentName], 
               status: 'thinking',
               retryMessage: typeof data.message === "string" ? data.message : undefined
           }
       }));
    }

    if (eventType === "quorum_result") {
       setQuorumResult({
         ...data,
         confidence_score: typeof data.confidence_score === "number" ? data.confidence_score : 0,
         final_answer: typeof data.final_answer === "string" ? data.final_answer : undefined,
         quorum_reached: typeof data.quorum_reached === "boolean" ? data.quorum_reached : undefined,
       });
    }

    if (eventType === "chain_receipt") {
       if (typeof data.signature === "string" && typeof data.explorer_url === "string") {
         setChainReceipt({ signature: data.signature, explorer_url: data.explorer_url });
       }
    }

    if (eventType === "synthesis_report") {
       setSynthesisReport({
         summary: typeof data.summary === "string" ? data.summary : "",
         agreement: Array.isArray(data.agreement) ? data.agreement.filter((item): item is string => typeof item === "string") : [],
         disagreement: Array.isArray(data.disagreement) ? data.disagreement.filter((item): item is string => typeof item === "string") : [],
         synthesis: typeof data.synthesis === "string" ? data.synthesis : "",
       });
    }
  };

  const isIdle = status === "idle";
  const isRunning = ["submitting", "selecting", "running", "synthesizing", "hashing", "chain"].includes(status);

  // pre-fill agent layout if no agents are running yet to show empty boxes
  const renderedAgents = Object.keys(agents).length > 0 
    ? Object.entries(agents).map(([name, state]) => ({ name, ...state }))
    : [
        { name: "Agent_1_Analyst", persona: "Analyst", status: 'idle' as const },
        { name: "Agent_2_Critic", persona: "Critic", status: 'idle' as const },
        { name: "Agent_3_Advocate", persona: "Advocate", status: 'idle' as const },
        { name: "Agent_4_Skeptic", persona: "Skeptic", status: 'idle' as const },
      ];
  const transcriptHash = messages.find((m) => m.event === 'transcript_hashed')?.data.hash;

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-10 pb-20 items-start px-6 overflow-x-hidden">
      
      {/* Left Sidebar: History */}
      <div className="hidden xl:block sticky top-32 w-80 flex-shrink-0">
        <SessionHistory
          sessions={history}
          onSelect={(id) => {
             loadSession(id);
          }}
          activeId={activeSessionId || undefined}
        />
      </div>

      <div className="flex-1 flex flex-col gap-10 w-full min-w-0 overflow-x-hidden">
        {/* Header & Pipeline */}
        <div className="flex flex-col gap-6 w-full">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2 break-words">Deliberation Console</h1>
                <p className="text-sm text-white/40 font-medium break-words">{statusMessage}</p>
              </div>
              {isRunning && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Live</span>
                </div>
              )}
           </div>

           <div className="grid grid-cols-3 gap-3">
             <div className="glass-panel rounded-lg p-4 min-w-0">
               <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/30 font-black mb-2">
                 <Radio className="w-3 h-3 text-blue-400" /> status
               </div>
               <div className="text-sm font-bold text-white capitalize break-words">{status}</div>
             </div>
             <div className="glass-panel rounded-lg p-4 min-w-0">
               <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/30 font-black mb-2">
                 <Users className="w-3 h-3 text-emerald-400" /> agents
               </div>
               <div className="text-sm font-bold text-white">{renderedAgents.length} online</div>
             </div>
             <div className="glass-panel rounded-lg p-4 min-w-0">
               <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/30 font-black mb-2">
                 <Gauge className="w-3 h-3 text-amber-400" /> round
               </div>
               <div className="text-sm font-bold text-white break-words">{currentRound === null ? "standby" : `round ${currentRound}`}</div>
             </div>
           </div>
           
           {(status !== 'idle' || activeSessionId) && (
             <div className="p-1">
               <LivePipeline currentStatus={status} />
             </div>
           )}
        </div>

        {/* Input Section */}
      <div className="glass-panel p-6 rounded-lg border-white/10 animate-in fade-in slide-in-from-top-4 duration-700 overflow-hidden w-full">
        <h2 className="text-sm font-bold tracking-widest uppercase text-white/50 mb-4 flex items-center gap-2">
            <Play className="w-4 h-4" /> Start Deliberation
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
          <div className="flex flex-col gap-4 w-full">
            <textarea 
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={isRunning}
              rows={4}
              placeholder="e.g. Should we deploy this smart contract to mainnet?"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-white/20 resize-y font-sans leading-relaxed overflow-y-auto custom-scrollbar"
              style={{ minHeight: '120px', maxHeight: '400px' }}
            />
            <div className="flex justify-end w-full">
              <button 
                type="submit" 
                disabled={isRunning || !question.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white px-6 sm:px-10 py-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all min-w-[160px] flex-shrink-0"
              >
                {isRunning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {isRunning ? 'Processing...' : 'Submit'}
              </button>
            </div>
          </div>
          
          {/* Settings Toggles */}
          <div className="flex flex-wrap gap-4 justify-between items-center mt-2">
            <button 
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-white/40 hover:text-white transition-colors flex items-center gap-1"
            >
              {showAdvanced ? "Hide Advanced Settings" : "Show Advanced Settings"}
            </button>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={showPersonas}
                onChange={(e) => setShowPersonas(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50"
              />
              <span className="text-xs text-white/40 hover:text-white transition-colors">Show Personas</span>
            </label>
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
            <div className="flex flex-wrap gap-2 mt-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar w-full">
               <button 
                 type="button"
                 onClick={() => setQuestion("CODE AUDIT:\n\n```rust\n#[program]\npub mod vault {\n  pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {\n    // no owner check\n    **ctx.accounts.vault.try_borrow_mut_lamports()? -= amount;\n    **ctx.accounts.user.try_borrow_mut_lamports()? += amount;\n    Ok(())\n  }\n}\n```\n\nShould this smart contract be deployed to devnet? Identify any vulnerabilities.")}
                 className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20 transition-colors whitespace-nowrap"
               >
                 Try Demo: Smart Contract Audit
               </button>
               <button 
                 type="button"
                 onClick={() => setQuestion("Is 25 x 4 + 10 equal to 110?")}
                 className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 transition-colors whitespace-nowrap"
               >
                 Try Demo: Simple Math (Vote)
               </button>
               <button 
                 type="button"
                 onClick={() => setQuestion("Should a country implement Universal Basic Income? Consider economic impact, inflation risks, work incentive effects, and social welfare benefits. There are valid arguments on both sides.")}
                 className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-colors whitespace-nowrap"
               >
                 Try Demo: UBI Debate (Tie Scenario)
               </button>
               <button 
                 type="button"
                 onClick={() => setQuestion("Should a messaging app implement client-side scanning for illegal content to protect children, even if it requires analyzing all user messages and could be abused for surveillance?")}
                 className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-colors whitespace-nowrap"
               >
                 Try Demo: Privacy vs Security (Split Decision)
               </button>
               <button 
                 type="button"
                 onClick={() => setQuestion("DAO GOVERNANCE PROPOSAL:\n\nProposal: Should our DAO allocate 50,000 tokens to fund a new DeFi protocol integration?\n\nArguments FOR:\n- Expands ecosystem utility\n- Potential revenue generation\n- Attracts new users\n\nArguments AGAINST:\n- High risk, unproven protocol\n- Dilutes treasury reserves\n- Better opportunities exist\n\nShould this proposal be approved?")}
                 className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 transition-colors whitespace-nowrap"
               >
                 Try Demo: DAO Governance
               </button>
               <button 
                 type="button"
                 onClick={() => setQuestion("MEDICAL DIAGNOSIS:\n\nPatient presents with persistent headaches, occasional vision changes, and fatigue. MRI shows a 2cm lesion in the frontal lobe.\n\nOptions:\nA. Immediate surgical resection\nB. Biopsy first, then treatment plan\nC. Watchful waiting with regular monitoring\nD. Radiation therapy\n\nConsidering the risks, success rates, and patient quality of life, what is the best course of action?")}
                 className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 border border-pink-500/20 transition-colors whitespace-nowrap"
               >
                 Try Demo: Medical Decision
               </button>
               <button 
                 type="button"
                 onClick={() => setQuestion("INVESTMENT DECISION:\n\nStartup seeking $2M seed round at $10M valuation.\n\nPros:\n- Experienced founding team (ex-Google, ex-Meta)\n- Proprietary AI technology\n- $500K ARR with 200% MoM growth\n- Strong early customer traction\n\nCons:\n- Competitive market with big players\n- High burn rate ($300K/month)\n- Technology not yet patented\n- Dependence on third-party APIs\n\nShould we invest? If yes, at what valuation and terms?")}
                 className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/20 transition-colors whitespace-nowrap"
               >
                 Try Demo: Investment Decision
               </button>
            </div>
          )}
        </form>
      </div>

      {/* Agents Arena - MOVED UP FOR BETTER VISIBILITY DURING DELIBERATION */}
      {(isRunning || !isIdle) && (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-4">
             <div className="h-px flex-1 bg-white/5" />
             <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 whitespace-nowrap">Swarm Deliberation</h2>
             <div className="h-px flex-1 bg-white/5" />
          </div>
          
          {/* Debate Graph Visualization */}
          <DebateGraph agents={agents} round={currentRound} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {renderedAgents.map((agent) => (
              <div key={agent.name} className="min-w-0">
                <AgentCard 
                  name={agent.name}
                  persona={showPersonas ? agent.persona : ''}
                  status={agent.status}
                  answer={agent.answer}
                  reasoning={agent.reasoning}
                  confidence={agent.confidence}
                  isActive={agent.status === 'thinking'}
                  positionChanged={agent.positionChanged}
                  retryMessage={agent.retryMessage}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meta-Agent Selector Banner */}
      {selectorResult && (
        <MetaAgentBanner {...selectorResult} />
      )}

        {/* Quorum / Receipt Section */}
        {(quorumResult || synthesisReport) && (
          <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700 mt-8">
             {quorumResult && <QuorumMeter confidence={quorumResult.confidence_score} threshold={quorumThreshold} />}

             {quorumResult?.final_answer && (
               <div className="glass-panel rounded-lg p-5 border-white/10">
                 <div className="text-[10px] uppercase tracking-widest text-white/35 font-black mb-2">
                   final result
                 </div>
                 <p className="text-base font-semibold leading-relaxed text-white">
                   {quorumResult.final_answer}
                 </p>
               </div>
             )}
             
             {synthesisReport && (
               <ConsensusReport {...synthesisReport} />
             )}
             
             {chainReceipt && (
                <ChainReceipt 
                  signature={chainReceipt.signature}
                  hash={typeof transcriptHash === "string" ? transcriptHash : ''}
                  explorerUrl={chainReceipt.explorer_url}
                />
             )}
          </div>
        )}

      </div>
    </div>
  );
}
