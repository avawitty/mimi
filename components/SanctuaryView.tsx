
// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartHandshake, ShieldAlert, Phone, ExternalLink, Radio, Sparkles, Loader2, CornerDownRight, Activity, Map, ShieldCheck, Zap, Compass, Wind, Cat, Sprout, Heart } from 'lucide-react';
import { generateSanctuaryReport, SanctuaryReport } from '../services/geminiService';

const EMERGENCY_RESOURCES = [
  { name: "The 988 Anchor", desc: "Immediate structural handshake with a human processor.", link: "tel:988", color: "bg-amber-500", icon: <Phone size={14} /> },
  { name: "NAMI Registry", desc: "Community-led debris management.", link: "https://nami.org", color: "bg-emerald-500", icon: <ExternalLink size={14} /> },
  { name: "The Felton Sync", desc: "Specialized support for frequency processing.", link: "https://felton.org", color: "bg-blue-500", icon: <Activity size={14} /> },
  { name: "SAMHSA Ledger", desc: "Tools for substrate recalibration.", link: "https://www.samhsa.gov", color: "bg-rose-500", icon: <Zap size={14} /> }
];

export const SanctuaryView: React.FC = () => {
  const [input, setInput] = useState('');
  const [report, setReport] = useState<SanctuaryReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [detectedSignatures, setDetectedSignatures] = useState<string[]>([]);

  useEffect(() => {
    const lower = input.toLowerCase();
    const sigs = [];
    if (lower.includes('lauren')) sigs.push('lauren');
    if (lower.includes('paige')) sigs.push('paige');
    setDetectedSignatures(sigs);
  }, [input]);

  const handleSeekSanctuary = async () => {
    if (!input.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const res = await generateSanctuaryReport(input);
      setReport(res);
      setInput('');
    } catch (e) {
      alert("Signal obscured.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full h-full overflow-y-auto no-scrollbar pb-64 px-6 md:px-16 pt-12 md:pt-20 bg-emerald-50/5 dark:bg-stone-950 transition-all duration-1000 relative">
      
      {/* BOTANICAL HANDSHAKE RESONANCE */}
      <div className="fixed top-32 left-1/2 -translate-x-1/2 z-[50] pointer-events-none flex gap-8">
        <AnimatePresence>
          {detectedSignatures.includes('lauren') && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: -20, scale: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <Sprout size={48} className="text-emerald-500 animate-bounce" />
              <span className="font-sans text-[7px] uppercase tracking-widest font-black text-emerald-600">Lauren Detected</span>
            </motion.div>
          )}
          {detectedSignatures.includes('paige') && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: -20, scale: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <Heart size={48} className="text-emerald-500 fill-current animate-pulse" />
              <span className="font-sans text-[7px] uppercase tracking-widest font-black text-emerald-600">Paige Detected</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="max-w-4xl mx-auto space-y-16 relative z-10">
        
        <header className="space-y-6">
          <div className="flex items-center gap-4 text-stone-400">
             <HeartHandshake size={20} className="text-emerald-500 animate-pulse" />
             <span className="font-sans text-[10px] uppercase tracking-[0.5em] font-black italic">The Sanctuary</span>
          </div>
          <h2 className="font-serif text-6xl md:text-[10rem] italic tracking-tighter luminescent-text leading-[0.8] -ml-1">Stirred.</h2>
          <div className="space-y-4 max-w-2xl">
            <p className="font-serif italic text-xl md:text-3xl text-stone-500 leading-tight text-balance">
              Creative sessions can surfacing structural weight. If Mimi stirred something, anchor your frequency here.
            </p>
          </div>
        </header>

        {/* REFLECTION INPUT: The Grounding Stew */}
        <section className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 p-8 md:p-12 rounded-[2rem] shadow-2xl space-y-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform duration-1000"><Compass size={120} /></div>
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                  <span className="font-sans text-[8px] uppercase tracking-[0.4em] text-stone-400 font-black">Acknowledge the Signal</span>
                  {detectedSignatures.length > 0 && (
                    <div className="flex items-center gap-2 text-emerald-500">
                       <Sparkles size={10} className="animate-spin" />
                       <span className="font-sans text-[7px] uppercase tracking-widest font-black">Resonant Handshake Active</span>
                    </div>
                  )}
               </div>
               <textarea 
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 placeholder="Describe the frequency of the stirring... mentions of Lauren or Paige will anchor botanical resonances."
                 className="w-full bg-stone-50/50 dark:bg-stone-900/50 border-b border-stone-100 dark:border-stone-800 py-6 font-serif italic text-2xl md:text-3xl focus:outline-none h-40 resize-none rounded-xl text-stone-700 dark:text-stone-300 placeholder:opacity-30"
               />
            </div>
            <div className="flex justify-center">
               <button 
                 onClick={handleSeekSanctuary}
                 disabled={!input.trim() || isLoading}
                 className="px-12 py-5 bg-nous-text dark:bg-stone-100 text-white dark:text-stone-900 font-sans text-[10px] uppercase tracking-[0.6em] font-black rounded-full shadow-2xl active:scale-95 transition-all flex items-center gap-4"
               >
                 {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Wind size={16} className="text-emerald-500" />}
                 Seek Grounding
               </button>
            </div>
        </section>

        <AnimatePresence>
          {report && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-50/50 dark:bg-emerald-950/10 border-2 border-emerald-100 dark:border-emerald-900/30 p-10 md:p-16 rounded-[3rem] shadow-2xl space-y-12"
            >
               <div className="space-y-4">
                  <div className="flex items-center gap-3 text-emerald-600">
                     <ShieldCheck size={20} />
                     <span className="font-sans text-[10px] uppercase tracking-widest font-black">Calibration Complete</span>
                  </div>
                  <h3 className="font-serif text-4xl md:text-6xl italic tracking-tighter leading-tight text-emerald-800 dark:text-emerald-400">
                    "{report.validation}"
                  </h3>
               </div>

               <div className="grid md:grid-cols-2 gap-12 border-t border-emerald-100 dark:border-emerald-900/30 pt-12">
                  <section className="space-y-4">
                     <h4 className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-400">Architectural Support</h4>
                     <p className="font-serif italic text-xl text-stone-600 dark:text-stone-300 leading-relaxed">
                        {report.structural_reframing}
                     </p>
                  </section>
                  <section className="space-y-4">
                     <h4 className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-400">The Oracle's Note</h4>
                     <p className="font-serif italic text-xl text-emerald-700 dark:text-emerald-500">
                        {report.oracle_note}
                     </p>
                  </section>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-8 pt-32">
           <div className="flex items-center gap-4">
             <div className="h-px flex-1 bg-stone-100 dark:bg-stone-900" />
             <span className="font-sans text-[9px] uppercase tracking-[0.8em] text-stone-300 font-black">Substrate Recalibration Registry</span>
             <div className="h-px flex-1 bg-stone-100 dark:bg-stone-900" />
           </div>
           
           <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {EMERGENCY_RESOURCES.map(res => (
                <a 
                  key={res.name}
                  href={res.link} 
                  target={res.link.startsWith('http') ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="group p-8 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-2xl shadow-sm hover:shadow-xl transition-all flex flex-col justify-between gap-6"
                >
                    <div className="space-y-3">
                      <div className={`w-8 h-8 ${res.color} text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                          {res.icon}
                      </div>
                      <h4 className="font-serif text-2xl italic tracking-tighter group-hover:text-nous-text dark:group-hover:text-white transition-colors">{res.name}</h4>
                      <p className="font-serif italic text-stone-400 text-sm">{res.desc}</p>
                    </div>
                </a>
              ))}
           </section>
        </div>
      </div>
    </div>
  );
};
