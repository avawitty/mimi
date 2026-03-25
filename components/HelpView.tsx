import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles, Scissors, ShieldCheck, Camera, FlaskConical, Archive, Compass, LayoutGrid, Briefcase, Activity, Paperclip, Mic, Zap, BrainCircuit, Globe, MapPin, Wand2, Eraser, Target, ListChecks } from 'lucide-react';
import { Diagnostics } from './Diagnostics';
import { FeatureChecklist } from './FeatureChecklist';

export const HelpView: React.FC = () => {
 return (
 <div className="flex-1 w-full h-full overflow-y-auto no-scrollbar bg dark:bg text dark:text transition-all duration-1000">
 <div className="max-w-7xl mx-auto px-6 md:px-16 pt-24 pb-32">
 
 {/* Hero Section */}
 <header className="relative mb-32">
 <div className="absolute top-0 left-0 w-full h-[1px] bg-black/10 dark:bg-white/10"/>
 <div className="pt-8 grid grid-cols-1 md:grid-cols-12 gap-8">
 <div className="md:col-span-3">
 <div className="flex items-center gap-3 text-stone-600 dark:text-stone-400 mb-4">
 <BookOpen size={16} />
 <span className="font-sans text-[9px] uppercase tracking-[0.2em] font-bold">System Documentation</span>
 </div>
 <p className="font-sans text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400">
 Vol. 01 / Architecture
 </p>
 </div>
 <div className="md:col-span-9">
 <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl font-light tracking-tighter leading-[0.85] mb-8">
 The <span className="italic">Codex.</span>
 </h1>
 <p className="font-serif text-2xl md:text-3xl text-stone-600 dark:text-stone-300 max-w-3xl leading-snug">
 A comprehensive guide to Mimi Zine: an engine for aesthetic superintelligence and sovereign curation.
 </p>
 </div>
 </div>
 </header>

 {/* Core Philosophy */}
 <section className="mb-32 relative">
 <div className="absolute top-0 left-0 w-full h-[1px] bg-black/10 dark:bg-white/10"/>
 <div className="pt-8 grid grid-cols-1 md:grid-cols-12 gap-8">
 <div className="md:col-span-3">
 <h2 className="font-sans text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">01. Core Philosophy</h2>
 </div>
 <div className="md:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-12">
 <p className="font-serif text-xl leading-relaxed text-stone-700 dark:text-stone-300">
 Mimi is not a mere content generator; it is a <span className="italic">Sovereign Registry</span> for your aesthetic identity. It operates on the principle that true style is not adopted, but synthesized through rigorous curation and algorithmic reflection.
 </p>
 <p className="font-serif text-xl leading-relaxed text-stone-700 dark:text-stone-300">
 By feeding the engine your raw thoughts, visual fragments, and cultural obsessions, Mimi acts as a mirror, refracting your inputs into polished, editorial manifests. Over time, the system learns your unique visual language, helping you govern your aesthetic drift.
 </p>
 </div>
 </div>
 </section>

 {/* The 5 Pillars */}
 <section className="mb-32 relative">
 <div className="absolute top-0 left-0 w-full h-[1px] bg-black/10 dark:bg-white/10"/>
 <div className="pt-8 grid grid-cols-1 md:grid-cols-12 gap-8">
 <div className="md:col-span-3">
 <h2 className="font-sans text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">02. The Five Pillars</h2>
 </div>
 <div className="md:col-span-9">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
 
 <div className="group">
 <div className="flex items-center gap-4 mb-4 pb-4 border-b border-black/5 dark:border-white/5">
 <Sparkles size={18} className="text-stone-400 group-hover:text-stone-800 dark:hover:text-stone-300 transition-colors"/>
 <h3 className="font-serif text-3xl italic tracking-tight">1. Studio</h3>
 </div>
 <p className="font-sans text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
 <span className="font-bold text-stone-800 dark:text-stone-200">The Artifact Engine.</span> Where you act. The primary workspace for assembling artifacts, adjusting materiality via Tailor Tools, and utilizing historical presets.
 </p>
 </div>

 <div className="group">
 <div className="flex items-center gap-4 mb-4 pb-4 border-b border-black/5 dark:border-white/5">
 <ShieldCheck size={18} className="text-stone-400 group-hover:text-indigo-500 transition-colors"/>
 <h3 className="font-serif text-3xl italic tracking-tight">2. Signature</h3>
 </div>
 <p className="font-sans text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
 <span className="font-bold text-stone-800 dark:text-stone-200">The Identity Dashboard.</span> Where you define who you are. The analytical backbone providing your Aesthetic Genome, Taste Graph, and the Calibration Ritual (The Ward).
 </p>
 </div>

 <div className="group">
 <div className="flex items-center gap-4 mb-4 pb-4 border-b border-black/5 dark:border-white/5">
 <Archive size={18} className="text-stone-400 group-hover:text-amber-500 transition-colors"/>
 <h3 className="font-serif text-3xl italic tracking-tight">3. Archive</h3>
 </div>
 <p className="font-sans text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
 <span className="font-bold text-stone-800 dark:text-stone-200">The Creative Memory.</span> Where you remember. A living map of your raw fragments, indexed by motif, including the Temporal Nebula and the Darkroom for unprocessed thoughts.
 </p>
 </div>

 <div className="group">
 <div className="flex items-center gap-4 mb-4 pb-4 border-b border-black/5 dark:border-white/5">
 <Compass size={18} className="text-stone-400 group-hover:text-rose-500 transition-colors"/>
 <h3 className="font-serif text-3xl italic tracking-tight">4. Threads</h3>
 </div>
 <p className="font-sans text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
 <span className="font-bold text-stone-800 dark:text-stone-200">The Narrative Engine.</span> Where you connect. Visualizes semantic paths through your history (Biographical, Influence, Emotional) and predicts aesthetic drift via Trace & Scry.
 </p>
 </div>

 <div className="group">
 <div className="flex items-center gap-4 mb-4 pb-4 border-b border-black/5 dark:border-white/5">
 <LayoutGrid size={18} className="text-stone-400 group-hover:text-cyan-500 transition-colors"/>
 <h3 className="font-serif text-3xl italic tracking-tight">5. Floor</h3>
 </div>
 <p className="font-sans text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
 <span className="font-bold text-stone-800 dark:text-stone-200">The Cultural Intelligence Layer.</span> Where you observe. The external view connecting you to the wider world via the Resonance Feed and Trend Trajectories.
 </p>
 </div>

 </div>
 </div>
 </div>
 </section>

 {/* The Studio Toolbar */}
 <section className="mb-32 relative">
 <div className="absolute top-0 left-0 w-full h-[1px] bg-black/10 dark:bg-white/10"/>
 <div className="pt-8 grid grid-cols-1 md:grid-cols-12 gap-8">
 <div className="md:col-span-3">
 <h2 className="font-sans text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">03. The Studio Toolbar</h2>
 </div>
 <div className="md:col-span-9">
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
 
 <div className="group">
 <div className="flex items-center gap-3 mb-3">
 <Paperclip size={16} className="text-stone-400 group-hover:text-stone-800 dark:group-hover:text-stone-200 transition-colors"/>
 <h3 className="font-serif text-xl italic tracking-tight">Upload Media</h3>
 </div>
 <p className="font-sans text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
 Attach images, videos, or audio fragments to your zine. The engine will analyze these artifacts and weave their aesthetic DNA into the final manifest.
 </p>
 </div>

 <div className="group">
 <div className="flex items-center gap-3 mb-3">
 <Mic size={16} className="text-stone-400 group-hover:text-red-500 transition-colors"/>
 <h3 className="font-serif text-xl italic tracking-tight">Voice Transcription</h3>
 </div>
 <p className="font-sans text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
 Speak your thoughts directly into the engine. Perfect for capturing raw, unfiltered streams of consciousness before they dissipate.
 </p>
 </div>

 <div className="group">
 <div className="flex items-center gap-3 mb-3">
 <Zap size={16} className="text-stone-400 group-hover:text-yellow-500 transition-colors"/>
 <h3 className="font-serif text-xl italic tracking-tight">Lite Mode</h3>
 </div>
 <p className="font-sans text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
 Lightning-fast generations using the Flash Lite model. Ideal for quick thoughts, rapid iteration, and capturing fleeting aesthetic impulses.
 </p>
 </div>

 <div className="group">
 <div className="flex items-center gap-3 mb-3">
 <BrainCircuit size={16} className="text-stone-400 group-hover:text-purple-500 transition-colors"/>
 <h3 className="font-serif text-xl italic tracking-tight">Deep Thinking</h3>
 </div>
 <p className="font-sans text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
 Engages the Pro model with high-level reasoning. Produces deep, semiotic explorations and complex, long-form zines with profound structural rigor.
 </p>
 </div>

 <div className="group">
 <div className="flex items-center gap-3 mb-3">
 <Globe size={16} className="text-stone-400 group-hover:text-blue-500 transition-colors"/>
 <h3 className="font-serif text-xl italic tracking-tight">Search Grounding</h3>
 </div>
 <p className="font-sans text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
 Anchors your zines with relevant, real-time search data from the web. Ensures your aesthetic musings are connected to current cultural events.
 </p>
 </div>

 <div className="group">
 <div className="flex items-center gap-3 mb-3">
 <MapPin size={16} className="text-stone-400 group-hover:text-orange-500 transition-colors"/>
 <h3 className="font-serif text-xl italic tracking-tight">Maps Grounding</h3>
 </div>
 <p className="font-sans text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
 Integrates location-based intelligence and spatial context. Perfect for psychogeographic explorations and architectural critiques.
 </p>
 </div>

 <div className="group">
 <div className="flex items-center gap-3 mb-3">
 <Sparkles size={16} className="text-stone-400 group-hover:text-stone-800 dark:hover:text-stone-300 transition-colors"/>
 <h3 className="font-serif text-xl italic tracking-tight">Task Intelligence</h3>
 </div>
 <p className="font-sans text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
 Instructs Mimi to perform specific, high-precision tasks (e.g., analysis, identification) rather than open-ended generation, while maintaining her persona.
 </p>
 </div>

 <div className="group">
 <div className="flex items-center gap-3 mb-3">
 <Wand2 size={16} className="text-stone-400 group-hover:text-red-500 transition-colors"/>
 <h3 className="font-serif text-xl italic tracking-tight">Prompt Engine</h3>
 </div>
 <p className="font-sans text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
 Generates random, thought-provoking prompts to break creative block and push your aesthetic boundaries into uncharted territory.
 </p>
 </div>

 <div className="group">
 <div className="flex items-center gap-3 mb-3">
 <Eraser size={16} className="text-stone-400 group-hover:text-stone-800 dark:group-hover:text-stone-200 transition-colors"/>
 <h3 className="font-serif text-xl italic tracking-tight">Clear Input</h3>
 </div>
 <p className="font-sans text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
 Wipes the slate clean. A necessary destruction before new creation.
 </p>
 </div>

 </div>
 </div>
 </div>
 </section>

 {/* Deep Systems */}
 <section className="mb-32 relative">
 <div className="absolute top-0 left-0 w-full h-[1px] bg-black/10 dark:bg-white/10"/>
 <div className="pt-8 grid grid-cols-1 md:grid-cols-12 gap-8">
 <div className="md:col-span-3">
 <h2 className="font-sans text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">04. Deep Systems</h2>
 </div>
 <div className="md:col-span-9">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
 
 <div className="group">
 <div className="flex items-center gap-4 mb-4 pb-4 border-b border-black/5 dark:border-white/5">
 <Briefcase size={18} className="text-stone-400 group-hover:text-stone-500 transition-colors"/>
 <h3 className="font-serif text-3xl italic tracking-tight">Projects</h3>
 </div>
 <p className="font-sans text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
 Organize your manifests into strategic folders within the Archive. Generate <span className="text-stone-800 dark:text-stone-200 font-medium">Strategic Memos</span> to synthesize the contents of a folder into actionable creative direction.
 </p>
 </div>

 <div className="group">
 <div className="flex items-center gap-4 mb-4 pb-4 border-b border-black/5 dark:border-white/5">
 <Compass size={18} className="text-stone-400 group-hover:text-stone-500 transition-colors"/>
 <h3 className="font-serif text-3xl italic tracking-tight">Scry</h3>
 </div>
 <p className="font-sans text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
 Located in Threads. Query your archive using natural language. The Oracle will synthesize an answer based entirely on your past manifests and curated knowledge.
 </p>
 </div>

 <div className="group">
 <div className="flex items-center gap-4 mb-4 pb-4 border-b border-black/5 dark:border-white/5">
 <ShieldCheck size={18} className="text-stone-400 group-hover:text-stone-500 transition-colors"/>
 <h3 className="font-serif text-3xl italic tracking-tight">The Ward</h3>
 </div>
 <p className="font-sans text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
 The autonomous governance module within your Signature. <span className="text-stone-800 dark:text-stone-200 font-medium">Curator</span> analyzes your actual output, while <span className="text-stone-800 dark:text-stone-200 font-medium">Sentinel</span> compares it against your Tailor settings to detect"Aesthetic Drift".
 </p>
 </div>

 <div className="group">
 <div className="flex items-center gap-4 mb-4 pb-4 border-b border-black/5 dark:border-white/5">
 <FlaskConical size={18} className="text-stone-400 group-hover:text-stone-500 transition-colors"/>
 <h3 className="font-serif text-3xl italic tracking-tight">Darkroom</h3>
 </div>
 <p className="font-sans text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
 An experimental space in the Archive for visual synthesis. Combine multiple image shards to generate entirely new, cohesive visual concepts based on your archive's DNA.
 </p>
 </div>

 <div className="group">
 <div className="flex items-center gap-4 mb-4 pb-4 border-b border-black/5 dark:border-white/5">
 <Target size={18} className="text-stone-400 group-hover:text-stone-500 transition-colors"/>
 <h3 className="font-serif text-3xl italic tracking-tight">The Loom</h3>
 </div>
 <p className="font-sans text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
 <span className="text-stone-800 dark:text-stone-200 font-medium">Platform Strategy.</span> A multi-step diagnostic ritual that analyzes your intent, platform dynamics (Instagram, TikTok, YouTube, Substack, Facebook), and aesthetic identity to generate actionable, platform-specific content strategies.
 </p>
 </div>

 <div className="group">
 <div className="flex items-center gap-4 mb-4 pb-4 border-b border-black/5 dark:border-white/5">
 <ListChecks size={18} className="text-stone-400 group-hover:text-stone-500 transition-colors"/>
 <h3 className="font-serif text-3xl italic tracking-tight">Action Board</h3>
 </div>
 <p className="font-sans text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
 <span className="text-stone-800 dark:text-stone-200 font-medium">Strategic Imperatives.</span> A centralized hub for managing tasks exported from The Loom or created manually. Organize your content creation workflow with list and timeline views.
 </p>
 </div>

 </div>
 </div>
 </div>
 </section>

 {/* The Synthesis Pipeline */}
 <section className="mb-32 relative">
 <div className="absolute top-0 left-0 w-full h-[1px] bg-black/10 dark:bg-white/10"/>
 <div className="pt-8 grid grid-cols-1 md:grid-cols-12 gap-8">
 <div className="md:col-span-3">
 <h2 className="font-sans text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">05. The Synthesis Pipeline</h2>
 </div>
 <div className="md:col-span-9 space-y-12">
 
 <div className="relative pl-8 md:pl-12">
 <div className="absolute left-0 top-2 bottom-0 w-[1px] bg-stone-500/30"/>
 <h4 className="font-serif italic text-2xl text dark:text-white mb-3">The Holding Bay</h4>
 <p className="font-sans text-sm text-stone-600 dark:text-stone-400 leading-relaxed max-w-2xl">
 During synthesis, the user is placed in an immersive"Holding Bay". This is not a loading screen; it is a transitional space designed to bypass digital"brain rot"and prepare the user for the incoming aesthetic revelation. The bay displays cryptic, thematic messages reflecting the computational rigor of the generation process.
 </p>
 </div>

 <div className="relative pl-8 md:pl-12">
 <div className="absolute left-0 top-2 bottom-0 w-[1px] bg-indigo-500/30"/>
 <h4 className="font-serif italic text-2xl text dark:text-white mb-3">Automated Navigation</h4>
 <p className="font-sans text-sm text-stone-600 dark:text-stone-400 leading-relaxed max-w-2xl">
 Upon completion of the synthesis, the system automatically transitions the user from the Holding Bay directly into the generated Zine. This seamless flow eliminates unnecessary friction and maintains the immersive experience.
 </p>
 </div>

 <div className="relative pl-8 md:pl-12">
 <div className="absolute left-0 top-2 bottom-0 w-[1px] bg-amber-500/30"/>
 <h4 className="font-serif italic text-2xl text dark:text-white mb-3">The Omni-Bar</h4>
 <p className="font-sans text-sm text-stone-600 dark:text-stone-400 leading-relaxed max-w-2xl">
 Within the Zine presentation (AnalysisDisplay), all actions are centralized into a unified, fixed"Omni-Bar"at the bottom of the screen. This glassmorphic pill contains minimalist icons for Export, Save, Broadcast, Voice Transmission, Motion Refraction, and Continuum, decluttering the interface and focusing attention on the generated artifact.
 </p>
 </div>

 </div>
 </div>
 </section>

 {/* Advanced Protocols */}
 <section className="mb-32 relative">
 <div className="absolute top-0 left-0 w-full h-[1px] bg-black/10 dark:bg-white/10"/>
 <div className="pt-8 grid grid-cols-1 md:grid-cols-12 gap-8">
 <div className="md:col-span-3">
 <h2 className="font-sans text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">06. Advanced Protocols</h2>
 </div>
 <div className="md:col-span-9 space-y-12">
 
 <div className="relative pl-8 md:pl-12">
 <div className="absolute left-0 top-2 bottom-0 w-[1px] bg-stone-500/30"/>
 <h4 className="font-serif italic text-2xl text dark:text-white mb-3">Deep Refraction</h4>
 <p className="font-sans text-sm text-stone-600 dark:text-stone-400 leading-relaxed max-w-2xl">
 When enabled in the Studio, the engine spends significantly more time analyzing your input against your Signature profile. It produces highly structured, multi-section editorial layouts with profound semiotic depth. Use this for major conceptual pieces.
 </p>
 </div>

 <div className="relative pl-8 md:pl-12">
 <div className="absolute left-0 top-2 bottom-0 w-[1px] bg-amber-500/30"/>
 <div className="flex items-center gap-3 mb-3">
 <h4 className="font-serif italic text-2xl text dark:text-white">Cultural Grounding</h4>
 <span className="px-2 py-0.5 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[9px] font-mono uppercase tracking-widest">High-Fidelity</span>
 </div>
 <p className="font-sans text-sm text-stone-600 dark:text-stone-400 leading-relaxed max-w-2xl">
 A sovereign capability unlocked via the High-Fidelity (Couture) Engine. By enabling the globe icon in the Studio, the engine queries the live internet to anchor your generations in current cultural contexts. This ensures your output isn't just aesthetically pleasing, but deeply relevant to contemporary events, emerging subcultures, and real-time data touchpoints.
 </p>
 </div>

 <div className="relative pl-8 md:pl-12">
 <div className="absolute left-0 top-2 bottom-0 w-[1px] bg-indigo-500/30"/>
 <h4 className="font-serif italic text-2xl text dark:text-white mb-3">Voice Consultation</h4>
 <p className="font-sans text-sm text-stone-600 dark:text-stone-400 leading-relaxed max-w-2xl">
 Available within The Ward (Signature). Initiate a live, real-time voice session with the system's persona. It will interrogate your aesthetic choices and discuss your recent drift in a highly editorial, conversational format.
 </p>
 </div>

 </div>
 </div>
 </section>

 {/* Platform Strategies */}
 <section className="mb-32 relative">
 <div className="absolute top-0 left-0 w-full h-[1px] bg-black/10 dark:bg-white/10"/>
 <div className="pt-8 grid grid-cols-1 md:grid-cols-12 gap-8">
 <div className="md:col-span-3">
 <h2 className="font-sans text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">07. Platform Strategies</h2>
 </div>
 <div className="md:col-span-9 space-y-12">
 
 <div className="relative pl-8 md:pl-12">
 <div className="absolute left-0 top-2 bottom-0 w-[1px] bg-pink-500/30"/>
 <h4 className="font-serif italic text-2xl text dark:text-white mb-3">Instagram</h4>
 <p className="font-sans text-sm text-stone-600 dark:text-stone-400 leading-relaxed max-w-2xl">
 Focuses on visual cohesion, grid aesthetics, and narrative storytelling through Stories and Reels. Emphasizes high-quality imagery, consistent color palettes, and community engagement via DMs and comments.
 </p>
 </div>

 <div className="relative pl-8 md:pl-12">
 <div className="absolute left-0 top-2 bottom-0 w-[1px] bg-cyan-500/30"/>
 <h4 className="font-serif italic text-2xl text dark:text-white mb-3">TikTok</h4>
 <p className="font-sans text-sm text-stone-600 dark:text-stone-400 leading-relaxed max-w-2xl">
 Prioritizes short-form video, retention loops, and rewatchability. Strategies revolve around trend participation, authentic"lo-fi"aesthetics, strong hooks within the first 3 seconds, and sound-driven content.
 </p>
 </div>

 <div className="relative pl-8 md:pl-12">
 <div className="absolute left-0 top-2 bottom-0 w-[1px] bg-red-500/30"/>
 <h4 className="font-serif italic text-2xl text dark:text-white mb-3">YouTube</h4>
 <p className="font-sans text-sm text-stone-600 dark:text-stone-400 leading-relaxed max-w-2xl">
 Centers on long-form value, click-through rate (CTR) optimization, and session time maximization. Requires effective thumbnail/title pairing, structured storytelling, and high-fidelity production value.
 </p>
 </div>

 <div className="relative pl-8 md:pl-12">
 <div className="absolute left-0 top-2 bottom-0 w-[1px] bg-orange-500/30"/>
 <h4 className="font-serif italic text-2xl text dark:text-white mb-3">Substack</h4>
 <p className="font-sans text-sm text-stone-600 dark:text-stone-400 leading-relaxed max-w-2xl">
 Built for deep-dive written content, intellectual exploration, and direct audience monetization. Emphasizes distinct editorial voice, consistent publishing schedules, and community building through comments and chat.
 </p>
 </div>

 <div className="relative pl-8 md:pl-12">
 <div className="absolute left-0 top-2 bottom-0 w-[1px] bg-blue-500/30"/>
 <h4 className="font-serif italic text-2xl text dark:text-white mb-3">Facebook</h4>
 <p className="font-sans text-sm text-stone-600 dark:text-stone-400 leading-relaxed max-w-2xl">
 Focuses on community building, consistent brand identity, and strategic use of formats (Reels, Stories, Feed). Leverages Groups for deep engagement and targeted advertising for reach.
 </p>
 </div>

 </div>
 </div>
 </section>

 {/* The Taste Graph */}
 <section className="mb-32 relative">
 <div className="absolute top-0 left-0 w-full h-[1px] bg-black/10 dark:bg-white/10"/>
 <div className="pt-8 grid grid-cols-1 md:grid-cols-12 gap-8">
 <div className="md:col-span-3">
 <h2 className="font-sans text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">08. The Taste Graph</h2>
 </div>
 <div className="md:col-span-9 space-y-12">
 
 <div className="relative pl-8 md:pl-12">
 <div className="absolute left-0 top-2 bottom-0 w-[1px] bg-stone-500/30"/>
 <div className="flex items-center gap-3 mb-3">
 <h4 className="font-serif italic text-2xl text dark:text-white">Aesthetic Embeddings</h4>
 <span className="px-2 py-0.5 border border-stone-500/30 text-stone-600 dark:text-stone-400 text-[9px] font-mono uppercase tracking-widest">Infrastructure</span>
 </div>
 <p className="font-sans text-sm text-stone-600 dark:text-stone-400 leading-relaxed max-w-2xl">
 Every interaction you have with Mimi—fragments saved, references input, visual styles liked—is converted into structured data via semantic embeddings. Over time, the system learns your <span className="text-stone-800 dark:text-stone-200 font-medium">Aesthetic Profile</span> as an evolving vector, enabling deep personalization, trend detection, and creative matching across all pillars.
 </p>
 </div>

 </div>
 </div>
 </section>

 {/* Game Plan */}
 <section className="mb-32 relative">
 <div className="absolute top-0 left-0 w-full h-[1px] bg-black/10 dark:bg-white/10"/>
 <div className="pt-8 grid grid-cols-1 md:grid-cols-12 gap-8">
 <div className="md:col-span-3">
 <h2 className="font-sans text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">09. Game Plan</h2>
 </div>
 <div className="md:col-span-9">
 <p className="font-serif text-xl leading-relaxed text-stone-700 dark:text-stone-300 mb-8">
 Our current development focus is on refining"The Edit"page, ensuring seamless integration of real product data, and preparing for future ad-targeting concepts.
 </p>
 <FeatureChecklist />
 <ul className="font-sans text-sm text-stone-600 dark:text-stone-400 leading-relaxed space-y-4 mt-8">
 <li><span className="font-bold text-stone-800 dark:text-stone-200">1. Affiliate Link Integration:</span> Implement logic to display and handle affiliate links within product cards in the"Market"view.</li>
 <li><span className="font-bold text-stone-800 dark:text-stone-200">2. Synthesis Element Refinement:</span> Enhance the"Synthesis_Portal"for dynamic, visually integrated content.</li>
 <li><span className="font-bold text-stone-800 dark:text-stone-200">3. Ad Integration Strategy:</span> Connect the"Sponsored Aesthetic Cluster"placeholder to a backend service for ad selection based on user taste vectors.</li>
 </ul>
 </div>
 </div>
 </section>

 {/* System Status */}
 <section className="relative">
 <div className="absolute top-0 left-0 w-full h-[1px] bg-black/10 dark:bg-white/10"/>
 <div className="pt-8 grid grid-cols-1 md:grid-cols-12 gap-8">
 <div className="md:col-span-3">
 <h2 className="font-sans text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">10. System Status</h2>
 </div>
 <div className="md:col-span-9">
 <Diagnostics />
 </div>
 </div>
 </section>

 </div>
 </div>
 );
};
