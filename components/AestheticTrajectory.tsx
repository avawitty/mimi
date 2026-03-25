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
 <div className="mb-16">
 <h3 className="text-[10px] font-mono tracking-widest uppercase text-stone-500 mb-6 border-b border-stone-300 pb-2">Aesthetic Trajectory</h3>
 
 <div className="grid md:grid-cols-2 gap-0 border border-stone-300 mb-8">
 <div className="p-6 border-b md:border-b-0 md:border-r border-stone-300 relative overflow-hidden">
 <div className="absolute inset-0 opacity-5"style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
 <p className="text-[10px] text-stone-500 font-mono uppercase tracking-widest mb-4 relative z-10">Current Coordinates</p>
 <div className="flex gap-4 relative z-10">
 <div className="flex-1">
 <span className="block text-4xl font-mono text-stone-800 tracking-tighter">{current.density}</span>
 <span className="text-[9px] font-mono uppercase text-stone-400 tracking-widest">Density</span>
 </div>
 <div className="flex-1">
 <span className="block text-4xl font-mono text-stone-800 tracking-tighter">{current.entropy}</span>
 <span className="text-[9px] font-mono uppercase text-stone-400 tracking-widest">Entropy</span>
 </div>
 </div>
 </div>
 <div className="p-6 relative overflow-hidden">
 <div className="absolute inset-0 opacity-5"style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
 <p className="text-[10px] text-stone-500 font-mono uppercase tracking-widest mb-4 relative z-10">Target Coordinates</p>
 <div className="flex gap-4 relative z-10">
 <div className="flex-1">
 <span className="block text-4xl font-mono text-stone-800 tracking-tighter">{target.density}</span>
 <span className="text-[9px] font-mono uppercase text-stone-600 tracking-widest">Density</span>
 </div>
 <div className="flex-1">
 <span className="block text-4xl font-mono text-stone-800 tracking-tighter">{target.entropy}</span>
 <span className="text-[9px] font-mono uppercase text-stone-600 tracking-widest">Entropy</span>
 </div>
 </div>
 </div>
 </div>

 <div className="border border-stone-300 p-6 flex items-start gap-4">
 <Zap className="text-stone-400 shrink-0 mt-0.5"size={16} />
 <div>
 <p className="text-[10px] font-mono uppercase tracking-widest text-stone-800 mb-2">Recommended Bridge: <span className="text-stone-500">{recommendation.treatment}</span></p>
 <p className="text-xs text-stone-600 font-sans">{recommendation.reasoning}</p>
 </div>
 </div>
 </div>
 );
};
