import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/design-system/Button';
import { Terminal } from 'lucide-react';

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
    <section className="min-h-screen flex flex-col md:flex-row border-b border-white/10">
      {/* Left: Layer 1 Pulse */}
      <div className="md:w-1/2 p-8 md:p-16 border-r border-white/10 flex flex-col justify-center bg-[#020617]">
        <div className="mb-12">
            <span className="text-emerald-500 font-mono text-[10px] tracking-[0.3em] uppercase mb-4 block">Layer 1: The Pulse</span>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-50 leading-none">REAL-TIME <br />SCANNING.</h1>
        </div>
        
        <div className="h-64 overflow-hidden relative">
            <motion.div 
              animate={{ y: [0, -400] }}
              transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
              className="space-y-4 font-mono text-xs uppercase"
            >
              {[...signals, ...signals].map((s, i) => (
                <div key={i} className="flex justify-between items-center border-b border-white/5 pb-2 text-slate-400">
                  <span className="text-slate-50 font-bold">{s.symbol}</span>
                  <span>{s.price}</span>
                  <span className={s.signal.includes('BUY') ? 'text-emerald-500' : 'text-slate-500'}>{s.signal}</span>
                </div>
              ))}
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-transparent to-[#020617] pointer-events-none" />
        </div>

        <div className="mt-12 flex items-center gap-8">
            <Button size="lg">Get Started</Button>
            <a href="#accuracy" className="text-[10px] tracking-[0.2em] uppercase font-bold text-slate-400 hover:text-white transition-colors underline underline-offset-8 decoration-white/20">View Accuracy</a>
        </div>
      </div>

      {/* Right: Layer 2 Depth */}
      <div className="md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-[#050510]">
        <div className="mb-12 md:text-right">
            <span className="text-emerald-500 font-mono text-[10px] tracking-[0.3em] uppercase mb-4 block">Layer 2: The Depth</span>
            <div className="text-4xl md:text-6xl font-bold tracking-tight text-slate-50 leading-none opacity-40">INSTITUTIONAL <br />RESEARCH.</div>
        </div>

        <div className="bg-[#020617] border border-white/10 p-6 font-mono text-[11px] leading-relaxed h-80 shadow-2xl relative">
            <div className="flex gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-slate-800" />
                <div className="w-2 h-2 rounded-full bg-slate-800" />
            </div>
            <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                {logs.map((log, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={i === analysisSteps.length - 1 ? "text-emerald-500 font-bold bg-emerald-500/5 p-1" : "text-slate-500"}
                    >
                      {log}
                    </motion.div>
                ))}
                </AnimatePresence>
                <motion.div 
                  animate={{ opacity: [0, 1] }} 
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="w-2 h-4 bg-emerald-500 inline-block"
                />
            </div>
        </div>
      </div>
    </section>
  );
};
