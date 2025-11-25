



import React, { useEffect, useState } from 'react';
import { fetchCommunityZines, fetchUserZines, fetchTrendingZines, fetchEchoes, addEcho, uploadBlob, addToPocket } from '../services/firebase';
import { ZineMetadata, Echo, ToneTag } from '../types';
import { useUser } from '../contexts/UserContext';
import { useRecorder } from '../hooks/useRecorder';
import { Bookmark, Check, Loader2 } from 'lucide-react';
import { ZineCard } from './ZineCard'; // Imported now that it's separated or if it's in same file, keep as is. Assuming ZineCard component is below or imported.

// If ZineCard is in separate file, import it. 
// However, based on previous context, ZineCard was exported from Shelf.tsx or ZineCard.tsx.
// The user provided ZineCard.tsx content previously, so I will assume ZineCard is imported from './ZineCard'.
// But wait, the previous Shelf.tsx contained ZineCard definition.
// I should remove ZineCard definition from here if I import it, OR keep it if the user wants single file updates.
// The user provided ZineCard.tsx in the "Updated files" list of the PREVIOUS prompt response.
// So I will IMPORT ZineCard here.

interface ShelfProps {
  variant: 'community' | 'personal' | 'clique';
  onSelectZine: (zine: ZineMetadata) => void;
}

export const Shelf: React.FC<ShelfProps> = ({ variant, onSelectZine }) => {
  const { user } = useUser();
  const [zines, setZines] = useState<ZineMetadata[]>([]);
  const [trendingZines, setTrendingZines] = useState<ZineMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadShelf = async () => {
      setLoading(true);
      try {
        let data: ZineMetadata[] = [];
        if (variant === 'personal' && user) {
          data = await fetchUserZines(user.uid);
        } else if (variant === 'clique') {
           // Mock Clique Logic: Fetch community zines but filter for "intimate" vibes or just a subset
           // In a real app, this would be `fetchFollowedUserZines(user.uid)`
           const all = await fetchCommunityZines(30);
           // Just simulate a smaller circle by taking every 3rd zine or randomizing
           data = all.filter((_, i) => i % 3 === 0); 
        } else {
          // Status-Quo (Community)
          data = await fetchCommunityZines();
          // Load trending feed
          const trending = await fetchTrendingZines(5);
          setTrendingZines(trending);
        }
        setZines(data);
      } catch (e) {
        console.error("Failed to load shelf", e);
      } finally {
        setLoading(false);
      }
    };
    loadShelf();
  }, [variant, user]);

  if (loading) {
    return <div className="w-full flex justify-center p-12"><div className="w-6 h-6 border rounded-full animate-spin border-t-nous-text border-stone-200"/></div>;
  }

  if (zines.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-12 text-center opacity-60">
        <p className="font-serif italic text-xl text-nous-subtle mb-2">
          {variant === 'personal' ? "Your archive is silent." : variant === 'clique' ? "Your circle is quiet." : "The status quo is empty."}
        </p>
        {variant === 'personal' && (
          <p className="font-sans text-[9px] uppercase tracking-widest text-nous-subtle">
            Curate your first issue in the Studio.
          </p>
        )}
        {variant === 'clique' && (
           <p className="font-sans text-[9px] uppercase tracking-widest text-nous-subtle mt-2">
             Invite friends to populate your Clique.
           </p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full pb-12 pt-4 px-4 md:px-12">
      
      {/* FEATURED / TRENDING SECTION (Only Community) */}
      {variant === 'community' && trendingZines.length > 0 && (
        <div className="mb-12 border-b border-stone-100 pb-12">
           <div className="flex items-center gap-2 mb-8">
             <div className="w-1.5 h-1.5 bg-nous-text rounded-full" />
             <h3 className="font-sans text-[10px] uppercase tracking-[0.2em] text-nous-text">The Zeitgeist (High Rotation)</h3>
           </div>
           
           <div className="overflow-x-auto hide-scrollbar -mr-4 md:mr-0">
              <div className="flex gap-8 md:gap-12 w-max pb-4 pr-8 pl-1">
                {trendingZines.map((zine) => (
                  <ZineCard 
                    key={`trending-${zine.id}`} 
                    zine={zine} 
                    onClick={() => onSelectZine(zine)} 
                    currentUserId={user?.uid}
                    featured={true}
                  />
                ))}
              </div>
           </div>
        </div>
      )}

      {/* FEED */}
      <div className="mb-6">
         <h3 className="font-sans text-[10px] uppercase tracking-[0.2em] text-nous-subtle mb-6">
           {variant === 'personal' ? 'Chronological Archive' : variant === 'clique' ? 'Inner Circle' : 'Recent Issues'}
         </h3>
         <div className="overflow-x-auto hide-scrollbar -mr-4 md:mr-0">
          <div className="flex gap-8 md:gap-12 w-max pb-4 pr-8 pl-1">
            {zines.map((zine) => (
              <ZineCard 
                key={zine.id} 
                zine={zine} 
                onClick={() => onSelectZine(zine)} 
                currentUserId={user?.uid}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};