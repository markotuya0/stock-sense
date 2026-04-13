import React from 'react';

export const MarketComparison: React.FC = () => {
  return (
    <section className="py-24 bg-[#050510] border-b border-white/10 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10 border border-white/10">
          {/* US Market */}
          <div className="bg-[#050510] p-12">
            <span className="text-slate-500 font-mono text-[10px] tracking-[0.3em] uppercase mb-4 block">Region A</span>
            <h3 className="text-3xl font-bold text-white mb-6 tracking-tight">US EQUITIES.</h3>
            <ul className="space-y-4 text-xs text-slate-400 font-mono uppercase">
              <li className="flex gap-4">
                <span className="text-emerald-500">01</span>
                <span>High-Margin Big Tech Bias</span>
              </li>
              <li className="flex gap-4">
                <span className="text-emerald-500">02</span>
                <span>FED Policy Sensitivity Analysis</span>
              </li>
              <li className="flex gap-4">
                <span className="text-emerald-500">03</span>
                <span>SEC filing scrapers (10-K, 13-F)</span>
              </li>
            </ul>
          </div>

          {/* NGX Market */}
          <div className="bg-[#050510] p-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                <span className="text-8xl font-black text-emerald-500">NGX</span>
            </div>
            <span className="text-emerald-500 font-mono text-[10px] tracking-[0.3em] uppercase mb-4 block">Region B</span>
            <h3 className="text-3xl font-bold text-white mb-6 tracking-tight">NGX NIGERIA.</h3>
            <ul className="space-y-4 text-xs text-slate-400 font-mono uppercase">
              <li className="flex gap-4">
                <span className="text-emerald-500">01</span>
                <span>Naira/Kobo Unit Fix Protocol</span>
              </li>
              <li className="flex gap-4">
                <span className="text-emerald-500">02</span>
                <span>Inflation-Hedge Dividend Yields</span>
              </li>
              <li className="flex gap-4">
                <span className="text-emerald-500">03</span>
                <span>Stale Price Detection (Max 14d)</span>
              </li>
            </ul>
            
            <div className="mt-12 p-4 border border-emerald-500/20 bg-emerald-500/5 text-[10px] text-emerald-500 font-mono leading-relaxed">
               SPECIALIST LOGIC: StockSense automatically detects 0-volume days and fixes NGX data "jumps" to ensure clean technical RSI charts.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
