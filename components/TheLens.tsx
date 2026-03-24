
import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Zap, Sparkles, Loader2, Play, Square, Video, Mic, Image as ImageIcon, Save } from 'lucide-react';
import { LiveAestheticService, AestheticAnalysis } from '../services/liveAestheticService';
import { useUser } from '../contexts/UserContext';
import { analyzeMiseEnScene, analyzeVideo, analyzeAudio } from '../services/geminiService';
import { addToPocket } from '../services/firebase';

export const TheLens = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [analysis, setAnalysis] = useState<AestheticAnalysis[]>([]);
  const [currentReading, setCurrentReading] = useState<string>("");
  const serviceRef = useRef<LiveAestheticService | null>(null);
  const { user, profile } = useUser();

  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [captureResult, setCaptureResult] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleSaveToPocket = async () => {
    if (!captureResult || !user?.uid) return;
    setIsSaving(true);
    try {
      await addToPocket(user.uid, 'analysis_report', {
        title: `The Lens Analysis: ${captureResult.type.toUpperCase()}`,
        content: captureResult.data,
        timestamp: Date.now()
      });
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
          detail: { message: "Analysis Anchored.", icon: <Save size={14} /> } 
      }));
      setCaptureResult(null);
    } catch (e) {
      console.error("Failed to save analysis", e);
    } finally {
      setIsSaving(false);
    }
  };

  const startLens = async () => {
    setIsConnecting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      serviceRef.current = new LiveAestheticService((data) => {
        if (data.scribeReading) {
          setCurrentReading(data.scribeReading);
          setAnalysis(prev => [...prev, data]);
        }
      });
      
      await serviceRef.current.connect();
      setIsActive(true);
    } catch (err) {
      console.error("MIMI // Failed to start The Lens:", err);
    } finally {
      setIsConnecting(false);
    }
  };

  const stopLens = () => {
    setIsActive(false);
    if (serviceRef.current) {
      serviceRef.current.close();
    }
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }
  };

  useEffect(() => {
    let interval: any;
    if (isActive && serviceRef.current) {
      interval = setInterval(() => {
        if (videoRef.current && canvasRef.current && !isRecordingVideo) {
          const context = canvasRef.current.getContext('2d');
          if (context) {
            context.drawImage(videoRef.current, 0, 0, 640, 480);
            const base64 = canvasRef.current.toDataURL('image/jpeg', 0.5).split(',')[1];
            serviceRef.current?.sendVideoFrame(base64);
          }
        }
      }, 3000); // Send frame every 3 seconds
    }
    return () => clearInterval(interval);
  }, [isActive, isRecordingVideo]);

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const context = canvasRef.current.getContext('2d');
    if (!context) return;
    context.drawImage(videoRef.current, 0, 0, 640, 480);
    const base64 = canvasRef.current.toDataURL('image/jpeg', 0.8).split(',')[1];
    
    setIsAnalyzing(true);
    setCaptureResult(null);
    try {
      const result = await analyzeMiseEnScene(base64, 'image/jpeg', profile);
      setCaptureResult({ type: 'image', data: result });
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleVideoRecording = () => {
    if (isRecordingVideo) {
      mediaRecorderRef.current?.stop();
      setIsRecordingVideo(false);
    } else {
      if (!videoRef.current?.srcObject) return;
      chunksRef.current = [];
      const stream = videoRef.current.srcObject as MediaStream;
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          setIsAnalyzing(true);
          try {
            const result = await analyzeVideo(base64, 'video/webm', profile);
            setCaptureResult({ type: 'video', data: result });
          } catch (e) {
            console.error(e);
          } finally {
            setIsAnalyzing(false);
          }
        };
        reader.readAsDataURL(blob);
      };
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecordingVideo(true);
    }
  };

  const toggleAudioRecording = () => {
    if (isRecordingAudio) {
      mediaRecorderRef.current?.stop();
      setIsRecordingAudio(false);
    } else {
      if (!videoRef.current?.srcObject) return;
      chunksRef.current = [];
      const stream = videoRef.current.srcObject as MediaStream;
      const audioStream = new MediaStream(stream.getAudioTracks());
      const mediaRecorder = new MediaRecorder(audioStream);
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          setIsAnalyzing(true);
          try {
            const result = await analyzeAudio(base64, 'audio/webm');
            setCaptureResult({ type: 'audio', data: result });
          } catch (e) {
            console.error(e);
          } finally {
            setIsAnalyzing(false);
          }
        };
        reader.readAsDataURL(blob);
      };
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecordingAudio(true);
    }
  };

  return (
    <div className="w-full h-full bg-black flex flex-col relative overflow-hidden">
      <canvas ref={canvasRef} width={640} height={480} className="hidden" />
      
      <div className="absolute inset-0 z-0">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover opacity-60 grayscale contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />
        
        {/* Scanning Line Effect */}
        {isActive && (
          <motion.div 
            initial={{ top: '0%' }}
            animate={{ top: '100%' }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-[1px] bg-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.5)] z-10"
          />
        )}
      </div>

      <div className="relative z-10 flex-1 flex flex-col p-8">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h2 className="text-white font-mono text-2xl uppercase tracking-[0.3em] flex items-center gap-3">
              <Camera size={24} className={isActive ? "text-emerald-500 animate-pulse" : "text-white/20"} />
              The Lens
            </h2>
            <p className="text-white/40 text-[10px] uppercase tracking-widest">Spatial Aesthetic Capture Engine</p>
          </div>
          
          <button 
            onClick={isActive ? stopLens : startLens}
            disabled={isConnecting}
            className={`px-6 py-3 rounded-full font-mono text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 ${
              isActive 
                ? "bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white" 
                : "bg-white text-black hover:bg-emerald-500 hover:text-white"
            }`}
          >
            {isConnecting ? <Loader2 className="animate-spin" size={14} /> : isActive ? <Square size={14} /> : <Play size={14} />}
            {isConnecting ? "Initializing..." : isActive ? "Terminate" : "Activate"}
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-end pb-12">
          <AnimatePresence mode="wait">
            {currentReading && !captureResult ? (
              <motion.div
                key={currentReading}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-2xl mb-8"
              >
                <div className="text-emerald-500 font-mono text-[10px] uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                  <Sparkles size={12} /> Scribe Reading
                </div>
                <p className="text-white font-serif italic text-3xl leading-tight tracking-tight">
                  "{currentReading}"
                </p>
              </motion.div>
            ) : captureResult ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mb-8 bg-black/60 p-6 rounded-xl border border-white/10 backdrop-blur-md"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="text-emerald-500 font-mono text-[10px] uppercase tracking-[0.4em] flex items-center gap-2">
                    <Zap size={12} /> {captureResult.type} Analysis
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={handleSaveToPocket} disabled={isSaving} className="text-emerald-500 hover:text-emerald-400 disabled:opacity-50">
                      {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    </button>
                    <button onClick={() => setCaptureResult(null)} className="text-white/50 hover:text-white">
                      <X size={16} />
                    </button>
                  </div>
                </div>
                <div className="space-y-4 text-white">
                  {captureResult.data.directors_note && (
                    <p className="font-serif italic text-xl">"{captureResult.data.directors_note}"</p>
                  )}
                  {captureResult.data.lighting_analysis && (
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-white/50 block mb-1">Lighting</span>
                      <p className="text-sm">{captureResult.data.lighting_analysis}</p>
                    </div>
                  )}
                  {captureResult.data.cultural_parallel && (
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-white/50 block mb-1">Cultural Parallel</span>
                      <p className="text-sm">{captureResult.data.cultural_parallel}</p>
                    </div>
                  )}
                  {captureResult.data.semiotic_touchpoints && (
                    <div className="flex flex-wrap gap-2">
                      {captureResult.data.semiotic_touchpoints.map((t: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-white/10 rounded text-[10px] uppercase tracking-widest">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-white/20 font-serif italic text-2xl mb-8"
              >
                Waiting for spatial resonance...
              </motion.div>
            )}
          </AnimatePresence>

          {isActive && (
            <div className="flex items-center gap-4">
              <button 
                onClick={captureImage}
                disabled={isAnalyzing || isRecordingVideo || isRecordingAudio}
                className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors disabled:opacity-50"
              >
                {isAnalyzing ? <Loader2 className="animate-spin" size={18} /> : <ImageIcon size={18} />}
              </button>
              <button 
                onClick={toggleVideoRecording}
                disabled={isAnalyzing || isRecordingAudio}
                className={`w-12 h-12 rounded-full border flex items-center justify-center transition-colors disabled:opacity-50 ${
                  isRecordingVideo ? "bg-red-500 text-white border-red-500 animate-pulse" : "bg-white/10 border-white/20 text-white hover:bg-white hover:text-black"
                }`}
              >
                <Video size={18} />
              </button>
              <button 
                onClick={toggleAudioRecording}
                disabled={isAnalyzing || isRecordingVideo}
                className={`w-12 h-12 rounded-full border flex items-center justify-center transition-colors disabled:opacity-50 ${
                  isRecordingAudio ? "bg-red-500 text-white border-red-500 animate-pulse" : "bg-white/10 border-white/20 text-white hover:bg-white hover:text-black"
                }`}
              >
                <Mic size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Real-time Telemetry */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-white/10 pt-8">
          <div className="space-y-1">
            <div className="text-[8px] text-white/30 uppercase tracking-widest">Signal Strength</div>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                animate={{ width: isActive ? '85%' : '0%' }}
                className="h-full bg-emerald-500"
              />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-[8px] text-white/30 uppercase tracking-widest">Aesthetic Entropy</div>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                animate={{ width: isActive ? '42%' : '0%' }}
                className="h-full bg-white/40"
              />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-[8px] text-white/30 uppercase tracking-widest">Latent Depth</div>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                animate={{ width: isActive ? '68%' : '0%' }}
                className="h-full bg-white/40"
              />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-[8px] text-white/30 uppercase tracking-widest">Registry Sync</div>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-white/10"}`} />
              <span className="text-[10px] text-white/50 font-mono uppercase tracking-widest">
                {isActive ? "Connected" : "Idle"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TheLens;
