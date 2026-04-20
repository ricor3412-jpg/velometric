'use client';

import { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Copy, Check, Terminal, ShieldCheck, Zap, Send, Code, Database, Globe, RefreshCw, ArrowLeft } from 'lucide-react';
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

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    const res = await fetch('/api/keys');
    const data = await res.json();
    if (data.success) setKeys(data.keys);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newKeyName) return;
    setLoading(true);
    const res = await fetch('/api/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newKeyName })
    });
    const data = await res.json();
    if (data.success) {
      setGeneratedKey(data.key);
      setTestKey(data.key); 
      setNewKeyName('');
      fetchKeys();
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de revocar esta llave API?')) return;
    const res = await fetch('/api/keys', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    const data = await res.json();
    if (data.success) fetchKeys();
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
      const data = await res.json();
      setTestResponse(data);
    } catch (err) {
      setTestResponse({ error: 'Fallo al conectar con la API', details: err.message });
    }
    setTesting(false);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="animate-fade-in pb-20">
      <header className="flex justify-between items-center mb-12 flex-mobile-col gap-6">
        <div>
          <Link href="/" className="flex items-center gap-2 mb-4" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
            <ArrowLeft size={16} /> Volver al Tablero
          </Link>
          <h1 style={{ marginBottom: '0.25rem' }}>Integraciones <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>API</span></h1>
          <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Gestiona credenciales y prueba tus microservicios</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
          <Zap size={24} style={{ color: 'var(--primary-light)' }} />
        </div>
      </header>

      <div className="flex gap-8 flex-mobile-col" style={{ alignItems: 'flex-start' }}>
        
        <div className="flex flex-col gap-8" style={{ flex: 1 }}>
          {/* Key Management */}
          <section className="velo-card">
            <div className="flex items-center gap-4 mb-8">
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.6rem', borderRadius: '10px', color: 'var(--primary-light)' }}>
                <Key size={20} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Gestión de Credenciales</h3>
            </div>
            
            <form onSubmit={handleCreate} className="velo-input-group mb-8" style={{ padding: '0.5rem', alignItems: 'center' }}>
              <Database size={18} style={{ marginLeft: '1rem', color: 'var(--text-dim)' }} />
              <input 
                type="text" 
                placeholder="Nombre (ej. Bot Performance v1)" 
                className="velo-input"
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                required
              />
              <button type="submit" className="velo-btn-primary" disabled={loading}>
                {loading ? <RefreshCw className="animate-spin" size={18} /> : <Plus size={18} />}
                <span>Generar</span>
              </button>
            </form>

            {generatedKey && (
              <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem' }} className="animate-fade-in">
                <div className="flex items-center gap-2 mb-2" style={{ color: '#10b981', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase' }}>
                  <ShieldCheck size={14} /> Llave generada con éxito
                </div>
                <div className="flex items-center gap-4 bg-black p-4 rounded-xl border border-white/5">
                  <code style={{ flex: 1, fontFamily: 'monospace', color: 'white', fontSize: '1rem' }}>{generatedKey}</code>
                  <button onClick={() => copyToClipboard(generatedKey, 'new')} className="velo-btn-primary" style={{ background: copiedId === 'new' ? '#10b981' : 'var(--primary)', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                    {copiedId === 'new' ? <Check size={16} /> : <Copy size={16} />}
                    <span>{copiedId === 'new' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
               {keys.length === 0 ? (
                 <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed var(--glass-border)', borderRadius: '16px', color: 'var(--text-dim)' }}>
                   <Code size={32} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                   <p>No hay llaves activas.</p>
                 </div>
               ) : (
                 keys.map(k => (
                   <div key={k.id} className="flex justify-between items-center p-4 rounded-xl border border-white/5 hover:bg-white/5 transition-colors">
                     <div className="flex items-center gap-4">
                       <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981' }} />
                       <div className="flex flex-col">
                         <span style={{ fontWeight: 600 }}>{k.name}</span>
                         <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Creada el {new Date(k.created_at).toLocaleDateString()}</span>
                       </div>
                     </div>
                     <button onClick={() => handleDelete(k.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }}>
                       <Trash2 size={16} />
                     </button>
                   </div>
                 ))
               )}
            </div>
          </section>

          {/* Playground */}
          <section className="velo-card">
             <div className="flex justify-between items-center mb-8">
               <div className="flex items-center gap-4">
                 <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '0.6rem', borderRadius: '10px', color: 'var(--secondary-light)' }}>
                   <Terminal size={20} />
                 </div>
                 <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Laboratorio de Pruebas</h3>
               </div>
               <span className="velo-badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>Experimental Look</span>
             </div>
             
             <div className="flex gap-8 flex-mobile-col">
               <div className="flex flex-col gap-6" style={{ flex: 1 }}>
                 <div className="flex flex-col gap-2">
                   <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase' }}>API KEY</label>
                   <div style={{ borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center' }}>
                     <Key size={14} style={{ color: 'var(--primary-light)', marginRight: '0.75rem' }} />
                     <input type="text" placeholder="ps_..." style={{ background: 'transparent', border: 'none', color: 'white', padding: '0.5rem 0', width: '100%', outline: 'none' }} value={testKey} onChange={e => setTestKey(e.target.value)} />
                   </div>
                 </div>

                 <div className="flex flex-col gap-2">
                   <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase' }}>URL DESTINO</label>
                   <div style={{ borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center' }}>
                     <Globe size={14} style={{ color: 'var(--primary-light)', marginRight: '0.75rem' }} />
                     <input type="url" style={{ background: 'transparent', border: 'none', color: 'white', padding: '0.5rem 0', width: '100%', outline: 'none' }} value={testUrl} onChange={e => setTestUrl(e.target.value)} />
                   </div>
                 </div>

                 <button onClick={handleTestAPI} className="velo-btn-primary" disabled={testing || !testKey} style={{ background: 'var(--accent-gradient)', color: 'white', width: '100%', justifyContent: 'center' }}>
                   {testing ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                   <span>{testing ? 'Procesando...' : 'Probar Petición'}</span>
                 </button>
               </div>

               <div style={{ flex: 1.2, background: '#08080a', borderRadius: '16px', border: '1px solid var(--glass-border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                 <div style={{ background: '#111114', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)' }}>
                   <div className="flex gap-1.5">
                     <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f56' }} />
                     <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffbd2e' }} />
                     <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27c93f' }} />
                   </div>
                   <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase' }}>Response Console</span>
                 </div>
                 <div style={{ padding: '1.5rem', minHeight: '260px', overflowY: 'auto' }}>
                    {testResponse ? (
                      <div>
                        <div style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800, background: testResponse.error ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: testResponse.error ? '#ef4444' : '#10b981', marginBottom: '1rem', border: '1px solid currentColor' }}>
                          {testResponse.error ? 'ERROR' : 'SUCCESS'}
                        </div>
                        <pre style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: testResponse.error ? '#ff7b72' : '#7ee787', whiteSpace: 'pre-wrap' }}>
                          {JSON.stringify(testResponse, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-4" style={{ height: '100%', minHeight: '200px', opacity: 0.2 }}>
                        <Database size={40} />
                        <span style={{ fontSize: '0.8rem' }}>Esperando ejecución...</span>
                      </div>
                    )}
                 </div>
               </div>
             </div>
          </section>
        </div>

        {/* Sidebar Docs */}
        <aside style={{ width: '340px' }} className="flex-mobile-col w-full">
          <div className="velo-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '2rem', color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Documentación</h3>
            
            <div className="flex flex-col gap-8">
              <div className="flex gap-4">
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'rgba(255,255,255,0.05)', lineHeight: 1 }}>01</div>
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.25rem' }}>Headers</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Utiliza la llave en cada petición.</p>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '8px', fontSize: '0.7rem' }}>
                    <span style={{ color: 'var(--primary-light)' }}>X-API-KEY:</span> <code>ps_...</code>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'rgba(255,255,255,0.05)', lineHeight: 1 }}>02</div>
                <div>
                  <h4 style={{ font: '0.9rem', fontWeight: 700, marginBottom: '0.25rem' }}>Endpoint</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Dispara auditorías vía POST.</p>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '8px', fontSize: '0.7rem' }}>
                    <code>/api/v1/scan</code>
                  </div>
                </div>
              </div>

              <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '12px', fontSize: '0.75rem', color: 'var(--primary-light)', display: 'flex', gap: '8px' }}>
                 <Zap size={16} />
                 <span><strong>Tip:</strong> Usa <code>network: "5g"</code> para máxima precisión.</span>
              </div>
            </div>
          </div>

          <div className="velo-card mt-4" style={{ background: 'var(--accent-gradient)', padding: '2px' }}>
            <div style={{ background: 'var(--background)', borderRadius: '18px', padding: '1.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.5rem' }}>VeloMetric Suite</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Optimizada para integración con LLMs modernos.</p>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
