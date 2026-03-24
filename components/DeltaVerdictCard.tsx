import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DeltaVerdict } from '../types';
import { Activity, ChevronDown, ChevronUp, Zap, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { GlossaryTooltip } from './GlossaryTooltip';

interface DeltaVerdictCardProps {
  verdict: DeltaVerdict;
  compact?: boolean;
}

export const DeltaVerdictCard: React.FC<DeltaVerdictCardProps> = ({ verdict, compact = false }) => {
  const [expanded, setExpanded] = useState(false);

  // Determine color based on alignment
  const getAlignmentColor = (score: number) => {
    if (score > 0.8) return 'text-emerald-500'; // High alignment
    if (score < 0.3) return 'text-red-500';     // Anomaly / Mutant
    return 'text-amber-500';                    // Drift
  };

  const getAlignmentLabel = (score: number) => {
    if (score > 0.8) return 'CORE ALIGNMENT';
    if (score < 0.3) return 'AESTHETIC ANOMALY';
    return 'STYLISTIC DRIFT';
  };

  const Icon = verdict.alignmentScore < 0.3 ? ShieldAlert : verdict.alignmentScore > 0.8 ? CheckCircle2 : Zap;

  return (
    <div className="w-full border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0A0A0A] overflow-hidden">
      {/* Header / Summary */}
      <div 
        className={`p-4 flex items-start justify-between cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-colors ${expanded ? 'border-b border-stone-100 dark:border-stone-800/50' : ''}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex gap-4 items-start">
          <div className={`mt-1 ${getAlignmentColor(verdict.alignmentScore)}`}>
            <Icon size={18} />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <GlossaryTooltip 
                term="Delta Verdict" 
                poeticMeaning="The distance between your core identity and this new signal." 
                functionalMeaning="A calculated score representing how much this input diverges from your established aesthetic profile."
              >
                <span className={`font-mono text-[10px] uppercase tracking-widest font-bold ${getAlignmentColor(verdict.alignmentScore)}`}>
                  {getAlignmentLabel(verdict.alignmentScore)}
                </span>
              </GlossaryTooltip>
              <span className="font-mono text-[10px] text-stone-400">
                Δ {(verdict.alignmentScore * 100).toFixed(0)}%
              </span>
            </div>
            <p className="font-serif italic text-sm text-stone-800 dark:text-stone-200 leading-snug">
              "{verdict.surpriseVerdict}"
            </p>
          </div>
        </div>
        {!compact && (
          <button className="text-stone-400 hover:text-primary dark:hover:text-white transition-colors">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && !compact && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 flex flex-col gap-6 bg-stone-50/50 dark:bg-stone-900/20">
              
              {/* Divergence Points */}
              <div className="flex flex-col gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500">Divergence Points</span>
                <ul className="flex flex-col gap-2">
                  {verdict.divergencePoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-stone-600 dark:text-stone-400 font-sans">
                      <span className="text-stone-300 dark:text-stone-700 mt-0.5">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Resonance Analysis */}
              <div className="flex flex-col gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500">Resonance Analysis</span>
                <p className="text-xs text-stone-600 dark:text-stone-400 font-sans leading-relaxed">
                  {verdict.resonanceAnalysis}
                </p>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
