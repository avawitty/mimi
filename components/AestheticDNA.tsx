import React from 'react';
import { ZineMetadata } from '../types';
import { Target, Palette, Type, Plus } from 'lucide-react';

export const AestheticDNA: React.FC<{ metadata: ZineMetadata }> = ({ metadata }) => {
  const content = metadata.content;
  
  // Extracting aesthetic data
  const palette = content.visual_guidance?.strict_palette || [];
  const typography = content.aesthetic_touchpoints?.filter(t => t.type === 'lexical') || [];
  const tone = metadata.tone;

  return (
    <div className="w-full bg-stone-50 dark:bg-stone-900 p-8 border border-stone-200 dark:border-stone-800 rounded-sm mt-12 relative">
      <div className="flex items-center gap-3 mb-8">
        <Target size={16} className="text-emerald-500" />
        <h3 className="font-sans text-[10px] uppercase tracking-[0.3em] font-black text-stone-900 dark:text-white">Aesthetic DNA</h3>
      </div>
      
      <div className="grid md:grid-cols-2 gap-12">
        {/* Color Palette */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-stone-500">
            <Palette size={14} />
            <span className="font-sans text-[8px] uppercase tracking-widest font-black">Chromatic Registry</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {palette.length > 0 ? (
              palette.map((color, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full border border-stone-200 shadow-inner" style={{ backgroundColor: color }} />
                  <span className="font-mono text-[7px] uppercase text-stone-400">{color}</span>
                </div>
              ))
            ) : (
              <span className="font-serif italic text-sm text-stone-400">No specific palette defined.</span>
            )}
          </div>
        </div>

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
                {typography.slice(0, 3).map((t, i) => (
                  <li key={i}>{t.motif}</li>
                ))}
              </ul>
            ) : (
              <span className="font-serif italic text-sm text-stone-400">No specific typography anchors.</span>
            )}
          </div>
        </div>
      </div>

      {/* Screenshot Layout */}
      <div className="flex gap-4 mt-12">
        <div className="w-32 h-24 border border-blue-400 p-2">
            <span className="text-blue-400 text-[10px]">pallet here</span>
        </div>
        <div className="w-32 h-24 border border-blue-400"></div>
        <button className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center ml-auto">
            <Plus size={24} />
        </button>
      </div>
    </div>
  );
};
