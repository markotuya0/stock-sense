import React from 'react';
import { Card } from '../../components/design-system/Card';
import { motion } from 'framer-motion';

const specialists = [
  {
    name: 'Macro Specialist',
    role: 'FED & NGX FISCAL POLICY',
    image: '/home/markotuya/.gemini/antigravity/brain/7dee43fb-9ec8-4adb-bd28-e8d6c311840b/macro_specialist_portrait_1776113549013.png',
    bio: 'Oversees the Layer 2 macro-agent pipelines, calibrating sensitivity to interest rate hikes and currency devaluation.',
    stats: ['Sector Sensitivity: 0.98', 'Policy Latency: < 2s']
  },
  {
    name: 'Quant Orchestrator',
    role: 'ALPHAGEN ARCHITECTURE',
    image: '/home/markotuya/.gemini/antigravity/brain/7dee43fb-9ec8-4adb-bd28-e8d6c311840b/quant_orchestrator_portrait_1776113702226.png',
    bio: 'Designs the cross-market arbitrage models and rank-ordering algorithms that power our high-conviction signals.',
    stats: ['Alpha Leakage: 0.002%', 'Backtest Horizon: 15yr']
  }
];

export const AgentVisualSection: React.FC = () => {
  return (
    <section id="specialists" className="py-24 bg-[#020617] border-b border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-20 text-center">
          <span className="text-emerald-500 font-mono text-[10px] tracking-[0.3em] uppercase mb-4 block">The Humans Behind the AI</span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-50">THE SPECIALIST <br />COUNCIL.</h2>
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
                <img src={s.image} alt={s.name} className="w-full h-full object-cover filter grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
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
