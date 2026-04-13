import React from 'react';
import { Navbar } from '../features/landing/Navbar';
import { SplitValueHero } from '../features/landing/SplitValueHero';
import { AgentBentoGrid } from '../features/landing/AgentBentoGrid';
import { DepthGauge } from '../features/landing/DepthGauge';
import { AgentVisualSection } from '../features/landing/AgentVisualSection';
import { MarketComparison } from '../features/landing/MarketComparison';
import { AccuracyTable } from '../features/landing/AccuracyTable';
import { PricingConversion } from '../features/landing/PricingConversion';

export const LandingPage: React.FC = () => {
  return (
    <div className="bg-[#020617] text-slate-50 selection:bg-emerald-500/30 selection:text-emerald-500 relative">
      <div className="mesh-grain fixed inset-0 z-0" />
      
      <Navbar />
      
      <main className="relative z-10">
        <SplitValueHero />
        <DepthGauge />
        <AgentBentoGrid />
        <AgentVisualSection />
        <MarketComparison />
        <AccuracyTable />
        <PricingConversion id="pricing" />
      </main>
      
      {/* Footer */}
      <footer className="py-24 border-t border-white/10 text-center bg-[#020617] relative z-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="flex flex-col items-start gap-4">
                <span className="text-slate-50 font-mono text-xs font-bold tracking-[0.4em]">STOCKSENSE</span>
                <span className="text-slate-500 font-mono text-[9px] uppercase tracking-[0.2em] text-left max-w-xs leading-loose">
                    Automated Investment Intelligence platform for NGX and US Equities. Established 2026.
                </span>
            </div>
            
            <div className="flex flex-col md:flex-row gap-12 text-left">
                <div className="space-y-4">
                    <span className="text-white font-mono text-[10px] uppercase tracking-widest block font-bold">Platform</span>
                    <div className="flex flex-col gap-2">
                        <a href="#" className="text-slate-500 hover:text-white font-mono text-[10px] uppercase tracking-widest transition-colors">Signals</a>
                        <a href="#" className="text-slate-500 hover:text-white font-mono text-[10px] uppercase tracking-widest transition-colors">Agents</a>
                        <a href="#" className="text-slate-500 hover:text-white font-mono text-[10px] uppercase tracking-widest transition-colors">Accuracy</a>
                    </div>
                </div>
                <div className="space-y-4">
                    <span className="text-white font-mono text-[10px] uppercase tracking-widest block font-bold">Connect</span>
                    <div className="flex flex-col gap-2">
                        <a href="#" className="text-slate-500 hover:text-white font-mono text-[10px] uppercase tracking-widest transition-colors">Twitter</a>
                        <a href="#" className="text-slate-500 hover:text-white font-mono text-[10px] uppercase tracking-widest transition-colors">GitHub</a>
                        <a href="#" className="text-slate-500 hover:text-white font-mono text-[10px] uppercase tracking-widest transition-colors">LinkedIn</a>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="mt-24 border-t border-white/5 pt-12">
             <span className="text-slate-600 font-mono text-[9px] uppercase tracking-[0.3em]">StockSense Intelligence Platform © 2026. Data Provided by IEX and NGX Group.</span>
        </div>
      </footer>
    </div>
  );
};
