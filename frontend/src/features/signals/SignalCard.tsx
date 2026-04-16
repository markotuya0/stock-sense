import React from 'react';
import { Card } from '../../components/design-system/Card';
import { Clock, ShieldAlert } from 'lucide-react';

export const SignalCard: React.FC<{ signal: any }> = ({ signal }) => {
  return (
    <Card glow={signal.score > 8.5} className="group hover:-translate-y-1 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-white group-hover:text-accent transition-colors">{signal.symbol}</h3>
          <p className="text-xs text-muted">{signal.name}</p>
        </div>
        <div className={`px-2 py-1 rounded text-[10px] font-bold ${signal.signal_type.includes('BUY') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
          {signal.signal_type}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Conviction</p>
          <p className="text-lg font-bold text-white">{signal.score}/10</p>
        </div>
        <div>
          <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Price Target</p>
          <p className="text-lg font-bold text-accent">
            {signal.market === 'NGX' ? '₦' : '$'}{signal.price_target}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <span className="p-1 bg-white/5 rounded mt-0.5"><Clock size={12} className="text-muted" /></span>
          <p className="text-xs text-muted leading-relaxed line-clamp-2">{signal.analysis.reason}</p>
        </div>
        <div className="flex items-start gap-2">
          <span className="p-1 bg-white/5 rounded mt-0.5"><ShieldAlert size={12} className="text-muted" /></span>
          <p className="text-xs text-muted italic">Risk: {signal.risk_score}/10 · Low Float Warning</p>
        </div>
      </div>
      
      <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center text-[10px]">
        <span className="text-muted">Last Updated: 2m ago</span>
        <button className="text-accent hover:underline font-bold">Deep Research →</button>
      </div>
    </Card>
  );
};
