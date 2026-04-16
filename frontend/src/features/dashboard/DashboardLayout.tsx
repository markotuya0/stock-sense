import React from 'react';
import { Search, Home, Signal, TrendingUp, Settings, HelpCircle, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { UniversalSearchModal } from './UniversalSearchModal';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <UniversalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      {/* Thin Sidebar */}
      <aside className="w-16 flex flex-col items-center py-8 border-r border-white/5 bg-background/50 backdrop-blur-xl">
        <div className="mb-10 p-2 bg-accent/20 rounded-xl">
          <Signal className="text-accent w-6 h-6" />
        </div>
        <nav className="flex flex-col gap-6">
          <NavItem icon={<Home w-5 h-5 />} onClick={() => navigate('/dashboard')} active />
          <NavItem icon={<TrendingUp w-5 h-5 />} onClick={() => navigate('/accuracy')} />
          <NavItem icon={<Search w-5 h-5 />} onClick={() => setIsSearchOpen(true)} />
          <NavItem icon={<Settings w-5 h-5 />} onClick={() => navigate('/settings')} />
        </nav>
        <div className="mt-auto">
          <NavItem icon={<User w-5 h-5 />} />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header / Search bar */}
        <header className="h-16 border-b border-white/5 flex items-center px-8 justify-between">
           <div 
             onClick={() => setIsSearchOpen(true)}
             className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-lg border border-white/10 w-[400px] text-muted cursor-pointer hover:bg-white/10 transition-all"
           >
              <Search size={16} />
              <span className="text-sm">Universal Search...</span>
              <kbd className="ml-auto text-[10px] bg-white/10 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                 <button className="px-3 py-1 text-xs rounded bg-accent text-background font-bold">US</button>
                 <button className="px-3 py-1 text-xs rounded text-muted hover:text-white">NGX</button>
              </div>
              <HelpCircle size={20} className="text-muted" />
           </div>
        </header>

        {/* Dynamic Feed Area */}
        <div className="flex-1 overflow-y-auto p-8 mesh-gradient">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon, onClick, active = false }: { icon: React.ReactNode, onClick?: () => void, active?: boolean }) => (
  <div 
    onClick={onClick}
    className={`p-2 rounded-lg cursor-pointer transition-all ${active ? 'bg-white/10 text-white' : 'text-muted hover:text-white hover:bg-white/5'}`}
  >
    {icon}
  </div>
);
