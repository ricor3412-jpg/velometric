'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Activity, BarChart3, TrendingUp, Info } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// Brand Colors
const COLORS = {
  performance: '#3b82f6', // primary
  seo: '#10b981',        // success
  a11y: '#a855f7',       // purple
  bestPractices: '#f59e0b', // warning
};

export default function PerformanceChart({ scans, deviceType }) {
  const chronological = [...scans]
    .filter(s => s.status === 'completed' && s.deviceStats?.[deviceType])
    .reverse();

  if (chronological.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center rounded-3xl border border-dashed border-white/10 bg-white/[0.01]">
        <div className="mb-6 p-5 rounded-3xl bg-white/5 border border-white/5 text-text-dim opacity-30">
           <Activity size={32} />
        </div>
        <h4 className="text-sm font-black uppercase tracking-widest text-white mb-2">Insufficient Telemetry</h4>
        <p className="text-xs font-medium text-text-dim max-w-xs">At least 2 historical scan records are required to project infrastructure evolution.</p>
      </div>
    );
  }

  const labels = chronological.map(s => {
    const d = new Date(s.started_at);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const makeDataset = (label, color, dataKey) => ({
    label: label.toUpperCase(),
    data: chronological.map(s => s.deviceStats[deviceType]?.[dataKey] ?? null),
    borderColor: color,
    backgroundColor: color + '10', // Very subtle fill
    borderWidth: 4,
    pointRadius: 0, // Hidden points by default
    pointHoverRadius: 8,
    pointBackgroundColor: color,
    pointBorderColor: '#050507',
    pointBorderWidth: 3,
    tension: 0.4,
    fill: true,
  });

  const scoreData = {
    labels,
    datasets: [
      makeDataset('Performance', COLORS.performance, 'performance'),
      makeDataset('SEO', COLORS.seo, 'seo'),
      makeDataset('Accessibility', COLORS.a11y, 'accessibility'),
      makeDataset('Best Practices', COLORS.bestPractices, 'bestPractices'),
    ],
  };

  const scoreOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          color: 'rgba(255,255,255,0.4)',
          padding: 30,
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 6,
          boxHeight: 6,
          font: { size: 10, weight: '900', family: "Inter, sans-serif" },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(10, 11, 16, 0.95)',
        titleColor: '#fff',
        bodyColor: 'rgba(255,255,255,0.6)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 16,
        cornerRadius: 16,
        titleFont: { size: 12, weight: '900', family: "Inter, sans-serif" },
        bodyFont: { size: 12, family: "Inter, sans-serif" },
        displayColors: true,
        usePointStyle: true,
        boxPadding: 6,
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(255,255,255,0.03)', drawTicks: false },
        ticks: {
          color: 'rgba(255,255,255,0.2)',
          font: { size: 10, weight: '700' },
          padding: 15,
        },
        border: { display: false },
      },
      x: {
        grid: { display: false },
        ticks: {
          color: 'rgba(255,255,255,0.2)',
          font: { size: 10, weight: '700' },
          padding: 15,
        },
        border: { display: false },
      },
    },
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-secondary/10 rounded-xl border border-secondary/20 text-secondary">
             <BarChart3 size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Historical Telemetry</h3>
            <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest mt-1">Cross-audit performance evolution</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-full">
           <TrendingUp size={14} className="text-success" />
           <span className="text-[10px] font-black text-text-dim uppercase tracking-widest">Protocol Sync: Active</span>
        </div>
      </div>

      <div className="relative h-[380px] p-6 bg-black/20 rounded-3xl border border-white/5">
        <div className="absolute top-8 left-8 flex items-center gap-2 opacity-30 pointer-events-none">
           <Info size={12} />
           <span className="text-[10px] font-black uppercase tracking-widest">Live Data Stream</span>
        </div>
        <Line data={scoreData} options={scoreOptions} />
      </div>
    </div>
  );
}
