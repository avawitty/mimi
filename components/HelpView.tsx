import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Sparkles, Activity, ArrowRight, Search, Play, FileText, LayoutTemplate, MessageSquare } from 'lucide-react';

type CodexTab = 'read' | 'use' | 'cases';

interface CodexPrinciple {
  id: string;
  title: string;
  thesis: string;
  operationalMeaning: string;
  readContent: string;
  diagnostics: {
    healthy: string;
    overdone: string;
    currentRead: string;
  };
  actions: {
    label: string;
    icon: React.ReactNode;
  }[];
  cases: {
    title: string;
    description: string;
  }[];
}

const codexPrinciples: CodexPrinciple[] = [
  {
    id: 'sovereign-curation',
    title: 'Sovereign Curation',
    thesis: 'A structured environment for gathering, interpreting, refining, and extending aesthetic intelligence.',
    operationalMeaning: 'The machine does not replace taste. It helps structure the user’s relationship to it.',
    readContent: 'Mimi is not a generic content tool. It is a system for sovereign curation: a structured environment for gathering, interpreting, refining, and extending aesthetic intelligence. Most software organizes itself by feature. Mimi does not. Mimi is organized by cognitive sequence: the order in which a person naturally moves when turning instinct into form.\n\nIn this sense, Mimi is both a tool and a method. It supports personal curation, visual authorship, aesthetic memory, strategic procurement, and cultural positioning. The machine does not replace taste. It helps structure the user’s relationship to it.',
    diagnostics: {
      healthy: 'Clear motifs, strong exclusions, coherent tension.',
      overdone: 'Trend-chasing, overcollection, aesthetic flattening.',
      currentRead: 'High signal, low hierarchy; visually rich but under-edited.'
    },
    actions: [
      { label: 'Apply to current artifact', icon: <Play size={14} /> },
      { label: 'Test against Tailor Logic', icon: <Activity size={14} /> },
      { label: 'Turn into editorial rule', icon: <FileText size={14} /> }
    ],
    cases: [
      { title: 'Archive Example 01', description: 'A moodboard that successfully balances tension and motif.' }
    ]
  },
  {
    id: 'cognitive-sequence',
    title: 'The Cognitive Sequence',
    thesis: 'Create → Reflect → Refine',
    operationalMeaning: 'Raw expression should exist before it is judged, interpretation should occur before strategy.',
    readContent: 'The architecture of Mimi is intentionally divided into six chambers: Create, Reflect, Refine, Signature, Observe, System.\n\nThis order is functional. It is based on the idea that users do not think in menus. They think in phases. A person begins by making or collecting something. Then they try to understand what it means. Then they decide what to do with it. That is the primary loop.\n\nThe Mimi loop prevents two common failures: premature strategy (optimizing before having enough material) and endless reflection (getting trapped in interpretation without converting insight into action).',
    diagnostics: {
      healthy: 'Fluid movement between making, interpreting, and deciding.',
      overdone: 'Premature strategy or endless reflection without action.',
      currentRead: 'You are currently in the Create phase. Gathering raw material.'
    },
    actions: [
      { label: 'Analyze this board', icon: <Search size={14} /> },
      { label: 'Generate a critique', icon: <MessageSquare size={14} /> }
    ],
    cases: [
      { title: 'Case Study: The Shift', description: 'Moving from endless gathering to decisive refinement.' }
    ]
  },
  {
    id: 'refine',
    title: 'Refine',
    thesis: 'Interpretation should occur before strategy.',
    operationalMeaning: 'Taste becomes useful when it can move into action.',
    readContent: 'Refine is where interpretation becomes direction. Once signal has been recognized, the user can act with more precision. This chamber is for adjustment, planning, selection, and execution. It is less ceremonial than Reflect and more exacting in tone.\n\nAlign outputs with declared identity, generate direction from observed pattern, organize strategic action, support procurement, sourcing, selection, and curation decisions.',
    diagnostics: {
      healthy: 'Precise, structured, editorial, strategic.',
      overdone: 'Rigid, overly polished, losing the original raw instinct.',
      currentRead: 'Needs more structure. The raw materials are present but lack editorial direction.'
    },
    actions: [
      { label: 'Analyze this board', icon: <Search size={14} /> },
      { label: 'Find weak signals', icon: <Activity size={14} /> },
      { label: 'Suggest stronger composition', icon: <LayoutTemplate size={14} /> },
      { label: 'Rewrite as editorial thesis', icon: <FileText size={14} /> }
    ],
    cases: [
      { title: 'Editorial Edit', description: 'Applying the refine principle to a chaotic moodboard.' }
    ]
  }
];

const PrincipleCard = ({ principle }: { principle: CodexPrinciple }) => {
  const [activeTab, setActiveTab] = useState<CodexTab>('read');

  return (
    <div className="border border-nous-border bg-nous-base/50 p-6 mb-8">
      <div className="mb-6">
        <h2 className="font-serif italic text-2xl text-nous-text mb-2">{principle.title}</h2>
        <p className="font-sans text-sm text-nous-text font-medium mb-1">"{principle.thesis}"</p>
        <p className="font-sans text-xs text-nous-subtle uppercase tracking-widest">{principle.operationalMeaning}</p>
      </div>

      <div className="flex border-b border-nous-border mb-6">
        {(['read', 'use', 'cases'] as CodexTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors ${
              activeTab === tab 
                ? 'text-nous-text border-b border-nous-text' 
                : 'text-nous-subtle hover:text-nous-text'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'read' && (
            <div className="prose prose-invert prose-p:font-serif prose-p:text-sm prose-p:leading-relaxed prose-p:text-nous-subtle max-w-none">
              {principle.readContent.split('\n\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          )}

          {activeTab === 'use' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-mono text-[10px] uppercase tracking-widest text-nous-text mb-3 flex items-center gap-2">
                  <Activity size={12} /> Diagnostics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-nous-surface p-3 border border-nous-border/50">
                    <span className="block font-mono text-[9px] uppercase tracking-widest text-green-500/80 mb-1">Healthy</span>
                    <p className="font-serif text-xs text-nous-subtle">{principle.diagnostics.healthy}</p>
                  </div>
                  <div className="bg-nous-surface p-3 border border-nous-border/50">
                    <span className="block font-mono text-[9px] uppercase tracking-widest text-red-500/80 mb-1">Overdone</span>
                    <p className="font-serif text-xs text-nous-subtle">{principle.diagnostics.overdone}</p>
                  </div>
                  <div className="bg-nous-surface p-3 border border-nous-text/20">
                    <span className="block font-mono text-[9px] uppercase tracking-widest text-nous-text mb-1">Current Read</span>
                    <p className="font-serif text-xs text-nous-text">{principle.diagnostics.currentRead}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-mono text-[10px] uppercase tracking-widest text-nous-text mb-3 flex items-center gap-2">
                  <Play size={12} /> Actions
                </h3>
                <div className="flex flex-wrap gap-2">
                  {principle.actions.map((action, i) => (
                    <button 
                      key={i}
                      className="flex items-center gap-2 px-3 py-2 bg-nous-surface border border-nous-border hover:border-nous-text transition-colors font-sans text-xs text-nous-text"
                    >
                      {action.icon}
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cases' && (
            <div className="space-y-4">
              {principle.cases.map((c, i) => (
                <div key={i} className="border border-nous-border p-4 hover:bg-nous-surface transition-colors cursor-pointer group">
                  <h4 className="font-sans text-sm text-nous-text mb-1 group-hover:underline">{c.title}</h4>
                  <p className="font-serif text-xs text-nous-subtle">{c.description}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export const HelpView: React.FC = () => {
  const [askQuery, setAskQuery] = useState('');
  const [askResponse, setAskResponse] = useState<string | null>(null);

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!askQuery.trim()) return;
    
    // Simulated response grounded in principles
    setAskResponse("This is failing at Refine. You have raw instinct and promising references, but no hierarchy yet. Consider applying the 'Rewrite as editorial thesis' action.");
  };

  const suggestedQueries = [
    "What is weak about this?",
    "What principle am I violating?",
    "Which part of the sequence am I skipping?",
    "How would Mimi interpret this board?"
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-nous-base text-nous-text p-8 md:p-16">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 border-b border-nous-border pb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <BookOpen size={24} className="text-nous-text" />
              <div>
                <h1 className="font-serif italic text-3xl text-nous-text">The Codex</h1>
                <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-nous-subtle mt-1">
                  The interpretive engine of Mimi
                </p>
              </div>
            </div>
            
            {/* Progression / State */}
            <div className="text-right border-l border-nous-border pl-6">
              <span className="block font-mono text-[9px] uppercase tracking-widest text-nous-subtle mb-1">Current Stage</span>
              <span className="font-serif italic text-lg text-nous-text">Create</span>
              <p className="font-sans text-xs text-nous-subtle mt-1">This board wants reflection, not more uploads.</p>
            </div>
          </div>
        </motion.div>

        {/* Ask the Codex */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12 bg-nous-surface border border-nous-border p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Sparkles size={16} className="text-nous-text" />
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-nous-text">Ask the Codex</h2>
          </div>
          
          <form onSubmit={handleAsk} className="relative mb-4">
            <input 
              type="text"
              value={askQuery}
              onChange={(e) => setAskQuery(e.target.value)}
              placeholder="e.g., What principle am I violating?"
              className="w-full bg-transparent border-b border-nous-border focus:border-nous-text py-2 pl-2 pr-10 font-serif text-lg text-nous-text placeholder:text-nous-subtle/50 outline-none transition-colors"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-nous-subtle hover:text-nous-text transition-colors">
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="flex flex-wrap gap-2 mb-4">
            {suggestedQueries.map((q, i) => (
              <button 
                key={i}
                onClick={() => setAskQuery(q)}
                className="font-sans text-[10px] text-nous-subtle hover:text-nous-text bg-nous-base px-2 py-1 border border-nous-border/50 hover:border-nous-border transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          <AnimatePresence>
            {askResponse && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 p-4 border-l-2 border-nous-text bg-nous-base/50">
                  <p className="font-serif text-sm text-nous-text leading-relaxed">
                    {askResponse}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Principles */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-nous-subtle mb-6">Active Principles</h2>
          <div className="space-y-8">
            {codexPrinciples.map(principle => (
              <PrincipleCard key={principle.id} principle={principle} />
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
};

