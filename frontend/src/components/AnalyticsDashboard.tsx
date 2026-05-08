'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { apiUrl } from '@/lib/api';

interface Session {
  session_id: string;
  question: string;
  status: string;
  mechanism: string;
  created_at: string;
  final_answer?: string;
}

interface AnalyticsData {
  total_sessions: number;
  completed_sessions: number;
  debate_count: number;
  vote_count: number;
  avg_confidence: number;
  quorum_rate: number;
}

export default function AnalyticsDashboard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessionsRes] = await Promise.all([
          fetch(apiUrl('/api/sessions')),
        ]);
        
        const sessionsData = await sessionsRes.json();
        setSessions(sessionsData);

        // Calculate analytics
        const completed = sessionsData.filter((s: Session) => s.status === 'complete').length;
        const debates = sessionsData.filter((s: Session) => s.mechanism === 'debate').length;
        const votes = sessionsData.filter((s: Session) => s.mechanism === 'vote').length;
        
        setAnalytics({
          total_sessions: sessionsData.length,
          completed_sessions: completed,
          debate_count: debates,
          vote_count: votes,
          avg_confidence: 0.75, // Mock - would calculate from real data
          quorum_rate: completed / sessionsData.length || 0,
        });
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="glass-panel p-8 rounded-2xl border border-white/5">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/10 rounded w-32" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-white/5 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="glass-panel p-8 rounded-2xl border border-white/5">
        <p className="text-white/50">No analytics data available</p>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Sessions',
      value: analytics.total_sessions,
      icon: BarChart3,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Completed',
      value: analytics.completed_sessions,
      icon: CheckCircle,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Debates',
      value: analytics.debate_count,
      icon: TrendingUp,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      label: 'Votes',
      value: analytics.vote_count,
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="glass-panel p-8 rounded-2xl border border-white/5">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <BarChart3 className="w-5 h-5 text-purple-400" />
        </div>
        <h3 className="text-lg font-bold text-white tracking-tight">Decision Analytics</h3>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white/5 rounded-xl p-4 border border-white/5">
            <div className={`p-2 rounded-lg ${stat.bg} w-fit mb-3`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-[10px] uppercase tracking-wider text-white/40 font-black">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 rounded-xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-white/40">
              Quorum Rate
            </h4>
            <div className="text-2xl font-bold text-green-400">
              {Math.round(analytics.quorum_rate * 100)}%
            </div>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${analytics.quorum_rate * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-white/40">
              Avg Confidence
            </h4>
            <div className="text-2xl font-bold text-blue-400">
              {Math.round(analytics.avg_confidence * 100)}%
            </div>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${analytics.avg_confidence * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="mt-8">
        <h4 className="text-xs font-black uppercase tracking-wider text-white/40 mb-4">
          Recent Decisions
        </h4>
        <div className="space-y-3">
          {sessions.slice(0, 5).map((session) => (
            <div 
              key={session.session_id}
              className="bg-white/5 rounded-lg p-4 border border-white/5 flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/70 truncate mb-2">{session.question}</p>
                <div className="flex items-center gap-3">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                    session.mechanism === 'debate' 
                      ? 'text-purple-400 border-purple-500/20 bg-purple-500/5' 
                      : 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5'
                  }`}>
                    {session.mechanism}
                  </span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                    session.status === 'complete'
                      ? 'text-green-400 border-green-500/20 bg-green-500/5'
                      : 'text-blue-400 border-blue-500/20 bg-blue-500/5'
                  }`}>
                    {session.status}
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-white/30 ml-4">
                {new Date(session.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
