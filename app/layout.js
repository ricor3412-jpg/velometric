import './globals.css';
import { Activity, ShieldCheck, Cpu, Globe } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'VeloMetric | Performance Intelligence',
  description: 'AI-native performance benchmarking and infrastructure telemetry.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <div className="mesh-bg" />
        <div className="flex flex-col min-h-screen relative z-10">
          {/* Precision Navbar */}
          <nav className="sticky top-0 z-50 border-b border-white/[0.05] bg-black/40 backdrop-blur-xl">
            <div className="container-full py-8 flex justify-between items-center">
              <Link href="/" className="flex items-center gap-4 no-underline group">
                <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-all border border-primary/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                  <Activity className="text-primary" size={22} />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black tracking-tighter text-white uppercase leading-none">VeloMetric</span>
                  <span className="text-[10px] font-bold text-primary tracking-[0.3em] uppercase mt-1.5 opacity-80">Precision Intelligence</span>
                </div>
              </Link>
              
              <div className="flex items-center gap-12">
                <div className="hidden lg:flex gap-10 items-center">
                  <Link href="/" className="text-[11px] font-bold text-text-dim hover:text-white transition-all no-underline uppercase tracking-[0.15em]">System Dashboard</Link>
                  <Link href="/integrations" className="text-[11px] font-bold text-text-dim hover:text-white transition-all no-underline uppercase tracking-[0.15em]">API Ecosystem</Link>
                  <Link href="/docs" className="text-[11px] font-bold text-text-dim hover:text-white transition-all no-underline uppercase tracking-[0.15em]">Protocol Docs</Link>
                </div>
                <div className="h-6 w-[1px] bg-white/10 hidden lg:block" />
                <div className="flex items-center gap-6">
                  <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-success/5 border border-success/10 rounded-full">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
                    <span className="text-[9px] font-black text-success uppercase tracking-widest">Mainframe Nominal</span>
                  </div>
                  <button className="p-2.5 text-text-dim hover:text-white transition-all bg-white/[0.03] rounded-lg border border-white/[0.05] hover:border-white/10">
                     <Globe size={18} />
                  </button>
                </div>
              </div>
            </div>
          </nav>
          
          <main className="flex-grow">
            {children}
          </main>

          <footer className="mt-32 border-t border-white/[0.05] py-20 bg-black/80 backdrop-blur-2xl">
            <div className="container-full">
              <div className="flex flex-col lg:flex-row justify-between items-center gap-12">
                <div className="flex flex-col items-center lg:items-start gap-4">
                  <div className="text-[11px] font-bold text-white uppercase tracking-[0.3em] mb-2 opacity-50">
                    VeloMetric v5.0.4
                  </div>
                  <div className="text-[10px] font-bold text-text-dim uppercase tracking-[0.15em] text-center lg:text-left leading-loose max-w-md">
                    © 2024 HyperScale Systems Engineering. <br />
                    Industrial grade performance telemetry for mission-critical infrastructure.
                  </div>
                </div>
                <div className="flex flex-wrap justify-center gap-10">
                   <div className="flex items-center gap-3 text-text-dim text-[10px] font-bold uppercase tracking-[0.15em] bg-white/[0.02] px-4 py-2 rounded-lg border border-white/[0.05]">
                     <ShieldCheck size={14} className="text-primary" /> 
                     <span>Quantum Encrypted</span>
                   </div>
                   <div className="flex items-center gap-3 text-text-dim text-[10px] font-bold uppercase tracking-[0.15em] bg-white/[0.02] px-4 py-2 rounded-lg border border-white/[0.05]">
                     <Cpu size={14} className="text-secondary" /> 
                     <span>L2 Edge Runtime</span>
                   </div>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
