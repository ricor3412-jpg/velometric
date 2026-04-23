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
import { BarChart3 } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function PageMetricsChart({ scans, deviceType }) {
  const chronological = [...scans]
    .filter(s => s.status === 'completed')
    .reverse();

  if (chronological.length < 2) return null;

  const labels = chronological.map(s => {
    const d = new Date(s.started_at);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const getMetricData = (s, key) => {
    // Some results might have nested raw_data, some might have it in summary
    const res = s.results?.raw_data || {};
    const metrics = res.metrics || {};
    return (metrics[key] || 0) / 1000; // convert to seconds
  };

  const makeDataset = (label, color, key) => ({
    label: label.toUpperCase(),
    data: chronological.map(s => getMetricData(s, key)),
    borderColor: color,
    backgroundColor: color + '10',
    borderWidth: 2,
    pointRadius: 4,
    pointHoverRadius: 6,
    pointBackgroundColor: color,
    pointBorderColor: '#050507',
    pointBorderWidth: 2,
    tension: 0.3,
  });

  const data = {
    labels,
    datasets: [
      makeDataset('TTFB', '#a855f7', 'ttfb'),
      makeDataset('FCP', '#60a5fa', 'fcpValue'),
      makeDataset('LCP', '#2563eb', 'lcpValue'),
      makeDataset('TTI', '#9333ea', 'ttiValue'),
      makeDataset('Fully Loaded', '#ef4444', 'fullyLoadedValue'),
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'rgba(255,255,255,0.4)',
          font: { size: 9, weight: 'bold' },
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(10, 11, 16, 0.95)',
        padding: 12,
        cornerRadius: 12,
        titleFont: { size: 11, weight: '900' },
        bodyFont: { size: 11 },
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Seconds', color: 'rgba(255,255,255,0.2)', font: { size: 10 } },
        grid: { color: 'rgba(255,255,255,0.03)' },
        ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 10 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 10 } }
      }
    }
  };

  return (
    <div className="velo-card p-12">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-3 bg-primary/10 rounded-xl text-primary border border-primary/20">
          <BarChart3 size={18} />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Page Metrics History</h3>
          <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest mt-1">Industrial timing evolution</p>
        </div>
      </div>
      <div className="h-[300px]">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
