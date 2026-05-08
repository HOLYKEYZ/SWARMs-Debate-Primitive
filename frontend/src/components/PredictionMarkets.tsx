'use client';

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Market {
  id: string;
  question: string;
  yes_odds: number;
  no_odds: number;
  volume: number;
  ends_in: string;
  status: 'active' | 'resolved' | 'pending';
  outcome?: 'yes' | 'no';
}

const MARKETS: Market[] = [
  {
    id: 'market-1',
    question: 'Will the agents recommend deploying the smart contract audit?',
    yes_odds: 65,
    no_odds: 35,
    volume: 12500,
    ends_in: '2h 30m',
    status: 'active'
  },
  {
    id: 'market-2',
    question: 'Will the debate reach consensus on the UBI question?',
    yes_odds: 45,
    no_odds: 55,
    volume: 8200,
    ends_in: '1h 15m',
    status: 'active'
  },
  {
    id: 'market-3',
    question: 'Will the Analyst agent change position during debate?',
    yes_odds: 30,
    no_odds: 70,
    volume: 5400,
    ends_in: '45m',
    status: 'active'
  },
  {
    id: 'market-4',
    question: 'Did the agents recommend the investment?',
    yes_odds: 80,
    no_odds: 20,
    volume: 15000,
    ends_in: '0m',
    status: 'resolved',
    outcome: 'yes'
  },
];

export default function PredictionMarkets() {
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [betAmount, setBetAmount] = useState(100);
  const [selectedOutcome, setSelectedOutcome] = useState<'yes' | 'no' | null>(null);

  const activeMarkets = MARKETS.filter(m => m.status === 'active');
  const resolvedMarkets = MARKETS.filter(m => m.status === 'resolved');

  return (
    <div className="glass-panel p-8 rounded-2xl border border-white/5">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
          <TrendingUp className="w-5 h-5 text-green-400" />
        </div>
        <h3 className="text-lg font-bold text-white tracking-tight">Prediction Markets</h3>
      </div>

      {/* Active Markets */}
      <div className="mb-8">
        <h4 className="text-xs font-black uppercase tracking-wider text-white/40 mb-4">
          Active Markets
        </h4>
        <div className="space-y-3">
          {activeMarkets.map((market) => (
            <div
              key={market.id}
              onClick={() => setSelectedMarket(market)}
              className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-green-500/30 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm text-white/70 group-hover:text-white transition-colors flex-1">
                  {market.question}
                </p>
                <div className="flex items-center gap-1 text-white/40 ml-4">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs">{market.ends_in}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-green-400 font-bold">YES</span>
                    <span className="text-sm font-bold text-white">{market.yes_odds}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${market.yes_odds}%` }}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-red-400 font-bold">NO</span>
                    <span className="text-sm font-bold text-white">{market.no_odds}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 rounded-full transition-all"
                      style={{ width: `${market.no_odds}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-3 text-xs text-white/40">
                Volume: ${market.volume.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resolved Markets */}
      {resolvedMarkets.length > 0 && (
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-white/40 mb-4">
            Resolved Markets
          </h4>
          <div className="space-y-3">
            {resolvedMarkets.map((market) => (
              <div
                key={market.id}
                className="bg-white/5 rounded-xl p-4 border border-white/5 opacity-60"
              >
                <div className="flex items-start justify-between mb-3">
                  <p className="text-sm text-white/70 flex-1">
                    {market.question}
                  </p>
                  <div className="flex items-center gap-2 ml-4">
                    {market.outcome === 'yes' ? (
                      <div className="flex items-center gap-1 text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs font-bold">YES</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-400">
                        <XCircle className="w-4 h-4" />
                        <span className="text-xs font-bold">NO</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-xs text-white/40">
                  Volume: ${market.volume.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Betting Modal */}
      {selectedMarket && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel p-8 rounded-2xl border border-white/10 max-w-lg w-full">
            <h3 className="text-xl font-bold text-white mb-4">Place Bet</h3>
            <p className="text-sm text-white/70 mb-6">{selectedMarket.question}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setSelectedOutcome('yes')}
                className={`p-4 rounded-xl border transition-all ${
                  selectedOutcome === 'yes'
                    ? 'bg-green-500/20 border-green-500 text-green-400'
                    : 'bg-white/5 border-white/10 text-white/40 hover:border-green-500/30'
                }`}
              >
                <div className="text-2xl font-bold mb-1">{selectedMarket.yes_odds}%</div>
                <div className="text-xs">YES</div>
              </button>
              <button
                onClick={() => setSelectedOutcome('no')}
                className={`p-4 rounded-xl border transition-all ${
                  selectedOutcome === 'no'
                    ? 'bg-red-500/20 border-red-500 text-red-400'
                    : 'bg-white/5 border-white/10 text-white/40 hover:border-red-500/30'
                }`}
              >
                <div className="text-2xl font-bold mb-1">{selectedMarket.no_odds}%</div>
                <div className="text-xs">NO</div>
              </button>
            </div>

            <div className="mb-6">
              <label className="text-xs text-white/40 uppercase tracking-wider font-bold mb-2 block">
                Bet Amount (tokens)
              </label>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(parseInt(e.target.value) || 0)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
              />
              {selectedOutcome && (
                <div className="mt-2 text-sm text-white/60">
                  Potential Return: ${Math.round(betAmount * (selectedOutcome === 'yes' ? selectedMarket.yes_odds : selectedMarket.no_odds) / 100).toLocaleString()}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedMarket(null);
                  setSelectedOutcome(null);
                }}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!selectedOutcome || betAmount <= 0}
                className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:hover:bg-green-600 text-white py-3 rounded-lg font-bold transition-colors"
              >
                Place Bet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
