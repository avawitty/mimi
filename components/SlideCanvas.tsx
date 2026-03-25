
// @ts-nocheck
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EditorElement, EditorElementStyle, UserProfile, LayoutConfig } from '../types';
import { Maximize, RotateCw, Sparkles, Feather, Briefcase, Zap, Loader2, X, Move, CornerRightDown } from 'lucide-react';
import { Visualizer } from './Visualizer';
import { fastRefraction } from '../services/geminiService';

interface SlideCanvasProps {
 id: string;
 elements: EditorElement[];
 isActive: boolean;
 onUpdate: (elements: EditorElement[]) => void;
 onSelect: () => void;
 onElementSelect?: (id: string | null) => void;
 profile: UserProfile | null;
 layoutConfig?: LayoutConfig;
}

export const SlideCanvas: React.FC<SlideCanvasProps> = ({ id, elements, isActive, onUpdate, onSelect, onElementSelect, profile, layoutConfig }) => {
 const containerRef = useRef<HTMLDivElement>(null);
 const [selectedId, setSelectedId] = useState<string | null>(null);
 const [isDragging, setIsDragging] = useState(false);
 const [isResizing, setIsResizing] = useState(false);
 const [isRotating, setIsRotating] = useState(false);
 const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
 const [initialStyle, setInitialStyle] = useState<EditorElementStyle | null>(null);
 
 const handlePointerMove = useCallback((e: MouseEvent | TouchEvent) => {
 if ((!isDragging && !isResizing && !isRotating) || !selectedId || !initialStyle || !containerRef.current) return;
 e.preventDefault();
 const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
 const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
 const rect = containerRef.current.getBoundingClientRect();

 if (isDragging) {
 const dX = ((clientX - dragStart.x) / rect.width) * 100;
 const dY = ((clientY - dragStart.y) / rect.height) * 100;
 onUpdate(elements.map(el => el.id === selectedId ? { 
 ...el, style: { ...el.style, left: Math.max(-20, Math.min(100, initialStyle.left + dX)), top: Math.max(-20, Math.min(100, initialStyle.top + dY)) } 
 } : el));
 } else if (isResizing) {
 const dX = ((clientX - dragStart.x) / rect.width) * 100;
 const delta = dX; 
 onUpdate(elements.map(el => el.id === selectedId ? { 
 ...el, style: { ...el.style, width: Math.max(5, Math.min(100 - el.style.left, initialStyle.width + delta)) } 
 } : el));
 } else if (isRotating) {
 const el = elements.find(item => item.id === selectedId);
 if (!el) return;
 const centerX = rect.left + ((el.style.left + el.style.width / 2) / 100) * rect.width;
 const centerY = rect.top + ((el.style.top + (el.style.width * (rect.width/rect.height)) / 2) / 100) * rect.height; 
 
 const radians = Math.atan2(clientY - centerY, clientX - centerX);
 const degree = (radians * (180 / Math.PI) + 90) % 360;
 
 onUpdate(elements.map(el => el.id === selectedId ? {
 ...el, style: { ...el.style, rotation: degree }
 } : el));
 }
 }, [isDragging, isResizing, isRotating, selectedId, dragStart, initialStyle, elements, onUpdate]);

 const handlePointerUp = useCallback(() => { 
 setIsDragging(false); setIsResizing(false); setIsRotating(false);
 }, []);

 useEffect(() => {
 if (isActive) {
 window.addEventListener('mousemove', handlePointerMove); 
 window.addEventListener('mouseup', handlePointerUp);
 window.addEventListener('touchmove', handlePointerMove, { passive: false });
 window.addEventListener('touchend', handlePointerUp);
 return () => { 
 window.removeEventListener('mousemove', handlePointerMove); 
 window.removeEventListener('mouseup', handlePointerUp);
 window.removeEventListener('touchmove', handlePointerMove);
 window.removeEventListener('touchend', handlePointerUp);
 };
 }
 }, [isActive, handlePointerMove, handlePointerUp]);

 const startDrag = (e: React.MouseEvent | React.TouchEvent, id: string) => {
 e.stopPropagation();
 onSelect(); 
 setSelectedId(id);
 if (onElementSelect) onElementSelect(id);
 
 const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
 const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
 setIsDragging(true); setDragStart({ x: clientX, y: clientY });
 const el = elements.find(item => item.id === id);
 setInitialStyle({ ...el?.style } as EditorElementStyle);
 };

 const startResize = (e: React.MouseEvent | React.TouchEvent) => {
 e.stopPropagation();
 const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
 const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
 setIsResizing(true); setDragStart({ x: clientX, y: clientY });
 const el = elements.find(item => item.id === selectedId);
 setInitialStyle({ ...el?.style } as EditorElementStyle);
 };

 const startRotate = (e: React.MouseEvent | React.TouchEvent) => {
 e.stopPropagation();
 const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
 const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
 setIsRotating(true);
 setDragStart({ x: clientX, y: clientY });
 const el = elements.find(item => item.id === selectedId);
 setInitialStyle({ ...el?.style } as EditorElementStyle);
 };

 // STYLE RESOLVER
 const getElementStyle = (el: EditorElement) => {
 const baseStyle = { ...el.style };
 
 if (el.type === 'text' && layoutConfig) {
 if (baseStyle.fontFamily === 'serif' || !baseStyle.fontFamily) {
 baseStyle.fontFamily = layoutConfig.fontSet[0] || 'Cormorant Garamond';
 } else if (baseStyle.fontFamily === 'sans') {
 baseStyle.fontFamily = layoutConfig.fontSet[1] || 'Space Grotesk';
 }

 if (baseStyle.color === 'inherit' || !baseStyle.color) {
 baseStyle.color = layoutConfig.colorSet[0] || '#1C1917';
 } else if (baseStyle.color === 'secondary') {
 baseStyle.color = layoutConfig.colorSet[1] || '#A8A29E';
 }
 }
 return baseStyle;
 };

 return (
 <div 
 ref={containerRef}
 onClick={() => { setSelectedId(null); onSelect(); if(onElementSelect) onElementSelect(null); }}
 className={`relative w-full aspect-[16/9] transition-all duration-500 overflow-hidden ${isActive ? 'ring-1 ring-stone-500/20 ' : 'border border-stone-200 dark:border-stone-800'}`}
 style={{ backgroundColor: layoutConfig?.backgroundStyle || '#FFFFFF' }}
 >
 <div className="absolute top-2 right-2 opacity-10 font-mono text-[8px] pointer-events-none">{id.slice(-4)}</div>
 
 {elements.sort((a,b) => (a.style.zIndex || 0) - (b.style.zIndex || 0)).map(el => {
 const finalStyle = getElementStyle(el);
 const isSelected = selectedId === el.id;
 
 return (
 <motion.div 
 key={el.id} 
 className={`absolute group/el ${isSelected ? 'z-50' : ''} cursor-move`}
 style={{ 
 top: `${finalStyle.top}%`, 
 left: `${finalStyle.left}%`, 
 width: `${finalStyle.width}%`, 
 zIndex: finalStyle.zIndex,
 rotate: `${finalStyle.rotation || 0}deg`
 }}
 onMouseDown={(e) => startDrag(e, el.id)}
 onTouchStart={(e) => startDrag(e, el.id)}
 >
 {/* SOURCE LABEL - VISIBLE ON HOVER/SELECT */}
 {el.sourceRef && (
 <div className={`absolute -top-6 left-0 bg-stone-500/10 text-stone-600 px-2 py-0.5 text-[6px] uppercase tracking-widest font-black rounded-none border border-stone-500/20 transition-opacity whitespace-nowrap ${isSelected ? 'opacity-100' : 'opacity-0 group-hover/el:opacity-100'}`}>
 Source: {el.sourceRef}
 </div>
 )}

 {el.type === 'text' && (
 <div 
 className={`w-full h-full outline-none whitespace-pre-wrap transition-all ${isSelected ? 'ring-1 ring-stone-500/50' : 'hover:ring-1 hover:ring-stone-500/20'}`}
 style={{
 fontSize: `${finalStyle.fontSize || 1}vw`,
 fontFamily: finalStyle.fontFamily,
 fontWeight: finalStyle.fontWeight,
 fontStyle: finalStyle.fontStyle,
 textAlign: finalStyle.textAlign,
 color: finalStyle.color,
 lineHeight: layoutConfig?.spacingScale ? `${1.2 * layoutConfig.spacingScale}` : '1.2',
 borderStyle: finalStyle.borderStyle || 'none',
 borderWidth: `${finalStyle.borderWidth || 0}px`,
 borderColor: finalStyle.borderColor || 'transparent',
 borderRadius: `${finalStyle.borderRadius || 0}px`,
 backgroundColor: finalStyle.backgroundColor || 'transparent',
 padding: `${finalStyle.padding !== undefined ? finalStyle.padding : 8}px`,
 opacity: finalStyle.opacity !== undefined ? finalStyle.opacity : 1
 }}
 >
 {el.content}
 </div>
 )}

 {el.type === 'image' && (
 <div 
 className={`relative w-full ${isSelected ? 'ring-1 ring-stone-500' : ''}`}
 style={{
 opacity: finalStyle.opacity !== undefined ? finalStyle.opacity : 1,
 filter: finalStyle.filter || 'none',
 borderRadius: finalStyle.borderRadius ? `${finalStyle.borderRadius}px` : undefined,
 overflow: 'hidden'
 }}
 >
 {el.content.startsWith('http') || el.content.startsWith('data:') ? (
 <img src={el.content} className="w-full h-auto object-cover pointer-events-none"/>
 ) : (
 <Visualizer prompt={el.content} defaultAspectRatio="16:9"isArtifact />
 )}
 </div>
 )}

 {/* INTERACTION HANDLES */}
 {isSelected && (
 <>
 {/* ROTATE HANDLE */}
 <div 
 className="absolute -top-6 left-1/2 -translate-x-1/2 w-5 h-5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-none flex items-center justify-center cursor-grab active:cursor-grabbing z-50 hover:bg-stone-50"
 onMouseDown={startRotate}
 onTouchStart={startRotate}
 >
 <RotateCw size={10} className="text-stone-500"/>
 </div>
 
 {/* RESIZE HANDLES */}
 <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-stone-500 rounded-none cursor-se-resize flex items-center justify-center pointer-events-auto z-50 border border-white"onMouseDown={startResize} onTouchStart={startResize}>
 <Maximize size={8} className="text-white"/>
 </div>
 <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-white border border-stone-500 rounded-none cursor-sw-resize z-50"onMouseDown={startResize} onTouchStart={startResize} />
 <div className="absolute -top-2 -right-2 w-3 h-3 bg-white border border-stone-500 rounded-none cursor-ne-resize z-50"onMouseDown={startResize} onTouchStart={startResize} />
 <div className="absolute -top-2 -left-2 w-3 h-3 bg-white border border-stone-500 rounded-none cursor-nw-resize z-50"onMouseDown={startResize} onTouchStart={startResize} />
 </>
 )}
 </motion.div>
 );
 })}
 </div>
 );
};
