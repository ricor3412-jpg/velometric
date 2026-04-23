'use client';

import { Info } from 'lucide-react';

export default function SpeedVisualization({ metrics, filmstrip }) {
  if (!filmstrip || filmstrip.length === 0) return null;

  const timings = [
    { label: 'TTFB', value: metrics.ttfb, color: 'bg-purple-500' },
    { label: 'First Contentful Paint', value: metrics.fcpValue, color: 'bg-blue-400' },
    { label: 'Largest Contentful Paint', value: metrics.lcpValue, color: 'bg-blue-600' },
    { label: 'Time to Interactive', value: metrics.ttiValue, color: 'bg-purple-600' },
    { label: 'Fully Loaded', value: metrics.fullyLoadedValue, color: 'bg-red-500' },
  ].filter(t => t.value > 0).sort((a, b) => a.value - b.value);

  const maxTime = Math.max(...filmstrip.map(f => f.timing), ...timings.map(t => t.value));

  return (
    <div className="velo-card p-12 overflow-hidden">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <h5 className="text-sm font-black uppercase tracking-[0.2em] text-white">Speed Visualization</h5>
          <div className="p-1.5 bg-white/5 rounded-full text-text-dim cursor-help group relative">
            <Info size={12} />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-black border border-white/10 rounded-lg text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Visual timeline of the page load experience.
            </div>
          </div>
        </div>
      </div>

      <div className="relative mt-8 mb-20">
        {/* Time Scale */}
        <div className="flex justify-between border-b border-white/5 pb-2 mb-6">
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((pct, i) => (
            <span key={i} className="text-[9px] font-black text-text-dim">
              {((maxTime * pct) / 1000).toFixed(1)}s
            </span>
          ))}
        </div>

        {/* Filmstrip */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {filmstrip.map((frame, i) => {
            const position = (frame.timing / maxTime) * 100;
            return (
              <div key={i} className="flex-shrink-0 flex flex-col items-center gap-4">
                 <div className="w-[140px] aspect-[4/3] rounded-lg overflow-hidden border border-white/10 bg-white/5 shadow-xl transition-all hover:border-primary/50 group">
                    <img src={frame.data} alt={`Frame ${i}`} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                 </div>
                 <span className="text-[8px] font-black text-text-dim">{(frame.timing / 1000).toFixed(1)}s</span>
              </div>
            );
          })}
        </div>

        {/* Markers Overlay */}
        <div className="absolute inset-0 pointer-events-none mt-16 pt-2">
          {timings.map((t, i) => {
            const left = (t.value / maxTime) * 100;
            // Alternate height for labels to avoid overlap
            const topOffset = (i % 3) * 25;
            return (
              <div 
                key={i} 
                className="absolute h-[250px] border-l border-white/10" 
                style={{ left: `${left}%`, top: '-40px' }}
              >
                <div className={`absolute bottom-0 left-0 -translate-x-1/2 px-3 py-1.5 rounded-md text-[8px] font-black text-white whitespace-nowrap shadow-lg ${t.color}`}
                     style={{ bottom: `${topOffset}px` }}>
                  {t.label}: {(t.value / 1000).toFixed(1)}s
                  <div className={`absolute bottom-full left-1/2 -translate-x-1/2 w-px h-4 ${t.color} opacity-40`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
