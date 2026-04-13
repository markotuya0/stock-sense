import React from 'react';
import { DashboardLayout } from '../features/dashboard/DashboardLayout';
import { SignalCard } from '../features/signals/SignalCard';
import { AnalysisTerminal } from '../features/signals/AnalysisTerminal';

const mockSignals = [
  {
    symbol: 'ZENITHB',
    name: 'Zenith Bank Plc',
    market: 'NGX',
    signal_type: 'STRONG_BUY',
    score: 9.2,
    price_target: 48.5,
    risk_score: 3,
    analysis: { reason: "Strong dividend yield and robust capital adequacy ratios despite macro headwinds." }
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corp',
    market: 'US',
    signal_type: 'BUY',
    score: 8.7,
    price_target: 1100.0,
    risk_score: 5,
    analysis: { reason: "Generative AI demand remains unquenched. Data center revenue projected to beat expectations." }
  }
];

export const DashboardPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-bold mb-2">Morning Intelligence</h1>
            <p className="text-muted">Personalized signals for Monday, April 13, 2026</p>
          </div>
          <div className="flex gap-2">
             <button className="px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-sm hover:bg-white/10 transition-all font-medium">Export CSV</button>
             <button className="px-4 py-2 bg-accent text-background rounded-lg border border-accent/20 text-sm font-bold shadow-[0_0_20px_rgba(16,185,129,0.2)]">Refresh Scan</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-1 space-y-6">
              {mockSignals.map(s => <SignalCard key={s.symbol} signal={s} />)}
           </div>
           <div className="lg:col-span-2">
              <div className="mb-6 flex items-center justify-between">
                 <h2 className="text-sm font-mono uppercase tracking-[0.2em] text-muted font-bold">Deep Research Pipeline</h2>
                 <span className="flex items-center gap-2 text-[10px] text-accent font-bold animate-pulse">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent" /> LIVE ANALYSIS
                 </span>
              </div>
              <AnalysisTerminal />
              
              <div className="mt-8 glass-card p-6 border-indigo-500/20">
                 <h3 className="text-lg font-bold mb-4 flex items-center gap-2 italic">
                    <span className="text-indigo-500 text-2xl font-serif">"</span> 
                    Analyst Summary: Financial Sector Stronger in NGX.
                 </h3>
                 <p className="text-sm text-zinc-400 leading-relaxed">
                    Despite currency volatility, the banking sector in Nigeria is showing high conviction signals based on interest income projections. In the US, focus remains on high-margin tech.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
