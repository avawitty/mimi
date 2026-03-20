import React from 'react';

export const CodexSignal = ({ entropy, density }: { entropy: number, density: number }) => {
  const mode =
    entropy > 0.6
      ? "Exploratory"
      : density > 0.6
      ? "Focused"
      : "Balanced";

  return (
    <div className="text-[10px] font-mono uppercase tracking-widest text-stone-400 border border-[#D4D1C9] p-4 bg-white">
      <div className="mb-2 font-bold text-stone-600">Codex State</div>
      <div className="flex justify-between">
        <span>Entropy:</span> <span>{entropy.toFixed(2)}</span>
      </div>
      <div className="flex justify-between">
        <span>Density:</span> <span>{density.toFixed(2)}</span>
      </div>
      <div className="mt-2 pt-2 border-t border-[#D4D1C9] italic text-stone-600">{mode}</div>
    </div>
  );
};
