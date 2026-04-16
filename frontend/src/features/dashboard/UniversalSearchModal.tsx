import React, { useState, useEffect } from 'react';
import { Search, X, TrendingUp, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';

export const UniversalSearchModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const normalized = query.trim();
    if (normalized.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('/search/', { params: { q: normalized } });
        setResults(response.data || []);
      } catch (error) {
        console.error('Search failed', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden shadow-accent/10">
        <div className="p-4 flex items-center gap-4 border-b border-zinc-900">
          <Search className="text-zinc-500" size={20} />
          <input 
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-xl font-medium placeholder:text-zinc-700" 
            placeholder="Search signals, tickers, analysts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={onClose} className="p-1 hover:bg-zinc-900 rounded-lg text-zinc-500 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="p-12 text-center text-zinc-500">Searching...</div>
          ) : results.length > 0 ? (
            <div className="p-2">
              <div className="px-4 py-2 text-[10px] uppercase font-bold text-zinc-600 tracking-widest">Matches</div>
              {results.map((res, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between p-4 hover:bg-zinc-900 rounded-xl cursor-pointer group transition-all"
                  onClick={() => {
                    navigate(`/stock/${res.symbol}`);
                    onClose();
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center font-bold italic text-zinc-400 group-hover:bg-white group-hover:text-black transition-all">
                      {res.symbol[0]}
                    </div>
                    <div>
                       <div className="font-bold">{res.symbol}</div>
                       <div className="text-xs text-zinc-500">{res.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
                    <Globe size={12} />
                    <span>{res.market}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="p-12 text-center text-zinc-500">
               No matching tickers found.
            </div>
          ) : (
            <div className="p-8 text-center text-zinc-600 text-sm italic">
               Try searching for "NVDA", "ZENITHB", or "Tech"
            </div>
          )}
        </div>
        
        <div className="bg-zinc-900/50 p-4 border-t border-zinc-900 flex justify-between items-center text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
           <span>StockSense AI · v0.2.0</span>
           <div className="flex gap-4">
             <span className="flex items-center gap-1"><TrendingUp size={10}/> Institutional Accuracy 84.2%</span>
           </div>
        </div>
      </div>
    </div>
  );
};
