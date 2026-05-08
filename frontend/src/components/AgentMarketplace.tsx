'use client';

import React, { useState } from 'react';
import { Plus, Search, Star, TrendingUp, ShieldCheck } from 'lucide-react';

interface CustomAgent {
  id: string;
  name: string;
  persona: string;
  description: string;
  creator: string;
  reputation: number;
  usage_count: number;
  is_official: boolean;
}

const OFFICIAL_AGENTS: CustomAgent[] = [
  {
    id: 'analyst-v1',
    name: 'Analyst Pro',
    persona: 'Analyst',
    description: 'Deep analytical capabilities for complex technical decisions',
    creator: 'SWARMs Official',
    reputation: 95,
    usage_count: 1250,
    is_official: true
  },
  {
    id: 'critic-v2',
    name: 'Critic Elite',
    persona: 'Critic',
    description: 'Advanced critical thinking with risk assessment focus',
    creator: 'SWARMs Official',
    reputation: 92,
    usage_count: 980,
    is_official: true
  },
  {
    id: 'advocate-v1',
    name: 'Advocate Plus',
    persona: 'Advocate',
    description: 'Persuasive advocacy with ethical reasoning',
    creator: 'SWARMs Official',
    reputation: 88,
    usage_count: 750,
    is_official: true
  },
  {
    id: 'skeptic-v2',
    name: 'Skeptic Prime',
    persona: 'Skeptic',
    description: 'Rigorous skepticism with evidence-based analysis',
    creator: 'SWARMs Official',
    reputation: 90,
    usage_count: 890,
    is_official: true
  },
];

const COMMUNITY_AGENTS: CustomAgent[] = [
  {
    id: 'legal-expert',
    name: 'Legal Expert',
    persona: 'Critic',
    description: 'Specialized in legal compliance and regulatory analysis',
    creator: 'community_user_123',
    reputation: 75,
    usage_count: 120,
    is_official: false
  },
  {
    id: 'financial-analyst',
    name: 'Financial Analyst',
    persona: 'Analyst',
    description: 'Expert in financial modeling and investment decisions',
    creator: 'crypto_whale',
    reputation: 82,
    usage_count: 340,
    is_official: false
  },
];

export default function AgentMarketplace() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'official' | 'community'>('official');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredAgents = (selectedTab === 'official' ? OFFICIAL_AGENTS : COMMUNITY_AGENTS).filter(
    agent => 
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.persona.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="glass-panel p-8 rounded-2xl border border-white/5">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <Star className="w-5 h-5 text-purple-400" />
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">Agent Marketplace</h3>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-bold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Agent
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="text"
          placeholder="Search agents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-black/30 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSelectedTab('official')}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
            selectedTab === 'official'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'bg-white/5 text-white/40 hover:bg-white/10'
          }`}
        >
          Official Agents
        </button>
        <button
          onClick={() => setSelectedTab('community')}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
            selectedTab === 'community'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'bg-white/5 text-white/40 hover:bg-white/10'
          }`}
        >
          Community Agents
        </button>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAgents.map((agent) => (
          <div
            key={agent.id}
            className="bg-white/5 rounded-xl p-5 border border-white/5 hover:border-purple-500/30 transition-all hover:bg-white/10 group"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-white">{agent.name}</h4>
                  {agent.is_official && (
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                  )}
                </div>
                <p className="text-xs text-purple-400 font-medium">{agent.persona}</p>
              </div>
              <div className="flex items-center gap-1 text-yellow-400">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-bold">{agent.reputation}</span>
              </div>
            </div>
            
            <p className="text-sm text-white/60 mb-4 line-clamp-2">{agent.description}</p>
            
            <div className="flex items-center justify-between text-xs text-white/40">
              <span>by {agent.creator}</span>
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {agent.usage_count} uses
              </span>
            </div>
            
            <button className="w-full mt-4 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 py-2 rounded-lg font-bold text-sm transition-colors">
              Use Agent
            </button>
          </div>
        ))}
      </div>

      {/* Create Agent Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel p-8 rounded-2xl border border-white/10 max-w-lg w-full">
            <h3 className="text-xl font-bold text-white mb-6">Create Custom Agent</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider font-bold mb-2 block">
                  Agent Name
                </label>
                <input
                  type="text"
                  placeholder="My Custom Agent"
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider font-bold mb-2 block">
                  Persona Type
                </label>
                <select className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50">
                  <option>Analyst</option>
                  <option>Critic</option>
                  <option>Advocate</option>
                  <option>Skeptic</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider font-bold mb-2 block">
                  Description
                </label>
                <textarea
                  placeholder="Describe what this agent specializes in..."
                  rows={3}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg font-bold transition-colors"
                >
                  Cancel
                </button>
                <button className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-lg font-bold transition-colors">
                  Create Agent
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
