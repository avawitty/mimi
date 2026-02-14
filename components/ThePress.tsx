
// @ts-nocheck
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, CornerDownRight, FileText, ArrowRight, Layers, Target, Terminal, Briefcase } from 'lucide-react';
import { EditorialSpread } from './EditorialSpread';

const CASE_STUDIES = [
  {
    id: 'foundational-article',
    brand: "What Is Mimi Zine?",
    tag: "Foundational",
    headline: "A visual research system for turning fragmented inspiration into coherent direction.",
    subtitle: "Formalizing the invisible work of taste.",
    content: {
       author: "Mimi Editorial",
       body: [
          "Mimi Zine is a visual research and synthesis tool designed for creatives who work in fragments long before anything becomes public.",
          "Most creative work doesn’t begin with a brief—it begins with screenshots, half-formed references, aesthetic instincts, and unarticulated taste. Mimi Zine exists to formalize that early stage without flattening it.",
          "At its core, Mimi is a system for curation as logic. Users collect images, language, and references, then use Mimi to organize, group, and synthesize those materials into structured editorial outputs—zines, reports, and visual artifacts that articulate creative direction with clarity.",
          "Rather than optimizing for speed or automation alone, Mimi is built for coherence. It helps users translate intuition into legible strategy, preserve aesthetic nuance while adding structure, and produce portable artifacts that can be shared, presented, or executed upon.",
          "Mimi is used by strategists, designers, and creative operators who need to move fluidly between inspiration and execution—often wearing many hats, often working without a traditional team.",
          "This is not a moodboard tool. This is a thinking surface. Mimi Zine formalizes the invisible work of taste, making it communicable without compromising its soul."
       ],
       captions: ["Curation as Logic.", "Structured Intuition.", "Portable Artifacts."]
    },
    stats: "Read Time: 3m // Topic: System",
    color: "#10B981"
  },
  {
    id: 'user-case-study',
    brand: "From Fragment to Direction",
    tag: "Case Study",
    headline: "How one creator used Mimi to transform scattered references into a unified creative system.",
    subtitle: "A workflow on Selection, Synthesis, and Integration.",
    content: {
       author: "User Report",
       body: [
          "When creative work is fast-moving, references pile up quickly. Screenshots live in camera rolls. Notes live in apps. Ideas remain unspoken because they’re hard to summarize.",
          "A Mimi Zine user—working across creative strategy, design, and digital publishing—entered the platform with a familiar problem: too much material, no unifying structure.",
          "Using Mimi, the workflow unfolded in three phases.",
          "1. Selection: The user imported visual references, written fragments, and conceptual notes without pressure to immediately define meaning. Mimi treats early collection as valid data, not noise.",
          "2. Synthesis: Through grouping and editorial structuring, Mimi generated written and visual reports that articulated patterns across the material—recurring aesthetics, tonal through-lines, and strategic implications. What was previously 'a vibe' became a defensible creative direction.",
          "3. Integration: The final output wasn’t just insight—it was portable. The resulting zine functioned as a personal creative manifesto, a presentation artifact, and a decision-making reference for future work.",
          "Instead of starting from scratch on each new project, the user now works from a living system—one that evolves as new inputs are added. Mimi didn’t replace creative intuition. It gave it structure, memory, and leverage."
       ],
       captions: ["Valid Data, Not Noise.", "Defensible Direction.", "Living Systems."]
    },
    stats: "Read Time: 4m // Topic: Workflow",
    color: "#F59E0B"
  },
  {
    id: 'creative-infrastructure',
    brand: "Creative Infrastructure",
    tag: "Professional",
    headline: "Why teams and organizations need systems for taste, not just tools for output.",
    subtitle: "Bridging the gap between intuition and execution.",
    content: {
       author: "Strategic Brief",
       body: [
          "Modern creative work is increasingly interdisciplinary. Strategy, design, content, and product thinking now overlap—but the tools used to support them remain siloed.",
          "Mimi Zine addresses a structural gap: the absence of shared infrastructure for early-stage creative thinking.",
          "For teams, Mimi functions as a centralized visual research layer, a system for documenting creative rationale, and a bridge between intuition and execution. Unlike traditional documentation tools, Mimi preserves aesthetic context. Unlike moodboards, it produces legible insight. The result is alignment without oversimplification.",
          "Organizations use Mimi to maintain continuity across projects and contributors, onboard collaborators into an existing creative logic, and reduce misinterpretation between strategy and execution.",
          "In an era where creative decisions must be justified, portable, and repeatable, Mimi offers a way to make taste operational—without reducing it to templates or trends.",
          "Mimi Zine is not just a creative product. It is creative infrastructure for people and teams who take thinking seriously."
       ],
       captions: ["Operational Taste.", "Visual Research Layer.", "Alignment w/o Oversimplification."]
    },
    stats: "Read Time: 5m // Topic: B2B",
    color: "#8B5CF6"
  }
];

export const ThePress: React.FC = () => {
  const [activeArticle, setActiveArticle] = useState<any | null>(null);

  return (
    <div className="flex-1 w-full h-full overflow-y-auto no-scrollbar pb-64 relative bg-nous-base dark:bg-[#050505] transition-colors duration-1000 px-6 md:px-16 pt-12 md:pt-20">
      <header className="space-y-8 mb-20 border-b border-black/5 dark:border-white/5 pb-12">
         <div className="space-y-3">
            <div className="flex items-center gap-3 text-emerald-500">
               <Globe size={14} />
               <span className="font-sans text-[8px] uppercase tracking-[0.6em] font-black italic">Strategic Demonstration</span>
            </div>
            <h1 className="font-serif text-5xl md:text-6xl italic tracking-tighter leading-none text-nous-text dark:text-white">The Press.</h1>
         </div>
         <p className="font-serif italic text-lg md:text-2xl text-stone-400 leading-tight max-w-2xl">
            Insight into the <span className="text-nous-text dark:text-white underline decoration-emerald-500 underline-offset-4">Mimi Workflow</span> for creators and strategists.
         </p>
      </header>
      <div className="grid grid-cols-1 gap-0 border-t border-black/5 dark:border-white/5">
         {CASE_STUDIES.map((study, index) => (
           <motion.div key={study.id} onClick={() => setActiveArticle(study)} className="group cursor-pointer border-b border-black/5 dark:border-white/5 py-12 flex flex-col md:flex-row gap-12 items-start hover:bg-stone-50 dark:hover:bg-white/5 transition-all px-4 -mx-4">
              <div className="md:w-1/4 space-y-3">
                 <div className="flex items-center gap-3">
                    <span className="font-mono text-[8px] text-stone-300">0{index + 1}</span>
                    <span className="font-sans text-[8px] uppercase tracking-widest font-black" style={{ color: study.color }}>{study.tag}</span>
                 </div>
                 <h3 className="font-header text-3xl italic tracking-tighter leading-none group-hover:translate-x-1 transition-transform duration-500">{study.brand}.</h3>
              </div>
              <div className="md:w-2/4">
                 <p className="font-serif italic text-xl text-stone-500 group-hover:text-nous-text dark:group-hover:text-white transition-colors leading-snug">{study.headline}</p>
                 <p className="font-sans text-[8px] text-stone-400 mt-3 leading-relaxed max-w-md uppercase tracking-wide opacity-60">{study.subtitle}</p>
              </div>
              <div className="md:w-1/4 flex justify-end items-center h-full">
                 <div className="w-10 h-10 rounded-full border border-black/5 dark:border-white/5 flex items-center justify-center group-hover:bg-nous-text group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-all">
                    <ArrowRight size={14} className="-rotate-45 group-hover:rotate-0 transition-transform duration-500" />
                 </div>
              </div>
           </motion.div>
         ))}
      </div>
      <AnimatePresence>
        {activeArticle && (
          <EditorialSpread article={activeArticle} onClose={() => setActiveArticle(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};
