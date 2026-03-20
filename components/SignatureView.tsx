import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../contexts/UserContext';
import { fetchUserZines } from '../services/firebaseUtils';
import { generateSignature } from '../services/signatureService';
import { AestheticSignature } from '../types';
import { Share2, Download, Fingerprint, Activity, GitCommit, Layers, Hexagon, Triangle, Circle, Square } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, ScatterChart, Scatter, ZAxis } from 'recharts';
import * as htmlToImage from 'html-to-image';

const GeometricLoader = () => (
  <div className="fixed inset-0 z-50 bg-[#f5f2ed] dark:bg-[#050505] flex flex-col items-center justify-center">
    <div className="relative w-64 h-64 flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 border border-stone-300 dark:border-stone-800 rounded-full"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        className="absolute inset-4 border border-stone-300 dark:border-stone-800 rounded-full border-dashed"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 180, 270, 360] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-32 h-32 border border-emerald-500/50 rotate-45"
      />
      <motion.div
        animate={{ scale: [1.2, 1, 1.2], rotate: [360, 270, 180, 90, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-32 h-32 border border-indigo-500/50"
      />
      <div className="absolute flex items-center justify-center">
        <Fingerprint className="text-stone-800 dark:text-stone-200 animate-pulse" size={48} />
      </div>
    </div>
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="mt-12 text-center space-y-2"
    >
      <h2 className="font-serif italic text-2xl text-stone-900 dark:text-stone-100">Synthesizing Signature</h2>
      <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-stone-500">Extracting aesthetic DNA from the archive...</p>
    </motion.div>
  </div>
);

export const SignatureView: React.FC = () => {
  const { user, profile, updateProfile } = useUser();
  const [signature, setSignature] = useState<AestheticSignature | null>(null);
  const [loading, setLoading] = useState(true);
  const dnaCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      if (!user) return;
      
      if (profile?.tasteProfile?.aestheticSignature) {
        setSignature(profile.tasteProfile.aestheticSignature);
        setLoading(false);
        return;
      }

      const zines = await fetchUserZines(user.uid);
      console.info("MIMI // SignatureView: Fetched zines:", zines);
      if (zines.length > 0) {
        const sig = await generateSignature(zines);
        console.info("MIMI // SignatureView: Generated signature:", sig);
        setSignature(sig);
        if (profile) {
          await updateProfile({
            ...profile,
            tasteProfile: {
              ...profile.tasteProfile!,
              aestheticSignature: sig
            }
          });
        }
      } else {
        console.info("MIMI // SignatureView: No zines found.");
      }
      setLoading(false);
    };
    init();
  }, [user, profile, updateProfile]);

  const handleExport = async () => {
    if (!dnaCardRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(dnaCardRef.current, { 
        quality: 1, 
        pixelRatio: 2,
        fontEmbedCSS: '',
      });
      const link = document.createElement('a');
      link.download = 'mimi-aesthetic-dna.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export DNA card', err);
    }
  };

  if (loading) return <GeometricLoader />;

  if (!signature) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center h-full bg-[#f5f2ed] dark:bg-[#050505]">
        <Fingerprint size={48} className="text-stone-300 dark:text-stone-800 mb-6" />
        <h2 className="font-serif italic text-3xl text-stone-900 dark:text-stone-100 mb-2">No Signature Found</h2>
        <p className="text-stone-500 max-w-md mb-6">Your archive is currently empty. Create more artifacts in the Studio to generate your aesthetic fingerprint.</p>
        <button 
          onClick={async () => {
            if (!user) return;
            setLoading(true);
            const zines = await fetchUserZines(user.uid, true);
            if (zines.length > 0) {
              const sig = await generateSignature(zines);
              setSignature(sig);
              if (profile) {
                await updateProfile({
                  ...profile,
                  tasteProfile: {
                    ...profile.tasteProfile!,
                    aestheticSignature: sig
                  }
                });
              }
            } else {
              alert("You need to create at least one zine first.");
            }
            setLoading(false);
          }}
          className="px-6 py-3 bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 rounded-full text-xs uppercase tracking-widest hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors"
        >
          Generate Signature
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#f5f2ed] dark:bg-[#050505] text-stone-900 dark:text-stone-100 font-serif selection:bg-emerald-500/20 pb-32 custom-scrollbar">
      <div className="max-w-6xl mx-auto p-6 md:p-12 space-y-16">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-300 dark:border-stone-800 pb-8">
          <div>
            <h1 className="text-5xl md:text-7xl font-light italic tracking-tight">Signature</h1>
            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-stone-500 mt-4">Aesthetic Fingerprint & Lineage</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={async () => {
                if (!user) return;
                setLoading(true);
                const zines = await fetchUserZines(user.uid, true);
                if (zines.length > 0) {
                  const sig = await generateSignature(zines);
                  setSignature(sig);
                  if (profile) {
                    await updateProfile({
                      ...profile,
                      tasteProfile: {
                        ...profile.tasteProfile!,
                        aestheticSignature: sig
                      }
                    });
                  }
                }
                setLoading(false);
              }}
              className="flex items-center gap-2 px-4 py-2 border border-stone-300 dark:border-stone-800 rounded-full text-xs uppercase tracking-widest hover:bg-stone-200 dark:hover:bg-stone-900 transition-colors"
            >
              Regenerate
            </button>
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 border border-stone-300 dark:border-stone-800 rounded-full text-xs uppercase tracking-widest hover:bg-stone-200 dark:hover:bg-stone-900 transition-colors"
            >
              <Download size={14} />
              Export DNA
            </button>
          </div>
        </div>

        {/* Top Section: DNA Card & Engine Output */}
        <div className="grid md:grid-cols-12 gap-8">
          
          {/* Aesthetic DNA Card (Exportable) */}
          <div className="md:col-span-5 relative group">
            <div 
              ref={dnaCardRef}
              className="bg-white dark:bg-[#111] border border-stone-200 dark:border-stone-800 p-8 shadow-2xl relative overflow-hidden"
            >
              {/* Card Background Texture */}
              <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/noise.png')" }} />
              
              <div className="flex justify-between items-start mb-12 relative z-10">
                <div>
                  <h2 className="text-3xl italic font-light">Aesthetic DNA</h2>
                  <p className="font-sans text-[8px] uppercase tracking-[0.2em] text-stone-400 mt-1">Mimi Intelligence Output</p>
                </div>
                <Fingerprint className="text-emerald-500/50" size={32} />
              </div>

              <div className="space-y-8 relative z-10">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-400 mb-1">Primary Axis</p>
                    <p className="text-lg italic text-emerald-600 dark:text-emerald-400">{signature.primaryAxis}</p>
                  </div>
                  <div>
                    <p className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-400 mb-1">Secondary Axis</p>
                    <p className="text-lg italic text-indigo-600 dark:text-indigo-400">{signature.secondaryAxis}</p>
                  </div>
                </div>

                <div>
                  <p className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-400 mb-2">Core Motifs</p>
                  <div className="flex flex-wrap gap-2">
                    {signature.motifs.map((m, i) => (
                      <span key={i} className="px-2 py-1 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 font-mono text-[9px] uppercase text-stone-600 dark:text-stone-300">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-400 mb-1">Mood Cluster</p>
                  <p className="text-xl italic text-stone-800 dark:text-stone-200">{signature.moodCluster}</p>
                </div>

                <div className="pt-6 border-t border-stone-200 dark:border-stone-800 flex justify-between items-center">
                  <div className="font-mono text-[8px] text-stone-400">
                    ID: {user?.uid.substring(0, 8).toUpperCase()}
                  </div>
                  <div className="font-mono text-[8px] text-stone-400">
                    {new Date(signature.generatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Influence Lineage */}
          <div className="md:col-span-7 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <GitCommit className="text-indigo-500" size={20} />
              <h3 className="text-2xl italic">Influence Lineage</h3>
            </div>
            
            <div className="grid gap-4">
              {signature.influenceLineage.map((item, idx) => (
                <div key={idx} className="bg-white/50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 p-4 flex items-center justify-between group hover:border-indigo-500/50 transition-colors">
                  <div>
                    <h4 className="font-serif text-lg text-stone-900 dark:text-stone-100">{item.artist}</h4>
                    <p className="font-sans text-[10px] uppercase tracking-widest text-stone-500">{item.movement}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-1 bg-stone-200 dark:bg-stone-800 relative overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.connectionStrength * 100}%` }}
                        transition={{ duration: 1, delay: idx * 0.2 }}
                        className="absolute top-0 left-0 h-full bg-indigo-500"
                      />
                    </div>
                    <span className="font-mono text-xs text-stone-400 w-8 text-right">
                      {Math.round(item.connectionStrength * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section: Charts */}
        <div className="grid md:grid-cols-2 gap-8 pt-8 border-t border-stone-300 dark:border-stone-800">
          
          {/* Creative Cycles */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Activity className="text-rose-500" size={20} />
              <h3 className="text-2xl italic">Creative Cycles</h3>
            </div>
            <p className="font-sans text-[10px] uppercase tracking-widest text-stone-500 mb-6">Output volume & mood patterns</p>
            
            <div className="h-[300px] w-full bg-white/30 dark:bg-stone-900/30 border border-stone-200 dark:border-stone-800 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={signature.creativeCycles} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOutput" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="period" stroke="#78716c" tick={{ fill: '#a8a29e', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#78716c" tick={{ fill: '#a8a29e', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #292524', borderRadius: '0px' }}
                    itemStyle={{ color: '#f43f5e', fontFamily: 'monospace', fontSize: '12px' }}
                    labelStyle={{ color: '#a8a29e', fontFamily: 'serif', fontStyle: 'italic', marginBottom: '4px' }}
                  />
                  <Area type="monotone" dataKey="outputCount" stroke="#f43f5e" fillOpacity={1} fill="url(#colorOutput)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Motif Frequency Analyzer */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Layers className="text-emerald-500" size={20} />
              <h3 className="text-2xl italic">Motif Frequency</h3>
            </div>
            <p className="font-sans text-[10px] uppercase tracking-widest text-stone-500 mb-6">Evolution of recurring visual elements</p>
            
            <div className="h-[300px] w-full bg-white/30 dark:bg-stone-900/30 border border-stone-200 dark:border-stone-800 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis 
                    type="number" 
                    dataKey="date" 
                    domain={['auto', 'auto']} 
                    tickFormatter={(unixTime) => new Date(unixTime).toLocaleDateString()}
                    stroke="#78716c" 
                    tick={{ fill: '#a8a29e', fontSize: 10 }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    type="category" 
                    dataKey="motif" 
                    stroke="#78716c" 
                    tick={{ fill: '#a8a29e', fontSize: 10 }} 
                    axisLine={false} 
                    tickLine={false} 
                    width={80}
                  />
                  <ZAxis type="number" dataKey="frequency" range={[20, 200]} />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #292524', borderRadius: '0px' }}
                    formatter={(value: any, name: any, props: any) => {
                      if (name === 'frequency') return [value, 'Frequency'];
                      return [];
                    }}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Scatter name="Motifs" data={signature.motifEvolution} fill="#10b981" opacity={0.6} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
