import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Video, Image as ImageIcon, Loader2, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface ContentAnalyzerModalProps {
 onClose: () => void;
}

export const ContentAnalyzerModal: React.FC<ContentAnalyzerModalProps> = ({ onClose }) => {
 const [file, setFile] = useState<{ data: string; mimeType: string; type: 'video' | 'image' } | null>(null);
 const [isAnalyzing, setIsAnalyzing] = useState(false);
 const [analysisResult, setAnalysisResult] = useState<{ analysis: string; actionPlan: string[] } | null>(null);
 const fileInputRef = useRef<HTMLInputElement>(null);

 const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
 if (e.target.files && e.target.files[0]) {
 const f = e.target.files[0];
 const type = f.type.startsWith('video') ? 'video' : 'image';
 
 const data = await new Promise<string>((resolve, reject) => {
 const reader = new FileReader();
 reader.onloadend = () => resolve(reader.result as string);
 reader.onerror = reject;
 reader.readAsDataURL(f);
 });

 setFile({ data, mimeType: f.type, type });
 setAnalysisResult(null);
 }
 };

 const handleAnalyze = async () => {
 if (!file) return;
 setIsAnalyzing(true);
 try {
 const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
 
 const base64Data = file.data.split(',')[1];
 
 const prompt = `Analyze this ${file.type} content. Provide a detailed content analysis and a step-by-step content action plan. Format your response as JSON with two keys:"analysis"(string) and"actionPlan"(array of strings).`;

 const response = await ai.models.generateContent({
 model: 'gemini-3.1-pro-preview',
 contents: {
 parts: [
 { inlineData: { data: base64Data, mimeType: file.mimeType } },
 { text: prompt }
 ]
 },
 config: {
 responseMimeType: 'application/json',
 }
 });

 const resultText = response.text;
 if (resultText) {
 const parsed = JSON.parse(resultText);
 setAnalysisResult(parsed);
 }
 } catch (error) {
 console.error("Analysis failed:", error);
 alert("Failed to analyze content. Please try again.");
 } finally {
 setIsAnalyzing(false);
 }
 };

 return (
 <AnimatePresence>
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-[100] flex justify-end bg-black/20 backdrop-blur-sm"
 onClick={onClose}
 >
 <motion.div
 initial={{ x: '100%' }}
 animate={{ x: 0 }}
 exit={{ x: '100%' }}
 transition={{ type: 'spring', damping: 25, stiffness: 200 }}
 onClick={(e) => e.stopPropagation()}
 className="bg w-full max-w-md h-full flex flex-col border-l border-stone-300"
 >
 <div className="p-6 border-b border-stone-300 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <h3 className="font-mono text-[10px] uppercase tracking-widest text-stone-800">Ingestion Room</h3>
 </div>
 <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-800 transition-colors">
 <X size={16} />
 </button>
 </div>
 
 <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
 {!analysisResult ? (
 <div className="flex flex-col h-full">
 <h4 className="text-2xl font-serif italic text-stone-800 mb-2">Artifact Analysis</h4>
 <p className="text-stone-500 text-xs font-mono uppercase tracking-widest mb-8">Upload media for deep diagnostic</p>
 
 {!file ? (
 <div 
 className="w-full border border-dashed border-stone-300 p-12 hover:border-stone-800 hover:bg-stone-100 transition-all cursor-pointer group text-center"
 onClick={() => fileInputRef.current?.click()}
 >
 <Upload className="mx-auto mb-4 text-stone-400 group-hover:text-stone-800 transition-colors"size={24} />
 <p className="text-[10px] font-mono uppercase tracking-widest text-stone-600">Ingest Artifact (Drag & Drop)</p>
 <input type="file"ref={fileInputRef} className="hidden"accept="image/*,video/*"onChange={handleFileChange} />
 </div>
 ) : (
 <div className="w-full flex flex-col flex-1">
 <div className="relative w-full aspect-square bg-stone-100 border border-stone-300 mb-6 flex items-center justify-center overflow-hidden">
 {file.type === 'image' ? (
 <img src={file.data} alt="Upload"className="w-full h-full object-cover"/>
 ) : (
 <div className="flex flex-col items-center text-stone-400">
 <Video size={32} className="mb-2"/>
 <span className="font-mono text-[10px] uppercase tracking-widest">Video Ready</span>
 </div>
 )}
 <button 
 onClick={() => setFile(null)} 
 className="absolute top-2 right-2 p-1.5 bg-black/50 text-white hover:bg-black transition-colors"
 >
 <X size={12} />
 </button>
 </div>
 
 <div className="mt-auto">
 <button
 onClick={handleAnalyze}
 disabled={isAnalyzing}
 className="w-full py-4 bg-stone-900 text-white font-mono text-[10px] tracking-widest uppercase hover:bg-black transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
 >
 {isAnalyzing ? (
 <><Loader2 size={14} className="animate-spin"/> [ ANALYZING... ]</>
 ) : (
 <>[ INITIATE DIAGNOSTIC ]</>
 )}
 </button>
 </div>
 </div>
 )}
 </div>
 ) : (
 <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
 <div className="border border-stone-300 p-6">
 <h4 className="text-[10px] font-mono tracking-widest uppercase text-stone-500 mb-4 border-b border-stone-300 pb-2">
 Diagnostic Read
 </h4>
 <p className="text-stone-800 font-serif text-sm leading-relaxed">
 {analysisResult.analysis}
 </p>
 </div>
 
 <div className="border border-stone-900 bg-stone-900 text-white p-6">
 <h4 className="text-[10px] font-mono tracking-widest uppercase text-stone-400 mb-4 border-b border-stone-700 pb-2">
 Actionable Directives
 </h4>
 <ul className="space-y-4">
 {analysisResult.actionPlan.map((action, idx) => (
 <li key={idx} className="flex items-start gap-3 text-xs font-mono">
 <span className="text-stone-500 mt-0.5">✦</span>
 <span className="leading-relaxed">{action}</span>
 </li>
 ))}
 </ul>
 </div>
 
 <div className="flex justify-center pt-4">
 <button 
 onClick={() => { setFile(null); setAnalysisResult(null); }}
 className="text-[10px] font-mono tracking-widest uppercase text-stone-500 hover:text-stone-800 transition-colors"
 >
 [ INGEST ANOTHER ARTIFACT ]
 </button>
 </div>
 </div>
 )}
 </div>
 </motion.div>
 </motion.div>
 </AnimatePresence>
 );
};
