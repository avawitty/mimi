import React from 'react';
import { SovereignIdentityCard } from '../types';

export const SovereignIdentityCardView: React.FC<{ card: SovereignIdentityCard }> = ({ card }) => {
  return (
    <div className="flex flex-col items-center gap-6 p-8 bg-stone-950 text-stone-100 rounded-xl">
      <h2 className="font-serif text-2xl italic">Sovereign Identity Card</h2>
      <div 
        className="w-full max-w-sm aspect-[1.586/1] bg-white rounded-lg shadow-xl overflow-hidden"
        dangerouslySetInnerHTML={{ __html: card.svgVisual }}
      />
      <div className="grid grid-cols-1 gap-4 w-full">
        {card.aestheticCoordinates.map((coord, i) => (
          <div key={i} className="border-b border-stone-800 pb-2">
            <h3 className="font-sans text-xs uppercase tracking-widest font-bold text-stone-400">{coord.name}</h3>
            <p className="font-serif italic text-sm text-stone-200">{coord.description}</p>
          </div>
        ))}
      </div>
      <div className="text-xs font-mono text-stone-500">
        Taste Drift: {card.tasteDriftPercentage.toFixed(2)}%
      </div>
    </div>
  );
};
