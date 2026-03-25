import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Save, Beaker, ScanLine, Activity, Layers, Check, Sparkles, Image as ImageIcon, ToggleLeft, ToggleRight } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { extractStyleTreatment, applyAestheticRefraction } from '../services/geminiService';
import { StyleTreatment } from '../types';
import { DarkroomGeneration } from './DarkroomGeneration';
import { DarkroomTranscription } from './DarkroomTranscription';

type DarkroomMode = 'extract' | 'batch' | 'generation' | 'transcription';

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
 const { user, profile, updateProfile, activePersona } = useUser();
 const [mode, setMode] = useState<DarkroomMode>('generation');
 
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
 const [isExporting, setIsExporting] = useState(false);
 const batchInputRef = useRef<HTMLInputElement>(null);

 // --- Extraction Handlers ---
 const handleDrag = (e: React.DragEvent) => {
 e.preventDefault();
 e.stopPropagation();
 if (e.type ==="dragenter"|| e.type ==="dragover") {
 setDragActive(true);
 } else if (e.type ==="dragleave") {
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
 reader.onerror = (e) => console.error("MIMI // FileReader error", e);
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
 setError(err.message ||"Failed to extract aesthetic treatment.");
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
 
 if (user?.isAnonymous || user?.uid?.startsWith('local_')) {
 window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
 detail: { message:"Cloud Database requires an active Sync. Artifact saved locally."} 
 }));
 }
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
 reader.onerror = (e) => console.error("MIMI // FileReader error", e);
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

 const saveToPocket = async (img: BatchImage) => {
 if (!profile || !img.resultUrl || img.status !== 'done') return;
 
 try {
 const { archiveManager } = await import('../services/archiveManager');
 await archiveManager.saveToPocket(profile.uid, 'image', {
 imageUrl: img.resultUrl,
 source: 'Darkroom Batch',
 notes: `Processed with treatment: ${profile.savedTreatments?.find(t => t.id === selectedTreatmentId)?.treatmentName || 'Unknown'}`
 });
 
 window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
 detail: { message:"Image saved to Pocket.", type: 'success' } 
 }));
 } catch (e) {
 console.error("Failed to save to pocket", e);
 }
 };

 const batchExport = async () => {
 if (!profile) return;
 const doneImages = batchImages.filter(img => img.status === 'done' && img.resultUrl);
 if (doneImages.length === 0) return;

 setIsExporting(true);
 const treatmentName = profile.savedTreatments?.find(t => t.id === selectedTreatmentId)?.treatmentName || 'Unknown Treatment';
 
 try {
 const { archiveManager } = await import('../services/archiveManager');
 for (const img of doneImages) {
 await archiveManager.saveToPocket(profile.uid, 'image', {
 imageUrl: img.resultUrl!,
 source: 'Darkroom Batch Export',
 notes: `Batch processed with treatment: ${treatmentName}`
 });
 }

 window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
 detail: { message: `Exported ${doneImages.length} images to Pocket.`, type: 'success' } 
 }));
 } catch (e) {
 console.error("Failed to batch export", e);
 } finally {
 setIsExporting(false);
 }
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
 <div className="min-h-screen bg text font-sans p-6 overflow-y-auto selection:bg/30">
 <div className="max-w-7xl mx-auto">
 <header className="mb-8 border-b border/10 pb-6 flex justify-between items-end">
 <div>
 <h1 className="text-5xl font-serif italic text tracking-tighter">The Darkroom</h1>
 <p className="text-[10px] uppercase tracking-[0.3em] text/50 mt-4 font-bold">Aesthetic Extraction & Processing // SYS.OP.8821-X</p>
 </div>
 <div className="flex gap-4">
 <button 
 onClick={() => setMode('extract')}
 className={`text-[10px] uppercase tracking-[0.2em] px-4 py-2 border transition-colors ${mode === 'extract' ? 'border/30 text bg/5' : 'border/10 text/50 hover:border/30 hover:text'}`}
 >
 Extraction Panel
 </button>
 <button 
 onClick={() => setMode('batch')}
 className={`text-[10px] uppercase tracking-[0.2em] px-4 py-2 border transition-colors ${mode === 'batch' ? 'border/30 text bg/5' : 'border/10 text/50 hover:border/30 hover:text'}`}
 >
 Batch Processing
 </button>
 <button 
 onClick={() => setMode('generation')}
 className={`text-[10px] uppercase tracking-[0.2em] px-4 py-2 border transition-colors ${mode === 'generation' ? 'border/30 text bg/5' : 'border/10 text/50 hover:border/30 hover:text'}`}
 >
 Synthesis Pipeline
 </button>
 <button 
 onClick={() => setMode('transcription')}
 className={`text-[10px] uppercase tracking-[0.2em] px-4 py-2 border transition-colors ${mode === 'transcription' ? 'border/30 text bg/5' : 'border/10 text/50 hover:border/30 hover:text'}`}
 >
 Sonic Decoupling
 </button>
 </div>
 </header>

 {error && (
 <div className="mb-8 p-4 bg border border-red-900/50 text-red-500 text-[10px] uppercase tracking-widest font-mono">
 ERR: {error}
 </div>
 )}

 {mode === 'transcription' ? (
 <DarkroomTranscription />
 ) : mode === 'generation' ? (
 <DarkroomGeneration />
 ) : mode === 'extract' ? (
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
 {/* LEFT: EXPOSURE TRAY */}
 <div className="space-y-6">
 <div className="flex items-center gap-3 mb-4">
 <div className="w-2 h-2 rounded-none bg-stone-500 animate-pulse"/>
 <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text">Exposure Tray</h2>
 {uploadedImage && (
 <button onClick={resetDarkroom} className="ml-auto text-[10px] uppercase tracking-widest text/50 hover:text transition-colors flex items-center gap-2">
 <X size={14} /> Clear
 </button>
 )}
 </div>

 {!uploadedImage ? (
 <div 
 className={`border border-dashed transition-all duration-300 flex flex-col items-center justify-center p-12 aspect-square cursor-pointer
 ${dragActive ? 'border/50 bg/5' : 'border/20 hover:border/40 hover:bg/5'}`}
 onDragEnter={handleDrag}
 onDragLeave={handleDrag}
 onDragOver={handleDrag}
 onDrop={handleDrop}
 onClick={() => fileInputRef.current?.click()}
 >
 <input ref={fileInputRef} type="file"accept="image/*"className="hidden"onChange={handleChange} />
 <Upload size={32} className={`mb-4 ${dragActive ? 'text' : 'text/50'}`} />
 <p className="text-sm font-serif italic text/70 text-center">Drop artifact here to begin exposure</p>
 <p className="text-[10px] uppercase tracking-widest text/40 mt-4">JPG, PNG, WEBP</p>
 </div>
 ) : (
 <div className="relative group aspect-square bg-black border border/20 overflow-hidden flex items-center justify-center">
 <img src={uploadedImage.url} alt="Artifact"className={`max-w-full max-h-full object-contain transition-all duration-1000 ${isExtracting ? 'grayscale contrast-150 brightness-75' : 'grayscale-0'}`} />
 
 {isExtracting && (
 <div className="absolute inset-0 pointer-events-none">
 <div className="absolute inset-0 bg/10 mix-blend-overlay"/>
 <motion.div 
 animate={{ top: ['0%', '100%', '0%'] }} 
 transition={{ duration: 3, repeat: Infinity, ease:"linear"}}
 className="absolute left-0 right-0 h-[1px] bg/50"
 />
 </div>
 )}
 
 {!isExtracting && !treatment && (
 <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
 <button 
 onClick={handleExtraction}
 className="px-6 py-3 bg/20 hover:bg/30 text text-[10px] uppercase tracking-[0.3em] font-bold transition-colors flex items-center gap-2 border border/30"
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
 <Activity size={14} className={isExtracting ?"text animate-spin":"text/50"} />
 <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text">Chemical Analysis</h2>
 </div>

 <div className="min-h-[500px] border border/20 bg p-6 relative overflow-hidden">
 {!isExtracting && !treatment && (
 <div className="absolute inset-0 flex items-center justify-center text/30 font-mono text-[10px] uppercase tracking-[0.3em]">
 Awaiting Exposure
 </div>
 )}

 {isExtracting && (
 <div className="space-y-4 font-mono text-[10px] text/70 uppercase tracking-widest">
 <p className="animate-pulse">Initializing Vision Model...</p>
 <p className="animate-pulse"style={{ animationDelay: '0.5s' }}>Parsing visual logic...</p>
 <p className="animate-pulse"style={{ animationDelay: '1s' }}>Extracting chromatic registry...</p>
 <p className="animate-pulse"style={{ animationDelay: '1.5s' }}>Synthesizing treatment rules...</p>
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
 <h3 className="text-[9px] uppercase tracking-[0.2em] text/50 mb-2 font-bold">Treatment Name</h3>
 <input 
 value={treatment.treatmentName || ''} 
 onChange={e => setTreatment({ ...treatment, treatmentName: e.target.value })}
 className="w-full bg-transparent border-b border/20 py-2 font-serif italic text-2xl text focus:outline-none focus:border/50"
 />
 </div>

 <div>
 <h3 className="text-[9px] uppercase tracking-[0.2em] text/50 mb-2 font-bold">Base Prompt Directives</h3>
 <textarea 
 value={treatment.basePromptDirectives || ''} 
 onChange={e => setTreatment({ ...treatment, basePromptDirectives: e.target.value })}
 className="w-full bg border border/20 p-3 font-mono text-[10px] text focus:outline-none focus:border/50 min-h-[80px] resize-none"
 />
 </div>

 <div>
 <h3 className="text-[9px] uppercase tracking-[0.2em] text/50 mb-2 font-bold">Image Editing Rules</h3>
 <textarea 
 value={treatment.imageEditingRules || ''} 
 onChange={e => setTreatment({ ...treatment, imageEditingRules: e.target.value })}
 className="w-full bg border border/20 p-3 font-mono text-[10px] text focus:outline-none focus:border/50 min-h-[80px] resize-none"
 />
 </div>

 <div>
 <h3 className="text-[9px] uppercase tracking-[0.2em] text/50 mb-2 font-bold">Typography Layout</h3>
 <textarea 
 value={treatment.typographyLayout || ''} 
 onChange={e => setTreatment({ ...treatment, typographyLayout: e.target.value })}
 className="w-full bg border border/20 p-3 font-mono text-[10px] text focus:outline-none focus:border/50 min-h-[60px] resize-none"
 />
 </div>

 <div>
 <h3 className="text-[9px] uppercase tracking-[0.2em] text/50 mb-2 font-bold">Application Logic</h3>
 <textarea 
 value={treatment.applicationLogic || ''} 
 onChange={e => setTreatment({ ...treatment, applicationLogic: e.target.value })}
 className="w-full bg border border/20 p-3 font-mono text-[10px] text focus:outline-none focus:border/50 min-h-[60px] resize-none"
 />
 </div>

 <div className="pt-4 border-t border/10">
 <button 
 onClick={handleSave}
 disabled={isSaved}
 className={`w-full py-4 text-[10px] uppercase tracking-[0.3em] font-bold transition-all flex items-center justify-center gap-2 border
 ${isSaved ? 'border/10 text/30 cursor-not-allowed' : 'border/50 text hover:bg/10'}`}
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
 <Layers size={14} className="text/50"/>
 <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text">Batch Upload</h2>
 {batchImages.length > 0 && (
 <button onClick={() => setBatchImages([])} className="ml-auto text-[10px] uppercase tracking-widest text/50 hover:text transition-colors flex items-center gap-2">
 <X size={14} /> Clear All
 </button>
 )}
 </div>

 <div 
 className={`border border-dashed transition-all duration-300 flex flex-col items-center justify-center p-8 cursor-pointer
 ${dragActive ? 'border/50 bg/5' : 'border/20 hover:border/40 hover:bg/5'}`}
 onDragEnter={handleDrag}
 onDragLeave={handleDrag}
 onDragOver={handleDrag}
 onDrop={handleBatchDrop}
 onClick={() => batchInputRef.current?.click()}
 >
 <input ref={batchInputRef} type="file"accept="image/*"multiple className="hidden"onChange={(e) => handleBatchFiles(e.target.files)} />
 <ImageIcon size={24} className={`mb-2 ${dragActive ? 'text' : 'text/50'}`} />
 <p className="text-sm font-serif italic text/70 text-center">Drop multiple artifacts here</p>
 </div>

 {batchImages.length > 0 && (
 <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
 {batchImages.map((img) => (
 <div key={img.id} className="relative group aspect-square bg border border/20 overflow-hidden">
 <img src={img.resultUrl || img.url} alt="Batch item"className="w-full h-full object-cover"/>
 
 {/* Status Overlay */}
 <div className="absolute top-2 right-2 flex gap-2">
 {img.status === 'processing' && <Activity size={16} className="text/50 animate-spin"/>}
 {img.status === 'done' && <Check size={16} className="text/50"/>}
 {img.status === 'error' && <X size={16} className="text-red-500"/>}
 </div>

 {/* Remove Button */}
 <button 
 onClick={() => removeBatchImage(img.id)}
 className="absolute top-2 left-2 p-1 bg-black/50 text/50 hover:text opacity-0 group-hover:opacity-100 transition-opacity rounded-none"
 >
 <X size={14} />
 </button>

 {/* Original Image comparison on hover if done */}
 {img.status === 'done' && img.resultUrl && (
 <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
 <img src={img.url} alt="Original"className="w-full h-full object-cover"/>
 <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 text-[9px] uppercase tracking-widest text/70">Original</div>
 <button 
 onClick={() => saveToPocket(img)}
 className="absolute bottom-2 right-2 bg/20 hover:bg/30 text px-3 py-1 text-[9px] uppercase tracking-widest transition-colors flex items-center gap-1 border border/30"
 >
 <Save size={12} /> Pocket
 </button>
 </div>
 )}
 </div>
 ))}
 </div>
 )}
 
 {batchImages.some(img => img.status === 'done') && (
 <div className="mt-6 flex justify-end">
 <button 
 onClick={batchExport}
 disabled={isExporting}
 className={`px-6 py-3 text-[10px] uppercase tracking-[0.3em] font-bold transition-colors flex items-center gap-2 border ${isExporting ? 'border/10 text/30 cursor-not-allowed' : 'border/50 text hover:bg/10'}`}
 >
 {isExporting ? (
 <><Activity size={16} className="animate-spin"/> Exporting...</>
 ) : (
 <><Save size={16} /> Batch Export to Pocket</>
 )}
 </button>
 </div>
 )}
 </div>

 {/* RIGHT: TREATMENT SELECTION */}
 <div className="lg:col-span-4 space-y-6">
 <div className="flex items-center gap-3 mb-4">
 <Sparkles size={14} className="text/50"/>
 <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text">Apply Treatment</h2>
 </div>

 <div className="bg border border/20 p-6 space-y-6">
 <div>
 <h3 className="text-[9px] uppercase tracking-[0.2em] text/50 mb-3 font-bold">Select Preset</h3>
 <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
 {profile?.savedTreatments?.length ? (
 profile.savedTreatments.map(t => (
 <button
 key={t.id}
 onClick={() => setSelectedTreatmentId(t.id)}
 className={`w-full text-left p-3 border transition-colors flex items-center justify-between ${selectedTreatmentId === t.id ? 'border/50 bg/10' : 'border/20 hover:border/50'}`}
 >
 <div>
 <p className={`font-serif italic text-sm ${selectedTreatmentId === t.id ? 'text' : 'text/70'}`}>{t.treatmentName}</p>
 <p className="text-[9px] font-mono text/50 mt-1 line-clamp-1">{t.applicationLogic}</p>
 </div>
 {selectedTreatmentId === t.id && <Check size={14} className="text"/>}
 </button>
 ))
 ) : (
 <p className="text-[9px] uppercase tracking-widest text/40 italic">No saved treatments found. Extract one first.</p>
 )}
 </div>
 </div>

 {selectedTreatmentId && (
 <div className="pt-4 border-t border/10">
 <button
 onClick={toggleZineAesthetic}
 className="flex items-center gap-2 text-[9px] uppercase tracking-widest text/50 hover:text transition-colors mb-6 w-full"
 >
 {profile?.zineOptions?.selectedTreatmentId === selectedTreatmentId ? (
 <ToggleRight size={20} className="text"/>
 ) : (
 <ToggleLeft size={20} />
 )}
 Apply this aesthetic to my Zines
 </button>

 <button 
 onClick={processBatch}
 disabled={isBatchProcessing || batchImages.length === 0}
 className={`w-full py-4 text-[10px] uppercase tracking-[0.3em] font-bold transition-all flex items-center justify-center gap-2 border
 ${isBatchProcessing || batchImages.length === 0 ? 'border/10 text/30 cursor-not-allowed' : 'border/50 text hover:bg/10'}`}
 >
 {isBatchProcessing ? (
 <><Activity size={16} className="animate-spin"/> Processing Batch...</>
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

