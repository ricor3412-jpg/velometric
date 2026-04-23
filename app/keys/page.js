'use client';

import { useState, useEffect } from 'react';
import { 
  Lock, Key, Trash2, Plus, Copy, Check, 
  Shield, ShieldAlert, ArrowLeft 
} from 'lucide-react';
import Link from 'next/link';

export default function KeysPage() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const res = await fetch('/api/keys');
      const data = await res.json();
      if (data.success) setKeys(data.keys);
    } catch (e) {
      console.error('Failed to fetch keys');
    }
    setLoading(false);
  };

  const handleCreateKey = async (e) => {
    e.preventDefault();
    if (!newKeyName) return;
    
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName })
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedKey(data.key);
        setNewKeyName('');
        fetchKeys();
      }
    } catch (e) {
      alert('Error creating key');
    }
  };

  const handleRevokeKey = async (id) => {
    if (!confirm('Are you sure you want to revoke this key? Any external services using it will lose access immediately.')) return;
    
    try {
      await fetch('/api/keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      fetchKeys();
    } catch (e) {
      alert('Error revoking key');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container-full animate-fade-in section-padding min-h-screen">
      <div className="mb-20">
        <Link href="/" className="inline-flex items-center gap-4 text-text-dim hover:text-primary transition-colors mb-12 group">
          <ArrowLeft size={20} className="group-hover:-translate-x-2 transition-transform" />
          <span className="text-[11px] font-black uppercase tracking-[0.3em]">Back to Terminal</span>
        </Link>
        
        <div className="flex items-end gap-10">
          <div className="p-8 bg-primary/10 rounded-3xl text-primary border border-primary/20 shadow-[0_0_50px_rgba(59,130,246,0.15)]">
            <Lock size={48} />
          </div>
          <div>
             <h1 className="text-7xl font-black tracking-tighter text-white mb-4">
               Access <span className="text-primary">Tokens</span>
             </h1>
             <p className="text-xl font-medium text-text-muted max-w-2xl">
               Manage secure authentication keys for the VeloMetric API. 
               Used for external auditing and pipeline integration.
             </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
        {/* Create Key Section */}
        <div className="lg:col-span-5">
           <section className="velo-card p-12">
              <div className="flex items-center gap-6 mb-12">
                 <div className="p-4 bg-primary/10 rounded-2xl text-primary">
                    <Plus size={24} />
                 </div>
                 <h3 className="text-2xl font-black text-white">Generate Token</h3>
              </div>

              <form onSubmit={handleCreateKey} className="flex flex-col gap-8">
                 <div className="flex flex-col gap-4">
                    <label className="text-[11px] font-black text-text-dim uppercase tracking-widest pl-2">Token Name</label>
                    <input 
                      type="text"
                      value={newKeyName}
                      onChange={e => setNewKeyName(e.target.value)}
                      placeholder="e.g. Production API / GitHub Actions"
                      className="velo-input !p-6"
                      required
                    />
                 </div>
                 
                 <button type="submit" className="velo-btn-primary py-6 justify-center">
                    <span>Generate Access Key</span>
                    <Key size={20} />
                 </button>
              </form>

              {generatedKey && (
                <div className="mt-12 p-8 bg-success/5 border border-success/20 rounded-3xl animate-slide-up">
                   <div className="flex items-center gap-4 mb-6 text-success">
                      <Shield size={20} />
                      <span className="text-[11px] font-black uppercase tracking-widest">Token Created Successfully</span>
                   </div>
                   <p className="text-sm text-text-muted mb-6 leading-relaxed">
                     Copy this key now. For security reasons, you won't be able to see it again.
                   </p>
                   <div className="flex items-center gap-4 bg-black/40 p-5 rounded-2xl border border-white/10 group">
                      <code className="text-sm font-mono text-white flex-1 overflow-hidden truncate">
                        {generatedKey}
                      </code>
                      <button 
                        onClick={() => copyToClipboard(generatedKey)}
                        className="p-3 hover:bg-white/10 rounded-xl transition-colors text-primary"
                      >
                        {copied ? <Check size={20} /> : <Copy size={20} />}
                      </button>
                   </div>
                </div>
              )}
           </section>

           <div className="mt-12 p-10 bg-warning/5 border border-warning/10 rounded-3xl flex gap-8 items-start">
              <div className="p-4 bg-warning/10 rounded-2xl text-warning">
                 <ShieldAlert size={24} />
              </div>
              <div className="flex flex-col gap-3">
                 <h5 className="text-sm font-black text-white uppercase tracking-wider">Security Protocol</h5>
                 <p className="text-sm text-text-muted leading-relaxed">
                   API keys grant full access to your audit telemetry. Never share them in client-side code 
                   or public repositories.
                 </p>
              </div>
           </div>
        </div>

        {/* List Key Section */}
        <div className="lg:col-span-7">
           <div className="flex items-center justify-between px-4 mb-10">
              <div className="flex items-center gap-6">
                 <Key size={24} className="text-primary" />
                 <h4 className="text-lg font-black uppercase tracking-[0.2em] text-white">Active Infrastructure Keys</h4>
              </div>
              <div className="text-[11px] font-black text-text-dim uppercase tracking-widest bg-white/5 px-6 py-2 rounded-full">
                {keys.length} Registered
              </div>
           </div>

           <div className="flex flex-col gap-6">
              {loading ? (
                <div className="velo-card p-20 text-center opacity-40">
                   <Plus className="animate-spin mx-auto text-primary" size={40} />
                </div>
              ) : keys.length === 0 ? (
                <div className="velo-card p-24 text-center border-dashed opacity-40">
                   <p className="text-[11px] font-black uppercase tracking-[0.3em] text-text-dim">No active keys found</p>
                </div>
              ) : (
                keys.map(key => (
                  <div key={key.id} className="velo-card !p-8 flex items-center justify-between group hover:border-primary/30 transition-all">
                     <div className="flex items-center gap-8 pl-4">
                        <div className="p-4 bg-white/5 rounded-2xl group-hover:text-primary transition-colors">
                           <Shield size={24} />
                        </div>
                        <div className="flex flex-col">
                           <span className="text-xl font-black text-white tracking-tight">{key.name}</span>
                           <span className="text-[11px] font-bold text-text-dim uppercase tracking-widest">
                             Created: {new Date(key.created_at).toLocaleDateString()}
                           </span>
                        </div>
                     </div>

                     <button 
                       onClick={() => handleRevokeKey(key.id)}
                       className="p-5 text-text-dim hover:text-error hover:bg-error/10 rounded-2xl transition-all mr-4"
                     >
                        <Trash2 size={24} />
                     </button>
                  </div>
                ))
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
