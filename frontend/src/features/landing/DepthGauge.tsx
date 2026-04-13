import React from 'react';
import { motion } from 'framer-motion';

const layers = [
  'Raw Market Stream',
  'Sector Index Scraper',
  'Macro Policy Filter',
  'Technical Critic',
  'Alpha Orchestration',
  'Risk Validation',
  'Final Signal Synthesis'
];

export const DepthGauge: React.FC = () => {
  return (
    <div className="py-24 bg-[#050510] border-b border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row gap-16 items-center">
          <div className="md:w-1/3">
            <span className="text-emerald-500 font-mono text-[10px] tracking-[0.3em] uppercase mb-4 block">Engine Depth</span>
            <h2 className="text-3xl font-bold text-white mb-6 tracking-tight uppercase">THE 7-LAYER <br />MANDATE.</h2>
            <p className="text-xs text-slate-500 font-mono leading-relaxed uppercase tracking-widest">
              Standard platforms stop at Layer 1. StockSense agents burrow through seven distinct validation layers before a signal reaches your terminal.
            </p>
          </div>

          <div className="md:w-2/3 w-full space-y-4">
            {layers.map((layer, i) => (
              <motion.div 
                key={i}
                initial={{ width: '0%' }}
                whileInView={{ width: '100%' }}
                transition={{ delay: i * 0.1, duration: 0.8 }}
                viewport={{ once: true }}
                className="group cursor-default"
              >
                <div className="flex justify-between items-center mb-1 text-[9px] font-mono uppercase tracking-widest text-slate-500 group-hover:text-emerald-500 transition-colors">
                  <span>Layer 0{i+1} — {layer}</span>
                  <span className="text-emerald-950 group-hover:text-emerald-500 transition-colors">DEEP_ACTIVE</span>
                </div>
                <div className="h-px bg-white/10 group-hover:bg-emerald-500/50 transition-colors w-full" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
