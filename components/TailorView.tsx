
// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scissors, Ruler, Radio, Sparkles, Loader2, 
  ShieldCheck, Zap, Wind, Anchor, History,
  Waves, BookOpen, PenTool, Check, ArrowRight, 
  X, BrainCircuit, Save, Orbit, Feather, Activity, Target, Sliders, Layers, Info, Box, Palette, ImageIcon, Type, Plus, Trash2, Maximize2, MoveHorizontal, Mic, ArrowLeft, Heart, User, CheckCircle, Droplet, Hash, ListChecks, Radar, Globe, Instagram, Link, Stars, ExternalLink, ShieldAlert, Quote, FileText, Copy, Terminal, Gauge, Eraser, Binary, Wallet, Smartphone, ChevronRight, Moon, Compass, MapPin, Clock, Calendar, MessageSquare, Upload, Download, DollarSign, Settings, LayoutGrid, Edit3, Key
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { ColorShard, TailorAuditReport, ZodiacSign, TailorLogicDraft } from '../types';
import { analyzeTailorDraft, compressImage } from '../services/geminiService';
import { addToPocket } from '../services/firebase';
import { useTasteLogging } from '../hooks/useTasteLogging';
import { TailorAuditOverlay } from './TailorAuditOverlay';
import { ShardAnalyzer } from './ShardAnalyzer';

// --- CONSTANTS ---
const SILHOUETTE_OPTIONS = ['Architectural', 'Oversized', 'Fluid', 'Minimal', 'Sharp', 'Cinematic', 'Biomorphic', 'Brutalist', 'Deconstructed', 'Tailored'];
const TEXTURE_OPTIONS = ['Raw Silk', 'Cold Concrete', 'Brushed Aluminum', 'Matte Ceramic', 'Heavy Wool', 'Distressed Leather', 'Paper Grain', 'Latex', 'Velvet', 'Glass'];
const ERA_OPTIONS = ['90s Minimal', 'Y2K Cyber', '80s Power', 'Retro-Futurist', 'Post-Digital', 'Old Money Noir', 'Industrial', 'Romantic Goth', 'Bauhaus'];
const VOICE_REGISTERS = ['EDITORIAL', 'DIARY', 'MANIFESTO', 'ARCHIVE', 'TECHNICAL', 'POETIC', 'JOURNAL', 'BRIEF', 'NOIR', 'HIGH-FASHION'];
const SENTENCE_STRUCTURES = ['CONCISE', 'FLOWING', 'FRAGMENTED', 'STACCATO', 'ACADEMIC'];
const EMOTIONAL_TEMPERATURES = ['DETACHED', 'CLINICAL', 'OBSERVATIONAL', 'INTIMATE', 'VISCERAL'];
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
      aestheticCore: { silhouettes: 'Minimal', textures: 'Matte Ceramic', eraFocus: '90s Minimal', density: 20 },
      chromaticRegistry: { baseNeutral: '#FDFBF7', accentSignal: '#1C1917', primaryPalette: [{ name: 'Ink', hex: '#000000', descriptor: 'Preset' }] },
      typographyIntent: { styleDescription: 'Cormorant Garamond', weightPreference: 'Light' }
    }
  },
  {
    name: 'Industrial',
    icon: <Box size={14} />,
    config: {
      aestheticCore: { silhouettes: 'Brutalist', textures: 'Cold Concrete', eraFocus: 'Industrial', density: 80 },
      chromaticRegistry: { baseNeutral: '#262626', accentSignal: '#F97316', primaryPalette: [{ name: 'Steel', hex: '#94A3B8', descriptor: 'Preset' }] },
      typographyIntent: { styleDescription: 'Space Mono', weightPreference: 'Bold' }
    }
  },
  {
    name: 'Vintage',
    icon: <History size={14} />,
    config: {
      aestheticCore: { silhouettes: 'Fluid', textures: 'Paper Grain', eraFocus: 'Old Money Noir', density: 40 },
      chromaticRegistry: { baseNeutral: '#F5F5F4', accentSignal: '#78350F', primaryPalette: [{ name: 'Dust', hex: '#D6D3D1', descriptor: 'Preset' }] },
      typographyIntent: { styleDescription: 'Playfair Display', weightPreference: 'Medium' }
    }
  },
  {
    name: 'Neo-Futurist',
    icon: <Zap size={14} />,
    config: {
      aestheticCore: { silhouettes: 'Biomorphic', textures: 'Brushed Aluminum', eraFocus: 'Post-Digital', density: 70 },
      chromaticRegistry: { baseNeutral: '#050505', accentSignal: '#10B981', primaryPalette: [{ name: 'Neon', hex: '#34D399', descriptor: 'Preset' }] },
      typographyIntent: { styleDescription: 'Space Grotesk', weightPreference: 'Regular' }
    }
  },
  {
    name: 'Brutalist',
    icon: <Terminal size={14} />,
    config: {
      aestheticCore: { silhouettes: 'Brutalist', textures: 'Cold Concrete', eraFocus: 'Industrial', density: 90 },
      chromaticRegistry: { baseNeutral: '#FFFFFF', accentSignal: '#000000', primaryPalette: [{ name: 'Raw', hex: '#000000', descriptor: 'Preset' }] },
      typographyIntent: { styleDescription: 'Space Mono', weightPreference: 'Bold' }
    }
  }
];

const DEFAULT_FONTS = [
  { name: 'Cormorant Garamond', type: 'Serif', label: 'Editorial' },
  { name: 'Space Grotesk', type: 'Sans', label: 'Modern' },
  { name: 'Space Mono', type: 'Mono', label: 'Technical' },
  { name: 'Playfair Display', type: 'Serif', label: 'Classical' },
  { name: 'Inter', type: 'Sans', label: 'Utility' },
  { name: 'DM Sans', type: 'Sans', label: 'Humanist' }
];

const primaryAnchorsMap = [
  { key: 'anime', label: 'Canonical Anime/Cinema', placeholder: 'e.g. Serial Experiments Lain, Perfect Blue...' },
  { key: 'designer', label: 'Archetypal Designer', placeholder: 'e.g. Rick Owens, Margiela, Phoebe Philo...' },
  { key: 'topic', label: 'Obsessive Topic', placeholder: 'e.g. Semiotics, Brutalism, Liminality...' },
  { key: 'book', label: 'Foundational Text', placeholder: 'e.g. Society of the Spectacle, Neuromancer...' },
  { key: 'favoriteThing', label: 'Favorite Object', placeholder: 'e.g. A silver cigarette case, a cracked mirror...' }
];

const DEFAULT_DRAFT_FALLBACK: TailorLogicDraft = {
  interests: { anime: '', designer: '', topic: '', book: '', favoriteThing: '' },
  aestheticCore: { silhouettes: '', textures: '', eraFocus: '90s Minimal', manualEra: '', density: 50, developmentRoadmap: [], visualShards: [] },
  celestialCalibration: { zodiac: 'gemini', astrologicalLineage: '', seasonalAlignment: '' },
  chromaticRegistry: { primaryPalette: [], baseNeutral: '#F2F1ED', accentSignal: '#1C1917' },
  typographyIntent: { styleDescription: '', weightPreference: '' },
  narrativeVoice: { emotionalTemperature: 'CLINICAL', sentenceStructure: 'CONCISE', culturalRegister: ['EDITORIAL'] },
  desireVectors: { moreOf: '', lessOf: '', experimentingWith: '', avoiding: '', materialityAudit: '' },
  brandIdentity: { fonts: { serif: 'Cormorant Garamond', sans: 'Inter', mono: 'Space Mono' }, logo: '', palette: ['#000000', '#FFFFFF'] },
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
  <div className="space-y-4 pb-12 border-b border-black/5 dark:border-white/5 last:border-b-0">
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
  const { profile, updateProfile, personas, activePersonaId, switchPersona, updatePersona, user } = useUser();
  const activePersona = personas.find(p => p.id === activePersonaId);
  const [draft, setDraft] = useState<TailorLogicDraft | null>(null);
  
  const [viewMode, setViewMode] = useState<'blueprint' | 'edit'>('blueprint');
  const [activeStep, setActiveStep] = useState<'anchors' | 'celestial' | 'aesthetic' | 'chromatic' | 'voice' | 'vectors' | 'shards' | 'brand' | 'settings'>('anchors');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditReport, setAuditReport] = useState<TailorAuditReport | null>(null);
  const [showAuditOverlay, setShowAuditOverlay] = useState(false);
  
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // --- LOGIC ---

  useEffect(() => {
      // Defensive Initialization: Ensure draft structure is complete
      const source = activePersona?.tailorDraft || profile?.tailorDraft || DEFAULT_DRAFT_FALLBACK;
      const mergedDraft = {
          ...DEFAULT_DRAFT_FALLBACK,
          ...source,
          interests: { ...DEFAULT_DRAFT_FALLBACK.interests, ...source.interests },
          aestheticCore: { ...DEFAULT_DRAFT_FALLBACK.aestheticCore, ...source.aestheticCore },
          celestialCalibration: { ...DEFAULT_DRAFT_FALLBACK.celestialCalibration, ...source.celestialCalibration },
          chromaticRegistry: { ...DEFAULT_DRAFT_FALLBACK.chromaticRegistry, ...source.chromaticRegistry },
          narrativeVoice: { ...DEFAULT_DRAFT_FALLBACK.narrativeVoice, ...source.narrativeVoice },
          desireVectors: { ...DEFAULT_DRAFT_FALLBACK.desireVectors, ...source.desireVectors },
          brandIdentity: { ...DEFAULT_DRAFT_FALLBACK.brandIdentity, ...source.brandIdentity }
      };
      setDraft(mergedDraft);
      
      setPersonaName(activePersona?.name || '');
      setPersonaKey(activePersona?.apiKey || '');
  }, [activePersonaId, profile?.tailorDraft, activePersona]);

  useEffect(() => {
    if (draft?.typographyIntent?.styleDescription) {
        const currentFont = draft.typographyIntent.styleDescription;
        const exists = availableFonts.some(f => f.name === currentFont);
        if (!exists) {
            setAvailableFonts(prev => [...prev, { name: currentFont, type: 'Custom', label: 'Imported' }]);
            injectGoogleFont(currentFont);
        }
    }
  }, [draft?.typographyIntent?.styleDescription]);

  const injectGoogleFont = (fontName: string) => {
      const linkId = `font-${fontName.replace(/\s+/g, '-')}`;
      if (!document.getElementById(linkId)) {
          const link = document.createElement('link');
          link.id = linkId;
          link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@300;400;500;600&display=swap`;
          link.rel = 'stylesheet';
          document.head.appendChild(link);
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
          updateDraft({ typographyIntent: { ...draft.typographyIntent, styleDescription: fontName } });
          setCustomFontInput('');
          setIsFontLoading(false);
      }, 500);
  };

  useEffect(() => {
    if (initialOverrides && draft && draft.desireVectors) {
        setDraft(prev => prev ? ({
            ...prev,
            desireVectors: {
                ...prev.desireVectors,
                experimentingWith: (initialOverrides.suggestedExperiments || []).join(', ') || prev.desireVectors.experimentingWith,
                moreOf: initialOverrides.identifiedDrifts || prev.desireVectors.moreOf
            }
        }) : null);
    }
  }, [initialOverrides]);

  const updateDraft = (patch: any) => { if (draft) setDraft(prev => ({ ...prev!, ...patch })); };
  const updateInterest = (field: string, val: string) => { if (draft) updateDraft({ interests: { ...draft.interests, [field]: val } }); };
  const updateCelestial = (field: string, val: string) => { if (draft) updateDraft({ celestialCalibration: { ...draft.celestialCalibration, [field]: val } }); };
  const updateDesireVector = (field: string, val: string) => { if (draft) updateDraft({ desireVectors: { ...draft.desireVectors, [field]: val } }); };

  const toggleOption = (field: string, val: string) => {
    if (!draft) return;
    const current = draft.aestheticCore[field] || '';
    const parts = current.split(',').map(p => p.trim()).filter(p => p);
    if (parts.some(p => p.toLowerCase() === val.toLowerCase())) { 
      updateDraft({ aestheticCore: { ...draft.aestheticCore, [field]: parts.filter(p => p.toLowerCase() !== val.toLowerCase()).join(', ') } }); 
    }
    else { updateDraft({ aestheticCore: { ...draft.aestheticCore, [field]: [...parts, val].join(', ') } }); }
  };

  const addCustomOption = (field: string, val: string) => {
      if (!val.trim() || !draft) return;
      const current = draft.aestheticCore[field] || '';
      const parts = current.split(',').map(p => p.trim()).filter(p => p);
      if (!parts.some(p => p.toLowerCase() === val.toLowerCase())) {
          updateDraft({ aestheticCore: { ...draft.aestheticCore, [field]: [...parts, val].join(', ') } }); 
      }
  };

  const toggleRegister = (val: string) => {
      if (!draft) return;
      const current = draft.narrativeVoice.culturalRegister || [];
      if (current.includes(val)) {
          updateDraft({ narrativeVoice: { ...draft.narrativeVoice, culturalRegister: current.filter(c => c !== val) } });
      } else {
          updateDraft({ narrativeVoice: { ...draft.narrativeVoice, culturalRegister: [...current, val] } });
      }
  };

  const addColorToPalette = () => {
      if (!newColorName.trim() || !draft) return;
      const newColor: ColorShard = { name: newColorName, hex: newColorHex, descriptor: 'Custom' };
      const current = draft.chromaticRegistry?.primaryPalette || [];
      updateDraft({ chromaticRegistry: { ...draft.chromaticRegistry, primaryPalette: [...current, newColor] } });
      setNewColorName('');
  };

  const removeColor = (hex: string) => {
      if (!draft) return;
      const current = draft.chromaticRegistry?.primaryPalette || [];
      updateDraft({ chromaticRegistry: { ...draft.chromaticRegistry, primaryPalette: current.filter(c => c.hex !== hex) } });
  };

  const applyChromaticPreset = (preset: typeof CHROMATIC_PRESETS[0]) => {
      if (!draft) return;
      updateDraft({
          chromaticRegistry: {
              ...draft.chromaticRegistry,
              baseNeutral: preset.base,
              accentSignal: preset.accent,
              primaryPalette: preset.palette.map(p => ({ ...p, descriptor: 'Preset' }))
          }
      });
  };

  const applyVisualPreset = (preset: typeof VISUAL_PRESETS[0]) => {
    if (!draft) return;
    updateDraft({
      aestheticCore: { ...draft.aestheticCore, ...preset.config.aestheticCore },
      chromaticRegistry: { ...draft.chromaticRegistry, ...preset.config.chromaticRegistry },
      typographyIntent: { ...draft.typographyIntent, ...preset.config.typographyIntent }
    });
    window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: `${preset.name} Preset Applied.`, icon: preset.icon } }));
  };

  const handleAlign = async () => {
    if (!profile || !activePersona || !draft) return;
    setIsSaving(true);
    try {
      const finalDraft = { ...draft, draftStatus: 'aligned', lastTailored: Date.now() };
      await updatePersona({ ...activePersona, tailorDraft: finalDraft });
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Logic Aligned to Mask.", icon: <Ruler size={14} /> } }));
    } catch (e) { 
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Alignment Error.", type: 'error' } }));
    } finally { setIsSaving(false); }
  };

  const handleUpdatePersonaSettings = async () => {
      if (!activePersona || !personaName.trim()) return;
      setIsSaving(true);
      try {
          await updatePersona({ ...activePersona, name: personaName, apiKey: personaKey });
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
    for (const file of Array.from(files)) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
            reader.onload = async (ev) => {
                const raw = ev.target?.result as string;
                const compressed = await compressImage(raw, 0.5, 800);
                resolve(compressed);
            };
            reader.readAsDataURL(file);
        });
        newShards.push(base64);
    }
    updateDraft({ aestheticCore: { ...draft.aestheticCore, visualShards: [...(draft.aestheticCore.visualShards || []), ...newShards] } });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !draft) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = async (ev) => {
        const raw = ev.target?.result as string;
        const compressed = await compressImage(raw, 0.5, 400);
        updateDraft({ brandIdentity: { ...draft.brandIdentity!, logo: compressed } });
    };
    reader.readAsDataURL(file);
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
    <div className="flex-1 w-full h-full overflow-y-auto no-scrollbar pb-[40vh] px-4 md:px-16 pt-12 md:pt-20 bg-nous-base dark:bg-[#050505] text-nous-text dark:text-white transition-all duration-1000 relative">
      
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
                   <Scissors size={18} className="text-emerald-500" />
                   <span className="font-sans text-[10px] uppercase tracking-[0.5em] font-black italic">Aesthetic Logic Engine v2.0</span>
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
                       <span className="font-serif italic text-sm text-nous-text dark:text-white">{activePersona?.name}</span>
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
                        
                        {/* ANCHORS CARD */}
                        <BlueprintCard label="Canonical Anchors" subLabel="REF: AN-01" onClick={() => openEditor('anchors')} className="md:col-span-2">
                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <span className="font-sans text-[7px] uppercase tracking-widest text-stone-400">Primary Reference</span>
                                    <p className="font-serif italic text-2xl md:text-3xl text-nous-text dark:text-white leading-tight">
                                        {draft.interests.anime || draft.interests.designer || "Undefined Anchor"}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(draft.interests).map(([k, v]) => v && (
                                        <span key={k} className="px-2 py-1 border border-stone-200 dark:border-stone-800 rounded-sm font-mono text-[8px] uppercase text-stone-500">{v}</span>
                                    ))}
                                </div>
                            </div>
                        </BlueprintCard>

                        {/* CHROMATIC CARD */}
                        <BlueprintCard label="Chromatic Logic" subLabel="REF: CR-05" onClick={() => openEditor('chromatic')}>
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <div className="w-12 h-12 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: draft.chromaticRegistry.baseNeutral }} />
                                    <div className="w-12 h-12 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: draft.chromaticRegistry.accentSignal }} />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {draft.chromaticRegistry.primaryPalette.slice(0, 4).map((c, i) => (
                                        <div key={i} className="w-6 h-6 rounded-sm border border-black/5" style={{ backgroundColor: c.hex }} title={c.name} />
                                    ))}
                                </div>
                                <p className="font-mono text-[9px] text-stone-400 uppercase tracking-tight">
                                    Base: {draft.chromaticRegistry.baseNeutral} // Signal: {draft.chromaticRegistry.accentSignal}
                                </p>
                            </div>
                        </BlueprintCard>

                        {/* TYPOGRAPHY CARD */}
                        <BlueprintCard label="Typographic DNA" subLabel="REF: TY-88" onClick={() => openEditor('aesthetic')}>
                            <div className="space-y-2 py-2">
                                <span className="block font-sans text-[7px] uppercase tracking-widest text-stone-400">Primary Typeface</span>
                                <p className="text-3xl" style={{ fontFamily: draft.typographyIntent.styleDescription || 'serif' }}>
                                    {draft.typographyIntent.styleDescription || 'Default Serif'}
                                </p>
                                <p className="font-serif italic text-sm text-stone-500">The quick brown fox jumps over the lazy dog.</p>
                            </div>
                        </BlueprintCard>

                        {/* AESTHETIC CORE */}
                        <BlueprintCard label="Visual Physics" subLabel="REF: PHY-09" onClick={() => openEditor('aesthetic')} className="md:col-span-2">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <span className="font-sans text-[7px] uppercase tracking-widest text-stone-400">Silhouette</span>
                                    <p className="font-serif italic text-xl">{draft.aestheticCore.silhouettes || "Undefined"}</p>
                                </div>
                                <div className="space-y-2">
                                    <span className="font-sans text-[7px] uppercase tracking-widest text-stone-400">Era Focus</span>
                                    <p className="font-serif italic text-xl">{draft.aestheticCore.eraFocus || "Undefined"}</p>
                                </div>
                            </div>
                        </BlueprintCard>

                        {/* BRAND KIT CARD */}
                        <BlueprintCard label="Brand Identity" subLabel="REF: BR-01" onClick={() => openEditor('brand')} className="md:col-span-2">
                            <div className="flex items-center gap-8">
                                <div className="w-24 h-24 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-sm flex items-center justify-center overflow-hidden">
                                    {draft.brandIdentity?.logo ? (
                                        <img src={draft.brandIdentity.logo} className="w-full h-full object-contain" />
                                    ) : (
                                        <span className="font-sans text-[8px] uppercase tracking-widest text-stone-300 font-black">No Logo</span>
                                    )}
                                </div>
                                <div className="space-y-4 flex-1">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <span className="font-sans text-[7px] uppercase tracking-widest text-stone-400 block mb-1">Serif</span>
                                            <span className="font-serif italic text-lg">{draft.brandIdentity?.fonts.serif}</span>
                                        </div>
                                        <div>
                                            <span className="font-sans text-[7px] uppercase tracking-widest text-stone-400 block mb-1">Sans</span>
                                            <span className="font-sans text-lg">{draft.brandIdentity?.fonts.sans}</span>
                                        </div>
                                        <div>
                                            <span className="font-sans text-[7px] uppercase tracking-widest text-stone-400 block mb-1">Mono</span>
                                            <span className="font-mono text-sm">{draft.brandIdentity?.fonts.mono}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {draft.brandIdentity?.palette.map((hex, i) => (
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
                                    <span className="px-3 py-1 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-full font-sans text-[7px] uppercase font-black">{draft.narrativeVoice.emotionalTemperature}</span>
                                    <span className="px-3 py-1 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-full font-sans text-[7px] uppercase font-black">{draft.narrativeVoice.sentenceStructure}</span>
                                </div>
                                <p className="font-serif italic text-stone-500">
                                    Register: {draft.narrativeVoice.culturalRegister.join(', ') || "Unspecified"}
                                </p>
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
                        <div className="bg-stone-50 dark:bg-[#080808] border border-stone-200 dark:border-stone-800 p-8 h-full flex flex-col justify-between rounded-sm">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 text-emerald-500">
                                        <ShieldCheck size={24} />
                                        <span className="font-sans text-[9px] uppercase tracking-[0.4em] font-black">Alignment Protocol</span>
                                    </div>
                                    <p className="font-serif italic text-sm text-stone-500 leading-relaxed">
                                        Changes are local until aligned. Committing writes this logic to your active mask.
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    <button onClick={handleAlign} disabled={isSaving} className="w-full py-4 bg-gradient-to-b from-stone-200 to-stone-300 dark:from-stone-700 dark:to-stone-800 text-stone-500 dark:text-stone-300 rounded-full font-sans text-[10px] uppercase tracking-[0.4em] font-black shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 border-t border-white/50 dark:border-white/10">
                                        {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                        Align Logic
                                    </button>
                                    <button onClick={handleScryDirectives} disabled={isAuditing} className="w-full py-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-full font-sans text-[10px] uppercase tracking-[0.4em] font-black text-stone-400 hover:text-emerald-500 hover:border-emerald-500 transition-all flex items-center justify-center gap-3 shadow-sm">
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
                        {['anchors', 'celestial', 'aesthetic', 'chromatic', 'voice', 'vectors', 'shards', 'brand', 'settings'].map(step => (
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
                                {activeStep === 'anchors' && (
                                    <>
                                        <p className="font-serif italic text-stone-500 mb-8">Ground your mask's logic in the physical world.</p>
                                        
                                        <FieldGroup label="Visual Presets" description="Apply a foundational aesthetic archetype.">
                                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                                            {VISUAL_PRESETS.map(p => {
                                              const isActive = draft.aestheticCore.silhouettes === p.config.aestheticCore.silhouettes && 
                                                               draft.aestheticCore.eraFocus === p.config.aestheticCore.eraFocus;
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
                                        </FieldGroup>

                                        {primaryAnchorsMap.map(field => (
                                            <FieldGroup key={field.key} label={field.label}>
                                                <input 
                                                    value={draft.interests[field.key] || ''}
                                                    onChange={e => updateInterest(field.key, e.target.value)}
                                                    placeholder={field.placeholder}
                                                    className="w-full bg-transparent border-b border-stone-200 dark:border-stone-800 py-4 font-serif italic text-2xl focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-stone-300"
                                                />
                                            </FieldGroup>
                                        ))}
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
                                                    <button key={f.name} onClick={() => updateDraft({ typographyIntent: { ...draft.typographyIntent, styleDescription: f.name } })} className={`text-left p-4 border rounded-sm transition-all ${draft.typographyIntent.styleDescription === f.name ? 'border-emerald-500 bg-emerald-50/10' : 'border-stone-200 dark:border-stone-800'}`}>
                                                        <span className="font-sans text-[7px] uppercase tracking-widest text-stone-400 block mb-1">{f.type}</span>
                                                        <span className="text-xl" style={{ fontFamily: f.name }}>{f.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <input value={customFontInput} onChange={e => setCustomFontInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddFont()} placeholder="e.g. 'Cinzel' or 'Oswald'" className="flex-1 bg-transparent border-b border-stone-200 dark:border-stone-800 py-2 font-serif italic text-lg" />
                                                <button onClick={handleAddFont} disabled={isFontLoading} className="font-sans text-[9px] uppercase tracking-widest font-black flex items-center gap-2 hover:text-emerald-500">{isFontLoading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} Fetch Font</button>
                                            </div>
                                            {draft.typographyIntent.styleDescription && <p className="mt-4 text-sm text-stone-400 font-serif italic">Mimi will inject the Google Font stylesheet immediately.</p>}
                                        </FieldGroup>

                                        <FieldGroup label="Silhouettes">
                                            <PresetStrip options={SILHOUETTE_OPTIONS} current={draft.aestheticCore.silhouettes} onSelect={(v) => toggleOption('silhouettes', v)} onAddCustom={(v) => addCustomOption('silhouettes', v)} customPlaceholder="Add custom silhouette..." />
                                        </FieldGroup>
                                        <FieldGroup label="Textures">
                                            <PresetStrip options={TEXTURE_OPTIONS} current={draft.aestheticCore.textures} onSelect={(v) => toggleOption('textures', v)} onAddCustom={(v) => addCustomOption('textures', v)} customPlaceholder="Add custom texture..." />
                                        </FieldGroup>
                                        <FieldGroup label="Era Focus">
                                            <PresetStrip options={ERA_OPTIONS} current={draft.aestheticCore.eraFocus} onSelect={(v) => toggleOption('eraFocus', v)} onAddCustom={(v) => addCustomOption('eraFocus', v)} customPlaceholder="Add specific era..." />
                                        </FieldGroup>
                                        <FieldGroup label="Density / Entropy">
                                            <div className="flex items-center gap-4">
                                                <span className="font-mono text-xs">MINIMAL</span>
                                                <input type="range" min="0" max="100" value={draft.aestheticCore.density} onChange={e => updateDraft({ aestheticCore: { ...draft.aestheticCore, density: parseInt(e.target.value) } })} className="flex-1 h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                                                <span className="font-mono text-xs">MAXIMAL</span>
                                            </div>
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
                                                  <input type="color" value={draft.chromaticRegistry.baseNeutral} onChange={e => updateDraft({ chromaticRegistry: { ...draft.chromaticRegistry, baseNeutral: e.target.value } })} className="w-12 h-12 p-0 border-0 rounded-full cursor-pointer absolute inset-0 opacity-0" />
                                                  <div className="w-12 h-12 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: draft.chromaticRegistry.baseNeutral }} />
                                                </div>
                                                <input value={draft.chromaticRegistry.baseNeutral} onChange={e => updateDraft({ chromaticRegistry: { ...draft.chromaticRegistry, baseNeutral: e.target.value } })} className="bg-transparent border-b border-stone-200 py-2 font-mono text-lg focus:outline-none focus:border-emerald-500" />
                                            </div>
                                        </FieldGroup>
                                        <FieldGroup label="Accent Signal" description="Your alert. Enter Hex or use picker.">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                  <input type="color" value={draft.chromaticRegistry.accentSignal} onChange={e => updateDraft({ chromaticRegistry: { ...draft.chromaticRegistry, accentSignal: e.target.value } })} className="w-12 h-12 p-0 border-0 rounded-full cursor-pointer absolute inset-0 opacity-0" />
                                                  <div className="w-12 h-12 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: draft.chromaticRegistry.accentSignal }} />
                                                </div>
                                                <input value={draft.chromaticRegistry.accentSignal} onChange={e => updateDraft({ chromaticRegistry: { ...draft.chromaticRegistry, accentSignal: e.target.value } })} className="bg-transparent border-b border-stone-200 py-2 font-mono text-lg focus:outline-none focus:border-emerald-500" />
                                            </div>
                                        </FieldGroup>
                                        
                                        <FieldGroup label="Extended Palette" description="Define the core signals.">
                                            <div className="flex flex-wrap gap-4 mb-4">
                                                {draft.chromaticRegistry.primaryPalette.map((c, i) => (
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
                                            <PresetStrip options={EMOTIONAL_TEMPERATURES} current={draft.narrativeVoice.emotionalTemperature} onSelect={(v) => updateDraft({ narrativeVoice: { ...draft.narrativeVoice, emotionalTemperature: v } })} />
                                        </FieldGroup>
                                        <FieldGroup label="Sentence Structure">
                                            <PresetStrip options={SENTENCE_STRUCTURES} current={draft.narrativeVoice.sentenceStructure} onSelect={(v) => updateDraft({ narrativeVoice: { ...draft.narrativeVoice, sentenceStructure: v } })} />
                                        </FieldGroup>
                                        <FieldGroup label="Cultural Register">
                                            <PresetStrip options={VOICE_REGISTERS} current={draft.narrativeVoice.culturalRegister} onSelect={toggleRegister} onAddCustom={(v) => updateDraft({ narrativeVoice: { ...draft.narrativeVoice, culturalRegister: [...draft.narrativeVoice.culturalRegister, v] } })} customPlaceholder="Add custom register..." />
                                        </FieldGroup>
                                    </>
                                )}

                                {activeStep === 'vectors' && (
                                    <>
                                        <p className="font-serif italic text-stone-500 mb-8">Where is this taste moving towards?</p>
                                        <FieldGroup label="More Of">
                                            <textarea value={draft.desireVectors.moreOf} onChange={e => updateDesireVector('moreOf', e.target.value)} className="w-full bg-transparent border-b border-stone-200 dark:border-stone-800 py-2 font-serif italic text-xl h-24 resize-none focus:outline-none focus:border-emerald-500" placeholder="e.g. Silence, negative space..." />
                                        </FieldGroup>
                                        <FieldGroup label="Less Of">
                                            <textarea value={draft.desireVectors.lessOf} onChange={e => updateDesireVector('lessOf', e.target.value)} className="w-full bg-transparent border-b border-stone-200 dark:border-stone-800 py-2 font-serif italic text-xl h-24 resize-none focus:outline-none focus:border-red-500" placeholder="e.g. Noise, clutter..." />
                                        </FieldGroup>
                                        <FieldGroup label="Experimenting With">
                                            <textarea value={draft.desireVectors.experimentingWith} onChange={e => updateDesireVector('experimentingWith', e.target.value)} className="w-full bg-transparent border-b border-stone-200 dark:border-stone-800 py-2 font-serif italic text-xl h-24 resize-none focus:outline-none focus:border-indigo-500" placeholder="e.g. 3D renders, video essays..." />
                                        </FieldGroup>
                                        <FieldGroup label="Fiscal Velocity / Budget">
                                            <PresetStrip options={PRICE_POINTS} current={draft.desireVectors.fiscalVelocity} onSelect={(v) => updateDesireVector('fiscalVelocity', v)} />
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
                                        
                                        {draft.aestheticCore.visualShards && draft.aestheticCore.visualShards.length > 0 && (
                                            <div className="grid grid-cols-3 gap-4 mt-8">
                                                {draft.aestheticCore.visualShards.map((s, i) => (
                                                    <div key={i} className="aspect-square bg-stone-100 relative group overflow-hidden rounded-sm">
                                                        <img src={s} className="w-full h-full object-cover" />
                                                        <button onClick={() => updateDraft({ aestheticCore: { ...draft.aestheticCore, visualShards: draft.aestheticCore.visualShards.filter((_, idx) => idx !== i) } })} className="absolute top-1 right-1 bg-white text-red-500 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <ShardAnalyzer shards={draft.aestheticCore.visualShards} draft={draft} />
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
                                                {draft.brandIdentity?.logo ? (
                                                    <img src={draft.brandIdentity.logo} className="h-32 object-contain" />
                                                ) : (
                                                    <div className="w-16 h-16 bg-stone-50 dark:bg-stone-900 rounded-full flex items-center justify-center text-stone-400 group-hover:text-emerald-500 transition-colors">
                                                        <Upload size={24} />
                                                    </div>
                                                )}
                                                <span className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-400 group-hover:text-emerald-500">
                                                    {draft.brandIdentity?.logo ? 'Replace Logo' : 'Upload Logo'}
                                                </span>
                                            </div>
                                            <input type="file" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
                                        </FieldGroup>

                                        <FieldGroup label="Typography System">
                                            <div className="grid grid-cols-1 gap-6">
                                                <div className="space-y-2">
                                                    <label className="font-sans text-[7px] uppercase tracking-widest text-stone-400">Primary Serif (Headlines)</label>
                                                    <input 
                                                        value={draft.brandIdentity?.fonts.serif || ''} 
                                                        onChange={e => updateDraft({ brandIdentity: { ...draft.brandIdentity!, fonts: { ...draft.brandIdentity!.fonts, serif: e.target.value } } })}
                                                        className="w-full bg-transparent border-b border-stone-200 dark:border-stone-800 py-2 font-serif italic text-xl focus:outline-none focus:border-emerald-500"
                                                        placeholder="e.g. Cormorant Garamond"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="font-sans text-[7px] uppercase tracking-widest text-stone-400">Secondary Sans (Body)</label>
                                                    <input 
                                                        value={draft.brandIdentity?.fonts.sans || ''} 
                                                        onChange={e => updateDraft({ brandIdentity: { ...draft.brandIdentity!, fonts: { ...draft.brandIdentity!.fonts, sans: e.target.value } } })}
                                                        className="w-full bg-transparent border-b border-stone-200 dark:border-stone-800 py-2 font-sans text-lg focus:outline-none focus:border-emerald-500"
                                                        placeholder="e.g. Inter"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="font-sans text-[7px] uppercase tracking-widest text-stone-400">Tertiary Mono (Data)</label>
                                                    <input 
                                                        value={draft.brandIdentity?.fonts.mono || ''} 
                                                        onChange={e => updateDraft({ brandIdentity: { ...draft.brandIdentity!, fonts: { ...draft.brandIdentity!.fonts, mono: e.target.value } } })}
                                                        className="w-full bg-transparent border-b border-stone-200 dark:border-stone-800 py-2 font-mono text-sm focus:outline-none focus:border-emerald-500"
                                                        placeholder="e.g. Space Mono"
                                                    />
                                                </div>
                                            </div>
                                        </FieldGroup>

                                        <FieldGroup label="Brand Palette">
                                            <div className="flex flex-wrap gap-4 mb-4">
                                                {draft.brandIdentity?.palette.map((hex, i) => (
                                                    <div key={i} className="group relative">
                                                        <div className="w-12 h-12 rounded-full shadow-sm cursor-pointer border border-black/5" style={{ backgroundColor: hex }} />
                                                        <button 
                                                            onClick={() => updateDraft({ brandIdentity: { ...draft.brandIdentity!, palette: draft.brandIdentity!.palette.filter((_, idx) => idx !== i) } })}
                                                            className="absolute -top-1 -right-1 bg-white text-red-500 rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X size={10}/>
                                                        </button>
                                                    </div>
                                                ))}
                                                <div className="relative flex items-center">
                                                    <input 
                                                        type="color" 
                                                        onChange={e => updateDraft({ brandIdentity: { ...draft.brandIdentity!, palette: [...(draft.brandIdentity?.palette || []), e.target.value] } })}
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
                                        <p className="font-serif italic text-stone-500 mb-8">Configure Identity & Billing.</p>
                                        <FieldGroup label="Identity Namespace">
                                            <input value={personaName} onChange={e => setPersonaName(e.target.value)} className="w-full bg-transparent border-b border-stone-200 py-4 font-serif text-3xl italic focus:outline-none" placeholder="Persona Name..." />
                                        </FieldGroup>
                                        <FieldGroup label="Sovereign API Key" description="Bind a specific billing account to this mask. Overrides global key.">
                                            <div className="flex items-center gap-4">
                                                <Key size={18} className="text-stone-400" />
                                                <input type="password" value={personaKey} onChange={e => setPersonaKey(e.target.value)} className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 font-mono text-sm focus:outline-none rounded-sm" placeholder="AIza..." />
                                            </div>
                                            <p className="text-[10px] text-stone-400 font-serif italic mt-2">Leave empty to inherit the global sovereign key. <a href="https://aistudio.google.com/app/apikey" target="_blank" className="underline decoration-stone-300">Get Key</a></p>
                                        </FieldGroup>
                                        <div className="pt-8">
                                            <button onClick={handleUpdatePersonaSettings} disabled={isSaving} className="px-8 py-3 bg-nous-text dark:bg-white text-white dark:text-black rounded-full font-sans text-[9px] uppercase tracking-widest font-black shadow-xl active:scale-95 transition-all flex items-center gap-3">
                                                {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Commit Settings
                                            </button>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* ALIGN FOOTER */}
                    <div className="p-8 border-t md:border-t-0 md:border-l border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-black/20 flex flex-col justify-between shrink-0 md:w-64">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-emerald-500">
                                <Target size={18} className="animate-pulse" />
                                <span className="font-sans text-[9px] uppercase tracking-[0.4em] font-black italic">Alignment Protocol</span>
                            </div>
                            <p className="font-serif italic text-xs text-stone-500 leading-relaxed">
                                Changes are local until aligned. Committing writes this logic to your active mask.
                            </p>
                        </div>
                        <div className="space-y-4 mt-8 md:mt-0">
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
