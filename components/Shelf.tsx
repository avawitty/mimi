
import React, { useEffect, useState } from 'react';
import { fetchCommunityZines, fetchUserZines } from '../services/firebase';
import { generateSeasonReport } from '../services/geminiService';
import { getLocalZines } from '../services/localArchive';
import { ZineMetadata, SeasonReport } from '../types';
import { useUser } from '../contexts/UserContext';
import { Sparkles, Map as MapIcon, Ghost, Eye, Loader2, AlertCircle, RefreshCcw, Zap } from 'lucide-react';
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

  const loadShelf = async () => {
    setLoading(true);
    setError(false);
    try {
      let finalZines: ZineMetadata[] = [];
      
      if (variant === 'personal') {
        const localData = getLocalZines() || [];
        let cloudData: ZineMetadata[] = [];
        
        if (user && !user.isAnonymous) {
          try {
            cloudData = await fetchUserZines(user.uid) || [];
          } catch (cloudErr) {
            console.warn("Mimi: Cloud archives temporarily obscured.", cloudErr);
          }
        }
        
        const dataMap = new Map<string, ZineMetadata>();
        cloudData.forEach((z: ZineMetadata) => { if (z && z.id) dataMap.set(z.id, z); });
        localData.forEach((z: ZineMetadata) => {
            if (z && z.id && !dataMap.has(z.id)) {
              dataMap.set(z.id, z);
            }
        });
        
        finalZines = Array.from(dataMap.values()).sort((a, b) => b.timestamp - a.timestamp);
      } else {
         finalZines = await fetchCommunityZines(20) || [];
      }
      
      setZines(finalZines);

      if (finalZines.length > 0 && (variant === 'community' || variant === 'clique')) {
          try {
              const r = await generateSeasonReport(finalZines.slice(0, 10));
              setReport(r);
          } catch (re) {
              console.warn("Mimi: Seasonal analysis disrupted.");
          }
      }
    } catch (e) {
      console.error("Mimi: Shelf collapse.", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShelf();
  }, [variant, user]);

  if (loading) {
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
                {variant === 'community' && <Zap size={18} className="text-amber-400" />}
                <h3 className="font-serif text-4xl italic text-nous-text dark:text-nous-dark-text luminescent-text tracking-tighter">
                  {variant === 'personal' ? 'Shadow Archive' : variant === 'clique' ? 'Clique Radar' : 'Transmissions'}
                </h3>
              </div>
              <span className="font-sans text-[8px] uppercase tracking-[0.5em] text-stone-400 font-black">
                {variant === 'community' ? 'BROADCASTING_HIVEMIND' : 'TEMPORAL_LOGS'}: {zines.length}
              </span>
           </div>
           <div className="flex items-center gap-4">
              <button onClick={loadShelf} className="p-3 bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-full text-stone-400 hover:text-nous-text transition-all active:rotate-180" title="Refresh Frequency">
                  <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
              {error && (
                  <div className="flex items-center gap-2 text-red-500">
                      <AlertCircle size={14} />
                      <span className="font-sans text-[8px] uppercase tracking-widest font-black">Signal Obscured</span>
                  </div>
              )}
           </div>
        </div>

        {zines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-48 opacity-30 text-center">
             <Ghost size={64} className="mb-8 text-stone-200" />
             <p className="font-serif italic text-3xl mb-4">Silence in the archives.</p>
             <p className="font-sans text-[9px] uppercase tracking-[0.5em] font-black leading-relaxed max-w-sm">
                {variant === 'personal' ? 'Manifest a refraction in the studio to begin your log.' : 'The community is currently in a state of quietude.'}
             </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-12 gap-y-20">
            {zines.map((zine) => (
              zine && zine.id ? (
                <ZineCard key={zine.id} zine={zine} onClick={() => onSelectZine(zine)} currentUserId={user?.uid} />
              ) : null
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
