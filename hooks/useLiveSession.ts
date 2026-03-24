
import { useState, useRef, useEffect, useCallback } from 'react';
import { LiveServerMessage, Modality } from '@google/genai';
import { getClient } from '../services/geminiService';

// Audio helpers
function floatTo16BitPCM(input: Float32Array) {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return output;
}

function base64ToUint8Array(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const useLiveSession = (systemInstruction: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  
  // Refs for cleanup
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  // Audio Playback Queue
  const nextStartTimeRef = useRef<number>(0);
  const audioQueueRef = useRef<AudioBufferSourceNode[]>([]);

  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (processorRef.current && inputContextRef.current) {
      processorRef.current.disconnect();
      if (sourceRef.current) sourceRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (inputContextRef.current) {
      inputContextRef.current.close();
      inputContextRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    // Note: Gemini SDK doesn't expose an explicit .close() on the session object easily in this version, 
    // but stopping the stream effectively ends interaction.
    sessionRef.current = null;
    setIsConnected(false);
    setIsSpeaking(false);
  }, []);

  const disconnect = useCallback(() => {
    cleanup();
  }, [cleanup]);

  const connect = useCallback(async (retries = 3) => {
    setError(null);
    
    for (let i = 0; i < retries; i++) {
      try {
        const { ai } = getClient();
        
        // 1. Setup Audio Output Context (24kHz for Gemini output)
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
        
        // 2. Setup Audio Input Context (16kHz for Gemini input)
        inputContextRef.current = new AudioContextClass({ sampleRate: 16000 });
        
        // 3. Setup Analyser for Visualizer
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        analyserRef.current.connect(audioContextRef.current.destination);
        
        // 4. Connect Live Session
        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: systemInstruction,
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {}
          },
          callbacks: {
            onopen: async () => {
              setIsConnected(true);
              
              // Start Mic Stream
              try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                streamRef.current = stream;
                
                if (!inputContextRef.current) return;
                
                const source = inputContextRef.current.createMediaStreamSource(stream);
                sourceRef.current = source;
                
                const processor = inputContextRef.current.createScriptProcessor(4096, 1, 1);
                processorRef.current = processor;
                
                processor.onaudioprocess = (e) => {
                  const inputData = e.inputBuffer.getChannelData(0);
                  const pcmData = floatTo16BitPCM(inputData);
                  const uint8Buffer = new Uint8Array(pcmData.buffer);
                  
                  // Convert to base64 manually to avoid dependency issues
                  let binary = '';
                  const len = uint8Buffer.byteLength;
                  for (let i = 0; i < len; i++) {
                    binary += String.fromCharCode(uint8Buffer[i]);
                  }
                  const base64 = btoa(binary);
  
                  sessionPromise.then(session => {
                    session.sendRealtimeInput({
                      audio: {
                        mimeType: 'audio/pcm;rate=16000',
                        data: base64
                      }
                    });
                  });
                };
                
                source.connect(processor);
                processor.connect(inputContextRef.current.destination);
              } catch (e: any) {
                console.warn("Mic Access Failed", e);
                if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
                  setError("Microphone permission denied. Enable in browser.");
                } else if (e.name === 'NotFoundError' || (e.message && e.message.includes('Requested device not found'))) {
                  setError("No microphone detected.");
                } else {
                  setError("Audio input system failure.");
                }
                // Clean up if mic fails but connection succeeded
                disconnect();
              }
            },
            onmessage: async (msg: LiveServerMessage) => {
              // Handle Transcriptions
              if (msg.serverContent?.modelTurn?.parts) {
                msg.serverContent.modelTurn.parts.forEach(part => {
                  if (part.text) {
                    setTranscript(prev => prev + part.text);
                  }
                });
              }

              // Handle Audio Output
              const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (audioData && audioContextRef.current) {
                setIsSpeaking(true);
                const bytes = base64ToUint8Array(audioData);
                
                // Manual PCM decoding (16-bit little-endian to float)
                const dataInt16 = new Int16Array(bytes.buffer);
                const audioBuffer = audioContextRef.current.createBuffer(1, dataInt16.length, 24000);
                const channelData = audioBuffer.getChannelData(0);
                for (let i = 0; i < dataInt16.length; i++) {
                  channelData[i] = dataInt16[i] / 32768.0;
                }
  
                const source = audioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                
                // Connect to analyser instead of direct destination
                if (analyserRef.current) {
                  source.connect(analyserRef.current);
                } else {
                  source.connect(audioContextRef.current.destination);
                }
                
                const currentTime = audioContextRef.current.currentTime;
                const startTime = Math.max(currentTime, nextStartTimeRef.current);
                nextStartTimeRef.current = startTime + audioBuffer.duration;
                
                source.start(startTime);
                source.onended = () => {
                   // Simple heuristic: if queue implies silence, toggle state
                   if (audioContextRef.current && audioContextRef.current.currentTime >= nextStartTimeRef.current) {
                       setIsSpeaking(false);
                   }
                };
                audioQueueRef.current.push(source);
              }
  
              if (msg.serverContent?.interrupted) {
                 audioQueueRef.current.forEach(s => {
                     try { s.stop(); } catch(e) {}
                 });
                 audioQueueRef.current = [];
                 nextStartTimeRef.current = 0;
                 setIsSpeaking(false);
              }
            },
            onclose: () => {
              setIsConnected(false);
              cleanup();
            },
            onerror: (e) => {
              console.error("Live Session Error", e);
              setError("Connection severed by server.");
              setIsConnected(false);
              cleanup();
            }
          }
        });
        
        sessionRef.current = await sessionPromise;
        return; // Success
      } catch (e: any) {
        console.error(`Connection Attempt ${i + 1} Failed`, e);
        cleanup(); // Ensure clean state before retry
        
        if (i === retries - 1) {
          setError(e.message || "Failed to establish link.");
          setIsConnected(false);
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    }
  }, [systemInstruction, cleanup, disconnect]);

  const sendVideoFrame = useCallback((base64Image: string) => {
    if (sessionRef.current) {
        sessionRef.current.sendRealtimeInput({
            video: {
                mimeType: 'image/jpeg',
                data: base64Image
            }
        });
    }
  }, []);

  useEffect(() => {
    return () => cleanup();
  }, []);

  return { connect, disconnect, isConnected, isSpeaking, volume, error, sendVideoFrame, analyser: analyserRef.current, transcript };
};
