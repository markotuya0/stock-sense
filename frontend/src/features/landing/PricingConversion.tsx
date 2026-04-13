import React from 'react';
import { Button } from '../../components/design-system/Button';
import { Card } from '../../components/design-system/Card';
import { Check } from 'lucide-react';

export const PricingConversion: React.FC<{id?: string}> = ({id}) => {
  return (
    <section id={id} className="py-24 bg-[#050510]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row gap-16 items-center">
          <div className="md:w-1/2">
            <span className="text-emerald-500 font-mono text-[10px] tracking-[0.3em] uppercase mb-4 block">Pricing</span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-50 mb-8 leading-tight">THE DEPTH IS <br />AFFORDABLE.</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-10 max-w-md">
              Unlock the Layer 2 7-agent pipeline. Deep search, SEC filing scrapers, and institutional-grade valuation models for all NGX and US holdings.
            </p>
            <ul className="space-y-4 mb-4">
              <li className="flex items-center gap-3 text-xs text-slate-500 uppercase tracking-wider">
                <Check size={14} className="text-emerald-500" /> 24/7 Deep Research Agents
              </li>
              <li className="flex items-center gap-3 text-xs text-slate-500 uppercase tracking-wider">
                <Check size={14} className="text-emerald-500" /> Real-time SSE Signal Streaming
              </li>
              <li className="flex items-center gap-3 text-xs text-slate-500 uppercase tracking-wider">
                <Check size={14} className="text-emerald-500" /> Unlimited Universal Search
              </li>
            </ul>
          </div>

          <div className="md:w-1/2 w-full">
            <Card className="border-emerald-500/20 p-12 text-center bg-[#020617] items-center flex flex-col">
              <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mb-4 block">Pro Access</span>
              <div className="flex items-baseline justify-center gap-1 mb-2">
                 <span className="text-5xl font-bold text-slate-50">₦12,999</span>
                 <span className="text-slate-500 font-mono text-xs uppercase">/ Mo</span>
              </div>
              <p className="text-[10px] text-slate-500 mb-10 uppercase tracking-widest font-mono">Billed monthly. Cancel anytime.</p>
              
              <Button size="lg" className="w-full">Initialize Access</Button>
              
              <div className="mt-12 flex flex-col items-center opacity-40">
                 <span className="text-[9px] uppercase font-mono mb-4">Signal Stream Visual</span>
                 <div className="w-32 h-1 bg-white/5 overflow-hidden">
                    <div className="w-1/2 h-full bg-emerald-500 animate-[bounce_2s_infinite]" />
                 </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};
