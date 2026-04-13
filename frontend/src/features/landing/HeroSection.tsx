import React from 'react';
import { Button } from '../../components/design-system/Button';
import { BentoCard } from '../../components/design-system/Card';
import { motion } from 'framer-motion';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden mesh-gradient">
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-20">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50"
          >
            Institutional intelligence <br /> for your portfolio.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-muted mb-10 max-w-2xl mx-auto"
          >
            The first AI-powered investment analyst for US and Nigerian stocks. 
            Real-time scanning, multi-agent research, and high-conviction signals.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-4"
          >
            <Button size="lg">Get Started Free</Button>
            <Button variant="secondary" size="lg">View Live Ticker</Button>
          </motion.div>
        </div>

        {/* Bento Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[600px]">
          <div className="md:col-span-8">
            <BentoCard className="relative overflow-hidden group">
              <div className="relative z-10 max-w-md">
                <h3 className="text-2xl font-bold mb-4">Layer 2: Deep Analysis</h3>
                <p className="text-muted">Our 7-agent pipeline researches every SEC filing, news report, and macro trend to find hidden gems.</p>
              </div>
              {/* Abstract visual placeholder */}
              <div className="absolute right-0 bottom-0 w-1/2 h-full bg-gradient-to-l from-accent/10 to-transparent flex items-center justify-center">
                 <div className="w-full h-full opacity-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat"></div>
                 <div className="absolute inset-x-10 bottom-10 p-4 glass-card text-xs font-mono text-accent">
                    {`> Running Researcher agent...`} <br />
                    {`> Analyzing balance sheet...`} <br />
                    {`> Checking NGX stale price...`} <br />
                    {`> VALIDATED: STRONG_BUY`}
                 </div>
              </div>
            </BentoCard>
          </div>
          <div className="md:col-span-4">
             <BentoCard className="border-accent/20">
                <h3 className="text-2xl font-bold mb-4">Layer 1: Scanner</h3>
                <p className="text-muted mb-6">Automated scans of 500+ stocks at market open. Free morning briefings delivered to your Telegram.</p>
                <div className="mt-auto h-32 w-full bg-accent/5 rounded-xl border border-accent/10 flex items-center justify-center">
                   <span className="text-accent font-bold text-4xl animate-glow-pulse">8.9/10</span>
                </div>
             </BentoCard>
          </div>
        </div>
      </div>
    </section>
  );
};
