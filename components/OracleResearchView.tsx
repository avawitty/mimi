import React, { useState } from 'react';
import { generateOracleResearch } from '../services/geminiService';
import { useUser } from '../contexts/UserContext';
import { Loader2 } from 'lucide-react';
import { BiaxialMap } from './BiaxialMap';

export const OracleResearchView: React.FC = () => {
  const { profile } = useUser();
  const [topic, setTopic] = useState('');
  const [research, setResearch] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleResearch = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const result = await generateOracleResearch(topic, profile);
      setResearch(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 text-stone-100">
      <div className="space-y-4">
        <h2 className="font-serif text-4xl italic">The Oracle.</h2>
        <p className="font-sans text-xs uppercase tracking-widest text-stone-400">Cultural Alchemist Research</p>
        <div className="flex gap-4">
          <input 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="flex-1 bg-stone-900 p-4 rounded-sm border border-stone-800 focus:outline-none focus:border-emerald-500"
            placeholder="Enter research topic..."
          />
          <button onClick={handleResearch} className="px-8 bg-emerald-600 text-white rounded-sm hover:bg-emerald-500 transition-colors">
            {loading ? <Loader2 className="animate-spin" /> : 'Consult'}
          </button>
        </div>
      </div>

      {research && (
        <div className="space-y-8">
          <div className="p-6 bg-stone-900 rounded-sm border border-stone-800">
            <h3 className="font-sans text-[10px] uppercase tracking-widest text-emerald-500 mb-2">Thesis</h3>
            <p className="font-serif italic text-xl text-stone-100">{research.thesis}</p>
          </div>
          <p className="font-serif italic text-lg text-stone-300">{research.biaxialMapDescription}</p>
          <BiaxialMap clusters={research.trendClusters} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {research.trendClusters.map((cluster: any, i: number) => (
              <div key={i} className="p-6 bg-stone-900 rounded-sm border border-stone-800 space-y-2">
                <h3 className="font-serif text-xl italic text-emerald-400">{cluster.name}</h3>
                <p className="text-sm text-stone-300"><span className="text-stone-500 font-sans text-[10px] uppercase tracking-widest">Historical Precedent:</span> {cluster.historicalPrecedent}</p>
                <p className="text-sm text-stone-300"><span className="text-stone-500 font-sans text-[10px] uppercase tracking-widest">Contradictory Aesthetic:</span> {cluster.contradictoryAesthetic}</p>
              </div>
            ))}
          </div>
          
          <div className="space-y-4">
            <h3 className="font-sans text-[10px] uppercase tracking-widest text-stone-500">Field Notes (Sources)</h3>
            <ul className="space-y-2">
              {research.sources.map((source: any, i: number) => (
                <li key={i}>
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-400 hover:underline">
                    {source.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
