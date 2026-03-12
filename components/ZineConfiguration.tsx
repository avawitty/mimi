import React from 'react';
import { ZineGenerationOptions } from '../types';

interface ZineConfigurationProps {
  zineOptions: ZineGenerationOptions;
  setZineOptions: (options: ZineGenerationOptions) => void;
}

export const ZineConfiguration: React.FC<ZineConfigurationProps> = ({ zineOptions, setZineOptions }) => {
  return (
    <div className="flex items-center gap-4 px-1 py-0 bg-transparent flex-wrap">
        <select 
          value={zineOptions.style} 
          onChange={(e) => setZineOptions({...zineOptions, style: e.target.value as any})}
          className="bg-transparent text-[7px] uppercase tracking-[0.2em] text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 focus:outline-none cursor-pointer"
        >
          <option value="minimalist">Minimalist</option>
          <option value="maximalist">Maximalist</option>
          <option value="experimental">Experimental</option>
          <option value="balanced">Balanced</option>
        </select>
        <select 
          value={zineOptions.theme} 
          onChange={(e) => setZineOptions({...zineOptions, theme: e.target.value as any})}
          className="bg-transparent text-[7px] uppercase tracking-[0.2em] text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 focus:outline-none cursor-pointer"
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
          <option value="vibrant">Vibrant</option>
          <option value="muted">Muted</option>
        </select>
        <select 
          value={zineOptions.contentFocus} 
          onChange={(e) => setZineOptions({...zineOptions, contentFocus: e.target.value as any})}
          className="bg-transparent text-[7px] uppercase tracking-[0.2em] text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 focus:outline-none cursor-pointer"
        >
          <option value="visual-heavy">Visual-heavy</option>
          <option value="text-heavy">Text-heavy</option>
          <option value="balanced">Balanced</option>
        </select>
        <select 
          value={zineOptions.aestheticTone || ''} 
          onChange={(e) => setZineOptions({...zineOptions, aestheticTone: e.target.value as any})}
          className="bg-transparent text-[7px] uppercase tracking-[0.2em] text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 focus:outline-none cursor-pointer"
        >
          <option value="">Aesthetic Tone</option>
          <option value="Cinematic">Cinematic</option>
          <option value="Editorial">Editorial</option>
          <option value="Dreamy">Dreamy</option>
          <option value="Industrial">Industrial</option>
          <option value="Noir">Noir</option>
        </select>
        <input 
          type="text"
          value={zineOptions.artStyle || ''}
          onChange={(e) => setZineOptions({...zineOptions, artStyle: e.target.value})}
          placeholder="Art Style..."
          className="bg-transparent text-[7px] uppercase tracking-[0.2em] text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 focus:outline-none cursor-pointer w-24"
        />
    </div>
  );
};
