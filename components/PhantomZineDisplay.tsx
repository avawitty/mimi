import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ZinePage, EditorElement, UserProfile } from '../types';
import { AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { applyTreatment } from '../services/geminiService';

interface PhantomZineDisplayProps {
 page: ZinePage;
 profile: UserProfile;
}

export const PhantomZineDisplay: React.FC<PhantomZineDisplayProps> = ({ page, profile }) => {
 const [elements, setElements] = useState<EditorElement[]>(page.customLayout?.elements || []);

 const tailorDraft = profile?.tailorDraft;
 const fontFamily = tailorDraft?.expressionEngine?.typographyIntent?.styleDescription || 'Inter';
 const baseHex = tailorDraft?.expressionEngine?.chromaticRegistry?.baseNeutral || '#FFFFFF';
 const accentHex = tailorDraft?.expressionEngine?.chromaticRegistry?.accentSignal || '#000000';

 const fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}&display=swap`;

 const handleHarmonize = async (el: EditorElement) => {
 if (!el.content.startsWith('data:image')) return;
 
 setElements(prev => prev.map(e => e.id === el.id ? { ...e, harmonizing: true } : e));
 
 try {
 const treatment = profile.savedTreatments?.[0];
 const instruction = treatment ? (treatment.imageEditingRules || treatment.basePromptDirectives || 'Make it look editorial, high contrast, film photography style.') : 'Make it look editorial, high contrast, film photography style.';
 const mimeType = el.content.split(';')[0].split(':')[1];
 const base64 = el.content.split(',')[1];
 
 const harmonizedBase64 = await applyTreatment(base64, instruction, profile);
 
 if (harmonizedBase64) {
 const newContent = `data:${mimeType};base64,${harmonizedBase64}`;
 setElements(prev => prev.map(e => e.id === el.id ? { 
 ...e, 
 content: newContent, 
 harmonizing: false,
 aestheticViolation: { isViolation: false, reason: 'Harmonized' }
 } : e));
 } else {
 throw new Error("Harmonization failed");
 }
 } catch (error) {
 console.error("Failed to harmonize:", error);
 setElements(prev => prev.map(e => e.id === el.id ? { ...e, harmonizing: false } : e));
 }
 };

 return (
 <>
 <link href={fontUrl} rel="stylesheet"/>
 <div 
 className="relative w-full h-full bg-nous-base/50 backdrop-blur-xl border border-white/10 overflow-hidden rounded-none flex items-center justify-center p-8"
 style={{ 
 fontFamily: `'${fontFamily}', sans-serif`,
 '--zine-base-color': baseHex,
 '--zine-accent-color': accentHex,
 } as React.CSSProperties}
 >
 <div className="relative w-full max-w-2xl aspect-[3/4] bg-white"style={{ backgroundColor: 'var(--zine-base-color)' }}>
 {elements.sort((a,b) => (a.style.zIndex || 0) - (b.style.zIndex || 0)).map(el => (
 <motion.div 
 key={el.id} 
 className="absolute"
 style={{ 
 top: `${el.style.top}%`, 
 left: `${el.style.left}%`, 
 width: `${el.style.width}%`, 
 height: el.style.height ? `${el.style.height}%` : undefined, 
 rotate: `${el.style.rotation}deg`, 
 zIndex: el.style.zIndex,
 opacity: el.style.opacity
 }}
 >
 {el.type === 'image' && (
 <div className="relative w-full h-full group">
 <img src={el.content} className="w-full h-full object-cover pointer-events-none"style={{ filter: el.style.filter || 'none' }}/>
 {el.aestheticViolation?.isViolation && (
 <div className="absolute inset-0 border-2 border-red-500/50 pointer-events-none flex items-start justify-end p-2">
 <Tooltip text={el.aestheticViolation.reason}>
 <AlertCircle size={16} className="text-red-500 animate-pulse"/>
 </Tooltip>
 </div>
 )}
 {el.aestheticViolation?.isViolation && (
 <motion.button 
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 onClick={(e) => { e.stopPropagation(); handleHarmonize(el); }}
 disabled={el.harmonizing}
 className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-nous-base/90 text-white px-3 py-1.5 rounded-none text-[8px] uppercase tracking-widest font-black flex items-center gap-2 backdrop-blur-sm border border-nous-border hover:bg-nous-base transition-colors opacity-0 group-hover:opacity-100"
 >
 {el.harmonizing ? <Loader2 size={10} className="animate-spin"/> : <Sparkles size={10} className="text-nous-subtle"/>}
 {el.harmonizing ? 'Refracting...' : 'Refract to Harmonize'}
 </motion.button>
 )}
 </div>
 )}
 {el.type === 'text' && (
 <div style={{ 
 fontFamily: (el.style.fontFamily === 'serif' || el.style.fontFamily === 'sans') ? `'${fontFamily}', sans-serif` : el.style.fontFamily, 
 fontSize: `${el.style.fontSize}rem`, 
 color: el.style.color, 
 lineHeight: el.style.lineHeight, 
 fontWeight: el.style.fontWeight, 
 textAlign: el.style.textAlign as any 
 }}>
 {el.content}
 </div>
 )}
 </motion.div>
 ))}
 </div>
 </div>
 </>
 );
};
