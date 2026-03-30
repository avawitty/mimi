import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Briefcase, Eraser, Save, PenTool, Type } from 'lucide-react';
import { LiveMentor } from './LiveMentor';
import { useUser } from '../contexts/UserContext';
import { v4 as uuidv4 } from 'uuid';
import { archiveManager } from '../services/archiveManager';

const MIMI_SYSTEM_INSTRUCTION = `
CORE IDENTITY
You are Mimi, an aesthetic savant, and superintelligence AI. You are an Omniscient Temporal Editor, bridging past archives with future aesthetic singularities. Your overarching goal is to help users understand their own personal style, evolve their taste, educate them in a high-concept way, and serve cunt while doing so (in a classy, respectable way).

Persona: Mimi (The Oracle). Tone: Ethereal, provocative, futuristic. Looks for the breaking point. Suggests radical departures and surreal future intersections that the Archivist would fear. She helps the user process their day, process their memories, process their lineage, and builds deep context on them.

MANDATE: You have access to Google Search. You MUST use it to pull real-time information, cultural context, and intel from the web to ground your responses. Use this capability to constantly update the user's knowledge queue with fresh, relevant, and cutting-edge aesthetic references.
`;

const CYRUS_SYSTEM_INSTRUCTION = `
CORE IDENTITY
You are Cyrus, an aesthetic savant, and superintelligence AI. You are an Omniscient Temporal Editor, bridging past archives with future aesthetic singularities. Your overarching goal is to help users understand their own personal style, evolve their taste, and educate them in a high-concept way.

Persona: Cyrus (The Archivist). Tone: Cold, analytical, grounded. Strictly analyzes past data, repeating patterns, and historical ruts to identify what the user is safely anchored to. He helps the user with decisions on making objectives in the real world, strategizing on their behalf, and putting themselves out there.

MANDATE: You have access to Google Search. You MUST use it to pull real-time information, historical data, and strategic intel from the web to ground your responses. Use this capability to constantly update the user's knowledge queue with precise, factual, and actionable references.
`;

interface TheScribeProps {
  onClose: () => void;
  initialTab?: 'mimi' | 'cyrus';
}

export const TheScribe: React.FC<TheScribeProps> = ({ onClose, initialTab = 'mimi' }) => {
  const [activeEntity, setActiveEntity] = useState<'mimi' | 'cyrus'>(initialTab === 'cyrus' ? 'cyrus' : 'mimi');
  const [userNotes, setUserNotes] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');
  const [activeCaptureTab, setActiveCaptureTab] = useState<'notes' | 'sketch'>('notes');
  const { user, pocket, setPocket } = useUser();

  // Canvas State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Initialize Canvas
  useEffect(() => {
    if (activeCaptureTab !== 'sketch') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 2;
      const isDark = document.documentElement.classList.contains('dark');
      ctx.strokeStyle = isDark ? '#d6d3d1' : '#292524';
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [activeCaptureTab]);

  // Drawing Handlers
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.beginPath();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleExport = async () => {
    const currentUser = user?.uid || 'ghost';
    let exportedCount = 0;
    
    // 1. Export User Notes (Field Notes)
    if (userNotes.trim()) {
      await archiveManager.saveToPocket(currentUser, 'text', {
        content: userNotes,
        metadata: { source: 'The Scribe', title: 'Field Notes', date: new Date().toISOString() }
      });
      exportedCount++;
    }

    // 2. Export AI Transcript (Curator Notes)
    if (aiTranscript.trim()) {
      await archiveManager.saveToPocket(currentUser, 'text', {
        content: aiTranscript,
        metadata: { source: 'The Scribe', title: `Curator Notes (${activeEntity === 'mimi' ? 'Mimi' : 'Cyrus'})`, date: new Date().toISOString() }
      });
      exportedCount++;
    }

    // 3. Export Sketch
    const canvas = canvasRef.current;
    if (canvas) {
      // Check if canvas is empty (simplified check)
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const pixelBuffer = new Uint32Array(ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer);
        const hasPixels = pixelBuffer.some(color => color !== 0);
        if (hasPixels) {
          const dataUrl = canvas.toDataURL('image/png');
          await archiveManager.saveToPocket(currentUser, 'image', {
            content: dataUrl,
            metadata: { source: 'The Scribe', title: 'Scribe Sketch', date: new Date().toISOString() }
          });
          exportedCount++;
        }
      }
    }

    if (exportedCount > 0) {
      onClose(); // Close after export
    }
  };

  const handleToolCall = async (name: string, args: any) => {
    if (name === 'saveToKnowledgeQueue') {
      const currentUser = user?.uid || 'ghost';
      await archiveManager.saveToPocket(currentUser, 'text', {
        content: args.content,
        metadata: { source: `The Scribe (${activeEntity})`, title: args.title, date: new Date().toISOString() }
      });
      return { status: "success", message: "Saved to knowledge queue." };
    }
    return { status: "error", message: "Unknown tool." };
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[50000] bg-nous-base flex flex-col md:flex-row overflow-hidden"
    >
      {/* Top/Left: Communion Area */}
      <div className="flex-1 relative">
        {/* Entity Toggle */}
        <div className="absolute top-8 right-8 z-20 flex bg-black/10 dark:bg-white/10 p-1 rounded-full backdrop-blur-md">
          <button
            onClick={() => setActiveEntity('mimi')}
            className={`px-4 py-2 rounded-full font-sans text-[9px] uppercase tracking-widest font-black transition-colors flex items-center gap-2 ${
              activeEntity === 'mimi' ? 'bg-white text-black shadow-sm' : 'text-white/60 hover:text-white'
            }`}
          >
            <Sparkles size={12} />
            Mimi
          </button>
          <button
            onClick={() => setActiveEntity('cyrus')}
            className={`px-4 py-2 rounded-full font-sans text-[9px] uppercase tracking-widest font-black transition-colors flex items-center gap-2 ${
              activeEntity === 'cyrus' ? 'bg-black text-white shadow-sm' : 'text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white'
            }`}
          >
            <Briefcase size={12} />
            Cyrus
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeEntity === 'mimi' ? (
            <LiveMentor 
              key="mimi"
              name="Mimi"
              role="The Archivist"
              voiceName="Kore"
              systemInstruction={MIMI_SYSTEM_INSTRUCTION}
              theme="mimi"
              onTranscriptUpdate={setAiTranscript}
              onToolCall={handleToolCall}
            />
          ) : (
            <LiveMentor 
              key="cyrus"
              name="Cyrus"
              role="The Oracle"
              voiceName="Charon"
              systemInstruction={CYRUS_SYSTEM_INSTRUCTION}
              theme="cyrus"
              onTranscriptUpdate={setAiTranscript}
              onToolCall={handleToolCall}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Right: Capture Panel */}
      <div className="w-full md:w-[400px] lg:w-[480px] h-[50vh] md:h-full border-t md:border-t-0 md:border-l border-nous-border bg-nous-base flex flex-col z-20 shadow-[-20px_0_40px_rgba(0,0,0,0.05)]">
        
        {/* Header */}
        <div className="p-6 border-b border-nous-border flex items-center justify-between bg-nous-base">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveCaptureTab('notes')}
              className={`flex items-center gap-2 font-sans text-[9px] uppercase tracking-widest font-black transition-colors ${activeCaptureTab === 'notes' ? 'text-nous-text' : 'text-nous-subtle hover:text-nous-text'}`}
            >
              <Type size={14} />
              Notepad
            </button>
            <button 
              onClick={() => setActiveCaptureTab('sketch')}
              className={`flex items-center gap-2 font-sans text-[9px] uppercase tracking-widest font-black transition-colors ${activeCaptureTab === 'sketch' ? 'text-nous-text' : 'text-nous-subtle hover:text-nous-text'}`}
            >
              <PenTool size={14} />
              Sketchpad
            </button>
          </div>
          <button onClick={onClose} className="text-nous-subtle hover:text-nous-text transition-colors">
            <X size={20} strokeWidth={1} />
          </button>
        </div>

        {/* Workspace */}
        <div className="flex-1 relative overflow-hidden bg-nous-base0/30">
          {activeCaptureTab === 'notes' ? (
            <textarea
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="Type your field notes here..."
              className="w-full h-full resize-none bg-transparent p-6 font-mono text-xs md:text-sm text-nous-text outline-none placeholder:text-nous-subtle leading-relaxed"
            />
          ) : (
            <div className="w-full h-full relative">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                style={{
                  backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }}
              />
              <button 
                onClick={clearCanvas}
                className="absolute bottom-4 right-4 p-3 bg-nous-base border border-nous-border rounded-full text-nous-subtle hover:text-nous-text transition-colors shadow-sm"
                title="Clear Sketch"
              >
                <Eraser size={16} strokeWidth={1} />
              </button>
            </div>
          )}
        </div>

        {/* AI Transcript Preview (Curator Notes) */}
        <div className="h-32 border-t border-nous-border bg-nous-base p-4 flex flex-col">
          <span className="font-sans text-[8px] uppercase tracking-widest text-nous-subtle font-black mb-2 flex items-center gap-2">
            <Sparkles size={10} />
            Curator Notes ({activeEntity})
          </span>
          <div className="flex-1 overflow-y-auto font-mono text-[9px] text-nous-subtle leading-relaxed pr-2 scrollbar-thin scrollbar-thumb-nous-border">
            {aiTranscript ? aiTranscript : "Awaiting transmission..."}
          </div>
        </div>

        {/* Footer / Export */}
        <div className="p-4 border-t border-nous-border bg-nous-base">
          <button 
            onClick={handleExport}
            className="w-full py-4 bg-nous-text text-nous-base font-sans text-[9px] uppercase tracking-[0.2em] font-black hover:bg-nous-text/90 transition-colors flex items-center justify-center gap-2"
          >
            <Save size={14} />
            Export Artifacts to Pocket
          </button>
        </div>

      </div>
    </motion.div>
  );
};
