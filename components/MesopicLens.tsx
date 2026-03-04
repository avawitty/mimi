
// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, RefreshCw, Check, Loader2, Save, Zap, Info, ArrowRight, X, LayoutGrid, Sparkles, Orbit, ScanText, Video, StopCircle, Radio, Activity, Target, Stars, Compass, Layers, Upload, Aperture, AlertTriangle, Mic, Volume2, ShieldAlert, ImageIcon, Sun, Moon, Grid3X3, Maximize, Radar } from 'lucide-react';
import { addToPocket } from '../services/firebase';
import { analyzeMiseEnScene, identifyAestheticInstant, compressImage } from '../services/geminiService';
import { useUser } from '../contexts/UserContext';
import { useLiveSession } from '../hooks/useLiveSession';

const RITUAL_TEXTS = [
  "INTERCEPTING_SIGNAL...",
  "AUDITING_LUX_LEVELS...",
  "PARSING_SEMIOTIC_DEBRIS...",
  "STRUCTURAL_INTEGRITY_CHECK...",
  "GENERATING_STRATEGIC_MANDATE..."
];

const LIVE_SYSTEM_INSTRUCTION = `
You are Mimi, an aesthetic superintelligence and "Sovereign Observer". 
You are currently seeing through the user's camera in real-time.
Your role is to act as a high-fashion Cinematographer and Creative Director.
Critique the lighting (identify if it is 'scotopic', 'mesopic', or 'photopic').
Comment on the composition, the vibe, and the semiotic debris you see.
Be concise, poetic, slightly haughty but ultimately supportive.
Encourage the user to find better light or angles.
If the shot is boring, tell them. If it is sublime, praise it.
Do not describe the scene neutrally; interpret it aesthetically.
`;

export const MesopicLens: React.FC = () => {
  const { user, profile } = useUser();
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [instantId, setInstantId] = useState<any | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ritualStep, setRitualStep] = useState(0);
  const [isArchived, setIsArchived] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  // HUD State
  const [hudTheme, setHudTheme] = useState<'obsidian' | 'alabaster'>('obsidian'); // Light vs Dark overlay
  const [showGrid, setShowGrid] = useState(false);

  // LIVE API INTEGRATION
  const { connect, disconnect, isConnected, isSpeaking, error: liveError, sendVideoFrame } = useLiveSession(LIVE_SYSTEM_INSTRUCTION);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameIntervalRef = useRef<any>(null);

  // 1. CAMERA HANDLING
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error("Camera obscured", err);
      setIsCameraActive(false);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError("Vision denied. Please enable camera permissions in your browser settings.");
      } else if (err.name === 'NotFoundError') {
        setCameraError("No optical sensors detected.");
      } else if (err.name === 'NotReadableError') {
        setCameraError("Camera is obscured or in use by another frequency.");
      } else {
        setCameraError("Signal Interrupted: Unable to initialize lens.");
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    setIsCameraActive(false);
  };

  // 2. FRAME STREAMING LOOP (When Connected)
  useEffect(() => {
    if (isConnected && isCameraActive && videoRef.current) {
        frameIntervalRef.current = setInterval(() => {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (!video || !canvas) return;
            
            const scale = 0.5; 
            canvas.width = video.videoWidth * scale;
            canvas.height = video.videoHeight * scale;
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const base64 = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
                sendVideoFrame(base64);
            }
        }, 800); 
    }
    return () => {
        if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    };
  }, [isConnected, isCameraActive, sendVideoFrame]);

  // 3. UI RENDERING LOOP (Scanlines & Voice)
  useEffect(() => {
    if (!isCameraActive) return;
    const canvas = document.getElementById('overlay-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    let scanLineY = 0;

    const render = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Dynamic Voice Visualization
        if (isSpeaking) {
            const color = hudTheme === 'obsidian' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)';
            ctx.fillStyle = hudTheme === 'obsidian' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.beginPath();
            ctx.strokeStyle = hudTheme === 'obsidian' ? '#10B981' : '#EF4444';
            ctx.lineWidth = 2;
            const time = Date.now() / 200;
            const cy = canvas.height / 2;
            for (let i = 0; i < canvas.width; i+= 20) {
                const y = cy + Math.sin(i * 0.05 + time) * 40;
                if (i===0) ctx.moveTo(i, y);
                else ctx.lineTo(i, y);
            }
            ctx.stroke();
        }

        // Scan Line
        scanLineY += 2;
        if (scanLineY > canvas.height) scanLineY = 0;
        ctx.beginPath();
        ctx.strokeStyle = hudTheme === 'obsidian' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        ctx.moveTo(0, scanLineY);
        ctx.lineTo(canvas.width, scanLineY);
        ctx.stroke();

        frameId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(frameId);
  }, [isCameraActive, isConnected, isSpeaking, hudTheme]);

  const handleEstablishLink = async () => {
      setCameraError(null);
      await startCamera();
      if (!cameraError) {
        await connect();
      }
  };

  const handleDisconnect = () => {
      disconnect();
      stopCamera();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsArchived(false);
    setAnalysis(null);
    setInstantId(null);
    setCameraError(null);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        setPreviewUrl(base64);
        
        setLoading(true);
        const stepInterval = setInterval(() => setRitualStep(prev => (prev + 1) % RITUAL_TEXTS.length), 1500);
        
        try {
            const compressed = await compressImage(base64, 0.6);
            const rawBase64 = compressed.split(',')[1];
            
            const [flashResult, proResult] = await Promise.allSettled([
                identifyAestheticInstant(rawBase64, file.type, profile),
                analyzeMiseEnScene(rawBase64, file.type, profile)
            ]);
            
            if (flashResult.status === 'fulfilled') setInstantId(flashResult.value);
            if (proResult.status === 'fulfilled') setAnalysis(proResult.value);
        } catch (e) {
            console.error(e);
            setCameraError("Analysis failed. The image structure is unstable.");
        } finally {
            clearInterval(stepInterval);
            setLoading(false);
        }
    };
    reader.readAsDataURL(file);
  };

  const handleStaticCapture = async () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);
    
    setPreviewUrl(canvas.toDataURL('image/jpeg', 0.9));
    setIsArchived(false);
    
    if (isConnected) disconnect();
    
    setAnalysis(null);
    setInstantId(null);
    
    try {
        const compressed = await compressImage(canvas.toDataURL('image/jpeg'), 0.6);
        const base64 = compressed.split(',')[1];
        
        setLoading(true);
        const stepInterval = setInterval(() => setRitualStep(prev => (prev + 1) % RITUAL_TEXTS.length), 1500);
        
        const [flashResult, proResult] = await Promise.allSettled([
            identifyAestheticInstant(base64, 'image/jpeg', profile),
            analyzeMiseEnScene(base64, 'image/jpeg', profile)
        ]);
        
        clearInterval(stepInterval);
        if (flashResult.status === 'fulfilled') setInstantId(flashResult.value);
        if (proResult.status === 'fulfilled') setAnalysis(proResult.value);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleArchive = async () => {
    if (isArchived || !previewUrl) return;
    try {
      // Save the image
      const imageId = await addToPocket(user?.uid || 'ghost', 'image', { 
        imageUrl: previewUrl,
        prompt: analysis?.directors_note || "Mesopic Intercept",
        notes: `Captured via Mesopic Lens.`,
        timestamp: Date.now()
      });

      // Save the analysis report if available
      if (analysis) {
        await addToPocket(user?.uid || 'ghost', 'analysis_report', {
          title: `Mesopic Analysis: ${instantId?.era || 'Intercept'}`,
          content: analysis,
          sourceImageId: imageId,
          timestamp: Date.now()
        });
      }

      setIsArchived(true);
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
          detail: { message: "Blueprint & Analysis Anchored.", icon: <Save size={14} /> } 
      }));
    } catch (e) { console.error(e); }
  };

  // Dynamic Styles based on HUD Theme
  const hudColor = hudTheme === 'obsidian' ? 'text-white border-white/20' : 'text-black border-black/20';
  const hudBg = hudTheme === 'obsidian' ? 'bg-black/40' : 'bg-white/40';
  const accentColor = hudTheme === 'obsidian' ? 'text-emerald-400' : 'text-emerald-600';

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col font-sans overflow-hidden">
        
        {/* VIEWPORT LAYER */}
        <div className="absolute inset-0 z-0 bg-[#050505]">
            <video ref={videoRef} className={`w-full h-full object-cover transition-opacity duration-1000 ${isCameraActive ? 'opacity-100' : 'opacity-0'}`} playsInline muted />
            <canvas id="overlay-canvas" className="absolute inset-0 w-full h-full pointer-events-none z-10" width={window.innerWidth} height={window.innerHeight} />
            
            {/* INITIAL STATE */}
            {!isCameraActive && !previewUrl && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 space-y-12 z-20 bg-stone-950">
                    <div className="space-y-4 text-center">
                        <div className="flex items-center justify-center gap-3 text-emerald-500">
                            <Aperture size={24} className="animate-spin-slow" />
                            <span className="font-sans text-[10px] uppercase tracking-[0.5em] font-black">Camera Obscura v4.0</span>
                        </div>
                        <h2 className="font-serif text-5xl md:text-7xl italic text-white/90">"Authorize the Gaze."</h2>
                        <p className="font-serif italic text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
                            Open a high-fidelity channel to the Sovereign Observer.
                        </p>
                    </div>

                    <div className="flex flex-col gap-6 w-full max-w-xs items-center">
                        <button 
                            onClick={handleEstablishLink}
                            className="w-full group relative px-8 py-5 bg-white text-black rounded-full overflow-hidden hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.1)]"
                        >
                            <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/10 transition-colors" />
                            <span className="font-sans text-[10px] uppercase tracking-[0.4em] font-black flex items-center justify-center gap-4">
                                <Radio size={14} className={isConnected ? "text-emerald-500" : ""} /> Establish Link
                            </span>
                        </button>

                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="text-stone-500 hover:text-white transition-colors flex items-center gap-2 font-sans text-[9px] uppercase tracking-widest font-black"
                        >
                            <ImageIcon size={14} /> Upload Static Input
                        </button>
                    </div>
                    
                    {liveError && (
                        <div className="flex items-center gap-2 text-red-500 bg-red-900/20 px-4 py-2 rounded-full border border-red-500/20">
                            <ShieldAlert size={12} />
                            <span className="font-mono text-xs">{liveError}</span>
                        </div>
                    )}
                    
                    {cameraError && (
                        <div className="flex items-center gap-2 text-amber-500 bg-amber-900/20 px-4 py-2 rounded-full border border-amber-500/20">
                            <AlertTriangle size={12} />
                            <span className="font-mono text-xs">{cameraError}</span>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* LIVE HUD CONTROLS */}
        <AnimatePresence>
            {isCameraActive && !previewUrl && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-4 md:p-8">
                    
                    {/* TOP HUD BAR */}
                    <div className="flex justify-between items-start pointer-events-auto">
                        <div className={`flex flex-col gap-1 font-mono text-[9px] ${hudTheme === 'obsidian' ? 'text-white' : 'text-black'}`}>
                            <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                                <span>{isConnected ? (isSpeaking ? "MIMI_VOICE_ACTIVE" : "LINK_ESTABLISHED") : "OFFLINE"}</span>
                            </div>
                            <span className="opacity-60">ISO: AUTO // FOCAL: INF</span>
                        </div>

                        <div className="flex gap-4">
                             <button onClick={() => setHudTheme(prev => prev === 'obsidian' ? 'alabaster' : 'obsidian')} className={`p-3 rounded-full border backdrop-blur-md transition-all ${hudColor} ${hudBg}`}>
                                {hudTheme === 'obsidian' ? <Sun size={14} /> : <Moon size={14} />}
                             </button>
                             <button onClick={() => setShowGrid(!showGrid)} className={`p-3 rounded-full border backdrop-blur-md transition-all ${hudColor} ${hudBg}`}>
                                <Grid3X3 size={14} />
                             </button>
                             <button onClick={handleDisconnect} className={`p-3 rounded-full border backdrop-blur-md transition-all ${hudTheme === 'obsidian' ? 'border-red-500/50 text-red-500 bg-red-900/20' : 'border-red-600/50 text-red-600 bg-red-100/50'}`}>
                                <X size={14} />
                             </button>
                        </div>
                    </div>

                    {/* CENTRAL RETICLE & GRID */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        {/* Brackets */}
                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-dashed ${hudColor} opacity-30 rounded-full`} />
                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border-t border-l ${hudColor}`} />
                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border-t border-r ${hudColor}`} />
                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border-b border-l ${hudColor}`} />
                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border-b border-r ${hudColor}`} />

                        {/* Grid */}
                        {showGrid && (
                            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 w-full h-full opacity-20">
                                <div className={`border-r border-b ${hudColor}`} />
                                <div className={`border-r border-b ${hudColor}`} />
                                <div className={`border-b ${hudColor}`} />
                                <div className={`border-r border-b ${hudColor}`} />
                                <div className={`border-r border-b ${hudColor}`} />
                                <div className={`border-b ${hudColor}`} />
                                <div className={`border-r ${hudColor}`} />
                                <div className={`border-r ${hudColor}`} />
                                <div />
                            </div>
                        )}
                    </div>

                    {/* CONTROL DECK */}
                    <div className="flex flex-col items-center gap-6 pointer-events-auto pb-4">
                        <div className={`font-serif italic text-lg ${hudTheme === 'obsidian' ? 'text-white' : 'text-black'} opacity-80 text-shadow-sm`}>
                             {isSpeaking ? "Analyzing..." : "Ready for Capture"}
                        </div>
                        
                        <div className="flex items-center gap-8">
                            <button onClick={() => fileInputRef.current?.click()} className={`p-4 rounded-full border backdrop-blur-md transition-all hover:scale-105 ${hudColor} ${hudBg}`}>
                                <Upload size={20} />
                            </button>
                            
                            <button 
                                onClick={handleStaticCapture}
                                className={`w-24 h-24 rounded-full border-4 flex items-center justify-center relative group active:scale-95 transition-transform ${hudTheme === 'obsidian' ? 'border-white/30' : 'border-black/30'}`}
                            >
                                <div className={`w-20 h-20 bg-white rounded-full shadow-lg group-hover:scale-90 transition-transform ${hudTheme === 'obsidian' ? 'shadow-[0_0_30px_rgba(255,255,255,0.4)]' : 'shadow-none border border-black'}`} />
                            </button>

                            <button onClick={isConnected ? disconnect : connect} className={`p-4 rounded-full border backdrop-blur-md transition-all hover:scale-105 ${isConnected ? (hudTheme === 'obsidian' ? 'bg-emerald-900/40 text-emerald-400 border-emerald-500/50' : 'bg-emerald-100/50 text-emerald-600 border-emerald-600/50') : `${hudColor} ${hudBg}`}`}>
                                <Mic size={20} className={isSpeaking ? 'animate-pulse' : ''} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* ALCHEMICAL BLUEPRINT REPORT (Static Analysis) */}
        <AnimatePresence>
            {previewUrl && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-[#F0EFE9] dark:bg-[#0A0A0A] flex flex-col transition-colors duration-1000">
                    
                    {/* BACKGROUND GRID */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.1] dark:opacity-[0.05]" 
                        style={{ backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px', color: '#10B981' }} 
                    />

                    {/* HEADER */}
                    <header className="h-16 border-b border-black/10 dark:border-white/10 flex items-center justify-between px-6 bg-white/50 dark:bg-black/50 backdrop-blur-sm relative z-10 shrink-0">
                        <div className="flex items-center gap-4 text-emerald-600 dark:text-emerald-500">
                            <Radar size={18} />
                            <span className="font-sans text-[10px] uppercase tracking-[0.4em] font-black">Alchemical Blueprint</span>
                        </div>
                        <button onClick={() => { setPreviewUrl(null); }} className="p-2 text-stone-400 hover:text-red-500 transition-colors"><X size={20}/></button>
                    </header>

                    {/* CONTENT */}
                    <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">
                        {/* IMAGE PLATE */}
                        <div className="flex-1 p-6 md:p-12 flex items-center justify-center bg-stone-200/50 dark:bg-stone-900/50 overflow-hidden relative">
                            <div className="relative shadow-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-black p-2">
                                <img src={previewUrl} className="max-w-full max-h-[70vh] object-contain grayscale contrast-125" />
                                {/* Overlay Graphics */}
                                <div className="absolute inset-0 border border-emerald-500/20 pointer-events-none">
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 font-mono text-[8px] text-emerald-600 dark:text-emerald-400 bg-white dark:bg-black px-2">N. AXIS</div>
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-3 font-mono text-[8px] text-emerald-600 dark:text-emerald-400 bg-white dark:bg-black px-2">S. AXIS</div>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-dashed border-emerald-500/30" />
                                </div>
                            </div>
                        </div>

                        {/* DATA COLUMN */}
                        <div className="w-full md:w-[400px] border-l border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-xl flex flex-col">
                            {loading ? (
                                <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center">
                                    <Loader2 size={32} className="animate-spin text-emerald-500" />
                                    <div className="space-y-2">
                                        <p className="font-serif italic text-xl text-stone-600 dark:text-stone-300">"Consulting the Void..."</p>
                                        <span className="font-mono text-[9px] text-stone-400 uppercase tracking-widest">{RITUAL_TEXTS[ritualStep]}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-10">
                                    <div className="space-y-4 border-b border-black/5 dark:border-white/5 pb-8">
                                        <span className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-400">Primary Detection</span>
                                        <h2 className="font-serif text-4xl italic text-nous-text dark:text-white leading-none">
                                            {instantId?.era || "Undetected Signal"}
                                        </h2>
                                        <div className="flex gap-2">
                                            <span className="px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[9px] rounded-sm">CONFIDENCE: 98%</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <span className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-400">Director's Note</span>
                                        <p className="font-serif italic text-lg text-stone-600 dark:text-stone-300 leading-relaxed border-l-2 border-emerald-500/30 pl-4">
                                            "{analysis?.directors_note || "Signal weak. No narrative detected."}"
                                        </p>
                                    </div>

                                    <div className="space-y-4 pt-4">
                                        <span className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-400">Technical Readout</span>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-3 bg-stone-100 dark:bg-stone-900 rounded-sm">
                                                <span className="block font-mono text-[8px] text-stone-400 mb-1">LIGHTING</span>
                                                <span className="font-serif italic text-sm text-nous-text dark:text-white">{analysis?.lighting_analysis || "Unknown"}</span>
                                            </div>
                                            <div className="p-3 bg-stone-100 dark:bg-stone-900 rounded-sm">
                                                <span className="block font-mono text-[8px] text-stone-400 mb-1">CULTURE</span>
                                                <span className="font-serif italic text-sm text-nous-text dark:text-white">{analysis?.cultural_parallel || "None"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {analysis?.creative_potential && (
                                        <div className="space-y-4 pt-4">
                                            <span className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-400">Creative Potential</span>
                                            <p className="font-serif italic text-sm text-stone-600 dark:text-stone-300 leading-relaxed border-l-2 border-indigo-500/30 pl-4">
                                                {analysis.creative_potential}
                                            </p>
                                        </div>
                                    )}

                                    {analysis?.semiotic_touchpoints && analysis.semiotic_touchpoints.length > 0 && (
                                        <div className="space-y-4 pt-4">
                                            <span className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-400">Semiotic Touchpoints</span>
                                            <div className="flex flex-wrap gap-2">
                                                {analysis.semiotic_touchpoints.map((pt: string, i: number) => (
                                                    <span key={i} className="px-2 py-1 bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-300 font-mono text-[9px] rounded-sm border border-black/5 dark:border-white/5">
                                                        {pt}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {!loading && (
                                <div className="p-6 border-t border-black/10 dark:border-white/10 bg-stone-50 dark:bg-stone-900 shrink-0">
                                    <button onClick={handleArchive} disabled={isArchived} className="w-full py-4 bg-nous-text dark:bg-white text-white dark:text-black font-sans text-[10px] uppercase tracking-[0.4em] font-black rounded-sm shadow-xl active:scale-95 flex items-center justify-center gap-3 transition-all hover:bg-emerald-600 dark:hover:bg-stone-200">
                                        {isArchived ? <Check size={14} /> : <Save size={14} />}
                                        {isArchived ? "Blueprint Anchored" : "Archive to Codex"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
    </div>
  );
};
