import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Image as ImageIcon, Loader2, Play, Sparkles, Upload, X, Terminal } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface CatalystData {
 url: string;
 base64: string;
 mimeType: string;
}

export const DarkroomGeneration: React.FC = () => {
 const [prompt, setPrompt] = useState('');
 const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
 const [generationType, setGenerationType] = useState<'video' | 'image' | 'anime'>('video');
 const [isGenerating, setIsGenerating] = useState(false);
 const [resultUrl, setResultUrl] = useState<string | null>(null);
 const [error, setError] = useState<string | null>(null);

 // Stage 01 State
 const [dragActive, setDragActive] = useState(false);
 const [catalyst, setCatalyst] = useState<CatalystData | null>(null);
 const [isAnalyzing, setIsAnalyzing] = useState(false);
 const [analysisData, setAnalysisData] = useState<any>(null);
 const fileInputRef = useRef<HTMLInputElement>(null);

 // Terminal Logs
 const [logs, setLogs] = useState<string[]>([]);

 const addLog = (msg: string) => {
 setLogs(prev => [...prev, `[${new Date().toISOString().split('T')[1].slice(0, 8)}] ${msg}`]);
 };

 const handleDrag = (e: React.DragEvent) => {
 e.preventDefault();
 e.stopPropagation();
 if (e.type ==="dragenter"|| e.type ==="dragover") {
 setDragActive(true);
 } else if (e.type ==="dragleave") {
 setDragActive(false);
 }
 };

 const analyzeCatalyst = async (base64: string, mimeType: string) => {
 setIsAnalyzing(true);
 setAnalysisData(null);
 addLog("INGESTING CATALYST ARTIFACT...");
 
 try {
 const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
 const analysisPrompt = `Analyze this image and provide the following data in JSON format:
 1. palette: An array of 4 dominant hex color codes.
 2. dof: Estimated depth of field (e.g.,"f/2.8 (SHALLOW)","f/8 (DEEP)").
 3. contrast: Estimated contrast ratio (e.g.,"HIGH (12:1)","LOW (3:1)").
 4. luminance: Overall luminance description (e.g.,"LOW-KEY","HIGH-KEY","MID-TONE").
 Return ONLY valid JSON.`;

 addLog("EXTRACTING CHROMATIC SIGNATURE...");
 addLog("CALCULATING DEPTH OF FIELD...");
 addLog("ANALYZING CONTRAST RATIOS...");

 const response = await ai.models.generateContent({
 model: 'gemini-3-flash-preview',
 contents: {
 parts: [
 { inlineData: { data: base64, mimeType } },
 { text: analysisPrompt }
 ]
 },
 config: {
 responseMimeType: 'application/json'
 }
 });

 if (response.text) {
 const data = JSON.parse(response.text);
 setAnalysisData(data);
 addLog("CATALYST ANALYSIS COMPLETE.");
 }
 } catch (err) {
 console.error("Analysis error:", err);
 addLog("ANALYSIS FAILED. USING FALLBACK DATA.");
 setAnalysisData({
 palette: ['#1A1A1A', '#E5E5E5', '#8C8C8C', '#404040'],
 dof: 'f/2.8 (SHALLOW)',
 contrast: 'HIGH (12:1)',
 luminance: 'LOW-KEY'
 });
 } finally {
 setIsAnalyzing(false);
 }
 };

 const processFile = (file: File) => {
 if (!file.type.startsWith('image/')) {
 setError("Only images can be used as catalysts.");
 return;
 }
 setError(null);
 const reader = new FileReader();
 reader.onload = (e) => {
 const result = e.target?.result as string;
 const base64 = result.split(',')[1];
 setCatalyst({ url: result, base64, mimeType: file.type });
 analyzeCatalyst(base64, file.type);
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

 const handleGenerate = async () => {
 if (!prompt) return;
 setIsGenerating(true);
 setError(null);
 setResultUrl(null);
 setLogs([]);
 addLog("INITIALIZING SYNTHESIS PROTOCOL...");

 try {
 const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
 
 if (generationType === 'video') {
 addLog("ALLOCATING VEO-3.1-FAST COMPUTE...");
 
 const videoParams: any = {
 model: 'veo-3.1-fast-generate-preview',
 prompt: prompt,
 config: {
 numberOfVideos: 1,
 resolution: '720p',
 aspectRatio: aspectRatio === '1:1' ? '16:9' : aspectRatio
 }
 };

 if (catalyst) {
 addLog("INJECTING CATALYST IMAGE DATA...");
 videoParams.image = {
 imageBytes: catalyst.base64,
 mimeType: catalyst.mimeType
 };
 }

 let operation = await ai.models.generateVideos(videoParams);
 addLog("SYNTHESIS IN PROGRESS. AWAITING RENDER...");

 while (!operation.done) {
 await new Promise(resolve => setTimeout(resolve, 10000));
 operation = await ai.operations.getVideosOperation({ operation: operation });
 addLog("POLLING RENDER STATUS... [ACTIVE]");
 }

 const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
 if (downloadLink) {
 setResultUrl(downloadLink);
 addLog("RENDER COMPLETE. OUTPUT VAT READY.");
 } else {
 throw new Error("Failed to get video URL");
 }
 } else {
 // Image or Anime
 addLog("ALLOCATING GEMINI-3.1-FLASH-IMAGE COMPUTE...");
 const model = 'gemini-3.1-flash-image-preview';
 const finalPrompt = generationType === 'anime' ? `Anime style, high quality, masterpiece: ${prompt}` : prompt;
 
 let contents: any = finalPrompt;
 
 if (catalyst) {
 addLog("INJECTING CATALYST IMAGE DATA...");
 contents = {
 parts: [
 { inlineData: { data: catalyst.base64, mimeType: catalyst.mimeType } },
 { text: finalPrompt }
 ]
 };
 }

 const response = await ai.models.generateContent({
 model: model,
 contents: contents,
 config: {
 imageConfig: {
 aspectRatio: aspectRatio,
 imageSize:"1K"
 }
 }
 });

 const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
 if (imagePart?.inlineData) {
 setResultUrl(`data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`);
 addLog("RENDER COMPLETE. OUTPUT VAT READY.");
 } else {
 throw new Error("Failed to generate image");
 }
 }
 } catch (err: any) {
 console.error("Generation error:", err);
 setError(err.message ||"Failed to generate content.");
 addLog(`ERR: ${err.message ||"SYNTHESIS FAILED"}`);
 } finally {
 setIsGenerating(false);
 }
 };

 return (
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
 {/* LEFT COLUMN: STAGES 01 & 02 */}
 <div className="lg:col-span-4 space-y-12">
 
 {/* STAGE 01: CATALYST INGESTION */}
 <div className="space-y-6">
 <div className="flex items-center gap-3 mb-4 border-b border/10 pb-4">
 <h2 className="text-3xl font-serif italic text tracking-tight">Stage 01 // Catalyst Ingestion</h2>
 {catalyst && (
 <button onClick={() => { setCatalyst(null); setAnalysisData(null); }} className="ml-auto text-[10px] uppercase tracking-widest text/50 hover:text transition-colors flex items-center gap-1">
 <X size={12} /> Clear
 </button>
 )}
 </div>

 {!catalyst ? (
 <div 
 className={`border border-dashed transition-all duration-300 flex flex-col items-center justify-center p-8 aspect-video cursor-pointer
 ${dragActive ? 'border/50 bg/5' : 'border/20 hover:border/40 hover:bg/5'}`}
 onDragEnter={handleDrag}
 onDragLeave={handleDrag}
 onDragOver={handleDrag}
 onDrop={handleDrop}
 onClick={() => fileInputRef.current?.click()}
 >
 <input ref={fileInputRef} type="file"accept="image/*"className="hidden"onChange={handleChange} />
 <Upload size={20} className={`mb-3 ${dragActive ? 'text' : 'text/50'}`} />
 <p className="text-[10px] uppercase tracking-[0.2em] text/70 text-center">Drop Reference Artifact</p>
 </div>
 ) : (
 <div className="grid grid-cols-2 gap-4">
 <div className="relative aspect-square bg-black border border/20 overflow-hidden">
 <img src={catalyst.url} alt="Catalyst"className={`w-full h-full object-cover transition-all duration-1000 ${isAnalyzing ? 'grayscale contrast-150 brightness-75' : 'grayscale-0'}`} />
 {isAnalyzing && (
 <div className="absolute inset-0 pointer-events-none">
 <div className="absolute inset-0 bg/10 mix-blend-overlay"/>
 <motion.div 
 animate={{ top: ['0%', '100%', '0%'] }} 
 transition={{ duration: 2, repeat: Infinity, ease:"linear"}}
 className="absolute left-0 right-0 h-[1px] bg/50"
 />
 </div>
 )}
 </div>
 <div className="flex flex-col justify-center space-y-3">
 {isAnalyzing ? (
 <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text/50">
 <Loader2 size={12} className="animate-spin"/>
 <span>Analyzing...</span>
 </div>
 ) : analysisData ? (
 <div className="space-y-3 text-[9px] uppercase tracking-[0.15em] font-mono text/70">
 <div>
 <span className="text/40 block mb-1">Palette</span>
 <div className="flex gap-1">
 {analysisData.palette.map((color: string, i: number) => (
 <div key={i} className="w-4 h-4 border border/20"style={{ backgroundColor: color }} />
 ))}
 </div>
 </div>
 <div>
 <span className="text/40 block">DOF</span>
 <span>{analysisData.dof}</span>
 </div>
 <div>
 <span className="text/40 block">Contrast</span>
 <span>{analysisData.contrast}</span>
 </div>
 </div>
 ) : null}
 </div>
 </div>
 )}
 </div>

 {/* STAGE 02: SYNTHESIS DIRECTIVES */}
 <div className="space-y-6">
 <div className="flex items-center gap-3 mb-4 border-b border/10 pb-4">
 <h2 className="text-3xl font-serif italic text tracking-tight">Stage 02 // Synthesis Directives</h2>
 </div>

 <div className="space-y-4">
 <div>
 <h3 className="text-[9px] uppercase tracking-[0.2em] text/50 mb-2 font-mono">Narrative Parameters</h3>
 <div className="relative">
 <div className="absolute top-3 left-3 text/30 font-mono text-xs">{'>'}</div>
 <textarea 
 value={prompt}
 onChange={(e) => setPrompt(e.target.value)}
 placeholder="Enter synthesis directives..."
 className="w-full bg border border/20 p-3 pl-8 font-mono text-xs text focus:outline-none focus:border/50 min-h-[120px] resize-none"
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <h3 className="text-[9px] uppercase tracking-[0.2em] text/50 mb-2 font-mono">Mode</h3>
 <div className="flex border border/20 bg">
 <button 
 onClick={() => setGenerationType('video')}
 className={`flex-1 py-1.5 text-[9px] uppercase tracking-widest transition-colors ${generationType === 'video' ? 'bg/10 text' : 'text/50 hover:bg/5'}`}
 >
 Video
 </button>
 <div className="w-px bg/20"/>
 <button 
 onClick={() => setGenerationType('image')}
 className={`flex-1 py-1.5 text-[9px] uppercase tracking-widest transition-colors ${generationType === 'image' ? 'bg/10 text' : 'text/50 hover:bg/5'}`}
 >
 Image
 </button>
 <div className="w-px bg/20"/>
 <button 
 onClick={() => setGenerationType('anime')}
 className={`flex-1 py-1.5 text-[9px] uppercase tracking-widest transition-colors ${generationType === 'anime' ? 'bg/10 text' : 'text/50 hover:bg/5'}`}
 >
 Anime
 </button>
 </div>
 </div>

 <div>
 <h3 className="text-[9px] uppercase tracking-[0.2em] text/50 mb-2 font-mono">Frame Boundaries</h3>
 <div className="flex border border/20 bg">
 <button 
 onClick={() => setAspectRatio('16:9')}
 className={`flex-1 py-1.5 text-[9px] uppercase tracking-widest transition-colors ${aspectRatio === '16:9' ? 'bg/10 text' : 'text/50 hover:bg/5'}`}
 >
 16:9
 </button>
 <div className="w-px bg/20"/>
 <button 
 onClick={() => setAspectRatio('9:16')}
 className={`flex-1 py-1.5 text-[9px] uppercase tracking-widest transition-colors ${aspectRatio === '9:16' ? 'bg/10 text' : 'text/50 hover:bg/5'}`}
 >
 9:16
 </button>
 <div className="w-px bg/20"/>
 <button 
 onClick={() => setAspectRatio('1:1')}
 disabled={generationType === 'video'}
 className={`flex-1 py-1.5 text-[9px] uppercase tracking-widest transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${aspectRatio === '1:1' ? 'bg/10 text' : 'text/50 hover:bg/5'}`}
 >
 1:1
 </button>
 </div>
 </div>
 </div>

 <div className="pt-6">
 <button 
 onClick={handleGenerate}
 disabled={isGenerating || !prompt}
 className={`w-full py-3 text-[10px] uppercase tracking-[0.3em] font-bold transition-all flex items-center justify-center gap-2 border
 ${isGenerating || !prompt ? 'border/10 text/30 cursor-not-allowed' : 'border/50 text hover:bg/10'}`}
 >
 {isGenerating ? (
 <><Loader2 size={14} className="animate-spin"/> SYNTHESIZING...</>
 ) : (
 <>[ INITIALIZE SYNTHESIS ]</>
 )}
 </button>
 </div>
 </div>
 </div>
 </div>

 {/* RIGHT COLUMN: STAGE 03 */}
 <div className="lg:col-span-8 space-y-6 flex flex-col">
 <div className="flex items-center gap-3 mb-4 border-b border/10 pb-4">
 <h2 className="text-3xl font-serif italic text tracking-tight">Stage 03 // The Output Vat</h2>
 </div>

 <div className="flex-1 min-h-[600px] border border/20 bg relative flex flex-col overflow-hidden">
 
 {/* Background Grid / CRT Effect */}
 <div className="absolute inset-0 pointer-events-none opacity-20"
 style={{ backgroundImage: 'radial-gradient(#F2F1ED 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
 <div className="absolute inset-0 pointer-events-none bg bg-[length:100%_4px]"/>

 {error && (
 <div className="absolute inset-0 z-10 flex items-center justify-center p-8 text-center bg-red-950/20 backdrop-blur-sm">
 <p className="text-red-400 font-mono text-xs uppercase tracking-widest">{error}</p>
 </div>
 )}

 {!isGenerating && !resultUrl && !error && (
 <div className="absolute inset-0 flex items-center justify-center text/30 font-mono text-[10px] uppercase tracking-[0.3em]">
 [ VAT INACTIVE // AWAITING DIRECTIVES ]
 </div>
 )}

 {resultUrl && !isGenerating && (
 <motion.div 
 initial={{ opacity: 0, scale: 0.98 }}
 animate={{ opacity: 1, scale: 1 }}
 className="absolute inset-0 z-10 flex items-center justify-center p-8"
 >
 {generationType === 'video' ? (
 <video 
 src={resultUrl} 
 controls 
 autoPlay 
 loop 
 className="max-w-full max-h-full object-contain border border/20"
 />
 ) : (
 <img 
 src={resultUrl} 
 alt="Generated Artifact"
 className="max-w-full max-h-full object-contain border border/20"
 />
 )}
 </motion.div>
 )}

 {/* Terminal Logs Overlay */}
 <div className="absolute bottom-0 left-0 right-0 p-4 z-20 pointer-events-none">
 <div className="max-w-xl space-y-1">
 <AnimatePresence>
 {logs.map((log, i) => (
 <motion.div
 key={i}
 initial={{ opacity: 0, x: -10 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0 }}
 className="font-mono text-[9px] text/60 uppercase tracking-widest"
 >
 {log}
 </motion.div>
 ))}
 </AnimatePresence>
 </div>
 </div>

 </div>
 </div>
 </div>
 );
};

