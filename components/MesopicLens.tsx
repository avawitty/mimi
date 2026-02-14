
// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, RefreshCw, Check, Loader2, Save, Zap, Info, ArrowRight, X, LayoutGrid, Sparkles, Orbit, ScanText, Video, StopCircle, Radio, Activity, Target, Stars, Compass, Layers, Upload, Aperture, AlertTriangle, Mic, Volume2, ShieldAlert, ImageIcon } from 'lucide-react';
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
        // Send a frame every 500ms (2 FPS)
        frameIntervalRef.current = setInterval(() => {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (!video || !canvas) return;
            
            // Resize for token efficiency
            const scale = 0.5; 
            canvas.width = video.videoWidth * scale;
            canvas.height = video.videoHeight * scale;
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const base64 = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
                sendVideoFrame(base64);
            }
        }, 800); // Slower interval to prevent congestion
    }
    return () => {
        if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    };
  }, [isConnected, isCameraActive, sendVideoFrame]);

  // 3. UI RENDERING LOOP (Scanlines)
  useEffect(() => {
    if (!isCameraActive) return;
    const canvas = document.getElementById('overlay-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    const render = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Dynamic Voice Visualization
        if (isSpeaking) {
            ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.beginPath();
            ctx.strokeStyle = '#10B981';
            ctx.lineWidth = 2;
            const time = Date.now() / 200;
            const cy = canvas.height / 2;
            for (let i = 0; i < canvas.width; i+= 10) {
                const y = cy + Math.sin(i * 0.05 + time) * 30;
                if (i===0) ctx.moveTo(i, y);
                else ctx.lineTo(i, y);
            }
            ctx.stroke();
        }

        // Reticle
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        ctx.strokeRect(cx - 40, cy - 40, 80, 80);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '10px monospace';
        ctx.fillText(isConnected ? "LINK: ESTABLISHED" : "LINK: OFFLINE", 20, 20);

        frameId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(frameId);
  }, [isCameraActive, isConnected, isSpeaking]);

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
    
    // Clear previous states
    setIsArchived(false);
    setAnalysis(null);
    setInstantId(null);
    setCameraError(null);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        setPreviewUrl(base64);
        
        // Trigger Analysis Sequence
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
    
    // Stop live session temporarily for static audit
    if (isConnected) disconnect();
    
    // Clear previous analysis immediately
    setAnalysis(null);
    setInstantId(null);
    
    // Trigger Audit
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
      await addToPocket(user?.uid || 'ghost', 'image', { 
        imageUrl: previewUrl,
        prompt: analysis?.directors_note || "Mesopic Intercept",
        notes: `Captured via Mesopic Lens.`,
        timestamp: Date.now()
      });
      setIsArchived(true);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black text-white flex flex-col font-sans overflow-hidden">
        
        {/* VIEWPORT LAYER */}
        <div className="absolute inset-0 z-0 bg-stone-900">
            <video ref={videoRef} className={`w-full h-full object-cover ${isCameraActive ? 'opacity-100' : 'opacity-0'}`} playsInline muted />
            <canvas id="overlay-canvas" className="absolute inset-0 w-full h-full pointer-events-none z-10" width={window.innerWidth} height={window.innerHeight} />
            
            {/* INITIAL STATE */}
            {!isCameraActive && !previewUrl && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 space-y-12 z-20">
                    <div className="space-y-4 text-center">
                        <div className="flex items-center justify-center gap-3 text-emerald-500">
                            <Aperture size={24} className="animate-spin-slow" />
                            <span className="font-sans text-[10px] uppercase tracking-[0.5em] font-black">Mesopic Lens v2.0</span>
                        </div>
                        <h2 className="font-serif text-4xl md:text-6xl italic text-white/90">"Authorize the Gaze."</h2>
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
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-8">
                    {/* HEADER */}
                    <div className="flex justify-between items-start pointer-events-auto">
                        <div className={`flex items-center gap-3 px-4 py-2 rounded-full border ${isConnected ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-400' : 'bg-black/40 border-white/10 text-stone-400'}`}>
                            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-stone-500'}`} />
                            <span className="font-mono text-[9px] uppercase tracking-widest font-black">
                                {isConnected ? (isSpeaking ? "MIMI SPEAKING..." : "SIGNAL ACTIVE") : "CONNECTING..."}
                            </span>
                        </div>
                        <button onClick={handleDisconnect} className="p-3 bg-red-500/10 border border-red-500/30 rounded-full text-red-400 hover:bg-red-500 hover:text-white transition-all">
                            <X size={16} />
                        </button>
                    </div>

                    {/* FOOTER */}
                    <div className="flex justify-center items-end gap-8 pointer-events-auto pb-8">
                        <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-black/40 border border-white/10 rounded-full text-stone-400 hover:text-white backdrop-blur-md transition-all">
                            <Upload size={20} />
                        </button>
                        
                        <button 
                            onClick={handleStaticCapture}
                            className="w-20 h-20 rounded-full border-4 border-white/20 flex items-center justify-center relative group active:scale-90 transition-transform"
                        >
                            <div className="w-16 h-16 bg-white rounded-full shadow-[0_0_30px_rgba(255,255,255,0.3)] group-hover:bg-emerald-400 transition-colors" />
                        </button>

                        <div className="w-12" /> {/* Spacer for balance */}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* STATIC ANALYSIS VIEW (If Shutter Pressed or Uploaded) */}
        <AnimatePresence>
            {previewUrl && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-black flex flex-col md:flex-row">
                    <div className="w-full md:w-1/2 h-1/2 md:h-full relative bg-stone-900">
                        <img src={previewUrl} className="w-full h-full object-contain" />
                        <button onClick={() => { setPreviewUrl(null); }} className="absolute top-6 left-6 p-3 bg-black/50 text-white rounded-full backdrop-blur-md"><X size={20}/></button>
                    </div>
                    <div className="w-full md:w-1/2 h-1/2 md:h-full bg-stone-950 border-l border-white/10 p-8 md:p-12 overflow-y-auto">
                        {loading ? (
                            <div className="h-full flex flex-col items-center justify-center gap-4">
                                <Loader2 size={32} className="animate-spin text-emerald-500" />
                                <span className="font-mono text-xs text-stone-400 animate-pulse">{RITUAL_TEXTS[ritualStep]}</span>
                            </div>
                        ) : (
                            <div className="space-y-8 animate-fade-in">
                                <div className="space-y-2">
                                    <span className="font-sans text-[9px] uppercase tracking-widest text-emerald-500 font-black">Audit Complete</span>
                                    <h3 className="font-serif text-4xl italic text-white">{instantId?.era || "Undetected"}</h3>
                                </div>
                                <p className="font-serif italic text-xl text-stone-300 leading-relaxed border-l-2 border-emerald-500/30 pl-4">
                                    "{analysis?.directors_note || "Signal weak."}"
                                </p>
                                <button onClick={handleArchive} disabled={isArchived} className="w-full py-4 bg-white text-black font-sans text-[10px] uppercase tracking-[0.4em] font-black rounded-full shadow-xl active:scale-95 flex items-center justify-center gap-3">
                                    {isArchived ? <Check size={14} /> : <Save size={14} />}
                                    {isArchived ? "Anchored" : "Commit to Archive"}
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
    </div>
  );
};
