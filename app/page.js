'use client';

import { useState, useEffect } from 'react';
import { Activity, Search, RefreshCw, ChevronRight, Zap, Globe, LayoutGrid } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [url, setUrl] = useState('');
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [networkProfile, setNetworkProfile] = useState('5g');

  const NETWORKS = [
    { id: 'none', label: 'Sin Límites', info: 'Red local' },
    { id: '5g', label: 'Ultra 5G', info: '20ms / 50Mbps' },
    { id: '4g', label: '4G LTE', info: '40ms / 10Mbps' },
    { id: '3g-fast', label: '3G Rápido', info: '150ms / 1.6Mbps' },
    { id: '3g-slow', label: '3G Lento', info: '400ms / 400kbps' },
  ];

  useEffect(() => {
    fetchScans();
  }, []);

  const fetchScans = async () => {
    try {
      const res = await fetch('/api/scans');
      const data = await res.json();
      if (data.success) {
        setScans(data.scans);
      }
    } catch (e) {
      console.error(e);
    }
  };

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
        alert(data.error || 'Fallo al iniciar escaneo');
      }
    } catch (e) {
      alert('Error iniciando escaneo');
    }
    setLoading(false);
  };

  return (
    <div className="animate-fade-in">
      <header className="flex justify-between items-center mb-16 flex-mobile-col gap-6">
        <div>
          <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>Velo<span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Metric</span></h1>
          <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>Infraestructura de auditoría de precisión</p>
        </div>
        <Link href="/integrations" className="velo-btn-primary" style={{ background: 'rgba(255,255,255,0.03)', color: 'white', border: '1px solid var(--glass-border)', padding: '0.8rem 1.5rem' }}>
          <LayoutGrid size={20} />
          <span>Ecosistema API</span>
        </Link>
      </header>


      <section className="velo-card mb-20">
        <div className="flex items-center gap-6 mb-12">
          <div style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)', padding: '1rem', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '16px', color: 'var(--primary-light)' }}>
            <Search size={32} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Nueva Auditoría</h2>
            <p style={{ color: 'var(--text-muted)' }}>Analiza cualquier URL con perfiles de red simulados de alta fidelidad</p>
          </div>
        </div>

        <form onSubmit={startScan}>
          <div className="velo-input-group mb-10" style={{ padding: '0.75rem', alignItems: 'center', background: 'rgba(0,0,0,0.3)' }}>
            <Globe size={24} style={{ marginLeft: '1.5rem', color: 'rgba(255,255,255,0.2)' }} />
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://tu-sitio-web.com"
              className="velo-input"
              style={{ fontSize: '1.2rem', padding: '1rem 1.5rem' }}
              required
              disabled={loading}
            />
            <button type="submit" className="velo-btn-primary" style={{ padding: '1rem 2rem', fontSize: '1rem' }} disabled={loading}>
              {loading ? <RefreshCw className="animate-spin" size={24} /> : <Zap size={24} />}
              <span>{loading ? 'Inicializando...' : 'Lanzar Escaneo'}</span>
            </button>
          </div>


          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', display: 'block' }}> Perfil de Simulación </label>
            <div className="grid grid-cols-4 gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
              {NETWORKS.map(net => (
                <button
                  key={net.id}
                  type="button"
                  onClick={() => setNetworkProfile(net.id)}
                  className={`chip ${networkProfile === net.id ? 'active' : ''}`}
                  style={{ width: '100%' }}
                >
                  <strong>{net.label}</strong>
                  <span>{net.info}</span>
                </button>
              ))}
            </div>
          </div>
        </form>
      </section>

      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Inteligencia Reciente</h2>
          <p style={{ color: 'var(--text-muted)' }}>Historial de auditorías críticas procesadas</p>
        </div>
        <button onClick={fetchScans} className="velo-btn-primary" style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'white', padding: '0.6rem 1.2rem' }}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Refrescar Feed</span>
        </button>
      </div>


      <div className="flex flex-col gap-6">
        {scans.length === 0 ? (
          <div className="velo-card" style={{ textAlign: 'center', padding: '8rem 2rem' }}>
            <Activity size={64} style={{ opacity: 0.05, marginBottom: '2rem', margin: '0 auto' }} />
            <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem' }}>No hay registros disponibles en la red local.</p>
          </div>
        ) : (
          scans.map((scan, i) => (
            <Link href={`/report/${scan.name}`} key={i} className="velo-card flex justify-between items-center hover:scale-[1.01]" style={{ textDecoration: 'none', color: 'inherit', padding: '2rem 3rem' }}>
              <div className="flex items-center gap-8" style={{ minWidth: 0 }}>
                <div style={{ position: 'relative', background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <Globe size={32} style={{ color: 'rgba(255,255,255,0.3)' }} />
                  <div style={{ 
                    position: 'absolute', top: '-6px', right: '-6px', width: '16px', height: '16px', borderRadius: '50%', 
                    background: scan.status === 'completed' ? 'var(--score-good)' : scan.status === 'running' ? 'var(--primary)' : 'var(--score-poor)',
                    boxShadow: `0 0 20px ${scan.status === 'completed' ? 'var(--score-good)' : 'var(--primary)'}`,
                    border: '3px solid #050507'
                  }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.02em' }}>{scan.name}</h3>
                  <div className="flex items-center gap-4">
                    <span className={`velo-badge ${scan.status === 'completed' ? 'velo-badge-success' : 'velo-badge-running'}`} style={{ fontSize: '0.7rem', padding: '4px 10px' }}>{scan.status}</span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                      {new Date(scan.started_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} <span style={{ opacity: 0.3, margin: '0 4px' }}>•</span> {new Date(scan.started_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: '0.1em' }} className="hide-mobile">Ficha Técnica</span>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '14px', border: '1px solid var(--glass-border)', color: 'rgba(255,255,255,0.4)' }}>
                  <ChevronRight size={24} />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>


      <style jsx>{`
        @media (max-width: 768px) {
          .hide-mobile { display: none; }
        }
      `}</style>
    </div>
  );
}
