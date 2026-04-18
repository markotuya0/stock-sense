import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, TrendingUp, Shield, Globe, Cpu, Search } from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';

import apiClient from '../api/client';

export const StockDetailPage: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [fetchingRealtime, setFetchingRealtime] = useState(false);
  const [stockData, setStockData] = useState<any>(null);
  const [pollError, setPollError] = useState<string | null>(null);

  useEffect(() => {
    let pollTimer: number | undefined;
    let pollRetries = 0;
    const MAX_RETRIES = 20; // 50 seconds (20 * 2.5s)

    const hydrateStock = (data: any) => {
      setStockData({
        symbol: data.symbol,
        name: data.name || data.symbol,
        price: data.price_at_signal,
        change: data.deep_research?.move_pct ?? data.move_pct ?? data.change_pct ?? 0,
        market: data.market,
        signal: data.signal_type,
        score: data.score,
        risk: data.risk_score <= 3 ? "Low" : data.risk_score <= 7 ? "Medium" : "High",
        summary: data.analysis?.reason || "No summary available.",
        sector: data.sector || "N/A",
        ai_thoughts: data.is_layer2 ? (data.deep_research?.agent_logs ?? []) : [],
        verification_state: data.verification_state || 'verified',
        verified_at: data.verified_at,
        data_source: data.data_source || 'SIGNALS_DB',
      });
    };

    const pollUntilVerified = async () => {
      pollRetries++;
      if (pollRetries > MAX_RETRIES) {
        setPollError(`Analysis timed out after ${(MAX_RETRIES * 2.5 / 1000).toFixed(1)}s. Backend job may be stuck.`);
        setFetchingRealtime(false);
        setLoading(false);
        return;
      }

      try {
        const statusRes = await apiClient.get(`/signals/symbol/${symbol}/status`);
        if (statusRes.data?.status === 'verified') {
          const finalRes = await apiClient.get(`/signals/symbol/${symbol}`);
          hydrateStock(finalRes.data);
          setFetchingRealtime(false);
          setLoading(false);
          setPollError(null);
          return;
        }
        if (statusRes.data?.status === 'failed') {
          setPollError("Backend analysis failed. Please try another symbol.");
          setFetchingRealtime(false);
          setLoading(false);
          return;
        }
        pollTimer = window.setTimeout(pollUntilVerified, 2500);
      } catch (err) {
        console.error("Poll error:", err);
        setPollError("Network error during polling. Please try again.");
        setFetchingRealtime(false);
        setLoading(false);
      }
    };

    const fetchStockDetail = async () => {
      try {
        const response = await apiClient.get(`/signals/symbol/${symbol}`);
        const data = response.data;
        if (data?.status === 'fetching') {
          setFetchingRealtime(true);
          setLoading(false);
          pollTimer = window.setTimeout(pollUntilVerified, 2000);
          return;
        }
        hydrateStock(data);
      } catch (error) {
        console.error("Failed to fetch stock detail", error);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    if (symbol) fetchStockDetail();

    return () => {
      if (pollTimer) {
        window.clearTimeout(pollTimer);
      }
    };
  }, [symbol, navigate]);

  if (loading) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;
  if (pollError) {
    return (
      <div className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-xl font-bold text-rose-500">Analysis Error</div>
          <div className="text-zinc-400 text-sm">{pollError}</div>
          <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-emerald-500 rounded text-black font-bold hover:bg-emerald-600">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }
  if (fetchingRealtime) {
    return (
      <div className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-xl font-bold">Fetching verified real-time analysis...</div>
          <div className="text-zinc-500 text-sm">We are validating live market data for {symbol}. (Polling...)</div>
        </div>
      </div>
    );
  }
  if (!stockData) {
    return <div className="p-8 text-zinc-400">Signal unavailable right now. Please retry shortly.</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 max-w-7xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-500 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors">
            <Share2 size={18} />
            <span className="hidden sm:inline">Share Report</span>
          </button>
          <button className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-colors">
            Get Pro Alerts
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Core Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-950 border border-zinc-900 p-8 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <TrendingUp size={120} />
            </div>
            <div className="flex items-center gap-3 mb-2 text-zinc-500 font-mono text-sm">
               <Globe size={14} />
               <span>{stockData.market} MARKET · {stockData.sector}</span>
               <span className="px-2 py-1 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 text-[10px] uppercase tracking-widest">
                 {stockData.verification_state}
               </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter italic">
              {stockData.symbol}
            </h1>
            <p className="text-zinc-400 text-lg max-w-2xl leading-relaxed">
              {stockData.summary}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-2xl">
              <div className="flex items-center gap-2 text-zinc-500 mb-4 uppercase text-xs font-bold tracking-widest">
                <Shield size={16} className="text-green-500" />
                <span>Risk Assessment</span>
              </div>
              <div className="text-3xl font-bold tracking-tight">{stockData.risk.toUpperCase()} RISK</div>
              <div className="mt-2 w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full" style={{ width: `${Math.max(10, 100 - ((stockData.score || 0) * 10))}%` }} />
              </div>
            </div>
            <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-2xl">
              <div className="flex items-center gap-2 text-zinc-500 mb-4 uppercase text-xs font-bold tracking-widest">
                <Cpu size={16} className="text-blue-500" />
                <span>AI Confidence</span>
              </div>
              <div className="text-3xl font-bold tracking-tight">{stockData.score}/10</div>
              <div className="mt-2 w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full" style={{ width: `${Math.max(5, (stockData.score || 0) * 10)}%` }} />
              </div>
            </div>
          </div>

          {/* Detailed Reports Section */}
          <div className="bg-zinc-950 border border-zinc-900 p-8 rounded-2xl">
             <h3 className="text-2xl font-bold mb-6 tracking-tight flex items-center gap-3">
               <Search className="text-zinc-500" />
               Institutional Research
             </h3>
             <div className="prose prose-invert max-w-none">
                <p className="text-zinc-300 leading-relaxed">
                  {stockData.summary}
                </p>
                <div className="mt-6 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl italic text-zinc-400">
                  "{stockData.signal} generated from the latest available stored analysis report."
                </div>
                <div className="mt-3 text-xs text-zinc-500">
                  Source: {stockData.data_source} {stockData.verified_at ? `· Verified at ${new Date(stockData.verified_at).toLocaleString()}` : ''}
                </div>
             </div>
          </div>
        </div>

        {/* Right Column: Signal & Live Stream */}
        <div className="space-y-6">
          <div className="bg-white text-black p-8 rounded-2xl">
             <div className="text-sm font-bold uppercase tracking-widest mb-2 opacity-60">AI Verdict</div>
             <div className="text-5xl font-black italic tracking-tighter mb-4">{stockData.signal}</div>
             <div className="text-4xl font-mono tracking-tighter">${stockData.price}</div>
             <div className={`${stockData.change >= 0 ? 'text-green-600' : 'text-red-500'} font-bold mt-1`}>
               {stockData.change >= 0 ? '+' : ''}{stockData.change}% 24h
             </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden h-full">
            <div className="p-4 border-b border-zinc-900 flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Live Agent Stream</span>
              <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse delay-75" />
                <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse delay-150" />
              </div>
            </div>
            <div className="p-4 bg-black font-mono text-[10px] text-zinc-500 h-64 overflow-y-auto">
               {stockData.ai_thoughts.map((thought: any, i: number) => (
                 <div key={i} className="mb-2">
                   <span className="text-blue-500">[{thought.agent}]</span> {thought.text}
                 </div>
               ))}
               <div className="text-white animate-pulse">_</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
