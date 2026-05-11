'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { Network } from 'lucide-react';

interface AgentNode {
  id: string;
  name: string;
  persona: string;
  position: string;
  confidence: number;
  color: string;
}

interface DebateGraphProps {
  agents: Record<string, {
    persona: string;
    answer?: string;
    confidence?: number;
    status: 'idle' | 'thinking' | 'responded';
  }>;
  round: number | null;
}

const PERSONA_COLORS: Record<string, string> = {
  'Analyst': '#3b82f6',    // blue
  'Critic': '#ef4444',     // red
  'Advocate': '#10b981',   // green
  'Skeptic': '#f59e0b',    // amber
};

export default function DebateGraph({ agents, round }: DebateGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // derive nodes during render to avoid cascading setState in effects
  const nodes = useMemo<AgentNode[]>(() => {
    return Object.entries(agents).map(([name, data]) => ({
      id: name,
      name,
      persona: data.persona,
      position: data.answer || 'Pending',
      confidence: data.status === 'responded' ? (data.confidence || 0) : 0,
      color: PERSONA_COLORS[data.persona] || '#6b7280',
    }));
  }, [agents]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.parentElement?.getBoundingClientRect();
    canvas.width = rect?.width || 600;
    canvas.height = 400;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw connections
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const angle1 = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
        const angle2 = (j / nodes.length) * Math.PI * 2 - Math.PI / 2;
        
        const x1 = centerX + Math.cos(angle1) * radius;
        const y1 = centerY + Math.sin(angle1) * radius;
        const x2 = centerX + Math.cos(angle2) * radius;
        const y2 = centerY + Math.sin(angle2) * radius;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }

    // Draw nodes
    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * Math.PI * 2 - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      const nodeRadius = 32 + (node.confidence * 16);

      // Draw glow
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, nodeRadius * 1.5);
      gradient.addColorStop(0, node.color + '40');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, nodeRadius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Draw node circle
      ctx.fillStyle = node.color;
      ctx.beginPath();
      ctx.arc(x, y, nodeRadius, 0, Math.PI * 2);
      ctx.fill();

      // Draw persona label
      ctx.fillStyle = 'white';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.persona, x, y - 6);

      // Draw confidence
      ctx.font = '9px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText(`${Math.round(node.confidence * 100)}%`, x, y + 7);
    });

    // draw center hub on top of nodes (sized so the SWARM + state labels sit comfortably inside)
    const hubRadius = 50;
    const hubGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, hubRadius);
    hubGradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
    hubGradient.addColorStop(0.7, 'rgba(59, 130, 246, 0.2)');
    hubGradient.addColorStop(1, 'rgba(255, 255, 255, 0.08)');
    ctx.fillStyle = hubGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, hubRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('SWARM', centerX, centerY - 10);

    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fillText(round !== null ? `ROUND ${round}` : 'IDLE', centerX, centerY + 10);

  }, [nodes, round]);

  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/5 relative z-0">
      <div className="flex items-center gap-2 mb-4">
        <Network className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Debate Graph</h3>
      </div>
      <div className="relative bg-black/20 rounded-xl overflow-hidden z-0">
        <canvas
          ref={canvasRef}
          className="w-full"
          style={{ height: '400px' }}
        />
      </div>
      <div className="flex flex-wrap gap-3 mt-4">
        {Object.entries(PERSONA_COLORS).map(([persona, color]) => (
          <div key={persona} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-white/50">{persona}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
