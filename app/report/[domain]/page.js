'use client';

import { useState, useEffect, use } from 'react';
import { ArrowLeft, RefreshCw, Smartphone, Laptop, Terminal, ChevronDown, ChevronRight, AlertTriangle, Download, TrendingUp, TrendingDown, Minus, Tag, LayoutDashboard, Globe, Clock, Zap, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import PerformanceChart from '@/app/components/PerformanceChart';
import TagInspector from '@/app/components/TagInspector';

export default function DomainReport({ params }) {
  const unwrappedParams = use(params);
  const domainName = unwrappedParams.domain;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDevice, setActiveDevice] = useState('mobile'); 
  const [logs, setLogs] = useState([]);
  const [expandedIssueUrl, setExpandedIssueUrl] = useState(null);
  const [activeScanIdx, setActiveScanIdx] = useState(0);
  const [compareScanIdx, setCompareScanIdx] = useState(null);
  const [viewMode, setViewMode] = useState('summary');

  useEffect(() => {
    fetchData();
  }, [domainName]);

  const processDomainData = (json) => {
     if (json.success && json.scans?.length > 0) {
        json.scans.forEach(scan => {
           if (!scan.results) return;
           scan.deviceStats = { mobile: null, desktop: null };
           
           ['mobile', 'desktop'].forEach(dev => {
              const devResults = scan.results.filter(r => r.device_type === dev);
              if (devResults.length > 0) {
                 let p=0, s=0, a=0, b=0;
                 devResults.forEach(r => { p+=r.perf_score; s+=r.seo_score; a+=r.a11y_score; b+=r.bp_score; });
                 scan.deviceStats[dev] = {
                    performance: Math.round(p / devResults.length),
                    seo: Math.round(s / devResults.length),
                    accessibility: Math.round(a / devResults.length),
                    bestPractices: Math.round(b / devResults.length),
                 }
              }
           });
        });
     }
     return json;
  };

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/domain/${domainName}`);
      const json = await res.json();
      setData(processDomainData(json));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  // Poll for logs if running
  useEffect(() => {
     let interval;
     if (data?.scans?.[0]?.status === 'running') {
        const fetchLogs = async () => {
           const res = await fetch(`/api/scan/${data.scans[0].id}/progress`);
           const json = await res.json();
           if(json.success) setLogs(json.logs);
           
           const curData = await fetch(`/api/domain/${domainName}`).then(r => r.json());
           if (curData.success && curData.scans[0].status !== 'running') {
              setData(processDomainData(curData));
              clearInterval(interval);
           }
        };
        fetchLogs();
        interval = setInterval(fetchLogs, 3000);
     }
     return () => clearInterval(interval);
  }, [data?.scans?.[0]?.status]);

  if (loading) {
     return <div className="flex justify-center items-center" style={{ minHeight: '60vh' }}><RefreshCw className="animate-spin" size={48} color="var(--primary-light)" /></div>;
  }

  if (!data || !data.scans || data.scans.length === 0) {
     return (
       <div className="velo-card text-center" style={{ maxWidth: '600px', margin: '4rem auto' }}>
         <h2 className="mb-4">No se encontraron datos</h2>
         <p className="mb-8" style={{ color: 'var(--text-muted)' }}>No pudimos encontrar registros para {domainName}.</p>
         <Link href="/" className="velo-btn-primary inline-flex items-center gap-2">
           <ArrowLeft size={16}/> Volver al Tablero
         </Link>
       </div>
     );
  }

  const currentScan = data.scans[activeScanIdx];
  const previousScan = data.scans[activeScanIdx + 1] || null;
  const isRunning = currentScan.status === 'running';
  const activeStats = currentScan.deviceStats?.[activeDevice];
  const previousStats = previousScan?.deviceStats?.[activeDevice];
  const filteredResults = currentScan.results?.filter(r => r.device_type === activeDevice) || [];

  const formatScoreClass = (score) => {
     if (score >= 90) return 'score-good';
     if (score >= 50) return 'score-average';
     return 'score-poor';
  };

  const formatScoreColor = (score) => {
     if (score >= 90) return '#10b981';
     if (score >= 50) return '#f59e0b';
     return '#ef4444';
  };

  const TrendIcon = ({ current, previous }) => {
     if (!previous && previous !== 0) return null;
     const diff = current - previous;
     if (diff > 2) return <TrendingUp size={14} color="#10b981" style={{marginLeft: '4px'}} />;
     if (diff < -2) return <TrendingDown size={14} color="#ef4444" style={{marginLeft: '4px'}} />;
     return <Minus size={14} color="#a1a1aa" style={{marginLeft: '4px'}} />;
  };

  const handleDownloadPdf = () => {
     window.open(`/api/export-pdf?domain=${domainName}&scan=${currentScan.id}`, '_blank');
  };

  return (
    <div className="animate-fade-in pb-20">
      <header className="flex justify-between items-start mb-12 flex-mobile-col gap-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors" style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 style={{ fontSize: '3.5rem', marginBottom: '0.5rem', letterSpacing: '-0.04em' }}>{domainName} <span style={{ fontWeight: 400, opacity: 0.2 }}>Report</span></h1>
            <div className="flex items-center gap-4">
              <span className={`velo-badge status-${currentScan.status}`} style={{ textTransform: 'capitalize', fontSize: '0.75rem', padding: '6px 12px' }}>{currentScan.status}</span>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem', fontWeight: 600 }}>ID: #{currentScan.id.toString().slice(-6)}</span>
            </div>
          </div>

        </div>
        
        {!isRunning && (
          <div className="flex gap-4">
            <button onClick={fetchData} className="velo-btn-primary" style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'white' }}>
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>Actualizar</span>
            </button>
            <button onClick={() => window.print()} className="velo-btn-primary">
              <Download size={18} /> Descargar Reporte
            </button>
          </div>
        )}
      </header>

          {/* Controls Bar */}
          <div className="flex justify-between items-center flex-mobile-col gap-10 items-mobile-start">
            <div className="flex items-center gap-8">
              <span className="velo-label" style={{ minWidth: '120px' }}>Dispositivo</span>
              <div className="velo-toggle-group">
                {[
                  { id: 'mobile', icon: Smartphone, label: 'Móvil' },
                  { id: 'desktop', icon: Laptop, label: 'Escritorio' }
                ].map(dev => (
                  <button
                    key={dev.id}
                    onClick={() => setActiveDevice(dev.id)}
                    className={`velo-toggle-btn ${activeDevice === dev.id ? 'active' : ''}`}
                  >
                    <dev.icon size={16} /> {dev.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-8">
              <span className="velo-label">Visualización</span>
              <div className="velo-toggle-group">
                {[
                  { id: 'summary', icon: LayoutDashboard, label: 'Resumen' },
                  { id: 'inspector', icon: Tag, label: 'GTM Inspector' }
                ].map(v => (
                  <button
                    key={v.id}
                    onClick={() => setViewMode(v.id)}
                    className={`velo-toggle-btn ${viewMode === v.id ? 'active-secondary' : ''}`}
                  >
                    <v.icon size={16} /> {v.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

      {isRunning && (
         <div className="velo-card mb-8 animate-pulse" style={{ borderColor: 'var(--primary-light)' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="flex items-center gap-3 text-blue-400"><Terminal size={20}/> Procesando Auditoría Central</h3>
              <RefreshCw className="animate-spin" size={20} color="var(--primary-light)" />
            </div>
            <div style={{ background: 'black', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)', height: '180px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.85rem' }}>
               {logs.map(log => (
                 <div key={log.id} style={{ color: log.type === 'error' ? '#ef4444' : log.type === 'success' ? '#10b981' : 'var(--text-dim)', padding: '3px 0' }}>
                   <span style={{ opacity: 0.5 }}>[{new Date(log.created_at).toLocaleTimeString()}]</span> {log.message}
                 </div>
               ))}
               {logs.length === 0 && <span style={{ color: '#333' }}>&gt; Inicializando motor Lighthouse...</span>}
            </div>
         </div>
      )}

      {/* Summary View Content */}
      {viewMode === 'summary' && (
        <div className="flex flex-col gap-8">
          {/* Main Scores Card */}
          <div className="velo-card">
            <div className="flex justify-between items-center mb-16 flex-mobile-col items-mobile-start gap-6">
               <div>
                 <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{activeDevice === 'mobile' ? 'Rendimiento Móvil' : 'Rendimiento Escritorio'}</h2>
                 <p className="flex items-center gap-3" style={{ color: 'var(--text-dim)', fontSize: '1rem' }}>
                    <Globe size={18} /> Perfil de Red: <span style={{ color: 'var(--primary-light)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{currentScan.network_profile || 'Standard 4G'}</span>
                 </p>
               </div>
                <div className="flex items-center gap-6 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 15px #10b981' }}></div>
                  <span style={{ fontWeight: 800, fontSize: '0.8rem', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Protocolo Verificado</span>
                </div>
            </div>

            
            {activeStats ? (
                <div className="grid grid-cols-4 gap-6 grid-mobile-cols-2">
                    <div className="flex flex-col items-center p-10 rounded-[32px] border border-white/5 bg-white/5 hover:border-white/10 transition-colors">
                      <div className={`velo-score-circle ${formatScoreClass(activeStats.performance)}`} style={{ '--score': activeStats.performance, width: '120px', height: '120px', fontSize: '2.5rem' }}>{activeStats.performance}</div>
                      <span className="mt-10 font-black text-zinc-300 flex items-center uppercase text-[11px] tracking-widest">Rendimiento <TrendIcon current={activeStats.performance} previous={previousStats?.performance} /></span>
                    </div>
                    <div className="flex flex-col items-center p-10 rounded-[32px] border border-white/5 bg-white/2 hover:border-white/10 transition-colors">
                      <div className={`velo-score-circle ${formatScoreClass(activeStats.seo)}`} style={{ '--score': activeStats.seo, width: '120px', height: '120px', fontSize: '2.5rem' }}>{activeStats.seo}</div>
                      <span className="mt-10 font-black text-zinc-300 flex items-center uppercase text-[11px] tracking-widest">SEO <TrendIcon current={activeStats.seo} previous={previousStats?.seo} /></span>
                    </div>
                    <div className="flex flex-col items-center p-10 rounded-[32px] border border-white/5 bg-white/2 hover:border-white/10 transition-colors">
                      <div className={`velo-score-circle ${formatScoreClass(activeStats.accessibility)}`} style={{ '--score': activeStats.accessibility, width: '120px', height: '120px', fontSize: '2.5rem' }}>{activeStats.accessibility}</div>
                      <span className="mt-10 font-black text-zinc-300 flex items-center uppercase text-[11px] tracking-widest">Accesibilidad <TrendIcon current={activeStats.accessibility} previous={previousStats?.accessibility} /></span>
                    </div>
                    <div className="flex flex-col items-center p-10 rounded-[32px] border border-white/5 bg-white/2 hover:border-white/10 transition-colors">
                      <div className={`velo-score-circle ${formatScoreClass(activeStats.bestPractices)}`} style={{ '--score': activeStats.bestPractices, width: '120px', height: '120px', fontSize: '2.5rem' }}>{activeStats.bestPractices}</div>
                      <span className="mt-10 font-black text-zinc-300 flex items-center uppercase text-[11px] tracking-widest">Prácticas <TrendIcon current={activeStats.bestPractices} previous={previousStats?.bestPractices} /></span>
                    </div>
                </div>
            ) : (
                <div className="text-center p-20 border border-dashed border-white/10 rounded-3xl">
                  <RefreshCw className="animate-spin mb-4 opacity-20 mx-auto" size={40} />
                  <p style={{ color: 'var(--text-dim)' }}>Sincronizando métricas de dispositivo...</p>
                </div>
            )}
          </div>

          {/* Detailed Pages List */}
          <div className="mt-12">
             <h2 className="mb-10 flex items-center gap-4" style={{ fontSize: '2.2rem' }}><LayoutGrid size={32} style={{ color: 'var(--primary-light)' }} /> Análisis de Entorno</h2>
             <div className="flex flex-col gap-6">


                  {filteredResults.map((res, i) => {
                    const path = res.url.replace(`https://${domainName}`, '').replace(`http://${domainName}`, '') || '/';
                    const parsed = typeof res.raw_data === 'string' ? JSON.parse(res.raw_data || '[]') : (res.raw_data || []);
                    
                    let issuesObj = [];
                    let screenshotUrl = null;
                    let filmstrip = [];
                    let metrics = {};
                    
                    if (Array.isArray(parsed)) {
                       issuesObj = parsed;
                    } else if (parsed && parsed.issues) {
                       issuesObj = Array.isArray(parsed.issues) ? parsed.issues : [];
                       screenshotUrl = parsed.screenshot;
                       filmstrip = parsed.filmstrip || [];
                       metrics = parsed.metrics || {};
                    }

                    const isExpanded = expandedIssueUrl === res.url;

                    return (
                      <div key={i} className={`velo-card p-0 overflow-hidden transition-all duration-300 ${isExpanded ? 'border-primary-light' : ''}`}>
                        <div 
                          className="p-8 cursor-pointer hover:bg-white/2 transition-colors flex justify-between items-center flex-mobile-col gap-6"
                          onClick={() => setExpandedIssueUrl(isExpanded ? null : res.url)}
                        >
                          <div className="flex items-center gap-4 flex-1">
                             <div className={`p-2 rounded-lg ${isExpanded ? 'bg-primary-light/20 text-primary-light' : 'bg-white/5 text-zinc-500'}`}>
                                {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                             </div>
                             <div className="flex flex-col">
                                <span style={{ fontFamily: 'monospace', color: 'white', fontWeight: 600 }}>{path}</span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Auditoría profunda</span>
                             </div>
                          </div>
                          
                          <div className="flex items-center gap-10 px-6 border-l border-white/5">
                             {[
                               { label: 'PERF', val: res.perf_score },
                               { label: 'SEO', val: res.seo_score },
                               { label: 'ACC', val: res.a11y_score },
                               { label: 'BP', val: res.bp_score }
                             ].map((s, idx) => (
                               <div key={idx} className="flex flex-col items-center">
                                 <div style={{ fontSize: '1.25rem', fontWeight: 900, color: formatScoreColor(s.val) }}>{s.val}</div>
                                 <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-dim)', letterSpacing: '0.05em' }}>{s.label}</div>
                               </div>
                             ))}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="p-4 md:p-8 pb-0 outline-none">
                            <div className="mb-6 md:mb-8" />
 
                            {/* Expanded Metric Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
                              {[
                                { label: 'FCP', val: metrics.fcp, color: '#3b82f6' },
                                { label: 'LCP', val: metrics.lcp, color: '#10b981' },
                                { label: 'TBT', val: metrics.tbt, color: '#f59e0b' },
                                { label: 'CLS', val: metrics.cls, color: '#ef4444' }
                              ].map(m => (
                                <div key={m.label} style={{ padding: '1.25rem', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                                  <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{m.label}</div>
                                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'white' }}>{m.val || '—'}</div>
                                </div>
                              ))}
                            </div>

                             {/* Render Timeline - V1 Vertical Flow */}
                             {filmstrip && filmstrip.length > 0 && (
                               <div className="mb-24">
                                 <h4 style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '2.5rem', letterSpacing: '0.15em', textAlign: 'center' }}>Flujo de Renderizado</h4>
                                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
                                   {filmstrip.map((s, idx) => (
                                     <div key={idx} className="flex flex-col gap-4 animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                                       <div style={{ borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', background: '#000', aspectRatio: '16/9', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
                                         <img src={s.data} alt={`Frame ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                       </div>
                                       <div className="flex justify-between items-center px-2">
                                          <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--primary-light)', fontFamily: 'monospace' }}>FRAME_{idx + 1}</div>
                                          <div style={{ fontSize: '12px', fontWeight: 900, color: 'white', fontFamily: 'monospace' }}>{s.timestamp}ms</div>
                                       </div>
                                     </div>
                                   ))}
                                 </div>
                               </div>
                             )}

                            {/* Vertical Stack for Diagnostics */}
                            <div className="flex flex-col gap-12 pb-12">
                              <div id="diagnostics-section">
                                <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '0.1em' }}>
                                  <AlertTriangle size={16} style={{ color: '#f59e0b' }} /> Diagnósticos del Motor de Auditoría
                                </h4>
                                <div className="grid grid-cols-1 gap-6">
                                  {issuesObj.length === 0 ? (
                                    <div style={{ padding: '3rem', borderRadius: '24px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)', textAlign: 'center' }}>
                                      <p style={{ color: '#10b981', fontWeight: 800, fontSize: '1rem' }}>Estado Óptimo: El protocolo no detectó incidencias críticas en este nodo.</p>
                                    </div>
                                  ) : (
                                    issuesObj.map((issue, idx) => (
                                      <div key={idx} style={{ 
                                        padding: '2rem', 
                                        borderRadius: '24px', 
                                        background: 'rgba(255,255,255,0.02)', 
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        transition: 'all 0.3s ease'
                                      }} className="hover:border-white/10 hover:bg-white/3">
                                        <div className="flex justify-between items-center mb-4">
                                          <span style={{ fontSize: '1rem', fontWeight: 900, color: 'white', letterSpacing: '-0.01em' }}>{issue.title}</span>
                                          {issue.displayValue && <span style={{ fontSize: '10px', fontWeight: 900, padding: '6px 12px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>{issue.displayValue}</span>}
                                        </div>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }} dangerouslySetInnerHTML={{__html: issue.description.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" style="color: var(--primary-light); text-decoration: underline;">$1</a>')}}></p>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
             </div>
          </div>

          <div className="mt-20">
             {/* End of report buffer */}
          </div>
        </div>
      )}


      {/* GTM Inspector View */}
      {viewMode === 'inspector' && (
        <div className="animate-fade-in">
          <TagInspector
            results={filteredResults}
            scans={data.scans}
            activeScanIdx={activeScanIdx}
            onScanSelect={setActiveScanIdx}
            resultsToCompare={compareScanIdx !== null ? data.scans[compareScanIdx]?.results?.filter(r => r.device_type === activeDevice) : null}
            onCompareSelect={(id) => {
              if (id === '') setCompareScanIdx(null);
              else {
                const idx = data.scans.findIndex(s => s.id.toString() === id.toString());
                setCompareScanIdx(idx === -1 ? null : idx);
              }
            }}
          />
        </div>
      )}

    </div>
  );
}
