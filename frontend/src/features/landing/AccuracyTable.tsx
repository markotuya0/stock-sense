import React from 'react';

const history = [
  { stock: 'ZENITHB', date: '2024-03-24', entry: '₦38.20', current: '₦42.50', pnl: '+11.2%' },
  { stock: 'NVDA', date: '2024-03-12', entry: '$820.45', current: '$892.12', pnl: '+8.7%' },
  { stock: 'DANGCEM', date: '2024-04-01', entry: '₦620.00', current: '₦650.00', pnl: '+4.8%' },
  { stock: 'AAPL', date: '2024-04-05', entry: '$168.20', current: '$172.45', pnl: '+2.5%' },
  { stock: 'MTNN', date: '2024-03-20', entry: '₦242.00', current: '₦245.00', pnl: '+1.2%' },
];

export const AccuracyTable: React.FC = () => {
  return (
    <section id="accuracy" className="py-24 bg-[#020617] border-b border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-16">
          <span className="text-slate-500 font-mono text-[10px] tracking-[0.3em] uppercase mb-4 block">Transparency</span>
          <h2 className="text-4xl font-bold tracking-tight text-slate-50">HISTORICAL <br />PERFORMANCE.</h2>
        </div>

        <div className="w-full overflow-x-auto border border-white/10">
          <table className="w-full text-left border-collapse font-mono text-[11px] uppercase">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="p-4 text-slate-500 font-bold">Stock</th>
                <th className="p-4 text-slate-500 font-bold">Signal Date</th>
                <th className="p-4 text-slate-500 font-bold">Entry</th>
                <th className="p-4 text-slate-500 font-bold">Current</th>
                <th className="p-4 text-slate-500 font-bold text-right">P&L (%)</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 text-slate-50 font-bold">{h.stock}</td>
                  <td className="p-4 text-slate-500">{h.date}</td>
                  <td className="p-4 text-slate-500">{h.entry}</td>
                  <td className="p-4 text-slate-500">{h.current}</td>
                  <td className={`p-4 text-right font-bold ${h.pnl.startsWith('+') ? 'text-emerald-500' : 'text-slate-500'}`}>
                    {h.pnl}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-8 text-center">
            <span className="text-[10px] text-slate-500 font-mono italic">Note: Past performance is not indicative of future results. StockSense is an intelligence tool, not a financial advisor.</span>
        </div>
      </div>
    </section>
  );
};
