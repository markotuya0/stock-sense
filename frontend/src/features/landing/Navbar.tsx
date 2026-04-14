import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/design-system/Button';
import { motion, useScroll, useTransform } from 'framer-motion';

export const Navbar: React.FC = () => {
  const { scrollY } = useScroll();
  const backgroundColor = useTransform(
    scrollY,
    [0, 100],
    ["rgba(2, 6, 23, 0)", "rgba(2, 6, 23, 0.8)"]
  );
  const borderBottom = useTransform(
    scrollY,
    [0, 100],
    ["1px solid rgba(255, 255, 255, 0)", "1px solid rgba(255, 255, 255, 0.1)"]
  );

  return (
    <motion.nav 
      style={{ backgroundColor, borderBottom }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md transition-all h-20 flex items-center"
    >
      <div className="max-w-6xl mx-auto w-full px-6 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3 group cursor-pointer">
          <div className="w-6 h-6 border border-emerald-500 flex items-center justify-center transition-colors group-hover:border-white">
            <div className="w-1 h-1 bg-emerald-500 transition-colors group-hover:bg-white" />
          </div>
          <span className="font-mono text-xs font-bold tracking-[0.4em] text-slate-50 group-hover:text-emerald-500 transition-colors">STOCKSENSE</span>
        </Link>

        <div className="flex items-center gap-8">
          <div className="hidden md:flex gap-8 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
            <a href="#accuracy" className="hover:text-white transition-colors">Performance</a>
            <a href="#specialists" className="hover:text-white transition-colors">Specialists</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="h-4 w-px bg-white/10 hidden md:block" />
          <div className="flex items-center gap-4">
             <Link to="/login" className="text-[10px] uppercase tracking-widest text-slate-50 font-bold hover:text-emerald-500 transition-colors cursor-pointer">Login</Link>
             <Link to="/signup">
                <Button size="sm">Initialize Access</Button>
             </Link>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};
