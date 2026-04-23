'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Activity, Search, RefreshCw, ChevronRight, Zap, 
  Globe, Smartphone, Wifi, Cpu, SignalHigh,
  Terminal, Shield, BarChart3, Clock, ArrowRight,
  Database, Server, Lock, LayoutGrid, ShieldCheck, Key,
  Trash2, XCircle
} from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [url, setUrl] = useState('');
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [networkProfile, setNetworkProfile] = useState('5g');

  const NETWORKS = [
    { id: 'none', label: 'Fiber Optic', info: '0ms / 1Gbps', icon: <SignalHigh size={18} /> },
    { id: '5g', label: 'Ultra 5G', info: '20ms / 50Mbps', icon: <Wifi size={18} /> },
    { id: '4g', label: '4G LTE', info: '40ms / 10Mbps', icon: <Smartphone size={18} /> },
    { id: '3g-fast', label: '3G Rapid', info: '150ms / 1.6Mbps', icon: <Cpu size={18} /> },
  ];

  const fetchScans = useCallback(async () => {
    try {
      const res = await fetch('/api/scans');
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      if (data.success) {
        setScans(data.scans);
      }
    } catch (e) {
      console.error('Fetch Scans Error:', e);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await fetchScans();
    };
    init();
  }, [fetchScans]);

  const startScan = async (e) => {
    e.preventDefault();
    if (!url) return;
    
    let submissionUrl = url;
    if (!/^https?:\/\//i.test(submissionUrl)) {
      submissionUrl = `https://${submissionUrl}`;
    }
    if (!submissionUrl.endsWith('/')) {
       submissionUrl = `${submissionUrl}/`;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: submissionUrl, networkProfile })
      });
      
      const data = await res.json();

      if (data.success) {
        setUrl('');
        fetchScans();
      } else {
        alert(data.error || 'Scan failed');
      }
    } catch (e) {
      alert(e.message || 'Network unreachable');
    }
    setLoading(false);
  };

  const stopScan = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to stop this scan?')) return;
    
    try {
      const res = await fetch('/api/scan', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'stop' })
      });
      if (res.ok) fetchScans();
    } catch (e) {
      console.error('Stop Scan Error:', e);
    }
  };

  const deleteScan = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this scan record?')) return;
    
    try {
      const res = await fetch(`/api/scan?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchScans();
    } catch (e) {
      console.error('Delete Scan Error:', e);
    }
  };

  const clearHistory = async () => {
    if (!confirm('WARNING: This will permanently delete ALL scan history. Continue?')) return;
    
    try {
      const res = await fetch('/api/scans', { method: 'DELETE' });
      if (res.ok) fetchScans();
    } catch (e) {
      console.error('Clear History Error:', e);
    }
  };

  return (
    <div className="container-full animate-fade-in section-padding">
      
      {/* Premium Hero Section */}
      <div className="mb-32">
        <div className="flex items-center gap-4 mb-10">
          <span className="velo-badge velo-badge-running">Engine v5.0.4</span>
          <span className="text-[11px] font-black text-primary uppercase tracking-[0.4em]">Quantum-Ready Infrastructure</span>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-end">
          <div className="lg:col-span-8">
            <h1 className="text-8xl lg:text-9xl font-black tracking-tighter leading-[0.8] mb-12 text-white">
              Engineering <br />
              <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Digital Velocity.
              </span>
            </h1>
            <p className="text-2xl font-medium text-text-muted max-w-3xl leading-relaxed">
              Industrial-grade performance telemetry and infrastructure diagnostics. 
              Monitor your core vitals with sub-millisecond precision.
            </p>
          </div>
          
          <div className="lg:col-span-4 flex justify-start lg:justify-end gap-20">
             <div className="flex flex-col gap-4">
                <span className="text-[11px] font-bold text-text-dim uppercase tracking-widest">Core Stability</span>
                <span className="text-6xl font-black text-white font-mono tracking-tighter">99.9%</span>
             </div>
             <div className="flex flex-col gap-4">
                <span className="text-[11px] font-bold text-text-dim uppercase tracking-widest">Audit Nodes</span>
                <span className="text-6xl font-black text-primary font-mono tracking-tighter">{scans.length}</span>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 mb-24">
        {/* Main Interface (8/12) */}
        <div className="lg:col-span-8 flex flex-col gap-20">
          
          {/* Launcher Card */}
          <section className="velo-card p-16">
            <div className="flex items-center gap-8 mb-16">
              <div className="p-6 bg-primary/10 rounded-3xl text-primary border border-primary/20 shadow-[0_0_40px_rgba(59,130,246,0.15)]">
                <Zap size={40} />
              </div>
              <div>
                <h3 className="text-3xl font-black tracking-tight text-white">System Auditor</h3>
                <p className="text-[11px] font-black text-text-dim uppercase tracking-widest mt-2">Execute high-fidelity performance scan (Top 5 pages, Dual Device)</p>
              </div>
            </div>

            <form onSubmit={startScan} className="flex flex-col gap-12">
              <div className="velo-input-group p-3">
                <div className="flex items-center pl-8 text-text-dim">
                  <Globe size={24} />
                </div>
                <input 
                  type="text" 
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="Enter target protocol (e.g. domain.com)"
                  className="velo-input px-8 text-xl"
                  required
                  disabled={loading}
                />
                <button type="submit" className="velo-btn-primary px-12 py-5" disabled={loading}>
                  {loading ? <RefreshCw className="animate-spin" size={24} /> : <Search size={24} />}
                  <span>{loading ? 'Analyzing...' : 'Initialize'}</span>
                </button>
              </div>

              <div className="flex flex-col gap-8">
                 <div className="flex items-center gap-4">
                   <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_15px_#3b82f6]" />
                   <h4 className="text-[11px] font-black text-text-muted uppercase tracking-widest">Network Simulation Layer</h4>
                 </div>
                 
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                   {NETWORKS.map(net => (
                     <button
                       key={net.id}
                       type="button"
                       onClick={() => setNetworkProfile(net.id)}
                       className={`chip ${networkProfile === net.id ? 'active' : ''} !p-8`}
                     >
                       <div className="mb-6 opacity-50 group-hover:opacity-100 transition-opacity">
                         {net.icon}
                       </div>
                       <strong className="text-lg">{net.label}</strong>
                       <span className="text-sm">{net.info}</span>
                     </button>
                   ))}
                 </div>
              </div>
            </form>
          </section>

          {/* Intelligence Feed */}
          <div className="flex flex-col gap-12">
             <div className="flex items-center justify-between px-4 mb-6">
                <div className="flex items-center gap-8">
                   <Activity size={28} className="text-primary" />
                   <h5 className="text-lg font-black uppercase tracking-[0.3em] text-white">Historical Telemetry Logs</h5>
                </div>
                <div className="flex items-center gap-6">
                   <div className="text-[11px] font-black text-text-dim uppercase tracking-[0.2em] bg-white/[0.03] px-6 py-3 rounded-full border border-white/[0.05]">
                      {scans.length} Node{scans.length !== 1 ? 's' : ''} Recorded
                   </div>
                   {scans.length > 0 && (
                     <button 
                       onClick={clearHistory}
                       className="text-[10px] font-black text-error/60 hover:text-error uppercase tracking-[0.2em] border border-error/20 hover:border-error/40 px-6 py-3 rounded-full transition-all"
                     >
                       Clear History
                     </button>
                   )}
                </div>
             </div>

            <div className="grid grid-cols-1 gap-10">
              {scans.length === 0 ? (
                <div className="velo-card py-32 text-center border-dashed opacity-40">
                   <Activity size={64} className="mx-auto mb-8 text-text-dim" strokeWidth={1} />
                   <p className="text-[12px] font-black uppercase tracking-[0.2em] text-text-dim">No telemetry data recorded</p>
                </div>
              ) : (
                scans.map((scan, i) => (
                  <Link 
                    href={`/report/${scan.name}`} 
                    key={scan.id || i} 
                    className="velo-card !p-10 flex justify-between items-center no-underline group hover:!bg-white/[0.04] transition-all duration-500 relative"
                  >
                    <div className="flex items-center gap-12 pl-4">
                      <div className="p-6 bg-white/[0.03] border border-white/[0.05] rounded-2xl group-hover:border-primary/30 transition-all relative">
                         <Globe size={32} className="text-text-dim group-hover:text-primary transition-all" />
                         {scan.status === 'running' && (
                           <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full animate-ping" />
                         )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-3xl font-black text-white tracking-tighter mb-3">{scan.name}</span>
                        <div className="flex items-center gap-6">
                          <span className={`velo-badge ${
                            scan.status === 'completed' ? 'velo-badge-success' : 
                            scan.status === 'failed' ? 'velo-badge-error' : 
                            scan.status === 'cancelled' ? 'velo-badge-warning' : 'velo-badge-running'
                          }`}>
                            {scan.status.toUpperCase()}
                          </span>
                          <span className="text-[12px] font-bold text-text-dim flex items-center gap-2">
                             <Clock size={16} />
                             {new Date(scan.started_at).toLocaleTimeString('en-US', { hour: '2-digit', hour12: false, minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-12 pr-8">
                       <div className="flex flex-col items-end min-w-[120px]">
                         <span className="text-[11px] font-black text-text-dim uppercase tracking-[0.2em] mb-3">Performance</span>
                         <span className={`text-5xl font-black font-mono tracking-tighter ${scan.results?.performance >= 90 ? 'text-success' : scan.results?.performance >= 50 ? 'text-warning' : scan.results?.performance ? 'text-error' : 'text-text-dim'}`}>
                            {scan.results?.performance || '--'}
                         </span>
                       </div>
                       
                       <div className="flex items-center gap-4">
                          {scan.status === 'running' && (
                            <button 
                              onClick={(e) => stopScan(scan.id, e)}
                              className="p-5 rounded-2xl bg-warning/5 text-warning/40 hover:bg-warning/20 hover:text-warning transition-all border border-warning/10"
                              title="Stop Analysis"
                            >
                              <XCircle size={24} />
                            </button>
                          )}
                          <button 
                            onClick={(e) => deleteScan(scan.id, e)}
                            className="p-5 rounded-2xl bg-error/5 text-error/40 hover:bg-error/20 hover:text-error transition-all border border-error/10"
                            title="Delete Record"
                          >
                            <Trash2 size={24} />
                          </button>
                          <div className="p-5 rounded-2xl bg-white/[0.03] text-text-dim group-hover:text-primary group-hover:bg-primary/10 transition-all ml-4">
                            <ChevronRight size={28} />
                          </div>
                       </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Tactical Sidebar (4/12) */}
        <div className="lg:col-span-4 flex flex-col gap-12">
           <div className="velo-card p-12 bg-gradient-to-br from-primary/10 via-transparent to-transparent border-primary/20 relative overflow-hidden">
              <div className="flex items-center gap-6 mb-10 pb-8 border-b border-white/[0.05]">
                <Server size={22} className="text-primary" />
                <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-text-secondary">Node Status</h4>
              </div>
              
              <div className="flex flex-col gap-12">
                 <div className="flex justify-between items-center">
                    <div>
                      <div className="text-[11px] font-black text-text-dim uppercase tracking-widest mb-3">Telemetry</div>
                      <div className="text-2xl font-black text-white tracking-tight">Active & Secure</div>
                    </div>
                    <div className="p-4 bg-success/10 rounded-2xl border border-success/20">
                      <ShieldCheck size={24} className="text-success" />
                    </div>
                 </div>

                 <div className="flex flex-col gap-6">
                    {[
                      { label: 'Uplink Latency', value: '14ms', color: 'text-primary' },
                      { label: 'Node Throughput', value: '8.4 GB/s', color: 'text-white' },
                      { label: 'System Integrity', value: '99.99%', color: 'text-success' }
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-[11px] font-black text-text-dim uppercase tracking-[0.1em]">{item.label}</span>
                        <span className={`${item.color} font-mono font-bold text-sm`}>{item.value}</span>
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           <div className="velo-card p-12 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/10 relative overflow-hidden group">
              <div className="flex flex-col gap-8 relative z-10">
                 <div className="p-4 bg-secondary/10 rounded-2xl text-secondary w-fit border border-secondary/20">
                   <Terminal size={28} />
                 </div>
                 <h4 className="text-3xl font-black tracking-tighter text-white leading-[1.1]">
                   Precision API <br />Infrastructure
                 </h4>
                 <p className="text-lg font-medium text-text-muted leading-relaxed">
                   Integrate your development pipelines for automated performance gates and telemetry.
                 </p>
                 <button className="velo-btn-primary !bg-white/5 !border-white/10 hover:!bg-white/10 w-full justify-center mt-6 py-5">
                   <span>Review Documentation</span>
                   <ArrowRight size={20} />
                 </button>
                 <Link href="/integrations" className="velo-btn-primary !bg-primary/5 !border-primary/10 hover:!bg-primary/20 w-full justify-center py-5 no-underline">
                   <Key size={20} />
                   <span>Manage API Keys</span>
                 </Link>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
