import React from 'react';
import { MaterialityConfig } from '../types';
import { SemanticSteps } from './SemanticSteps';
import { Layers, Type as FontIcon, SlidersHorizontal, Palette } from 'lucide-react';

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
          <Palette size={12} /> Color Scheme
        </span>
        <div className="grid grid-cols-1 gap-2">
          {(['monochrome', 'high-contrast', 'earth-tones'] as const).map((scheme) => (
            <button
              key={scheme}
              onClick={() => onChange({ ...config, colorScheme: scheme })}
              className={`py-2 px-4 border rounded-sm text-[8px] font-sans font-black uppercase transition-all ${
                config.colorScheme === scheme
                  ? 'bg-nous-text text-white dark:bg-white dark:text-black border-transparent'
                  : 'border-stone-200 dark:border-stone-800 text-stone-400'
              }`}
            >
              {scheme.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <span className="font-sans text-[7px] uppercase tracking-widest font-black text-stone-400 flex items-center gap-2">
          <SlidersHorizontal size={12} /> Negative Space Density
        </span>
        <SemanticSteps 
          steps={[
            { label: 'Sparse', value: 1 },
            { label: 'Balanced', value: 5 },
            { label: 'Dense', value: 10 }
          ]}
          value={config.negativeSpaceDensity}
          onChange={(val) => onChange({ ...config, negativeSpaceDensity: val })}
        />
      </div>
    </div>
  );
};
