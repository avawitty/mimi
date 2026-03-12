import React from 'react';
import { Target, CheckCircle, AlertTriangle, FileText } from 'lucide-react';

export const VisualLanguageReflection: React.FC<{ 
    resonanceScore: string, 
    reflection: string, 
    archivalRedirects?: string[],
    resonanceClusters?: string[],
    divergentSignals?: string[]
}> = ({ resonanceScore, reflection, archivalRedirects, resonanceClusters, divergentSignals }) => {
  return (
    <div className="w-full max-w-2xl bg-[#FDFBF7] dark:bg-[#080808] border border-blue-400 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Target size={20} className="text-emerald-500" />
          <h2 className="font-sans text-[10px] uppercase tracking-[0.3em] font-black text-emerald-600">Visual Language Reflection</h2>
        </div>
        
        <p className="font-serif italic text-stone-600 dark:text-stone-400 mb-8">
          Audit your visual artifacts against your stated core logic.
        </p>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="space-y-8">
            <div className="border border-stone-200 dark:border-stone-800 p-6">
              <span className="font-sans text-[8px] uppercase tracking-widest text-stone-400 block mb-2">Resonance Score</span>
              <div className="font-serif italic text-6xl text-stone-900 dark:text-white">{resonanceScore}</div>
            </div>
            <div className="border border-stone-200 dark:border-stone-800 p-6">
              <span className="font-sans text-[8px] uppercase tracking-widest text-stone-400 block mb-2">Generated Reflection</span>
              <p className="font-serif italic text-stone-800 dark:text-stone-200">"{reflection}"</p>
            </div>
            {archivalRedirects && (
                <div className="border border-stone-200 dark:border-stone-800 p-6 flex items-center gap-3 text-emerald-600">
                  <FileText size={16} />
                  <span className="font-sans text-[9px] uppercase tracking-widest font-black">Archival Redirects</span>
                </div>
            )}
          </div>
          <div className="space-y-8">
            {resonanceClusters && (
                <div className="flex items-center gap-3 text-emerald-600">
                  <CheckCircle size={16} />
                  <span className="font-sans text-[9px] uppercase tracking-widest font-black">Thematic Parallels</span>
                </div>
            )}
            {divergentSignals && (
                <div className="flex items-center gap-3 text-orange-500">
                  <AlertTriangle size={16} />
                  <span className="font-sans text-[9px] uppercase tracking-widest font-black">Divergent Signals</span>
                </div>
            )}
          </div>
        </div>
    </div>
  );
};
