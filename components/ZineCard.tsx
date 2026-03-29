
// @ts-nocheck
import React, { useMemo, useState, useEffect } from 'react';
import { ZineMetadata, ToneTag } from '../types';
import { Activity, Sparkles, Eye, Radio, ShieldCheck, Bookmark, Check, Hash, ArrowUpRight, EyeOff, Edit2, Shuffle, RotateCcw, X } from 'lucide-react';
import { applyAestheticRefraction, generateZineImage } from '../services/geminiService';
import { motion } from 'framer-motion';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import { db } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const TONE_STYLES: Record<string, { 
 wrapper: string, border: string, text: string, accent: string, aspect: string, grainOpacity: string, overlayColor: string, dark: any
}> = {
 'Cinematic Witness': { 
 wrapper: 'bg', border: 'border-nous-border', text: 'text-nous-text', accent: 'text-nous-text0', aspect: 'aspect-video', grainOpacity: 'opacity-[0.08]', overlayColor: 'bg-white/70', 
 dark: { wrapper: 'bg', border: 'border-white/5', text: 'text', accent: 'text-nous-text0', overlayColor: 'bg-nous-base/80' } 
 },
 'Editorial Stillness': { 
 wrapper: 'bg', border: 'border-nous-border', text: 'text', accent: 'text', aspect: 'aspect-[3/4]', grainOpacity: 'opacity-[0.05]', overlayColor: 'bg/80', 
 dark: { wrapper: 'bg-black', border: 'border-white/10', text: 'text-nous-text', accent: 'text-nous-subtle', overlayColor: 'bg-black/90' } 
 },
 'chic': { 
 wrapper: 'bg', border: 'border-nous-border', text: 'text-nous-text', accent: 'text-nous-text0', aspect: 'aspect-[3/4]', grainOpacity: 'opacity-[0.05]', overlayColor: 'bg/80', 
 dark: { wrapper: 'bg', border: 'border-white/10', text: 'text-nous-text', accent: 'text-nous-text0', overlayColor: 'bg-black/90' } 
 },
 // ... (Other tones use defaults or mapped logic) ...
 'default': {
 wrapper: 'bg-white', border: 'border-nous-border', text: 'text-black', accent: 'text-nous-subtle', aspect: 'aspect-[3/4]', grainOpacity: 'opacity-[0.03]', overlayColor: 'bg-white/90',
 dark: { wrapper: 'bg-nous-base', border: 'border-white/10', text: 'text-white', accent: 'text-nous-text0', overlayColor: 'bg-black/80' }
 }
};

interface ZineCardProps {
 zine: ZineMetadata;
 onClick: () => void;
 currentUserId?: string;
 isSocialFloor?: boolean;
 isMasonry?: boolean; // NEW PROP
}

export const ZineCard: React.FC<ZineCardProps> = React.memo(({ zine, onClick, currentUserId, isSocialFloor, isMasonry }) => {
 const { profile, user } = useUser();
 const { currentPalette } = useTheme();
 const [isHovered, setIsHovered] = useState(false);
 const [isArchived, setIsArchived] = useState(false);
 const [isArchiving, setIsArchiving] = useState(false);
 const [showEditModal, setShowEditModal] = useState(false);
 const [editPrompt, setEditPrompt] = useState('');
 const [isEditing, setIsEditing] = useState(false);
 const [isRegenerating, setIsRegenerating] = useState(false);
 const [currentImageUrl, setCurrentImageUrl] = useState(zine.coverImageUrl || zine.content?.hero_image_url);

 const handleEdit = async () => {
 if (!currentImageUrl || !editPrompt || !user) return;
 setIsEditing(true);
 try {
 const newImage = await applyAestheticRefraction(currentImageUrl, editPrompt, profile);
 setCurrentImageUrl(newImage);
 setShowEditModal(false);
 setEditPrompt('');
 
 const { archiveManager } = await import('../services/archiveManager');
 const uploadedUrl = await archiveManager.uploadMedia(user.uid, newImage, `zine_artifacts/${zine.id}_${Date.now()}`);
 await updateDoc(doc(db, 'zines', zine.id), { coverImageUrl: uploadedUrl });
 
 window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
 detail: { message:"Artifact Refracted.", icon: <Sparkles size={14} /> } 
 }));
 } catch (err) {
 console.error("Edit Failed", err);
 } finally {
 setIsEditing(false);
 }
 };

 const handleRegenerate = async () => {
 if (!zine.content?.headlines?.[0] || !user) return;
 setIsRegenerating(true);
 try {
 const newImage = await generateZineImage(zine.content.headlines[0], '3:4', '1K', profile, false, undefined, undefined, zine.treatmentId);
 setCurrentImageUrl(newImage);
 
 const { archiveManager } = await import('../services/archiveManager');
 const uploadedUrl = await archiveManager.uploadMedia(user.uid, newImage, `zine_artifacts/${zine.id}_${Date.now()}`);
 await updateDoc(doc(db, 'zines', zine.id), { coverImageUrl: uploadedUrl });
 
 window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
 detail: { message:"Artifact Regenerated.", icon: <Sparkles size={14} /> } 
 }));
 } catch (err) {
 console.error("Regenerate Failed", err);
 } finally {
 setIsRegenerating(false);
 }
 };
 
 const baseStyles = TONE_STYLES[zine.tone] || TONE_STYLES['default'];

 const styles = useMemo(() => {
 if (currentPalette.isDark && baseStyles.dark) {
 return { ...baseStyles, ...baseStyles.dark };
 }
 return baseStyles;
 }, [currentPalette.isDark, baseStyles, zine.tone]);

 const headlineFont = profile?.tasteProfile?.dominant_archetypes?.[0] === 'brutalist-mono' ? 'font-mono' : 'font-serif';

 const handlePublishToggle = async (e: React.MouseEvent) => {
 e.stopPropagation();
 if (!user || user.uid !== zine.userId) return;
 try {
 await updateDoc(doc(db, 'zines', zine.id), { isPublic: !zine.isPublic });
 window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
 detail: { 
 message: !zine.isPublic ?"Zine Published to Press.":"Zine Unpublished.", 
 icon: <Radio size={14} /> 
 } 
 }));
 window.dispatchEvent(new CustomEvent('mimi:artifact_finalized'));
 } catch (err) {
 console.error("Publish Toggle Failed", err);
 }
 };

 const handleArchive = async (e: React.MouseEvent) => {
 e.stopPropagation();
 if (isArchived || isArchiving || !user) return;
 setIsArchiving(true);
 try {
 const { archiveManager } = await import('../services/archiveManager');
 await archiveManager.saveToPocket(user.uid, 'zine_card', { 
 zineId: zine.id, 
 title: zine.content?.headlines?.[0] || zine.title ||"Untitled", 
 analysis: {
 ...zine.content,
 design_brief: zine.content.strategic_hypothesis || zine.content.designBrief || zine.content.poetic_interpretation
 }, 
 timestamp: Date.now(),
 imageUrl: zine.coverImageUrl || zine.content.hero_image_url
 });
 setIsArchived(true);
 window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message:"Zine Anchored to Archive.", icon: <Bookmark size={14} /> } }));
 } catch (err) {
 console.error("Archive Failed", err);
 } finally {
 setIsArchiving(false);
 }
 };

 return (
 <motion.div 
 onClick={onClick}
 onMouseEnter={() => setIsHovered(true)}
 onMouseLeave={() => setIsHovered(false)}
 whileHover={{ y: -4 }}
 className={`relative cursor-pointer transition-all duration-[0.8s] w-full ${isSocialFloor ? 'max-w-5xl' : isMasonry ? 'max-w-none' : 'max-w-[420px]'} mx-auto rounded-none group overflow-hidden`}
 >
 <div className={`w-full flex flex-col ${isMasonry ? '' : 'min-h-[500px]'} ${isMasonry ? 'aspect-auto' : styles.aspect} ${styles.wrapper} border ${styles.border} relative transition-colors duration-1000`}>
 
 {/* TEXTURE LAYER */}
 <div className={`absolute inset-0 pointer-events-none ${styles.grainOpacity} bg-[url('https://www.transparenttextures.com/patterns/noise.png')] z-0 mix-blend-overlay`} />
 
 {/* TAPE BINDING (Top) */}
 <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-32 h-6 bg-white/40 /10 backdrop-blur-sm border border-white/20 transform -rotate-2 z-40"style={{ mixBlendMode: 'overlay' }} />
 
 {/* TAPE BINDING (Bottom Corner) */}
 <div className="absolute -bottom-4 -right-4 w-24 h-8 bg-white/40 /10 backdrop-blur-sm border border-white/20 transform -rotate-45 z-40"style={{ mixBlendMode: 'overlay' }} />

 {/* IMAGE LAYER (Masonry: Image is visible by default, not just on hover) */}
 {(zine.coverImageUrl || zine.content?.hero_image_url) && (
 <div className={`relative w-full ${isMasonry ? 'h-auto' : 'absolute inset-0 opacity-0 group-hover:opacity-100'} transition-opacity duration-[1.5s] z-0 overflow-hidden`}>
 <img 
 src={currentImageUrl} 
 loading="lazy"
 decoding="async"
 className={`w-full h-full object-cover transition-all duration-[2s] ${isMasonry ? 'grayscale hover:grayscale-0' : 'grayscale opacity-20'}`}
 alt=""
 />
 
 {/* MASONRY: OVERLAY GRADIENT */}
 {isMasonry && (
 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"/>
 )}
 </div>
 )}
 
 {/* ARCHIVE BUTTON OVERLAY */}
 <div className="absolute top-3 right-3 z-30 opacity-100 transition-opacity duration-300 flex gap-2">
 {user && user.uid === zine.userId && (
 <>
 <button onClick={(e) => { e.stopPropagation(); setShowEditModal(true); }} className="p-2 rounded-none backdrop-blur-md bg-white/10 text-white hover:bg-white hover:text-black"title="Edit">
 <Edit2 size={12} />
 </button>
 <button onClick={(e) => { e.stopPropagation(); /* TODO: Implement Mix */ }} className="p-2 rounded-none backdrop-blur-md bg-white/10 text-white hover:bg-white hover:text-black"title="Mix">
 <Shuffle size={12} />
 </button>
 <button onClick={(e) => { e.stopPropagation(); handleRegenerate(); }} className={`p-2 rounded-none backdrop-blur-md ${isRegenerating ? 'bg-nous-base text-white ' : 'bg-white/10 text-white hover:bg-white hover:text-black'} `} title="Regenerate">
 <RotateCcw size={12} className={isRegenerating ? 'animate-spin' : ''} />
 </button>
 <button 
 onClick={handlePublishToggle}
 className={`p-2 rounded-none transition-all backdrop-blur-md ${zine.isPublic ? 'bg-nous-base text-white ' : 'bg-white/10 text-white hover:bg-white hover:text-black'}`}
 title={zine.isPublic ?"Unpublish":"Publish"}
 >
 {zine.isPublic ? <Radio size={12} /> : <EyeOff size={12} />}
 </button>
 </>
 )}
 <button 
 onClick={handleArchive}
 className={`p-2 rounded-none transition-all backdrop-blur-md ${isArchived ? 'bg-nous-base text-white ' : 'bg-white/10 text-white hover:bg-white hover:text-black'}`}
 title="Archive to Pocket"
 >
 {isArchived ? <Check size={12} /> : <Bookmark size={12} />}
 </button>
 </div>

 {/* EDIT MODAL */}
 {showEditModal && (
 <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4"onClick={(e) => e.stopPropagation()}>
 <div className="bg-white p-6 rounded-none w-full max-w-sm">
 <div className="flex justify-between items-center mb-4">
 <h3 className="text-sm font-mono uppercase tracking-widest">Edit Image</h3>
 <button onClick={() => setShowEditModal(false)}><X size={16} /></button>
 </div>
 <textarea 
 value={editPrompt} 
 onChange={(e) => setEditPrompt(e.target.value)}
 placeholder="e.g., add grain, make dress red..."
 className="w-full p-2 mb-4 bg-nous-base rounded-none text-sm"
 />
 <button 
 onClick={handleEdit}
 disabled={isEditing}
 className="w-full py-2 bg-nous-base text-white rounded-none text-xs font-bold uppercase tracking-widest"
 >
 {isEditing ? 'Refracting...' : 'Apply Edit'}
 </button>
 </div>
 </div>
 )}

 {/* META TAG (Masonry) */}
 {isMasonry && (
 <div className="absolute top-3 left-3 z-30 flex flex-wrap gap-1">
 <span className="bg-white/90 /90 text-[6px] font-mono uppercase tracking-widest px-2 py-1 rounded-none backdrop-blur-md text-nous-text">
 {zine.tone}
 </span>
 {zine.content?.agentEnrichment?.autoTags?.slice(0, 3).map(tag => (
 <span key={tag} className="bg-nous-base/90 /90 text-[6px] font-mono uppercase tracking-widest px-2 py-1 rounded-none backdrop-blur-md text-white">
 #{tag}
 </span>
 ))}
 </div>
 )}
 
 {/* CONTENT LAYER */}
 <div className={`relative z-10 flex flex-col justify-between ${isMasonry ? 'absolute inset-0 p-6' : 'h-full p-6'}`}>
 
 {/* TOP: DOSSIER HEADER */}
 <div className="flex justify-between items-start border-b border-nous-border/30 /30 pb-4 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
 <div className="flex flex-col gap-1">
 <span className={`font-mono text-[8px] uppercase tracking-widest opacity-60 ${styles.text}`}>
 ARTIFACT // {zine.id.substring(0, 8)}
 </span>
 <span className={`font-mono text-[7px] uppercase tracking-widest opacity-40 ${styles.text}`}>
 {new Date(zine.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
 </span>
 </div>
 <div className="flex flex-col items-end gap-1">
 <span className={`font-sans text-[7px] uppercase tracking-[0.3em] font-black ${styles.accent}`}>
 {zine.tone}
 </span>
 <span className={`font-mono text-[6px] uppercase tracking-widest opacity-40 ${styles.text}`}>
 SYS.VER // 2.0
 </span>
 </div>
 </div>

 {/* CENTER: TITLE & ORACULAR MIRROR */}
 <div className={`flex-1 flex flex-col justify-center ${isMasonry ? 'items-start text-left' : 'items-center text-center'} space-y-6`}>
 <h2 className={`${headlineFont} ${isMasonry ? 'text-3xl text-white' : `text-4xl md:text-5xl ${styles.text}`} italic leading-[0.9] tracking-tighter transition-colors duration-1000`}>
 {zine.content?.headlines?.[0] || zine.title ||"Untitled"}
 </h2>
 
 {isHovered && !isMasonry && (
 <motion.div 
 initial={{ opacity: 0, y: 10 }} 
 animate={{ opacity: 1, y: 0 }}
 className="flex flex-col items-center gap-3"
 >
 <div className="w-8 h-px bg-stone-300/50 dark:bg-stone-700/50"/>
 <p className={`font-serif italic text-sm opacity-80 max-w-[280px] leading-relaxed ${styles.text}`}>
"{zine.content?.oracular_mirror || zine.content?.the_reading ||"The mirror is silent."}"
 </p>
 <div className="w-8 h-px bg-stone-300/50 dark:bg-stone-700/50"/>
 </motion.div>
 )}
 
 {isMasonry && (
 <div className="flex items-center gap-2 pt-2 border-t border-white/20 w-full">
 <span className="font-mono text-[8px] uppercase tracking-widest text-white/60">@{zine.userHandle}</span>
 <ArrowUpRight size={10} className="text-white/60 opacity-0 group-hover:opacity-100 transition-opacity"/>
 </div>
 )}
 </div>

 {/* BOTTOM: AUTHOR & METRICS */}
 {!isMasonry && (
 <div className="flex justify-between items-end pt-4 border-t border-nous-border/30 /30 opacity-0 group-hover:opacity-100 transition-opacity duration-700 mt-auto">
 <div className="flex flex-col gap-1">
 <span className={`font-mono text-[6px] uppercase tracking-widest opacity-40 ${styles.text}`}>
 OPERATIVE
 </span>
 <span className={`font-sans text-[8px] uppercase tracking-[0.2em] font-bold ${styles.text}`}>
 @{zine.userHandle || 'Ghost'}
 </span>
 </div>
 
 <div className="flex gap-4">
 <div className="flex flex-col items-end gap-1">
 <span className={`font-mono text-[6px] uppercase tracking-widest opacity-40 ${styles.text}`}>
 ENTROPY
 </span>
 <span className={`font-mono text-[8px] ${styles.text}`}>
 {(Math.random() * 10).toFixed(2)}
 </span>
 </div>
 <div className="flex flex-col items-end gap-1">
 <span className={`font-mono text-[6px] uppercase tracking-widest opacity-40 ${styles.text}`}>
 RESONANCE
 </span>
 <span className={`font-mono text-[8px] ${styles.text}`}>
 {(Math.random() * 100).toFixed(1)}%
 </span>
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 
 {/* BOTTOM BORDER HOVER */}
 <div className={`h-0.5 w-full bg-nous-base scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left`} />
 </motion.div>
 );
});
