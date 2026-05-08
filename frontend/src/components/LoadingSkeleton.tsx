import React from 'react';

export function AgentCardSkeleton() {
  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/5 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-white/5" />
        <div className="flex-1">
          <div className="h-4 bg-white/10 rounded w-24 mb-2" />
          <div className="h-3 bg-white/5 rounded w-16" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-3 bg-white/5 rounded w-full" />
        <div className="h-3 bg-white/5 rounded w-5/6" />
        <div className="h-3 bg-white/5 rounded w-4/6" />
      </div>
    </div>
  );
}

export function SessionHistorySkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass-panel p-5 rounded-2xl border border-white/5 animate-pulse">
          <div className="flex justify-between mb-4">
            <div className="h-6 bg-white/10 rounded w-16" />
            <div className="h-4 bg-white/5 rounded w-20" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-white/5 rounded w-full" />
            <div className="h-4 bg-white/5 rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ConsensusReportSkeleton() {
  return (
    <div className="glass-panel p-8 rounded-2xl border border-white/5 animate-pulse">
      <div className="h-6 bg-white/10 rounded w-48 mb-6" />
      <div className="h-4 bg-white/5 rounded w-full mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="space-y-3">
          <div className="h-4 bg-white/10 rounded w-32 mb-4" />
          <div className="h-3 bg-white/5 rounded w-full" />
          <div className="h-3 bg-white/5 rounded w-5/6" />
          <div className="h-3 bg-white/5 rounded w-4/6" />
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-white/10 rounded w-32 mb-4" />
          <div className="h-3 bg-white/5 rounded w-full" />
          <div className="h-3 bg-white/5 rounded w-5/6" />
        </div>
      </div>
      <div className="h-20 bg-white/5 rounded-xl" />
    </div>
  );
}

export function PipelineSkeleton() {
  return (
    <div className="flex items-center justify-between gap-2 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <React.Fragment key={i}>
          <div className="flex-1 h-2 bg-white/10 rounded-full" />
          <div className="w-6 h-6 rounded-full bg-white/5" />
        </React.Fragment>
      ))}
    </div>
  );
}
