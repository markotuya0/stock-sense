import React from 'react';
import { motion } from 'framer-motion';

const signals = [
  { symbol: 'ZENITHB', change: '+2.4%', signal: 'BUY', score: 8.2 },
  { symbol: 'NVDA', change: '+3.1%', signal: 'STRONG_BUY', score: 9.4 },
  { symbol: 'DANGCEM', change: '+1.2%', signal: 'HOLD', score: 6.8 },
  { symbol: 'AAPL', change: '+0.5%', signal: 'BUY', score: 7.1 },
  { symbol: 'MTNN', change: '+1.8%', signal: 'BUY', score: 7.9 },
  { symbol: 'TSLA', change: '-1.4%', signal: 'SELL', score: 4.2 },
];

export const SocialProofTicker: React.FC = () => {
  return (
    <div className="py-10 border-y border-white/5 bg-background/50 backdrop-blur-sm overflow-hidden whitespace-nowrap">
      <motion.div 
        animate={{ x: [0, -1000] }}
        transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
        className="inline-flex gap-20"
      >
        {[...signals, ...signals].map((s, i) => (
          <div key={i} className="flex items-center gap-4 group">
            <span className="text-lg font-bold text-white group-hover:text-accent transition-colors">{s.symbol}</span>
            <span className={`text-sm ${s.change.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>{s.change}</span>
            <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.signal.includes('BUY') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/10 text-white'}`}>
              {s.signal} {s.score}
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};
