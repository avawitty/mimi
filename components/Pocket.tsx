import React, { useEffect, useState } from 'react';
import { PocketItem, ZineMetadata } from '../types';
import { fetchPocketItems, deleteFromPocket, getZine } from '../services/firebase';
import { useUser } from '../contexts/UserContext';
import { ZineCard } from './ZineCard';
import { Loader2, Trash2, Maximize2, Palette } from 'lucide-react';

interface PocketProps {
  onSelectZine: (zine: ZineMetadata) => void;
}

const SavedPaletteCard: React.FC<{ item: PocketItem, onDelete: (id: string) => void }> = ({ item, onDelete }) => {
    const [isDeleting, setIsDeleting] = useState(false);
  
    const handleDelete = async (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsDeleting(true);
      await onDelete(item.id);
    };

    const colors = item.content.colors || [];
    
    return (
        <div className="group relative break-inside-avoid mb-6 bg-white border border-stone-100 shadow-sm hover:shadow-md transition-shadow p-6">
            <div className="flex items-center gap-2 mb-4">
                <Palette className="w-4 h-4 text-nous-subtle" />
                <span className="font-sans text-[8px] uppercase tracking-widest text-nous-subtle">Source Reading</span>
            </div>
            
            <div className="flex gap-2 mb-6">
                {colors.map((c, i) => (
                    <div key={i} className="group/color relative">
                        <div 
                           className="w-6 h-6 rounded-full border border-stone-100 shadow-sm cursor-help" 
                           style={{ backgroundColor: c }}
                        />
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black/80 text-white text-[8px] rounded opacity-0 group-hover/color:opacity-100 transition-opacity whitespace-nowrap z-20 font-mono">
                            {c}
                        </span>
                    </div>
                ))}
            </div>

            <div className="mb-4">
                 <p className="font-serif italic text-lg text-nous-text">"{item.content.metaphor}"</p>
            </div>
            
            {item.content.colorTheory && (
                 <div className="mb-4">
                     <span className="font-sans text-[8px] uppercase tracking-widest text-stone-300 block mb-1">Theory</span>
                     <p className="font-sans text-xs text-nous-accent">{item.content.colorTheory}</p>
                 </div>
            )}

            <div className="flex flex-wrap gap-2 mb-4">
                {item.content.emotions?.map((e, i) => (
                    <span key={i} className="font-sans text-[8px] uppercase tracking-widest text-stone-400 bg-stone-50 px-2 py-1 rounded-sm">{e}</span>
                ))}
            </div>

            <div className="flex justify-between items-center border-t border-stone-100 pt-4">
                <span className="font-sans text-[8px] uppercase tracking-widest text-stone-300">
                    {new Date(item.savedAt).toLocaleDateString()}
                </span>
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-stone-300 hover:text-red-400 transition-colors"
                >
                  {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                </button>
            </div>
        </div>
    );
}

const SavedImageCard: React.FC<{ item: PocketItem, onDelete: (id: string) => void }> = ({ item, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    await onDelete(item.id);
  };

  return (
    <div className="group relative break-inside-avoid mb-6 bg-white border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="relative aspect-[1/1] overflow-hidden">
        <img src={item.content.imageUrl} alt={item.content.prompt} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-end p-2">
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 bg-white/20 hover:bg-white/90 rounded-full text-white hover:text-red-500 transition-colors backdrop-blur-sm"
            >
              {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
            </button>
        </div>
      </div>
      <div className="p-4">
        <p className="font-serif text-sm italic text-nous-text line-clamp-2 leading-relaxed">"{item.content.prompt}"</p>
        <div className="mt-3 flex justify-between items-center">
            <span className="font-sans text-[8px] uppercase tracking-widest text-nous-subtle">
                Saved {new Date(item.savedAt).toLocaleDateString()}
            </span>
            <span className="font-sans text-[8px] uppercase tracking-widest text-stone-300">
                {item.content.aspectRatio || '1:1'}
            </span>
        </div>
      </div>
    </div>
  );
};

const SavedZineWrapper: React.FC<{ item: PocketItem, onSelectZine: (zine: ZineMetadata) => void, onDelete: (id: string) => void }> = ({ item, onSelectZine, onDelete }) => {
    const [isDeleting, setIsDeleting] = useState(false);

    // Reconstruct partial metadata for display
    const mockZine: ZineMetadata = {
        id: item.content.zineId || '',
        userId: '', 
        userHandle: item.content.userHandle || 'Unknown',
        userAvatar: item.content.userAvatar,
        title: item.content.zineTitle || 'Untitled',
        tone: item.content.zineTone || 'Chic',
        timestamp: item.savedAt,
        likes: 0,
        content: {
            title: item.content.zineTitle || 'Untitled',
            archetype_identity: item.content.zineArchetype,
            pages: [],
            voiceoverScript: '',
            ambientDirection: ''
        }
    };

    const handleClick = async () => {
        if (!item.content.zineId) return;
        // Fetch full zine data
        try {
            const zine = await getZine(item.content.zineId);
            if (zine) {
                onSelectZine(zine);
            } else {
                alert("This issue has been archived (deleted) by the author.");
            }
        } catch (e) {
            console.error("Failed to load zine", e);
        }
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDeleting(true);
        await onDelete(item.id);
    };

    return (
        <div className="relative group mb-8 break-inside-avoid">
             <div className="relative">
                 <ZineCard 
                    zine={mockZine} 
                    onClick={handleClick} 
                    currentUserId={undefined} 
                    isSavedItem={true}
                 />
                 <button 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="absolute top-2 right-2 p-2 bg-white/50 hover:bg-white text-stone-500 hover:text-red-500 rounded-full transition-colors z-30 opacity-0 group-hover:opacity-100"
                 >
                    {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                 </button>
             </div>
        </div>
    );
};

export const Pocket: React.FC<PocketProps> = ({ onSelectZine }) => {
  const { user } = useUser();
  const [items, setItems] = useState<PocketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'image' | 'zine_card' | 'palette'>('all');

  useEffect(() => {
    if (user) {
      fetchPocketItems(user.uid).then((data) => {
        setItems(data);
        setLoading(false);
      });
    }
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
        await deleteFromPocket(user.uid, id);
        setItems(prev => prev.filter(i => i.id !== id));
    } catch (e) {
        console.error("Delete failed", e);
    }
  };

  const filteredItems = items.filter(item => filter === 'all' || item.type === filter);

  if (loading) return <div className="flex justify-center p-24"><Loader2 className="animate-spin text-nous-text" /></div>;

  return (
    <div className="w-full max-w-6xl mx-auto px-6 md:px-12 pt-12 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-stone-200 pb-8">
        <div>
           <h2 className="font-serif text-3xl italic text-nous-text mb-4">The Pocket</h2>
           <p className="font-sans text-[10px] uppercase tracking-widest text-nous-subtle">
             Your private collection of fragments and issues.
           </p>
        </div>
        
        <div className="flex gap-4 mt-6 md:mt-0">
           {(['all', 'image', 'zine_card', 'palette'] as const).map(f => (
             <button
               key={f}
               onClick={() => setFilter(f)}
               className={`text-[9px] uppercase tracking-widest pb-1 transition-colors ${filter === f ? 'text-nous-text border-b border-nous-text' : 'text-stone-400 border-b border-transparent hover:text-nous-text'}`}
             >
                {f === 'zine_card' ? 'Issues' : f === 'image' ? 'Visions' : f === 'palette' ? 'Analyses' : 'Everything'}
             </button>
           ))}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-24 opacity-60">
            <p className="font-serif italic text-xl text-nous-subtle">Empty pockets.</p>
            <p className="font-sans text-[9px] uppercase tracking-widest mt-2">Save visions and issues to keep them here.</p>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
            {filteredItems.map(item => (
                <div key={item.id}>
                    {item.type === 'image' ? (
                        <SavedImageCard item={item} onDelete={handleDelete} />
                    ) : item.type === 'palette' ? (
                        <SavedPaletteCard item={item} onDelete={handleDelete} />
                    ) : (
                        <SavedZineWrapper item={item} onSelectZine={onSelectZine} onDelete={handleDelete} />
                    )}
                </div>
            ))}
        </div>
      )}
    </div>
  );
};