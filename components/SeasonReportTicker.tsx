
import React from 'react';
import { motion } from 'framer-motion';
import { SeasonReport } from '../types';
import { AlertCircle, Zap, ShieldCheck } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export const SeasonReportTicker: React.FC<{ report: SeasonReport | null }> = ({ report }) => {
  const { theme } = useTheme();
  if (!report) return null;

  const gossipStrings = theme === 'dark' ? [
    `VAULT STATUS: SECURE`,
    `OXYGEN LEVELS: NOMINAL`,
    `SIGNAL DECAY: 0.04%`,
    `ARCHIVE ACCESSIONING IN PROGRESS...`,
    `DEEP STORAGE TEMP: 4°C`
  ] : [
    `SEASON VIBE: ${report.currentVibe}`,
    `SCANDAL: ${report.topScandal.headline}`,
    `STRUCTURAL RISK: ${report.topScandal.structuralRisk}`,
    `CLIQUE LOGIC: ${report.cliqueLogic}`,
    `OMNI LOOP DETECTED...`
  ];

  return (
    <div className="w-full h-8 bg-nous-text dark:bg-black text-white overflow-hidden flex items-center border-y border-stone-800 transition-colors duration-500">
      <div className={`flex shrink-0 items-center px-4 h-full gap-2 animate-pulse ${theme === 'dark' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-600'}`}>
        {theme === 'dark' ? <ShieldCheck size={10} /> : <AlertCircle size={10} />}
        <span className="font-sans text-[8px] uppercase tracking-widest font-bold">
          {theme === 'dark' ? 'Vault Transmission' : 'Live Report'}
        </span>
      </div>
      
      <div className="flex-1 relative flex items-center">
        <motion.div 
          animate={{ x: [0, -1000] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="flex whitespace-nowrap gap-12"
        >
          {[...gossipStrings, ...gossipStrings, ...gossipStrings].map((s, i) => (
            <span key={i} className="font-sans text-[9px] uppercase tracking-[0.4em] opacity-80">
              {s}
            </span>
          ))}
        </motion.div>
      </div>
      
      <div className="shrink-0 px-4 font-mono text-[8px] opacity-40">
        {theme === 'dark' ? 'VAULT_77' : 'LOOP_COORD_' + (report.timestamp % 10000)}
      </div>
    </div>
  );
};
