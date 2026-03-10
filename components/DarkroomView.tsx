
// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../contexts/UserContext';
import { fetchPocketItems, updatePocketItem, addToPocket, createMoodboard, deleteFromPocket } from '../services/firebase';
import { getLocalPocket } from '../services/localArchive';
import { PocketItem, Treatment, AspectRatio, DarkroomLayer } from '../types';
import { FlaskConical, Image as ImageIcon, Zap, Sparkles, Loader2, X, Plus, Check, Wand2, Sliders, Layers, Trash2, Camera, Info, ShieldCheck, Maximize2, Download, Eye, ArrowRight, Save, Copy, Filter, Target, Briefcase, FolderPlus, Activity, Scissors, Eraser, PenTool, Upload, ChevronUp, ChevronDown, Monitor, GripVertical, EyeOff, Crop } from 'lucide-react';
import { applyTreatment, compressImage, generateRawImage, cropImage } from '../services/geminiService';
import { Visualizer } from './Visualizer';

const PRESET_TREATMENTS: Treatment[] = [
  { id: 'object_purge', name: 'Object Purge', instruction: 'Identify and remove distracting background objects or people while seamlessly reconstructing the background. Maintain high resolution.', variance: 'anchored' },
  { id: 'scotopic', name: 'Scotopic Depth', instruction: 'Deepen scotopic shadows and reduce overall temperature to cold mercury for a nocturnal feel.', variance: 'anchored' },
  { id: 'ethereal', name: 'Ethereal Bloom', instruction: 'Raise white point, add a soft bloom to highlights, and introduce a soft atmospheric glow.', variance: 'interpretive' },
  { id: 'editorial_94', name: 'Editorial 94', instruction: 'Slightly overexpose and add a magenta tint to shadows for a vintage editorial aesthetic.', variance: 'interpretive' },
  { id: 'brutalist', name: 'Brutalist Raw', instruction: 'Increase contrast, crush blacks, and convert to high-fidelity monochromatic silver seed.', variance: 'anchored' }
];

interface ControlsContentProps {
  customInstruction: string;
  setCustomInstruction: (val: string) => void;
  layerStack: DarkroomLayer[];
  updateLayer: (layerId: string, patch: Partial<DarkroomLayer>) => void;
  moveLayer: (index: number, direction: 'up' | 'down') => void;
  addLayerFromPreset: (t: Treatment) => void;
  removeLayer: (layerId: string) => void;
  isProcessing: boolean;
  handleBatchRefine: () => void;
  isSelectionMode: boolean;
  selectedCount: number;
  useFlatFlash: boolean;
  setUseFlatFlash: (val: boolean) => void;
  exposure: number;
  setExposure: (val: number) => void;
  grainAmount: number;
  setGrainAmount: (val: number) => void;
  semioticTension: number;
  setSemioticTension: (val: number) => void;
}

const ControlsContent: React.FC<ControlsContentProps> = ({
  customInstruction,
  setCustomInstruction,
  layerStack,
  updateLayer,
  moveLayer,
  addLayerFromPreset,
  removeLayer,
  isProcessing,
  handleBatchRefine,
  isSelectionMode,
  selectedCount,
  useFlatFlash,
  setUseFlatFlash,
  exposure,
  setExposure,
  grainAmount,
  setGrainAmount,
  semioticTension,
  setSemioticTension
}) => (
    <div className="flex flex-col h-full bg-[#080808]">
      <div className="p-8 space-y-10 flex-1 overflow-y-auto no-scrollbar">
         
         {/* NANO BANANA PRO 2 CONTROLS */}
         <div className="space-y-6">
            <span className="font-sans text-[9px] uppercase tracking-widest font-black text-emerald-500 flex items-center gap-2">
               <Sliders size={14} /> Global Adjustments
            </span>
            
            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-stone-900 border border-white/5 rounded-sm">
                    <div className="flex flex-col">
                        <span className="font-sans text-[9px] uppercase font-black text-white">Vogue Italia Filter</span>
                        <span className="font-mono text-[7px] text-stone-500 uppercase tracking-widest">Flat Flash & High Contrast</span>
                    </div>
                    <button 
                        onClick={() => setUseFlatFlash(!useFlatFlash)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${useFlatFlash ? 'bg-emerald-500' : 'bg-stone-700'}`}
                    >
                        <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-transform ${useFlatFlash ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                <div className="space-y-2 p-4 bg-stone-900 border border-white/5 rounded-sm">
                    <div className="flex justify-between items-center">
                        <span className="font-sans text-[7px] uppercase tracking-widest font-black text-stone-500">Exposure</span>
                        <span className="font-mono text-[8px] text-emerald-500">{exposure > 0 ? '+' : ''}{exposure}</span>
                    </div>
                    <input type="range" min="-100" max="100" value={exposure} onChange={(e) => setExposure(parseInt(e.target.value))} className="w-full accent-emerald-500 bg-stone-800 h-1 rounded-full cursor-pointer" />
                </div>

                <div className="space-y-2 p-4 bg-stone-900 border border-white/5 rounded-sm">
                    <div className="flex justify-between items-center">
                        <span className="font-sans text-[7px] uppercase tracking-widest font-black text-stone-500">Grain Amount</span>
                        <span className="font-mono text-[8px] text-emerald-500">{grainAmount}%</span>
                    </div>
                    <input type="range" min="0" max="100" value={grainAmount} onChange={(e) => setGrainAmount(parseInt(e.target.value))} className="w-full accent-emerald-500 bg-stone-800 h-1 rounded-full cursor-pointer" />
                </div>

                <div className="space-y-2 p-4 bg-stone-900 border border-white/5 rounded-sm">
                    <div className="flex justify-between items-center">
                        <span className="font-sans text-[7px] uppercase tracking-widest font-black text-stone-500">Semiotic Tension</span>
                        <span className="font-mono text-[8px] text-emerald-500">{semioticTension}%</span>
                    </div>
                    <input type="range" min="0" max="100" value={semioticTension} onChange={(e) => setSemioticTension(parseInt(e.target.value))} className="w-full accent-emerald-500 bg-stone-800 h-1 rounded-full cursor-pointer" />
                </div>
            </div>
         </div>

         {/* LAYER STACK */}
         <div className="space-y-6">
            <div className="flex justify-between items-center">
                <span className="font-sans text-[9px] uppercase tracking-widest font-black text-emerald-500 flex items-center gap-2">
                   <Layers size={14} /> Active Layers
                </span>
                <span className="font-mono text-[8px] text-stone-600 uppercase tracking-tighter">Stack_Order_v1.2</span>
            </div>
            
            <div className="space-y-3">
               <AnimatePresence>
                  {layerStack.map((l, i) => (
                    <motion.div 
                      key={l.layerId} 
                      layout
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`flex flex-col p-4 bg-stone-900 border transition-all rounded-sm ${l.isVisible ? 'border-emerald-500/30' : 'border-white/5 opacity-50'}`}
                    >
                       <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                             <div className="flex flex-col gap-1">
                                <button onClick={() => moveLayer(i, 'up')} disabled={i === 0} className="p-1 hover:text-emerald-400 disabled:opacity-20 transition-colors"><ChevronUp size={12}/></button>
                                <button onClick={() => moveLayer(i, 'down')} disabled={i === layerStack.length - 1} className="p-1 hover:text-emerald-400 disabled:opacity-20 transition-colors"><ChevronDown size={12}/></button>
                             </div>
                             <div className="flex flex-col">
                                <span className="font-sans text-[9px] uppercase font-black text-white">{l.name}</span>
                                <span className="font-mono text-[7px] text-stone-500 uppercase tracking-widest">L_0{i+1}</span>
                             </div>
                          </div>
                          <div className="flex items-center gap-2">
                             <button onClick={() => updateLayer(l.layerId, { isVisible: !l.isVisible })} className="p-2 text-stone-500 hover:text-emerald-400 transition-colors">
                                {l.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                             </button>
                             <button onClick={() => removeLayer(l.layerId)} className="p-2 text-stone-500 hover:text-red-400 transition-colors">
                                <Trash2 size={14} />
                             </button>
                          </div>
                       </div>

                       <div className="space-y-2">
                          <div className="flex justify-between items-center">
                             <span className="font-sans text-[7px] uppercase tracking-widest font-black text-stone-500">Opacity</span>
                             <span className="font-mono text-[8px] text-emerald-500">{l.opacity}%</span>
                          </div>
                          <input 
                            type="range" 
                            id={`layer-opacity-${l.layerId}`}
                            name={`layer-opacity-${l.layerId}`}
                            min="0" 
                            max="100" 
                            value={l.opacity} 
                            onChange={(e) => updateLayer(l.layerId, { opacity: parseInt(e.target.value) })}
                            className="w-full accent-emerald-500 bg-stone-800 h-1 rounded-full cursor-pointer"
                          />
                       </div>
                    </motion.div>
                  ))}
               </AnimatePresence>
               {layerStack.length === 0 && (
                 <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-sm opacity-30 gap-3">
                    <Layers size={24} />
                    <p className="font-serif italic text-xs">“Stack is currently void.”</p>
                 </div>
               )}
            </div>
         </div>

         <div className="space-y-4">
            <span className="font-sans text-[9px] uppercase tracking-widest font-black text-emerald-500 flex items-center gap-2">
               <PenTool size={14} /> Final Pass Mandate
            </span>
            <div className="space-y-3">
               <textarea 
                  id="customInstruction"
                  name="customInstruction"
                  value={customInstruction}
                  onChange={e => setCustomInstruction(e.target.value)}
                  placeholder="Global phantom logic applied atop stack (e.g. Add film grain)..."
                  className="w-full bg-black/40 border border-white/10 p-4 font-serif italic text-base text-stone-300 focus:outline-none focus:border-emerald-500/50 resize-none h-24 rounded-sm placeholder:text-stone-700"
               />
            </div>
         </div>

         <div className="space-y-4 pb-20">
            <span className="font-sans text-[7px] uppercase tracking-widest font-black text-stone-500 flex items-center gap-2">
               <Zap size={12} /> Logic Registry
            </span>
            <div className="grid grid-cols-1 gap-2">
               {PRESET_TREATMENTS.map(t => (
                  <button 
                    key={t.id} 
                    onClick={() => addLayerFromPreset(t)}
                    className="text-left p-4 rounded-sm border border-white/5 bg-black/40 text-stone-500 hover:border-emerald-500/30 hover:text-white transition-all flex items-center justify-between group"
                  >
                     <div className="flex items-center gap-3">
                        {t.id === 'object_purge' ? <Eraser size={14} /> : <Zap size={14} />}
                        <span className="font-sans text-[9px] uppercase tracking-widest font-black">{t.name}</span>
                     </div>
                     <Plus size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
               ))}
            </div>
         </div>
      </div>

      <div className="p-8 border-t border-white/5 space-y-6 bg-black/40 shrink-0 backdrop-blur-md">
         <button 
            onClick={handleBatchRefine}
            disabled={isProcessing || (layerStack.filter(l => l.isVisible).length === 0 && !customInstruction.trim()) || (isSelectionMode && selectedCount === 0)}
            className="w-full py-6 bg-white text-black rounded-full font-sans text-[10px] tracking-[0.4em] uppercase font-black shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-20 hover:bg-emerald-400"
         >
            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            Execute Stack
         </button>
         <div className="flex justify-between items-center">
            <span className="font-mono text-[7px] uppercase tracking-widest text-stone-500">Refraction_Engine_v4</span>
            <p className="font-serif italic text-[11px] text-stone-500">{layerStack.filter(l => l.isVisible).length} Layers Active</p>
         </div>
      </div>
    </div>
);

const CropEditor: React.FC<{ imageUrl: string; onCancel: () => void; onSave: (croppedBase64: string) => void }> = ({ imageUrl, onCancel, onSave }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [crop, setCrop] = useState({ x: 10, y: 10, width: 80, height: 80 }); // Percentages
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragAction, setDragAction] = useState<'move' | 'se' | null>(null);
  const [startCrop, setStartCrop] = useState({ ...crop });

  const handlePointerDown = (e: React.PointerEvent, action: 'move' | 'se') => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragAction(action);
    setDragStart({ x: e.clientX, y: e.clientY });
    setStartCrop({ ...crop });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;

    let newCrop = { ...startCrop };

    if (dragAction === 'move') {
      newCrop.x = Math.max(0, Math.min(100 - newCrop.width, startCrop.x + deltaX));
      newCrop.y = Math.max(0, Math.min(100 - newCrop.height, startCrop.y + deltaY));
    } else if (dragAction === 'se') {
      newCrop.width = Math.max(10, Math.min(100 - newCrop.x, startCrop.width + deltaX));
      newCrop.height = Math.max(10, Math.min(100 - newCrop.y, startCrop.height + deltaY));
    }

    setCrop(newCrop);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setDragAction(null);
  };

  const performCrop = async () => {
    if (!imgRef.current) return;
    const naturalWidth = imgRef.current.naturalWidth;
    const naturalHeight = imgRef.current.naturalHeight;
    
    const pixelCrop = {
        x: (crop.x / 100) * naturalWidth,
        y: (crop.y / 100) * naturalHeight,
        width: (crop.width / 100) * naturalWidth,
        height: (crop.height / 100) * naturalHeight
    };
    
    try {
        const cropped = await cropImage(imageUrl, pixelCrop);
        // Ensure we send back only the base64 part if it has a header, 
        // though updatePocketItem usually handles full data URLs.
        // Let's send full data URL for display consistency.
        onSave(cropped);
    } catch (e) {
        console.error("Crop failed", e);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black/90 z-50 p-4" onPointerUp={handlePointerUp} onPointerMove={handlePointerMove}>
        <div className="relative" ref={containerRef}>
            <img ref={imgRef} src={imageUrl} className="max-w-full max-h-[80vh] pointer-events-none select-none" />
            <div 
                className="absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] cursor-move"
                style={{ left: `${crop.x}%`, top: `${crop.y}%`, width: `${crop.width}%`, height: `${crop.height}%` }}
                onPointerDown={(e) => handlePointerDown(e, 'move')}
            >
                {/* Grid lines */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-50">
                    <div className="border-r border-b border-white/30" /><div className="border-r border-b border-white/30" /><div className="border-b border-white/30" />
                    <div className="border-r border-b border-white/30" /><div className="border-r border-b border-white/30" /><div className="border-b border-white/30" />
                    <div className="border-r border-white/30" /><div className="border-r border-white/30" /><div />
                </div>
                
                {/* Resize Handle (SE) */}
                <div 
                    className="absolute -bottom-3 -right-3 w-6 h-6 bg-emerald-500 rounded-full cursor-se-resize flex items-center justify-center shadow-lg border-2 border-white pointer-events-auto"
                    onPointerDown={(e) => handlePointerDown(e, 'se')}
                >
                    <Maximize2 size={12} className="text-white" />
                </div>
            </div>
        </div>
        
        <div className="flex gap-4 mt-6">
            <button onClick={onCancel} className="px-6 py-2 rounded-full border border-stone-700 text-stone-300 hover:text-white font-sans text-[9px] uppercase tracking-widest font-black">Cancel</button>
            <button onClick={performCrop} className="px-8 py-2 rounded-full bg-emerald-500 text-white font-sans text-[9px] uppercase tracking-widest font-black shadow-lg hover:bg-emerald-400 flex items-center gap-2">
                <Check size={14} /> Apply Crop
            </button>
        </div>
    </div>
  );
};

export const DarkroomView: React.FC<{ initialShard?: PocketItem }> = ({ initialShard }) => {
  const { user, profile, hasApiKey, openKeySelector } = useUser();
  const [shards, setShards] = useState<PocketItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentlyProcessingId, setCurrentlyProcessingId] = useState<string | null>(null);
  const [layerStack, setLayerStack] = useState<DarkroomLayer[]>([]);
  const [customInstruction, setCustomInstruction] = useState('');
  const [activeShard, setActiveShard] = useState<PocketItem | null>(null);
  
  const [showManifestModal, setShowManifestModal] = useState(false);
  const [manifestPrompt, setManifestPrompt] = useState('');
  const [manifestAr, setManifestAr] = useState<AspectRatio>('1:1');
  const [isManifesting, setIsManifesting] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  
  const [showMobileControls, setShowMobileControls] = useState(false);
  
  const [isNanoPro2, setIsNanoPro2] = useState(true);
  const [useFlatFlash, setUseFlatFlash] = useState(false);
  const [exposure, setExposure] = useState(0);
  const [semioticTension, setSemioticTension] = useState(50);
  const [grainAmount, setGrainAmount] = useState(0);

  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTags, setEditTags] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadShards = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const localData = await getLocalPocket() || [];
      let cloudData: PocketItem[] = [];
      if (user && !user.isAnonymous) cloudData = await fetchPocketItems(user.uid) || [];
      
      const registry = new Map();
      localData.forEach(item => { if (item?.id) registry.set(item.id, item); });
      cloudData.forEach(item => { if (item?.id) registry.set(item.id, item); });
      
      setShards(Array.from(registry.values()).filter(i => i.type === 'image').sort((a,b) => b.savedAt - a.savedAt));
    } catch (e) {
        console.error("Darkroom Hydration Failure:", e);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadShards(); }, [user]);

  // Handle immediate activation if initialized with a shard
  useEffect(() => {
      if (initialShard) {
          setActiveShard(initialShard);
      }
  }, [initialShard]);

  useEffect(() => {
    if (activeShard) {
      setEditTitle(activeShard.content.title || activeShard.content.prompt || '');
      setEditDescription(activeShard.content.description || '');
      setEditTags((activeShard.content.tags || []).join(', '));
      setIsEditingMetadata(false);
    }
  }, [activeShard]);

  const handleSaveMetadata = async () => {
    if (!activeShard) return;
    setIsProcessing(true);
    try {
      const tagsArray = editTags.split(',').map(t => t.trim()).filter(Boolean);
      const updatedContent = {
        ...activeShard.content,
        title: editTitle,
        description: editDescription,
        tags: tagsArray,
        prompt: editTitle || activeShard.content.prompt
      };
      
      await updatePocketItem(activeShard.id, { content: updatedContent });
      
      setActiveShard(prev => prev ? { ...prev, content: updatedContent } : null);
      await loadShards(true);
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Metadata Updated.", icon: <Check size={14} /> } }));
      setIsEditingMetadata(false);
    } catch (e) {
      console.error("Failed to save metadata", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSelection = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isSelectionMode) {
        const item = shards.find(s => s.id === id);
        if (item) setActiveShard(item);
        return;
    }
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addLayerFromPreset = (t: Treatment) => {
    const newLayer: DarkroomLayer = {
        ...t,
        layerId: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        opacity: 100,
        isVisible: true
    };
    setLayerStack(prev => [...prev, newLayer]);
    window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: `Added Layer: ${t.name}`, icon: <Plus size={14} /> } }));
  };

  const updateLayer = (layerId: string, patch: Partial<DarkroomLayer>) => {
    setLayerStack(prev => prev.map(l => l.layerId === layerId ? { ...l, ...patch } : l));
  };

  const moveLayer = (index: number, direction: 'up' | 'down') => {
    setLayerStack(prev => {
        const next = [...prev];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= next.length) return prev;
        [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
        return next;
    });
  };

  const removeLayer = (layerId: string) => {
    setLayerStack(prev => prev.filter(l => l.layerId !== layerId));
  };

  const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    try {
      for (const file of Array.from(files)) {
        const reader = new FileReader();
        const base64 = await new Promise((resolve) => {
          reader.onload = async (ev) => {
             const raw = ev.target?.result as string;
             const compressed = await compressImage(raw);
             resolve(compressed);
          };
          reader.readAsDataURL(file);
        });
        await addToPocket(user?.uid || 'ghost', 'image', {
          imageUrl: base64,
          prompt: file.name,
          timestamp: Date.now()
        });
      }
      await loadShards(true);
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Assets Injected to Lab.", icon: <ImageIcon size={14} /> } }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleManifestShard = async () => {
    if (!manifestPrompt.trim() || isManifesting) return;
    
    if (!hasApiKey) {
        try {
            await openKeySelector();
        } catch (e) {
            console.error("Key selection failed:", e);
            return;
        }
    }

    setIsManifesting(true);
    try {
        const base64Image = await generateRawImage(manifestPrompt, manifestAr, profile);
        await addToPocket(user?.uid || 'ghost', 'image', {
            imageUrl: base64Image,
            prompt: manifestPrompt,
            timestamp: Date.now(),
            origin: 'Darkroom_Manifest',
            aspectRatio: manifestAr
        });
        await loadShards(true);
        setShowManifestModal(false);
        setManifestPrompt('');
        window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Shard Manifested Ex Nihilo.", icon: <Sparkles size={14} className="text-emerald-500" /> } }));
    } catch (e) {
        console.error("Manifestation Failed:", e);
    } finally {
        setIsManifesting(false);
    }
  };

  const handleUrlUpload = async () => {
    if (!imageUrlInput.trim() || isProcessing) return;
    setIsProcessing(true);
    try {
        // We add it directly as a URL. 
        // Note: Some URLs might fail due to CORS if we try to process them later, 
        // but for now we just inject it into the pocket.
        await addToPocket(user?.uid || 'ghost', 'image', {
            imageUrl: imageUrlInput,
            prompt: "External Shard",
            timestamp: Date.now(),
            origin: 'URL_Injection'
        });
        await loadShards(true);
        setShowUrlModal(false);
        setImageUrlInput('');
        window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "External Shard Injected.", icon: <ImageIcon size={14} /> } }));
    } catch (e) {
        console.error("URL Injection Failed:", e);
        window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Injection Failed.", type: 'error' } }));
    } finally {
        setIsProcessing(false);
    }
  };

  const handleBatchRefine = async () => {
    const activeLayers = layerStack.filter(l => l.isVisible && l.opacity > 0);
    if ((activeLayers.length === 0 && !customInstruction.trim() && !useFlatFlash && exposure === 0 && semioticTension === 50) || (isSelectionMode && selectedIds.size === 0) || (!isSelectionMode && !activeShard)) return;
    
    setIsProcessing(true);
    const targets = isSelectionMode ? shards.filter(s => selectedIds.has(s.id)) : [activeShard];
    
    // Compose the full weighted stack instruction
    const layerInstructions = activeLayers.map((l, i) => {
        let intensity = '';
        if (l.opacity < 30) intensity = 'subtly and faintly ';
        else if (l.opacity < 70) intensity = 'moderately ';
        else if (l.opacity < 95) intensity = 'strongly ';
        return `Pass ${i+1}: ${intensity}${l.instruction}`;
    }).join(". ");

    const fullInstruction = [
        "Aesthetic Composite Sequence:",
        layerInstructions, 
        useFlatFlash ? "Apply Vogue Italia 1990s flat flash lighting, high contrast, sharp shadows." : "",
        `Exposure Adjustment: ${exposure}%. Semiotic Tension (Surrealism/Edge): ${semioticTension}%.`,
        customInstruction ? `Final Global Treatment: ${customInstruction}` : ''
    ].filter(i => i.trim()).join(". ");

    const signature = [activeLayers.map(l => l.name).join("+"), customInstruction.slice(0, 10)].filter(i => i.trim()).join(" // ");

    try {
      for (const shard of targets) {
        setCurrentlyProcessingId(shard.id);
        const dataUrl = shard.content.imageUrl;
        const [header, base64] = dataUrl.split(',');
        if (!base64) continue;
        
        const manifestedUrl = await applyTreatment(base64, fullInstruction, profile, isNanoPro2);
        await addToPocket(user?.uid || 'ghost', 'image', {
          ...shard.content,
          imageUrl: manifestedUrl,
          notes: `Multi-Layer Refraction: ${signature}. ${shard.notes || ''}`,
          parentShardId: shard.id,
          treatmentApplied: 'layered_stack_v2',
          timestamp: Date.now()
        });
      }
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Layer composite successful.", icon: <Sparkles size={14} /> } }));
      await loadShards(true);
      setSelectedIds(new Set());
      setActiveShard(null);
      setShowMobileControls(false);
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes('overloaded') || e.code === 'QUOTA_EXCEEDED') {
          window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
              detail: { message: "Oracle Overloaded. Frequency too high.", icon: <ShieldAlert size={14} className="text-red-500" /> } 
          }));
      } else {
          window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Processing Dissonance.", type: 'error' } }));
      }
    } finally {
      setIsProcessing(false);
      setCurrentlyProcessingId(null);
    }
  };

  const handleCropSave = async (newBase64: string) => {
      if (!activeShard) return;
      setIsProcessing(true);
      setIsCropping(false);
      try {
          await updatePocketItem(activeShard.id, {
              content: {
                  ...activeShard.content,
                  imageUrl: newBase64
              }
          });
          // Optimistically update local active shard
          setActiveShard(prev => prev ? ({ ...prev, content: { ...prev.content, imageUrl: newBase64 } }) : null);
          await loadShards(true);
          window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Crop Applied.", icon: <Crop size={14} /> } }));
      } catch(e) {
          console.error("Save failed", e);
      } finally {
          setIsProcessing(false);
      }
  };

  const downloadShard = (url: string, id: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `Mimi_Darkroom_Artifact_${id.slice(-4)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const controlsProps = {
    customInstruction,
    setCustomInstruction,
    layerStack,
    updateLayer,
    moveLayer,
    addLayerFromPreset,
    removeLayer,
    isProcessing,
    handleBatchRefine,
    isSelectionMode,
    selectedCount: isSelectionMode ? selectedIds.size : (activeShard ? 1 : 0),
    useFlatFlash,
    setUseFlatFlash,
    grainAmount,
    setGrainAmount,
    exposure,
    setExposure,
    semioticTension,
    setSemioticTension
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] text-white transition-all duration-1000 relative selection:bg-white selection:text-black overflow-hidden">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/5 pb-8 pt-12 md:pt-16 px-6 md:px-16 gap-8 shrink-0 z-10 bg-[#050505]">
           <div className="space-y-4">
              <div className="flex items-center gap-4 text-emerald-500">
                 <FlaskConical size={18} className="animate-pulse" />
                 <span className="font-sans text-[10px] uppercase tracking-[0.5em] font-black italic">Vibe Lab // Edit Chamber</span>
              </div>
              <h2 className="font-serif text-5xl md:text-7xl italic tracking-tighter text-white leading-none">Darkroom.</h2>
           </div>
           <div className="flex gap-4 overflow-x-auto no-scrollbar w-full md:w-auto pb-2 md:pb-0 snap-x">
              <input type="file" id="darkroomUpload" name="darkroomUpload" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleManualUpload} />
              
              <button onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedIds(new Set()); }} className={`shrink-0 px-6 py-3 border rounded-full font-sans text-[9px] uppercase tracking-widest font-black transition-all flex items-center gap-3 snap-start ${isSelectionMode ? 'bg-emerald-500 text-white border-emerald-400' : 'border-white/10 text-stone-400 hover:text-white'}`}>
                <Filter size={14} />
                {isSelectionMode ? 'Exit Batch' : 'Batch Protocol'}
              </button>

              <button onClick={() => setShowManifestModal(true)} disabled={isProcessing} className="shrink-0 px-8 py-3 bg-stone-900 border border-white/10 text-white rounded-full font-sans text-[9px] uppercase tracking-widest font-black flex items-center gap-3 shadow-xl active:scale-95 transition-all hover:bg-stone-800 snap-start">
                 <Sparkles size={14} className="text-emerald-500" /> Manifest Shard
              </button>

              <button onClick={() => setShowUrlModal(true)} disabled={isProcessing} className="shrink-0 px-8 py-3 bg-stone-900 border border-white/10 text-white rounded-full font-sans text-[9px] uppercase tracking-widest font-black flex items-center gap-3 shadow-xl active:scale-95 transition-all hover:bg-stone-800 snap-start">
                 <ImageIcon size={14} className="text-indigo-400" /> Inject URL
              </button>

              <button onClick={() => fileInputRef.current?.click()} disabled={isProcessing} className="shrink-0 px-8 py-3 bg-white text-black rounded-full font-sans text-[9px] uppercase tracking-widest font-black flex items-center gap-3 shadow-xl active:scale-95 transition-all disabled:opacity-50 snap-start">
                 {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Inject Shard
              </button>
           </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative z-10">
           <div className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-16 pb-32 md:pb-32">
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8">
                 {shards.map(shard => (
                   <motion.div key={shard.id} layout className={`group relative bg-stone-900 p-1 border transition-all cursor-pointer ${selectedIds.has(shard.id) ? 'border-emerald-500 ring-4 ring-emerald-500/10 scale-[1.02] shadow-2xl' : 'border-white/5'}`} onClick={() => toggleSelection(shard.id)}>
                      <div className="relative aspect-[3/4] overflow-hidden">
                        <img src={shard.content.imageUrl} className={`w-full h-full object-cover transition-all duration-[2s] group-hover:scale-105 ${currentlyProcessingId === shard.id ? 'blur-xl grayscale' : 'grayscale group-hover:grayscale-0'}`} />
                        {isSelectionMode && (
                          <div className="absolute top-4 left-4 z-20">
                             <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedIds.has(shard.id) ? 'bg-emerald-500 border-emerald-400' : 'bg-black/40 border-white/20'}`}>
                                {selectedIds.has(shard.id) && <Check size={14} className="text-white" />}
                             </div>
                          </div>
                        )}
                        {currentlyProcessingId === shard.id && (
                          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/40">
                             <Loader2 size={32} className="animate-spin text-emerald-400 mb-2" />
                             <span className="font-sans text-[7px] uppercase tracking-[0.5em] font-black">Refracting Stack...</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all duration-700" />
                      </div>
                   </motion.div>
                 ))}
                 {shards.length === 0 && !loading && (
                   <div 
                        className="col-span-full py-48 text-center opacity-30 space-y-8 border-2 border-dashed border-white/10 rounded-sm cursor-pointer hover:opacity-100 hover:border-emerald-500/50 transition-all group"
                        onClick={() => fileInputRef.current?.click()}
                   >
                      <ImageIcon size={64} className="mx-auto text-stone-500 group-hover:text-emerald-500 transition-colors" />
                      <div className="space-y-2">
                          <p className="font-serif italic text-3xl text-stone-400 group-hover:text-white transition-colors">“Lab is dormant.”</p>
                          <p className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-600 group-hover:text-emerald-500 transition-colors">Drag Debris Here to Initialize</p>
                      </div>
                   </div>
                 )}
              </div>
           </div>

           <aside className="hidden lg:flex w-[460px] border-l border-white/5 h-full shrink-0 flex-col shadow-[-40px_0_100px_rgba(0,0,0,0.4)]">
              <ControlsContent {...controlsProps} />
           </aside>

           <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[9000]">
              <button onClick={() => setShowMobileControls(true)} disabled={selectedIds.size === 0 && !activeShard} className="px-8 py-3 bg-white text-black rounded-full font-sans text-[9px] uppercase tracking-widest font-black shadow-xl flex items-center gap-3 disabled:opacity-50 active:scale-95 transition-all">
                 <Layers size={14} /> Layers ({isSelectionMode ? selectedIds.size : (activeShard ? 1 : 0)})
              </button>
           </div>

           <AnimatePresence>
             {showMobileControls && (
               <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="lg:hidden fixed inset-x-0 bottom-0 z-[10000] bg-stone-950 border-t border-white/10 rounded-t-3xl max-h-[80vh] overflow-y-auto shadow-2xl">
                  <div className="sticky top-0 bg-stone-950/90 backdrop-blur-md p-4 flex justify-center border-b border-white/5 z-10" onClick={() => setShowMobileControls(false)}>
                     <div className="w-12 h-1 bg-white/20 rounded-full" />
                  </div>
                  <ControlsContent {...controlsProps} />
               </motion.div>
             )}
           </AnimatePresence>
      </div>

      <AnimatePresence>
        {activeShard && !isSelectionMode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[7000] flex items-center justify-center p-4 md:p-12 bg-black/98 backdrop-blur-2xl">
             <button onClick={() => { setActiveShard(null); setIsCropping(false); }} className="absolute top-10 right-10 p-4 text-white/40 hover:text-red-500 transition-all z-[6001]"><X size={32} /></button>
             <div className="w-full max-w-7xl h-full flex flex-col md:flex-row items-center gap-12 pt-12">
                <div className="flex-1 w-full h-full flex items-center justify-center overflow-hidden">
                   {isCropping ? (
                       <CropEditor imageUrl={activeShard.content.imageUrl} onCancel={() => setIsCropping(false)} onSave={handleCropSave} />
                   ) : (
                       <Visualizer prompt={activeShard.content.prompt || "Lab Shard"} initialImage={activeShard.content.imageUrl} defaultAspectRatio={activeShard.content.aspectRatio || '3:4'} isArtifact />
                   )}
                </div>
                <div className="hidden md:flex md:w-[320px] flex-col gap-10 shrink-0">
                   <div className="space-y-4">
                      <div className="flex justify-between items-center">
                          <span className="font-sans text-[10px] uppercase tracking-[0.4em] text-emerald-500 font-black">Archive Manifest</span>
                          {!isEditingMetadata && (
                              <button onClick={() => setIsEditingMetadata(true)} className="text-stone-500 hover:text-emerald-500 transition-colors">
                                  <PenTool size={14} />
                              </button>
                          )}
                      </div>
                      
                      {isEditingMetadata ? (
                          <div className="space-y-4">
                              <input 
                                  type="text" 
                                  value={editTitle} 
                                  onChange={e => setEditTitle(e.target.value)} 
                                  placeholder="Title..." 
                                  className="w-full bg-black/40 border border-white/10 p-3 font-serif italic text-2xl text-white focus:outline-none focus:border-emerald-500 rounded-sm"
                              />
                              <textarea 
                                  value={editDescription} 
                                  onChange={e => setEditDescription(e.target.value)} 
                                  placeholder="Description..." 
                                  className="w-full bg-black/40 border border-white/10 p-3 font-sans text-xs text-stone-300 focus:outline-none focus:border-emerald-500 rounded-sm h-24 resize-none"
                              />
                              <input 
                                  type="text" 
                                  value={editTags} 
                                  onChange={e => setEditTags(e.target.value)} 
                                  placeholder="Tags (comma separated)..." 
                                  className="w-full bg-black/40 border border-white/10 p-3 font-mono text-[10px] text-stone-400 focus:outline-none focus:border-emerald-500 rounded-sm"
                              />
                              <div className="flex gap-2 pt-2">
                                  <button onClick={() => setIsEditingMetadata(false)} className="flex-1 py-2 border border-stone-700 text-stone-300 rounded-sm font-sans text-[9px] uppercase tracking-widest font-black hover:bg-stone-800">Cancel</button>
                                  <button onClick={handleSaveMetadata} disabled={isProcessing} className="flex-1 py-2 bg-emerald-600 text-white rounded-sm font-sans text-[9px] uppercase tracking-widest font-black hover:bg-emerald-500 flex items-center justify-center gap-2">
                                      {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
                                  </button>
                              </div>
                          </div>
                      ) : (
                          <>
                              <h3 className="font-header text-5xl italic tracking-tighter text-white">{activeShard.content.title || 'Inspected.'}</h3>
                              <p className="font-serif italic text-xl text-stone-400">"{activeShard.content.prompt || 'Untitled shard'}"</p>
                              {activeShard.content.description && (
                                  <p className="font-sans text-sm text-stone-500">{activeShard.content.description}</p>
                              )}
                              {activeShard.content.tags && activeShard.content.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-2 pt-2">
                                      {activeShard.content.tags.map((tag: string, i: number) => (
                                          <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded-sm font-mono text-[9px] text-stone-400 uppercase tracking-widest">
                                              {tag}
                                          </span>
                                      ))}
                                  </div>
                              )}
                          </>
                      )}
                   </div>
                   <div className="space-y-6 pt-12 border-t border-white/5">
                      <button onClick={() => downloadShard(activeShard.content.imageUrl, activeShard.id)} className="flex items-center justify-center gap-3 py-5 bg-white text-black rounded-full font-sans text-[10px] uppercase tracking-[0.4em] font-black transition-all active:scale-95 w-full">
                         <Download size={16} /> Export Artifact
                      </button>
                      <button onClick={() => setIsCropping(true)} className="flex items-center justify-center gap-3 py-5 border border-stone-700 text-stone-300 hover:text-white rounded-full font-sans text-[10px] uppercase tracking-[0.4em] font-black transition-all active:scale-95 w-full">
                         <Crop size={16} /> Crop & Resize
                      </button>
                      <button onClick={handleBatchRefine} disabled={isProcessing || layerStack.filter(l => l.isVisible).length === 0} className="flex items-center justify-center gap-3 py-5 bg-emerald-600 text-white rounded-full font-sans text-[10px] uppercase tracking-[0.4em] font-black transition-all active:scale-95 w-full">
                         {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Apply Stack to Shard
                      </button>
                   </div>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showManifestModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[8000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-lg bg-stone-900 border border-white/10 p-10 rounded-sm shadow-2xl space-y-8 relative">
                    <button onClick={() => setShowManifestModal(false)} className="absolute top-6 right-6 text-stone-500 hover:text-white transition-colors"><X size={20}/></button>
                    
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-emerald-500">
                            <Sparkles size={18} className="animate-pulse" />
                            <span className="font-sans text-[9px] uppercase tracking-[0.5em] font-black">Manifestation Protocol</span>
                        </div>
                        <h3 className="font-header text-4xl italic tracking-tighter text-white">Ex Nihilo.</h3>
                        <p className="font-serif italic text-base text-stone-400">Generate visual form from latent intent.</p>
                    </div>

                    <div className="space-y-6">
                        <textarea 
                            id="manifestPrompt"
                            name="manifestPrompt"
                            value={manifestPrompt} 
                            onChange={e => setManifestPrompt(e.target.value)}
                            placeholder="Describe the hallucination..."
                            className="w-full bg-black/40 border border-white/10 p-6 font-serif italic text-xl focus:outline-none focus:border-emerald-500 transition-colors h-48 rounded-sm text-white placeholder:text-stone-700 resize-none"
                            autoFocus
                        />
                        
                        <div className="flex gap-2 justify-center">
                            {['1:1', '3:4', '4:3', '16:9'].map(ar => (
                                <button 
                                    key={ar}
                                    onClick={() => setManifestAr(ar as AspectRatio)}
                                    className={`px-4 py-2 border rounded-full font-sans text-[8px] uppercase tracking-widest font-black transition-all ${manifestAr === ar ? 'bg-white text-black border-white' : 'border-white/10 text-stone-500 hover:text-white'}`}
                                >
                                    {ar}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        onClick={handleManifestShard}
                        disabled={isManifesting || !manifestPrompt.trim()}
                        className="w-full py-6 bg-emerald-500 text-white rounded-full font-sans text-[10px] uppercase tracking-[0.4em] font-black shadow-xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {isManifesting ? <Loader2 size={16} className="animate-spin" /> : <Monitor size={16} />}
                        {isManifesting ? "Manifesting..." : "Execute Generation"}
                    </button>
                </motion.div>
            </motion.div>
        )}

        {showUrlModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[8000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-lg bg-stone-900 border border-white/10 p-10 rounded-sm shadow-2xl space-y-8 relative">
                    <button onClick={() => { setShowUrlModal(false); setImageUrlInput(''); }} className="absolute top-6 right-6 text-stone-500 hover:text-white transition-colors"><X size={20}/></button>
                    
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-indigo-400">
                            <ImageIcon size={18} />
                            <span className="font-sans text-[9px] uppercase tracking-[0.5em] font-black">URL Injection</span>
                        </div>
                        <h3 className="font-header text-4xl italic tracking-tighter text-white">External Source.</h3>
                        <p className="font-serif italic text-base text-stone-400">Import an artifact from the wider web.</p>
                    </div>

                    <div className="space-y-6">
                        <input 
                            type="url"
                            id="imageUrlInput"
                            name="imageUrlInput"
                            value={imageUrlInput} 
                            onChange={e => setImageUrlInput(e.target.value)}
                            placeholder="https://example.com/image.jpg"
                            className="w-full bg-black/40 border border-white/10 p-6 font-sans text-sm focus:outline-none focus:border-indigo-500 transition-colors rounded-sm text-white placeholder:text-stone-700"
                            autoFocus
                        />
                    </div>

                    <button 
                        onClick={handleUrlUpload}
                        disabled={isProcessing || !imageUrlInput.trim()}
                        className="w-full py-6 bg-indigo-600 text-white rounded-full font-sans text-[10px] uppercase tracking-[0.4em] font-black shadow-xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                        {isProcessing ? "Injecting..." : "Inject Shard"}
                    </button>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 border-t border-white/5 bg-black/80 backdrop-blur-md z-[5000] flex justify-between items-center lg:pr-[460px]">
          <div className="flex items-center gap-4">
              <span className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-500">Engine:</span>
              <div className="flex items-center gap-2">
                  <span className={`font-sans text-[9px] uppercase tracking-widest font-black transition-colors ${isNanoPro2 ? 'text-emerald-500' : 'text-stone-500'}`}>Nano Pro 2</span>
                  <button 
                      onClick={() => setIsNanoPro2(!isNanoPro2)}
                      className={`w-8 h-4 rounded-full relative transition-colors ${isNanoPro2 ? 'bg-emerald-500' : 'bg-stone-700'}`}
                  >
                      <div className={`w-2 h-2 bg-white rounded-full absolute top-1 transition-transform ${isNanoPro2 ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
              </div>
          </div>
          <span className="font-mono text-[8px] uppercase tracking-widest text-stone-600">Darkroom_v2.0</span>
      </footer>

      <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleManualUpload} />
    </div>
  );
};
