
// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scissors, Ruler, Radio, Sparkles, Loader2, 
  ShieldCheck, Zap, Wind, Anchor, 
  Waves, BookOpen, PenTool, Check, ArrowRight, 
  X, BrainCircuit, Save, Orbit, Feather, Activity, Target, Sliders, Layers, Info, Box, Palette, ImageIcon, Type, Plus, Trash2, Maximize2, MoveHorizontal, Mic, ArrowLeft, Heart, User, CheckCircle, Droplet, Hash, ListChecks, Radar, Globe, Instagram, Link, Stars, ExternalLink, ShieldAlert, Quote, FileText, Copy, Terminal, Gauge, Eraser, Binary, Wallet, Smartphone, ChevronRight, Moon, Compass, MapPin, Clock, Calendar, MessageSquare, Upload, Download, DollarSign, Settings
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { ColorShard, TailorAuditReport, ZodiacSign } from '../types';
import { analyzeTailorDraft, compressImage } from '../services/geminiService';
import { addToPocket } from '../services/firebase';
import { useTasteLogging } from '../hooks/useTasteLogging';
import { TailorAuditOverlay } from './TailorAuditOverlay';
import { ShardAnalyzer } from './ShardAnalyzer';

const SILHOUETTE_OPTIONS = ['Architectural', 'Oversized', 'Fluid', 'Minimal', 'Sharp', 'Cinematic', 'Biomorphic', 'Brutalist', 'Deconstructed', 'Tailored'];
const TEXTURE_OPTIONS = ['Raw Silk', 'Cold Concrete', 'Brushed Aluminum', 'Matte Ceramic', 'Heavy Wool', 'Distressed Leather', 'Paper Grain', 'Latex', 'Velvet', 'Glass'];
const ERA_OPTIONS = ['90s Minimal', 'Y2K Cyber', '80s Power', 'Retro-Futurist', 'Post-Digital', 'Old Money Noir', 'Industrial', 'Romantic Goth', 'Bauhaus'];
const VOICE_REGISTERS = ['EDITORIAL', 'DIARY', 'MANIFESTO', 'ARCHIVE', 'TECHNICAL', 'POETIC', 'JOURNAL', 'BRIEF', 'NOIR', 'HIGH-FASHION'];
const SENTENCE_STRUCTURES = ['CONCISE', 'FLOWING', 'FRAGMENTED', 'STACCATO', 'ACADEMIC'];
const EMOTIONAL_TEMPERATURES = ['DETACHED', 'CLINICAL', 'OBSERVATIONAL', 'INTIMATE', 'VISCERAL'];
const ZODIAC_SIGNS: ZodiacSign[] = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
const PRICE_POINTS = ['DIY ($0)', 'Micro ($100-500)', 'Studio ($1k-5k)', 'Agency ($10k+)', 'Enterprise (Unlimited)'];

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

// Helper Component for Custom Inputs
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

export const TailorView: React.FC<{ initialOverrides?: any }> = ({ initialOverrides }) => {
  const { profile, updateProfile, personas, activePersonaId, switchPersona, updatePersona, user } = useUser();
  
  const activePersona = personas.find(p => p.id === activePersonaId);
  const [draft, setDraft] = useState(activePersona?.tailorDraft || profile?.tailorDraft);
  
  const [activeStep, setActiveStep] = useState<'anchors' | 'celestial' | 'aesthetic' | 'chromatic' | 'voice' | 'vectors' | 'shards' | 'settings'>('anchors');
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
  const [personaName, setPersonaName] = useState(activePersona?.name || '');
  const [personaKey, setPersonaKey] = useState(activePersona?.apiKey || '');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load fonts from the draft if they aren't in default list
  useEffect(() => {
    if (draft?.typographyIntent?.styleDescription) {
        const currentFont = draft.typographyIntent.styleDescription;
        const exists = availableFonts.some(f => f.name === currentFont);
        if (!exists) {
            // Optimistically add it
            setAvailableFonts(prev => [...prev, { name: currentFont, type: 'Custom', label: 'Imported' }]);
            injectGoogleFont(currentFont);
        }
    }
  }, []);

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
      
      // Simulate check/load
      injectGoogleFont(fontName);
      
      setTimeout(() => {
          setAvailableFonts(prev => [
              ...prev, 
              { name: fontName, type: 'Custom', label: 'Imported' }
          ]);
          updateDraft({ typographyIntent: { ...draft.typographyIntent, styleDescription: fontName } });
          setCustomFontInput('');
          setIsFontLoading(false);
      }, 500);
  };

  useEffect(() => {
      if (activePersona) {
          setDraft(activePersona.tailorDraft);
          setPersonaName(activePersona.name);
          setPersonaKey(activePersona.apiKey || '');
      }
  }, [activePersonaId]);

  const handleUpdatePersonaSettings = async () => {
      if (!activePersona || !personaName.trim()) return;
      setIsSaving(true);
      try {
          await updatePersona({ 
              ...activePersona, 
              name: personaName,
              apiKey: personaKey 
          });
          window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Mask Protocols Updated.", icon: <CheckCircle size={14} /> } }));
      } catch(e) {
          window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Update Failed.", type: 'error' } }));
      } finally {
          setIsSaving(false);
      }
  };

  useEffect(() => {
    if (initialOverrides && draft && draft.desireVectors) {
        setDraft(prev => ({
            ...prev,
            desireVectors: {
                ...prev.desireVectors,
                experimentingWith: (initialOverrides.suggestedExperiments || []).join(', ') || prev.desireVectors.experimentingWith,
                moreOf: initialOverrides.identifiedDrifts || prev.desireVectors.moreOf
            }
        }));
    }
  }, [initialOverrides]);

  const updateDraft = (patch: any) => { 
      setDraft(prev => ({ ...prev, ...patch })); 
  };
  
  const updateInterest = (field: string, val: string) => { updateDraft({ interests: { ...draft.interests, [field]: val } }); };
  
  const updateCelestial = (field: string, val: string) => {
      updateDraft({ celestialCalibration: { ...draft.celestialCalibration, [field]: val } });
  };

  const updateDesireVector = (field: string, val: string) => {
      updateDraft({ desireVectors: { ...draft.desireVectors, [field]: val } });
  };

  const toggleOption = (field: string, val: string) => {
    const current = draft.aestheticCore[field] || '';
    const parts = current.split(',').map(p => p.trim()).filter(p => p);
    if (parts.some(p => p.toLowerCase() === val.toLowerCase())) { 
      updateDraft({ aestheticCore: { ...draft.aestheticCore, [field]: parts.filter(p => p.toLowerCase() !== val.toLowerCase()).join(', ') } }); 
    }
    else { updateDraft({ aestheticCore: { ...draft.aestheticCore, [field]: [...parts, val].join(', ') } }); }
  };

  const addCustomOption = (field: string, val: string) => {
      if (!val.trim()) return;
      const current = draft.aestheticCore[field] || '';
      const parts = current.split(',').map(p => p.trim()).filter(p => p);
      if (!parts.some(p => p.toLowerCase() === val.toLowerCase())) {
          updateDraft({ aestheticCore: { ...draft.aestheticCore, [field]: [...parts, val].join(', ') } }); 
      }
  };

  const toggleRegister = (val: string) => {
      const current = draft.narrativeVoice.culturalRegister || [];
      if (current.includes(val)) {
          updateDraft({ narrativeVoice: { ...draft.narrativeVoice, culturalRegister: current.filter(c => c !== val) } });
      } else {
          updateDraft({ narrativeVoice: { ...draft.narrativeVoice, culturalRegister: [...current, val] } });
      }
  };

  const addColorToPalette = () => {
      if (!newColorName.trim()) return;
      const newColor: ColorShard = { name: newColorName, hex: newColorHex, descriptor: 'Custom' };
      const current = draft.chromaticRegistry?.primaryPalette || [];
      updateDraft({ chromaticRegistry: { ...draft.chromaticRegistry, primaryPalette: [...current, newColor] } });
      setNewColorName('');
  };

  const removeColor = (hex: string) => {
      const current = draft.chromaticRegistry?.primaryPalette || [];
      updateDraft({ chromaticRegistry: { ...draft.chromaticRegistry, primaryPalette: current.filter(c => c.hex !== hex) } });
  };

  const handleAlign = async () => {
    if (!profile || !activePersona) return;
    setIsSaving(true);
    try {
      const finalDraft = { ...draft, draftStatus: 'aligned', lastTailored: Date.now() };
      await updatePersona({ ...activePersona, tailorDraft: finalDraft });
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Logic Aligned to Mask.", icon: <Ruler size={14} /> } }));
    } catch (e) { 
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Alignment Error.", type: 'error' } }));
    } finally { setIsSaving(false); }
  };

  const handleScryDirectives = async () => {
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
    if (!files || files.length === 0) return;
    
    // In a real implementation, we would upload these. For now, compressing to base64.
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

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDrop = async (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      if (files.length === 0) return;
      
      const newShards: string[] = [];
      for (const file of files) {
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

  return (
    <div className="flex-1 w-full h-full overflow-y-auto no-scrollbar pb-96 px-6 md:px-16 pt-12 md:pt-20 bg-nous-base dark:bg-[#050505] text-nous-text dark:text-white transition-all duration-1000 relative">
      <div className="max-w-4xl mx-auto space-y-16 relative z-10">
        
        {/* HEADER */}
        <header className="space-y-10 border-b border-black/5 dark:border-white/5 pb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
             <div className="space-y-4">
                <div className="flex items-center gap-3 text-stone-400">
                   <Scissors size={18} className="text-emerald-500" />
                   <span className="font-sans text-[10px] uppercase tracking-[0.5em] font-black italic">Aesthetic Logic Engine</span>
                </div>
                <h2 className="font-serif text-5xl md:text-7xl italic tracking-tighter text-nous-text dark:text-white leading-none">The Tailor.</h2>
                <p className="font-serif italic text-lg text-stone-500 max-w-xl">
                   Define the physics of your world. This logic informs every generation.
                </p>
             </div>
             
             <div className="flex items-center gap-4 bg-white/50 dark:bg-stone-900/50 backdrop-blur-xl px-6 py-3 rounded-full border border-stone-200 dark:border-stone-800 shadow-sm group cursor-pointer hover:border-emerald-500 transition-all" onClick={() => window.dispatchEvent(new CustomEvent('mimi:change_view', { detail: 'profile' }))}>
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center animate-pulse"><User size={14} /></div>
                <div className="flex flex-col">
                   <span className="font-sans text-[7px] uppercase tracking-widest text-stone-400 font-black">Active Mask</span>
                   <span className="font-serif italic text-sm text-nous-text dark:text-white">{activePersona?.name}</span>
                </div>
                <ChevronRight size={14} className="text-stone-300 group-hover:text-emerald-500 transition-colors ml-2" />
             </div>
          </div>

          <div className="flex flex-col gap-4 sticky top-0 z-20 bg-nous-base/95 dark:bg-[#050505]/95 backdrop-blur-xl pt-4 pb-2">
            <div className="flex gap-8 pt-4 overflow-x-auto no-scrollbar">
               {[
                 { id: 'anchors', label: 'ANCHORS', icon: <Anchor size={12} /> },
                 { id: 'celestial', label: 'CELESTIAL', icon: <Moon size={12} /> },
                 { id: 'aesthetic', label: 'AESTHETIC', icon: <Layers size={12} /> },
                 { id: 'chromatic', label: 'CHROMATIC', icon: <Palette size={12} /> },
                 { id: 'voice', label: 'VOICE', icon: <Mic size={12} /> },
                 { id: 'vectors', label: 'VECTORS', icon: <Target size={12} /> },
                 { id: 'shards', label: 'VISUALS', icon: <ImageIcon size={12} /> },
                 { id: 'settings', label: 'SETTINGS', icon: <Settings size={12} /> }
               ].map(step => (
                  <button key={step.id} onClick={() => setActiveStep(step.id as any)} className={`flex items-center gap-2 font-sans text-[8px] uppercase tracking-widest font-black transition-all shrink-0 pb-3 border-b-2 ${activeStep === step.id ? 'text-nous-text dark:text-white border-current' : 'text-stone-400 border-transparent hover:text-stone-600'}`}>
                    {step.icon} {step.label}
                  </button>
               ))}
            </div>
          </div>
        </header>

        {/* MAIN FORM AREA */}
        <main className="grid md:grid-cols-12 gap-12">
          {draft && (
            <div className="md:col-span-8">
               <AnimatePresence mode="wait">
                  
                  {/* ANCHORS */}
                  {activeStep === 'anchors' && (
                    <motion.div key="anchors" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                          <div className="space-y-2 border-b border-black/5 dark:border-white/5 pb-4">
                            <h3 className="font-serif text-3xl italic tracking-tighter leading-none">Canonical Anchors.</h3>
                            <p className="font-sans text-[8px] uppercase tracking-widest text-stone-400">GROUND YOUR MASK'S LOGIC IN THE PHYSICAL WORLD.</p>
                          </div>
                          <div className="grid gap-8">
                             {primaryAnchorsMap.map(anchor => (
                               <div key={anchor.key} className="space-y-3">
                                  <label htmlFor={anchor.key} className="font-sans text-[7px] uppercase tracking-widest font-black text-stone-500">{anchor.label}</label>
                                  <input id={anchor.key} name={anchor.key} value={draft.interests[anchor.key]} onChange={e => updateInterest(anchor.key, e.target.value)} placeholder={anchor.placeholder} className="w-full bg-transparent border-b border-black/5 dark:border-white/10 py-2 font-serif text-2xl italic focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-stone-600" />
                               </div>
                             ))}
                          </div>
                    </motion.div>
                  )}

                  {/* CELESTIAL */}
                  {activeStep === 'celestial' && (
                    <motion.div key="celestial" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                       <div className="space-y-2 border-b border-black/5 dark:border-white/5 pb-4">
                          <h3 className="font-serif text-3xl italic tracking-tighter leading-none">Celestial Calibration.</h3>
                          <p className="font-sans text-[8px] uppercase tracking-widest text-stone-400">ALIGN YOUR OUTPUT TO COSMIC VECTORS.</p>
                       </div>
                       
                       <FieldGroup label="Zodiac Sign">
                          <div className="flex flex-wrap gap-2">
                             {ZODIAC_SIGNS.map(z => (
                               <button 
                                 key={z} 
                                 onClick={() => updateCelestial('zodiac', z)}
                                 className={`px-4 py-2 border rounded-full font-sans text-[9px] uppercase tracking-widest font-black transition-all ${draft.celestialCalibration?.zodiac === z ? 'bg-nous-text dark:bg-white text-white dark:text-stone-900 border-transparent' : 'border-stone-200 dark:border-stone-800 text-stone-400'}`}
                               >
                                 {z}
                               </button>
                             ))}
                          </div>
                       </FieldGroup>

                       <FieldGroup label="Birth Data (Optional)" description="For deep chart calculation. Data is not stored externally.">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <input type="date" value={draft.celestialCalibration?.birthDate || ''} onChange={e => updateCelestial('birthDate', e.target.value)} className="bg-transparent border-b border-stone-200 dark:border-stone-800 py-2 font-mono text-sm" />
                             <input type="time" value={draft.celestialCalibration?.birthTime || ''} onChange={e => updateCelestial('birthTime', e.target.value)} className="bg-transparent border-b border-stone-200 dark:border-stone-800 py-2 font-mono text-sm" />
                             <input type="text" placeholder="Birth City" value={draft.celestialCalibration?.birthLocation || ''} onChange={e => updateCelestial('birthLocation', e.target.value)} className="bg-transparent border-b border-stone-200 dark:border-stone-800 py-2 font-serif italic text-lg" />
                          </div>
                       </FieldGroup>

                       <FieldGroup label="Astrological Lineage" description="Describe your chart's dominant placements (e.g. Scorpio Moon, Leo Rising).">
                          <textarea 
                             value={draft.celestialCalibration?.astrologicalLineage || ''}
                             onChange={e => updateCelestial('astrologicalLineage', e.target.value)}
                             placeholder="Sun in... Moon in... Rising in..."
                             className="w-full bg-stone-50 dark:bg-stone-900 p-4 font-serif italic text-lg border border-stone-200 dark:border-stone-800 rounded-sm focus:outline-none focus:border-emerald-500"
                          />
                       </FieldGroup>
                    </motion.div>
                  )}

                  {/* AESTHETIC */}
                  {activeStep === 'aesthetic' && (
                    <motion.div key="aesthetic" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                       <div className="space-y-2 border-b border-black/5 dark:border-white/5 pb-4">
                          <h3 className="font-serif text-3xl italic tracking-tighter leading-none">Visual Core.</h3>
                          <p className="font-sans text-[8px] uppercase tracking-widest text-stone-400">DEFINE THE PHYSICS OF YOUR WORLD.</p>
                       </div>

                       <FieldGroup label="Typographic DNA" description="Import from Google Fonts. Type specific font name to fetch and preview.">
                          <div className="grid grid-cols-2 gap-3 mb-6">
                             {availableFonts.map(font => (
                               <button 
                                 key={font.name}
                                 onClick={() => updateDraft({ typographyIntent: { ...draft.typographyIntent, styleDescription: font.name } })}
                                 className={`p-4 border text-left rounded-sm transition-all ${draft.typographyIntent?.styleDescription === font.name ? 'border-emerald-500 bg-emerald-50/5' : 'border-stone-200 dark:border-stone-800'}`}
                               >
                                  <span className="block font-sans text-[7px] uppercase tracking-widest text-stone-400 mb-1">{font.type}</span>
                                  <span className="text-xl" style={{ fontFamily: font.name }}>{font.name}</span>
                               </button>
                             ))}
                          </div>
                          
                          <div className="flex gap-2">
                             <input 
                               value={customFontInput} 
                               onChange={e => setCustomFontInput(e.target.value)} 
                               onKeyDown={e => e.key === 'Enter' && handleAddFont()}
                               placeholder="e.g. 'Cinzel' or 'Oswald'" 
                               className="flex-1 bg-transparent border-b border-stone-200 dark:border-stone-800 py-3 font-serif italic text-lg focus:outline-none placeholder:text-stone-300" 
                             />
                             <button onClick={handleAddFont} disabled={isFontLoading || !customFontInput.trim()} className="px-6 py-2 bg-stone-100 dark:bg-stone-800 rounded-full font-sans text-[9px] uppercase tracking-widest font-black hover:bg-stone-200 dark:hover:bg-stone-700 flex items-center gap-2">
                                {isFontLoading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                                Fetch Font
                             </button>
                          </div>
                          <p className="font-serif italic text-xs text-stone-400 mt-2">Mimi will inject the Google Font stylesheet immediately.</p>
                       </FieldGroup>

                       <FieldGroup label="Silhouettes">
                          <PresetStrip 
                            options={SILHOUETTE_OPTIONS} 
                            current={draft.aestheticCore.silhouettes} 
                            onSelect={(val) => toggleOption('silhouettes', val)} 
                            onAddCustom={(val) => addCustomOption('silhouettes', val)}
                            customPlaceholder="Add custom silhouette..."
                          />
                       </FieldGroup>
                       <FieldGroup label="Textures">
                          <PresetStrip 
                            options={TEXTURE_OPTIONS} 
                            current={draft.aestheticCore.textures} 
                            onSelect={(val) => toggleOption('textures', val)} 
                            onAddCustom={(val) => addCustomOption('textures', val)}
                            customPlaceholder="Add custom texture..."
                          />
                       </FieldGroup>
                       <FieldGroup label="Era Focus">
                          <PresetStrip 
                            options={ERA_OPTIONS} 
                            current={draft.aestheticCore.eraFocus} 
                            onSelect={(val) => toggleOption('eraFocus', val)} 
                            onAddCustom={(val) => addCustomOption('eraFocus', val)}
                            customPlaceholder="Add custom era..."
                          />
                       </FieldGroup>
                    </motion.div>
                  )}

                  {/* CHROMATIC */}
                  {activeStep === 'chromatic' && (
                    <motion.div key="chromatic" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                       <div className="space-y-2 border-b border-black/5 dark:border-white/5 pb-4">
                          <h3 className="font-serif text-3xl italic tracking-tighter leading-none">Chromatic Registry.</h3>
                          <p className="font-sans text-[8px] uppercase tracking-widest text-stone-400">THE COLOR LOGIC OF YOUR UNIVERSE.</p>
                       </div>

                       <FieldGroup label="Primary Palette" description="Define the core signals.">
                          <div className="flex flex-wrap gap-4 mb-6">
                             {draft.chromaticRegistry?.primaryPalette?.map((c, i) => (
                                <div key={i} className="group relative">
                                   <div className="w-16 h-16 rounded-sm shadow-sm border border-stone-100 dark:border-stone-800" style={{ backgroundColor: c.hex }} />
                                   <span className="block mt-2 font-mono text-[9px] text-center text-stone-500 uppercase">{c.name}</span>
                                   <button onClick={() => removeColor(c.hex)} className="absolute -top-2 -right-2 bg-white text-red-500 rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} /></button>
                                </div>
                             ))}
                          </div>
                          
                          <div className="flex gap-4 items-end bg-stone-50 dark:bg-stone-900 p-4 rounded-sm border border-stone-100 dark:border-stone-800">
                             <div className="space-y-2">
                                <label className="font-sans text-[7px] uppercase tracking-widest text-stone-400 font-black">Color</label>
                                <input type="color" value={newColorHex} onChange={e => setNewColorHex(e.target.value)} className="h-10 w-full cursor-pointer bg-transparent" />
                             </div>
                             <div className="flex-1 space-y-2">
                                <label className="font-sans text-[7px] uppercase tracking-widest text-stone-400 font-black">Name</label>
                                <input type="text" value={newColorName} onChange={e => setNewColorName(e.target.value)} placeholder="e.g. Electric Moss" className="w-full bg-transparent border-b border-stone-200 dark:border-stone-700 py-2 font-serif italic focus:outline-none" />
                             </div>
                             <button onClick={addColorToPalette} disabled={!newColorName} className="px-4 py-2 bg-nous-text dark:bg-white text-white dark:text-black rounded-full font-sans text-[8px] uppercase tracking-widest font-black disabled:opacity-50">Add</button>
                          </div>
                       </FieldGroup>

                       <div className="grid grid-cols-2 gap-8">
                          <FieldGroup label="Base Neutral" description="Your silence.">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full border border-stone-200" style={{ backgroundColor: draft.chromaticRegistry?.baseNeutral || '#FDFBF7' }} />
                                <input type="text" value={draft.chromaticRegistry?.baseNeutral || ''} onChange={e => updateDraft({ chromaticRegistry: { ...draft.chromaticRegistry, baseNeutral: e.target.value } })} className="flex-1 bg-transparent border-b border-stone-200 dark:border-stone-800 py-2 font-mono text-sm" placeholder="#FDFBF7" />
                             </div>
                          </FieldGroup>
                          <FieldGroup label="Accent Signal" description="Your alert.">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full border border-stone-200" style={{ backgroundColor: draft.chromaticRegistry?.accentSignal || '#1C1917' }} />
                                <input type="text" value={draft.chromaticRegistry?.accentSignal || ''} onChange={e => updateDraft({ chromaticRegistry: { ...draft.chromaticRegistry, accentSignal: e.target.value } })} className="flex-1 bg-transparent border-b border-stone-200 dark:border-stone-800 py-2 font-mono text-sm" placeholder="#1C1917" />
                             </div>
                          </FieldGroup>
                       </div>
                    </motion.div>
                  )}

                  {/* VECTORS */}
                  {activeStep === 'vectors' && (
                    <motion.div key="vectors" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                       <div className="space-y-2 border-b border-black/5 dark:border-white/5 pb-4">
                          <h3 className="font-serif text-3xl italic tracking-tighter leading-none">Desire Vectors.</h3>
                          <p className="font-sans text-[8px] uppercase tracking-widest text-stone-400">WHERE IS THIS TASTE MOVING TOWARDS?</p>
                       </div>

                       <FieldGroup label="More Of" description="What frequency are you actively increasing?">
                          <textarea 
                             value={draft.desireVectors?.moreOf || ''} 
                             onChange={e => updateDesireVector('moreOf', e.target.value)} 
                             className="w-full bg-transparent border-b border-stone-200 dark:border-stone-800 py-3 font-serif italic text-xl focus:outline-none focus:border-emerald-500" 
                             placeholder="e.g. Silence, negative space, heavy textures..."
                          />
                       </FieldGroup>

                       <FieldGroup label="Less Of" description="What patterns are you shedding?">
                          <textarea 
                             value={draft.desireVectors?.lessOf || ''} 
                             onChange={e => updateDesireVector('lessOf', e.target.value)} 
                             className="w-full bg-transparent border-b border-stone-200 dark:border-stone-800 py-3 font-serif italic text-xl focus:outline-none focus:border-red-500" 
                             placeholder="e.g. Noise, clutter, cheap gradients..."
                          />
                       </FieldGroup>

                       <FieldGroup label="Experimenting With" description="The edge of your current comfort.">
                          <textarea 
                             value={draft.desireVectors?.experimentingWith || ''} 
                             onChange={e => updateDesireVector('experimentingWith', e.target.value)} 
                             className="w-full bg-transparent border-b border-stone-200 dark:border-stone-800 py-3 font-serif italic text-xl focus:outline-none focus:border-amber-500" 
                             placeholder="e.g. 3D renders, video essays, long-form..."
                          />
                       </FieldGroup>

                       <FieldGroup label="Fiscal Velocity / Budget" description="Define the resource intent for this aesthetic direction.">
                          <PresetStrip 
                             options={PRICE_POINTS} 
                             current={draft.desireVectors?.fiscalVelocity} 
                             onSelect={(val) => updateDesireVector('fiscalVelocity', val)} 
                          />
                          <input 
                             value={draft.desireVectors?.fiscalVelocity || ''} 
                             onChange={e => updateDesireVector('fiscalVelocity', e.target.value)} 
                             className="w-full bg-transparent border-b border-stone-200 dark:border-stone-800 py-3 mt-4 font-serif italic text-lg focus:outline-none focus:border-emerald-500 placeholder:text-stone-500" 
                             placeholder="Or define custom budget constraint..."
                          />
                       </FieldGroup>
                    </motion.div>
                  )}

                  {/* VOICE */}
                  {activeStep === 'voice' && (
                    <motion.div key="voice" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                       <div className="space-y-2 border-b border-black/5 dark:border-white/5 pb-4">
                          <h3 className="font-serif text-3xl italic tracking-tighter leading-none">Narrative Voice.</h3>
                          <p className="font-sans text-[8px] uppercase tracking-widest text-stone-400">HOW DOES THIS MASK SPEAK?</p>
                       </div>

                       <FieldGroup label="Emotional Temperature">
                          <div className="flex flex-wrap gap-2 mb-3">
                             {EMOTIONAL_TEMPERATURES.map(t => (
                               <button 
                                 key={t}
                                 onClick={() => updateDraft({ narrativeVoice: { ...draft.narrativeVoice, emotionalTemperature: t } })}
                                 className={`px-4 py-2 border rounded-full font-sans text-[9px] uppercase tracking-widest font-black transition-all ${draft.narrativeVoice.emotionalTemperature === t ? 'bg-nous-text dark:bg-white text-white dark:text-stone-900 border-transparent' : 'border-stone-200 dark:border-stone-800 text-stone-400'}`}
                               >
                                 {t}
                               </button>
                             ))}
                          </div>
                       </FieldGroup>

                       <FieldGroup label="Sentence Structure">
                          <div className="flex flex-wrap gap-2 mb-3">
                             {SENTENCE_STRUCTURES.map(s => (
                               <button 
                                 key={s}
                                 onClick={() => updateDraft({ narrativeVoice: { ...draft.narrativeVoice, sentenceStructure: s } })}
                                 className={`px-4 py-2 border rounded-full font-sans text-[9px] uppercase tracking-widest font-black transition-all ${draft.narrativeVoice.sentenceStructure === s ? 'bg-nous-text dark:bg-white text-white dark:text-stone-900 border-transparent' : 'border-stone-200 dark:border-stone-800 text-stone-400'}`}
                               >
                                 {s}
                               </button>
                             ))}
                          </div>
                       </FieldGroup>

                       <FieldGroup label="Cultural Register">
                          <PresetStrip 
                             options={VOICE_REGISTERS} 
                             current={draft.narrativeVoice.culturalRegister} 
                             onSelect={(r) => toggleRegister(r)}
                             onAddCustom={(val) => {
                                const current = draft.narrativeVoice.culturalRegister || [];
                                if (!current.includes(val)) {
                                    updateDraft({ narrativeVoice: { ...draft.narrativeVoice, culturalRegister: [...current, val] } });
                                }
                             }}
                             customPlaceholder="Add custom voice register..."
                          />
                       </FieldGroup>
                    </motion.div>
                  )}

                  {/* VISUAL SHARDS */}
                  {activeStep === 'shards' && (
                    <motion.div key="shards" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                       <div className="space-y-2 border-b border-black/5 dark:border-white/5 pb-4">
                          <h3 className="font-serif text-3xl italic tracking-tighter leading-none">Visual Shards.</h3>
                          <p className="font-sans text-[8px] uppercase tracking-widest text-stone-400">UPLOAD REFERENCE IMAGES TO TRAIN THE ORACLE.</p>
                       </div>

                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {(draft.aestheticCore.visualShards || []).map((shard, idx) => (
                             <div key={idx} className="relative aspect-square bg-stone-50 dark:bg-stone-900 rounded-sm overflow-hidden group">
                                <img src={shard} className="w-full h-full object-cover" />
                                <button onClick={() => updateDraft({ aestheticCore: { ...draft.aestheticCore, visualShards: draft.aestheticCore.visualShards?.filter((_, i) => i !== idx) } })} className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                   <X size={12} />
                                </button>
                             </div>
                          ))}
                          <button onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-sm flex flex-col items-center justify-center gap-2 hover:border-emerald-500 transition-colors text-stone-400 hover:text-emerald-500">
                             <Upload size={24} />
                             <span className="font-sans text-[8px] uppercase tracking-widest font-black">Upload</span>
                          </button>
                       </div>
                       
                       {/* SHARD ANALYZER MODULE */}
                       <ShardAnalyzer shards={draft.aestheticCore.visualShards || []} draft={draft} />
                    </motion.div>
                  )}

                  {/* SETTINGS */}
                  {activeStep === 'settings' && (
                    <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                       <div className="space-y-2 border-b border-black/5 dark:border-white/5 pb-4">
                          <h3 className="font-serif text-3xl italic tracking-tighter leading-none">Mask Protocols.</h3>
                          <p className="font-sans text-[8px] uppercase tracking-widest text-stone-400">CONFIGURE IDENTITY & BILLING.</p>
                       </div>

                       <FieldGroup label="Identity Namespace">
                          <input 
                             value={personaName} 
                             onChange={e => setPersonaName(e.target.value)} 
                             className="w-full bg-transparent border-b border-black/5 dark:border-white/10 py-2 font-serif text-2xl italic focus:outline-none focus:border-emerald-500 transition-colors"
                             placeholder="Persona Name"
                          />
                       </FieldGroup>

                       <FieldGroup label="Sovereign API Key" description="Bind a specific billing account to this mask. Overrides global key.">
                          <div className="space-y-4">
                              <div className="flex items-center gap-2 text-stone-500">
                                  <Wallet size={14} />
                                  <span className="font-sans text-[9px] uppercase tracking-widest font-black">Google AI Studio Key</span>
                              </div>
                              <input 
                                 type="password" 
                                 value={personaKey} 
                                 onChange={e => setPersonaKey(e.target.value)} 
                                 className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 font-mono text-sm rounded-sm focus:outline-none focus:border-emerald-500"
                                 placeholder="AIza..."
                              />
                              <p className="font-serif italic text-xs text-stone-400">
                                 Leave empty to inherit the global sovereign key. 
                                 <a href="https://aistudio.google.com/app/apikey" target="_blank" className="ml-2 underline decoration-stone-500/50 hover:text-emerald-500">Get Key</a>
                              </p>
                          </div>
                       </FieldGroup>

                       <div className="pt-8">
                          <button 
                             onClick={handleUpdatePersonaSettings} 
                             disabled={isSaving}
                             className="px-8 py-4 bg-nous-text dark:bg-white text-white dark:text-black rounded-full font-sans text-[9px] uppercase tracking-widest font-black shadow-xl active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                          >
                             {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 
                             Commit Settings
                          </button>
                       </div>
                    </motion.div>
                  )}

               </AnimatePresence>
            </div>
          )}

          {/* SIDEBAR */}
          <div className="md:col-span-4 space-y-8 sticky top-32 h-fit">
             <div className="p-8 bg-stone-50 dark:bg-stone-900 rounded-sm border border-stone-100 dark:border-stone-800 space-y-6">
                <div className="flex items-center gap-3 text-emerald-500">
                   <Target size={18} />
                   <span className="font-sans text-[9px] uppercase tracking-widest font-black">Alignment Protocol</span>
                </div>
                <p className="font-serif italic text-sm text-stone-500 leading-relaxed">
                   Changes are local until aligned. Committing writes this logic to your active mask.
                </p>
                <div className="pt-4 flex flex-col gap-3">
                   <button onClick={handleAlign} disabled={isSaving} className="w-full py-4 bg-nous-text dark:bg-white text-white dark:text-black rounded-full font-sans text-[9px] uppercase tracking-[0.4em] font-black shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
                      {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Align Logic
                   </button>
                   <button onClick={handleScryDirectives} disabled={isAuditing} className="w-full py-4 border border-stone-200 dark:border-stone-700 text-stone-500 rounded-full font-sans text-[9px] uppercase tracking-[0.4em] font-black hover:text-nous-text dark:hover:text-white transition-all flex items-center justify-center gap-3">
                      {isAuditing ? <Loader2 size={14} className="animate-spin" /> : <Radar size={14} />} Scry Directives
                   </button>
                </div>
             </div>
          </div>
        </main>
      </div>

      <input type="file" ref={fileInputRef} onChange={handleShardUpload} className="hidden" multiple accept="image/*" />
      
      {/* AUDIT OVERLAY */}
      <AnimatePresence>
         {showAuditOverlay && auditReport && (
            <TailorAuditOverlay 
               auditReport={auditReport} 
               onClose={() => setShowAuditOverlay(false)} 
               onApplyToGeneration={(text) => console.log("Manifesto Applied:", text)} 
            />
         )}
      </AnimatePresence>
    </div>
  );
};
