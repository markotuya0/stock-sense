import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../features/dashboard/DashboardLayout';
import { SignalCard } from '../features/signals/SignalCard';
import { AnalysisTerminal } from '../features/signals/AnalysisTerminal';
import { SignalSkeleton } from '../components/ui/Skeleton';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const DashboardPage: React.FC = () => {
  const [signals, setSignals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.token;
        const response = await axios.get(`${API_URL}/signals`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSignals(response.data);
      } catch (err) {
        console.error("Failed to fetch signals", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSignals();
  }, []);
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
              {isLoading ? (
                <div className="space-y-6">
                  {[1, 2, 3].map(i => <SignalSkeleton key={i} />)}
                </div>
              ) : signals.length > 0 ? (
                signals.map(s => <SignalCard key={s.id || s.symbol} signal={s} />)
              ) : (
                <div className="p-12 text-center border-2 border-dashed border-white/5 rounded-xl">
                  <p className="text-muted text-xs uppercase tracking-widest">No active signals today</p>
                </div>
              )}
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
