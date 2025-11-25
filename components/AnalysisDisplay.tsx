
import React, { useState, useRef, useEffect } from 'react';
import { ZineContent, ZinePage, ZineMetadata, Echo, ZineAnalysis, ToneTag, AspectRatio } from '../types';
import { generateAudio, playAudio, createDebriefChat, getAspectRatioForTone, generateZineImage } from '../services/geminiService';
import { Chat } from "@google/genai";
import { fetchEchoes, addEcho, uploadBlob, addToPocket, deleteZine, deleteEcho, updateZine, uploadBase64Image } from '../services/firebase';
import { useRecorder } from '../hooks/useRecorder';
import { useUser } from '../contexts/UserContext';
import { Visualizer } from './Visualizer';
import { Mic, Download, Loader2, Play, Pause, MessageCircle, Bookmark, Check, Trash2, Sparkles, Send, Grid, Layers, AlertTriangle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface AnalysisDisplayProps {
  metadata: ZineMetadata;
  onReset: () => void;
}

// --- Cinematic Audio Effects ---
const playCinematicReveal = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    
    // Create noise buffer for "paper/whoosh" texture
    const bufferSize = ctx.sampleRate * 2.0;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    // Filter sweep to simulate movement
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 1.5);
    
    // Envelope for soft attack and release
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.1); // Attack
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2); // Decay
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    noise.start();
  } catch (e) {
    console.warn("Audio effect prevented by browser policy", e);
  }
};

// --- Source Analysis Panel (The "Below" Band) ---
const SourceAnalysisPanel: React.FC<{ analysis?: ZineAnalysis, userId?: string }> = ({ analysis, userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // If no analysis exists (legacy zine), do not render the panel
  if (!analysis) return null;

  const handleSavePalette = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId || isSaving || isSaved) return;

    setIsSaving(true);
    try {
        await addToPocket(userId, 'palette', {
           colors: analysis.visualPalette,
           colorTheory: analysis.colorTheory,
           emotions: analysis.emotionalPalette,
           metaphor: analysis.centralMetaphor
        });
        setIsSaved(true);
    } catch (e) {
        console.error("Failed to save palette", e);
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-4 border-t border-stone-100 pt-4">
      <div className="flex justify-between items-center">
        <button 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 font-sans text-[9px] uppercase tracking-widest text-nous-subtle hover:text-nous-text transition-colors"
        >
            <span>{isOpen ? 'Hide Analysis' : 'View Source Reading'}</span>
            <span className="text-xs">{isOpen ? '−' : '+'}</span>
        </button>

        {isOpen && userId && (
             <button 
                onClick={handleSavePalette}
                disabled={isSaved || isSaving}
                className="flex items-center gap-2 font-sans text-[9px] uppercase tracking-widest text-nous-text hover:text-emerald-600 transition-colors disabled:opacity-50"
             >
                {isSaving ? <Loader2 size={10} className="animate-spin" /> : isSaved ? <Check size={10} /> : <Bookmark size={10} />}
                {isSaved ? "Reading Saved" : "Save Reading"}
             </button>
        )}
      </div>

      {isOpen && (
        <div className="mt-4 grid grid-cols-2 gap-6 animate-fade-in bg-stone-50 p-6 rounded-sm">
          <div>
            <div className="flex justify-between items-baseline mb-2">
                <h4 className="font-sans text-[8px] uppercase tracking-[0.2em] text-stone-400">Visual Palette</h4>
                {analysis.colorTheory && (
                    <span className="font-sans text-[8px] uppercase tracking-widest text-nous-text">{analysis.colorTheory}</span>
                )}
            </div>
            <div className="flex flex-wrap gap-3">
              {analysis.visualPalette?.map((color, i) => (
                <div key={i} className="group relative">
                  <div 
                    className="w-8 h-8 rounded-full border border-stone-200 shadow-sm cursor-help transition-transform hover:scale-110"
                    style={{ backgroundColor: color }}
                  />
                  {/* Tooltip now shows the Hex code */}
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black/80 text-white text-[9px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-mono">
                    {color}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-sans text-[8px] uppercase tracking-[0.2em] text-stone-400 mb-2">Emotional Tones</h4>
             <div className="flex flex-wrap gap-2">
              {analysis.emotionalPalette?.map((c, i) => (
                <span key={i} className="font-serif text-sm italic text-nous-accent">{c}</span>
              ))}
            </div>
          </div>
          <div className="col-span-2">
            <h4 className="font-sans text-[8px] uppercase tracking-[0.2em] text-stone-400 mb-2">Central Metaphor</h4>
            <p className="font-serif text-lg italic text-nous-text leading-relaxed">"{analysis.centralMetaphor}"</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Custom Media Player Components
const AudioPlayer: React.FC<{ url: string }> = ({ url }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggle = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="w-full border border-stone-200 p-4 flex items-center gap-4 bg-white/50 backdrop-blur-sm">
      <audio ref={audioRef} src={url} onEnded={() => setIsPlaying(false)} className="hidden" />
      <button onClick={toggle} className="w-8 h-8 flex items-center justify-center border border-stone-300 rounded-full hover:bg-stone-100 transition-colors">
        {isPlaying ? (
          <Pause className="w-3 h-3 text-nous-text" />
        ) : (
          <Play className="w-3 h-3 text-nous-text ml-0.5" />
        )}
      </button>
      <div className="flex-1 h-px bg-stone-200 relative">
        {isPlaying && <div className="absolute inset-0 bg-nous-text animate-[pulse_2s_infinite]" />}
      </div>
      <span className="text-[9px] uppercase tracking-widest text-nous-subtle">Voice Note</span>
    </div>
  );
};

const VideoLooper: React.FC<{ url: string }> = ({ url }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  return (
      <video 
        ref={videoRef}
        src={url} 
        autoPlay 
        loop
        muted 
        playsInline 
        className="w-full h-full object-cover grayscale contrast-125 brightness-90"
        // Removed crossOrigin="anonymous" to fix broken icons if server doesn't support it for basic display
      />
  );
};

// Error-Handling Image Component
const SafeImage: React.FC<{ src: string, alt: string, className?: string }> = ({ src, alt, className }) => {
    const [hasError, setHasError] = useState(false);
    
    if (hasError) {
        return (
            <div className={`flex items-center justify-center bg-stone-100 text-stone-300 ${className}`}>
                 <AlertTriangle size={16} />
            </div>
        )
    }

    return (
        <img 
            src={src} 
            alt={alt} 
            className={className} 
            onError={() => setHasError(true)}
            // Important: We do NOT use crossOrigin="anonymous" here for standard display
            // This prevents broken image icons if the Firebase bucket isn't configured for strict CORS.
        />
    )
}

interface PageRendererProps {
  page: ZinePage;
  analysis?: ZineAnalysis;
  tone: ToneTag;
  userId?: string;
  index: number;
  zineTitle?: string;
  zineId?: string;
}

const PageRenderer: React.FC<PageRendererProps> = ({ page, analysis, tone, userId, index, zineTitle, zineId }) => {
  // Alternate aspect ratios based on index for mixed editorial feel
  // Even index (excluding cover) = Landscape (16:9)
  // Odd index = Portrait (9:16)
  const isLandscape = index % 2 === 0;
  const layoutRatio: AspectRatio = isLandscape ? '16:9' : '9:16';
  
  // State for cover regeneration
  const [coverUrl, setCoverUrl] = useState<string | null>(page.originalMediaUrl || null);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);

  // Determine Media Content
  let mediaContent = null;
  if (page.originalMediaUrl && page.mediaType === 'video') {
    mediaContent = <VideoLooper url={page.originalMediaUrl} />;
  } else if (page.originalMediaUrl && page.mediaType === 'audio') {
    mediaContent = (
      <div className="w-full h-full flex flex-col justify-center bg-stone-50 p-6">
         <div className="w-full aspect-[4/3] flex items-center justify-center mb-4 border border-stone-200 bg-white">
            <div className="text-center">
              <Mic className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <span className="font-sans text-[8px] uppercase tracking-widest text-stone-400">Audio Artifact</span>
            </div>
         </div>
         <AudioPlayer url={page.originalMediaUrl} />
      </div>
    );
  } else {
    // If no user media, use the AI Visualizer.
    const refImage = (page.originalMediaUrl && page.mediaType === 'image') ? page.originalMediaUrl : undefined;

    mediaContent = (
        <Visualizer 
            prompt={page.imagePrompt} 
            className={`w-full py-4`} 
            defaultAspectRatio={layoutRatio} 
            referenceImageUrl={refImage}
        />
    );
  }

  // Handle Cover Generation
  const handleGenerateCover = async () => {
    if (isGeneratingCover) return;
    setIsGeneratingCover(true);
    try {
        const prompt = `Abstract, typographic, cinematic cover art for a zine titled "${zineTitle}". Metaphor: ${analysis?.centralMetaphor}. Minimalist editorial style.`;
        const base64 = await generateZineImage(prompt, '3:4', '1K');
        setCoverUrl(base64);
        
        // Persist to Firebase if zineId exists
        if (zineId && zineId !== 'pending' && userId) {
             try {
                 const path = `covers/${zineId}/${Date.now()}.png`;
                 const url = await uploadBase64Image(base64, path);
                 await updateZine(zineId, { coverImageUrl: url });
             } catch (err) {
                 console.error("Failed to persist cover", err);
             }
        }
    } catch (e) {
        console.error("Failed to generate cover", e);
    } finally {
        setIsGeneratingCover(false);
    }
  };

  // --- COLLAGE (EVIDENCE TABLE) ---
  if (page.layoutType === 'collage') {
      const artifacts = page.artifacts || (page.originalMediaUrl ? [{url: page.originalMediaUrl, type: page.mediaType || 'image'}] : []);
      
      return (
        <div className="w-full mb-24 px-4">
             <div className="flex items-center gap-4 mb-8 justify-center">
                 <div className="h-px w-12 bg-stone-300" />
                 <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-nous-subtle">
                     {page.headline || "Evidence Table"}
                 </span>
                 <div className="h-px w-12 bg-stone-300" />
             </div>

             <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
                 {artifacts.map((art, i) => (
                     <div key={i} className="break-inside-avoid bg-white p-2 shadow-sm border border-stone-100 transform hover:rotate-1 transition-transform duration-300">
                         {art.type === 'video' ? <VideoLooper url={art.url} /> :
                          art.type === 'audio' ? <div className="p-4 bg-stone-50"><AudioPlayer url={art.url}/></div> :
                          <SafeImage src={art.url} alt="Artifact" className="w-full h-auto grayscale hover:grayscale-0 transition-all duration-700" />
                         }
                         {art.caption && <p className="mt-2 font-mono text-[9px] text-stone-400">{art.caption}</p>}
                     </div>
                 ))}
             </div>
             
             {page.bodyCopy && (
                 <p className="mt-8 text-center font-serif italic text-stone-500 max-w-lg mx-auto">
                     {page.bodyCopy}
                 </p>
             )}
        </div>
      );
  }

  // --- SOURCE ARTIFACT (RAW SIGNAL) ---
  if (page.layoutType === 'source-artifact') {
    return (
      <div className="w-full mb-24 flex flex-col items-center justify-center border-l-2 border-nous-text pl-8 py-12 bg-stone-50/50 opacity-0 animate-slide-up">
        <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-nous-subtle mb-8 block w-full">
           Raw Signal // {page.headline || "The Spark"}
        </span>
        
        {page.originalMediaUrl ? (
           <div className="w-full max-w-lg shadow-lg bg-white p-2 border border-stone-200 transform rotate-1">
              {page.mediaType === 'video' ? <VideoLooper url={page.originalMediaUrl} /> : 
               page.mediaType === 'audio' ? (
                  <div className="p-8 border border-stone-100">
                    <p className="font-serif italic text-stone-400 mb-6 text-center">"Voice Note recorded at origin."</p>
                    <AudioPlayer url={page.originalMediaUrl} />
                  </div>
               ) :
               <SafeImage src={page.originalMediaUrl} className="w-full object-cover grayscale contrast-110" alt="Source" />
              }
           </div>
        ) : (
          <p className="font-mono text-lg md:text-xl text-nous-text leading-relaxed whitespace-pre-wrap max-w-2xl">
             "{page.bodyCopy}"
          </p>
        )}
        
        <p className="mt-8 font-serif italic text-stone-400 text-sm">
           {page.subhead || "Archived from input stream."}
        </p>
      </div>
    );
  }

  // THREE-BAND STRUCTURE FOR VISUAL PAGES
  if (page.layoutType === 'full-bleed-image' || page.layoutType === 'text-spread') {
     // Process body copy for staggered animations
     const copyLines = page.bodyCopy ? page.bodyCopy.split('\n').filter(line => line.trim() !== '') : [];

     return (
       <div className="w-full mb-24">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
           
           {/* BAND 1: LEFT (Concept) */}
           <div className={`order-2 md:order-1 flex flex-col justify-center h-full py-8 ${isLandscape ? 'md:pr-12' : ''}`}>
              {page.headline && (
                <h2 className="font-serif text-3xl italic text-nous-text mb-6 opacity-0 animate-slide-up" style={{ animationDelay: '200ms' }}>
                  {page.headline}
                </h2>
              )}
              
              {copyLines.length > 0 && (
                <div className="font-serif text-lg leading-loose text-nous-accent/90">
                  {copyLines.map((line, i) => (
                    <p 
                      key={i} 
                      className="opacity-0 animate-slide-up mb-4 last:mb-0" 
                      style={{ animationDelay: `${400 + (i * 150)}ms` }}
                    >
                      {line}
                    </p>
                  ))}
                </div>
              )}

              {page.subhead && (
                <p className="mt-4 font-sans text-xs uppercase tracking-widest text-stone-400 opacity-0 animate-slide-up" style={{ animationDelay: `${600 + (copyLines.length * 100)}ms` }}>
                  {page.subhead}
                </p>
              )}
           </div>

           {/* BAND 2: RIGHT (Vision) */}
           <div className="order-1 md:order-2 opacity-0 animate-fade-in flex flex-col items-center" style={{ animationDelay: '300ms' }}>
             {mediaContent}
             {page.audioNotes && (
               <p className="mt-2 font-sans text-[9px] text-nous-subtle text-right w-full max-w-md">Sound: {page.audioNotes}</p>
             )}
           </div>
         </div>

         {/* BAND 3: BOTTOM (Analysis) */}
         <div className="opacity-0 animate-fade-in" style={{ animationDelay: '800ms' }}>
            <SourceAnalysisPanel analysis={analysis} userId={userId} />
         </div>
       </div>
     );
  }

  switch (page.layoutType) {
    case 'cover':
      return (
        <div className={`w-full aspect-[3/4] md:aspect-[4/3] flex flex-col items-center justify-center border border-stone-200 bg-white p-12 mb-16 shadow-lg relative overflow-hidden group transition-all duration-700`}>
          {coverUrl && (
             <div className="absolute inset-0 z-0">
               {page.mediaType === 'video' ? (
                 <video src={coverUrl} autoPlay loop muted className="w-full h-full object-cover opacity-30 grayscale contrast-125" />
               ) : (
                 <SafeImage src={coverUrl} alt="Cover" className="w-full h-full object-cover opacity-30 grayscale contrast-125 scale-105 group-hover:scale-100 transition-transform duration-[2s]" />
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/50 to-white/20 backdrop-blur-[1px]" />
             </div>
          )}
          
          <div className="z-10 flex flex-col items-center relative mix-blend-multiply text-center max-w-3xl">
            <span className="font-sans text-[9px] tracking-[0.4em] uppercase text-nous-subtle mb-8 opacity-0 animate-slide-up" style={{ animationDelay: '200ms' }}>
              Issue No. 1
            </span>
            <h1 className="font-serif text-6xl md:text-8xl italic text-nous-text mb-8 leading-[0.85] tracking-tight opacity-0 animate-slide-up drop-shadow-sm" style={{ animationDelay: '400ms' }}>
              {page.headline}
            </h1>
            {page.subhead && (
              <p className="font-sans text-xs md:text-sm tracking-[0.2em] uppercase text-nous-accent mt-4 border-t border-nous-accent/30 pt-4 opacity-0 animate-slide-up" style={{ animationDelay: '600ms' }}>
                {page.subhead}
              </p>
            )}
          </div>

          {/* Generate Cover Button */}
          {userId && (
            <div className="absolute bottom-6 right-6 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={handleGenerateCover}
                    disabled={isGeneratingCover}
                    className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md border border-stone-200 rounded-sm hover:border-nous-text transition-colors shadow-sm font-sans text-[9px] uppercase tracking-widest text-nous-text"
                >
                    {isGeneratingCover ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    {coverUrl ? 'Regenerate Cover' : 'Generate Cover'}
                </button>
            </div>
          )}
        </div>
      );

    case 'minimal-quote':
      return (
        <div className="w-full min-h-[60vh] flex flex-col items-center justify-center px-8 py-16 mb-16 border-y border-transparent hover:border-stone-100 transition-colors">
          <p className="font-serif text-3xl md:text-5xl leading-relaxed text-center text-nous-text max-w-3xl opacity-0 animate-slide-up" style={{ animationDelay: '200ms' }}>
            "{page.headline}"
          </p>
          {page.originalMediaUrl && page.mediaType === 'audio' && (
             <div className="mt-8 w-full max-w-xs animate-fade-in" style={{ animationDelay: '300ms' }}>
               <AudioPlayer url={page.originalMediaUrl} />
             </div>
          )}
          {page.bodyCopy && (
            <p className="mt-8 font-sans text-xs tracking-widest text-nous-subtle max-w-md text-center leading-loose opacity-0 animate-slide-up" style={{ animationDelay: '400ms' }}>
              {page.bodyCopy}
            </p>
          )}
        </div>
      );

    case 'credits':
      return (
        <div className="w-full flex flex-col items-center justify-center py-24 mb-16 text-center animate-fade-in" style={{ animationDelay: '200ms' }}>
            <h3 className="font-serif text-2xl italic text-nous-text mb-4">{page.headline}</h3>
            <p className="font-sans text-[10px] uppercase tracking-widest text-nous-subtle">{page.bodyCopy}</p>
        </div>
      );

    default:
      return null;
  }
};

const EchoList: React.FC<{ zineId: string, zineOwnerId: string }> = ({ zineId, zineOwnerId }) => {
  const [echoes, setEchoes] = useState<Echo[]>([]);
  const [footnoteInput, setFootnoteInput] = useState('');
  const [isSubmittingFootnote, setIsSubmittingFootnote] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    if (zineId !== 'pending') {
      fetchEchoes(zineId).then(setEchoes);
    }
  }, [zineId]);

  const handleAddFootnote = async () => {
    if (!footnoteInput.trim() || !user || zineId === 'pending') return;
    setIsSubmittingFootnote(true);
    try {
        const newEcho: Omit<Echo, 'id'> = {
            userId: user.uid,
            userHandle: user.displayName || user.email?.split('@')[0] || 'User',
            type: 'text',
            text: footnoteInput,
            timestamp: Date.now()
        };
        const id = await addEcho(zineId, newEcho);
        setEchoes(prev => [...prev, { ...newEcho, id } as Echo]);
        setFootnoteInput('');
    } catch (e) {
        console.error("Failed to add footnote", e);
    } finally {
        setIsSubmittingFootnote(false);
    }
  };

  const handleDeleteEcho = async (echoId: string) => {
      try {
          await deleteEcho(zineId, echoId);
          setEchoes(prev => prev.filter(e => e.id !== echoId));
      } catch (e) {
          console.error("Failed to delete echo", e);
      }
  };

  return (
    <div className="w-full mt-12 mb-24 border-t border-stone-200 pt-12 animate-fade-in">
       <div className="flex items-center gap-3 mb-8 justify-center">
         <MessageCircle className="w-4 h-4 text-nous-subtle" />
         <h3 className="font-sans text-[10px] uppercase tracking-[0.2em] text-nous-subtle">Clique Echoes & Footnotes</h3>
       </div>

       {/* List of Echoes/Footnotes */}
       <div className="flex flex-col gap-4 max-w-md mx-auto mb-8">
         {echoes.length === 0 && (
             <p className="text-center font-sans text-[9px] uppercase tracking-widest text-stone-300">No echoes yet.</p>
         )}
         {echoes.map((echo) => (
           <div key={echo.id} className="group relative flex items-start gap-4 bg-white p-4 border border-stone-100 rounded-sm">
              <div className="flex-shrink-0">
                 <div className="w-6 h-6 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-[10px] text-stone-500 font-sans uppercase">
                    {echo.userHandle.slice(0,1)}
                 </div>
              </div>
              <div className="flex-1">
                 {echo.type === 'text' || echo.text ? (
                     <p className="font-serif text-sm text-nous-text mt-0.5">{echo.text}</p>
                 ) : (
                     <AudioPlayer url={echo.audioUrl || ''} />
                 )}
                 <div className="mt-2 flex gap-2 items-center">
                    <span className="font-sans text-[7px] uppercase tracking-widest text-stone-400">{echo.userHandle}</span>
                    <span className="text-[7px] text-stone-300 font-sans">• {new Date(echo.timestamp).toLocaleDateString()}</span>
                 </div>
              </div>
              
              {/* Delete Button (If Zine Owner) */}
              {user && user.uid === zineOwnerId && (
                  <button 
                    onClick={() => handleDeleteEcho(echo.id)}
                    className="absolute top-2 right-2 p-1 bg-white border border-stone-100 rounded-full text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    title="Delete Echo"
                  >
                      <Trash2 size={10} />
                  </button>
              )}
           </div>
         ))}
       </div>

       {/* Add Footnote Input */}
       {user && zineId !== 'pending' && (
           <div className="max-w-md mx-auto flex gap-2">
               <input 
                  value={footnoteInput}
                  onChange={(e) => setFootnoteInput(e.target.value)}
                  placeholder="Leave a footnote..."
                  className="flex-1 bg-stone-50 border border-stone-200 p-3 font-serif text-sm focus:outline-none focus:border-nous-text rounded-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddFootnote()}
               />
               <button 
                 onClick={handleAddFootnote}
                 disabled={!footnoteInput.trim() || isSubmittingFootnote}
                 className="px-4 bg-white border border-stone-200 hover:border-nous-text text-nous-text rounded-sm disabled:opacity-50"
               >
                  {isSubmittingFootnote ? <Loader2 size={14} className="animate-spin"/> : <Send size={14} />}
               </button>
           </div>
       )}
    </div>
  );
};

const FloatingNousMic: React.FC<{ zineId: string }> = ({ zineId }) => {
  const { user } = useUser();
  const { isRecording, startRecording, stopRecording, audioBlob, resetRecording } = useRecorder();
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const saveEcho = async () => {
      if (audioBlob && user && zineId && zineId !== 'pending') {
        setIsUploading(true);
        try {
          const url = await uploadBlob(audioBlob, `echoes/${zineId}/${Date.now()}.webm`);
          const newEcho: Omit<Echo, 'id'> = {
            userId: user.uid,
            userHandle: user.displayName || 'Guest',
            type: 'audio',
            audioUrl: url,
            timestamp: Date.now(),
            duration: 0 
          };
          await addEcho(zineId, newEcho);
          resetRecording();
        } catch (e) {
          console.error("Failed to save echo", e);
        } finally {
          setIsUploading(false);
        }
      }
    };
    saveEcho();
  }, [audioBlob, user, zineId, resetRecording]);

  if (!user || zineId === 'pending') return null;

  return (
    <button
      onClick={isRecording ? stopRecording : startRecording}
      disabled={isUploading}
      className={`
        fixed bottom-24 right-6 md:bottom-12 md:right-12 z-50
        w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300
        ${isRecording ? 'bg-red-500 scale-110' : 'bg-nous-text hover:scale-105'}
        ${isUploading ? 'opacity-70 cursor-wait' : 'cursor-pointer'}
      `}
      title="Think for us (Record Echo)"
    >
      {isUploading ? (
         <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : isRecording ? (
         <div className="w-4 h-4 bg-white rounded-sm animate-pulse" />
      ) : (
         <Mic className="text-nous-base w-6 h-6" strokeWidth={1.5} />
      )}
    </button>
  );
};

const DebriefChat: React.FC<{ context: ZineContent, onClose: () => void }> = ({ context, onClose }) => {
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  
  useEffect(() => {
      chatRef.current = createDebriefChat(context);
      setMessages([{ role: 'model', text: `I've finished curating "${context.title}". How does it feel to see it laid out like this?` }]);
  }, [context]);
  
  const handleSend = async () => {
    if (!input.trim() || isLoading || !chatRef.current) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const result = await chatRef.current.sendMessage({ message: userMsg });
      setMessages(prev => [...prev, { role: 'model', text: result.text || "..." }]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
      <div className="bg-nous-base w-full max-w-md h-[80vh] md:h-[600px] shadow-2xl flex flex-col animate-slide-up border border-stone-200">
        <div className="p-4 border-b border-stone-200 flex justify-between items-center bg-white">
          <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-nous-text">Debrief with Mimi</span>
          <button onClick={onClose} className="text-stone-400 hover:text-nous-text">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 ${m.role === 'user' ? 'bg-stone-100 text-nous-text' : 'bg-transparent border border-stone-200 text-nous-accent'}`}>
                <p className="font-serif text-sm leading-relaxed">{m.text}</p>
              </div>
            </div>
          ))}
          {isLoading && <div className="text-center text-[10px] uppercase animate-pulse text-stone-300">Mimi is thinking...</div>}
        </div>
        <div className="p-4 border-t border-stone-200 bg-white">
          <div className="flex gap-2">
            <input 
              className="flex-1 bg-stone-50 border-none p-3 font-serif text-sm focus:ring-1 focus:ring-stone-300 outline-none"
              placeholder="Type your thought..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} disabled={isLoading} className="px-4 font-sans text-xs uppercase tracking-widest text-nous-text hover:bg-stone-100 transition-colors">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ArtifactsDeck: React.FC<{ pages: ZinePage[] }> = ({ pages }) => {
    // Collect all pages that have an original media URL (inputs)
    const artifacts = pages.filter(p => p.originalMediaUrl || (p.artifacts && p.artifacts.length > 0));
    
    // Flatten if needed (for collage pages)
    const allArtifacts: {url: string, type: string, caption?: string}[] = [];
    artifacts.forEach(p => {
        if (p.artifacts) {
            allArtifacts.push(...p.artifacts);
        } else if (p.originalMediaUrl) {
            allArtifacts.push({
                url: p.originalMediaUrl,
                type: p.mediaType || 'image',
                caption: p.headline || "Source Fragment"
            });
        }
    });

    if (allArtifacts.length === 0) return null;

    return (
        <div className="w-full max-w-2xl mx-auto mb-24 pt-12 border-t border-stone-100">
             <div className="flex items-center gap-3 mb-8">
                 <Grid className="w-4 h-4 text-nous-subtle" />
                 <h3 className="font-sans text-[10px] uppercase tracking-[0.2em] text-nous-subtle">Evidence & Artifacts Table</h3>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                 {allArtifacts.map((art, i) => (
                     <div key={i} className="group relative aspect-square bg-stone-100 overflow-hidden border border-stone-200 cursor-help">
                         {art.type === 'video' ? (
                             <VideoLooper url={art.url} />
                         ) : art.type === 'audio' ? (
                             <div className="w-full h-full flex items-center justify-center bg-stone-900 text-white">
                                 <Mic size={20} />
                             </div>
                         ) : (
                             <SafeImage src={art.url} alt="Artifact" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                         )}
                         
                         {/* WARNING / CAPTION OVERLAY */}
                         <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                             <p className="font-mono text-[9px] uppercase truncate">{art.caption || `Artifact ${i+1}`}</p>
                         </div>
                         
                         {/* CORNER MARKER */}
                         <div className="absolute top-0 right-0 p-1 bg-white/20 backdrop-blur-sm">
                            <span className="font-mono text-[8px] font-bold text-white px-1">{i+1}</span>
                         </div>
                     </div>
                 ))}
             </div>
        </div>
    );
};


export const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ metadata, onReset }) => {
  const { user } = useUser();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [showDebrief, setShowDebrief] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const zineContainerRef = useRef<HTMLDivElement>(null);
  const data = metadata.content;

  // Trigger cinematic reveal sound on mount
  useEffect(() => {
    playCinematicReveal();
  }, []);

  const handlePlayAudio = async () => {
    if (isPlaying || isLoadingAudio) return;
    
    setIsLoadingAudio(true);
    try {
      const buffer = await generateAudio(data.voiceoverScript);
      playAudio(buffer);
      setIsPlaying(true);
      setTimeout(() => setIsPlaying(false), buffer.duration * 1000);
    } catch (e) {
      console.error("Audio failed", e);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const handleDeleteZine = async () => {
      if (confirm("Are you sure you want to delete this issue? This action cannot be undone.")) {
          setIsDeleting(true);
          try {
              if (metadata.id) {
                 await deleteZine(metadata.id);
              }
              onReset();
          } catch (e) {
              console.error("Delete failed", e);
              setIsDeleting(false);
          }
      }
  };

  const handleExportPDF = async () => {
    if (!zineContainerRef.current || isExporting) return;
    setIsExporting(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const container = zineContainerRef.current;
      const originalChildren = Array.from(container.children) as HTMLElement[];
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < originalChildren.length; i++) {
        const element = originalChildren[i];
        
        // PRE-PROCESSING: Convert all remote images to Base64 to bypass CORS during html2canvas
        // We do this by iterating the live DOM element before capture
        const images = element.getElementsByTagName('img');
        const originalSrcs = new Map<HTMLImageElement, string>();

        for (let j = 0; j < images.length; j++) {
            const img = images[j];
            const src = img.src;
            // Skip if already data URI
            if (src.startsWith('data:')) continue;

            try {
                // Store original to revert later
                originalSrcs.set(img, src);
                
                // Fetch as blob to get around strict cross-origin checks on simple img tags
                const response = await fetch(src);
                const blob = await response.blob();
                const reader = new FileReader();
                await new Promise((resolve) => {
                    reader.onloadend = () => {
                        img.src = reader.result as string;
                        resolve(null);
                    };
                    reader.readAsDataURL(blob);
                });
            } catch (err) {
                console.warn("Failed to inline image for PDF", src, err);
            }
        }

        const canvas = await html2canvas(element, {
          scale: 2, 
          useCORS: true,
          backgroundColor: '#FDFBF7', 
          logging: false
        });

        // REVERT IMAGES
        originalSrcs.forEach((src, img) => {
            img.src = src;
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgProps = pdf.getImageProperties(imgData);
        
        const renderWidth = pageWidth;
        const renderHeight = (imgProps.height * pageWidth) / imgProps.width;

        if (i > 0) pdf.addPage();
        
        const yOffset = renderHeight < pageHeight ? (pageHeight - renderHeight) / 2 : 0;
        
        pdf.addImage(imgData, 'JPEG', 0, yOffset, renderWidth, renderHeight);
      }

      pdf.save(`${metadata.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_mimi_zine.pdf`);
    } catch (e) {
      console.error("PDF generation failed", e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-12 md:py-24 px-6 animate-fade-in relative">
      
      {/* Controls Header */}
      <div className="flex justify-between items-center mb-16 border-b border-stone-200 pb-6 sticky top-0 md:top-0 bg-nous-base/95 backdrop-blur-sm z-30 pt-4">
        <div>
           <h2 className="font-sans text-[10px] tracking-[0.2em] uppercase text-nous-subtle">
             Curated by Mimi
           </h2>
           <p className="font-serif text-xl italic text-nous-text">{data.title}</p>
        </div>
        
        <button 
          onClick={handlePlayAudio}
          disabled={isLoadingAudio || isPlaying}
          className="group inline-flex items-center gap-3 px-5 py-2 border border-stone-200 rounded-full hover:border-nous-text transition-all duration-300 disabled:opacity-50 bg-white"
        >
          <span className="relative flex h-2 w-2">
             {(isPlaying || isLoadingAudio) && (
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-stone-400 opacity-75"></span>
             )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isPlaying ? 'bg-red-500' : 'bg-stone-800'}`}></span>
          </span>
          <span className="font-sans text-[9px] tracking-[0.2em] uppercase">
            {isLoadingAudio ? 'Loading Audio...' : isPlaying ? 'Playing Narration' : 'Play Narration'}
          </span>
        </button>
      </div>
      
      {/* Cultural Context Chip */}
      {data.culturalContext && (
        <div className="mb-12 p-6 bg-blue-50/50 border border-blue-100 text-center max-w-2xl mx-auto">
          <p className="font-sans text-[9px] uppercase tracking-widest text-blue-400 mb-2">Zeitgeist Connection</p>
          <p className="font-serif text-lg italic text-nous-accent">{data.culturalContext}</p>
        </div>
      )}

      {/* Pages Render Loop */}
      <div className="space-y-24" ref={zineContainerRef}>
        {data.pages.map((page, index) => (
          <div key={index} className="opacity-0 animate-slide-up" style={{ animationDelay: `${index * 150}ms` }}>
            <PageRenderer 
                page={page} 
                analysis={data.analysis} 
                tone={metadata.tone} 
                userId={user?.uid} 
                index={index}
                zineTitle={data.title}
                zineId={metadata.id}
            />
          </div>
        ))}
      </div>

      {/* DEDICATED ARTIFACTS DECK */}
      <div className="opacity-0 animate-fade-in" style={{ animationDelay: '1000ms' }}>
          <ArtifactsDeck pages={data.pages} />
      </div>

      {/* Ambient Direction Footer */}
      <div className="mt-12 pt-12 border-t border-stone-200 text-center opacity-70">
         <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-nous-subtle mb-2">Ambient Direction</p>
         <p className="font-serif italic text-nous-accent">{data.ambientDirection}</p>
      </div>
      
      {/* Echoes List (Comments) */}
      <EchoList zineId={metadata.id} zineOwnerId={metadata.userId} />

      {/* Floating Action Buttons */}
      <FloatingNousMic zineId={metadata.id} />

      <div className="mt-12 flex flex-col items-center gap-6 pb-24">
        <div className="flex gap-4">
             <button
              onClick={() => setShowDebrief(true)}
              className="px-8 py-3 bg-nous-text text-nous-base font-sans text-xs tracking-[0.2em] uppercase hover:bg-nous-accent transition-colors shadow-sm"
            >
              Debrief Issue
            </button>
            
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="px-8 py-3 border border-nous-text text-nous-text font-sans text-xs tracking-[0.2em] uppercase hover:bg-stone-100 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isExporting ? <Loader2 className="w-3 h-3 animate-spin"/> : <Download className="w-3 h-3"/>}
              {isExporting ? "Printing..." : "Export PDF"}
            </button>
        </div>
        
        <div className="flex gap-4 items-center">
            <button
              onClick={onReset}
              className="font-sans text-xs tracking-[0.2em] uppercase text-nous-subtle hover:text-nous-text transition-colors duration-300 pb-1 border-b border-transparent hover:border-nous-text"
            >
              Curate Another Issue
            </button>

            {/* Delete Zine (Only if Owner) */}
            {user && user.uid === metadata.userId && (
                <button
                  onClick={handleDeleteZine}
                  disabled={isDeleting}
                  className="font-sans text-xs tracking-[0.2em] uppercase text-red-300 hover:text-red-500 transition-colors duration-300 pb-1 border-b border-transparent hover:border-red-500 ml-4 flex items-center gap-2"
                >
                  {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  Delete Issue
                </button>
            )}
        </div>
      </div>

      {showDebrief && <DebriefChat context={data} onClose={() => setShowDebrief(false)} />}
    </div>
  );
};
