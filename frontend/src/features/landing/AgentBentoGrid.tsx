import React from 'react';
import { Search, Brain, ShieldCheck, BarChart3, Fingerprint, Database, Zap } from 'lucide-react';

const agents = [
  { 
    name: 'Researcher', 
    icon: <Search size={20} />, 
    desc: 'Analyzes SEC filings, news, and earnings calls in real-time.',
    snippet: '{ "source": "EDGAR", "filing": "10-Q", "sentiment": 0.82 }'
  },
  { 
    name: 'Macro Analyst', 
    icon: <Database size={20} />, 
    desc: 'Monitors Fed policy, inflation, and currency volatility.',
    snippet: '{ "cpi": 3.2, "dxy": 104.5, "impact": "Hawkish" }'
  },
  { 
    name: 'Technical Critic', 
    icon: <Zap size={20} />, 
    desc: 'Validates RSI, volume profiles, and liquidity gaps.',
    snippet: '{ "rsi": 64, "vwap": 172.4, "divergence": false }'
  },
  { 
    name: 'Financial Modeling', 
    icon: <BarChart3 size={20} />, 
    desc: 'Builds automated DCF and comparative valuation models.',
    snippet: '{ "wacc": 8.5, "fcf_yield": 4.2%, "upside": 12.5% }'
  },
  { 
    name: 'Risk Manager', 
    icon: <ShieldCheck size={20} />, 
    desc: 'Calculates VaR and flags low-float or high-short interest.',
    snippet: '{ "beta": 1.2, "var": 0.15, "volatility": "High" }'
  },
  { 
    name: 'Quant Orchestrator', 
    icon: <Brain size={20} />, 
    desc: 'Ranks signals using multi-factor probability weighting.',
    snippet: '{ "alpha": 0.04, "sharpe": 1.8, "rank": 1 }'
  },
  { 
    name: 'The Final Signal', 
    icon: <Fingerprint size={20} />, 
    desc: 'Synthesizes all agent outputs into a single conviction score.',
    snippet: '{ "signal": "STRONG_BUY", "probability": 0.92 }'
  }
];

export const AgentBentoGrid: React.FC = () => {
  return (
    <section className="py-24 bg-[#020617] border-b border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-16">
          <span className="text-emerald-500 font-mono text-[10px] tracking-[0.3em] uppercase mb-4 block">The Pipeline</span>
          <h2 className="text-4xl font-bold tracking-tight text-slate-50">7-AGENT <br />INTELLIGENCE.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-px bg-white/10 border border-white/10 overflow-hidden">
          {agents.map((a, i) => (
            <div key={i} className="bg-[#020617] p-8 group transition-all hover:bg-white/[0.02]">
              <div className="text-emerald-500 mb-6 group-hover:scale-110 transition-transform duration-300">{a.icon}</div>
              <h3 className="text-sm font-bold text-slate-50 mb-4 uppercase tracking-wider">{a.name}</h3>
              <p className="text-xs text-slate-400 mb-8 leading-relaxed h-12">{a.desc}</p>
              <div className="bg-[#050510] p-3 border border-white/5 font-mono text-[9px] text-slate-500 overflow-hidden">
                <code className="block">{a.snippet}</code>
              </div>
            </div>
          ))}
          <div className="bg-[#020617] p-8 flex flex-col justify-center items-center text-center opacity-40">
             <span className="text-[10px] uppercase tracking-widest font-mono">End of Pipeline</span>
          </div>
        </div>
      </div>
    </section>
  );
};
