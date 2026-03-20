import React from 'react';
import { ZineGenerationOptions, UserProfile } from '../types';
import { SUPERINTELLIGENCE_PROMPTS } from '../constants';

interface ZineConfigurationProps {
  zineOptions: ZineGenerationOptions;
  setZineOptions: (options: ZineGenerationOptions) => void;
  profile?: UserProfile | null;
  onSelectPrompt?: (prompt: string) => void;
}

export const ZineConfiguration: React.FC<ZineConfigurationProps> = ({ zineOptions, setZineOptions, profile, onSelectPrompt }) => {
  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-2">
          <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/60 dark:text-white/60">Style</label>
          <select 
            value={zineOptions.style} 
            onChange={(e) => setZineOptions({...zineOptions, style: e.target.value as any})}
            className="bg-transparent border-b border-primary/20 dark:border-white/20 text-sm font-sans text-primary dark:text-white focus:outline-none focus:border-primary dark:focus:border-white pb-2 cursor-pointer"
          >
            <option value="minimalist">Minimalist</option>
            <option value="maximalist">Maximalist</option>
            <option value="experimental">Experimental</option>
            <option value="balanced">Balanced</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/60 dark:text-white/60">Theme</label>
          <select 
            value={zineOptions.theme} 
            onChange={(e) => setZineOptions({...zineOptions, theme: e.target.value as any})}
            className="bg-transparent border-b border-primary/20 dark:border-white/20 text-sm font-sans text-primary dark:text-white focus:outline-none focus:border-primary dark:focus:border-white pb-2 cursor-pointer"
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="vibrant">Vibrant</option>
            <option value="muted">Muted</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/60 dark:text-white/60">Content Focus</label>
          <select 
            value={zineOptions.contentFocus} 
            onChange={(e) => setZineOptions({...zineOptions, contentFocus: e.target.value as any})}
            className="bg-transparent border-b border-primary/20 dark:border-white/20 text-sm font-sans text-primary dark:text-white focus:outline-none focus:border-primary dark:focus:border-white pb-2 cursor-pointer"
          >
            <option value="visual-heavy">Visual-heavy</option>
            <option value="text-heavy">Text-heavy</option>
            <option value="balanced">Balanced</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/60 dark:text-white/60">Aesthetic Tone</label>
          <select 
            value={zineOptions.aestheticTone || ''} 
            onChange={(e) => setZineOptions({...zineOptions, aestheticTone: e.target.value as any})}
            className="bg-transparent border-b border-primary/20 dark:border-white/20 text-sm font-sans text-primary dark:text-white focus:outline-none focus:border-primary dark:focus:border-white pb-2 cursor-pointer"
          >
            <option value="">Select Tone</option>
            <option value="Cinematic">Cinematic</option>
            <option value="Editorial">Editorial</option>
            <option value="Dreamy">Dreamy</option>
            <option value="Industrial">Industrial</option>
            <option value="Noir">Noir</option>
          </select>
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/60 dark:text-white/60">Art Style</label>
          <input 
            type="text"
            value={zineOptions.artStyle || ''}
            onChange={(e) => setZineOptions({...zineOptions, artStyle: e.target.value})}
            placeholder="e.g. Bauhaus, Cyberpunk, Impressionist..."
            className="bg-transparent border-b border-primary/20 dark:border-white/20 text-sm font-sans text-primary dark:text-white focus:outline-none focus:border-primary dark:focus:border-white pb-2 w-full"
          />
        </div>
      </div>
      
      <div className="pt-8 border-t border-primary/10 dark:border-white/10">
        <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/60 dark:text-white/60 mb-4 block">Superintelligence Prompts</label>
        <div className="flex flex-wrap gap-2">
          {SUPERINTELLIGENCE_PROMPTS.map((p, i) => (
            <button 
              key={i}
              onClick={() => onSelectPrompt && onSelectPrompt(p.prompt)}
              className="text-[10px] uppercase tracking-[0.1em] px-3 py-1.5 border border-primary/20 dark:border-white/20 text-primary dark:text-white hover:bg-primary hover:text-white dark:hover:bg-white dark:hover:text-primary transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
