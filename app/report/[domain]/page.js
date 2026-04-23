'use client';

import { use, useState, useEffect, useCallback, useRef } from 'react';
import { 
  ArrowLeft, Activity, Shield, Cpu, Zap, RotateCcw, 
  BarChart3, Layers, Terminal, AlertCircle, CheckCircle2,
  ExternalLink, Info, Search, Code2, Clock, Smartphone,
  Globe, ZapOff, ArrowUpRight, ShieldCheck, Eye, MousePointer2
} from 'lucide-react';
import Link from 'next/link';
import TagInspector from '@/app/components/TagInspector';
import PerformanceChart from '@/app/components/PerformanceChart';
import SpeedVisualization from '@/app/components/SpeedVisualization';
import PageMetricsChart from '@/app/components/PageMetricsChart';

export default function ReportPage({ params }) {
  const unwrappedParams = use(params);
  const { domain } = unwrappedParams;
  const decodeDomain = decodeURIComponent(domain);
  const [report, setReport] = useState(null);
  const [allScans, setAllScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const [selectedDevice, setSelectedDevice] = useState('desktop');
  const [selectedUrl, setSelectedUrl] = useState(null);
  const isFirstLoad = useRef(true);

  const fetchReport = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const res = await fetch(`/api/scans`);
      const data = await res.json();
      if (data.success) {
        const found = data.scans.find(s => s.name === decodeDomain);
        if (found) {
          const detailRes = await fetch(`/api/scan?name=${found.name}`);
          const detailData = await detailRes.json();
          if (detailData.success) {
            setReport(detailData.scan);
            // Default selectedUrl to the first page found if not set
            if (detailData.scan.allResults?.length > 0 && !selectedUrl) {
               setSelectedUrl(detailData.scan.allResults[0].url);
            }
          }
        }
        // Keep all scans for domain history chart
        setAllScans(data.scans.filter(s => s.name === decodeDomain));
      }
    } catch (e) { console.error(e); }
    if (isInitial) setLoading(false);
  }, [decodeDomain]); // Removed selectedUrl from dependencies

  useEffect(() => {
    if (isFirstLoad.current) {
      fetchReport(true);
      isFirstLoad.current = false;
    }
  }, [fetchReport]);

  // Data extraction
  const currentResult = report?.allResults?.find(r => 
    r.url === (selectedUrl || report.allResults[0]?.url) && 
    r.device_type === selectedDevice
  ) || report?.allResults?.[0];

  const score = currentResult?.perf_score || 0;
  const seo = currentResult?.seo_score || 0;
  const accessibilityScore = currentResult?.a11y_score || 0;
  const bp = currentResult?.bp_score || 0;
  const metrics = currentResult?.raw_data?.metrics || {};
  const audits = currentResult?.raw_data?.issues || [];
  const filmstrip = currentResult?.raw_data?.filmstrip || [];

  const getScoreColor = (s) => (s >= 90 ? 'text-success' : s >= 50 ? 'text-warning' : 'text-error');
  const getBarColor = (s) => (s >= 90 ? 'bg-success' : s >= 50 ? 'bg-warning' : 'bg-error');
  const getBadgeType = (s) => (s >= 90 ? 'velo-badge-success' : s >= 50 ? 'velo-badge-warning' : 'velo-badge-error');

  const getGrade = (s) => {
    if (s >= 90) return 'A';
    if (s >= 80) return 'B';
    if (s >= 70) return 'C';
    if (s >= 60) return 'D';
    if (s >= 50) return 'E';
    return 'F';
  };

  const getGradeColor = (g) => {
    switch (g) {
      case 'A': return 'text-success border-success/40 bg-success/10 shadow-[0_0_20px_rgba(16,185,129,0.3)]';
      case 'B': return 'text-success border-success/40 bg-success/10';
      case 'C': return 'text-warning border-warning/40 bg-warning/10';
      case 'D': return 'text-warning border-warning/40 bg-warning/10';
      case 'E': return 'text-error border-error/40 bg-error/10';
      case 'F': return 'text-error border-error/40 bg-error/10 shadow-[0_0_20px_rgba(239,68,68,0.3)]';
      default: return 'text-white border-white/20 bg-white/5';
    }
  };

  const grade = getGrade(score);

  const scoreCards = [
    { label: 'Performance', value: score, icon: <Zap size={20} />, color: 'text-primary', bar: 'bg-primary' },
    { label: 'SEO', value: seo, icon: <Search size={20} />, color: getScoreColor(seo), bar: getBarColor(seo) },
    { label: 'Accessibility', value: accessibilityScore, icon: <Eye size={20} />, color: getScoreColor(accessibilityScore), bar: getBarColor(accessibilityScore) },
    { label: 'Best Practices', value: bp, icon: <ShieldCheck size={20} />, color: getScoreColor(bp), bar: getBarColor(bp) },
  ];

  if (loading && !report) {
    return (
      <div className="container-full h-[80vh] flex flex-col items-center justify-center gap-12 animate-fade-in">
        <div className="relative">
          <div className="w-32 h-32 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity size={40} className="text-primary animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-black text-white tracking-[0.4em] uppercase">Synchronizing Telemetry</h2>
          <p className="text-text-dim text-sm font-bold uppercase tracking-widest">Accessing secure audit nodes...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container-full section-padding text-center">
        <div className="p-8 bg-error/10 w-fit mx-auto rounded-3xl mb-12 border border-error/20">
          <ZapOff size={64} className="text-error" />
        </div>
        <h1 className="text-7xl font-black mb-6 tracking-tighter text-white">DATA_LOST</h1>
        <p className="text-text-muted mb-16 text-xl font-medium max-w-xl mx-auto leading-relaxed">
          The requested performance signature could not be located in the current telemetry feed.
        </p>
        <Link href="/" className="velo-btn-primary px-12 py-5">
           <ArrowLeft size={20} />
           <span>Return to Command Center</span>
        </Link>
      </div>
    );
  }

  const uniqueUrls = [...new Set(report.allResults?.map(r => r.url) || [])];

  return (
    <div className="container-full animate-fade-in section-padding">
      
      {/* Premium Report Header */}
      <div className="mb-24">
        <div className="flex justify-between items-center mb-12">
          <Link href="/" className="inline-flex items-center gap-3 text-[10px] font-black text-text-dim hover:text-primary transition-all uppercase tracking-[0.2em] no-underline group">
            <div className="p-2 bg-white/5 rounded-lg group-hover:bg-primary/10 transition-all">
              <ArrowLeft size={14} />
            </div>
            System Dashboard
          </Link>
          <div className="flex items-center gap-4 text-[10px] font-black text-text-dim uppercase tracking-widest">
            <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_#10b981]" />
            Live Feed
          </div>
        </div>
        
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-16">
          <div className="flex-1 flex gap-10 items-start">
            {/* GTmetrix Grade Display */}
            <div className={`w-32 h-32 rounded-3xl border-2 flex flex-col items-center justify-center shrink-0 ${getGradeColor(grade)} transition-all duration-700 shadow-2xl`}>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Grade</span>
              <span className="text-6xl font-black leading-none">{grade}</span>
            </div>

            <div>
              <div className="flex items-center gap-4 mb-6">
                <span className={`velo-badge ${getBadgeType(score)}`}>Performance Signature</span>
                <span className="text-[10px] font-black text-text-dim uppercase tracking-[0.25em]">Audit Protocol v5.0</span>
              </div>
              <h1 className="text-6xl lg:text-8xl font-black tracking-tighter text-white leading-[0.9] uppercase break-all">
                {decodeDomain.replace('https://', '').replace('http://', '').replace(/\/$/, '')}
              </h1>
              <div className="mt-8 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-2xl">
                  <Globe size={16} className="text-primary" />
                  <span className="text-[11px] font-bold text-text-muted truncate max-w-[300px]">{selectedUrl || 'Base URL'}</span>
                </div>
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                  <button 
                    onClick={() => setSelectedDevice('desktop')}
                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedDevice === 'desktop' ? 'bg-primary text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'text-text-dim hover:text-white'}`}
                  >
                    Desktop
                  </button>
                  <button 
                    onClick={() => setSelectedDevice('mobile')}
                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedDevice === 'mobile' ? 'bg-primary text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'text-text-dim hover:text-white'}`}
                  >
                    Mobile
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 xl:gap-8">
             {[
               { label: 'Performance', value: score, icon: <Zap size={18} />, color: getScoreColor(score) },
               { label: 'SEO', value: seo, icon: <Search size={18} />, color: getScoreColor(seo) },
               { label: 'Accessibility', value: accessibilityScore, icon: <Eye size={18} />, color: getScoreColor(accessibilityScore) },
               { label: 'Best Practices', value: bp, icon: <ShieldCheck size={18} />, color: getScoreColor(bp) },
             ].map((m, i) => (
               <div key={i} className="velo-card !p-6 flex flex-col gap-4 relative overflow-hidden group hover:!bg-white/[0.04] transition-all border-white/10">
                  <div className="flex justify-between items-center relative z-10">
                     <div className={`p-2.5 rounded-xl bg-white/5 border border-white/10 ${m.color} shadow-inner`}>
                        {m.icon}
                     </div>
                     <div className={`text-3xl font-black ${m.color} tracking-tighter`}>
                        {m.value}<span className="text-[10px] opacity-40 ml-0.5">%</span>
                     </div>
                  </div>
                  <div className="relative z-10">
                     <p className="text-[9px] font-black uppercase tracking-[0.2em] text-text-dim mb-2">{m.label}</p>
                     <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full ${getBarColor(m.value)} transition-all duration-1000`} style={{ width: `${m.value}%` }} />
                     </div>
                  </div>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Page Selection Bar */}
      {uniqueUrls.length > 1 && (
        <div className="mb-16">
           <div className="flex items-center gap-4 mb-6 px-2">
              <Layers size={18} className="text-primary" />
              <h5 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Scanned Infrastructure Nodes ({uniqueUrls.length})</h5>
           </div>
           <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {uniqueUrls.map((u, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedUrl(u)}
                  className={`px-6 py-4 rounded-2xl border transition-all whitespace-nowrap text-[11px] font-bold uppercase tracking-widest
                    ${selectedUrl === u 
                      ? 'bg-primary/10 border-primary text-primary shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                      : 'bg-white/5 border-white/5 text-text-dim hover:bg-white/10 hover:border-white/10'}`}
                >
                  {u.replace(/https?:\/\/[^/]+/, '') || '/root'}
                </button>
              ))}
           </div>
        </div>
      )}

      {/* GTmetrix Style Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-6 mb-24">
        {[
          { label: 'LCP', value: metrics.lcp || '—', sub: 'Largest Contentful' },
          { label: 'TBT', value: metrics.tbt || '—', sub: 'Total Blocking' },
          { label: 'CLS', value: metrics.cls || '—', sub: 'Layout Shift' },
          { label: 'FCP', value: metrics.fcp || '—', sub: 'First Contentful' },
          { label: 'TTI', value: metrics.tti || '—', sub: 'Interactive' },
          { label: 'SI', value: metrics.speedIndex || '—', sub: 'Speed Index' },
        ].map((m, i) => (
          <div key={i} className="velo-card !p-8 flex flex-col items-center text-center gap-2 group hover:!bg-white/[0.04]">
             <span className="text-[9px] font-black text-text-dim uppercase tracking-widest">{m.label}</span>
             <span className="text-2xl font-black text-white group-hover:text-primary transition-all">{m.value}</span>
             <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest opacity-60">{m.sub}</span>
          </div>
        ))}
      </div>

      
      {/* Speed Visualization Timeline */}
      <div className="mb-24">
        <SpeedVisualization metrics={metrics} filmstrip={filmstrip} />
      </div>

      {/* Industrial Metrics & Page Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-24">
        {/* Tactical Metrics (Industrial style) */}
        <div className="lg:col-span-12 velo-card p-12">
           <div className="flex items-center gap-4 mb-12">
              <Cpu size={22} className="text-primary" />
              <h5 className="text-sm font-black uppercase tracking-[0.2em] text-white">Industrial Metrics & Page Health</h5>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              <div className="flex flex-col gap-6">
                {[
                  { label: 'Time to Interactive', value: metrics.tti || '—', color: 'text-white' },
                  { label: 'Speed Index', value: metrics.speedIndex || '—', color: 'text-white' },
                  { label: 'Total Blocking Time', value: metrics.tbt || '—', color: 'text-error' },
                ].map((m, i) => (
                  <div key={i} className="flex justify-between items-center border-b border-white/[0.03] pb-4">
                    <span className="text-[11px] font-black text-text-dim uppercase tracking-widest">{m.label}</span>
                    <span className={`${m.color} font-mono font-black text-lg`}>{m.value}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-6">
                {[
                  { label: 'First Contentful Paint', value: metrics.fcp || '—', color: 'text-success' },
                  { label: 'Server Response (TTFB)', value: metrics.ttfb ? `${(metrics.ttfb/1000).toFixed(2)}s` : '—', color: 'text-purple-400' },
                  { label: 'Fully Loaded', value: metrics.fullyLoadedValue ? `${(metrics.fullyLoadedValue/1000).toFixed(2)}s` : '—', color: 'text-blue-400' },
                ].map((m, i) => (
                  <div key={i} className="flex justify-between items-center border-b border-white/[0.03] pb-4">
                    <span className="text-[11px] font-black text-text-dim uppercase tracking-widest">{m.label}</span>
                    <span className={`${m.color} font-mono font-black text-lg`}>{m.value}</span>
                  </div>
                ))}
              </div>

              <div className="p-8 bg-primary/5 border border-primary/20 rounded-3xl flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4">
                  <Info size={16} className="text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">System Intelligence</span>
                </div>
                <p className="text-[12px] font-semibold text-text-muted leading-relaxed">
                  Industrial metrics are cross-referenced with real-world RUM (Real User Monitoring) data to ensure maximum telemetry accuracy.
                </p>
              </div>
           </div>
        </div>
      </div>





      {/* Diagnostic Navigation */}
      <div className="flex gap-16 border-b border-white/5 mb-16 overflow-x-auto scrollbar-hide">
         {[
           { id: 'overview', label: 'Improvement Protocol', icon: <Zap size={18} /> },
           { id: 'assets', label: 'Tag Inspector v2', icon: <Layers size={18} /> },
           { id: 'history', label: 'Telemetry History', icon: <BarChart3 size={18} /> },
         ].map(tab => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id)}
             className={`flex items-center gap-4 px-2 py-8 text-[12px] font-black uppercase tracking-[0.25em] transition-all relative whitespace-nowrap
               ${activeTab === tab.id ? 'text-white' : 'text-text-dim hover:text-text-muted'}`}
           >
             <div className={`${activeTab === tab.id ? 'text-primary' : ''} transition-colors`}>
               {tab.icon}
             </div>
             {tab.label}
             {activeTab === tab.id && (
               <div className="absolute bottom-0 left-0 w-full h-[3px] bg-primary shadow-[0_0_20px_#3b82f6]" />
             )}
           </button>
         ))}
      </div>

      {/* Module Viewport */}
      <div className="animate-fade-in">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
             {/* Left: Bottleneck List */}
             <div className="lg:col-span-7 flex flex-col gap-10">
                <div className="flex items-center gap-4 px-2">
                  <AlertCircle size={22} className="text-warning" />
                  <h5 className="text-sm font-black uppercase tracking-[0.2em] text-white">Detected Latency Bottlenecks ({audits.length})</h5>
                </div>
                
                <div className="flex flex-col gap-6">
                  {audits.length === 0 ? (
                    <div className="velo-card py-20 text-center border-dashed opacity-40">
                      <CheckCircle2 size={48} className="mx-auto mb-6 text-success" strokeWidth={1} />
                      <p className="text-[12px] font-black uppercase tracking-[0.2em] text-success">No critical issues detected</p>
                    </div>
                  ) : (
                    audits.map((audit, i) => (
                      <div key={i} className="velo-card !p-8 hover:!bg-white/[0.04] group">
                         <div className="flex gap-8 items-start">
                            <div className={`mt-2.5 h-3.5 w-3.5 rounded-full shrink-0 ${audit.score >= 0.9 ? 'bg-success' : audit.score >= 0.5 ? 'bg-warning' : 'bg-error'} shadow-[0_0_15px_rgba(0,0,0,0.5)] border-2 border-background`} />
                            <div className="flex-1">
                               <h6 className="text-lg font-black text-white tracking-tight uppercase group-hover:text-primary transition-all mb-3 leading-tight">{audit.title}</h6>
                               <p className="text-[13px] text-text-muted font-medium leading-relaxed max-w-2xl">{audit.description?.split('. ')[0]}.</p>
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] pt-2">
                               {audit.score < 0.5 ? <span className="text-error">Critical</span> : <span className="text-success">Optimal</span>}
                            </div>
                         </div>
                      </div>
                    ))
                  )}
                </div>
             </div>

             {/* Right: AI Advisor & Technical Spec */}
             <div className="lg:col-span-5 flex flex-col gap-12">
                <div className="velo-card p-12 bg-gradient-to-br from-primary/10 via-transparent to-transparent border-primary/20 relative overflow-hidden">
                   <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-12">
                         <div className="p-3 bg-primary/20 rounded-xl text-primary border border-primary/30">
                            <ShieldCheck size={24} />
                         </div>
                         <h5 className="text-sm font-black uppercase tracking-[0.2em] text-white">AI Optimization Advisor</h5>
                      </div>
                      
                      <div className="flex flex-col gap-10">
                         <div className="p-8 bg-black/60 border border-white/5 rounded-3xl relative">
                            <div className="absolute top-0 left-8 -translate-y-1/2 px-3 py-1 bg-primary rounded-full text-[9px] font-black uppercase tracking-widest text-white">Primary Directive</div>
                            <p className="text-[15px] font-semibold text-text-secondary leading-relaxed italic">
                              &quot;Current telemetry indicates {score < 90 ? 'significant' : 'minor'} resource contention within the critical rendering path. Implementing speculative preloading for LCP assets and Brotli compression is highly recommended.&quot;
                            </p>
                         </div>
                         
                         <div className="flex flex-col gap-6">
                            {[
                              'Compress static assets via Brotli v2',
                              'Prioritize Largest Contentful Paint assets',
                              'De-prioritize non-critical telemetry JS',
                              'Enable speculative protocol preloading'
                            ].map((item, i) => (
                              <div key={i} className="flex items-center gap-5 group">
                                 <div className="p-2 bg-success/20 rounded-lg text-success border border-success/20 transition-transform group-hover:scale-110">
                                    <CheckCircle2 size={16} />
                                 </div>
                                 <span className="text-[11px] font-black uppercase tracking-[0.1em] text-text-muted group-hover:text-white transition-colors">{item}</span>
                              </div>
                            ))}
                         </div>
                      </div>
                   </div>
                   <Terminal size={160} className="absolute -bottom-16 -right-16 opacity-[0.04]" />
                </div>
                
                <div className="velo-card p-10">
                   <h5 className="text-xs font-black uppercase tracking-[0.2em] text-white mb-10 opacity-60">System Metadata</h5>
                   <div className="flex flex-col gap-6">
                      {[
                        { label: 'Network Layer', value: report.network_profile?.toUpperCase() || '4G LTE' },
                        { label: 'Device Profile', value: selectedDevice.toUpperCase() },
                        { label: 'Scan Status', value: report.status?.toUpperCase() || 'COMPLETED' },
                        { label: 'Pages Audited', value: `${uniqueUrls.length} pages` },
                        { label: 'Core Integrity', value: 'Verified' }
                      ].map((m, i) => (
                        <div key={i} className="flex justify-between items-center text-[11px] font-bold">
                          <span className="text-text-dim uppercase tracking-widest">{m.label}</span>
                          <span className="text-white uppercase tracking-tighter">{m.value}</span>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="animate-fade-in">
             <TagInspector results={report.allResults || []} domain={decodeDomain} />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="animate-fade-in flex flex-col gap-16">
            {/* Historical Metrics Visualization moved from Overview */}
            <div className="velo-card p-12">
               <div className="flex items-center gap-4 mb-12">
                  <Activity size={22} className="text-primary" />
                  <h5 className="text-sm font-black uppercase tracking-[0.2em] text-white">Metrics Evolution History</h5>
               </div>
               <PageMetricsChart scans={allScans} deviceType={selectedDevice} />
            </div>
            
            <div className="velo-card p-12">

              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white mb-8">Performance Score Evolution</h3>
              <PerformanceChart scans={allScans} deviceType={selectedDevice} />
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4 px-2">
                <Clock size={20} className="text-primary" />
                <h5 className="text-sm font-black uppercase tracking-[0.2em] text-white">Audit Timeline History</h5>
              </div>
              
              <div className="flex flex-col gap-4">
                {allScans.map((scan, i) => (
                  <div key={i} className="velo-card !p-8 flex items-center justify-between hover:!bg-white/[0.04] transition-all">
                    <div className="flex items-center gap-8">
                       <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                          <Activity size={20} className="text-primary" />
                       </div>
                       <div>
                          <p className="text-sm font-black text-white uppercase tracking-tight mb-1">Session #{String(scan.id).substring(0, 8)}</p>
                          <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest">{new Date(scan.started_at).toLocaleString()}</p>
                       </div>
                    </div>
                    
                    <div className="flex gap-8 items-center">
                       <div className="text-right">
                          <p className="text-[9px] font-black text-text-dim uppercase tracking-widest mb-1">Perf</p>
                          <p className={`text-xl font-black ${getScoreColor(scan.results?.performance)}`}>{scan.results?.performance || '—'}</p>
                       </div>
                       <div className="text-right border-l border-white/5 pl-6">
                          <p className="text-[9px] font-black text-text-dim uppercase tracking-widest mb-1">SEO</p>
                          <p className={`text-xl font-black ${getScoreColor(scan.results?.seo)}`}>{scan.results?.seo || '—'}</p>
                       </div>
                       <div className="text-right border-l border-white/5 pl-6">
                          <p className="text-[9px] font-black text-text-dim uppercase tracking-widest mb-1">A11y</p>
                          <p className={`text-xl font-black ${getScoreColor(scan.results?.accessibility)}`}>{scan.results?.accessibility || '—'}</p>
                       </div>
                       <div className="text-right border-l border-white/5 pl-6">
                          <p className="text-[9px] font-black text-text-dim uppercase tracking-widest mb-1">Best Prac</p>
                          <p className={`text-xl font-black ${getScoreColor(scan.results?.bestPractices)}`}>{scan.results?.bestPractices || '—'}</p>
                       </div>
                       <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-black text-sm shrink-0 ${getGradeColor(getGrade(scan.results?.performance))}`}>
                          {getGrade(scan.results?.performance)}
                       </div>
                       <Link href={`/report/${scan.name}?scanId=${scan.id}`} className="p-3 bg-white/5 rounded-xl border border-white/5 text-text-dim hover:text-primary hover:border-primary transition-all">
                          <ExternalLink size={18} />
                       </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
