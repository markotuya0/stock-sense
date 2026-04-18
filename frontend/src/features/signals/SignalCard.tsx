import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/design-system/Card';
import { Clock, ShieldAlert } from 'lucide-react';

export const SignalCard: React.FC<{ signal: any }> = ({ signal }) => {
  const navigate = useNavigate();
  // Null safety checks
  const verificationState = signal?.verification_state || 'verified';
  const signalType = signal?.signal_type || 'HOLD';
  const isBuy = signalType?.includes?.('BUY') ?? false;
  const analysisReason = signal?.analysis?.reason || 'No analysis available';

  const stateClass =
    verificationState === 'verified'
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      : verificationState === 'stale'
      ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
      : verificationState === 'fetching'
      ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
      : 'bg-zinc-600/10 text-zinc-300 border-zinc-500/20';

  return (
    <Card glow={(signal?.score ?? 0) > 8.5} className="group hover:-translate-y-1 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-white group-hover:text-accent transition-colors">{signal?.symbol || 'UNKNOWN'}</h3>
          <p className="text-xs text-muted">{signal?.name || 'Unknown Stock'}</p>
        </div>
        <div className={`px-2 py-1 rounded text-[10px] font-bold ${isBuy ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
          {signalType}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Conviction</p>
          <p className="text-lg font-bold text-white">{signal?.score ?? 0}/10</p>
        </div>
        <div>
          <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Price Target</p>
          <p className="text-lg font-bold text-accent">
            {signal?.market === 'NGX' ? '₦' : '$'}{signal?.price_target ?? 'N/A'}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <span className="p-1 bg-white/5 rounded mt-0.5"><Clock size={12} className="text-muted" /></span>
          <p className="text-xs text-muted leading-relaxed line-clamp-2">{analysisReason}</p>
        </div>
        <div className="flex items-start gap-2">
          <span className="p-1 bg-white/5 rounded mt-0.5"><ShieldAlert size={12} className="text-muted" /></span>
          <p className="text-xs text-muted italic">Risk: {signal?.risk_score ?? 5}/10 · Low Float Warning</p>
        </div>
      </div>
      
      <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center text-[10px]">
        <span className={`px-2 py-1 rounded border uppercase tracking-widest ${stateClass}`}>{verificationState}</span>
        <button
          onClick={() => navigate(`/stock/${signal?.symbol}`)}
          className="text-accent hover:underline font-bold transition-colors"
        >
          Deep Research →
        </button>
      </div>
    </Card>
  );
};
