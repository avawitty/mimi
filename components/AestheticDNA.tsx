
import React from 'react';
import { getFontSuggestions, FontSuggestion } from '../services/aestheticService';
import { ColorShard } from '../types';

interface AestheticDNAProps {
  report?: any; // Can be TasteAuditReport or ZineContent
  palette?: string[] | ColorShard[];
  title?: string;
}

export const AestheticDNA: React.FC<AestheticDNAProps> = ({ report, palette, title }) => {
  const fontSuggestions = getFontSuggestions(report || {});
  
  const formattedPalette = palette?.map(p => typeof p === 'string' ? { hex: p, name: 'Suggested' } : p) || [];

  return (
    <div className="space-y-8 p-6 bg-stone-50 dark:bg-stone-900 rounded-sm border border-stone-200 dark:border-stone-800">
      <h3 className="font-sans text-[10px] uppercase tracking-[0.3em] font-black text-stone-500">Oracle Synthesis: Aesthetic DNA</h3>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h4 className="font-serif italic text-sm text-stone-800 dark:text-stone-200 mb-4">Typography</h4>
          <div className="space-y-2">
            {fontSuggestions.map((font: FontSuggestion, i: number) => (
              <div key={i} className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest p-2 bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700">
                <span>{font.name}</span>
                <span className="opacity-50">{font.type}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="font-serif italic text-sm text-stone-800 dark:text-stone-200 mb-4">Color Palette</h4>
          <div className="flex flex-wrap gap-2">
            {formattedPalette.map((color, i) => (
              <div key={i} className="w-8 h-8 rounded-full border border-stone-200 dark:border-stone-700" style={{ backgroundColor: color.hex }} title={color.name} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
