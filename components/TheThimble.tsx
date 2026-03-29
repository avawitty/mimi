import React, { useState } from 'react';
import { Search, Loader2, Copy, Check, ShoppingBag, ExternalLink, Network, Layers, Database } from 'lucide-react';

interface AestheticRetrievalResult {
  visualTokens: {
    structure: string[];
    baseGarment: string[];
    fitLogic: string[];
    fabricSignal: string[];
  };
  foundations: {
    designers: string[];
    googleItems: string[];
  };
  interpretations: string[];
  marketplaces: { name: string; count: number }[];
}

const MOCK_DATA: AestheticRetrievalResult = {
  visualTokens: {
    structure: ['corset seam', 'paneling', 'boning illusion'],
    baseGarment: ['button-down', 'shirting', 'poplin'],
    fitLogic: ['cinched waist', 'A-line', 'mini'],
    fabricSignal: ['crisp cotton', 'matte', 'slightly stiff']
  },
  foundations: {
    designers: ['Dion Lee', 'Danielle Guizio', 'Orseund Iris'],
    googleItems: ['Structured Poplin Corset Dress', 'Black Tailored Mini']
  },
  interpretations: [
    'black corset shirt dress',
    'black structured button down dress',
    'black cinched waist poplin dress',
    'black tailored mini dress structured waist',
    'black panel seam dress fitted waist'
  ],
  marketplaces: [
    { name: 'Depop', count: 12 },
    { name: 'The RealReal', count: 4 },
    { name: 'Vestiaire', count: 7 },
    { name: 'eBay', count: 23 },
    { name: 'Poshmark', count: 8 }
  ]
};

interface TheThimbleProps {
  profile: any;
  isOpen: boolean;
}

export const TheThimble: React.FC<TheThimbleProps> = ({ profile, isOpen }) => {
  const [anchorQuery, setAnchorQuery] = useState('');
  const [retrievalState, setRetrievalState] = useState<'idle' | 'extracting' | 'expanding' | 'fanning' | 'complete'>('idle');
  const [mockResults, setMockResults] = useState<AestheticRetrievalResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleRetrieve = async () => {
    if (!anchorQuery.trim()) return;
    setRetrievalState('extracting');
    setMockResults(null);
    
    await new Promise(r => setTimeout(r, 1200));
    setRetrievalState('expanding');
    
    await new Promise(r => setTimeout(r, 1200));
    setRetrievalState('fanning');
    
    await new Promise(r => setTimeout(r, 1200));
    setMockResults(MOCK_DATA);
    setRetrievalState('complete');
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text).catch(e => console.error("MIMI // Clipboard error", e));
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const openSearch = (query: string) => {
    window.open(`https://www.grailed.com/shop?query=${encodeURIComponent(query)}`, '_blank');
  };

  return (
    <div className="h-full flex flex-col bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-mono text-xs border-l border-stone-200 dark:border-stone-800 relative">
      {/* Texture Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/noise.png')] z-0 mix-blend-overlay"/>
      
      <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-white/50 dark:bg-stone-900/50 relative z-10 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-stone-400"/>
          <span className="font-bold tracking-widest text-stone-900 dark:text-stone-100 uppercase">Aesthetic Retrieval</span>
        </div>
        <span className="text-[10px] text-stone-500 uppercase tracking-widest">Engine v2</span>
      </div>

      <div className="p-4 border-b border-stone-200 dark:border-stone-800 space-y-4 relative z-10">
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-stone-500">Visual Anchor / Core Query</label>
          <textarea
            value={anchorQuery}
            onChange={(e) => setAnchorQuery(e.target.value)}
            placeholder="e.g., corset poplin shirt dress black"
            className="w-full h-20 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-3 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-400 dark:focus:border-stone-600 transition-colors rounded-none resize-none"
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleRetrieve())}
          />
        </div>
        
        <button
          onClick={handleRetrieve}
          disabled={retrievalState !== 'idle' && retrievalState !== 'complete'}
          className="w-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 p-3 font-bold uppercase tracking-widest hover:bg-stone-800 dark:hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 rounded-none"
        >
          {retrievalState === 'idle' || retrievalState === 'complete' ? (
            <><Search className="w-4 h-4"/> Extract Visual DNA</>
          ) : (
            <><Loader2 className="w-4 h-4 animate-spin"/> Processing...</>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 relative z-10">
        {/* Loading States */}
        {retrievalState !== 'idle' && retrievalState !== 'complete' && (
          <div className="space-y-4 font-mono text-[10px] uppercase tracking-widest text-stone-500 mt-4">
            <div className={`flex items-center gap-3 ${retrievalState === 'extracting' ? 'text-stone-900 dark:text-stone-100' : 'opacity-50'}`}>
              {retrievalState === 'extracting' ? <Loader2 className="w-3 h-3 animate-spin"/> : <Check className="w-3 h-3"/>}
              Extracting Visual Tokens...
            </div>
            <div className={`flex items-center gap-3 ${retrievalState === 'expanding' ? 'text-stone-900 dark:text-stone-100' : (retrievalState === 'fanning' ? 'opacity-50' : 'opacity-20')}`}>
              {retrievalState === 'expanding' ? <Loader2 className="w-3 h-3 animate-spin"/> : (retrievalState === 'fanning' ? <Check className="w-3 h-3"/> : <div className="w-3 h-3 border border-stone-500 rounded-full"/>)}
              Generating Semantic Variations...
            </div>
            <div className={`flex items-center gap-3 ${retrievalState === 'fanning' ? 'text-stone-900 dark:text-stone-100' : 'opacity-20'}`}>
              {retrievalState === 'fanning' ? <Loader2 className="w-3 h-3 animate-spin"/> : <div className="w-3 h-3 border border-stone-500 rounded-full"/>}
              Fanning out to Marketplaces...
            </div>
          </div>
        )}

        {/* Results */}
        {retrievalState === 'complete' && mockResults && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* Visual Tokens */}
            <div className="space-y-3">
              <div className="text-[10px] uppercase tracking-widest text-stone-500 border-b border-stone-200 dark:border-stone-800 pb-2 flex items-center gap-2">
                <Layers className="w-3 h-3"/> Visual Tokens
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[9px] uppercase text-stone-400 mb-1">Structure</div>
                  <div className="flex flex-wrap gap-1">
                    {mockResults.visualTokens.structure.map(t => <span key={t} className="px-1.5 py-0.5 bg-stone-200 dark:bg-stone-800 text-[9px]">{t}</span>)}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] uppercase text-stone-400 mb-1">Base Garment</div>
                  <div className="flex flex-wrap gap-1">
                    {mockResults.visualTokens.baseGarment.map(t => <span key={t} className="px-1.5 py-0.5 bg-stone-200 dark:bg-stone-800 text-[9px]">{t}</span>)}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] uppercase text-stone-400 mb-1">Fit Logic</div>
                  <div className="flex flex-wrap gap-1">
                    {mockResults.visualTokens.fitLogic.map(t => <span key={t} className="px-1.5 py-0.5 bg-stone-200 dark:bg-stone-800 text-[9px]">{t}</span>)}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] uppercase text-stone-400 mb-1">Fabric Signal</div>
                  <div className="flex flex-wrap gap-1">
                    {mockResults.visualTokens.fabricSignal.map(t => <span key={t} className="px-1.5 py-0.5 bg-stone-200 dark:bg-stone-800 text-[9px]">{t}</span>)}
                  </div>
                </div>
              </div>
            </div>

            {/* Interpretations */}
            <div className="space-y-3">
              <div className="text-[10px] uppercase tracking-widest text-stone-500 border-b border-stone-200 dark:border-stone-800 pb-2 flex items-center gap-2">
                <Network className="w-3 h-3"/> Interpretations
              </div>
              <div className="space-y-2">
                {mockResults.interpretations.map((interp, idx) => (
                  <div key={idx} className="bg-white/50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 p-2 flex items-center justify-between group">
                    <span className="text-[10px] truncate pr-2">{interp}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => copyToClipboard(interp, idx)} className="p-1 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors" title="Copy Query">
                        {copiedIndex === idx ? <Check className="w-3 h-3"/> : <Copy className="w-3 h-3"/>}
                      </button>
                      <button onClick={() => openSearch(interp)} className="p-1 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors" title="Search Grailed">
                        <ExternalLink className="w-3 h-3"/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Marketplaces & Foundations */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="text-[10px] uppercase tracking-widest text-stone-500 border-b border-stone-200 dark:border-stone-800 pb-2 flex items-center gap-2">
                  <Database className="w-3 h-3"/> Marketplaces
                </div>
                <div className="space-y-1">
                  {mockResults.marketplaces.map(m => (
                    <div key={m.name} className="flex justify-between text-[10px] items-center">
                      <span className="text-stone-600 dark:text-stone-400">{m.name}</span>
                      <span className="font-bold bg-stone-200 dark:bg-stone-800 px-1.5 py-0.5">{m.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-[10px] uppercase tracking-widest text-stone-500 border-b border-stone-200 dark:border-stone-800 pb-2">
                  Foundations
                </div>
                <div className="space-y-1">
                  {mockResults.foundations.designers.map(d => (
                    <div key={d} className="text-[10px] font-serif italic text-stone-600 dark:text-stone-400">
                      {d}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {retrievalState === 'idle' && (
          <div className="h-full flex flex-col items-center justify-center text-stone-400 dark:text-stone-600 space-y-4 opacity-50 mt-20">
            <Network className="w-8 h-8"/>
            <div className="text-center space-y-1">
              <p className="uppercase tracking-widest">Aesthetic Retrieval</p>
              <p className="text-[10px]">Input a visual anchor to extract DNA.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
