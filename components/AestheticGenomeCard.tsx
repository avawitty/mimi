import React from 'react';
import { AestheticSignature } from '../types';

export const AestheticGenomeCard: React.FC<{ signature: AestheticSignature }> = ({ signature }) => {
  const maxFrequency = Math.max(...signature.motifEvolution.map(m => m.frequency), 1);

  return (
    <div className="bg-stone-900 border border-stone-700 p-8 rounded-xl text-stone-100 font-serif">
      <div className="border-b border-stone-700 pb-4 mb-6">
        <h3 className="text-2xl italic">Aesthetic Genome</h3>
        <p className="text-stone-400 text-sm uppercase tracking-widest">Molecular Signature Analysis</p>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-stone-500 text-xs uppercase mb-1">Primary Axis</label>
          <p className="text-xl font-light">{signature.primaryAxis}</p>
        </div>
        <div>
          <label className="block text-stone-500 text-xs uppercase mb-1">Secondary Axis</label>
          <p className="text-xl font-light">{signature.secondaryAxis}</p>
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-stone-500 text-xs uppercase mb-3">Motif Frequency Distribution</label>
        <div className="space-y-2">
          {signature.motifEvolution.slice(0, 5).map((m, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-stone-400 w-20 truncate">{m.motif}</span>
              <div className="flex-1 h-2 bg-stone-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-stone-500 rounded-full" 
                  style={{ width: `${(m.frequency / maxFrequency) * 100}%` }}
                />
              </div>
              <span className="text-xs text-stone-500 w-8 text-right">{m.frequency}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-stone-400 text-xs italic border-t border-stone-800 pt-4">
        Last sequenced: {new Date(signature.generatedAt).toLocaleDateString()}
      </div>
    </div>
  );
};
