import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { generateSignatureImage } from '../services/geminiService';
import { AestheticSignature } from '../types';

interface Props {
 signature: AestheticSignature;
}

interface GeneratedFrame {
 url: string;
 metadata: string;
}

export const SignatureImageGenerator: React.FC<Props> = ({ signature }) => {
 const [frames, setFrames] = useState<GeneratedFrame[]>([]);
 const [loading, setLoading] = useState(false);

 const handleGenerate = async () => {
 setLoading(true);
 try {
 // Generate 4 variations in parallel
 const variations = [
 { focus:"Lighting and Atmosphere", meta:"REF_01 // APERTURE BIAS"},
 { focus:"Material and Texture", meta:"REF_02 // KINETIC BLUR"},
 { focus:"Structural Composition", meta:"REF_03 // STRUCTURAL INTEGRITY"},
 { focus:"Color and Contrast", meta:"REF_04 // CHROMATIC DISSONANCE"}
 ];

 const promises = variations.map(async (v) => {
 // We modify the signature slightly for each call to force variation
 const modifiedSignature = {
 ...signature,
 coreTrait: `Focus on ${v.focus}`
 };
 const url = await generateSignatureImage(modifiedSignature);
 return { url: url || '', metadata: v.meta };
 });

 const results = await Promise.all(promises);
 setFrames(results.filter(r => r.url !== ''));
 } catch (error) {
 console.error("Failed to generate signature images", error);
 window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
 detail: { 
 message:"Oracle Overloaded. The frequency is too high.", 
 icon: <AlertCircle size={14} className="text-red-500"/> 
 } 
 }));
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="bg-nous-base border border-nous-border p-6 h-full flex flex-col">
 <div className="flex justify-between items-center mb-6">
 <h3 className="text-2xl italic font-light">Contact Sheet</h3>
 <button
 onClick={handleGenerate}
 disabled={loading}
 className="px-4 py-2 bg-nous-base text-nous-text font-mono text-[9px] uppercase tracking-widest font-bold hover:bg-nous-base dark:hover:bg-stone-200 transition-colors flex items-center gap-2 disabled:opacity-50"
 >
 {loading ? <Loader2 className="animate-spin"size={14} /> : <Sparkles size={14} />}
 [ EXECUTE RE-SYNC ]
 </button>
 </div>
 
 <div className="flex-1">
 {frames.length > 0 ? (
 <div className="grid grid-cols-2 gap-4 h-full">
 {frames.map((frame, idx) => (
 <div key={idx} className="flex flex-col gap-2">
 <div className="aspect-square border border-nous-border overflow-hidden bg-nous-base">
 <img src={frame.url} alt={`Reference ${idx + 1}`} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"referrerPolicy="no-referrer"/>
 </div>
 <div className="font-mono text-[8px] text-nous-subtle uppercase tracking-widest">
 {frame.metadata}
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="w-full h-full min-h-[400px] border border-dashed border-nous-border bg-nous-base/50 /50 flex flex-col items-center justify-center text-nous-subtle gap-4">
 <div className="grid grid-cols-2 gap-2 opacity-20">
 <div className="w-16 h-16 border border-nous-border"/>
 <div className="w-16 h-16 border border-nous-border"/>
 <div className="w-16 h-16 border border-nous-border"/>
 <div className="w-16 h-16 border border-nous-border"/>
 </div>
 <span className="font-mono text-[9px] uppercase tracking-widest">Awaiting Synthesis Directive</span>
 </div>
 )}
 </div>
 </div>
 );
};
