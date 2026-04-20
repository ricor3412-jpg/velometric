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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function PerformanceChart({ scans, deviceType }) {
  // Scans come newest-first from DB, reverse for chronological chart
  const chronological = [...scans].filter(s => s.status === 'completed' && s.deviceStats?.[deviceType]).reverse();

  if (chronological.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center opacity-30" style={{ height: '300px' }}>
        <div className="mb-4 p-4 rounded-full bg-white/5 border border-white/5">
           <LineElement style={{ width: '32px', height: '32px' }} />
        </div>
        <p className="text-sm font-medium">Se necesitan al menos 2 escaneos para proyectar la evolución.</p>
      </div>
    );
  }

  const labels = chronological.map(s => {
    const d = new Date(s.started_at);
    return d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  });

  const makeDataset = (label, color, dataKey) => ({
    label,
    data: chronological.map(s => s.deviceStats[deviceType]?.[dataKey] ?? null),
    borderColor: color,
    backgroundColor: color + '15',
    borderWidth: 3,
    pointRadius: 4,
    pointHoverRadius: 7,
    pointBackgroundColor: color,
    pointBorderColor: '#0c0c0f',
    pointBorderWidth: 2,
    tension: 0.4,
    fill: true,
  });

  const scoreData = {
    labels,
    datasets: [
      makeDataset('Performance', '#3b82f6', 'performance'),
      makeDataset('SEO', '#10b981', 'seo'),
      makeDataset('Accessibility', '#a855f7', 'accessibility'),
      makeDataset('Best Practices', '#f59e0b', 'bestPractices'),
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
          color: '#a1a1aa',
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 6,
          boxHeight: 6,
          font: { size: 10, weight: '700', family: "inherit" },
        },
      },
      tooltip: {
        backgroundColor: '#111114',
        titleColor: '#fff',
        bodyColor: '#a1a1aa',
        borderColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
        titleFont: { size: 13, weight: '900' },
        bodyFont: { size: 12 },
        displayColors: true,
        usePointStyle: true,
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(255,255,255,0.03)', drawTicks: false },
        ticks: {
          color: 'rgba(255,255,255,0.2)',
          font: { size: 10, weight: '600' },
          padding: 10,
        },
        border: { display: false },
      },
      x: {
        grid: { display: false },
        ticks: {
          color: 'rgba(255,255,255,0.2)',
          font: { size: 10, weight: '600' },
          padding: 10,
        },
        border: { display: false },
      },
    },
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500">Histórico de Performance</h3>
      </div>
      <div style={{ height: '320px' }}>
        <Line data={scoreData} options={scoreOptions} />
      </div>
    </div>
  );
}
