import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/design-system/Button';

const signals = [
  { symbol: 'ZENITHB', price: '₦42.50', signal: 'STRONG_BUY' },
  { symbol: 'NVDA', price: '$892.12', signal: 'BUY' },
  { symbol: 'MTNN', price: '₦245.00', signal: 'HOLD' },
  { symbol: 'AAPL', price: '$172.45', signal: 'STRONG_BUY' },
  { symbol: 'DANGCEM', price: '₦650.00', signal: 'BUY' },
  { symbol: 'TSLA', price: '$165.30', signal: 'SELL' },
  { symbol: 'GTCO', price: '₦45.20', signal: 'STRONG_BUY' },
];

export const SplitValueHero: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const analysisSteps = [
    "> INITIATING LAYER 2 PIPELINE...",
    "> CALLING MACRO AGENT... OK",
    "> ANALYZING FED INTEREST RATE POLICY... OK",
    "> SCRAPING NGX SECTOR REVENUE... OK",
    "> RUNNING RSI CROSSOVER (14-DAY)... OK",
    "> CROSS-VALIDATING ANALYST SENTIMENT... OK",
    "> GENERATING HIGH-CONVICTION SIGNAL...",
    "> [SIGNAL]: STRONG_BUY (9.2/10)"
  ];

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < analysisSteps.length) {
        setLogs(prev => [...prev, analysisSteps[i]]);
        i++;
      }
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="min-h-screen flex flex-col md:flex-row border-b border-white/10 relative overflow-hidden">
      {/* Left: Layer 1 Pulse */}
      <div className="w-full md:w-1/2 p-6 md:p-16 border-b md:border-b-0 md:border-r border-white/10 flex flex-col justify-center bg-[#020617] pt-32 md:pt-16">
        <div className="mb-8 md:mb-12">
            <span className="text-emerald-500 font-mono text-[9px] md:text-[10px] tracking-[0.3em] uppercase mb-4 block">Layer 1: The Pulse</span>
            <h1 className="text-4xl md:text-7xl font-bold tracking-tight text-slate-50 leading-none">REAL-TIME <br />SCANNING.</h1>
        </div>
        
        <div className="h-48 md:h-64 overflow-hidden relative border border-white/5 bg-[#050510]/50 p-4">
            <motion.div 
              animate={{ y: [0, -400] }}
              transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
              className="space-y-4 font-mono text-[10px] uppercase"
            >
              {[...signals, ...signals].map((s, i) => (
                <div key={i} className="flex justify-between items-center border-b border-white/5 pb-2 text-slate-500">
                  <span className="text-slate-100 font-bold">{s.symbol}</span>
                  <span className="hidden sm:inline">{s.price}</span>
                  <span className={s.signal.includes('BUY') ? 'text-emerald-500' : 'text-slate-600'}>{s.signal}</span>
                </div>
              ))}
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-transparent to-[#020617] pointer-events-none" />
        </div>

        <div className="mt-8 md:mt-12 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            <Button size="lg" className="w-full sm:w-auto">Initialize Access</Button>
            <a href="#accuracy" className="text-[10px] tracking-[0.2em] uppercase font-bold text-slate-400 hover:text-white transition-colors underline underline-offset-8 decoration-white/20">View Accuracy Report</a>
        </div>
      </div>

      {/* Right: Layer 2 Depth */}
      <div className="w-full md:w-1/2 p-6 md:p-16 flex flex-col justify-center bg-[#050510] relative">
        <div className="mb-8 md:mb-12 md:text-right">
            <span className="text-emerald-400 font-mono text-[9px] md:text-[10px] tracking-[0.3em] uppercase mb-4 block">Layer 2: The Depth</span>
            <div className="text-3xl md:text-6xl font-bold tracking-tight text-slate-50 leading-none opacity-20 hidden md:block uppercase">INSTITUTIONAL <br />RESEARCH.</div>
            <div className="text-2xl font-bold tracking-tight text-slate-500 leading-none md:hidden uppercase">DEEP ANALYSIS ENGINE.</div>
        </div>

        <div className="bg-[#020617] border border-white/10 p-4 md:p-6 font-mono text-[10px] md:text-[11px] leading-relaxed h-72 md:h-80 shadow-2xl relative">
            <div className="flex gap-2 mb-4 md:mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
            </div>
            <div className="space-y-1.5 md:space-y-2 max-h-full overflow-hidden">
                <AnimatePresence mode="popLayout">
                {logs.map((log, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={i === logs.length - 1 ? "text-emerald-500 font-bold bg-emerald-500/5 p-1" : "text-slate-600"}
                    >
                      {log}
                    </motion.div>
                ))}
                </AnimatePresence>
                <motion.div 
                  animate={{ opacity: [0, 1] }} 
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="w-1.5 h-3.5 bg-emerald-500 inline-block align-middle"
                />
            </div>
        </div>
      </div>
    </section>
  );
};
