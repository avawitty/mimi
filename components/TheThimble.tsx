import React, { useState } from 'react';
import { Search, Loader2, Copy, Check, ShoppingBag, ExternalLink } from 'lucide-react';
import { procureGarments } from '../services/geminiService';

interface SourcingTarget {
  targetArchetype: string;
  keywordBoolean: string;
  emergingDesigner: string;
  rationale: string;
}

interface TheThimbleProps {
  profile: any;
  isOpen: boolean;
}

export const TheThimble: React.FC<TheThimbleProps> = ({ profile, isOpen }) => {
  const [budget, setBudget] = useState('');
  const [objective, setObjective] = useState('');
  const [targets, setTargets] = useState<SourcingTarget[]>([]);
  const [isProcuring, setIsProcuring] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleProcure = async () => {
    if (!budget.trim()) return;
    setIsProcuring(true);
    try {
      const results = await procureGarments(profile?.tasteProfile || profile?.aestheticCore || "Unknown Taste", budget, objective);
      setTargets(results);
    } catch (error) {
      console.error("Procurement failed:", error);
    } finally {
      setIsProcuring(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const openSearch = (query: string) => {
    window.open(`https://www.grailed.com/shop?query=${encodeURIComponent(query)}`, '_blank');
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950 text-zinc-300 font-mono text-xs border-l border-zinc-900">
      <div className="p-4 border-b border-zinc-900 flex items-center justify-between bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-zinc-400" />
          <span className="font-bold tracking-widest text-zinc-100 uppercase">The Thimble</span>
        </div>
        <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Sourcing</span>
      </div>

      <div className="p-4 border-b border-zinc-900 space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-zinc-500">Sourcing Objective</label>
          <input
            type="text"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            placeholder="e.g., Winter capsule, Wedding guest, Daily uniform"
            className="w-full bg-zinc-900 border border-zinc-800 p-3 text-zinc-100 focus:outline-none focus:border-zinc-700 transition-colors"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-zinc-500">Fiscal Constraints</label>
          <input
            type="text"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="e.g., $50-$150, Uncapped, Under $300"
            className="w-full bg-zinc-900 border border-zinc-800 p-3 text-zinc-100 focus:outline-none focus:border-zinc-700 transition-colors"
            onKeyDown={(e) => e.key === 'Enter' && handleProcure()}
          />
        </div>
        
        <button
          onClick={handleProcure}
          disabled={isProcuring || !budget.trim()}
          className="w-full bg-zinc-100 text-zinc-900 p-3 font-bold uppercase tracking-widest hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isProcuring ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Procuring...</>
          ) : (
            <><Search className="w-4 h-4" /> Initialize Sourcing</>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {targets.length > 0 ? (
          <div className="space-y-6">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 border-b border-zinc-900 pb-2">
              Sourcing Targets Acquired
            </div>
            {targets.map((target, idx) => (
              <div key={idx} className="bg-zinc-900/30 border border-zinc-800 p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-zinc-100 text-sm uppercase tracking-wider">{target.targetArchetype}</h3>
                  <span className="text-[10px] text-zinc-500">TARGET 0{idx + 1}</span>
                </div>
                
                <div className="space-y-1">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500">Boolean Query</div>
                  <div className="bg-zinc-950 border border-zinc-800 p-3 flex items-center justify-between group">
                    <code className="text-emerald-400 font-mono text-xs break-all pr-4">
                      {target.keywordBoolean}
                    </code>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => copyToClipboard(target.keywordBoolean, idx)}
                        className="text-zinc-500 hover:text-zinc-300 transition-colors"
                        title="Copy Query"
                      >
                        {copiedIndex === idx ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => openSearch(target.keywordBoolean)}
                        className="text-zinc-500 hover:text-zinc-300 transition-colors"
                        title="Search Grailed"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-500">Emerging Designer</div>
                    <div className="text-zinc-300">{target.emergingDesigner}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-500">Rationale</div>
                    <div className="text-zinc-400 leading-relaxed">{target.rationale}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !isProcuring && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-4">
              <ShoppingBag className="w-8 h-8 opacity-20" />
              <div className="text-center space-y-1">
                <p className="uppercase tracking-widest">Awaiting Fiscal Input</p>
                <p className="text-[10px]">Enter budget to generate sourcing targets.</p>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};
