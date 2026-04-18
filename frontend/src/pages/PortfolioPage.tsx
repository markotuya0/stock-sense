import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';

import apiClient from '../api/client';

export const PortfolioPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState<any>(null);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const response = await apiClient.get('/portfolio/');
        setPortfolio(response.data);
      } catch (error) {
        console.error("Failed to fetch portfolio", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
  }, []);

  if (loading) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;

  if (!portfolio) {
    return (
      <div className="p-8 text-center text-zinc-400">
        <p>Unable to load portfolio data. Please try again later.</p>
      </div>
    );
  }

  const nextRebalanceTime = new Date();
  nextRebalanceTime.setDate(nextRebalanceTime.getDate() + (1 - nextRebalanceTime.getDay() + 7) % 7 || 7);
  nextRebalanceTime.setHours(9, 30, 0, 0);
  const rebalanceDisplay = nextRebalanceTime.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase() + ' · 09:30 AM';

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 animate-in zoom-in-95 duration-500">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-zinc-500 font-mono text-sm mb-2 uppercase tracking-widest">
              <Wallet size={16} />
              <span>Institutional Asset Manager</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter italic">PORTFOLIO</h1>
          </div>
          <div className="text-right">
             <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Total Equity (USD)</div>
             <div className="text-5xl font-black tracking-tighter">${(portfolio.total_value || 0).toLocaleString()}</div>
             <div className={`font-bold flex items-center justify-end gap-1 text-sm mt-1 ${(portfolio.pnl_percent || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
               <TrendingUp size={14} /> {(portfolio.pnl_percent || 0) >= 0 ? '+' : ''}{portfolio.pnl_percent || 0}% Total Gain
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main List */}
          <div className="lg:col-span-3">
            <div className="bg-zinc-950 border border-zinc-900 rounded-3xl overflow-hidden">
               <div className="p-6 border-b border-zinc-900 bg-zinc-900/20">
                 <h3 className="font-bold flex items-center gap-2">
                   Active Holdings <span className="bg-zinc-800 text-[10px] px-2 py-0.5 rounded-full text-zinc-400">{portfolio.holdings?.length || 0}</span>
                 </h3>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest border-b border-zinc-900">
                       <th className="px-6 py-4">Asset</th>
                       <th className="px-6 py-4">Shares</th>
                       <th className="px-6 py-4">Avg Price</th>
                       <th className="px-6 py-4">Current</th>
                       <th className="px-6 py-4 text-right">Profit / Loss</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-zinc-900">
                     {(portfolio.holdings || []).map((stock: any, i: number) => (
                       <tr key={i} className="group hover:bg-zinc-900/30 transition-colors">
                         <td className="px-6 py-6">
                            <div className="font-black italic text-lg tracking-tighter">{stock.symbol}</div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-tighter font-bold">{stock.market}</div>
                         </td>
                         <td className="px-6 py-6 font-mono text-sm">{stock.shares}</td>
                         <td className="px-6 py-6 font-mono text-sm">${stock.avg_price}</td>
                         <td className="px-6 py-6 font-mono text-sm">${stock.current_price}</td>
                         <td className="px-6 py-6 text-right">
                            <div className={stock.pnl >= 0 ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
                              {stock.pnl >= 0 ? '+' : ''}${stock.pnl.toLocaleString()}
                            </div>
                            <div className={stock.pnl_pct >= 0 ? 'text-[10px] text-green-600' : 'text-[10px] text-red-600'}>
                              {stock.pnl_pct >= 0 ? '+' : ''}{stock.pnl_pct}%
                            </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>

          {/* Side Panels */}
          <div className="space-y-6">
             <div className="bg-white text-black p-6 rounded-3xl">
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Next Rebalance</span>
                </div>
                <div className="text-xl font-black italic tracking-tighter mb-4">{rebalanceDisplay}</div>
                <button className="w-full py-3 bg-black text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors">
                  Run Optimization <ArrowRight size={14} />
                </button>
             </div>
             <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-3xl text-zinc-400 text-xs">
                <p>Risk analysis coming soon. Historical sector rotation data will appear here.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
