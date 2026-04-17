import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Cpu, Search, Database, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../../store/auth/useAuthStore';

export const AnalysisTerminal: React.FC<{ ticker: string }> = ({ ticker }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const tier = useAuthStore((s) => s.tier);
  const steps = [
    "Initializing Researcher agent...",
    "Querying SEC EDGAR filings for AAPL...",
    "Analyzing quarterly cash flows...",
    "Macro agent checking consumer sentiment trends...",
    "Regulatory agent scanning for antitrust updates...",
    "Synthesizing findings... [Llama 3.1-405B]",
    "VALIDATION COMPLETE: 9.2/10 Conviction."
  ];

  useEffect(() => {
    if (!ticker) return;
    const tierLevel = tier === 'ENTERPRISE' ? 2 : tier === 'PRO' ? 1 : 0;
    if (tierLevel < 1) {
      setLogs(["Upgrade to Pro to view live Layer 2 analysis."]);
      return;
    }
    const base = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const token = localStorage.getItem('access_token');
    const url = `${base}/api/v1/analysis/stream/${ticker}?token=${encodeURIComponent(token || '')}`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLogs(prev => [...prev, data.log]);
      if (data.completed) {
        eventSource.close();
      }
    };

    eventSource.addEventListener('done', (event: any) => {
      const data = JSON.parse(event.data);
      setLogs(prev => [...prev, `REPORT GENERATED: ${data.final_signal}`]);
      eventSource.close();
    });

    eventSource.onerror = (err) => {
      console.error("EventSource failed:", err);
      setLogs((prev) => (prev.length ? prev : ["Live analysis unavailable right now."]));
      eventSource.close();
    };

    return () => eventSource.close();
  }, [ticker]);

  return (
    <div className="bg-[#050510] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
      <div className="bg-white/5 px-4 py-2 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-accent" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted">Layer 2 Pipeline · Live</span>
        </div>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-500/50" />
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
        </div>
      </div>
      
      <div className="p-6 font-mono text-xs space-y-3 h-[300px] overflow-y-auto">
        <AnimatePresence>
          {logs.map((log, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-3"
            >
              <span className="text-accent">❯</span>
              <span className={i === steps.length - 1 ? "text-emerald-400 font-bold" : "text-zinc-400"}>
                {log}
              </span>
              {i < steps.length - 1 && i === logs.length - 1 && (
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="w-1 h-3 bg-accent"
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      <div className="px-6 py-4 bg-accent/5 border-t border-white/5 flex items-center gap-4">
        <AgentStatus icon={<Search size={14} />} label="Researcher" active={logs.length > 0} />
        <AgentStatus icon={<Database size={14} />} label="Macro" active={logs.length > 3} />
        <AgentStatus icon={<Cpu size={14} />} label="Analyst" active={logs.length > 5} />
      </div>
    </div>
  );
};

const AgentStatus = ({ icon, label, active }: { icon: any, label: string, active: boolean }) => (
  <div className={`flex items-center gap-2 transition-all ${active ? 'text-accent opacity-100' : 'text-muted opacity-30'}`}>
    {icon}
    <span className="text-[10px] uppercase font-bold tracking-tighter">{label}</span>
    {active && <CheckCircle size={10} />}
  </div>
);
