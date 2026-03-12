import React from 'react';
import { AestheticSignature } from '../types';

export const AestheticGenomeCard: React.FC<{ signature: AestheticSignature }> = ({ signature }) => {
  return (
    <div className="bg-stone-900 border border-stone-700 p-8 rounded-xl text-stone-100 font-serif">
      <div className="border-b border-stone-700 pb-4 mb-6">
        <h3 className="text-2xl italic">Aesthetic Genome</h3>
        <p className="text-stone-400 text-sm uppercase tracking-widest">Scientific Report</p>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-stone-500 text-xs uppercase">Primary Axis</label>
          <p className="text-xl">{signature.primaryAxis}</p>
        </div>
        <div>
          <label className="block text-stone-500 text-xs uppercase">Secondary Axis</label>
          <p className="text-xl">{signature.secondaryAxis}</p>
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-stone-500 text-xs uppercase mb-2">Motifs</label>
        <div className="flex flex-wrap gap-2">
          {signature.motifs.map(m => (
            <span key={m} className="bg-stone-800 px-3 py-1 rounded-full text-sm">{m}</span>
          ))}
        </div>
      </div>

      <div className="text-stone-400 text-sm italic">
        Generated: {new Date(signature.generatedAt).toLocaleDateString()}
      </div>
    </div>
  );
};
