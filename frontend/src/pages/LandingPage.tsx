import React from 'react';
import { SplitValueHero } from '../features/landing/SplitValueHero';
import { AgentBentoGrid } from '../features/landing/AgentBentoGrid';
import { MarketComparison } from '../features/landing/MarketComparison';
import { AccuracyTable } from '../features/landing/AccuracyTable';
import { PricingConversion } from '../features/landing/PricingConversion';

export const LandingPage: React.FC = () => {
  return (
    <div className="bg-[#020617] text-slate-50 selection:bg-emerald-500/30 selection:text-emerald-500">
      <SplitValueHero />
      <AgentBentoGrid />
      <MarketComparison />
      <AccuracyTable />
      <PricingConversion />
      
      {/* Footer */}
      <footer className="py-12 border-t border-white/10 text-center bg-[#020617]">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
            <span className="text-slate-500 font-mono text-[10px] uppercase tracking-widest">StockSense AI Platform © 2026</span>
            <div className="flex gap-8">
                <a href="#" className="text-slate-500 hover:text-white font-mono text-[10px] uppercase tracking-widest transition-colors">Twitter</a>
                <a href="#" className="text-slate-500 hover:text-white font-mono text-[10px] uppercase tracking-widest transition-colors">GitHub</a>
                <a href="#" className="text-slate-500 hover:text-white font-mono text-[10px] uppercase tracking-widest transition-colors">Docs</a>
            </div>
        </div>
      </footer>
    </div>
  );
};
