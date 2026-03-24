import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';

interface AestheticTrajectoryProps {
  current: { density: number; entropy: number; palette: string[] };
  target: { density: number; entropy: number; palette: string[] };
  recommendation: { treatment: string; persona: string; reasoning: string };
}

export const AestheticTrajectory: React.FC<AestheticTrajectoryProps> = ({ current, target, recommendation }) => {
  return (
    <div className="bg-stone-50 p-8 rounded-2xl border border-stone-200 mb-16">
      <h3 className="text-sm font-sans tracking-widest uppercase text-stone-400 mb-6 border-b border-stone-200 pb-2">Aesthetic Trajectory</h3>
      
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div>
          <p className="text-xs text-stone-500 uppercase tracking-widest mb-4">Current Coordinates</p>
          <div className="flex gap-4">
            <div className="bg-white p-4 rounded-lg border border-stone-200 flex-1">
              <span className="block text-2xl font-bold text-stone-800">{current.density}</span>
              <span className="text-[10px] uppercase text-stone-400">Density</span>
            </div>
            <div className="bg-white p-4 rounded-lg border border-stone-200 flex-1">
              <span className="block text-2xl font-bold text-stone-800">{current.entropy}</span>
              <span className="text-[10px] uppercase text-stone-400">Entropy</span>
            </div>
          </div>
        </div>
        <div>
          <p className="text-xs text-stone-500 uppercase tracking-widest mb-4">Target Coordinates</p>
          <div className="flex gap-4">
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 flex-1">
              <span className="block text-2xl font-bold text-emerald-800">{target.density}</span>
              <span className="text-[10px] uppercase text-emerald-600">Density</span>
            </div>
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 flex-1">
              <span className="block text-2xl font-bold text-emerald-800">{target.entropy}</span>
              <span className="text-[10px] uppercase text-emerald-600">Entropy</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-stone-200 flex items-start gap-4">
        <Zap className="text-emerald-500 shrink-0 mt-1" size={20} />
        <div>
          <p className="text-sm font-medium text-stone-800 mb-1">Recommended Bridge: <span className="text-emerald-700">{recommendation.treatment}</span></p>
          <p className="text-xs text-stone-600 italic">{recommendation.reasoning}</p>
        </div>
      </div>
    </div>
  );
};
