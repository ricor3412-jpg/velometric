'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Key, Plus, Trash2, Copy, Check, Terminal, ShieldCheck, 
  Zap, Send, Code, Database, Globe, RefreshCw, ArrowLeft,
  Activity, Cpu, Shield, ArrowUpRight, Lock, Server
} from 'lucide-react';
import Link from 'next/link';

export default function Integrations() {
  const [keys, setKeys] = useState([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedKey, setGeneratedKey] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  
  // Playground state
  const [testKey, setTestKey] = useState('');
  const [testUrl, setTestUrl] = useState('https://google.com');
  const [testResponse, setTestResponse] = useState(null);
  const [testing, setTesting] = useState(false);

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch('/api/keys');
      if (!res.ok) throw new Error('Failed to fetch keys');
      const data = await res.json();
      if (data.success) setKeys(data.keys);
    } catch (e) { console.error('Fetch Keys Error:', e); }
  }, []);

  useEffect(() => {
    const init = async () => {
      await fetchKeys();
    };
    init();
  }, [fetchKeys]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newKeyName) return;
    setLoading(true);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName })
      });
      
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        throw new Error('Invalid server response');
      }

      if (data.success) {
        setGeneratedKey(data.key);
        setTestKey(data.key); 
        setNewKeyName('');
        fetchKeys();
      } else {
        alert(data.error || 'Failed to create key');
      }
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to revoke this API key?')) return;
    try {
      const res = await fetch('/api/keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      
      if (!res.ok) throw new Error('Failed to delete key');
      const data = await res.json();
      if (data.success) fetchKeys();
    } catch (e) { alert(e.message); }
  };

  const handleTestAPI = async () => {
    if (!testKey || !testUrl) return;
    setTesting(true);
    setTestResponse(null);
    try {
      const res = await fetch('/api/v1/scan', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-KEY': testKey
        },
        body: JSON.stringify({ url: testUrl })
      });
      
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        setTestResponse(data);
      } catch (parseErr) {
        setTestResponse({ error: 'Invalid JSON response', raw: text.substring(0, 500) });
      }
    } catch (err) {
      setTestResponse({ error: 'Connection failure', details: err.message });
    }
    setTesting(false);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="container-full animate-fade-in section-padding">
      {/* Editorial Header */}
      <div className="mb-24">
        <Link href="/" className="inline-flex items-center gap-3 text-[11px] font-black text-text-dim hover:text-primary transition-all uppercase tracking-[0.3em] no-underline mb-12">
          <ArrowLeft size={16} />
          Protocol Dashboard
        </Link>
        
        <div className="flex flex-col md:flex-row justify-between items-end gap-16">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-6">
              <span className="velo-badge bg-secondary/10 text-secondary-light border-secondary/20">API Connect</span>
              <span className="text-[11px] font-black text-text-dim uppercase tracking-[0.2em]">Protocol v5.0.4</span>
            </div>
            <h1 className="text-8xl font-black tracking-tighter text-white leading-none">
              Developer <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }} className="italic">Integrations.</span>
            </h1>
            <p className="text-2xl font-medium text-text-muted max-w-3xl mt-10 leading-relaxed">
              Manage your API credentials, generate secure signatures, and validate infrastructure connections in our high-fidelity sandbox.
            </p>
          </div>

          <div className="p-8 bg-secondary/10 border border-secondary/20 rounded-3xl text-secondary shadow-[0_0_50px_rgba(139,92,246,0.15)]">
            <Lock size={48} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-20 items-start">
        {/* Main Content (8/12) */}
        <div className="col-span-12 lg:col-span-8 space-y-12">
          
          {/* Key Management */}
          <section className="velo-card p-16">
            <div className="flex justify-between items-center mb-16 pb-10 border-b border-white/[0.05]">
              <div className="flex items-center gap-6">
                <div className="p-5 bg-primary/10 rounded-2xl text-primary border border-primary/20">
                  <Key size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-black tracking-tight text-white">API Credentials</h3>
                  <p className="text-[11px] font-black text-text-dim uppercase tracking-widest mt-2">Authenticated Telemetry Nodes</p>
                </div>
              </div>
              <span className="text-[12px] font-black text-text-dim uppercase tracking-[0.2em] bg-white/[0.03] px-6 py-3 rounded-full border border-white/[0.05]">
                {keys.length} Active Key{keys.length !== 1 ? 's' : ''}
              </span>
            </div>

            <form onSubmit={handleCreate} className="flex flex-col gap-10 mb-16">
              <div className="velo-input-group p-3">
                <div className="flex items-center pl-8 text-text-dim">
                  <Database size={24} />
                </div>
                <input 
                  type="text" 
                  placeholder="Key name (e.g. Production Server)" 
                  className="velo-input px-8 text-xl"
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  required
                />
                <button type="submit" className="velo-btn-primary px-12 py-5" disabled={loading}>
                  {loading ? <RefreshCw className="animate-spin" size={24} /> : <Plus size={24} />}
                  <span>{loading ? 'Generating...' : 'Initialize Key'}</span>
                </button>
              </div>
            </form>

            {generatedKey && (
              <div className="p-10 bg-success/10 border border-success/20 rounded-[32px] mb-16 animate-fade-in relative overflow-hidden group">
                <div className="flex items-center gap-4 mb-6">
                  <ShieldCheck size={20} className="text-success" />
                  <span className="text-[12px] font-black text-success uppercase tracking-[0.2em]">Master Key Generated — Securely Store Now</span>
                </div>
                <div className="flex items-center gap-6 bg-black/40 p-6 rounded-2xl border border-white/5 shadow-inner">
                  <code className="flex-1 font-mono text-lg text-white tracking-widest truncate">{generatedKey}</code>
                  <button onClick={() => copyToClipboard(generatedKey, 'new')} className={`velo-btn-primary !px-10 !py-4 ${copiedId === 'new' ? '!bg-success !border-success' : ''}`}>
                    {copiedId === 'new' ? <Check size={18} /> : <Copy size={18} />}
                    <span>{copiedId === 'new' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-6">
               {keys.length === 0 ? (
                 <div className="py-32 text-center border border-dashed border-white/[0.05] rounded-[32px] opacity-30">
                   <Activity size={64} className="mx-auto mb-8 text-text-dim" strokeWidth={1} />
                   <p className="text-[12px] font-black uppercase tracking-[0.2em]">No active credentials detected</p>
                 </div>
               ) : (
                 keys.map(k => (
                   <div key={k.id} className="flex justify-between items-center p-10 bg-white/[0.02] border border-white/[0.05] rounded-[32px] hover:border-primary/30 transition-all group">
                     <div className="flex items-center gap-10">
                       <div className="w-3 h-3 rounded-full bg-success shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                       <div className="flex flex-col">
                         <span className="text-2xl font-black text-white tracking-tighter group-hover:text-primary transition-all uppercase">{k.name}</span>
                         <span className="text-[12px] font-bold text-text-dim uppercase mt-2 tracking-widest">Node Provisioned: {new Date(k.created_at).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })}</span>
                       </div>
                     </div>
                     <button onClick={() => handleDelete(k.id)} className="p-5 text-text-dim hover:text-error hover:bg-error/10 rounded-2xl transition-all border border-transparent hover:border-error/20">
                       <Trash2 size={24} />
                     </button>
                   </div>
                 ))
               )}
            </div>
          </section>

          {/* Playground / Sandbox */}
          <section className="velo-card p-16">
             <div className="flex justify-between items-center mb-16 pb-10 border-b border-white/[0.05]">
               <div className="flex items-center gap-6">
                 <div className="p-5 bg-secondary/10 rounded-2xl text-secondary border border-secondary/20">
                   <Terminal size={32} />
                 </div>
                 <div>
                   <h3 className="text-3xl font-black tracking-tight text-white">API Sandbox</h3>
                   <p className="text-[11px] font-black text-text-dim uppercase tracking-widest mt-2">Protocol Simulation Environment</p>
                 </div>
               </div>
               <span className="flex items-center gap-3 text-[12px] font-black text-success uppercase tracking-[0.2em] bg-success/5 px-6 py-3 rounded-full border border-success/10">
                 <div className="w-2 h-2 rounded-full bg-success animate-pulse shadow-[0_0_10px_var(--success)]" />
                 Simulation Active
               </span>
             </div>
             
             <div className="flex flex-col gap-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="flex flex-col gap-4">
                    <label className="text-[11px] font-black text-text-dim uppercase tracking-[0.3em] px-2">Target Endpoint URL</label>
                    <div className="velo-input-group p-2">
                      <div className="flex items-center pl-6 text-text-dim">
                        <Globe size={20} />
                      </div>
                      <input 
                        type="url" 
                        className="velo-input px-6 text-lg"
                        value={testUrl}
                        onChange={e => setTestUrl(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <label className="text-[11px] font-black text-text-dim uppercase tracking-[0.3em] px-2">Authorization Token</label>
                    <div className="velo-input-group p-2">
                      <div className="flex items-center pl-6 text-text-dim">
                        <Key size={20} />
                      </div>
                      <input 
                        type="text" 
                        className="velo-input px-6 text-lg"
                        placeholder="ps_..."
                        value={testKey}
                        onChange={e => setTestKey(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleTestAPI} 
                  className="velo-btn-secondary w-full py-6 text-xl shadow-[0_20px_40px_rgba(139,92,246,0.1)]" 
                  disabled={testing || !testKey}
                >
                  {testing ? <RefreshCw size={24} className="animate-spin" /> : <Send size={24} />}
                  <span>{testing ? 'Executing handshake...' : 'Dispatch API Request'}</span>
                </button>

                <div className="rounded-[40px] border border-white/[0.05] bg-black/60 overflow-hidden shadow-2xl">
                  <div className="bg-white/[0.03] px-10 py-5 flex items-center justify-between border-b border-white/[0.05]">
                     <div className="flex gap-3">
                        <div className="w-3 h-3 rounded-full bg-error/20" />
                        <div className="w-3 h-3 rounded-full bg-warning/20" />
                        <div className="w-3 h-3 rounded-full bg-success/20" />
                     </div>
                     <span className="text-[11px] font-black text-text-dim uppercase tracking-[0.3em]">Telemetry Response Output</span>
                  </div>
                  <div className="p-12 min-h-[400px] font-mono text-sm overflow-auto">
                     {testResponse ? (
                       <div className="flex flex-col gap-8">
                          <div className={`px-6 py-2 rounded-full w-fit border text-[11px] font-black uppercase tracking-[0.2em] ${testResponse.error ? 'border-error/30 text-error bg-error/5' : 'border-success/30 text-success bg-success/5'}`}>
                             Protocol Status: {testResponse.error ? 'Failure' : '200 OK — Success'}
                          </div>
                          <pre className={`p-8 rounded-[32px] bg-white/[0.02] border border-white/[0.05] leading-relaxed ${testResponse.error ? 'text-error' : 'text-primary-light shadow-[0_0_30px_rgba(59,130,246,0.05)]'}`}>
                             {JSON.stringify(testResponse, null, 2)}
                          </pre>
                       </div>
                     ) : (
                       <div className="h-full flex flex-col items-center justify-center text-text-dim opacity-20 gap-8 mt-24">
                          <Activity size={80} strokeWidth={1} className="animate-pulse" />
                          <span className="tracking-[0.8em] uppercase text-[12px] font-black">Awaiting Handshake</span>
                       </div>
                     )}
                  </div>
                </div>
             </div>
          </section>
        </div>

        {/* Sidebar (4/12) */}
        <aside className="col-span-12 lg:col-span-4 flex flex-col gap-12">
          <div className="velo-card p-16">
            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] mb-16 text-white flex items-center gap-4">
               <Server size={20} className="text-secondary" />
               Technical Protocol
            </h4>
            
            <div className="flex flex-col gap-20">
              <div className="flex flex-col gap-6">
                <h5 className="text-[13px] font-black uppercase text-white tracking-[0.2em] flex items-center gap-4">
                   <div className="w-6 h-[2px] bg-secondary shadow-[0_0_10px_var(--secondary)]" />
                   Authentication
                </h5>
                <p className="text-[15px] text-text-muted leading-relaxed font-medium">Pass your unique cryptographic key in the <code className="text-secondary font-black bg-secondary/10 px-2 py-1 rounded-md">X-API-KEY</code> header for every request.</p>
                <div className="p-6 bg-black/60 rounded-3xl border border-white/[0.05] font-mono text-[12px] shadow-inner">
                  <span className="text-secondary-light font-black">X-API-KEY:</span> <span className="text-text-dim">ps_master_...</span>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <h5 className="text-[13px] font-black uppercase text-white tracking-[0.2em] flex items-center gap-4">
                   <div className="w-6 h-[2px] bg-primary shadow-[0_0_10px_var(--primary)]" />
                   Scan Endpoint
                </h5>
                <p className="text-[15px] text-text-muted leading-relaxed font-medium">Trigger asynchronous audits via POST requests to our distributed telemetry nodes.</p>
                <div className="p-6 bg-black/60 rounded-3xl border border-white/[0.05] font-mono text-[12px] shadow-inner">
                  <span className="text-primary-light font-black uppercase">POST</span> <span className="text-text-dim">/api/v1/scan</span>
                </div>
              </div>

              <div className="p-8 bg-primary/10 border border-primary/20 rounded-[32px] group hover:bg-primary/[0.15] transition-all">
                 <div className="flex gap-6">
                    <Zap size={24} className="text-primary shrink-0" />
                    <p className="text-[12px] font-bold text-text-secondary leading-relaxed uppercase tracking-wider">
                      Use <code className="text-primary-light font-black">mode: &quot;ultra&quot;</code> for high-precision analysis in enterprise environments.
                    </p>
                 </div>
              </div>
            </div>
          </div>

          <div className="velo-card p-16 bg-gradient-to-br from-secondary/20 via-transparent to-primary/20 border-white/10 text-center relative overflow-hidden group">
             <ShieldCheck size={80} className="mx-auto mb-10 text-secondary" strokeWidth={1} />
             <h4 className="text-3xl font-black uppercase tracking-tighter text-white mb-4">Enterprise Grade</h4>
             <p className="text-[15px] font-medium text-text-muted leading-relaxed max-w-[280px] mx-auto">
                All communications are secured via TLS 1.3 and audited by our core security sentinel in real-time.
             </p>
             <div className="mt-12">
                <button className="velo-btn-primary w-full justify-center group-hover:scale-[1.02] transition-transform">
                   Request Dedicated Node
                </button>
             </div>
             <Activity size={180} className="absolute -bottom-10 -left-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none" />
          </div>
        </aside>
      </div>
    </div>
  );
}
