
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ToneTag } from '../types';
import { useRecorder } from '../hooks/useRecorder';
import { uploadBlob, uploadFile, fetchTrendingArchetypes } from '../services/firebase';
import { useUser } from '../contexts/UserContext';
import { MediaFile, analyzeImage } from '../services/geminiService';
import { saveDraft, getDraft, clearDraft } from '../services/draftStorage';
import { Eye, Loader2, Mic, Image as ImageIcon, Video, Globe, LayoutTemplate, X, Sparkles, Plus, AlertTriangle } from 'lucide-react';

interface InputStudioProps {
  onRefine: (text: string, mediaFiles: MediaFile[], tone: ToneTag, useSearch: boolean, coverImageUrl?: string) => void;
  isThinking: boolean;
}

const TONES: ToneTag[] = ['Corporate', 'Chic', 'Unhinged', 'Romantic', 'Cryptic', '2014-Tumblr', 'Academic'];

// Helper to convert blob/file to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Safe Image Preview Component
const PreviewImage = ({ file, className }: { file: File | Blob, className?: string }) => {
    const [src, setSrc] = useState<string>('');
    const [error, setError] = useState(false);

    useEffect(() => {
        try {
            const url = URL.createObjectURL(file);
            setSrc(url);
            return () => URL.revokeObjectURL(url);
        } catch (e) {
            setError(true);
        }
    }, [file]);

    if (error) {
        return <div className={`flex items-center justify-center bg-stone-100 ${className}`}><AlertTriangle size={12} className="text-stone-300"/></div>
    }

    return <img src={src} alt="Preview" className={className} onError={() => setError(true)} />
}

const InspectModal = ({ file, onClose }: { file: File | Blob, onClose: () => void }) => {
  const [url, setUrl] = useState('');
  
  useEffect(() => {
      try {
        const u = URL.createObjectURL(file);
        setUrl(u);
        return () => URL.revokeObjectURL(u);
      } catch (e) { console.error(e) }
  }, [file]);

  const isVideo = file.type.startsWith('video');
  const isAudio = file.type.startsWith('audio');

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-8 animate-fade-in" onClick={onClose}>
       <div className="max-w-4xl max-h-[90vh] relative" onClick={e => e.stopPropagation()}>
           {isVideo ? (
             <video src={url} controls autoPlay className="max-w-full max-h-[80vh] shadow-2xl border border-stone-800" />
           ) : isAudio ? (
              <div className="bg-white p-12 rounded-full flex flex-col items-center gap-4 animate-pulse shadow-2xl">
                 <Mic size={48} className="text-nous-text" />
                 <audio src={url} controls className="mt-4" />
                 <span className="font-sans text-xs uppercase tracking-widest text-stone-500">Inspecting Audio Trace</span>
              </div>
           ) : (
             <img src={url} alt="Inspect" className="max-w-full max-h-[80vh] shadow-2xl border border-stone-800 object-contain" />
           )}
           <button onClick={onClose} className="absolute -top-12 right-0 text-white hover:text-red-400 uppercase tracking-widest text-xs">Close Inspection</button>
       </div>
    </div>
  )
}

export const InputStudio: React.FC<InputStudioProps> = ({ onRefine, isThinking }) => {
  const { user } = useUser();
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [selectedTone, setSelectedTone] = useState<ToneTag>('Chic');
  const [useSearch, setUseSearch] = useState(false);
  const [inspectFile, setInspectFile] = useState<File | Blob | null>(null);
  
  // Processing States
  const [isProcessing, setIsProcessing] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [trendingArchetypes, setTrendingArchetypes] = useState<string[]>([]);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { isRecording, startRecording, stopRecording, audioBlob, duration, resetRecording, setAudioState } = useRecorder();

  // 1. Restore Draft
  useEffect(() => {
    const load = async () => {
      const draft = await getDraft();
      if (draft) {
        setInput(draft.input);
        setFiles(draft.files || []);
        setSelectedTone(draft.selectedTone);
        setUseSearch(draft.useSearch);
        if (draft.audioBlob) {
          setAudioState(draft.audioBlob, draft.duration);
        }
      }
      setDraftLoaded(true);
    };
    load();
  }, [setAudioState]);

  // Load Trending Archetypes
  useEffect(() => {
    fetchTrendingArchetypes().then(setTrendingArchetypes).catch(console.error);
  }, []);

  // 2. Auto-Save
  useEffect(() => {
    if (!draftLoaded) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    setIsSavingDraft(true);
    autoSaveTimerRef.current = setTimeout(async () => {
      await saveDraft({
        input,
        files,
        audioBlob,
        duration,
        selectedTone,
        useSearch,
        updatedAt: Date.now()
      });
      setIsSavingDraft(false);
    }, 1000);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [input, files, audioBlob, duration, selectedTone, useSearch, draftLoaded]);

  // 3. Submit Handler
  const handleSubmit = useCallback(async () => {
    if (!user) return;
    if ((!input.trim() && files.length === 0 && !audioBlob) || isThinking || isProcessing) return;

    setIsProcessing(true);

    try {
      // 0. Cover Image
      let coverImageUrl: string | undefined = undefined;
      if (coverFile) {
        coverImageUrl = await uploadFile(coverFile, `covers/${user.uid}/${Date.now()}_${coverFile.name}`);
      }

      // 1. Media Files
      const processedMediaFiles: MediaFile[] = await Promise.all(files.map(async (file) => {
        const [base64, url] = await Promise.all([
          blobToBase64(file),
          uploadFile(file, `uploads/${user.uid}/${Date.now()}_${file.name}`)
        ]);
        return {
          type: (file.type.startsWith('image') ? 'image' : 'video') as 'image' | 'video',
          url: url,
          data: base64,
          mimeType: file.type
        };
      }));

      // 2. Audio
      if (audioBlob) {
        const [base64, url] = await Promise.all([
          blobToBase64(audioBlob),
          uploadBlob(audioBlob, `uploads/${user.uid}/${Date.now()}_voice_note.webm`)
        ]);
        processedMediaFiles.push({
          type: 'audio',
          url: url,
          data: base64,
          mimeType: 'audio/webm'
        });
      }

      await clearDraft();
      onRefine(input, processedMediaFiles, selectedTone, useSearch, coverImageUrl);
    } catch (e) {
      console.error("Processing failed", e);
      setIsProcessing(false);
    }
  }, [input, files, audioBlob, coverFile, isThinking, isProcessing, onRefine, selectedTone, useSearch, user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setCoverFile(e.target.files[0]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [input]);

  const isLoading = isThinking || isProcessing;

  const ToolButton = ({ onClick, disabled, icon: Icon, active = false, title, label }: any) => (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        flex flex-col items-center gap-2 group
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'opacity-100'}
      `}
      title={title}
    >
       <div className={`
         w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-300 relative
         ${active 
           ? 'bg-nous-text text-white shadow-lg scale-110' 
           : 'bg-white/80 backdrop-blur-sm border border-stone-200 text-stone-500 hover:text-nous-text hover:border-nous-text hover:shadow-md'}
       `}>
          {active && <span className="absolute inset-0 rounded-full animate-ping opacity-20 bg-current"></span>}
          <Icon size={18} strokeWidth={1.5} />
       </div>
       {label && <span className="text-[7px] uppercase tracking-widest text-nous-subtle font-sans opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">{label}</span>}
    </button>
  );

  return (
    <div className="w-full min-h-screen relative flex flex-col items-center transition-colors duration-700">
      
      {inspectFile && <InspectModal file={inspectFile} onClose={() => setInspectFile(null)} />}

      <div className="flex-1 w-full max-w-6xl mx-auto pt-32 md:pt-64 pb-48 px-6">
        
        {/* --- DESKTOP BENTO GRID --- */}
        <div className="md:grid md:grid-cols-2 md:gap-24 mb-16">

          {/* --- LEFT COLUMN: INPUT --- */}
          <div className="flex flex-col">
            <div className="mb-8 flex items-center gap-3">
              <div className="w-8 h-px bg-nous-accent/30" />
              <p className="font-sans text-[9px] uppercase tracking-[0.2em] text-nous-subtle">
                Stream of Consciousness
              </p>
            </div>
            
            <div className="relative group w-full mb-12">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="It started when..."
                disabled={isLoading}
                className="w-full bg-transparent border-none text-3xl md:text-5xl font-serif text-nous-text placeholder-stone-200 focus:outline-none resize-none transition-colors duration-500 overflow-hidden leading-tight"
                rows={1}
                style={{ minHeight: '120px' }}
              />
            </div>

            <div className="hidden md:flex flex-wrap gap-2">
              {TONES.map(tone => (
                <button
                  key={tone}
                  onClick={() => setSelectedTone(tone)}
                  className={`px-3 py-1 rounded-full text-[9px] uppercase tracking-widest border transition-all ${selectedTone === tone ? 'bg-nous-text text-white border-nous-text' : 'border-stone-200 text-stone-400 hover:border-nous-text'}`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>

          {/* --- RIGHT COLUMN: EVIDENCE TABLE --- */}
          <div className="flex flex-col gap-6">
            <div className="hidden md:flex items-center gap-3 mb-4 opacity-50">
              <div className="w-8 h-px bg-nous-accent/30" />
              <p className="font-sans text-[9px] uppercase tracking-[0.2em] text-nous-subtle">
                Evidence & Artifacts
              </p>
            </div>

            {/* Empty State */}
            {files.length === 0 && !audioBlob && !coverFile && (
              <div className="hidden md:flex flex-col items-center justify-center h-64 border border-dashed border-stone-200 rounded-lg text-stone-300 bg-stone-50/30">
                  <div className="p-4 rounded-full bg-stone-50 mb-4">
                    <Plus className="w-4 h-4 opacity-50" />
                  </div>
                  <span className="font-sans text-[9px] uppercase tracking-widest text-stone-400">Light Table Empty</span>
              </div>
            )}

            {/* Artifact Shelf (Horizontal Scroll) */}
            <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-4 min-h-[160px] items-center">
                
                {/* Cover Card */}
                {coverFile && (
                  <div className="relative group shrink-0 w-32 aspect-[3/4] bg-white p-2 shadow-lg hover:rotate-0 transition-transform duration-500 border border-stone-100 animate-slide-up">
                    <div className="w-full h-full relative overflow-hidden bg-stone-100 cursor-pointer" onClick={() => setInspectFile(coverFile)}>
                      <PreviewImage file={coverFile} className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 bg-black/80 text-white text-[7px] uppercase tracking-widest px-1.5 py-0.5">Cover</div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setCoverFile(null); }} className="absolute -top-2 -right-2 bg-white text-stone-500 rounded-full shadow-sm p-1 hover:text-red-500 border border-stone-100 z-10"><X size={12}/></button>
                  </div>
                )}

                {/* Audio Card */}
                {audioBlob && (
                  <div className="relative group shrink-0 w-32 aspect-square bg-nous-text p-4 shadow-lg hover:rotate-0 transition-transform duration-500 flex flex-col justify-between text-white border border-stone-800 animate-slide-up" style={{ animationDelay: '100ms' }}>
                    <div className="flex justify-between items-start">
                        <Mic size={16} />
                        <button onClick={resetRecording} className="text-white/50 hover:text-white"><X size={14}/></button>
                    </div>
                    <div className="flex gap-1 items-end h-8 cursor-pointer" onClick={() => setInspectFile(audioBlob)}>
                        {[1,2,3,4,5].map(i => <div key={i} className="w-1 bg-white/80 animate-pulse" style={{ height: `${Math.random() * 100}%`}} />)}
                    </div>
                    <span className="font-sans text-[8px] uppercase tracking-widest opacity-80">{Math.round(duration)}s Voice Note</span>
                  </div>
                )}

                {/* Media Files */}
                {files.map((file, i) => (
                  <div key={i} className={`relative group shrink-0 w-32 aspect-square bg-white p-2 shadow-lg transition-transform duration-500 border border-stone-100 animate-slide-up hover:z-10`} style={{ animationDelay: `${150 + (i * 50)}ms` }}>
                    <div className="w-full h-full relative overflow-hidden bg-stone-100 cursor-pointer" onClick={() => setInspectFile(file)}>
                      {file.type.startsWith('image') ? (
                        <PreviewImage file={file} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-stone-900 text-white">
                          <Video size={20} />
                        </div>
                      )}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="absolute -top-2 -right-2 bg-white text-stone-500 rounded-full shadow-sm p-1 hover:text-red-500 border border-stone-100 z-10"><X size={12}/></button>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* --- DESKTOP TOOLBAR --- */}
        <div className="hidden md:flex flex-col items-center justify-center border-t border-stone-100 pt-12">
            
            <div className="flex items-center gap-12 mb-10">
               <ToolButton 
                 onClick={isRecording ? stopRecording : startRecording} 
                 icon={Mic} 
                 active={isRecording} 
                 disabled={!!audioBlob}
                 label="Voice Note"
               />
               <div className="w-px h-12 bg-stone-200" />
               <ToolButton onClick={() => fileInputRef.current?.click()} icon={ImageIcon} label="Visuals" />
               <ToolButton onClick={() => videoInputRef.current?.click()} icon={Video} label="Film" />
               <div className="w-px h-12 bg-stone-200" />
               <ToolButton onClick={() => coverInputRef.current?.click()} icon={LayoutTemplate} active={!!coverFile} label="Cover Art" />
               <ToolButton onClick={() => setUseSearch(!useSearch)} icon={Globe} active={useSearch} label="Search" />
            </div>

            {trendingArchetypes.length > 0 && (
              <div className="flex gap-4 items-center mb-12">
                 <span className="text-nous-subtle font-sans text-[9px] uppercase tracking-widest">Spark with:</span>
                 {trendingArchetypes.map(arch => (
                   <button 
                      key={arch}
                      onClick={() => setInput(prev => prev + (prev ? '\n\n' : '') + `Mood: ${arch}.`)}
                      className="text-nous-accent hover:text-nous-text font-serif italic text-lg opacity-60 hover:opacity-100 transition-all border-b border-transparent hover:border-nous-text"
                   >
                     {arch}
                   </button>
                 ))}
              </div>
            )}

            <button
               onClick={handleSubmit}
               disabled={(!input.trim() && files.length === 0 && !audioBlob) || isLoading}
               className={`
                  font-sans text-xs tracking-[0.3em] uppercase 
                  bg-nous-text text-white px-12 py-4 rounded-sm shadow-xl
                  hover:bg-nous-accent transition-all duration-500
                  disabled:opacity-30 disabled:cursor-not-allowed
                  flex items-center gap-3
               `}
            >
               {isProcessing ? <Loader2 className="animate-spin w-4 h-4"/> : <Sparkles className="w-4 h-4" />}
               {isProcessing ? 'Processing Assets...' : 'Curate Issue'}
            </button>
        </div>

      </div>

      {/* --- MOBILE TOOLBAR --- */}
      <div className="md:hidden fixed bottom-24 left-0 right-0 z-40 px-4 pointer-events-none flex flex-col items-center gap-4">
         
         {trendingArchetypes.length > 0 && (
            <div className="pointer-events-auto flex gap-2 overflow-x-auto max-w-full px-4 pb-2 hide-scrollbar mask-linear-fade">
               <span className="bg-white/90 backdrop-blur text-nous-subtle font-sans text-[8px] uppercase tracking-widest px-3 py-1.5 rounded-full border border-stone-200 flex items-center">Spark with:</span>
               {trendingArchetypes.map(arch => (
                 <button 
                    key={arch}
                    onClick={() => setInput(prev => prev + (prev ? '\n\n' : '') + `Mood: ${arch}.`)}
                    className="bg-white/90 backdrop-blur hover:bg-nous-text hover:text-white border border-stone-200 text-nous-accent px-4 py-1.5 rounded-full font-serif italic text-sm shadow-sm transition-all whitespace-nowrap"
                 >
                   {arch}
                 </button>
               ))}
            </div>
         )}

         <div className="pointer-events-auto bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl rounded-full px-6 py-3 flex items-center gap-6 transition-transform duration-300 hover:scale-[1.02]">
            <ToolButton 
              onClick={isRecording ? stopRecording : startRecording} 
              icon={Mic} 
              active={isRecording} 
              disabled={!!audioBlob}
            />
            <div className="w-px h-8 bg-stone-200" />
            <ToolButton onClick={() => fileInputRef.current?.click()} icon={ImageIcon} />
            <ToolButton onClick={() => videoInputRef.current?.click()} icon={Video} />
            <div className="w-px h-8 bg-stone-200" />
            <ToolButton onClick={() => coverInputRef.current?.click()} icon={LayoutTemplate} active={!!coverFile} />
            <ToolButton onClick={() => setUseSearch(!useSearch)} icon={Globe} active={useSearch} />
         </div>

         <div className="pointer-events-auto w-full overflow-x-auto hide-scrollbar px-6 flex gap-2 justify-center pb-2">
            {TONES.map(tone => (
               <button
                 key={tone}
                 onClick={() => setSelectedTone(tone)}
                 className={`shrink-0 px-3 py-1 rounded-full text-[8px] uppercase tracking-widest border transition-all ${selectedTone === tone ? 'bg-nous-text text-white border-nous-text shadow-md' : 'bg-white/60 border-stone-200 text-stone-400 backdrop-blur-sm'}`}
               >
                 {tone}
               </button>
             ))}
         </div>

         <button
            onClick={handleSubmit}
            disabled={(!input.trim() && files.length === 0 && !audioBlob) || isLoading}
            className={`
               pointer-events-auto
               mt-2 font-sans text-[10px] tracking-[0.3em] uppercase 
               bg-nous-text text-white px-8 py-3 rounded-full shadow-xl
               hover:bg-nous-accent transition-all duration-500
               disabled:opacity-0 disabled:translate-y-4
               flex items-center gap-2
            `}
         >
            {isProcessing ? <Loader2 className="animate-spin w-3 h-3"/> : <Sparkles className="w-3 h-3" />}
            {isProcessing ? 'Processing Assets...' : 'Curate Issue'}
         </button>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileChange} />
      <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={handleFileChange} />
      <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={handleCoverChange} />
    </div>
  );
};
