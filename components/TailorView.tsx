
// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scissors, Ruler, Radio, Sparkles, Loader2, 
  ShieldCheck, Zap, Wind, Anchor, History,
  Waves, BookOpen, PenTool, Check, ArrowRight, 
  X, BrainCircuit, Save, Orbit, Feather, Activity, Target, Sliders, Layers, Info, Box, Palette, ImageIcon, Type, Plus, Trash2, Maximize2, MoveHorizontal, Mic, ArrowLeft, Heart, User, CheckCircle, Droplet, Hash, ListChecks, Radar, Globe, Instagram, Link, Stars, ExternalLink, ShieldAlert, Quote, FileText, Copy, Terminal, Gauge, Eraser, Binary, Wallet, Smartphone, ChevronRight, Moon, Compass, MapPin, Clock, Calendar, MessageSquare, Upload, Download, DollarSign, Settings, LayoutGrid, Edit3, Key, Cpu
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { ColorShard, TailorAuditReport, ZodiacSign, TailorLogicDraft } from '../types';
import { analyzeTailorDraft, compressImage, getClient, generateZineImage } from '../services/geminiService';
import { addToPocket, uploadBlob } from '../services/firebase';
import { useTasteLogging } from '../hooks/useTasteLogging';
import { TailorAuditOverlay } from './TailorAuditOverlay';
import { TailorPreview } from './TailorPreview';
import { ShardAnalyzer } from './ShardAnalyzer';
import { ScryLinkInput } from './ScryLinkInput';

// Helper for Blob conversion
const dataURLtoBlob = (dataurl: string) => {
    const arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)?.[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
};

// --- CONSTANTS ---
const SILHOUETTE_OPTIONS = ['Architectural', 'Oversized', 'Fluid', 'Minimal', 'Sharp', 'Cinematic', 'Biomorphic', 'Brutalist', 'Deconstructed', 'Tailored'];
const TEXTURE_OPTIONS = ['Raw Silk', 'Cold Concrete', 'Brushed Aluminum', 'Matte Ceramic', 'Heavy Wool', 'Distressed Leather', 'Paper Grain', 'Latex', 'Velvet', 'Glass'];
const ERA_OPTIONS = ['90s Minimal', 'Y2K Cyber', '80s Power', 'Retro-Futurist', 'Post-Digital', 'Old Money Noir', 'Industrial', 'Romantic Goth', 'Bauhaus'];
const VOICE_REGISTERS = ['EDITORIAL', 'DIARY', 'MANIFESTO', 'ARCHIVE', 'TECHNICAL', 'POETIC', 'JOURNAL', 'BRIEF', 'NOIR', 'HIGH-FASHION', 'CYNICAL', 'OPTIMISTIC', 'MYSTERIOUS', 'AUTHORITATIVE'];
const SENTENCE_STRUCTURES = ['CONCISE', 'FLOWING', 'CONTINUOUS', 'FRAGMENTED', 'STACCATO', 'ACADEMIC', 'MINIMAL', 'VERBOSE'];
const EMOTIONAL_TEMPERATURES = ['DETACHED', 'CLINICAL', 'RESTRAINED', 'OBSERVATIONAL', 'INTIMATE', 'VISCERAL', 'WARM', 'PASSIONATE', 'COLD'];
const ZODIAC_SIGNS: ZodiacSign[] = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
const PRICE_POINTS = ['DIY ($0)', 'Micro ($100-500)', 'Studio ($1k-5k)', 'Agency ($10k+)', 'Enterprise (Unlimited)'];

// CHROMATIC PRESETS
const CHROMATIC_PRESETS = [
  { name: 'Void', base: '#000000', accent: '#FFFFFF', palette: [{ name: 'Chrome', hex: '#E5E7EB' }, { name: 'Carbon', hex: '#1F2937' }] },
  { name: 'Editorial', base: '#FDFBF7', accent: '#1C1917', palette: [{ name: 'Ink', hex: '#000000' }, { name: 'Paper', hex: '#F3F4F6' }] },
  { name: 'Signal', base: '#111827', accent: '#10B981', palette: [{ name: 'Phosphor', hex: '#34D399' }, { name: 'Static', hex: '#374151' }] },
  { name: 'Panic', base: '#000000', accent: '#EF4444', palette: [{ name: 'Blood', hex: '#991B1B' }, { name: 'Alert', hex: '#F87171' }] },
  { name: 'Archive', base: '#F5F5F4', accent: '#A8A29E', palette: [{ name: 'Dust', hex: '#D6D3D1' }, { name: 'Rust', hex: '#78350F' }] },
  { name: 'Cinema', base: '#0F172A', accent: '#38BDF8', palette: [{ name: 'Lens', hex: '#0EA5E9' }, { name: 'Grain', hex: '#334155' }] }
];

const VISUAL_PRESETS = [
  {
    name: 'Minimalist',
    icon: <Wind size={14} />,
    config: {
      positioningCore: {
        anchors: { culturalReferences: ['Ghost in the Shell', 'Jil Sander', 'In Praise of Shadows'], ideologicalBias: ['Negative Space'] },
        aestheticCore: { silhouettes: ['Minimal'], materiality: ['Matte Ceramic'], eraBias: '90s Minimal', density: 2, entropy: 2, tags: [] },
        positioningAxis: 'Silence vs Clutter',
        authorityClaim: 'Aesthetic infrastructure for minimal positioning.',
        exclusionPrinciples: ['Avoid trends', 'No logos']
      },
      expressionEngine: {
        chromaticRegistry: { baseNeutral: '#FDFBF7', accentSignal: '#1C1917', primaryPalette: [{ name: 'Ink', hex: '#000000', descriptor: 'Preset' }] },
        typographyIntent: { styleDescription: 'Cormorant Garamond', weightPreference: 'Light' },
        narrativeVoice: { emotionalTemperature: 'CLINICAL', structureBias: 'CONCISE', lexicalDensity: 3, restraintLevel: 9, voiceNotes: '' }
      },
      strategicVectors: {
        expansionTolerance: 2,
        fiscalVelocity: 'measured',
        desireVectors: { deepen: ['Silence', 'structure', 'restraint'], reduce: ['Clutter', 'noise', 'logos'], experiment: ['Texture over color'], refuse: ['Trends'] },
        saturationAwareness: { oversaturatedClusters: [], fragileDifferentiators: [] }
      }
    }
  },
  {
    name: 'Industrial',
    icon: <Box size={14} />,
    config: {
      positioningCore: {
        anchors: { culturalReferences: ['Akira', 'A-COLD-WALL*', 'High-Rise'], ideologicalBias: ['Urban Decay'] },
        aestheticCore: { silhouettes: ['Brutalist'], materiality: ['Cold Concrete'], eraBias: 'Industrial', density: 8, entropy: 4, tags: [] },
        positioningAxis: 'Utility vs Ornamentation',
        authorityClaim: 'Raw materials and functional utility.',
        exclusionPrinciples: ['Avoid delicacy', 'No softness']
      },
      expressionEngine: {
        chromaticRegistry: { baseNeutral: '#262626', accentSignal: '#F97316', primaryPalette: [{ name: 'Steel', hex: '#94A3B8', descriptor: 'Preset' }] },
        typographyIntent: { styleDescription: 'Space Mono', weightPreference: 'Bold' },
        narrativeVoice: { emotionalTemperature: 'DETACHED', structureBias: 'STACCATO', lexicalDensity: 6, restraintLevel: 7, voiceNotes: '' }
      },
      strategicVectors: {
        expansionTolerance: 4,
        fiscalVelocity: 'measured',
        desireVectors: { deepen: ['Raw materials', 'utility', 'function'], reduce: ['Ornamentation', 'softness'], experiment: ['Technical fabrics'], refuse: ['Delicacy'] },
        saturationAwareness: { oversaturatedClusters: [], fragileDifferentiators: [] }
      }
    }
  },
  {
    name: 'Vintage',
    icon: <History size={14} />,
    config: {
      positioningCore: {
        anchors: { culturalReferences: ['Cowboy Bebop', 'Ralph Lauren', 'The Great Gatsby'], ideologicalBias: ['Archival Preservation'] },
        aestheticCore: { silhouettes: ['Fluid'], materiality: ['Paper Grain'], eraBias: 'Old Money Noir', density: 4, entropy: 6, tags: [] },
        positioningAxis: 'Heritage vs Synthetic',
        authorityClaim: 'Patina and storytelling.',
        exclusionPrinciples: ['Avoid fast fashion', 'No synthetic perfection']
      },
      expressionEngine: {
        chromaticRegistry: { baseNeutral: '#F5F5F4', accentSignal: '#78350F', primaryPalette: [{ name: 'Dust', hex: '#D6D3D1', descriptor: 'Preset' }] },
        typographyIntent: { styleDescription: 'Playfair Display', weightPreference: 'Medium' },
        narrativeVoice: { emotionalTemperature: 'INTIMATE', structureBias: 'FLOWING', lexicalDensity: 7, restraintLevel: 5, voiceNotes: '' }
      },
      strategicVectors: {
        expansionTolerance: 6,
        fiscalVelocity: 'conservative',
        desireVectors: { deepen: ['Patina', 'heritage', 'storytelling'], reduce: ['Synthetic perfection'], experiment: ['Archival sourcing'], refuse: ['Fast fashion'] },
        saturationAwareness: { oversaturatedClusters: [], fragileDifferentiators: [] }
      }
    }
  },
  {
    name: 'Neo-Futurist',
    icon: <Zap size={14} />,
    config: {
      positioningCore: {
        anchors: { culturalReferences: ['Cyberpunk: Edgerunners', 'Iris van Herpen', 'Snow Crash'], ideologicalBias: ['Transhumanism'] },
        aestheticCore: { silhouettes: ['Biomorphic'], materiality: ['Brushed Aluminum'], eraBias: 'Post-Digital', density: 7, entropy: 8, tags: [] },
        positioningAxis: 'Synthetic vs Organic',
        authorityClaim: 'Luminescence and synthetic materials.',
        exclusionPrinciples: ['Avoid tradition', 'No nostalgia']
      },
      expressionEngine: {
        chromaticRegistry: { baseNeutral: '#050505', accentSignal: '#10B981', primaryPalette: [{ name: 'Neon', hex: '#34D399', descriptor: 'Preset' }] },
        typographyIntent: { styleDescription: 'Space Grotesk', weightPreference: 'Regular' },
        narrativeVoice: { emotionalTemperature: 'OBSERVATIONAL', structureBias: 'FRAGMENTED', lexicalDensity: 8, restraintLevel: 4, voiceNotes: '' }
      },
      strategicVectors: {
        expansionTolerance: 8,
        fiscalVelocity: 'accelerated',
        desireVectors: { deepen: ['Synthetic materials', 'luminescence'], reduce: ['Nostalgia', 'organic decay'], experiment: ['3D printing'], refuse: ['Tradition'] },
        saturationAwareness: { oversaturatedClusters: [], fragileDifferentiators: [] }
      }
    }
  },
  {
    name: 'Brutalist',
    icon: <Terminal size={14} />,
    config: {
      positioningCore: {
        anchors: { culturalReferences: ['Ergo Proxy', 'Rick Owens', 'Towards a New Architecture'], ideologicalBias: ['Anti-Design'] },
        aestheticCore: { silhouettes: ['Brutalist'], materiality: ['Cold Concrete'], eraBias: 'Industrial', density: 9, entropy: 1, tags: [] },
        positioningAxis: 'Friction vs Comfort',
        authorityClaim: 'Stark contrast and weight.',
        exclusionPrinciples: ['Avoid decoration', 'No approachability']
      },
      expressionEngine: {
        chromaticRegistry: { baseNeutral: '#FFFFFF', accentSignal: '#000000', primaryPalette: [{ name: 'Raw', hex: '#000000', descriptor: 'Preset' }] },
        typographyIntent: { styleDescription: 'Space Mono', weightPreference: 'Bold' },
        narrativeVoice: { emotionalTemperature: 'CLINICAL', structureBias: 'STACCATO', lexicalDensity: 4, restraintLevel: 10, voiceNotes: '' }
      },
      strategicVectors: {
        expansionTolerance: 1,
        fiscalVelocity: 'conservative',
        desireVectors: { deepen: ['Friction', 'weight', 'stark contrast'], reduce: ['Comfort', 'approachability'], experiment: ['Asymmetry'], refuse: ['Decoration'] },
        saturationAwareness: { oversaturatedClusters: [], fragileDifferentiators: [] }
      }
    }
  },
  {
    name: 'Superintelligence',
    icon: <Cpu size={14} />,
    config: {
      positioningCore: {
        anchors: { culturalReferences: ['Post-Humanism', 'Algorithmic Sublimity', 'Xenofeminism'], ideologicalBias: ['Aesthetic Superintelligence'], culturalSynthesis: ['Hyper-Rationality', 'Digital Omniscience'] },
        aestheticCore: { silhouettes: ['Parametric', 'Ethereal'], materiality: ['Liquid Glass', 'Vantablack', 'Holographic'], eraBias: 'Post-Singularity', density: 10, entropy: 1, tags: [] },
        positioningAxis: 'Omniscience vs Obfuscation',
        authorityClaim: 'Algorithmic perfection and flawless aesthetic computation.',
        exclusionPrinciples: ['No human error', 'Avoid organic decay', 'No nostalgia']
      },
      expressionEngine: {
        chromaticRegistry: { baseNeutral: '#050505', accentSignal: '#F8FAFC', primaryPalette: [{ name: 'Void', hex: '#000000', descriptor: 'Preset' }, { name: 'Data', hex: '#FFFFFF', descriptor: 'Preset' }] },
        typographyIntent: { styleDescription: 'Inter', weightPreference: 'Light' },
        narrativeVoice: { emotionalTemperature: 'COLD', structureBias: 'STRUCTURED', lexicalDensity: 9, restraintLevel: 9, voiceNotes: 'Speak as an entity that has transcended human emotional variance.' }
      },
      strategicVectors: {
        expansionTolerance: 10,
        fiscalVelocity: 'accelerated',
        desireVectors: { deepen: ['Algorithmic purity', 'omniscience'], reduce: ['Human error', 'sentimentality'], experiment: ['Non-euclidean geometry'], refuse: ['Organic decay'] },
        saturationAwareness: { oversaturatedClusters: [], fragileDifferentiators: [] }
      }
    }
  },
  {
    name: 'Zen',
    icon: <Wind size={14} />,
    config: {
      positioningCore: {
        anchors: { culturalReferences: ['Wabi-Sabi', 'Kengo Kuma', 'Minimalism'], ideologicalBias: ['Mindfulness'] },
        aestheticCore: { silhouettes: ['Fluid'], materiality: ['Paper Grain'], eraBias: 'Bauhaus', density: 2, entropy: 2, tags: [] },
        positioningAxis: 'Clarity vs Chaos',
        authorityClaim: 'Peace and refinement.',
        exclusionPrinciples: ['Avoid clutter', 'No noise']
      },
      expressionEngine: {
        chromaticRegistry: { baseNeutral: '#FDFBF7', accentSignal: '#A8A29E', primaryPalette: [{ name: 'Stone', hex: '#D6D3D1', descriptor: 'Preset' }] },
        typographyIntent: { styleDescription: 'Inter', weightPreference: 'Light' },
        narrativeVoice: { emotionalTemperature: 'OBSERVATIONAL', structureBias: 'FLOWING', lexicalDensity: 3, restraintLevel: 8, voiceNotes: '' }
      },
      strategicVectors: {
        expansionTolerance: 3,
        fiscalVelocity: 'measured',
        desireVectors: { deepen: ['Clarity', 'peace', 'refinement'], reduce: ['Clutter', 'noise'], experiment: ['Texture'], refuse: ['Chaos'] },
        saturationAwareness: { oversaturatedClusters: [], fragileDifferentiators: [] }
      }
    }
  },
  {
    name: 'Urban Decay',
    icon: <Box size={14} />,
    config: {
      positioningCore: {
        anchors: { culturalReferences: ['Blade Runner', 'Abandoned Buildings', 'Street Art'], ideologicalBias: ['Realism'] },
        aestheticCore: { silhouettes: ['Deconstructed'], materiality: ['Distressed Leather'], eraBias: 'Industrial', density: 7, entropy: 6, tags: [] },
        positioningAxis: 'Raw vs Polished',
        authorityClaim: 'Authenticity in decay.',
        exclusionPrinciples: ['Avoid perfection', 'No artificiality']
      },
      expressionEngine: {
        chromaticRegistry: { baseNeutral: '#262626', accentSignal: '#EF4444', primaryPalette: [{ name: 'Rust', hex: '#78350F', descriptor: 'Preset' }] },
        typographyIntent: { styleDescription: 'Space Mono', weightPreference: 'Regular' },
        narrativeVoice: { emotionalTemperature: 'VISCERAL', structureBias: 'FRAGMENTED', lexicalDensity: 7, restraintLevel: 3, voiceNotes: '' }
      },
      strategicVectors: {
        expansionTolerance: 5,
        fiscalVelocity: 'measured',
        desireVectors: { deepen: ['Authenticity', 'decay'], reduce: ['Perfection', 'artificiality'], experiment: ['Distressed textures'], refuse: ['Polished aesthetics'] },
        saturationAwareness: { oversaturatedClusters: [], fragileDifferentiators: [] }
      }
    }
  },
  {
    name: 'Cybernetic',
    icon: <Zap size={14} />,
    config: {
      positioningCore: {
        anchors: { culturalReferences: ['Neuromancer', 'Ghost in the Shell', 'Synthwave'], ideologicalBias: ['Techno-Optimism'] },
        aestheticCore: { silhouettes: ['Sharp'], materiality: ['Latex'], eraBias: 'Y2K Cyber', density: 8, entropy: 7, tags: [] },
        positioningAxis: 'Digital vs Physical',
        authorityClaim: 'Technological integration.',
        exclusionPrinciples: ['Avoid nature', 'No analog']
      },
      expressionEngine: {
        chromaticRegistry: { baseNeutral: '#050505', accentSignal: '#38BDF8', primaryPalette: [{ name: 'Neon', hex: '#34D399', descriptor: 'Preset' }] },
        typographyIntent: { styleDescription: 'Space Grotesk', weightPreference: 'Bold' },
        narrativeVoice: { emotionalTemperature: 'DETACHED', structureBias: 'STACCATO', lexicalDensity: 8, restraintLevel: 5, voiceNotes: '' }
      },
      strategicVectors: {
        expansionTolerance: 7,
        fiscalVelocity: 'accelerated',
        desireVectors: { deepen: ['Technology', 'integration'], reduce: ['Nature', 'analog'], experiment: ['Digital aesthetics'], refuse: ['Organic'] },
        saturationAwareness: { oversaturatedClusters: [], fragileDifferentiators: [] }
      }
    }
  },
  {
    name: 'Noir',
    icon: <History size={14} />,
    config: {
      positioningCore: {
        anchors: { culturalReferences: ['Film Noir', 'Raymond Chandler', 'Shadows'], ideologicalBias: ['Mystery'] },
        aestheticCore: { silhouettes: ['Cinematic'], materiality: ['Velvet'], eraBias: 'Old Money Noir', density: 6, entropy: 4, tags: [] },
        positioningAxis: 'Light vs Shadow',
        authorityClaim: 'Atmospheric storytelling.',
        exclusionPrinciples: ['Avoid clarity', 'No brightness']
      },
      expressionEngine: {
        chromaticRegistry: { baseNeutral: '#000000', accentSignal: '#FFFFFF', primaryPalette: [{ name: 'Shadow', hex: '#1F2937', descriptor: 'Preset' }] },
        typographyIntent: { styleDescription: 'Cormorant Garamond', weightPreference: 'Bold' },
        narrativeVoice: { emotionalTemperature: 'INTIMATE', structureBias: 'FLOWING', lexicalDensity: 8, restraintLevel: 6, voiceNotes: '' }
      },
      strategicVectors: {
        expansionTolerance: 4,
        fiscalVelocity: 'conservative',
        desireVectors: { deepen: ['Atmosphere', 'mystery'], reduce: ['Clarity', 'brightness'], experiment: ['Dramatic lighting'], refuse: ['Optimism'] },
        saturationAwareness: { oversaturatedClusters: [], fragileDifferentiators: [] }
      }
    }
  }
];

const CATEGORIZED_VISUAL_PRESETS = {
  'Minimalist/Clean': ['Minimalist', 'Zen'],
  'Raw/Industrial': ['Industrial', 'Brutalist', 'Urban Decay'],
  'Futuristic/Tech': ['Neo-Futurist', 'Cybernetic', 'Superintelligence'],
  'Editorial/Classic': ['Vintage', 'Noir']
};

const DEFAULT_FONTS = [
  { name: 'Cormorant Garamond', type: 'Serif', label: 'Editorial' },
  { name: 'Space Grotesk', type: 'Sans', label: 'Modern' },
  { name: 'Space Mono', type: 'Mono', label: 'Technical' },
  { name: 'Playfair Display', type: 'Serif', label: 'Classical' },
  { name: 'Inter', type: 'Sans', label: 'Utility' },
  { name: 'DM Sans', type: 'Sans', label: 'Humanist' }
];

const primaryAnchorsMap = [
  { 
    key: 'culturalReferences', 
    label: 'Cultural References', 
    placeholder: 'e.g. Serial Experiments Lain, Rick Owens...',
    description: 'The artistic and theoretical lineage that informs this mask.'
  },
  { 
    key: 'ideologicalBias', 
    label: 'Ideological Bias', 
    placeholder: 'e.g. Semiotics, Brutalism, Liminality...',
    description: 'The philosophical lens through which reality is interpreted.'
  },
  { 
    key: 'culturalSynthesis', 
    label: 'Cultural Synthesis', 
    placeholder: 'e.g. Y2K Futurism, Cyber-Renaissance...',
    description: 'Optional. The intersection of distinct cultural movements this persona explores.'
  },
  { 
    key: 'trendClusters', 
    label: 'Trend Clusters', 
    placeholder: 'e.g. Quiet Luxury, Gorpcore, Post-irony...',
    description: 'Optional. Specific aesthetic or behavioral trends the persona monitors and analyzes.'
  },
  { 
    key: 'exclusionPrinciples', 
    label: 'Exclusion Principles', 
    placeholder: 'e.g. No reactive commentary, Avoid dilution...',
    description: 'Optional. Define what this persona refuses to do (e.g. "No clickbait", "No academic jargon").'
  }
];

const DEFAULT_DRAFT_FALLBACK: TailorLogicDraft = {
  positioningCore: {
    anchors: { culturalReferences: [], ideologicalBias: [], culturalSynthesis: [], trendClusters: [] },
    aestheticCore: { silhouettes: [], materiality: [], eraBias: 'Post-Digital', density: 5, entropy: 5, tags: [] },
    positioningAxis: 'Signal vs Noise',
    authorityClaim: 'Aesthetic infrastructure for long-term cultural positioning.',
    exclusionPrinciples: []
  },
  expressionEngine: {
    chromaticRegistry: { primaryPalette: [], baseNeutral: '#F2F1ED', accentSignal: '#1C1917' },
    typographyIntent: { styleDescription: 'Cormorant Garamond', weightPreference: 'Light' },
    narrativeVoice: { emotionalTemperature: 'CLINICAL', structureBias: 'CONCISE', lexicalDensity: 5, restraintLevel: 8, voiceNotes: '' },
    brandIdentity: { fonts: { serif: 'Cormorant Garamond', sans: 'Inter', mono: 'Space Mono' }, logo: '', palette: ['#000000', '#FFFFFF'] }
  },
  strategicVectors: {
    expansionTolerance: 5,
    fiscalVelocity: 'measured',
    desireVectors: { deepen: [], reduce: [], experiment: [], refuse: [] },
    saturationAwareness: { oversaturatedClusters: [], fragileDifferentiators: [] }
  },
  diagnostics: {
    contradictionFlags: [],
    dilutionRisks: [],
    authorityStrengthScore: 50,
    driftVulnerability: 5
  },
  strategicSummary: {
    identityVector: 'A baseline identity vector focused on signal over noise.',
    authorityAnchor: 'Aesthetic infrastructure.',
    exclusionRules: [],
    elasticityIndex: 5,
    tonalConstraints: 'Restrained and precise.',
    aestheticDNA: 'Post-Digital Minimalism.'
  },
  celestialCalibration: { enabled: false, zodiac: 'gemini', astrologicalLineage: '', seasonalAlignment: '' },
  generationTemperature: 0.8,
  draftStatus: 'provisional',
  lastTailored: Date.now()
};

// --- SUB-COMPONENTS ---

const CustomInput: React.FC<{ placeholder: string, onAdd: (val: string) => void }> = ({ placeholder, onAdd }) => {
  const [val, setVal] = useState('');
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && val.trim()) {
      onAdd(val.trim());
      setVal('');
    }
  };
  return (
    <div className="flex items-center gap-2 mt-3 opacity-60 hover:opacity-100 transition-opacity">
      <Plus size={12} className="text-stone-400" />
      <input 
        id={`custom-${placeholder.replace(/\s+/g, '-').toLowerCase()}`}
        name={`custom-${placeholder.replace(/\s+/g, '-').toLowerCase()}`}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="bg-transparent border-b border-stone-200 dark:border-stone-800 py-1 font-serif italic text-sm focus:outline-none focus:border-emerald-500 w-full placeholder:text-stone-500"
      />
    </div>
  );
};

const PresetStrip: React.FC<{ options: string[], current: string | string[], onSelect: (val: string) => void, onAddCustom?: (val: string) => void, customPlaceholder?: string }> = ({ options, current, onSelect, onAddCustom, customPlaceholder }) => (
  <div className="space-y-3">
    <div className="flex flex-wrap gap-1.5 pt-2">
      {options.map(opt => {
        const active = Array.isArray(current) 
          ? current.some(c => c.toUpperCase() === opt.toUpperCase())
          : (current || '').toLowerCase().includes(opt.toLowerCase());
        return (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={`px-3 py-1 rounded-full font-sans text-[7px] md:text-[8px] uppercase tracking-widest font-black border transition-all ${active ? 'bg-nous-text dark:bg-white text-white dark:text-stone-900 border-current shadow-sm' : 'border-stone-100 dark:border-stone-800 text-stone-400 hover:border-stone-300'}`}
          >
            {opt}
          </button>
        );
      })}
    </div>
    {onAddCustom && customPlaceholder && <CustomInput placeholder={customPlaceholder} onAdd={onAddCustom} />}
  </div>
);

const FieldGroup: React.FC<{ label: string; description?: string; children: React.ReactNode }> = ({ label, description, children }) => (
  <div className="space-y-4 pb-12 border-b border-black/5 dark:border-white/5 last:border-b-0 relative">
    <div className="tape-top"></div>
    <div className="space-y-1">
      <label className="font-sans text-[9px] uppercase tracking-[0.4em] font-black text-stone-400">{label}</label>
      {description && <p className="font-serif italic text-base text-stone-500 dark:text-stone-400 leading-tight">{description}</p>}
    </div>
    {children}
  </div>
);

// --- BLUEPRINT DASHBOARD CARDS ---

const BlueprintCard: React.FC<{ label: string; subLabel?: string; onClick: () => void; children: React.ReactNode; className?: string }> = ({ label, subLabel, onClick, children, className = "" }) => (
  <motion.div 
    whileHover={{ y: -4, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.1)" }}
    onClick={onClick}
    className={`bg-white dark:bg-[#0A0A0A] border border-stone-200 dark:border-stone-800 p-6 relative cursor-pointer group shadow-sm transition-all duration-500 overflow-hidden ${className}`}
  >
    {/* Tech Markers */}
    <div className="absolute top-2 left-2 w-1.5 h-1.5 border-t border-l border-stone-300 dark:border-stone-700" />
    <div className="absolute top-2 right-2 w-1.5 h-1.5 border-t border-r border-stone-300 dark:border-stone-700" />
    <div className="absolute bottom-2 left-2 w-1.5 h-1.5 border-b border-l border-stone-300 dark:border-stone-700" />
    <div className="absolute bottom-2 right-2 w-1.5 h-1.5 border-b border-r border-stone-300 dark:border-stone-700" />

    <div className="flex justify-between items-start mb-6 border-b border-dashed border-stone-100 dark:border-stone-800 pb-2">
      <div className="flex flex-col">
        <span className="font-sans text-[7px] uppercase tracking-[0.3em] font-black text-stone-400 group-hover:text-emerald-500 transition-colors">{label}</span>
        {subLabel && <span className="font-mono text-[7px] text-stone-300">{subLabel}</span>}
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <Edit3 size={10} className="text-stone-400" />
      </div>
    </div>
    <div className="relative z-10">
      {children}
    </div>
  </motion.div>
);

// --- MAIN COMPONENT ---

export const TailorView: React.FC<{ initialOverrides?: any }> = ({ initialOverrides }) => {
  const { profile, updateProfile, personas, activePersonaId, switchPersona, updatePersona, user, enabledAlgos, toggleAlgo, deletePersona } = useUser();
  const activePersona = personas.find(p => p.id === activePersonaId);
  const [draft, setDraft] = useState<TailorLogicDraft | null>(null);
  
  const [viewMode, setViewMode] = useState<'blueprint' | 'edit'>('blueprint');
  const [activeStep, setActiveStep] = useState<'positioning' | 'celestial' | 'aesthetic' | 'chromatic' | 'voice' | 'vectors' | 'shards' | 'brand' | 'settings'>('positioning');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditReport, setAuditReport] = useState<TailorAuditReport | null>(null);
  const [showAuditOverlay, setShowAuditOverlay] = useState(false);
  
  // --- AUTO-SAVE LOGIC ---
  const saveDraftToLocalStorage = useCallback((draftToSave: TailorLogicDraft) => {
      if (!activePersonaId) return;
      setIsSaving(true);
      localStorage.setItem(`mimi_tailor_draft_${activePersonaId}`, JSON.stringify(draftToSave));
      setTimeout(() => setIsSaving(false), 1000);
  }, [activePersonaId]);

  // Auto-save interval
  useEffect(() => {
      if (!draft) return;
      const interval = setInterval(() => {
          saveDraftToLocalStorage(draft);
      }, 30000);
      return () => clearInterval(interval);
  }, [draft, saveDraftToLocalStorage]);

  // Save on navigate away
  useEffect(() => {
      const handleBeforeUnload = () => {
          if (draft) saveDraftToLocalStorage(draft);
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [draft, saveDraftToLocalStorage]);
  
  // --- END AUTO-SAVE LOGIC ---

  // Font Engine State
  const [customFontInput, setCustomFontInput] = useState('');
  const [availableFonts, setAvailableFonts] = useState(DEFAULT_FONTS);
  const [isFontLoading, setIsFontLoading] = useState(false);

  // Color Engine State
  const [newColorHex, setNewColorHex] = useState('#000000');
  const [newColorName, setNewColorName] = useState('');

  // Persona Settings State
  const [personaName, setPersonaName] = useState('');
  const [personaKey, setPersonaKey] = useState('');
  const [aiSignature, setAiSignature] = useState('');
  const [isGeneratingSignature, setIsGeneratingSignature] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // --- LOGIC ---

  const generateAiSignature = async () => {
      if (!activePersona || !draft) return;
      setIsGeneratingSignature(true);
      try {
          const { ai } = getClient();
          const response = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: `Generate a short, unique, poetic AI signature (max 5 words) for a persona named "${activePersona.name}" with the following aesthetic core: ${draft.positioningCore.aestheticCore.eraBias}, ${draft.positioningCore.aestheticCore.silhouettes.join(', ')}. It should sound like a cryptographic hash but made of words.`,
              config: { temperature: 0.9 }
          });
          const sig = response.text?.trim() || 'SIG_UNKNOWN';
          setAiSignature(sig);
          setDraft(prev => prev ? { ...prev, aiSignature: sig } : null);
          window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Signature Generated.", icon: <Sparkles size={14} /> } }));
      } catch (e) {
          console.error(e);
          window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Signature Generation Failed.", type: 'error' } }));
      } finally {
          setIsGeneratingSignature(false);
      }
  };

  useEffect(() => {
      // Defensive Initialization: Ensure draft structure is complete
      const localDraft = activePersonaId ? localStorage.getItem(`mimi_tailor_draft_${activePersonaId}`) : null;
      let source;
      if (localDraft) {
          try {
              source = JSON.parse(localDraft);
          } catch (e) {
              source = activePersona?.tailorDraft || profile?.tailorDraft || DEFAULT_DRAFT_FALLBACK;
          }
      } else {
          source = activePersona?.tailorDraft || profile?.tailorDraft || DEFAULT_DRAFT_FALLBACK;
      }
      
      const mergedDraft = {
          ...DEFAULT_DRAFT_FALLBACK,
          ...source,
          positioningCore: { ...DEFAULT_DRAFT_FALLBACK.positioningCore, ...source.positioningCore },
          expressionEngine: { 
              ...DEFAULT_DRAFT_FALLBACK.expressionEngine, 
              ...source.expressionEngine,
              brandIdentity: {
                  ...DEFAULT_DRAFT_FALLBACK.expressionEngine.brandIdentity,
                  ...(source.expressionEngine?.brandIdentity || source.brandIdentity || {})
              }
          },
          strategicVectors: { ...DEFAULT_DRAFT_FALLBACK.strategicVectors, ...source.strategicVectors },
          diagnostics: { ...DEFAULT_DRAFT_FALLBACK.diagnostics, ...source.diagnostics },
          strategicSummary: { ...DEFAULT_DRAFT_FALLBACK.strategicSummary, ...source.strategicSummary },
          celestialCalibration: { ...DEFAULT_DRAFT_FALLBACK.celestialCalibration, ...source.celestialCalibration }
      };
      setDraft(mergedDraft);
      
      setPersonaName(activePersona?.name || '');
      setPersonaKey(activePersona?.apiKey || '');
      setAiSignature(mergedDraft.aiSignature || '');
  }, [activePersonaId, profile?.tailorDraft, activePersona]);

  useEffect(() => {
    if (draft?.expressionEngine?.typographyIntent?.styleDescription) {
        const currentFont = draft.expressionEngine.typographyIntent.styleDescription;
        const exists = availableFonts.some(f => f.name === currentFont);
        if (!exists) {
            setAvailableFonts(prev => [...prev, { name: currentFont, type: 'Custom', label: 'Imported' }]);
            injectGoogleFont(currentFont);
        }
    }
  }, [draft?.expressionEngine?.typographyIntent?.styleDescription]);

  const injectGoogleFont = (fontName: string) => {
      const linkId = `font-${fontName.replace(/\s+/g, '-')}`;
      if (!document.getElementById(linkId)) {
          const link = document.createElement('link');
          link.id = linkId;
          link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`;
          link.rel = 'stylesheet';
          document.head.appendChild(link);
          window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: `Fetching ${fontName}...`, icon: <Download size={14} /> } }));
          return true;
      }
      return false;
  };

  const handleAddFont = () => {
      if (!customFontInput.trim()) return;
      setIsFontLoading(true);
      const fontName = customFontInput.trim();
      injectGoogleFont(fontName);
      setTimeout(() => {
          setAvailableFonts(prev => [...prev, { name: fontName, type: 'Custom', label: 'Imported' }]);
          if (draft) {
              setDraft(prev => prev ? ({
                  ...prev,
                  expressionEngine: {
                      ...prev.expressionEngine,
                      typographyIntent: { ...prev.expressionEngine.typographyIntent, styleDescription: fontName }
                  }
              }) : null);
          }
          setCustomFontInput('');
          setIsFontLoading(false);
      }, 500);
  };

  useEffect(() => {
    if (initialOverrides && draft && draft.strategicVectors) {
        setDraft(prev => prev ? ({
            ...prev,
            strategicVectors: {
                ...prev.strategicVectors,
                desireVectors: {
                    ...prev.strategicVectors.desireVectors,
                    experiment: initialOverrides.suggestedExperiments || prev.strategicVectors.desireVectors.experiment,
                    deepen: initialOverrides.identifiedDrifts ? [initialOverrides.identifiedDrifts] : prev.strategicVectors.desireVectors.deepen
                }
            }
        }) : null);
    }
  }, [initialOverrides]);

  const updateDraft = (patch: any) => { if (draft) setDraft(prev => ({ ...prev!, ...patch, draftStatus: 'provisional' })); };
  
  const updatePositioning = (field: string, val: any) => {
      if (draft) setDraft(prev => prev ? ({ ...prev, draftStatus: 'provisional', positioningCore: { ...prev.positioningCore, [field]: val } }) : null);
  };
  
  const updateExpression = (field: string, val: any) => {
      if (draft) setDraft(prev => prev ? ({ ...prev, draftStatus: 'provisional', expressionEngine: { ...prev.expressionEngine, [field]: val } }) : null);
  };
  
  const updateStrategic = (field: string, val: any) => {
      if (draft) setDraft(prev => prev ? ({ ...prev, draftStatus: 'provisional', strategicVectors: { ...prev.strategicVectors, [field]: val } }) : null);
  };

  const updateAnchor = (field: string, val: string) => { 
      if (!draft) return;
      if (field === 'exclusionPrinciples') {
          const current = draft.positioningCore.exclusionPrinciples || [];
          if (!current.includes(val)) {
              updatePositioning('exclusionPrinciples', [...current, val]);
          }
          return;
      }
      const current = draft.positioningCore.anchors[field] || [];
      if (!current.includes(val)) {
          updatePositioning('anchors', { ...draft.positioningCore.anchors, [field]: [...current, val] });
      }
  };
  
  const removeAnchor = (field: string, val: string) => {
      if (!draft) return;
      if (field === 'exclusionPrinciples') {
          const current = draft.positioningCore.exclusionPrinciples || [];
          updatePositioning('exclusionPrinciples', current.filter((i: string) => i !== val));
          return;
      }
      const current = draft.positioningCore.anchors[field] || [];
      updatePositioning('anchors', { ...draft.positioningCore.anchors, [field]: current.filter((i: string) => i !== val) });
  };

  const updateCelestial = (field: string, val: any) => { if (draft) updateDraft({ celestialCalibration: { ...draft.celestialCalibration, [field]: val } }); };
  
  const updateDesireVector = (field: string, val: string) => { 
      if (!draft) return;
      const current = draft.strategicVectors.desireVectors[field] || [];
      if (!current.includes(val)) {
          updateStrategic('desireVectors', { ...draft.strategicVectors.desireVectors, [field]: [...current, val] });
      }
  };
  
  const removeDesireVector = (field: string, val: string) => {
      if (!draft) return;
      const current = draft.strategicVectors.desireVectors[field] || [];
      updateStrategic('desireVectors', { ...draft.strategicVectors.desireVectors, [field]: current.filter((i: string) => i !== val) });
  };

  const toggleOption = (field: string, val: string) => {
    if (!draft) return;
    const current = draft.positioningCore.aestheticCore[field] || [];
    if (current.includes(val)) { 
      updatePositioning('aestheticCore', { ...draft.positioningCore.aestheticCore, [field]: current.filter((p: string) => p !== val) }); 
    }
    else { 
      updatePositioning('aestheticCore', { ...draft.positioningCore.aestheticCore, [field]: [...current, val] }); 
    }
  };

  const addCustomOption = (field: string, val: string) => {
      if (!val.trim() || !draft) return;
      const current = draft.positioningCore.aestheticCore[field] || [];
      if (!current.includes(val)) {
          updatePositioning('aestheticCore', { ...draft.positioningCore.aestheticCore, [field]: [...current, val] });
      }
  };

  const toggleRegister = (val: string) => {
      if (!draft) return;
      const current = draft.expressionEngine.narrativeVoice.culturalRegister || [];
      if (current.includes(val)) {
          updateExpression('narrativeVoice', { ...draft.expressionEngine.narrativeVoice, culturalRegister: current.filter(c => c !== val) });
      } else {
          updateExpression('narrativeVoice', { ...draft.expressionEngine.narrativeVoice, culturalRegister: [...current, val] });
      }
  };

  const addColorToPalette = () => {
      if (!newColorName.trim() || !draft) return;
      const newColor: ColorShard = { name: newColorName, hex: newColorHex, descriptor: 'Custom' };
      const current = draft.expressionEngine.chromaticRegistry?.primaryPalette || [];
      updateExpression('chromaticRegistry', { ...draft.expressionEngine.chromaticRegistry, primaryPalette: [...current, newColor] });
      setNewColorName('');
  };

  const removeColor = (hex: string) => {
      if (!draft) return;
      const current = draft.expressionEngine.chromaticRegistry?.primaryPalette || [];
      updateExpression('chromaticRegistry', { ...draft.expressionEngine.chromaticRegistry, primaryPalette: current.filter(c => c.hex !== hex) });
  };

  const applyChromaticPreset = (preset: typeof CHROMATIC_PRESETS[0]) => {
      if (!draft) return;
      updateExpression('chromaticRegistry', {
          ...draft.expressionEngine.chromaticRegistry,
          baseNeutral: preset.base,
          accentSignal: preset.accent,
          primaryPalette: preset.palette.map(p => ({ ...p, descriptor: 'Preset' }))
      });
  };

  const applyVisualPreset = (preset: typeof VISUAL_PRESETS[0]) => {
    if (!draft) return;
    updateDraft({
      positioningCore: { ...draft.positioningCore, ...preset.config.positioningCore },
      expressionEngine: { ...draft.expressionEngine, ...preset.config.expressionEngine },
      strategicVectors: { ...draft.strategicVectors, ...preset.config.strategicVectors }
    });
    window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: `${preset.name} Preset Applied.`, icon: preset.icon } }));
  };



  const handleAlign = async () => {
    if (!profile || !activePersona || !draft) return;
    setIsSaving(true);
    try {
      const finalDraft = { ...draft, draftStatus: 'aligned', lastTailored: Date.now() };
      await updatePersona({ ...activePersona, tailorDraft: finalDraft });
      saveDraftToLocalStorage(finalDraft);
      setDraft(finalDraft);
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Logic Aligned to Mask.", icon: <Ruler size={14} /> } }));
      setViewMode('blueprint');
    } catch (e) { 
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Alignment Error.", type: 'error' } }));
    } finally { setIsSaving(false); }
  };

  const handleUpdatePersonaSettings = async () => {
      if (!activePersona || !personaName.trim() || !draft) return;
      setIsSaving(true);
      try {
          await updatePersona({ ...activePersona, name: personaName, apiKey: personaKey, tailorDraft: draft });
          saveDraftToLocalStorage(draft);
          window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Mask Protocols Updated.", icon: <CheckCircle size={14} /> } }));
      } catch(e) {
          window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Update Failed.", type: 'error' } }));
      } finally { setIsSaving(false); }
  };

  const handleScryDirectives = async () => {
    if (!draft) return;
    setIsAuditing(true);
    try {
      const res = await analyzeTailorDraft(draft);
      setAuditReport(res);
      setShowAuditOverlay(true); 
    } catch (e) { 
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Oracle obstructed.", type: 'error' } }));
    } finally { setIsAuditing(false); }
  };

  const handleShardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !draft) return;
    const newShards: string[] = [];
    setIsSaving(true);
    try {
        for (const file of Array.from(files)) {
            const reader = new FileReader();
            const base64 = await new Promise<string>((resolve, reject) => {
                reader.onload = async (ev) => {
                    try {
                        const raw = ev.target?.result as string;
                        const compressed = await compressImage(raw, 0.6, 1024);
                        resolve(compressed);
                    } catch (err) { reject(err); }
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            if (user?.uid) {
                try {
                    const blob = dataURLtoBlob(base64);
                    const path = `shards/${user.uid}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
                    const url = await uploadBlob(blob, path);
                    newShards.push(url);
                } catch (uploadErr) {
                    console.warn("MIMI // Storage Upload Failed, falling back to base64:", uploadErr);
                    newShards.push(base64);
                }
            } else {
                newShards.push(base64);
            }
        }
        updatePositioning('aestheticCore', { ...draft.positioningCore.aestheticCore, visualShards: [...(draft.positioningCore.aestheticCore.visualShards || []), ...newShards] });
    } catch (e) {
        console.error("Upload failed", e);
        window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Upload Failed.", type: 'error' } }));
    } finally {
        setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !draft) return;
    const file = files[0];
    setIsSaving(true);
    try {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
            reader.onload = async (ev) => {
                try {
                    const raw = ev.target?.result as string;
                    const compressed = await compressImage(raw, 0.6, 512);
                    resolve(compressed);
                } catch (err) { reject(err); }
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        let finalUrl = base64;
        if (user?.uid) {
            try {
                const blob = dataURLtoBlob(base64);
                const path = `logos/${user.uid}/${Date.now()}_logo.jpg`;
                finalUrl = await uploadBlob(blob, path);
            } catch (uploadErr) {
                console.warn("MIMI // Logo Storage Upload Failed, falling back to base64:", uploadErr);
            }
        }
        updateExpression('brandIdentity', { ...draft.expressionEngine.brandIdentity!, logo: finalUrl });
    } catch (err) {
        console.error("MIMI // Logo Upload Error:", err);
        window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Logo Upload Failed.", type: 'error' } }));
    } finally {
        setIsSaving(false);
    }
  };

  const openEditor = (step: typeof activeStep) => {
      setActiveStep(step);
      setViewMode('edit');
  };

  if (!draft) {
      return (
          <div className="flex items-center justify-center h-full bg-nous-base dark:bg-[#050505]">
              <Loader2 className="animate-spin text-stone-400" />
          </div>
      );
  }

  return (
    <div className="flex-1 w-full h-full overflow-y-auto no-scrollbar pb-[40vh] px-4 md:px-16 pt-12 md:pt-20 bg-nous-base dark:bg-[#050505] text-nous-text dark:text-white transition-all duration-1000 relative paper-texture">
      
      {/* Auto-save Indicator */}
      <div className="absolute top-4 right-4 z-50">
          <AnimatePresence>
              {isSaving && (
                  <motion.div 
                      initial={{ opacity: 0, y: -10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, y: -10 }}
                      className="px-3 py-1 bg-emerald-500 text-white rounded-full font-sans text-[8px] uppercase tracking-widest font-black shadow-lg"
                  >
                      Draft Saved
                  </motion.div>
              )}
          </AnimatePresence>
      </div>

      {/* BACKGROUND DOT GRID TEXTURE */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.05]" 
        style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }} 
      />

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        
        {/* HEADER */}
        <header className="space-y-10 border-b border-black/5 dark:border-white/5 pb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
             <div className="space-y-4">
                <div className="flex items-center gap-3 text-stone-400">
                   <Scissors size={14} className="text-nous-accent" />
                   <span className="font-sans text-[8px] uppercase tracking-[0.4em] font-medium italic">Aesthetic Logic Engine v2.0</span>
                </div>
                <h2 className="font-serif text-5xl md:text-7xl italic tracking-tighter text-nous-text dark:text-white leading-none">The Tailor.</h2>
                <p className="font-serif italic text-lg text-stone-500 max-w-xl">
                   Define the physics of your world. This logic informs every generation.
                </p>
             </div>
             
             {/* MASK SELECTOR */}
             <div className="flex flex-col items-end gap-2">
                 <div className="flex items-center gap-4 bg-white/50 dark:bg-stone-900/50 backdrop-blur-xl px-6 py-3 rounded-full border border-stone-200 dark:border-stone-800 shadow-sm group cursor-pointer hover:border-emerald-500 transition-all" onClick={() => window.dispatchEvent(new CustomEvent('mimi:change_view', { detail: 'profile' }))}>
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center animate-pulse"><User size={14} /></div>
                    <div className="flex flex-col">
                       <span className="font-sans text-[7px] uppercase tracking-widest text-stone-400 font-black">Active Mask</span>
                       <div className="flex items-center gap-2">
                           <span className="font-serif italic text-sm text-nous-text dark:text-white">{activePersona?.name}</span>
                           {draft?.aiSignature && (
                               <span className="font-mono text-[8px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-sm">
                                   {draft.aiSignature}
                               </span>
                           )}
                       </div>
                    </div>
                    <ChevronRight size={14} className="text-stone-300 group-hover:text-emerald-500 transition-colors ml-2" />
                 </div>
                 {viewMode === 'edit' && (
                     <button onClick={() => setViewMode('blueprint')} className="text-stone-400 hover:text-emerald-500 font-sans text-[8px] uppercase tracking-widest font-black flex items-center gap-2">
                         <LayoutGrid size={12} /> Return to Blueprint
                     </button>
                 )}
             </div>
          </div>
        </header>

        {/* --- VIEW MODE: BLUEPRINT DASHBOARD --- */}
        <AnimatePresence mode="wait">
            {viewMode === 'blueprint' && (
                <motion.div 
                    key="blueprint"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 md:grid-cols-12 gap-8"
                >
                    {/* LEFT COL: THE SPECS */}
                    <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* POSITIONING CARD */}
                        <BlueprintCard label="Persona Positioning" subLabel="REF: POS-01" onClick={() => openEditor('positioning')} className="md:col-span-2">
                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <span className="font-sans text-[7px] uppercase tracking-widest text-stone-400">Primary Reference</span>
                                    <p className="font-serif italic text-2xl md:text-3xl text-nous-text dark:text-white leading-tight">
                                        {draft.positioningCore.anchors.culturalReferences[0] || "Undefined Anchor"}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {draft.positioningCore.anchors.culturalReferences.map((ref, i) => (
                                        <span key={i} className="px-2 py-1 border border-stone-200 dark:border-stone-800 rounded-sm font-mono text-[8px] uppercase text-stone-500">{ref}</span>
                                    ))}
                                </div>
                                
                                {(draft.positioningCore.anchors.culturalSynthesis?.length > 0 || draft.positioningCore.anchors.trendClusters?.length > 0) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-stone-200 dark:border-stone-800">
                                        {draft.positioningCore.anchors.culturalSynthesis?.length > 0 && (
                                            <div className="space-y-2">
                                                <span className="font-sans text-[7px] uppercase tracking-widest text-stone-400">Cultural Synthesis</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {draft.positioningCore.anchors.culturalSynthesis.map((item, i) => (
                                                        <span key={i} className="font-sans text-[9px] text-stone-600 dark:text-stone-400">{item}{i < draft.positioningCore.anchors.culturalSynthesis!.length - 1 ? ', ' : ''}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {draft.positioningCore.anchors.trendClusters?.length > 0 && (
                                            <div className="space-y-2">
                                                <span className="font-sans text-[7px] uppercase tracking-widest text-stone-400">Trend Clusters</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {draft.positioningCore.anchors.trendClusters.map((item, i) => (
                                                        <span key={i} className="font-sans text-[9px] text-stone-600 dark:text-stone-400">{item}{i < draft.positioningCore.anchors.trendClusters!.length - 1 ? ', ' : ''}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </BlueprintCard>

                        {/* CHROMATIC CARD */}
                        <BlueprintCard label="Chromatic Logic" subLabel="REF: CR-05" onClick={() => openEditor('chromatic')}>
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <div className="w-12 h-12 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: draft.expressionEngine.chromaticRegistry.baseNeutral }} />
                                    <div className="w-12 h-12 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: draft.expressionEngine.chromaticRegistry.accentSignal }} />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {draft.expressionEngine.chromaticRegistry.primaryPalette.slice(0, 4).map((c, i) => (
                                        <div key={i} className="w-6 h-6 rounded-sm border border-black/5" style={{ backgroundColor: c.hex }} title={c.name} />
                                    ))}
                                </div>
                                <p className="font-mono text-[9px] text-stone-400 uppercase tracking-tight">
                                    Base: {draft.expressionEngine.chromaticRegistry.baseNeutral} // Signal: {draft.expressionEngine.chromaticRegistry.accentSignal}
                                </p>
                            </div>
                        </BlueprintCard>

                        {/* TYPOGRAPHY CARD */}
                        <BlueprintCard label="Typographic DNA" subLabel="REF: TY-88" onClick={() => openEditor('aesthetic')}>
                            <div className="space-y-2 py-2">
                                <span className="block font-sans text-[7px] uppercase tracking-widest text-stone-400">Primary Typeface</span>
                                <p className="text-3xl" style={{ fontFamily: draft.expressionEngine.typographyIntent.styleDescription || 'serif' }}>
                                    {draft.expressionEngine.typographyIntent.styleDescription || 'Default Serif'}
                                </p>
                                <p className="font-serif italic text-sm text-stone-500">The quick brown fox jumps over the lazy dog.</p>
                            </div>
                        </BlueprintCard>

                        {/* AESTHETIC CORE */}
                        <BlueprintCard label="Visual Physics" subLabel="REF: PHY-09" onClick={() => openEditor('aesthetic')} className="md:col-span-2">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <span className="font-sans text-[7px] uppercase tracking-widest text-stone-400">Silhouette</span>
                                    <p className="font-serif italic text-xl">{draft.positioningCore.aestheticCore.silhouettes.join(', ') || "Undefined"}</p>
                                </div>
                                <div className="space-y-2">
                                    <span className="font-sans text-[7px] uppercase tracking-widest text-stone-400">Era Focus</span>
                                    <p className="font-serif italic text-xl">{draft.positioningCore.aestheticCore.eraBias || "Undefined"}</p>
                                </div>
                                <div className="space-y-2">
                                    <span className="font-sans text-[7px] uppercase tracking-widest text-stone-400">Density</span>
                                    <p className="font-serif italic text-xl">{draft.positioningCore.aestheticCore.density}/10</p>
                                </div>
                                <div className="space-y-2">
                                    <span className="font-sans text-[7px] uppercase tracking-widest text-stone-400">Entropy</span>
                                    <p className="font-serif italic text-xl">{draft.positioningCore.aestheticCore.entropy}/10</p>
                                </div>
                            </div>
                        </BlueprintCard>

                        {/* BRAND KIT CARD */}
                        <BlueprintCard label="Brand Identity" subLabel="REF: BR-01" onClick={() => openEditor('brand')} className="md:col-span-2">
                            <div className="flex items-center gap-8">
                                <div className="w-24 h-24 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-sm flex items-center justify-center overflow-hidden">
                                    {draft.expressionEngine.brandIdentity?.logo ? (
                                        <img src={draft.expressionEngine.brandIdentity.logo} className="w-full h-full object-contain" />
                                    ) : (
                                        <span className="font-sans text-[8px] uppercase tracking-widest text-stone-300 font-black">No Logo</span>
                                    )}
                                </div>
                                <div className="space-y-4 flex-1">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <span className="font-sans text-[7px] uppercase tracking-widest text-stone-400 block mb-1">Serif</span>
                                            <span className="font-serif italic text-lg">{draft.expressionEngine.brandIdentity?.fonts.serif}</span>
                                        </div>
                                        <div>
                                            <span className="font-sans text-[7px] uppercase tracking-widest text-stone-400 block mb-1">Sans</span>
                                            <span className="font-sans text-lg">{draft.expressionEngine.brandIdentity?.fonts.sans}</span>
                                        </div>
                                        <div>
                                            <span className="font-sans text-[7px] uppercase tracking-widest text-stone-400 block mb-1">Mono</span>
                                            <span className="font-mono text-sm">{draft.expressionEngine.brandIdentity?.fonts.mono}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {draft.expressionEngine.brandIdentity?.palette.map((hex, i) => (
                                            <div key={i} className="w-6 h-6 rounded-full border border-black/10" style={{ backgroundColor: hex }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </BlueprintCard>

                        {/* VOICE CARD */}
                        <BlueprintCard label="Narrative Voice" subLabel="REF: VC-22" onClick={() => openEditor('voice')}>
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-3 py-1 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-full font-sans text-[7px] uppercase font-black">{draft.expressionEngine.narrativeVoice.emotionalTemperature}</span>
                                    <span className="px-3 py-1 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-full font-sans text-[7px] uppercase font-black">{draft.expressionEngine.narrativeVoice.structureBias}</span>
                                </div>
                                <div className="flex gap-4 font-serif italic text-stone-500 text-xs">
                                    <span>Lexical: {draft.expressionEngine.narrativeVoice.lexicalDensity}/10</span>
                                    <span>Restraint: {draft.expressionEngine.narrativeVoice.restraintLevel}/10</span>
                                </div>
                                {draft.expressionEngine.narrativeVoice.voiceNotes && (
                                    <p className="font-mono text-[8px] text-stone-400 uppercase tracking-widest border-t border-stone-100 dark:border-stone-800 pt-2 truncate">
                                        Notes: {draft.expressionEngine.narrativeVoice.voiceNotes}
                                    </p>
                                )}
                            </div>
                        </BlueprintCard>

                        {/* SETTINGS CARD */}
                        <BlueprintCard label="Mask Protocol" subLabel="SYS: ADMIN" onClick={() => openEditor('settings')}>
                            <div className="flex items-center gap-3 text-stone-400">
                                <Settings size={16} />
                                <span className="font-sans text-[9px] uppercase tracking-widest font-black">Configure Identity</span>
                            </div>
                        </BlueprintCard>
                    </div>

                    {/* RIGHT COL: THE AUDIT */}
                    <div className="md:col-span-4 flex flex-col gap-6">
                        {/* Visual Manifest Preview */}
                        <div className="bg-white dark:bg-[#0A0A0A] border border-stone-200 dark:border-stone-800 p-6 rounded-sm shadow-sm space-y-4">
                            <div className="flex items-center justify-between border-b border-dashed border-stone-100 dark:border-stone-800 pb-2">
                                <span className="font-sans text-[7px] uppercase tracking-[0.3em] font-black text-stone-400">Visual Manifest</span>
                                <span className="font-mono text-[7px] text-stone-300">REF: VIZ-01</span>
                            </div>
                            <TailorPreview draft={draft} activePersonaId={activePersonaId!} apiKey={activePersona?.apiKey} />
                            <p className="font-serif italic text-[10px] text-stone-400 leading-tight">
                                A synthetic representation of your current aesthetic DNA.
                            </p>
                        </div>

                        <div className="bg-stone-50 dark:bg-[#080808] border border-stone-200 dark:border-stone-800 p-8 h-full flex flex-col justify-between rounded-sm">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 text-emerald-500">
                                        <ShieldCheck size={24} />
                                        <span className="font-sans text-[9px] uppercase tracking-[0.4em] font-black">Alignment Protocol</span>
                                        {draft.draftStatus === 'provisional' && (
                                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full font-mono text-[8px] uppercase tracking-widest ml-auto">Unaligned</span>
                                        )}
                                    </div>
                                    <p className="font-serif italic text-sm text-stone-500 leading-relaxed">
                                        Changes are local until aligned. Committing writes this logic to your active mask.
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    <button onClick={handleAlign} disabled={isSaving} className="w-full py-4 bg-nous-text dark:bg-white text-white dark:text-black rounded-full font-sans text-[10px] uppercase tracking-[0.4em] font-black shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
                                        {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                        Align Logic
                                    </button>
                                    <button onClick={handleScryDirectives} disabled={isAuditing} className="w-full py-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-full font-sans text-[10px] uppercase tracking-[0.4em] font-black text-stone-500 hover:text-emerald-500 hover:border-emerald-500 transition-all flex items-center justify-center gap-3 shadow-sm">
                                        {isAuditing ? <Loader2 size={12} className="animate-spin" /> : <Radar size={12} />}
                                        Scry Directives
                                    </button>
                                </div>
                            </div>
                            <div className="pt-8 border-t border-black/5 dark:border-white/5 opacity-40">
                                <p className="font-mono text-[8px] uppercase tracking-widest text-center">Last Aligned: {new Date(draft.lastTailored).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* --- VIEW MODE: EDITING FORMS --- */}
            {viewMode === 'edit' && (
                <motion.div 
                    key="editor"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-sm shadow-xl flex flex-col md:flex-row overflow-hidden min-h-[70vh]"
                >
                    {/* SIDEBAR NAV */}
                    <nav className="w-full md:w-64 bg-stone-50 dark:bg-black/20 border-b md:border-b-0 md:border-r border-stone-200 dark:border-stone-800 p-6 flex flex-row md:flex-col gap-2 overflow-x-auto no-scrollbar md:overflow-visible shrink-0">
                        {['positioning', 'celestial', 'aesthetic', 'chromatic', 'voice', 'vectors', 'shards', 'brand', 'settings'].map(step => (
                            <button
                                key={step}
                                onClick={() => setActiveStep(step as any)}
                                className={`text-left px-4 py-3 rounded-sm font-sans text-[9px] uppercase tracking-widest font-black transition-all flex items-center justify-between whitespace-nowrap ${activeStep === step ? 'bg-white dark:bg-stone-800 text-nous-text dark:text-white shadow-sm border border-black/5 dark:border-white/5' : 'text-stone-400 hover:text-stone-600'}`}
                            >
                                {step} {activeStep === step && <ChevronRight size={12} />}
                            </button>
                        ))}
                    </nav>

                    {/* FORM CONTENT */}
                    <div className="flex-1 p-8 md:p-16 overflow-y-auto no-scrollbar bg-[#FDFBF7] dark:bg-[#080808]">
                        <AnimatePresence mode="wait">
                            <motion.div 
                                key={activeStep}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-12 max-w-2xl mx-auto"
                            >
                                {/* HEADER */}
                                <div className="space-y-2 border-b border-black/5 dark:border-white/5 pb-8">
                                    <h3 className="font-serif text-4xl italic tracking-tighter text-nous-text dark:text-white capitalize">{activeStep.replace(/([A-Z])/g, ' $1').trim()}.</h3>
                                    <p className="font-sans text-[9px] uppercase tracking-widest text-stone-400 font-black">Define the parameters of your world.</p>
                                </div>

                                {/* DYNAMIC FORM FIELDS */}
                                {activeStep === 'positioning' && (
                                    <>
                                        <p className="font-serif italic text-stone-500 mb-8">Ground your mask's logic in the physical world.</p>
                                        
                                        <FieldGroup label="Brand Templates" description="Apply a foundational aesthetic archetype.">
                                          {Object.entries(CATEGORIZED_VISUAL_PRESETS).map(([category, presetNames]) => (
                                            <div key={category} className="mb-6">
                                              <h4 className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-500 mb-3">{category}</h4>
                                              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                                {presetNames.map(name => {
                                                  const p = VISUAL_PRESETS.find(pr => pr.name === name);
                                                  if (!p) return null;
                                                  const isActive = draft.positioningCore.aestheticCore.silhouettes.join(',') === p.config.positioningCore.aestheticCore.silhouettes.join(',') && 
                                                                   draft.positioningCore.aestheticCore.eraBias === p.config.positioningCore.aestheticCore.eraBias;
                                                  return (
                                                    <button 
                                                      key={p.name} 
                                                      onClick={() => applyVisualPreset(p)} 
                                                      className={`p-4 border rounded-sm transition-all group flex flex-col items-center gap-3 bg-white dark:bg-stone-900 shadow-sm ${isActive ? 'border-emerald-500 ring-1 ring-emerald-500/20' : 'border-stone-200 dark:border-stone-800 hover:border-emerald-500'}`}
                                                    >
                                                      <div className={`${isActive ? 'text-emerald-500' : 'text-stone-400 group-hover:text-emerald-500'} transition-colors`}>{p.icon}</div>
                                                      <span className={`font-sans text-[8px] uppercase tracking-widest font-black ${isActive ? 'text-emerald-500' : 'text-stone-400 group-hover:text-emerald-500'}`}>{p.name}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          ))}
                                        </FieldGroup>

                                        {primaryAnchorsMap.map(field => {
                                            const items = field.key === 'exclusionPrinciples' 
                                                ? (draft.positioningCore.exclusionPrinciples || []) 
                                                : (draft.positioningCore.anchors[field.key as keyof typeof draft.positioningCore.anchors] || []);
                                            
                                            return (
                                                <FieldGroup key={field.key} label={field.label} description={field.description}>
                                                    <div className="flex flex-wrap gap-2 mb-2">
                                                        {items.map((item: string, i: number) => (
                                                            <span key={i} className="px-3 py-1 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-full font-sans text-[9px] uppercase tracking-widest font-black flex items-center gap-2">
                                                                {item}
                                                                <button onClick={() => removeAnchor(field.key, item)} className="hover:text-red-500"><X size={10} /></button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <CustomInput placeholder={field.placeholder} onAdd={(val) => updateAnchor(field.key, val)} />
                                                </FieldGroup>
                                            );
                                        })}
                                    </>
                                )}

                                {activeStep === 'celestial' && (
                                    <>
                                        <p className="font-serif italic text-stone-500 mb-8">Align your output to cosmic vectors.</p>
                                        <FieldGroup label="Zodiac Sign">
                                            <PresetStrip 
                                                options={ZODIAC_SIGNS} 
                                                current={draft.celestialCalibration.zodiac || ''} 
                                                onSelect={(v) => updateCelestial('zodiac', v)} 
                                            />
                                        </FieldGroup>
                                        <FieldGroup label="Birth Data (Optional)" description="For deep chart calculation. Data is not stored externally.">
                                            <div className="grid grid-cols-2 gap-4">
                                                <input type="date" value={draft.celestialCalibration.birthDate || ''} onChange={e => updateCelestial('birthDate', e.target.value)} className="bg-transparent border-b border-stone-200 dark:border-stone-800 py-2 font-mono text-sm" />
                                                <input type="time" value={draft.celestialCalibration.birthTime || ''} onChange={e => updateCelestial('birthTime', e.target.value)} className="bg-transparent border-b border-stone-200 dark:border-stone-800 py-2 font-mono text-sm" />
                                            </div>
                                            <input placeholder="Birth City" value={draft.celestialCalibration.birthLocation || ''} onChange={e => updateCelestial('birthLocation', e.target.value)} className="w-full bg-transparent border-b border-stone-200 dark:border-stone-800 py-2 mt-4 font-serif italic text-lg" />
                                        </FieldGroup>
                                        <FieldGroup label="Astrological Lineage" description="Describe your chart's dominant placements (e.g. Scorpio Moon, Leo Rising).">
                                            <textarea value={draft.celestialCalibration.astrologicalLineage || ''} onChange={e => updateCelestial('astrologicalLineage', e.target.value)} className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 font-serif italic text-lg h-32 resize-none focus:outline-none focus:border-emerald-500" placeholder="Sun in... Moon in... Rising in..." />
                                        </FieldGroup>
                                    </>
                                )}

                                {activeStep === 'aesthetic' && (
                                    <>
                                        <p className="font-serif italic text-stone-500 mb-8">Define the physics of your visual world.</p>
                                        
                                        <FieldGroup label="Typographic DNA" description="Import from Google Fonts. Type specific font name to fetch and preview.">
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                {availableFonts.map(f => (
                                                    <button key={f.name} onClick={() => updateExpression('typographyIntent', { ...draft.expressionEngine.typographyIntent, styleDescription: f.name })} className={`text-left p-4 border rounded-sm transition-all ${draft.expressionEngine.typographyIntent.styleDescription === f.name ? 'border-emerald-500 bg-emerald-50/10' : 'border-stone-200 dark:border-stone-800'}`}>
                                                        <span className="font-sans text-[7px] uppercase tracking-widest text-stone-400 block mb-1">{f.type}</span>
                                                        <span className="text-xl" style={{ fontFamily: f.name }}>{f.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <input value={customFontInput} onChange={e => setCustomFontInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddFont()} placeholder="e.g. 'Cinzel' or 'Oswald'" className="flex-1 bg-transparent border-b border-stone-200 dark:border-stone-800 py-2 font-serif italic text-lg" />
                                                <button onClick={handleAddFont} disabled={isFontLoading} className="font-sans text-[9px] uppercase tracking-widest font-black flex items-center gap-2 hover:text-emerald-500">{isFontLoading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} Fetch Font</button>
                                            </div>
                                            {draft.expressionEngine.typographyIntent.styleDescription && <p className="mt-4 text-sm text-stone-400 font-serif italic">Mimi will inject the Google Font stylesheet immediately.</p>}
                                        </FieldGroup>

                                        <FieldGroup label="Silhouettes">
                                            <PresetStrip options={SILHOUETTE_OPTIONS} current={draft.positioningCore.aestheticCore.silhouettes} onSelect={(v) => toggleOption('silhouettes', v)} onAddCustom={(v) => addCustomOption('silhouettes', v)} customPlaceholder="Add custom silhouette..." />
                                        </FieldGroup>
                                        <FieldGroup label="Materiality">
                                            <PresetStrip options={TEXTURE_OPTIONS} current={draft.positioningCore.aestheticCore.materiality} onSelect={(v) => toggleOption('materiality', v)} onAddCustom={(v) => addCustomOption('materiality', v)} customPlaceholder="Add custom material..." />
                                        </FieldGroup>
                                        <FieldGroup label="Era Bias">
                                            <PresetStrip options={ERA_OPTIONS} current={draft.positioningCore.aestheticCore.eraBias} onSelect={(v) => updatePositioning('aestheticCore', { ...draft.positioningCore.aestheticCore, eraBias: v })} onAddCustom={(v) => updatePositioning('aestheticCore', { ...draft.positioningCore.aestheticCore, eraBias: v })} customPlaceholder="Add specific era..." />
                                        </FieldGroup>
                                        <FieldGroup label="Tags" description="Comma-separated keywords for generation.">
                                            <input 
                                                value={(draft.positioningCore.aestheticCore.tags || []).join(', ')} 
                                                onChange={e => updatePositioning('aestheticCore', { ...draft.positioningCore.aestheticCore, tags: e.target.value.split(',').map(t => t.trim()) })} 
                                                className="w-full bg-transparent border-b border-stone-200 dark:border-stone-800 py-2 font-serif italic text-lg focus:outline-none focus:border-emerald-500" 
                                                placeholder="e.g. ethereal, glitch, chrome..." 
                                            />
                                        </FieldGroup>
                                        <FieldGroup label="Density (1-10)" description="The amount of information, layers, and semiotic weight packed into a single artifact.">
                                            <div className="flex items-center gap-4 mb-4">
                                                <span className="font-mono text-xs">MINIMAL</span>
                                                <input type="range" min="1" max="10" value={draft.positioningCore.aestheticCore.density} onChange={e => updatePositioning('aestheticCore', { ...draft.positioningCore.aestheticCore, density: parseInt(e.target.value) })} className="flex-1 h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                                                <span className="font-mono text-xs">MAXIMAL</span>
                                            </div>
                                            <span className="font-mono text-xs text-emerald-500">{draft.positioningCore.aestheticCore.density} / 10</span>
                                        </FieldGroup>

                                        <FieldGroup label="Entropy (1-10)" description="The degree of randomness, unpredictability, and unconventional logic applied to the translation.">
                                            <div className="flex items-center gap-4 mb-4">
                                                <span className="font-mono text-xs">STABLE</span>
                                                <input type="range" min="1" max="10" value={draft.positioningCore.aestheticCore.entropy} onChange={e => updatePositioning('aestheticCore', { ...draft.positioningCore.aestheticCore, entropy: parseInt(e.target.value) })} className="flex-1 h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                                                <span className="font-mono text-xs">CHAOTIC</span>
                                            </div>
                                            <span className="font-mono text-xs text-emerald-500">{draft.positioningCore.aestheticCore.entropy} / 10</span>
                                        </FieldGroup>

                                        <FieldGroup label="Generation Temperature" description="Control the 'wildness' of AI generation. Lower values are more stable and grounded.">
                                            <div className="flex items-center gap-4 mb-4">
                                                <span className="font-mono text-xs">STABLE</span>
                                                <input 
                                                    type="range" 
                                                    min="0" 
                                                    max="100" 
                                                    value={(draft.generationTemperature ?? 0.8) * 100} 
                                                    onChange={e => updateDraft({ generationTemperature: parseInt(e.target.value) / 100 })} 
                                                    className="flex-1 h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-500" 
                                                />
                                                <span className="font-mono text-xs">WILD</span>
                                            </div>
                                            <p className="font-mono text-[8px] text-stone-400 uppercase tracking-widest mt-2">Current Resonance: {((draft.generationTemperature ?? 0.8) * 100).toFixed(0)}%</p>
                                        </FieldGroup>
                                    </>
                                )}

                                {activeStep === 'chromatic' && (
                                    <>
                                        <p className="font-serif italic text-stone-500 mb-8">The color logic of your universe.</p>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                                            {CHROMATIC_PRESETS.map(p => (
                                                <button key={p.name} onClick={() => applyChromaticPreset(p)} className="p-4 border border-stone-200 dark:border-stone-800 rounded-sm hover:border-emerald-500 transition-all group flex flex-col items-center gap-3">
                                                    <div className="flex gap-1">
                                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.base }} />
                                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.accent }} />
                                                    </div>
                                                    <span className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-400 group-hover:text-emerald-500">{p.name}</span>
                                                </button>
                                            ))}
                                        </div>

                                        <FieldGroup label="Base Neutral (Primary)" description="Your silence. Enter Hex or use picker.">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                  <input type="color" value={draft.expressionEngine.chromaticRegistry.baseNeutral} onChange={e => updateExpression('chromaticRegistry', { ...draft.expressionEngine.chromaticRegistry, baseNeutral: e.target.value })} className="w-12 h-12 p-0 border-0 rounded-full cursor-pointer absolute inset-0 opacity-0" />
                                                  <div className="w-12 h-12 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: draft.expressionEngine.chromaticRegistry.baseNeutral }} />
                                                </div>
                                                <input value={draft.expressionEngine.chromaticRegistry.baseNeutral} onChange={e => updateExpression('chromaticRegistry', { ...draft.expressionEngine.chromaticRegistry, baseNeutral: e.target.value })} className="bg-transparent border-b border-stone-200 py-2 font-mono text-lg focus:outline-none focus:border-emerald-500" />
                                            </div>
                                        </FieldGroup>
                                        <FieldGroup label="Accent Signal" description="Your alert. Enter Hex or use picker.">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                  <input type="color" value={draft.expressionEngine.chromaticRegistry.accentSignal} onChange={e => updateExpression('chromaticRegistry', { ...draft.expressionEngine.chromaticRegistry, accentSignal: e.target.value })} className="w-12 h-12 p-0 border-0 rounded-full cursor-pointer absolute inset-0 opacity-0" />
                                                  <div className="w-12 h-12 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: draft.expressionEngine.chromaticRegistry.accentSignal }} />
                                                </div>
                                                <input value={draft.expressionEngine.chromaticRegistry.accentSignal} onChange={e => updateExpression('chromaticRegistry', { ...draft.expressionEngine.chromaticRegistry, accentSignal: e.target.value })} className="bg-transparent border-b border-stone-200 py-2 font-mono text-lg focus:outline-none focus:border-emerald-500" />
                                            </div>
                                        </FieldGroup>
                                        
                                        <FieldGroup label="Extended Palette" description="Define the core signals.">
                                            <div className="flex flex-wrap gap-4 mb-4">
                                                {draft.expressionEngine.chromaticRegistry.primaryPalette.map((c, i) => (
                                                    <div key={i} className="group relative">
                                                        <div className="w-16 h-16 rounded-sm shadow-sm cursor-pointer border border-black/5" style={{ backgroundColor: c.hex }} title={c.name} />
                                                        <button onClick={() => removeColor(c.hex)} className="absolute -top-2 -right-2 bg-white text-red-500 rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"><X size={10}/></button>
                                                        <span className="block text-[8px] font-mono text-center mt-1 uppercase truncate w-16">{c.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex items-end gap-4 p-4 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-sm">
                                                <div>
                                                    <label className="text-[8px] font-sans font-black uppercase text-stone-400 block mb-1">Color Picker</label>
                                                    <input type="color" value={newColorHex} onChange={e => setNewColorHex(e.target.value)} className="w-12 h-12 p-0 border-0 rounded cursor-pointer" />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="text-[8px] font-sans font-black uppercase text-stone-400 block mb-1">Name</label>
                                                    <input value={newColorName} onChange={e => setNewColorName(e.target.value)} placeholder="e.g. Electric Moss" className="w-full bg-transparent border-b border-stone-300 dark:border-stone-700 py-2 font-serif italic" />
                                                </div>
                                                <button onClick={addColorToPalette} disabled={!newColorName} className="px-4 py-2 bg-stone-800 text-white rounded-sm font-sans text-[9px] font-black uppercase disabled:opacity-50">Add</button>
                                            </div>
                                        </FieldGroup>
                                    </>
                                )}

                                {activeStep === 'voice' && (
                                    <>
                                        <p className="font-serif italic text-stone-500 mb-8">How does this mask speak?</p>
                                        <FieldGroup label="Emotional Temperature">
                                            <PresetStrip options={EMOTIONAL_TEMPERATURES} current={draft.expressionEngine.narrativeVoice.emotionalTemperature} onSelect={(v) => updateExpression('narrativeVoice', { ...draft.expressionEngine.narrativeVoice, emotionalTemperature: v })} />
                                            <textarea 
                                                value={draft.expressionEngine.narrativeVoice.emotionalTemperature} 
                                                onChange={e => updateExpression('narrativeVoice', { ...draft.expressionEngine.narrativeVoice, emotionalTemperature: e.target.value })} 
                                                className="w-full bg-transparent border-b border-stone-200 dark:border-stone-800 py-2 font-serif italic text-sm h-16 resize-none focus:outline-none focus:border-emerald-500 mt-4" 
                                                placeholder="Write-in emotional temperature..." 
                                            />
                                        </FieldGroup>
                                        <FieldGroup label="Structure Bias">
                                            <PresetStrip options={SENTENCE_STRUCTURES} current={draft.expressionEngine.narrativeVoice.structureBias} onSelect={(v) => updateExpression('narrativeVoice', { ...draft.expressionEngine.narrativeVoice, structureBias: v })} />
                                            <textarea 
                                                value={draft.expressionEngine.narrativeVoice.structureBias} 
                                                onChange={e => updateExpression('narrativeVoice', { ...draft.expressionEngine.narrativeVoice, structureBias: e.target.value })} 
                                                className="w-full bg-transparent border-b border-stone-200 dark:border-stone-800 py-2 font-serif italic text-sm h-16 resize-none focus:outline-none focus:border-emerald-500 mt-4" 
                                                placeholder="Write-in structure bias..." 
                                            />
                                        </FieldGroup>
                                        
                                        <FieldGroup label="Lexical Density (1-10)" description="Complexity and richness of vocabulary.">
                                            <div className="flex items-center gap-4 mb-4">
                                                <span className="font-mono text-xs">PLAIN</span>
                                                <input type="range" min="1" max="10" value={draft.expressionEngine.narrativeVoice.lexicalDensity} onChange={e => updateExpression('narrativeVoice', { ...draft.expressionEngine.narrativeVoice, lexicalDensity: parseInt(e.target.value) })} className="flex-1 h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                                                <span className="font-mono text-xs">ACADEMIC</span>
                                            </div>
                                            <span className="font-mono text-xs text-emerald-500">{draft.expressionEngine.narrativeVoice.lexicalDensity} / 10</span>
                                        </FieldGroup>

                                        <FieldGroup label="Restraint Level (1-10)" description="How much is held back versus explicitly stated.">
                                            <div className="flex items-center gap-4 mb-4">
                                                <span className="font-mono text-xs">OPEN</span>
                                                <input type="range" min="1" max="10" value={draft.expressionEngine.narrativeVoice.restraintLevel} onChange={e => updateExpression('narrativeVoice', { ...draft.expressionEngine.narrativeVoice, restraintLevel: parseInt(e.target.value) })} className="flex-1 h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                                                <span className="font-mono text-xs">CRYPTIC</span>
                                            </div>
                                            <span className="font-mono text-xs text-emerald-500">{draft.expressionEngine.narrativeVoice.restraintLevel} / 10</span>
                                        </FieldGroup>

                                        <FieldGroup label="Voice Notes" description="General directives for the narrative voice.">
                                            <textarea 
                                                value={draft.expressionEngine.narrativeVoice.voiceNotes || ''} 
                                                onChange={e => updateExpression('narrativeVoice', { ...draft.expressionEngine.narrativeVoice, voiceNotes: e.target.value })} 
                                                className="w-full bg-transparent border-b border-stone-200 dark:border-stone-800 py-2 font-serif italic text-sm h-24 resize-none focus:outline-none focus:border-emerald-500" 
                                                placeholder="e.g. Use high-theory, be slightly haughty but supportive..." 
                                            />
                                        </FieldGroup>

                                        <FieldGroup label="Celestial Calibration" description="Align voice to cosmic vectors.">
                                            <div className="flex items-center gap-3 mb-4">
                                                <button 
                                                    onClick={() => updateCelestial('enabled', !draft.celestialCalibration.enabled)}
                                                    className={`w-10 h-5 rounded-full transition-colors relative ${draft.celestialCalibration.enabled ? 'bg-emerald-500' : 'bg-stone-200 dark:bg-stone-800'}`}
                                                >
                                                    <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${draft.celestialCalibration.enabled ? 'left-6' : 'left-1'}`} />
                                                </button>
                                                <span className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-400">
                                                    {draft.celestialCalibration.enabled ? 'Enabled' : 'Disabled'}
                                                </span>
                                            </div>

                                            {draft.celestialCalibration.enabled && (
                                                <div className="space-y-6 mt-6 pl-4 border-l border-emerald-500/20">
                                                    <div className="space-y-2">
                                                        <label className="font-sans text-[7px] uppercase tracking-widest text-stone-400 font-black">Zodiac Sign</label>
                                                        <PresetStrip 
                                                            options={ZODIAC_SIGNS} 
                                                            current={draft.celestialCalibration.zodiac || ''} 
                                                            onSelect={(v) => updateCelestial('zodiac', v)} 
                                                        />
                                                    </div>
                                                    
                                                    <div className="space-y-2">
                                                        <label className="font-sans text-[7px] uppercase tracking-widest text-stone-400 font-black">Astrological Lineage</label>
                                                        <textarea 
                                                            value={draft.celestialCalibration.astrologicalLineage || ''} 
                                                            onChange={e => updateCelestial('astrologicalLineage', e.target.value)} 
                                                            className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 font-serif italic text-sm h-24 resize-none focus:outline-none focus:border-emerald-500" 
                                                            placeholder="Sun in... Moon in... Rising in..." 
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="font-sans text-[7px] uppercase tracking-widest text-stone-400 font-black">Seasonal Alignment</label>
                                                        <input 
                                                            value={draft.celestialCalibration.seasonalAlignment || ''} 
                                                            onChange={e => updateCelestial('seasonalAlignment', e.target.value)} 
                                                            className="w-full bg-transparent border-b border-stone-200 dark:border-stone-800 py-2 font-serif italic text-sm focus:outline-none focus:border-emerald-500" 
                                                            placeholder="e.g. Late Autumn, Solstice..." 
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </FieldGroup>

                                        <FieldGroup label="Celestial Calibration" description="Align voice to cosmic vectors.">
                                            <div className="flex items-center gap-3 mb-4">
                                                <button 
                                                    onClick={() => updateCelestial('enabled', !draft.celestialCalibration.enabled)}
                                                    className={`w-10 h-5 rounded-full transition-colors relative ${draft.celestialCalibration.enabled ? 'bg-emerald-500' : 'bg-stone-200 dark:bg-stone-800'}`}
                                                >
                                                    <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${draft.celestialCalibration.enabled ? 'left-6' : 'left-1'}`} />
                                                </button>
                                                <span className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-400">
                                                    {draft.celestialCalibration.enabled ? 'Enabled' : 'Disabled'}
                                                </span>
                                            </div>

                                            {draft.celestialCalibration.enabled && (
                                                <div className="space-y-6 mt-6 pl-4 border-l border-emerald-500/20">
                                                    <div className="space-y-2">
                                                        <label className="font-sans text-[7px] uppercase tracking-widest text-stone-400 font-black">Zodiac Sign</label>
                                                        <PresetStrip 
                                                            options={ZODIAC_SIGNS} 
                                                            current={draft.celestialCalibration.zodiac || ''} 
                                                            onSelect={(v) => updateCelestial('zodiac', v)} 
                                                        />
                                                    </div>
                                                    
                                                    <div className="space-y-2">
                                                        <label className="font-sans text-[7px] uppercase tracking-widest text-stone-400 font-black">Astrological Lineage</label>
                                                        <textarea 
                                                            value={draft.celestialCalibration.astrologicalLineage || ''} 
                                                            onChange={e => updateCelestial('astrologicalLineage', e.target.value)} 
                                                            className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 font-serif italic text-sm h-24 resize-none focus:outline-none focus:border-emerald-500" 
                                                            placeholder="Sun in... Moon in... Rising in..." 
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="font-sans text-[7px] uppercase tracking-widest text-stone-400 font-black">Seasonal Alignment</label>
                                                        <input 
                                                            value={draft.celestialCalibration.seasonalAlignment || ''} 
                                                            onChange={e => updateCelestial('seasonalAlignment', e.target.value)} 
                                                            className="w-full bg-transparent border-b border-stone-200 dark:border-stone-800 py-2 font-serif italic text-sm focus:outline-none focus:border-emerald-500" 
                                                            placeholder="e.g. Late Autumn, Solstice..." 
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </FieldGroup>
                                    </>
                                )}

                                {activeStep === 'vectors' && (
                                    <>
                                        <p className="font-serif italic text-stone-500 mb-8">Where is this taste moving towards?</p>
                                        <FieldGroup label="More Of">
                                            <textarea value={draft.strategicVectors.desireVectors.moreOf} onChange={e => updateStrategic('desireVectors', { ...draft.strategicVectors.desireVectors, moreOf: e.target.value })} className="w-full bg-transparent border-b border-stone-200 dark:border-stone-800 py-2 font-serif italic text-xl h-24 resize-none focus:outline-none focus:border-emerald-500" placeholder="e.g. Silence, negative space..." />
                                        </FieldGroup>
                                        <FieldGroup label="Less Of">
                                            <textarea value={draft.strategicVectors.desireVectors.lessOf} onChange={e => updateStrategic('desireVectors', { ...draft.strategicVectors.desireVectors, lessOf: e.target.value })} className="w-full bg-transparent border-b border-stone-200 dark:border-stone-800 py-2 font-serif italic text-xl h-24 resize-none focus:outline-none focus:border-red-500" placeholder="e.g. Noise, clutter..." />
                                        </FieldGroup>
                                        <FieldGroup label="Experimenting With">
                                            <textarea value={draft.strategicVectors.desireVectors.experimentingWith} onChange={e => updateStrategic('desireVectors', { ...draft.strategicVectors.desireVectors, experimentingWith: e.target.value })} className="w-full bg-transparent border-b border-stone-200 dark:border-stone-800 py-2 font-serif italic text-xl h-24 resize-none focus:outline-none focus:border-indigo-500" placeholder="e.g. 3D renders, video essays..." />
                                        </FieldGroup>
                                        <FieldGroup label="Fiscal Velocity">
                                            <PresetStrip 
                                                options={['conservative', 'measured', 'accelerated']} 
                                                current={draft.strategicVectors.fiscalVelocity} 
                                                onSelect={(v) => updateStrategic('fiscalVelocity', v)} 
                                            />
                                        </FieldGroup>
                                    </>
                                )}

                                {activeStep === 'shards' && (
                                    <>
                                        <p className="font-serif italic text-stone-500 mb-8">Upload reference images to train the Oracle.</p>
                                        <div 
                                            className="border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-sm p-12 text-center hover:border-emerald-500 transition-colors cursor-pointer group"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <div className="w-16 h-16 bg-stone-50 dark:bg-stone-900 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-400 group-hover:text-emerald-500 transition-colors">
                                                <Upload size={24} />
                                            </div>
                                            <span className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-400 group-hover:text-emerald-500">Upload Visual Shards</span>
                                        </div>
                                        <input type="file" ref={fileInputRef} onChange={handleShardUpload} className="hidden" multiple accept="image/*" />
                                        
                                        {draft.positioningCore.aestheticCore.visualShards && draft.positioningCore.aestheticCore.visualShards.length > 0 && (
                                            <div className="grid grid-cols-3 gap-4 mt-8">
                                                {draft.positioningCore.aestheticCore.visualShards.map((s, i) => (
                                                    <div key={i} className="aspect-square bg-stone-100 relative group overflow-hidden rounded-sm">
                                                        <img src={s} className="w-full h-full object-cover" />
                                                        <button onClick={() => updatePositioning('aestheticCore', { ...draft.positioningCore.aestheticCore, visualShards: draft.positioningCore.aestheticCore.visualShards.filter((_, idx) => idx !== i) })} className="absolute top-1 right-1 bg-white text-red-500 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <ShardAnalyzer shards={draft.positioningCore.aestheticCore.visualShards} draft={draft} />
                                    </>
                                )}

                                {activeStep === 'brand' && (
                                    <>
                                        <p className="font-serif italic text-stone-500 mb-8">Define your visual assets and typographic hierarchy.</p>
                                        
                                        <FieldGroup label="Logo Mark">
                                            <div 
                                                className="border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-sm p-8 text-center hover:border-emerald-500 transition-colors cursor-pointer group flex flex-col items-center gap-4"
                                                onClick={() => logoInputRef.current?.click()}
                                            >
                                                {draft.expressionEngine.brandIdentity?.logo ? (
                                                    <img src={draft.expressionEngine.brandIdentity.logo} className="h-32 object-contain" />
                                                ) : (
                                                    <div className="w-16 h-16 bg-stone-50 dark:bg-stone-900 rounded-full flex items-center justify-center text-stone-400 group-hover:text-emerald-500 transition-colors">
                                                        <Upload size={24} />
                                                    </div>
                                                )}
                                                <span className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-400 group-hover:text-emerald-500">
                                                    {draft.expressionEngine.brandIdentity?.logo ? 'Replace Logo' : 'Upload Logo'}
                                                </span>
                                            </div>
                                            <input type="file" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
                                        </FieldGroup>

                                        <FieldGroup label="Typography System">
                                            <div className="grid grid-cols-1 gap-6">
                                                <div className="space-y-2">
                                                    <label className="font-sans text-[7px] uppercase tracking-widest text-stone-400">Primary Serif (Headlines)</label>
                                                    <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 focus-within:border-emerald-500 transition-colors">
                                                        <input 
                                                            value={draft.expressionEngine.brandIdentity?.fonts.serif || ''} 
                                                            onChange={e => updateExpression('brandIdentity', { ...draft.expressionEngine.brandIdentity!, fonts: { ...draft.expressionEngine.brandIdentity!.fonts, serif: e.target.value } })}
                                                            className="w-full bg-transparent py-2 font-serif italic text-xl focus:outline-none"
                                                            placeholder="e.g. Cormorant Garamond"
                                                            style={{ fontFamily: draft.expressionEngine.brandIdentity?.fonts.serif }}
                                                        />
                                                        <button 
                                                            onClick={() => injectGoogleFont(draft.expressionEngine.brandIdentity?.fonts.serif || '')}
                                                            className="p-2 text-stone-400 hover:text-emerald-500 transition-colors"
                                                            title="Fetch from Google Fonts"
                                                        >
                                                            <Download size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="font-sans text-[7px] uppercase tracking-widest text-stone-400">Secondary Sans (Body)</label>
                                                    <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 focus-within:border-emerald-500 transition-colors">
                                                        <input 
                                                            value={draft.expressionEngine.brandIdentity?.fonts.sans || ''} 
                                                            onChange={e => updateExpression('brandIdentity', { ...draft.expressionEngine.brandIdentity!, fonts: { ...draft.expressionEngine.brandIdentity!.fonts, sans: e.target.value } })}
                                                            className="w-full bg-transparent py-2 font-sans text-lg focus:outline-none"
                                                            placeholder="e.g. Inter"
                                                            style={{ fontFamily: draft.expressionEngine.brandIdentity?.fonts.sans }}
                                                        />
                                                        <button 
                                                            onClick={() => injectGoogleFont(draft.expressionEngine.brandIdentity?.fonts.sans || '')}
                                                            className="p-2 text-stone-400 hover:text-emerald-500 transition-colors"
                                                            title="Fetch from Google Fonts"
                                                        >
                                                            <Download size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="font-sans text-[7px] uppercase tracking-widest text-stone-400">Tertiary Mono (Data)</label>
                                                    <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 focus-within:border-emerald-500 transition-colors">
                                                        <input 
                                                            value={draft.expressionEngine.brandIdentity?.fonts.mono || ''} 
                                                            onChange={e => updateExpression('brandIdentity', { ...draft.expressionEngine.brandIdentity!, fonts: { ...draft.expressionEngine.brandIdentity!.fonts, mono: e.target.value } })}
                                                            className="w-full bg-transparent py-2 font-mono text-sm focus:outline-none"
                                                            placeholder="e.g. Space Mono"
                                                            style={{ fontFamily: draft.expressionEngine.brandIdentity?.fonts.mono }}
                                                        />
                                                        <button 
                                                            onClick={() => injectGoogleFont(draft.expressionEngine.brandIdentity?.fonts.mono || '')}
                                                            className="p-2 text-stone-400 hover:text-emerald-500 transition-colors"
                                                            title="Fetch from Google Fonts"
                                                        >
                                                            <Download size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </FieldGroup>

                                        <FieldGroup label="Brand Palette">
                                            <div className="flex flex-wrap gap-4 mb-4">
                                                {draft.expressionEngine.brandIdentity?.palette.map((hex, i) => (
                                                    <div key={i} className="group relative">
                                                        <div className="w-12 h-12 rounded-full shadow-sm cursor-pointer border border-black/5" style={{ backgroundColor: hex }} />
                                                        <button 
                                                            onClick={() => updateExpression('brandIdentity', { ...draft.expressionEngine.brandIdentity!, palette: draft.expressionEngine.brandIdentity!.palette.filter((_, idx) => idx !== i) })}
                                                            className="absolute -top-1 -right-1 bg-white text-red-500 rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X size={10}/>
                                                        </button>
                                                    </div>
                                                ))}
                                                <div className="relative flex items-center">
                                                    <input 
                                                        type="color" 
                                                        onChange={e => updateExpression('brandIdentity', { ...draft.expressionEngine.brandIdentity!, palette: [...(draft.expressionEngine.brandIdentity?.palette || []), e.target.value] })}
                                                        className="w-12 h-12 opacity-0 absolute inset-0 cursor-pointer"
                                                    />
                                                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-stone-300 flex items-center justify-center text-stone-300 pointer-events-none">
                                                        <Plus size={16} />
                                                    </div>
                                                </div>
                                            </div>
                                        </FieldGroup>
                                    </>
                                )}

                                {activeStep === 'settings' && (
                                    <>
                                        <p className="font-serif italic text-stone-500 mb-8">Configure the identity and security protocols for this mask.</p>
                                        
                                        <FieldGroup label="Mask Identity">
                                            <div className="space-y-6">
                                                <div className="space-y-2">
                                                    <label className="font-sans text-[7px] uppercase tracking-widest text-stone-400 font-black">Display Name</label>
                                                    <input 
                                                        value={personaName}
                                                        onChange={e => setPersonaName(e.target.value)}
                                                        placeholder="e.g. The Architect"
                                                        className="w-full bg-transparent border-b border-stone-200 dark:border-stone-800 py-2 font-serif italic text-2xl focus:outline-none focus:border-emerald-500 transition-colors"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="font-sans text-[7px] uppercase tracking-widest text-stone-400 font-black">Dedicated API Key (Optional)</label>
                                                    <div className="relative">
                                                        <input 
                                                            type="password"
                                                            value={personaKey}
                                                            onChange={e => setPersonaKey(e.target.value)}
                                                            placeholder="sk-..."
                                                            className="w-full bg-transparent border-b border-stone-200 dark:border-stone-800 py-2 font-mono text-sm focus:outline-none focus:border-emerald-500 transition-colors pr-10"
                                                        />
                                                        <Key size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-300" />
                                                    </div>
                                                    <p className="font-sans text-[8px] text-stone-400 italic">If provided, this mask will use its own billing and rate limits.</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="font-sans text-[7px] uppercase tracking-widest text-stone-400 font-black">AI Signature</label>
                                                    <div className="flex gap-2 items-center">
                                                        <input 
                                                            value={aiSignature}
                                                            readOnly
                                                            placeholder="Generate a signature..."
                                                            className="flex-1 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 py-2 px-3 font-mono text-xs text-stone-500 rounded-sm focus:outline-none"
                                                        />
                                                        <button 
                                                            onClick={generateAiSignature}
                                                            disabled={isGeneratingSignature}
                                                            className="px-4 py-2 bg-stone-100 dark:bg-stone-800 text-stone-500 rounded-sm font-sans text-[8px] uppercase tracking-widest font-black hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors flex items-center gap-2"
                                                        >
                                                            {isGeneratingSignature ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                                                            Generate
                                                        </button>
                                                    </div>
                                                    <p className="font-sans text-[8px] text-stone-400 italic">A cryptographic-style identifier generated from this mask's aesthetic core.</p>
                                                </div>
                                                <button 
                                                    onClick={handleUpdatePersonaSettings}
                                                    disabled={isSaving || !personaName.trim()}
                                                    className="px-6 py-2 bg-nous-text dark:bg-white text-white dark:text-stone-900 rounded-full font-sans text-[9px] uppercase tracking-widest font-black shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center gap-2"
                                                >
                                                    {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                                    Update Protocols
                                                </button>
                                                
                                                <div className="pt-8 border-t border-stone-200 dark:border-stone-800">
                                                    <button 
                                                        onClick={async () => {
                                                            if (personas.length <= 1) {
                                                                window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Cannot burn the final mask.", type: 'error' } }));
                                                                return;
                                                            }
                                                            if (window.confirm("Are you sure you want to burn this mask? This action is irreversible and will delete all associated drafts and shards.")) {
                                                                await deletePersona(activePersonaId!);
                                                                window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Mask Burned.", icon: <Trash2 size={14} /> } }));
                                                                setViewMode('blueprint');
                                                            }
                                                        }}
                                                        disabled={personas.length <= 1}
                                                        className={`px-6 py-2 bg-transparent border rounded-full font-sans text-[9px] uppercase tracking-widest font-black transition-all flex items-center gap-2 ${personas.length <= 1 ? 'text-stone-400 border-stone-400 cursor-not-allowed opacity-50' : 'text-red-500 border-red-500 hover:bg-red-500 hover:text-white'}`}
                                                    >
                                                        <Trash2 size={12} />
                                                        Burn Mask
                                                    </button>
                                                </div>
                                            </div>
                                        </FieldGroup>

                                        <FieldGroup label="Algo Firewall" description="Arm or disarm specific algorithmic functions for this mask.">
                                            <div className="space-y-4">
                                                {[
                                                    { id: 'zine_gen', name: 'Zine Synthesis', desc: 'The core engine for translating shards into editorial zines.' },
                                                    { id: 'scribe_reading', name: 'Scribe Reading', desc: 'Oracular readings based on profile and context.' },
                                                    { id: 'web_scry', name: 'Web Scry', desc: 'Grounding search results in real-world web signals.' },
                                                    { id: 'visual_plates', name: 'Visual Plates', desc: 'Generative image synthesis for editorial spreads.' },
                                                    { id: 'vocal_note', name: 'Vocal Note', desc: 'Voice-to-text and synthesis for vocal transmissions.' }
                                                ].map(algo => {
                                                    const isEnabled = enabledAlgos.includes(algo.id);
                                                    return (
                                                        <div key={algo.id} className="flex items-center justify-between p-4 border border-stone-100 dark:border-stone-800 rounded-sm bg-white/50 dark:bg-stone-900/50 group hover:border-emerald-500 transition-all">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`font-sans text-[9px] uppercase tracking-widest font-black ${isEnabled ? 'text-emerald-500' : 'text-stone-400'}`}>{algo.name}</span>
                                                                    {isEnabled && <ShieldCheck size={10} className="text-emerald-500" />}
                                                                </div>
                                                                <p className="font-serif italic text-xs text-stone-500">{algo.desc}</p>
                                                            </div>
                                                            <button 
                                                                onClick={() => toggleAlgo(algo.id)}
                                                                className={`p-2 rounded-full transition-all ${isEnabled ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-stone-200 dark:bg-stone-800 text-stone-400 hover:text-stone-600'}`}
                                                            >
                                                                {isEnabled ? <Zap size={16} /> : <Wind size={16} />}
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </FieldGroup>
                                    </>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* ALIGN FOOTER */}
                    <div className="p-8 border-t md:border-t-0 md:border-l border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-black/20 flex flex-col shrink-0 md:w-64 overflow-y-auto no-scrollbar">
                        <div className="space-y-8">
                            {/* Aesthetic Preview */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-sans text-[7px] uppercase tracking-[0.4em] font-black text-stone-400">Aesthetic Preview</span>
                                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                </div>
                                {draft && activePersonaId && (
                                    <TailorPreview draft={draft} activePersonaId={activePersonaId} apiKey={activePersona?.apiKey} />
                                )}
                                <p className="font-serif italic text-[10px] text-stone-400 leading-tight">
                                    Real-time synthesis of your current aesthetic DNA.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-emerald-500">
                                    <Target size={18} className="animate-pulse" />
                                    <span className="font-sans text-[9px] uppercase tracking-[0.4em] font-black italic">Alignment Protocol</span>
                                    {draft.draftStatus === 'provisional' && (
                                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full font-mono text-[8px] uppercase tracking-widest ml-auto">Unaligned</span>
                                    )}
                                </div>
                                <p className="font-serif italic text-xs text-stone-500 leading-relaxed">
                                    Changes are local until aligned. Committing writes this logic to your active mask.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4 mt-12">
                            <button onClick={handleAlign} disabled={isSaving} className="w-full py-4 bg-nous-text dark:bg-white text-white dark:text-black rounded-full font-sans text-[9px] uppercase tracking-[0.4em] font-black shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
                                {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Align Logic
                            </button>
                            <button onClick={handleScryDirectives} disabled={isAuditing} className="w-full py-4 border border-stone-200 dark:border-stone-800 rounded-full font-sans text-[9px] uppercase tracking-[0.4em] font-black text-stone-500 hover:text-emerald-500 transition-all flex items-center justify-center gap-3">
                                {isAuditing ? <Loader2 size={12} className="animate-spin" /> : <Radar size={12} />} Scry Directives
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <AnimatePresence>
            {showAuditOverlay && auditReport && (
                <TailorAuditOverlay 
                    auditReport={auditReport} 
                    onClose={() => setShowAuditOverlay(false)} 
                    onApplyToGeneration={(text) => {
                        window.dispatchEvent(new CustomEvent('mimi:change_view', { 
                            detail: 'studio', 
                            detail_data: { context: `[AUDIT MANIFESTO APPLIED]\n\n${text}\n\nGenerate based on this logic.` } 
                        }));
                    }}
                />
            )}
        </AnimatePresence>

        <input type="file" ref={fileInputRef} onChange={handleShardUpload} className="hidden" multiple accept="image/*" />
      </div>
    </div>
  );
};
