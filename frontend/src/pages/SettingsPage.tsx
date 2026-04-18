import React from 'react';
import { Bell, Shield, Wallet, Smartphone, ExternalLink, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../store/auth/useAuthStore';

export const SettingsPage: React.FC = () => {
  const tier = useAuthStore(s => s.tier);
  const isLinked = false;
  
  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black italic tracking-tighter mb-8">SETTINGS</h1>

        <div className="space-y-6">
          {/* Channel Linking Section */}
          <section className="bg-zinc-950 border border-zinc-900 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="text-zinc-500" />
              <h2 className="text-xl font-bold">Alert Channels</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Telegram Connect */}
              <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl group hover:border-zinc-500 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <Smartphone className="text-blue-400" />
                  {isLinked ? (
                    <span className="flex items-center gap-1 text-green-500 text-[10px] font-bold uppercase tracking-widest">
                      <CheckCircle size={10} /> Linked
                    </span>
                  ) : (
                    <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest italic">Not Linked</span>
                  )}
                </div>
                <h3 className="font-bold mb-1">Telegram Briefings</h3>
                <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
                  Receive your personal 7:30 AM market briefing and real-time Layer 2 deep analysis.
                </p>
                <button 
                  className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-800 hover:bg-white hover:text-black transition-all rounded-xl font-bold text-sm"
                  onClick={() => window.open('https://t.me/StockSenseAIBot', '_blank')}
                >
                  <ExternalLink size={16} /> {isLinked ? 'Manage Bot' : 'Connect Private Bot'}
                </button>
              </div>

              {/* WhatsApp Premium */}
              <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl opacity-50 relative pointer-events-none">
                <div className="absolute top-4 right-4 bg-yellow-500/20 text-yellow-500 text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-yellow-500/30">
                  Enterprise
                </div>
                <div className="flex justify-between items-start mb-4">
                  <Smartphone className="text-green-500" />
                </div>
                <h3 className="font-bold mb-1">WhatsApp Fast-Pass</h3>
                <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
                  Instant WhatsApp notifications for high-conviction signals. Premium low-latency delivery.
                </p>
                <button className="w-full py-3 bg-zinc-800 rounded-xl font-bold text-sm text-zinc-500 italic cursor-not-allowed">
                  Upgrade to Enterprise
                </button>
              </div>
            </div>
          </section>

          {/* Subscription Section */}
          <section className="bg-zinc-950 border border-zinc-900 rounded-3xl p-8">
             <div className="flex items-center gap-3 mb-6">
              <Wallet className="text-zinc-500" />
              <h2 className="text-xl font-bold">Billing & Subscription</h2>
            </div>
            <div className="flex items-center justify-between p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl">
               <div>
                  <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Current Tier</div>
                  <div className="text-2xl font-black italic tracking-tighter">{tier.toUpperCase()} ACCESS</div>
               </div>
               <button className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all">
                 Upgrade Plan
               </button>
            </div>
          </section>

          {/* Security Section */}
          <section className="bg-zinc-950 border border-zinc-900 rounded-3xl p-8">
             <div className="flex items-center gap-3 mb-6">
              <Shield className="text-zinc-500" />
              <h2 className="text-xl font-bold">Security</h2>
            </div>
            <div className="space-y-4">
               <button className="w-full text-left p-4 hover:bg-zinc-900 rounded-xl transition-all border border-transparent hover:border-zinc-800">
                  <div className="font-bold">Change Password</div>
                  <div className="text-xs text-zinc-500">Rotate your access credentials</div>
               </button>
               <button className="w-full text-left p-4 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20 text-red-500">
                  <div className="font-bold">Delete Account</div>
                  <div className="text-xs opacity-60">Permanently wipe your data</div>
               </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
