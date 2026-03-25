import React from 'react';
import { ZineMetadata } from '../types';
import { Target, Type } from 'lucide-react';

export const AestheticDNA: React.FC<{ 
 metadata?: ZineMetadata;
 dna?: any;
 report?: any;
 palette?: any;
 title?: string;
}> = ({ metadata, dna, report, palette: propPalette, title }) => {
 if (!metadata && !dna && !report) return null;

 const content = metadata?.content;
 
 // Extracting aesthetic data
 const typography = content?.aesthetic_touchpoints?.filter(t => t.type === 'lexical')?.map(t => t.motif) 
 || dna?.motifs 
 || report?.keyMotifs 
 || [];
 const tone = metadata?.tone || dna?.moodCluster || report?.tone || 'Unknown';

 return (
 <div className="w-full bg-stone-50 dark:bg-stone-900 p-8 border border-stone-200 dark:border-stone-800 mt-12 relative">
 <div className="flex items-center gap-3 mb-8">
 <Target size={16} className="text-stone-500"/>
 <h3 className="font-sans text-[10px] uppercase tracking-[0.3em] font-black text-stone-900 dark:text-white">
 {title ? `${title} - Aesthetic DNA` : 'Aesthetic DNA'}
 </h3>
 </div>
 
 <div className="grid md:grid-cols-1 gap-12">
 {/* Typography */}
 <div className="space-y-4">
 <div className="flex items-center gap-2 text-stone-500">
 <Type size={14} />
 <span className="font-sans text-[8px] uppercase tracking-widest font-black">Typographic Anchors</span>
 </div>
 <div className="space-y-2">
 <p className="font-serif italic text-xl text-stone-800 dark:text-stone-200">
 Tone: <span className="font-bold">{tone}</span>
 </p>
 {typography.length > 0 ? (
 <ul className="list-disc list-inside font-mono text-xs text-stone-500">
 {typography.slice(0, 3).map((t: any, i: number) => (
 <li key={i}>{typeof t === 'string' ? t : t.motif}</li>
 ))}
 </ul>
 ) : (
 <span className="font-serif italic text-sm text-stone-400">No specific typography anchors.</span>
 )}
 </div>
 </div>
 </div>
 </div>
 );
};
