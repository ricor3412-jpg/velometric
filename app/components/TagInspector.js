'use client';

import { useState, useMemo } from 'react';
import { 
  Check, AlertTriangle, Activity, Code, Tag, Zap, Eye, 
  Search, Shield, Gauge, ChevronDown, ChevronUp, Terminal,
  Layout, BarChart3, Info
} from 'lucide-react';

// Map Lighthouse audit results into GTM-style "Tags"
function mapToTags(results) {
  const tags = [];
  results.forEach((res, resIdx) => {
    let parsed = {};
    try { 
      parsed = typeof res.raw_data === 'string' ? JSON.parse(res.raw_data || '{}') : (res.raw_data || {});
    } catch (e) {}
    const issues = parsed.issues || [];
    const metrics = parsed.metrics || {};
    const path = res.url.replace(/https?:\/\/[^/]+/, '') || '/';

    // Performance Score
    tags.push({
      id: `perf-${resIdx}`,
      category: 'performance',
      name: 'Rendimiento General',
      page: path,
      status: res.perf_score >= 90 ? 'passed' : res.perf_score >= 50 ? 'warning' : 'fired',
      value: `${res.perf_score}/100`,
      icon: 'gauge',
    });

    // Web Vitals
    if (metrics.lcp) {
      const val = parseFloat(metrics.lcp);
      tags.push({
        id: `lcp-${resIdx}`,
        category: 'performance',
        name: 'Largest Contentful Paint',
        page: path,
        status: val <= 2.5 ? 'passed' : val <= 4 ? 'warning' : 'fired',
        value: metrics.lcp,
        icon: 'zap',
      });
    }

    if (metrics.cls) {
      const val = parseFloat(metrics.cls);
      tags.push({
        id: `cls-${resIdx}`,
        category: 'performance',
        name: 'Cumulative Layout Shift',
        page: path,
        status: val <= 0.1 ? 'passed' : val <= 0.25 ? 'warning' : 'fired',
        value: metrics.cls,
        icon: 'activity',
      });
    }

    // Scores
    ['seo', 'a11y', 'bp'].forEach(key => {
      const score = res[`${key}_score`];
      const nameMap = { seo: 'SEO Score', a11y: 'Accesibilidad', bp: 'Buenas Prácticas' };
      const catMap = { seo: 'seo', a11y: 'accessibility', bp: 'best-practices' };
      const iconMap = { seo: 'search', a11y: 'eye', bp: 'shield' };
      tags.push({
        id: `${key}-${resIdx}`,
        category: catMap[key],
        name: nameMap[key],
        page: path,
        status: score >= 90 ? 'passed' : score >= 50 ? 'warning' : 'fired',
        value: `${score}/100`,
        icon: iconMap[key],
      });
    });

    issues.forEach((issue, issueIdx) => {
      tags.push({
        id: `issue-${resIdx}-${issueIdx}`,
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

const IconMap = ({ icon, className }) => {
  const props = { className, size: 18, strokeWidth: 2.5 };
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

const STATUS_THEME = {
  fired: 'bg-error/10 border-error/20 text-error',
  warning: 'bg-warning/10 border-warning/20 text-warning',
  passed: 'bg-success/10 border-success/20 text-success',
};

const STATUS_DOT = {
  fired: 'bg-error shadow-[0_0_10px_theme(colors.error.DEFAULT)]',
  warning: 'bg-warning shadow-[0_0_10px_theme(colors.warning.DEFAULT)]',
  passed: 'bg-success shadow-[0_0_10px_theme(colors.success.DEFAULT)]',
};

const CATEGORY_LABELS = {
  performance: { label: '⚡ Perf', color: 'text-error' },
  seo: { label: '🔍 SEO', color: 'text-success' },
  accessibility: { label: '♿ Acc', color: 'text-blue-400' },
  'best-practices': { label: '✅ BP', color: 'text-warning' },
  diagnostics: { label: '🔧 Diag', color: 'text-purple-400' },
};

export default function TagInspector({ results }) {
  const [activeTab, setActiveTab] = useState('tags');
  const [selectedDevice, setSelectedDevice] = useState('desktop');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPage, setSelectedPage] = useState('all');
  const [expandedTag, setExpandedTag] = useState(null);

  const allTags = useMemo(() => mapToTags(results), [results]);
  const pages = useMemo(() => [...new Set(results.map(r => r.url.replace(/https?:\/\/[^/]+/, '') || '/'))], [results]);

  const visibleTags = allTags.filter(t => {
    // Filter by device if the result has it
    const res = results.find(r => r.url.replace(/https?:\/\/[^/]+/, '') === t.page || r.url === t.page);
    if (res && res.device_type !== selectedDevice) return false;
    
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (selectedPage !== 'all' && t.page !== selectedPage) return false;
    return true;
  });

  const stats = {
    fired: allTags.filter(t => t.status === 'fired').length,
    warning: allTags.filter(t => t.status === 'warning').length,
    passed: allTags.filter(t => t.status === 'passed').length,
  };

  return (
    <div className="velo-card overflow-hidden !p-0">
      {/* Premium Header */}
      <div className="p-8 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="p-3.5 bg-primary/10 rounded-2xl border border-primary/20 text-primary shadow-[0_0_20px_rgba(59,130,246,0.1)]">
            <Terminal size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
              VELOINSPECTOR <span className="text-[10px] font-mono text-primary/50 tracking-widest px-2 py-0.5 border border-primary/20 rounded bg-primary/5">PREMIUM v5.0</span>
            </h3>
            <p className="text-xs font-medium text-text-dim mt-1 tracking-wide">Infrastructure Protocol Diagnostics & Telemetry</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${stats.fired > 0 ? 'bg-error/10 border-error/20 text-error' : 'bg-white/5 border-white/10 text-text-dim'}`}>
            {stats.fired} Fired
          </div>
          <div className="px-4 py-2 rounded-xl bg-success/10 border border-success/20 text-success text-[10px] font-black uppercase tracking-widest">
            {stats.passed} Passed
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 bg-black/20">
        {[
          { id: 'tags', label: 'Telemetry Logs', icon: <Layout size={14} /> },
          { id: 'data', label: 'Data Registry', icon: <BarChart3 size={14} /> },
          { id: 'raw', label: 'Raw Payload', icon: <Code size={14} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-8 py-5 flex items-center gap-3 text-[11px] font-black uppercase tracking-widest transition-all relative group ${activeTab === tab.id ? 'text-primary' : 'text-text-dim hover:text-white'}`}
          >
            <span className={`${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}>{tab.icon}</span>
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-6 right-6 h-1 bg-primary rounded-full shadow-[0_0_10px_theme(colors.primary.DEFAULT)]" />
            )}
          </button>
        ))}
      </div>

      <div className="p-8">
        {activeTab === 'tags' && (
          <div className="space-y-8 animate-fade-in">
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
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

              <select 
                id="filter-status"
                className="select-glass min-w-[200px]"
                onChange={e => setFilterStatus(e.target.value)}
                value={filterStatus}
              >
                <option value="all">ALL PROTOCOLS</option>
                <option value="fired">FIRED CRITICAL</option>
                <option value="warning">WARNING ADVISORY</option>
                <option value="passed">SYSTEM PASS</option>
              </select>

              <select 
                id="filter-page"
                className="select-glass min-w-[240px]"
                onChange={e => setSelectedPage(e.target.value)}
                value={selectedPage}
              >
                <option value="all">ALL ENDPOINTS</option>
                {pages.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
              </select>
            </div>

            {/* Tag List */}
            <div className="grid gap-4">
              {visibleTags.length === 0 ? (
                <div className="py-20 text-center opacity-20 border border-dashed border-white/10 rounded-2xl">
                   <Info size={40} className="mx-auto mb-4" />
                   <p className="text-[10px] font-black uppercase tracking-[0.3em]">No matching telemetry found</p>
                </div>
              ) : (
                visibleTags.map(tag => {
                  const isExpanded = expandedTag === tag.id;
                  return (
                    <div 
                      key={tag.id}
                      onClick={() => setExpandedTag(isExpanded ? null : tag.id)}
                      className={`group border transition-all duration-300 cursor-pointer overflow-hidden rounded-2xl ${isExpanded ? 'bg-white/[0.04] border-white/10 scale-[1.005] shadow-2xl' : 'bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.02]'}`}
                    >
                      <div className="p-6 flex items-center justify-between gap-6">
                        <div className="flex items-center gap-6 flex-1 min-w-0">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[tag.status]}`} />
                          <div className={`p-3 rounded-xl transition-all ${isExpanded ? 'bg-white/10 text-white' : 'bg-white/5 text-text-dim group-hover:bg-white/10 group-hover:text-white'}`}>
                            <IconMap icon={tag.icon} />
                          </div>
                          <div className="truncate">
                            <div className="text-sm font-bold text-white tracking-tight group-hover:text-primary transition-colors">{tag.name}</div>
                            <div className="text-[10px] font-mono text-text-dim mt-1 uppercase tracking-widest">{tag.page}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 flex-shrink-0">
                          <div className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-white/5 rounded-lg ${CATEGORY_LABELS[tag.category]?.color || 'text-text-dim'}`}>
                            {CATEGORY_LABELS[tag.category]?.label || tag.category}
                          </div>
                          <div className="text-sm font-black text-white font-mono w-24 text-right hidden sm:block">
                            {tag.value}
                          </div>
                          <div className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest w-24 text-center ${STATUS_THEME[tag.status]}`}>
                            {tag.status}
                          </div>
                          <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                            <ChevronDown size={14} className="text-text-dim" />
                          </div>
                        </div>
                      </div>

                      {isExpanded && tag.description && (
                        <div className="px-6 pb-6 animate-slide-down">
                          <div className="p-6 bg-black/40 rounded-xl border border-white/5 space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                              <Info size={12} />
                              System Diagnostic
                            </div>
                            <p className="text-xs text-text-secondary leading-relaxed font-medium">
                              {tag.description}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="animate-fade-in overflow-hidden border border-white/5 rounded-2xl bg-black/20">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white/[0.03] border-b border-white/5">
                <tr>
                  {['Variable', 'Metric Value', 'Context', 'Status'].map(h => (
                    <th key={h} className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-text-dim">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {results.map((v, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white tracking-tight group-hover:text-primary transition-colors">Performance Index</span>
                        <span className="text-[10px] font-mono text-text-dim uppercase mt-1">telemetry_v5_index</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 font-mono text-sm font-black text-secondary">{v.perf_score}</td>
                    <td className="px-8 py-6 text-[10px] font-black text-text-dim uppercase tracking-widest">
                       Endpoint: {v.url.replace(/https?:\/\/[^/]+/, '') || '/'}
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 rounded-full bg-success/10 text-success text-[9px] font-black tracking-widest border border-success/20">NOMINAL</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'raw' && (
          <div className="animate-fade-in">
             <div className="bg-black/40 rounded-2xl border border-white/5 p-1 relative group">
                <div className="absolute top-4 right-4 flex gap-2">
                   <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-[9px] font-black text-text-dim uppercase tracking-widest">JSON Format</div>
                </div>
                <pre className="p-8 font-mono text-[11px] text-text-secondary leading-relaxed overflow-auto max-h-[600px] scrollbar-thin">
                  {JSON.stringify(results, null, 2)}
                </pre>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
