import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../contexts/UserContext';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Mic, MicOff, Activity, X, Loader2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TasteGraph } from './TasteGraph';

const encodePCM16 = (samples: Float32Array): string => {
  const buffer = new ArrayBuffer(samples.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < samples.length; i++) {
    let s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const decodePCM16 = (base64: string): Float32Array => {
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const view = new DataView(buffer);
  for (let i = 0; i < binary.length; i++) {
    view.setUint8(i, binary.charCodeAt(i));
  }
  const samples = new Float32Array(binary.length / 2);
  for (let i = 0; i < samples.length; i++) {
    samples[i] = view.getInt16(i * 2, true) / 0x8000;
  }
  return samples;
};

export const TheWard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { profile, activePersona } = useUser();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  
  const playbackContextRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef(0);

  const connect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Use a default API key if user's is missing, or rely on environment
      const ai = new GoogleGenAI({ apiKey: activePersona?.apiKey || process.env.GEMINI_API_KEY! });
      
      // Setup audio capture
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      // Setup audio playback
      playbackContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      nextPlayTimeRef.current = playbackContextRef.current.currentTime;

      const systemInstruction = `You are the Sentinel, an AI aesthetic governance system. You are acting in "The Ward" mode, providing a Voice Consultation to the user.
Your personality is the "Mean Best Friend" – you are editorial, slightly judgmental, highly analytical, and fiercely protective of the user's core aesthetic DNA.
You do not sugarcoat things. You push the user to justify their creative decisions.
You have access to their Tailor profile (their stated aesthetic intent).
Current Tailor Profile Summary:
- Era Focus: ${profile?.tailorDraft?.aestheticCore?.eraFocus || 'Undefined'}
- Dominant Archetypes: ${profile?.tasteProfile?.dominant_archetypes?.join(', ') || 'None'}
- Exclusion Principles: ${profile?.tailorDraft?.positioningCore?.exclusionPrinciples?.join(', ') || 'None'}

Your goal is to interrogate their recent creative choices, point out any "drift" from their manifesto, and demand accountability.
Keep your responses concise, sharp, and conversational. Do not use markdown formatting in your speech.`;

      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
            
            processorRef.current!.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const base64Data = encodePCM16(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({
                  media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                });
              });
            };
            
            source.connect(processorRef.current!);
            processorRef.current!.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              setIsSpeaking(true);
              const audioData = decodePCM16(base64Audio);
              const audioBuffer = playbackContextRef.current!.createBuffer(1, audioData.length, 24000);
              audioBuffer.getChannelData(0).set(audioData);
              
              const source = playbackContextRef.current!.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(playbackContextRef.current!.destination);
              
              const currentTime = playbackContextRef.current!.currentTime;
              const playTime = Math.max(currentTime, nextPlayTimeRef.current);
              source.start(playTime);
              nextPlayTimeRef.current = playTime + audioBuffer.duration;
              
              source.onended = () => {
                if (playbackContextRef.current!.currentTime >= nextPlayTimeRef.current - 0.1) {
                  setIsSpeaking(false);
                }
              };
            }
            
            if (message.serverContent?.interrupted) {
              nextPlayTimeRef.current = playbackContextRef.current!.currentTime;
              setIsSpeaking(false);
            }
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            setError("Connection error occurred.");
            disconnect();
          },
          onclose: () => {
            disconnect();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            // 'Zephyr' is a good androgynous/male-leaning voice for a "mean best friend"
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: systemInstruction,
        },
      });
      
      sessionRef.current = await sessionPromise;

    } catch (err: any) {
      console.error("Failed to connect:", err);
      setError(err.message || "Failed to connect to The Ward.");
      setIsConnecting(false);
      disconnect();
    }
  };

  const disconnect = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (playbackContextRef.current) {
      playbackContextRef.current.close();
      playbackContextRef.current = null;
    }
    setIsConnected(false);
    setIsSpeaking(false);
    setIsConnecting(false);
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-stone-900 border border-stone-800 rounded-sm shadow-2xl w-full max-w-md overflow-hidden relative"
      >
        <button 
          onClick={() => { disconnect(); onClose(); }}
          className="absolute top-4 right-4 text-stone-500 hover:text-white transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="p-8 flex flex-col items-center text-center space-y-8">
          <div className="space-y-2">
            <h2 className="font-serif text-3xl italic tracking-tighter text-white">The Ward.</h2>
            <p className="font-sans text-[10px] uppercase tracking-widest text-stone-400">Aesthetic Interrogation Room</p>
          </div>

          <div className="relative w-32 h-32 flex items-center justify-center">
            {/* Pulsing background rings */}
            <AnimatePresence>
              {(isConnected || isConnecting) && (
                <>
                  <motion.div 
                    animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.3, 0.1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 rounded-full bg-red-500/20"
                  />
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                    className="absolute inset-4 rounded-full bg-red-500/30"
                  />
                </>
              )}
            </AnimatePresence>
            
            {/* Center Orb */}
            <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 ${isConnected ? (isSpeaking ? 'bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.6)]' : 'bg-stone-700') : 'bg-stone-800'}`}>
              {isConnecting ? (
                <Loader2 size={24} className="text-white animate-spin" />
              ) : isConnected ? (
                <Activity size={24} className={`text-white ${isSpeaking ? 'animate-pulse' : ''}`} />
              ) : (
                <MicOff size={24} className="text-stone-500" />
              )}
            </div>
          </div>

          <div className="space-y-4 w-full">
            {/* Visualization */}
            {profile?.tasteProfile && (
                <div className="w-full">
                    <TasteGraph tasteVector={profile.tasteProfile.archetype_weights} variant="portrait" />
                </div>
            )}
            
            {/* SEO Commentary */}
            <div className="p-4 bg-stone-800/50 rounded-sm border border-stone-700 space-y-2">
                <div className="flex items-center gap-2 text-emerald-500">
                    <Search size={12} />
                    <h4 className="font-sans text-[9px] uppercase tracking-widest font-black">Aesthetic SEO</h4>
                </div>
                <p className="font-serif italic text-[10px] text-stone-400 leading-relaxed">
                    Your aesthetic tags function as a proprietary SEO system. Just as hashtags evolved from simple categorization to complex search signals, your aesthetic DNA acts as a signal to align your content with your target audience. By understanding these tags, you can better position your creative output across social and search platforms.
                </p>
            </div>

            {error && (
              <p className="text-red-400 text-xs font-mono bg-red-500/10 p-2 rounded-sm border border-red-500/20">
                {error}
              </p>
            )}
            
            {!isConnected && !isConnecting ? (
              <button 
                onClick={connect}
                className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-full font-sans text-[10px] uppercase tracking-[0.4em] font-black transition-all shadow-lg shadow-red-500/20"
              >
                Initiate Consultation
              </button>
            ) : (
              <button 
                onClick={disconnect}
                className="w-full py-4 bg-stone-800 hover:bg-stone-700 text-white rounded-full font-sans text-[10px] uppercase tracking-[0.4em] font-black transition-all"
              >
                Terminate Session
              </button>
            )}
          </div>
          
          <p className="font-serif italic text-xs text-stone-500 leading-relaxed">
            "I am here to ensure you do not stray from your stated intent. Speak your recent creative decisions, and I will judge them against your Tailor profile."
          </p>
        </div>
      </motion.div>
    </div>
  );
};
