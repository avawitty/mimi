import React, { useEffect, useState, useCallback } from 'react';
import { fetchCommunityZines, fetchUserZines } from '../services/firebase';
import { generateSeasonReport } from '../services/geminiService';
import { getLocalZines } from '../services/localArchive';
import { ZineMetadata, SeasonReport } from '../types';
import { useUser } from '../contexts/UserContext';
import { Ghost, Loader2, RefreshCcw, Zap, Archive } from 'lucide-react';
import { ZineCard } from './ZineCard'; 
import { SeasonReportTicker } from './SeasonReportTicker';

interface ShelfProps {
  variant: 'community' | 'personal' | 'clique';
  onSelectZine: (zine: ZineMetadata) => void;
}

export const Shelf: React.FC<ShelfProps> = ({ variant, onSelectZine }) => {
  const { user } = useUser();
  const [zines, setZines] = useState<ZineMetadata[]>([]);
  const [report, setReport] = useState<SeasonReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<boolean>(false);

  const loadShelf = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(false);
    try {
      let finalZines: ZineMetadata[] = [];
      
      if (variant === 'personal') {
        const localData = await getLocalZines() || [];
        let cloudData: ZineMetadata[] = [];

        if (user && !user.isAnonymous) {
          try {
            cloudData = await fetchUserZines(user.uid) || [];
          } catch (cloudErr) {
            console.warn("MIMI // Stand: Cloud registry obscured.");
          }
        }
        
        const registry = new Map<string, ZineMetadata>();
        cloudData.forEach(z => { if (z && z.id) registry.set(z.id, z); });
        localData.forEach(z => { if (z && z.id) registry.set(z.id, z); });
        
        finalZines = Array.from(registry.values())
          .filter(z => z && z.id)
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      } else {
         const data = await fetchCommunityZines(20);
         finalZines = (data || []).filter(z => z && z.id);
      }
      
      setZines(finalZines);

      if (finalZines.length > 0 && (variant === 'community' || variant === 'clique')) {
          try {
              const r = await generateSeasonReport(finalZines.slice(0, 5));
              setReport(r);
          } catch (re) {
              console.warn("MIMI // Stand: Seasonal analysis deferred.");
          }
      }
    } catch (e) {
      console.error("MIMI // Stand Collapse:", e);
      setError(true);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [variant, user]);

  useEffect(() => {
    loadShelf();
    
    // LISTEN FOR NEW ARTIFACTS
    const handleArchiveUpdate = () => {
      if (variant === 'personal') {
        loadShelf(true); // Silent re-hydration
      }
    };
    
    window.addEventListener('mimi:artifact_finalized', handleArchiveUpdate);
    return () => window.removeEventListener('mimi:artifact_finalized', handleArchiveUpdate);
  }, [loadShelf, variant]);

  if (loading && zines.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-24 gap-4 animate-pulse">
        <Loader2 className="animate-spin text-stone-300" size={32} />
        <span className="font-sans text-[8px] uppercase tracking-[0.4em] text-stone-400 font-black italic">Consulting Archives...</span>
      </div>
    );
  }

  return (
    <div className="w-full pb-32 animate-fade-in">
      {(variant === 'community' || variant === 'clique') && <SeasonReportTicker report={report} />}

      <div className="px-6 md:px-12 pt-8">
        <div className="flex items-center justify-between mb-16 border-b border-stone-100 dark:border-stone-800 pb-10">
           <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                {variant === 'personal' ? <Archive size={18} className="text-stone-400" /> : <Zap size={18} className="text-amber-400" />}
                <h3 className="font-serif text-4xl italic text-nous-text dark:text-white luminescent-text tracking-tighter">
                  {variant === 'personal' ? 'Deep Archive' : variant === 'clique' ? 'Clique Radar' : 'Transmissions'}
                </h3>
              </div>
              <span className="font-sans text-[8px] uppercase tracking-[0.5em] text-stone-400 font-black">
                {variant === 'personal' ? 'PERMANENT_RECORD' : 'BROADCAST_FEED'}: {zines.length} Artifacts
              </span>
           </div>
           <button onClick={() => loadShelf()} className="p-3 bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-full text-stone-400 hover:text-nous-text dark:hover:text-white transition-all active:rotate-180" title="Refresh">
               <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
           </button>
        </div>

        {zines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-48 opacity-30 text-center">
             <Ghost size={64} className="mb-8 text-stone-200" />
             <p className="font-serif italic text-3xl mb-4">“Nothing here yet.”</p>
             <p className="font-sans text-[9px] uppercase tracking-[0.5em] font-black leading-relaxed max-w-sm">
                The archive is currently a void waiting for manifest.
             </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-12 gap-y-20">
            {zines.map((zine) => (
              <ZineCard key={zine.id} zine={zine} onClick={() => onSelectZine(zine)} currentUserId={user?.uid} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};