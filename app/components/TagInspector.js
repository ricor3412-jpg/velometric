'use client';

import { useState } from 'react';
import { Check, X, AlertTriangle, Activity, Code, Tag, Clock, ChevronRight, Zap, Eye, Search, FileText, Shield, Gauge, Download } from 'lucide-react';

// Map Lighthouse audit results into GTM-style "Tags"
function mapToTags(results) {
  const tags = [];

  results.forEach(res => {
    let parsed = {};
    try { parsed = JSON.parse(res.raw_data || '{}'); } catch (e) {}
    const issues = parsed.issues || [];
    const metrics = parsed.metrics || {};
    const path = res.url.replace(/https?:\/\/[^/]+/, '') || '/';

    // === PERFORMANCE TAGS ===
    const perfScore = res.perf_score;
    tags.push({
      id: `perf-${res.url}`,
      category: 'performance',
      name: 'Rendimiento General',
      page: path,
      status: perfScore >= 90 ? 'passed' : perfScore >= 50 ? 'warning' : 'fired',
      value: `${perfScore}/100`,
      icon: 'gauge',
    });

    // LCP Tag
    if (metrics.lcp) {
      const lcpVal = parseFloat(metrics.lcp);
      tags.push({
        id: `lcp-${res.url}`,
        category: 'performance',
        name: 'Largest Contentful Paint',
        page: path,
        status: lcpVal <= 2.5 ? 'passed' : lcpVal <= 4 ? 'warning' : 'fired',
        value: metrics.lcp,
        icon: 'zap',
      });
    }

    // FCP Tag
    if (metrics.fcp) {
      const fcpVal = parseFloat(metrics.fcp);
      tags.push({
        id: `fcp-${res.url}`,
        category: 'performance',
        name: 'First Contentful Paint',
        page: path,
        status: fcpVal <= 1.8 ? 'passed' : fcpVal <= 3 ? 'warning' : 'fired',
        value: metrics.fcp,
        icon: 'zap',
      });
    }

    // TBT Tag
    if (metrics.tbt) {
      const tbtVal = parseFloat(metrics.tbt);
      tags.push({
        id: `tbt-${res.url}`,
        category: 'performance',
        name: 'Total Blocking Time',
        page: path,
        status: tbtVal <= 200 ? 'passed' : tbtVal <= 600 ? 'warning' : 'fired',
        value: metrics.tbt,
        icon: 'activity',
      });
    }

    // CLS Tag
    if (metrics.cls) {
      const clsVal = parseFloat(metrics.cls);
      tags.push({
        id: `cls-${res.url}`,
        category: 'performance',
        name: 'Cumulative Layout Shift',
        page: path,
        status: clsVal <= 0.1 ? 'passed' : clsVal <= 0.25 ? 'warning' : 'fired',
        value: metrics.cls,
        icon: 'activity',
      });
    }

    // === SEO TAGS ===
    tags.push({
      id: `seo-${res.url}`,
      category: 'seo',
      name: 'SEO Score',
      page: path,
      status: res.seo_score >= 90 ? 'passed' : res.seo_score >= 50 ? 'warning' : 'fired',
      value: `${res.seo_score}/100`,
      icon: 'search',
    });

    // === ACCESSIBILITY TAGS ===
    tags.push({
      id: `a11y-${res.url}`,
      category: 'accessibility',
      name: 'Accesibilidad',
      page: path,
      status: res.a11y_score >= 90 ? 'passed' : res.a11y_score >= 50 ? 'warning' : 'fired',
      value: `${res.a11y_score}/100`,
      icon: 'eye',
    });

    // === BEST PRACTICES TAGS ===
    tags.push({
      id: `bp-${res.url}`,
      category: 'best-practices',
      name: 'Buenas Prácticas',
      page: path,
      status: res.bp_score >= 90 ? 'passed' : res.bp_score >= 50 ? 'warning' : 'fired',
      value: `${res.bp_score}/100`,
      icon: 'shield',
    });

    // === ISSUE-BASED TAGS ===
    issues.forEach(issue => {
      tags.push({
        id: `issue-${res.url}-${issue.id}`,
        category: 'diagnostics',
        name: issue.title,
        page: path,
        status: issue.score === 0 ? 'fired' : 'warning',
        value: issue.displayValue || 'Falla',
        icon: 'alert',
        description: issue.description,
      });
    });
  });

  return tags;
}

// Extract variables table data
function extractVariables(results) {
  return results.map(res => {
    let parsed = {};
    try { parsed = JSON.parse(res.raw_data || '{}'); } catch (e) {}
    const metrics = parsed.metrics || {};
    const path = res.url.replace(/https?:\/\/[^/]+/, '') || '/';

    return {
      page: path,
      url: res.url,
      performance: res.perf_score,
      seo: res.seo_score,
      accessibility: res.a11y_score,
      bestPractices: res.bp_score,
      fcp: metrics.fcp || '—',
      lcp: metrics.lcp || '—',
      tbt: metrics.tbt || '—',
      cls: metrics.cls || '—',
      si: metrics.si || '—',
      issueCount: (parsed.issues || []).length,
    };
  });
}

const IconMap = ({ icon, size = 14 }) => {
  const props = { size, strokeWidth: 2 };
  switch (icon) {
    case 'gauge': return <Gauge {...props} />;
    case 'zap': return <Zap {...props} />;
    case 'activity': return <Activity {...props} />;
    case 'search': return <Search {...props} />;
    case 'eye': return <Eye {...props} />;
    case 'shield': return <Shield {...props} />;
    case 'alert': return <AlertTriangle {...props} />;
    default: return <Tag {...props} />;
  }
};

const STATUS_CONFIG = {
  fired: { bg: 'rgba(239, 68, 68, 0.05)', border: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', dot: '#ef4444', label: 'FIRED' },
  warning: { bg: 'rgba(245, 158, 11, 0.05)', border: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', dot: '#f59e0b', label: 'WARN' },
  passed: { bg: 'rgba(16, 185, 129, 0.05)', border: 'rgba(16, 185, 129, 0.1)', text: '#10b981', dot: '#10b981', label: 'PASSED' },
};

const CATEGORY_LABELS = {
  performance: { label: '⚡ Perf', color: '#ef4444' },
  seo: { label: '🔍 SEO', color: '#10b981' },
  accessibility: { label: '♿ Acc', color: '#3b82f6' },
  'best-practices': { label: '✅ BP', color: '#f59e0b' },
  diagnostics: { label: '🔧 Diag', color: '#a855f7' },
};

const FIX_ADVICE = {
  'render-blocking-resources': 'Reduce scripts y CSS bloqueantes. Usa `async` o `defer`.',
  'unused-javascript': 'Elimina JS no utilizado para acelerar la interacción.',
  'unused-css-rules': 'Purga CSS no utilizado.',
  'modern-image-formats': 'Usa WebP o AVIF.',
  'offscreen-images': 'Implementa lazy loading.',
  'uses-responsive-images': 'Usa `srcset` para diferentes resoluciones.',
};

export default function TagInspector({ results, scans, activeScanIdx, onScanSelect, resultsToCompare = null, onCompareSelect }) {
  const [activeTab, setActiveTab] = useState('tags');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedPage, setSelectedPage] = useState('all');
  const [expandedTag, setExpandedTag] = useState(null);

  if (!results || results.length === 0) {
    return (
      <div className="p-12 text-center opacity-30">
        No hay datos para inspeccionar.
      </div>
    );
  }

  const allTags = mapToTags(results);
  const variables = extractVariables(results);
  const pages = [...new Set(results.map(r => r.url.replace(/https?:\/\/[^/]+/, '') || '/'))];
  
  const getDelta = (currentVal, page, metricKey) => {
    if (!resultsToCompare) return null;
    const compareVariables = extractVariables(resultsToCompare);
    const compareItem = compareVariables.find(v => v.page === page);
    if (!compareItem) return null;
    const oldVal = compareItem[metricKey];
    if (typeof currentVal === 'number' && typeof oldVal === 'number') {
      const diff = currentVal - oldVal;
      return { value: diff, improved: metricKey === 'issueCount' ? diff < 0 : diff > 0 };
    }
    return null;
  };

  let visibleTags = allTags;
  if (filterStatus !== 'all') visibleTags = visibleTags.filter(t => t.status === filterStatus);
  if (filterCategory !== 'all') visibleTags = visibleTags.filter(t => t.category === filterCategory);
  if (selectedPage !== 'all') visibleTags = visibleTags.filter(t => t.page === selectedPage);

  const firedCount = allTags.filter(t => t.status === 'fired').length;
  const warnCount = allTags.filter(t => t.status === 'warning').length;
  const passedCount = allTags.filter(t => t.status === 'passed').length;

  const tabs = [
    { id: 'tags', label: 'Tags Fired', icon: <Tag size={14} /> },
    { id: 'variables', label: 'Dataleayer', icon: <Activity size={14} /> },
    { id: 'advisor', label: 'AI Advisor', icon: <Zap size={14} /> },
    { id: 'raw', label: 'Raw JSON', icon: <Code size={14} /> },
  ];

  return (
    <div className="velo-card p-0 overflow-hidden" style={{ background: 'rgba(10, 11, 16, 0.95)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px' }}>
      {/* GTM Style Header - V1 Style */}
      <div className="p-6 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex items-center gap-3">
           <Tag size={20} className="text-primary" />
           <div>
             <h3 style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.01em', color: 'white' }}>VELOINSPECTOR <span className="text-[10px] opacity-40 font-mono ml-2">v1.0</span></h3>
             <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>Diagnóstico de Capas de Datos e Etiquetas</p>
           </div>
        </div>
        <div className="flex gap-2">
           <div style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '10px', fontWeight: 700 }}>{firedCount} Fired</div>
           <div style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '10px', fontWeight: 700 }}>{passedCount} Passed</div>
        </div>
      </div>


      {/* Tabs */}
      <div className="flex px-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
        {tabs.map(tab => (
          <button key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-5 py-3 flex items-center gap-2 transition-all relative"
            style={{ 
              background: 'transparent', 
              cursor: 'pointer',
              border: 'none',
              color: activeTab === tab.id ? 'var(--primary-light)' : 'rgba(255,255,255,0.4)',
              fontSize: '0.75rem',
              fontWeight: 600
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {activeTab === tab.id && (
              <div style={{ 
                position: 'absolute', 
                bottom: 0, 
                left: '20%', 
                right: '20%', 
                height: '2px', 
                background: 'var(--primary)'
              }} />
            )}
          </button>
        ))}
      </div>


      {/* Content */}
      <div className="p-6">
        {activeTab === 'tags' && (
          <div className="animate-fade-in">
            <div className="flex gap-3 mb-6">
                 <select 
                   className="px-4 py-2 rounded-lg text-xs font-medium text-white focus:outline-none"
                   style={{ 
                     background: '#1a1b23', 
                     border: '1px solid rgba(255,255,255,0.1)', 
                     minWidth: '160px',
                     cursor: 'pointer'
                   }}
                   onChange={e => setFilterStatus(e.target.value)}
                 >
                   <option value="all">Todos los Estados</option>
                   <option value="fired">Fired</option>
                   <option value="warning">Warning</option>
                   <option value="passed">Passed</option>
                 </select>
               
                 <select 
                   className="px-4 py-2 rounded-lg text-xs font-medium text-white focus:outline-none"
                   style={{ 
                     background: '#1a1b23', 
                     border: '1px solid rgba(255,255,255,0.1)', 
                     minWidth: '200px',
                     cursor: 'pointer'
                   }}
                   onChange={e => setSelectedPage(e.target.value)}
                 >
                   <option value="all">Todas las Páginas</option>
                   {pages.map(p => <option key={p} value={p}>{p}</option>)}
                 </select>
            </div>


            <div className="flex flex-col gap-4">
              {visibleTags.map(tag => {
                const cfg = STATUS_CONFIG[tag.status];
                const cat = CATEGORY_LABELS[tag.category] || { label: tag.category, color: '#999' };
                const isOpen = expandedTag === tag.id;
                return (
                  <div key={tag.id} 
                    className="flex flex-col transition-all" 
                    onClick={() => setExpandedTag(isOpen ? null : tag.id)}
                    style={{ 
                      cursor: 'pointer',
                      background: isOpen ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderTopColor: isOpen ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                      borderRightColor: isOpen ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                      borderBottomColor: isOpen ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                      borderLeftColor: cfg.dot,
                      borderLeftWidth: '4px',
                      borderRadius: '12px',
                      overflow: 'hidden'
                    }}
                  >
                    <div className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          background: cfg.dot, 
                          flexShrink: 0
                        }} />
                        
                        <div style={{ 
                          padding: '8px', 
                          borderRadius: '10px', 
                          background: 'rgba(255,255,255,0.04)', 
                          color: isOpen ? 'white' : 'rgba(255,255,255,0.4)', 
                          display: 'flex', 
                          flexShrink: 0
                        }}>
                          <IconMap icon={tag.icon} size={18} />
                        </div>
                        <div className="truncate">
                          <div style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>{tag.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{tag.page}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div style={{ 
                          fontSize: '9px', 
                          fontWeight: 700, 
                          padding: '4px 8px', 
                          borderRadius: '6px', 
                          background: 'rgba(255,255,255,0.05)', 
                          color: cat.color, 
                          textTransform: 'uppercase'
                        }}>{cat.label}</div>

                        <div style={{ 
                          fontSize: '0.9rem', 
                          fontWeight: 700, 
                          color: 'white', 
                          minWidth: '80px', 
                          textAlign: 'right'
                        }} className="hidden sm:block">{tag.value}</div>

                        <div style={{ 
                          fontSize: '9px', 
                          fontWeight: 800, 
                          padding: '4px 10px', 
                          borderRadius: '6px', 
                          background: cfg.dot, 
                          color: 'white'
                        }}>{cfg.label}</div>
                      </div>
                    </div>
                    
                    {isOpen && tag.description && (
                      <div className="p-4 pt-0 animate-fade-in" style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                        <div style={{ 
                          fontSize: '0.8rem', 
                          color: 'rgba(255,255,255,0.5)', 
                          lineHeight: 1.6, 
                          marginTop: '1rem', 
                          padding: '1.5rem', 
                          background: 'rgba(0,0,0,0.2)', 
                          borderRadius: '10px'
                        }}>
                           <p dangerouslySetInnerHTML={{ __html: tag.description.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" style="color: var(--primary-light);">$1</a>') }}></p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

          </div>
        )}

        {activeTab === 'variables' && (
          <div className="animate-fade-in overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/2 border-bottom border-white/5">
                <tr>
                  {['Variable', 'Page', 'Type', 'Value', 'Status'].map(h => 
                    <th key={h} className="p-4 font-black uppercase tracking-widest text-zinc-500 text-[10px]">{h}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {variables.map((v, i) => (
                  <tr key={i} className="border-bottom border-white/5 hover:bg-white/2">
                    <td className="p-4 font-bold text-white">Performance Score</td>
                    <td className="p-4 text-zinc-500 font-mono">{v.page}</td>
                    <td className="p-4 text-zinc-600 uppercase font-black text-[9px]">Int</td>
                    <td className="p-4 font-black text-blue-400">{v.performance}/100</td>
                    <td className="p-4"><span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[9px] font-black">STABLE</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'raw' && (
          <div className="bg-black/50 p-6 rounded-xl border border-white/5 font-mono text-[11px] leading-relaxed text-zinc-500 overflow-auto max-h-[500px]">
            <pre>{JSON.stringify(results, null, 2)}</pre>
          </div>
        )}

        {activeTab === 'advisor' && (
          <div className="flex flex-col gap-4 animate-fade-in">
             <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 flex gap-6 items-start">
               <div className="p-4 rounded-full bg-primary/10 text-primary-light">
                 <Zap size={24} />
               </div>
               <div>
                 <h4 className="text-white font-black uppercase tracking-tighter text-lg">AI Performance Consultant</h4>
                 <p className="text-sm text-zinc-500">Analizando patrones de renderizado y cuellos de botella en la red...</p>
               </div>
             </div>
             
             {results.flatMap(r => {
               let rp = {}; try { rp = JSON.parse(r.raw_data); } catch(e) {}
               return Object.values(rp?.audits || {}).filter(a => a.score < 0.9 && FIX_ADVICE[a.id]);
             }).slice(0, 10).map((audit, i) => (
                <div key={i} className="p-5 rounded-2xl border border-white/5 bg-black hover:border-white/10 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle size={18} className="text-orange-500" />
                      <span className="text-white font-bold">{audit.title}</span>
                    </div>
                    {audit.displayValue && <span className="text-[10px] font-black px-2 py-0.5 bg-white/5 text-white rounded">{audit.displayValue}</span>}
                  </div>
                  <p className="text-xs text-zinc-500 mb-4">{FIX_ADVICE[audit.id]}</p>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 text-[10px] font-black uppercase bg-primary text-white rounded-lg hover:bg-primary-light transition-colors">Apply Fix</button>
                    <button className="px-3 py-1 text-[10px] font-black uppercase bg-white/5 text-zinc-400 rounded-lg hover:bg-white/10 transition-colors">Lab Test</button>
                  </div>
                </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
}
