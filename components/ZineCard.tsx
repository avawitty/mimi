

import React, { useState, useEffect } from 'react';
import { ZineMetadata, Echo, ToneTag } from '../types';
import { fetchEchoes, addEcho, uploadBlob, addToPocket } from '../services/firebase';
import { useRecorder } from '../hooks/useRecorder';
import { Bookmark, Check, Loader2, BookmarkCheck } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ZineCardProps {
  zine: ZineMetadata;
  onClick: () => void;
  currentUserId: string | undefined;
  featured?: boolean;
  isSavedItem?: boolean;
}

const TONE_STYLES: Record<ToneTag, { 
  wrapper: string, 
  border: string, 
  text: string, 
  accent: string,
  aspect: string,
  pattern?: React.ReactNode 
}> = {
  'Corporate': { wrapper: 'bg-slate-100', border: 'border-slate-300', text: 'text-slate-800', accent: 'text-slate-500', aspect: 'aspect-[16/9]' },
  'Chic': { wrapper: 'bg-[#FDF6F6]', border: 'border-[#E7E5E4]', text: 'text-[#1C1917]', accent: 'text-[#A8A29E]', aspect: 'aspect-[3/4]' },
  'Unhinged': { 
    wrapper: 'bg-[#0F0F0F]', 
    border: 'border-green-500', 
    text: 'text-white', 
    accent: 'text-green-500',
    aspect: 'aspect-square',
    pattern: <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/noise.png')] mix-blend-overlay" />
  },
  'Romantic': { wrapper: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-900', accent: 'text-rose-400', aspect: 'aspect-[4/3]' },
  'Cryptic': { wrapper: 'bg-stone-200', border: 'border-stone-400', text: 'text-stone-800', accent: 'text-stone-500', aspect: 'aspect-[2/3]' },
  '2014-Tumblr': { wrapper: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-900', accent: 'text-violet-400', aspect: 'aspect-square' },
  'Academic': { wrapper: 'bg-[#F5F2EB]', border: 'border-[#D6D3D1]', text: 'text-[#3E3B32]', accent: 'text-[#8C8883]', aspect: 'aspect-[3/2]' },
};

const EchoOrb: React.FC<{ echo: Echo, accentColor?: string }> = ({ echo, accentColor }) => {
  const [audio] = useState(new Audio(echo.audioUrl));
  const [playing, setPlaying] = useState(false);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playing) {
      audio.pause();
      audio.currentTime = 0;
    } else {
      audio.play();
    }
    setPlaying(!playing);
  };

  useEffect(() => {
    audio.onended = () => setPlaying(false);
    return () => { audio.pause(); };
  }, [audio]);

  return (
    <div 
      onClick={toggle}
      className={`
        w-6 h-6 rounded-full border border-current flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-125 hover:z-10
        ${playing ? 'animate-pulse scale-110' : 'hover:opacity-80'}
      `}
      style={{ color: accentColor || 'currentColor', backgroundColor: playing ? 'currentColor' : 'transparent' }}
      title={`Echo by ${echo.userHandle}`}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${playing ? 'bg-white' : 'bg-current'}`} />
    </div>
  );
};

export const ZineCard: React.FC<ZineCardProps> = ({ zine, onClick, currentUserId, featured, isSavedItem }) => {
  const [echoes, setEchoes] = useState<Echo[]>([]);
  const [isEchoing, setIsEchoing] = useState(false);
  const { isRecording, startRecording, stopRecording, audioBlob, resetRecording } = useRecorder();
  
  // Pocket State
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(isSavedItem || false);

  const styles = TONE_STYLES[zine.tone] || TONE_STYLES['Chic'];

  useEffect(() => {
    if (zine.id && zine.id !== 'pending') {
        fetchEchoes(zine.id).then(setEchoes);
    }
  }, [zine.id]);

  const handleRecordClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId) return;
    
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  const handleSaveToPocket = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId || isSaving || isSaved) return;

    setIsSaving(true);
    try {
        await addToPocket(currentUserId, 'zine_card', {
            zineId: zine.id,
            zineTitle: zine.title,
            zineArchetype: zine.content?.archetype_identity || null,
            zineTone: zine.tone || null,
            userHandle: zine.userHandle,
            userAvatar: zine.userAvatar
        });
        setIsSaved(true);
    } catch (err) {
        console.error(err);
    } finally {
        setIsSaving(false);
    }
  };

  useEffect(() => {
    const saveEcho = async () => {
      if (audioBlob && currentUserId) {
        setIsEchoing(true);
        const url = await uploadBlob(audioBlob, `echoes/${zine.id}/${Date.now()}.webm`);
        const newEcho: Omit<Echo, 'id'> = {
          userId: currentUserId,
          userHandle: 'You', 
          audioUrl: url,
          timestamp: Date.now(),
          duration: 0 
        };
        await addEcho(zine.id, newEcho);
        setEchoes(prev => [...prev, { ...newEcho, id: 'temp' } as Echo]);
        resetRecording();
        setIsEchoing(false);
      }
    };
    saveEcho();
  }, [audioBlob, currentUserId, zine.id, resetRecording]);

  return (
    <div 
      onClick={onClick}
      className={`group relative flex-shrink-0 cursor-pointer transition-transform hover:-translate-y-2 duration-500 ${featured ? 'w-[320px] md:w-[400px]' : 'w-[280px] md:w-[340px]'}`}
    >
      {/* Dynamic Tone Styling with Dynamic Aspect Ratio */}
      <div className={`w-full ${styles.aspect} ${styles.wrapper} ${styles.border} border shadow-sm overflow-hidden flex flex-col p-6 relative transition-colors duration-500`}>
        
        {styles.pattern}

        {featured && (
          <div className="absolute top-0 right-0 p-3 z-30">
             <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
          </div>
        )}

        {/* HEADER: User Info (Left) + Metadata (Right) */}
        <div className="flex justify-between items-start z-20 mb-6">
            <div className="flex items-center gap-2">
              <img 
                src={zine.userAvatar || `https://ui-avatars.com/api/?name=${zine.userHandle}`} 
                alt={zine.userHandle}
                className={`w-6 h-6 rounded-full border ${styles.border}`}
              />
              <span className={`font-sans text-[8px] uppercase tracking-widest ${styles.accent} opacity-80 truncate max-w-[80px]`}>
                {zine.userHandle}
              </span>
            </div>
            
            <div className="flex flex-col items-end">
               <span className={`font-sans text-[7px] uppercase tracking-[0.2em] ${styles.accent} opacity-50`}>
                 {new Date(zine.timestamp).toLocaleDateString()}
               </span>
               <span className={`font-sans text-[7px] uppercase tracking-[0.2em] ${styles.accent} border border-current px-2 py-0.5 rounded-full mt-1 opacity-60`}>
                 {zine.tone || 'Archive'}
               </span>
            </div>
        </div>

        {/* BODY: Title & Archetype */}
        <div className="flex-1 flex flex-col justify-center z-10 pointer-events-none mb-4">
           <h3 className={`${featured ? 'text-4xl' : 'text-3xl'} font-serif italic leading-tight group-hover:opacity-70 transition-opacity ${styles.text}`}>
              {zine.title}
            </h3>
            <p className={`mt-4 font-sans text-[9px] uppercase tracking-widest ${styles.accent} opacity-70`}>
              {zine.content?.archetype_identity}
            </p>
        </div>

        {/* FOOTER: Actions */}
        <div className={`absolute bottom-6 left-6 right-6 pt-4 border-t ${styles.border} border-opacity-30 flex items-center justify-between z-20`}>
            {/* Echoes List */}
            <div className="flex -space-x-2">
                 {echoes.slice(0, 3).map(echo => (
                   <div key={echo.id} className="relative z-0 hover:z-10 transition-all">
                      <EchoOrb echo={echo} accentColor={styles.text === 'text-white' ? '#fff' : undefined} />
                   </div>
                 ))}
                 {echoes.length === 0 && <span className={`text-[8px] uppercase tracking-widest ${styles.accent} opacity-40`}>No Echoes</span>}
            </div>
            
            <div className="flex items-center gap-3">
               {/* Record Echo */}
               {currentUserId && !isSavedItem && (
                 <button 
                   onClick={handleRecordClick}
                   className={`w-6 h-6 rounded-full border border-current flex items-center justify-center transition-colors ${styles.accent} hover:opacity-100 opacity-60 ${isRecording ? 'bg-red-500 border-red-500 text-white animate-pulse opacity-100' : ''}`}
                 >
                   {isEchoing ? (
                     <div className="w-2 h-2 border border-current rounded-full animate-spin border-t-transparent" />
                   ) : (
                     <div className={`w-2 h-2 rounded-sm bg-current`} />
                   )}
                 </button>
               )}

               {/* Pocket Save */}
               {currentUserId && !isSavedItem && (
                  <button 
                   onClick={handleSaveToPocket}
                   disabled={isSaved || isSaving}
                   className={`w-6 h-6 rounded-full border border-current flex items-center justify-center transition-colors ${styles.accent} hover:opacity-100 opacity-60 disabled:opacity-30`}
                  >
                     {isSaving ? (
                         <Loader2 className="w-3 h-3 animate-spin" />
                     ) : isSaved ? (
                         <BookmarkCheck className="w-3 h-3" />
                     ) : (
                         <Bookmark className="w-3 h-3" />
                     )}
                  </button>
               )}
            </div>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-overlay pointer-events-none" />
      </div>
    </div>
  );
};