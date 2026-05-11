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
import { Send, Loader2, Play, Gauge, Users, Radio, Coins, ShieldAlert, Vote, History, X, RotateCcw } from 'lucide-react';
import { apiUrl } from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
  artifacts?: Array<{ type: string; signature: string; explorer_url: string }>;
}

interface AgentSettlement {
  persona: string;
  reputation_delta: number;
  stake_delta_sol: number;
  matched_consensus: boolean;
  explorer_url: string;
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
  agent_count?: number;
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

interface TranscriptResponse {
  name: string;
  persona: string;
  response: {
    answer?: string;
    reasoning?: string;
    confidence?: number;
  };
}

interface TranscriptRound {
  round: number;
  responses: TranscriptResponse[];
}

export default function DebateArena() {
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState<"general" | "dao" | "audit" | "bounty">("general");
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
  const [chainError, setChainError] = useState<string | null>(null);
  const [synthesisReport, setSynthesisReport] = useState<SynthesisReportData | null>(null);
  const [agentMemory, setAgentMemory] = useState<string | null>(null);
  const [settlements, setSettlements] = useState<AgentSettlement[]>([]);
  
  // agents state
  const [agents, setAgents] = useState<Record<string, AgentState>>({});
  const [selectedAgentName, setSelectedAgentName] = useState<string | null>(null);
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());

  const toggleExpanded = (name: string) => {
    setExpandedAgents((prev) => {
      return prev.has(name) ? new Set() : new Set([name]);
    });
    setSelectedAgentName(name);
  };

  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const autoLoadHistoryRef = useRef(true);

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
        artifacts: Array.isArray(data.artifacts) ? data.artifacts : [],
      } : null);
      setChainError(null);
      setSettlements(Array.isArray(data.settlements) ? data.settlements : []);

      setSynthesisReport(data.synthesis_report);

      setMessages(typeof data.transcript_hash === "string" ? [{
        event: "transcript_hashed",
        data: { hash: data.transcript_hash },
        timestamp: new Date().toISOString(),
      }] : []);

      // rebuild agent state from the final round so completed sessions still show responses
      const transcriptRounds: TranscriptRound[] = data.transcript_data?.rounds ?? [];
      const finalRound = transcriptRounds.length > 0 ? transcriptRounds[transcriptRounds.length - 1] : undefined;
      const responses: TranscriptResponse[] = finalRound?.responses ?? [];
      if (responses.length > 0) {
        const restored: Record<string, AgentState> = {};
        responses.forEach((r) => {
          restored[r.name] = {
            persona: r.persona,
            status: 'responded',
            answer: r.response?.answer,
            reasoning: r.response?.reasoning,
            confidence: r.response?.confidence,
          };
        });
        setAgents(restored);
        setSelectedAgentName(responses[0]?.name ?? null);
      } else {
        setAgents({});
        setSelectedAgentName(null);
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

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/api/sessions"));
      const data = await res.json();
      const successfulHistory: SessionRecord[] = Array.isArray(data) ? data : [];
      setHistory(successfulHistory);
      if (autoLoadHistoryRef.current && !activeSessionId && status === "idle" && successfulHistory.length > 0) {
        await loadSession(successfulHistory[0].session_id);
      }
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  }, [activeSessionId, loadSession, status]);

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
    setChainError(null);
    setSynthesisReport(null);
    setAgentMemory(null);
    setSettlements([]);
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

  const handleNewDeliberation = () => {
    autoLoadHistoryRef.current = false;
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setQuestion("");
    setSelectorResult(null);
    setQuorumResult(null);
    setChainReceipt(null);
    setChainError(null);
    setSynthesisReport(null);
    setAgentMemory(null);
    setSettlements([]);
    setMessages([]);
    setAgents({});
    setSelectedAgentName(null);
    setExpandedAgents(new Set());
    setCurrentRound(null);
    setActiveSessionId(null);
    setStatus("idle");
    setStatusMessage("ready for a new swarm run");
  };

  const handleEvent = useCallback((eventType: string, data: Record<string, unknown>) => {
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
      setSelectedAgentName((data.agents as Array<{ name: string; persona: string }>)[0]?.name ?? null);
    }

    if (eventType === "agent_thinking" && agentName) {
      setSelectedAgentName(agentName);
      setAgents(prev => ({
        ...prev,
        [agentName]: { ...prev[agentName], status: 'thinking', positionChanged: false }
      }));
    }

    if (eventType === "agent_response" && agentName) {
      setSelectedAgentName(agentName);
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
        setChainError(null);
      }
    }

    if (eventType === "artifact_receipt") {
      if (typeof data.type === "string" && typeof data.signature === "string" && typeof data.explorer_url === "string") {
        setChainReceipt(prev => prev ? {
          ...prev,
          artifacts: [...(prev.artifacts || []), { type: data.type as string, signature: data.signature as string, explorer_url: data.explorer_url as string }]
        } : prev);
      }
    }

    if (eventType === "agent_memory" && typeof data.memory === "string") {
      setAgentMemory(data.memory);
    }

    if (eventType === "agent_settlement") {
      setSettlements(prev => [...prev, {
        persona: typeof data.persona === "string" ? data.persona : "Agent",
        reputation_delta: typeof data.reputation_delta === "number" ? data.reputation_delta : 0,
        stake_delta_sol: typeof data.stake_delta_sol === "number" ? data.stake_delta_sol : 0,
        matched_consensus: Boolean(data.matched_consensus),
        explorer_url: typeof data.explorer_url === "string" ? data.explorer_url : "",
      }]);
    }

    if (eventType === "chain_error") {
      setChainError(typeof data.error === "string" ? data.error : "Chain write failed");
    }

    if (eventType === "synthesis_report") {
      setSynthesisReport({
        summary: typeof data.summary === "string" ? data.summary : "",
        agreement: Array.isArray(data.agreement) ? data.agreement.filter((item): item is string => typeof item === "string") : [],
        disagreement: Array.isArray(data.disagreement) ? data.disagreement.filter((item): item is string => typeof item === "string") : [],
        synthesis: typeof data.synthesis === "string" ? data.synthesis : "",
      });
    }
  }, []);

  const connectSSE = useCallback((id: string) => {
    setStatus("running");
    setActiveSessionId(id);
    const streamUrl = apiUrl(`/api/session/${id}/stream`);
    console.log("Connecting to SSE:", streamUrl);
    const es = new EventSource(streamUrl);
    eventSourceRef.current = es;

    es.onopen = () => {
      console.log("SSE connection opened");
    };

    const consumeEvent = (eventType: string, rawData: string) => {
      try {
        if (!rawData || rawData === "undefined") return;
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
      "artifact_receipt",
      "agent_memory",
      "agent_settlement",
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
      console.log("SSE error or connection closed, readyState:", es.readyState);
      
      // If connection is closed and we're still running, try to reconnect
      if (es.readyState === EventSource.CLOSED) {
        setStatus((currentStatus) => {
          if (currentStatus === "running") {
            console.log("SSE closed while running, will attempt reconnect on visibility");
            return "running"; // Keep status as running
          }
          return currentStatus === "running" ? "complete" : currentStatus;
        });
      }
    };
  }, [handleEvent, fetchHistory]);

  // reconnect to SSE when tab becomes visible (only for running sessions)
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isSessionRunning = ["submitting", "selecting", "running", "synthesizing", "hashing", "chain"].includes(status);
      if (document.visibilityState === 'visible' && activeSessionId && isSessionRunning) {
        console.log("Tab became visible, checking SSE connection");
        if (eventSourceRef.current && eventSourceRef.current.readyState !== EventSource.CLOSED) {
          console.log("SSE already connected, skipping reconnect");
          return;
        }
        // reconnect to SSE for live updates only if session is still running
        console.log("Reconnecting to SSE for running session");
        connectSSE(activeSessionId);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeSessionId, connectSSE, status]);

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
        { name: "Agent_5_ExploitHunter", persona: "ExploitHunter", status: 'idle' as const },
      ];
  const selectedAgent = renderedAgents.find((agent) => agent.name === selectedAgentName) ?? renderedAgents.find((agent) => agent.status === 'thinking') ?? renderedAgents.find((agent) => agent.answer) ?? renderedAgents[0];
  const modeConfig = {
    general: {
      label: "Swarm",
      title: "Deliberation Console",
      placeholder: "e.g. Should we deploy this smart contract to mainnet?",
      badge: "ai quorum primitive",
    },
    dao: {
      label: "DAO",
      title: "DAO Governance War Room",
      placeholder: "Paste a DAO proposal, treasury action, or tokenholder vote...",
      badge: "pre-vote proposal oracle",
    },
    audit: {
      label: "Audit",
      title: "Exploit Hunter Chamber",
      placeholder: "Paste smart contract code or protocol design for adversarial swarm review...",
      badge: "red-team security swarm",
    },
    bounty: {
      label: "Bounty",
      title: "Escrow-Backed Question Market",
      placeholder: "Post a question with a devnet SOL bounty for quorum-backed resolution...",
      badge: "bounty marketplace shell",
    },
  }[mode];
  const transcriptHash = messages.find((m) => m.event === 'transcript_hashed')?.data.hash;
  const hasOnChainReceipt = Boolean(chainReceipt);
  const hasStakeSettlements = settlements.length > 0;
  const shouldShowSynthesisReport = Boolean(
    synthesisReport && !synthesisReport.summary.toLowerCase().includes('api ') && !synthesisReport.summary.toLowerCase().includes('error')
  );

  // map persona -> latest settlement so each agent card shows its real stake delta
  const settlementByPersona = settlements.reduce<Record<string, AgentSettlement>>((acc, s) => {
    acc[s.persona] = s;
    return acc;
  }, {});

  return (
    <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-6 pb-20 items-start px-4 sm:px-6 overflow-x-hidden">

      {/* History toggle drawer (collapsed by default to reclaim side space) */}
      <div className="w-full flex flex-wrap justify-end gap-2">
        {(activeSessionId || !isIdle) && (
          <button
            type="button"
            onClick={handleNewDeliberation}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-400/20 bg-blue-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-blue-200 hover:bg-blue-500/20 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            New deliberation
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowHistory((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition"
        >
          {showHistory ? <X className="h-3.5 w-3.5" /> : <History className="h-3.5 w-3.5" />}
          {showHistory ? 'Hide history' : `Session history (${history.length})`}
        </button>
      </div>

      {showHistory && (
        <div className="w-full glass-panel rounded-2xl border border-white/10 p-4 animate-in fade-in slide-in-from-top-2">
          <SessionHistory
            sessions={history}
            onSelect={(id) => {
              loadSession(id);
              setShowHistory(false);
            }}
            activeId={activeSessionId || undefined}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col gap-10 w-full min-w-0 overflow-x-hidden">
        {/* Header & Pipeline */}
        <div className="flex flex-col gap-6 w-full">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div className="min-w-0 flex-1">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-blue-200">
                  <Vote className="h-3.5 w-3.5" /> {modeConfig.badge}
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2 break-words">{modeConfig.title}</h1>
                <p className="text-sm text-white/40 font-medium break-words">{statusMessage}</p>
              </div>
              {isRunning && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Live</span>
                </div>
              )}
           </div>

           <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
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
             <div className="glass-panel rounded-lg p-4 min-w-0">
               <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/30 font-black mb-2">
                 <Coins className="w-3 h-3 text-green-400" /> stake
               </div>
               <div className="text-sm font-bold text-white">{hasStakeSettlements ? `${settlements.length} settled` : 'not settled'}</div>
             </div>
             <div className="glass-panel rounded-lg p-4 min-w-0">
               <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/30 font-black mb-2">
                 <ShieldAlert className="w-3 h-3 text-purple-400" /> proof
               </div>
               <div className="text-sm font-bold text-white">{hasOnChainReceipt ? 'on-chain verified' : 'not written'}</div>
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {([
                ["general", "General Swarm"],
                ["dao", "DAO Governance"],
                ["audit", "Exploit Hunt"],
                ["bounty", "SOL Bounty"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  className={`rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-widest transition-all ${mode === value ? 'border-blue-400/50 bg-blue-500/20 text-blue-100' : 'border-white/10 bg-black/20 text-white/35 hover:text-white/70'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {mode === "bounty" && (
              <div className="rounded-2xl border border-green-400/20 bg-green-400/10 p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-green-200/80">bounty marketplace</div>
                <p className="mt-2 text-sm leading-6 text-white/65">This run will emit a Devnet bounty-resolution artifact after quorum. Full escrow transfer requires the deployed Anchor program id and IDL.</p>
              </div>
            )}

            <textarea 
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={isRunning}
              rows={4}
              placeholder={modeConfig.placeholder}
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
                 onClick={() => { setMode("general"); setQuestion("AGI should be open-sourced immediately upon creation."); }}
                 className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 transition-colors whitespace-nowrap"
               >
                 Try Demo: AGI Open Source Debate
               </button>
               <button 
                 type="button"
                 onClick={() => { setMode("audit"); setQuestion("CODE AUDIT:\n\n```rust\n#[program]\npub mod vault {\n  pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {\n    // no owner check\n    **ctx.accounts.vault.try_borrow_mut_lamports()? -= amount;\n    **ctx.accounts.user.try_borrow_mut_lamports()? += amount;\n    Ok(())\n  }\n}\n```\n\nShould this smart contract be deployed to devnet? Identify any vulnerabilities, exploit paths, and mitigations."); }}
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
                 onClick={() => { setMode("dao"); setQuestion("DAO GOVERNANCE PROPOSAL:\n\nProposal: Should our DAO allocate 50,000 tokens to fund a new DeFi protocol integration?\n\nArguments FOR:\n- Expands ecosystem utility\n- Potential revenue generation\n- Attracts new users\n\nArguments AGAINST:\n- High risk, unproven protocol\n- Dilutes treasury reserves\n- Better opportunities exist\n\nBefore tokenholder voting opens, should this proposal be approved, rejected, or revised? Include treasury risk, governance attack surface, and safeguards."); }}
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
          
          <DebateGraph agents={agents} round={currentRound} />

          {agentMemory && (
            <div className="rounded-3xl border border-purple-400/20 bg-purple-400/10 p-5">
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-200/80">agent memory injected</div>
              <div className="mt-3 flex flex-col gap-2 text-sm leading-6 text-white/70">
                {agentMemory.split('\n').filter((line) => line.startsWith('- ')).map((line) => (
                  <div key={line} className="line-clamp-2 break-words rounded-xl border border-white/5 bg-black/20 px-3 py-2">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 w-full items-start">
            {renderedAgents.map((agent) => {
              const settlement = settlementByPersona[agent.persona];
              const isExpanded = expandedAgents.has(agent.name);
              return (
                <div key={agent.name} className={cn("min-w-0", isExpanded && "sm:col-span-2 lg:col-span-3 xl:col-span-5")}>
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
                    selected={selectedAgent?.name === agent.name}
                    onSelect={() => toggleExpanded(agent.name)}
                    finalAnswer={quorumResult?.final_answer}
                    quorumReached={quorumResult?.quorum_reached}
                    stakeDelta={settlement?.stake_delta_sol}
                    settled={Boolean(settlement)}
                    expanded={isExpanded}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Meta-Agent Selector Banner */}
      {selectorResult && (
        <MetaAgentBanner {...selectorResult} />
      )}

        {/* Quorum / Receipt Section */}
        {(quorumResult || shouldShowSynthesisReport || chainReceipt || chainError) && (
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
             
             {shouldShowSynthesisReport && synthesisReport && (
               <ConsensusReport {...synthesisReport} />
             )}
             
             {chainReceipt && (
                <ChainReceipt 
                  signature={chainReceipt.signature}
                  hash={typeof transcriptHash === "string" ? transcriptHash : ''}
                  explorerUrl={chainReceipt.explorer_url}
                  artifacts={chainReceipt.artifacts}
                  settlements={settlements}
                />
             )}

             {chainError && !chainReceipt && (
               <div className="glass-panel rounded-lg border border-amber-400/20 bg-amber-400/10 p-5">
                 <div className="text-[10px] uppercase tracking-widest text-amber-200/80 font-black mb-2">
                   crypto receipt pending
                 </div>
                 <p className="text-sm leading-6 text-white/70">
                   Consensus completed, but the Solana Devnet write did not return a receipt for this run: {chainError}
                 </p>
               </div>
             )}
          </div>
        )}

      </div>
    </div>
  );
}
