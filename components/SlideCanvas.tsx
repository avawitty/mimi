
// @ts-nocheck
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EditorElement, EditorElementStyle, UserProfile, LayoutConfig } from '../types';
import { Maximize, RotateCw, Sparkles, Feather, Briefcase, Zap, Loader2, X, Move } from 'lucide-react';
import { Visualizer } from './Visualizer';
import { fastRefraction } from '../services/geminiService';

interface SlideCanvasProps {
  id: string;
  elements: EditorElement[];
  isActive: boolean;
  onUpdate: (elements: EditorElement[]) => void;
  onSelect: () => void;
  profile: UserProfile | null;
  layoutConfig?: LayoutConfig;
}

export const SlideCanvas: React.FC<SlideCanvasProps> = ({ id, elements, isActive, onUpdate, onSelect, profile, layoutConfig }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialStyle, setInitialStyle] = useState<EditorElementStyle | null>(null);
  
  const handlePointerMove = useCallback((e: MouseEvent | TouchEvent) => {
    if ((!isDragging && !isResizing) || !selectedId || !initialStyle || !containerRef.current) return;
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
    }
  }, [isDragging, isResizing, selectedId, dragStart, initialStyle, elements, onUpdate]);

  const handlePointerUp = useCallback(() => { 
    setIsDragging(false); setIsResizing(false);
  }, []);

  useEffect(() => {
      if (isActive) {
          window.addEventListener('mousemove', handlePointerMove); 
          window.addEventListener('mouseup', handlePointerUp);
          return () => { 
            window.removeEventListener('mousemove', handlePointerMove); 
            window.removeEventListener('mouseup', handlePointerUp);
          };
      }
  }, [isActive, handlePointerMove, handlePointerUp]);

  const startDrag = (e: React.MouseEvent | React.TouchEvent, id: string) => {
    e.stopPropagation();
    onSelect(); 
    setSelectedId(id);
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

  // APPLY GLOBAL LAYOUT SETTINGS IF ELEMENT HAS NO SPECIFIC OVERRIDE
  const getElementStyle = (el: EditorElement) => {
      const baseStyle = { ...el.style };
      
      if (el.type === 'text' && layoutConfig) {
          // If font is generic serif/sans, map to layout config
          if (!baseStyle.fontFamily || baseStyle.fontFamily === 'serif' || baseStyle.fontFamily === 'sans') {
              baseStyle.fontFamily = layoutConfig.fontSet[0] || 'Cormorant Garamond';
          }
          // Only override color if it's default inherit/black/white
          if (baseStyle.color === 'inherit' || !baseStyle.color) {
              baseStyle.color = layoutConfig.colorSet[0] || '#1C1917';
          }
      }
      return baseStyle;
  };

  return (
    <div 
        ref={containerRef}
        onClick={() => { setSelectedId(null); onSelect(); }}
        className={`relative w-full aspect-[16/9] transition-all duration-500 overflow-hidden shadow-sm ${isActive ? 'ring-1 ring-emerald-500/20 shadow-2xl' : 'border border-stone-200 dark:border-stone-800'}`}
        style={{ backgroundColor: layoutConfig?.backgroundStyle || '#FFFFFF' }}
    >
        <div className="absolute top-2 right-2 opacity-10 font-mono text-[8px] pointer-events-none">{id.slice(-4)}</div>
        
        {elements.sort((a,b) => (a.style.zIndex || 0) - (b.style.zIndex || 0)).map(el => {
            const finalStyle = getElementStyle(el);
            return (
                <motion.div 
                    key={el.id} 
                    className={`absolute group/el ${selectedId === el.id ? 'z-50' : ''} cursor-move`}
                    style={{ 
                        top: `${finalStyle.top}%`, 
                        left: `${finalStyle.left}%`, 
                        width: `${finalStyle.width}%`, 
                        zIndex: finalStyle.zIndex 
                    }}
                    onMouseDown={(e) => startDrag(e, el.id)}
                >
                    {el.type === 'text' && (
                        <div 
                            className={`w-full h-full p-2 outline-none whitespace-pre-wrap ${selectedId === el.id ? 'ring-1 ring-emerald-500/50 bg-emerald-500/5 rounded-sm' : ''}`}
                            style={{
                                fontSize: `${finalStyle.fontSize || 1}vw`,
                                fontFamily: finalStyle.fontFamily,
                                fontWeight: finalStyle.fontWeight,
                                fontStyle: finalStyle.fontStyle,
                                textAlign: finalStyle.textAlign,
                                color: finalStyle.color,
                                lineHeight: layoutConfig?.spacingScale ? `${1.2 * layoutConfig.spacingScale}` : '1.2'
                            }}
                        >
                            {el.content}
                        </div>
                    )}

                    {el.type === 'image' && (
                        <div className={`relative w-full ${selectedId === el.id ? 'ring-1 ring-emerald-500' : ''}`}>
                            {el.content.startsWith('http') || el.content.startsWith('data:') ? (
                                <img src={el.content} className="w-full h-auto object-cover pointer-events-none" />
                            ) : (
                                <Visualizer prompt={el.content} defaultAspectRatio="16:9" isArtifact />
                            )}
                        </div>
                    )}

                    {selectedId === el.id && (
                        <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-emerald-500 rounded-full cursor-se-resize flex items-center justify-center pointer-events-auto" onMouseDown={startResize}>
                            <Maximize size={8} className="text-white" />
                        </div>
                    )}
                </motion.div>
            );
        })}
    </div>
  );
};
