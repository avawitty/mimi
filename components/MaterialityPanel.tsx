import React from 'react';
import { MaterialityConfig } from '../types';
import { Layers, Type as FontIcon, SlidersHorizontal } from 'lucide-react';

interface MaterialityPanelProps {
  config: MaterialityConfig;
  onChange: (config: MaterialityConfig) => void;
}

export const MaterialityPanel: React.FC<MaterialityPanelProps> = ({ config, onChange }) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-3">
        <span className="font-sans text-[7px] uppercase tracking-widest font-black text-stone-400 flex items-center gap-2">
          <Layers size={12} /> Paper Stock
        </span>
        <div className="grid grid-cols-2 gap-2">
          {(['newsprint', 'cold-press', 'vellum', 'raw-cardboard'] as const).map((stock) => (
            <button
              key={stock}
              onClick={() => onChange({ ...config, paperStock: stock })}
              className={`py-2 border rounded-sm text-[8px] font-sans font-black uppercase transition-all ${
                config.paperStock === stock
                  ? 'bg-nous-text text-white dark:bg-white dark:text-black border-transparent'
                  : 'border-stone-200 dark:border-stone-800 text-stone-400'
              }`}
            >
              {stock.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <span className="font-sans text-[7px] uppercase tracking-widest font-black text-stone-400 flex items-center gap-2">
          <FontIcon size={12} /> Typography Lineage
        </span>
        <div className="grid gap-2">
          {(['brutalist', 'editorial-serif', 'technical-mono'] as const).map((lineage) => (
            <button
              key={lineage}
              onClick={() => onChange({ ...config, typographyLineage: lineage })}
              className={`py-3 px-4 border rounded-sm text-left text-[10px] font-sans font-black uppercase transition-all ${
                config.typographyLineage === lineage
                  ? 'bg-nous-text text-white dark:bg-white dark:text-black border-transparent'
                  : 'border-stone-200 dark:border-stone-800 text-stone-400'
              }`}
            >
              {lineage.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <span className="font-sans text-[7px] uppercase tracking-widest font-black text-stone-400 flex items-center gap-2">
          <SlidersHorizontal size={12} /> Negative Space Density
        </span>
        <input
          type="range"
          min="1"
          max="10"
          value={config.negativeSpaceDensity}
          onChange={(e) => onChange({ ...config, negativeSpaceDensity: parseInt(e.target.value) })}
          className="w-full h-1 bg-stone-100 dark:bg-stone-800 accent-nous-text dark:accent-white"
        />
        <div className="flex justify-between text-[8px] font-mono text-stone-400 uppercase">
          <span>Sparse</span>
          <span>{config.negativeSpaceDensity}</span>
          <span>Dense</span>
        </div>
      </div>
    </div>
  );
};
