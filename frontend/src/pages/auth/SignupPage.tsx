import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/design-system/Button';
import { useAuthStore } from '../../store/auth/useAuthStore';
import { Shield, ArrowRight, Zap, Loader2 } from 'lucide-react';

export const SignupPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { signup, isLoading, error } = useAuthStore();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signup(email, password, 'New Analyst');
      navigate('/login');
    } catch (err) {
      console.error("Signup failed", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="mesh-grain absolute inset-0 opacity-30" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-12">
          <Link to="/" className="inline-flex items-center gap-2 mb-8">
            <Shield className="text-emerald-500" size={24} />
            <span className="text-white font-mono text-xl font-bold tracking-[0.3em]">STOCKSENSE</span>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Apply for Access</h1>
          <p className="text-slate-400 font-mono text-xs uppercase tracking-widest">Join the Alpha Network</p>
        </div>

        <div className="bg-white/5 border border-white/10 p-8 rounded-sm backdrop-blur-sm">
          {error && (
            <div className="mb-6 px-4 py-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] uppercase tracking-widest font-bold">
              {error}
            </div>
          )}
          <form onSubmit={handleSignup} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold ml-1">Desired Terminal ID (Email)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-sm py-3 px-4 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors font-mono"
                placeholder="name@firm.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold ml-1">Secure Access Key (Password)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-sm py-3 px-4 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors font-mono"
                placeholder="Minimum 8 characters"
                required
              />
            </div>

            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-sm mb-6 flex items-start gap-4">
                <Zap className="text-emerald-500 shrink-0" size={18} />
                <div>
                    <p className="text-xs text-emerald-100 font-bold mb-1">PRO-TIER ACCESS</p>
                    <p className="text-[10px] text-emerald-500/70 font-mono leading-relaxed uppercase tracking-tighter">
                        7-Agent Deep Analysis, Real-time Ticker, and Multi-Market Signals included.
                    </p>
                </div>
            </div>

            <Button type="submit" variant="primary" className="w-full py-6 group" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <>Create Analyst Account <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={16} /></>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-slate-500 text-[10px] uppercase tracking-widest">
              Already have Access?{' '}
              <Link to="/login" className="text-emerald-500 hover:text-emerald-400 font-bold ml-1 transition-colors">
                Initialize Session
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
             <span className="text-slate-700 font-mono text-[8px] uppercase tracking-[0.4em]">Proprietary Intelligence System © 2026</span>
        </div>
      </div>
    </div>
  );
};
