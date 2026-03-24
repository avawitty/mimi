import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, X, Save, Beaker, ScanLine, Activity, Layers, Check, Sparkles, Image as ImageIcon, ToggleLeft, ToggleRight } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { extractStyleTreatment, applyAestheticRefraction } from '../services/geminiService';
import { StyleTreatment } from '../types';

type DarkroomMode = 'extract' | 'batch';

interface BatchImage {
  id: string;
  url: string;
  base64: string;
  mimeType: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  resultUrl?: string;
  error?: string;
}

export const DarkroomView: React.FC = () => {
  const { profile, updateProfile, activePersona } = useUser();
  const [mode, setMode] = useState<DarkroomMode>('extract');
  
  // Extraction State
  const [dragActive, setDragActive] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<{ url: string; base64: string; mimeType: string } | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [treatment, setTreatment] = useState<Partial<StyleTreatment> | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Batch State
  const [batchImages, setBatchImages] = useState<BatchImage[]>([]);
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string | null>(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const batchInputRef = useRef<HTMLInputElement>(null);

  // --- Extraction Handlers ---
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError("Only images can be processed in the darkroom.");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const base64 = result.split(',')[1];
      setUploadedImage({ url: result, base64, mimeType: file.type });
      setTreatment(null);
      setIsSaved(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleExtraction = async () => {
    if (!uploadedImage) return;
    setIsExtracting(true);
    setError(null);
    try {
      const result = await extractStyleTreatment(uploadedImage.base64, uploadedImage.mimeType, activePersona?.apiKey);
      setTreatment(result);
    } catch (err: any) {
      setError(err.message || "Failed to extract aesthetic treatment.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSave = () => {
    if (!treatment || !treatment.treatmentName) return;
    const newTreatment: StyleTreatment = {
      id: `trt_${Date.now()}`,
      createdAt: Date.now(),
      treatmentName: treatment.treatmentName,
      basePromptDirectives: treatment.basePromptDirectives || '',
      imageEditingRules: treatment.imageEditingRules || '',
      typographyLayout: treatment.typographyLayout || '',
      applicationLogic: treatment.applicationLogic || ''
    };

    const currentTreatments = profile?.savedTreatments || [];
    if (profile) {
      updateProfile({
        ...profile,
        savedTreatments: [newTreatment, ...currentTreatments]
      });
      setIsSaved(true);
    }
  };

  const resetDarkroom = () => {
    setUploadedImage(null);
    setTreatment(null);
    setIsSaved(false);
    setError(null);
  };

  // --- Batch Handlers ---
  const handleBatchFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          const base64 = result.split(',')[1];
          setBatchImages(prev => [...prev, {
            id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            url: result,
            base64,
            mimeType: file.type,
            status: 'pending'
          }]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleBatchDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleBatchFiles(e.dataTransfer.files);
  };

  const processBatch = async () => {
    if (!selectedTreatmentId || batchImages.length === 0) return;
    const selectedTreatment = profile?.savedTreatments?.find(t => t.id === selectedTreatmentId);
    if (!selectedTreatment) return;

    setIsBatchProcessing(true);
    
    for (let i = 0; i < batchImages.length; i++) {
      if (batchImages[i].status === 'done') continue;
      
      setBatchImages(prev => prev.map((img, idx) => idx === i ? { ...img, status: 'processing' } : img));
      
      try {
        const resultUrl = await applyAestheticRefraction(batchImages[i].url, selectedTreatment.imageEditingRules, profile);
        setBatchImages(prev => prev.map((img, idx) => idx === i ? { ...img, status: 'done', resultUrl } : img));
      } catch (err: any) {
        setBatchImages(prev => prev.map((img, idx) => idx === i ? { ...img, status: 'error', error: err.message } : img));
      }
    }
    
    setIsBatchProcessing(false);
  };

  const removeBatchImage = (id: string) => {
    setBatchImages(prev => prev.filter(img => img.id !== id));
  };

  const toggleZineAesthetic = () => {
    if (!profile) return;
    const currentZineOptions = profile.zineOptions || {
      style: 'balanced',
      theme: 'organic',
      contentFocus: 'balanced'
    };
    const isCurrentlyEnabled = currentZineOptions.selectedTreatmentId === selectedTreatmentId;
    
    updateProfile({
      ...profile,
      zineOptions: {
        ...currentZineOptions,
        selectedTreatmentId: isCurrentlyEnabled ? undefined : selectedTreatmentId
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-stone-300 font-sans p-6 overflow-y-auto selection:bg-emerald-500/30">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 border-b border-emerald-900/30 pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-serif italic text-emerald-500 tracking-tighter">The Darkroom</h1>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-900/80 mt-2 font-bold">Aesthetic Extraction & Processing</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setMode('extract')}
              className={`text-xs uppercase tracking-widest px-4 py-2 border transition-colors ${mode === 'extract' ? 'border-emerald-500 text-emerald-500 bg-emerald-950/20' : 'border-stone-800 text-stone-500 hover:border-emerald-900/50 hover:text-emerald-400'}`}
            >
              Extraction Panel
            </button>
            <button 
              onClick={() => setMode('batch')}
              className={`text-xs uppercase tracking-widest px-4 py-2 border transition-colors ${mode === 'batch' ? 'border-emerald-500 text-emerald-500 bg-emerald-950/20' : 'border-stone-800 text-stone-500 hover:border-emerald-900/50 hover:text-emerald-400'}`}
            >
              Batch Processing
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-8 p-4 bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 text-sm font-mono">
            ERR: {error}
          </div>
        )}

        {mode === 'extract' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* LEFT: EXPOSURE TRAY */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-xs uppercase tracking-widest font-bold text-stone-400">Exposure Tray</h2>
                {uploadedImage && (
                  <button onClick={resetDarkroom} className="ml-auto text-xs uppercase tracking-widest text-stone-500 hover:text-emerald-500 transition-colors flex items-center gap-2">
                    <X size={14} /> Clear
                  </button>
                )}
              </div>

              {!uploadedImage ? (
                <div 
                  className={`border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-12 aspect-square cursor-pointer
                    ${dragActive ? 'border-emerald-500 bg-emerald-950/20' : 'border-stone-800 hover:border-emerald-900/50 hover:bg-stone-900/50'}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
                  <Upload size={32} className={`mb-4 ${dragActive ? 'text-emerald-500' : 'text-stone-600'}`} />
                  <p className="text-sm font-serif italic text-stone-400 text-center">Drop artifact here to begin exposure</p>
                  <p className="text-[10px] uppercase tracking-widest text-stone-600 mt-4">JPG, PNG, WEBP</p>
                </div>
              ) : (
                <div className="relative group aspect-square bg-black border border-stone-800 overflow-hidden flex items-center justify-center">
                  <img src={uploadedImage.url} alt="Artifact" className={`max-w-full max-h-full object-contain transition-all duration-1000 ${isExtracting ? 'grayscale contrast-150 brightness-75' : 'grayscale-0'}`} />
                  
                  {isExtracting && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-0 bg-emerald-500/10 mix-blend-overlay" />
                      <motion.div 
                        animate={{ top: ['0%', '100%', '0%'] }} 
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 right-0 h-1 bg-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.8)]"
                      />
                    </div>
                  )}
                  
                  {!isExtracting && !treatment && (
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <button 
                        onClick={handleExtraction}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs uppercase tracking-[0.2em] font-bold transition-colors flex items-center gap-2"
                      >
                        <Beaker size={16} /> Extract Aesthetic
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT: DEVELOPMENT & FIXATION */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Activity size={14} className={isExtracting ? "text-emerald-500 animate-spin" : "text-stone-600"} />
                <h2 className="text-xs uppercase tracking-widest font-bold text-stone-400">Chemical Analysis</h2>
              </div>

              <div className="min-h-[500px] border border-stone-800 bg-[#050505] p-6 relative overflow-hidden">
                {!isExtracting && !treatment && (
                  <div className="absolute inset-0 flex items-center justify-center text-stone-700 font-mono text-xs uppercase tracking-widest">
                    Awaiting Exposure
                  </div>
                )}

                {isExtracting && (
                  <div className="space-y-4 font-mono text-xs text-emerald-500/70">
                    <p className="animate-pulse">Initializing Vision Model...</p>
                    <p className="animate-pulse" style={{ animationDelay: '0.5s' }}>Parsing visual logic...</p>
                    <p className="animate-pulse" style={{ animationDelay: '1s' }}>Extracting chromatic registry...</p>
                    <p className="animate-pulse" style={{ animationDelay: '1.5s' }}>Synthesizing treatment rules...</p>
                  </div>
                )}

                <AnimatePresence>
                  {treatment && !isExtracting && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="space-y-8"
                    >
                      <div>
                        <h3 className="text-[10px] uppercase tracking-[0.2em] text-emerald-500 mb-2 font-bold">Treatment Name</h3>
                        <input 
                          value={treatment.treatmentName || ''} 
                          onChange={e => setTreatment({ ...treatment, treatmentName: e.target.value })}
                          className="w-full bg-transparent border-b border-stone-800 py-2 font-serif italic text-2xl text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <h3 className="text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-2 font-bold">Base Prompt Directives</h3>
                        <textarea 
                          value={treatment.basePromptDirectives || ''} 
                          onChange={e => setTreatment({ ...treatment, basePromptDirectives: e.target.value })}
                          className="w-full bg-stone-900/30 border border-stone-800 p-3 font-mono text-xs text-stone-300 focus:outline-none focus:border-emerald-500 min-h-[80px] resize-none"
                        />
                      </div>

                      <div>
                        <h3 className="text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-2 font-bold">Image Editing Rules</h3>
                        <textarea 
                          value={treatment.imageEditingRules || ''} 
                          onChange={e => setTreatment({ ...treatment, imageEditingRules: e.target.value })}
                          className="w-full bg-stone-900/30 border border-stone-800 p-3 font-mono text-xs text-stone-300 focus:outline-none focus:border-emerald-500 min-h-[80px] resize-none"
                        />
                      </div>

                      <div>
                        <h3 className="text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-2 font-bold">Typography Layout</h3>
                        <textarea 
                          value={treatment.typographyLayout || ''} 
                          onChange={e => setTreatment({ ...treatment, typographyLayout: e.target.value })}
                          className="w-full bg-stone-900/30 border border-stone-800 p-3 font-mono text-xs text-stone-300 focus:outline-none focus:border-emerald-500 min-h-[60px] resize-none"
                        />
                      </div>

                      <div>
                        <h3 className="text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-2 font-bold">Application Logic</h3>
                        <textarea 
                          value={treatment.applicationLogic || ''} 
                          onChange={e => setTreatment({ ...treatment, applicationLogic: e.target.value })}
                          className="w-full bg-stone-900/30 border border-stone-800 p-3 font-mono text-xs text-stone-300 focus:outline-none focus:border-emerald-500 min-h-[60px] resize-none"
                        />
                      </div>

                      <div className="pt-4 border-t border-stone-800">
                        <button 
                          onClick={handleSave}
                          disabled={isSaved}
                          className={`w-full py-4 text-xs uppercase tracking-[0.2em] font-bold transition-all flex items-center justify-center gap-2
                            ${isSaved ? 'bg-stone-800 text-stone-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                        >
                          {isSaved ? (
                            <>Saved to Registry</>
                          ) : (
                            <><Save size={16} /> Save to Registry</>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* LEFT: BATCH UPLOAD & LIST */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Layers size={14} className="text-emerald-500" />
                <h2 className="text-xs uppercase tracking-widest font-bold text-stone-400">Batch Upload</h2>
                {batchImages.length > 0 && (
                  <button onClick={() => setBatchImages([])} className="ml-auto text-xs uppercase tracking-widest text-stone-500 hover:text-emerald-500 transition-colors flex items-center gap-2">
                    <X size={14} /> Clear All
                  </button>
                )}
              </div>

              <div 
                className={`border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-8 cursor-pointer
                  ${dragActive ? 'border-emerald-500 bg-emerald-950/20' : 'border-stone-800 hover:border-emerald-900/50 hover:bg-stone-900/50'}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleBatchDrop}
                onClick={() => batchInputRef.current?.click()}
              >
                <input ref={batchInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleBatchFiles(e.target.files)} />
                <ImageIcon size={24} className={`mb-2 ${dragActive ? 'text-emerald-500' : 'text-stone-600'}`} />
                <p className="text-sm font-serif italic text-stone-400 text-center">Drop multiple artifacts here</p>
              </div>

              {batchImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                  {batchImages.map((img) => (
                    <div key={img.id} className="relative group aspect-square bg-black border border-stone-800 overflow-hidden">
                      <img src={img.resultUrl || img.url} alt="Batch item" className="w-full h-full object-cover" />
                      
                      {/* Status Overlay */}
                      <div className="absolute top-2 right-2 flex gap-2">
                        {img.status === 'processing' && <Activity size={16} className="text-emerald-500 animate-spin" />}
                        {img.status === 'done' && <Check size={16} className="text-emerald-500" />}
                        {img.status === 'error' && <X size={16} className="text-red-500" />}
                      </div>

                      {/* Remove Button */}
                      <button 
                        onClick={() => removeBatchImage(img.id)}
                        className="absolute top-2 left-2 p-1 bg-black/50 text-stone-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                      >
                        <X size={14} />
                      </button>

                      {/* Original Image comparison on hover if done */}
                      {img.status === 'done' && img.resultUrl && (
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <img src={img.url} alt="Original" className="w-full h-full object-cover" />
                          <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 text-[10px] uppercase tracking-widest text-stone-300">Original</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT: TREATMENT SELECTION */}
            <div className="lg:col-span-4 space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles size={14} className="text-emerald-500" />
                <h2 className="text-xs uppercase tracking-widest font-bold text-stone-400">Apply Treatment</h2>
              </div>

              <div className="bg-[#050505] border border-stone-800 p-6 space-y-6">
                <div>
                  <h3 className="text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-3 font-bold">Select Preset</h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {profile?.savedTreatments?.length ? (
                      profile.savedTreatments.map(t => (
                        <button
                          key={t.id}
                          onClick={() => setSelectedTreatmentId(t.id)}
                          className={`w-full text-left p-3 border transition-colors flex items-center justify-between ${selectedTreatmentId === t.id ? 'border-emerald-500 bg-emerald-500/5' : 'border-stone-800 hover:border-emerald-500/50'}`}
                        >
                          <div>
                            <p className={`font-serif italic text-sm ${selectedTreatmentId === t.id ? 'text-emerald-500' : 'text-stone-300'}`}>{t.treatmentName}</p>
                            <p className="text-[10px] font-mono text-stone-500 mt-1 line-clamp-1">{t.applicationLogic}</p>
                          </div>
                          {selectedTreatmentId === t.id && <Check size={14} className="text-emerald-500" />}
                        </button>
                      ))
                    ) : (
                      <p className="text-xs text-stone-500 italic">No saved treatments found. Extract one first.</p>
                    )}
                  </div>
                </div>

                {selectedTreatmentId && (
                  <div className="pt-4 border-t border-stone-800">
                    <button
                      onClick={toggleZineAesthetic}
                      className="flex items-center gap-2 text-xs uppercase tracking-widest text-stone-400 hover:text-emerald-400 transition-colors mb-6 w-full"
                    >
                      {profile?.zineOptions?.selectedTreatmentId === selectedTreatmentId ? (
                        <ToggleRight size={20} className="text-emerald-500" />
                      ) : (
                        <ToggleLeft size={20} />
                      )}
                      Apply this aesthetic to my Zines
                    </button>

                    <button 
                      onClick={processBatch}
                      disabled={isBatchProcessing || batchImages.length === 0}
                      className={`w-full py-4 text-xs uppercase tracking-[0.2em] font-bold transition-all flex items-center justify-center gap-2
                        ${isBatchProcessing || batchImages.length === 0 ? 'bg-stone-800 text-stone-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                    >
                      {isBatchProcessing ? (
                        <><Activity size={16} className="animate-spin" /> Processing Batch...</>
                      ) : (
                        <><Sparkles size={16} /> Run Nano Banana Edit</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

