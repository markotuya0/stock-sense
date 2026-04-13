import React from 'react';
import { motion } from 'framer-motion';

const specialists = [
  {
    name: 'Macro Agent',
    role: 'FISCAL POLICY ENGINE',
    image: '/assets/images/macro-specialist.png',
    bio: 'A dedicated engine for Layer 2 macro data, calibrated for interest rate spikes and fiscal policy shifts.',
    stats: ['Sector Sensitivity: 0.98', 'Policy Latency: < 2s']
  },
  {
    name: 'Quant Agent',
    role: 'ALPHAGEN ORCHESTRATOR',
    image: '/assets/images/quant-orchestrator.png',
    bio: 'The rank-ordering core that executes cross-market arbitrage models and high-conviction probability weighting.',
    stats: ['Alpha Leakage: 0.002%', 'Backtest Horizon: 15yr']
  }
];

export const AgentVisualSection: React.FC = () => {
  return (
    <section id="specialists" className="py-24 bg-[#020617] border-b border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-20 text-center">
          <span className="text-emerald-500 font-mono text-[10px] tracking-[0.3em] uppercase mb-4 block">Specialist Sub-Engines</span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-50 uppercase">AGENT <br />PERSONAS.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {specialists.map((s, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="relative aspect-square mb-8 overflow-hidden border border-white/10 group-hover:border-emerald-500/50 transition-colors bg-slate-900">
                <img src={s.image} alt={s.name} className="w-full h-full object-cover filter grayscale sepia-[0.5] opacity-80 group-hover:grayscale-0 group-hover:sepia-0 group-hover:opacity-100 transition-all duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-6 left-6 right-6">
                    <span className="text-emerald-500 font-mono text-[9px] tracking-widest uppercase mb-1 block">{s.role}</span>
                    <h3 className="text-2xl font-bold text-white uppercase">{s.name}</h3>
                </div>
              </div>
              
              <div className="space-y-6">
                <p className="text-xs text-slate-400 font-mono leading-relaxed uppercase tracking-tighter">
                  {s.bio}
                </p>
                <div className="flex gap-8 border-t border-white/10 pt-6">
                    {s.stats.map((stat, idx) => (
                        <div key={idx}>
                           <span className="font-mono text-[10px] text-emerald-500 uppercase">{stat}</span>
                        </div>
                    ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
