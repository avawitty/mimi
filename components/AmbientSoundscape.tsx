import React, { useEffect, useRef, useState, useCallback } from 'react';

export type SoundType = 'click' | 'manifest' | 'error' | 'success' | 'transition' | 'shimmer';

interface AmbientSoundscapeProps {
  enabled: boolean;
  volume?: number;
}

export const AmbientSoundscape: React.FC<AmbientSoundscapeProps> = ({ enabled, volume = 0.5 }) => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const droneSourcesRef = useRef<AudioScheduledSourceNode[]>([]);
  const droneGainRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  const initAudio = () => {
    if (audioCtxRef.current) return;
    const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Create master gain
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.setValueAtTime(enabled ? volume : 0, ctx.currentTime);
    
    audioCtxRef.current = ctx;
    masterGainRef.current = masterGain;
  };

  const safeConnect = (node: AudioNode, destination: AudioNode | AudioParam) => {
    try {
      if (!node || !destination) return;
      node.connect(destination as any);
    } catch (e) {
      // Silent fail for audio connections
    }
  };

  const startDrone = () => {
    if (!audioCtxRef.current || !masterGainRef.current || droneSourcesRef.current.length > 0) return;

    const ctx = audioCtxRef.current;
    const master = masterGainRef.current;

    const droneGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // 1. Sub-Bass Sine (Deep Low Freq)
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(55, ctx.currentTime); // A1 - Very deep

    // 2. Texture Noise (The "Low Freq Noise" loop)
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(120, ctx.currentTime);
    filter.Q.setValueAtTime(1.5, ctx.currentTime);

    droneGain.gain.setValueAtTime(0, ctx.currentTime);
    droneGain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 5); // Subtle entry

    safeConnect(osc, filter);
    safeConnect(noise, filter);
    safeConnect(filter, droneGain);
    safeConnect(droneGain, master);

    osc.start();
    noise.start();

    // LFO for subtle "breathing" movement
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(0.08, ctx.currentTime);
    lfoGain.gain.setValueAtTime(30, ctx.currentTime);
    safeConnect(lfo, lfoGain);
    safeConnect(lfoGain, filter.frequency);
    lfo.start();

    droneSourcesRef.current = [osc, noise, lfo];
    droneGainRef.current = droneGain;
    filterRef.current = filter;
  };

  const stopDrone = () => {
    if (droneGainRef.current && audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      const gain = droneGainRef.current;
      const sources = droneSourcesRef.current;
      
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5); // Slow fade out
      
      setTimeout(() => {
        sources.forEach(s => {
          try { s.stop(); } catch(e) {}
        });
        droneSourcesRef.current = [];
        droneGainRef.current = null;
      }, 1600);
    }
  };

  const playSound = useCallback((type: SoundType) => {
    if (!enabled || !audioCtxRef.current || !masterGainRef.current) return;
    const ctx = audioCtxRef.current;
    const master = masterGainRef.current;
    
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    const soundGain = ctx.createGain();
    safeConnect(soundGain, master);
    soundGain.gain.setValueAtTime(0.15, now);

    switch (type) {
      case 'click': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.03);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        safeConnect(osc, gain);
        safeConnect(gain, soundGain);
        osc.start();
        osc.stop(now + 0.03);
        break;
      }
      case 'manifest': {
        [0, 1, 2].forEach(i => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          const freq = 300 + i * 200;
          osc.frequency.setValueAtTime(freq, now + i * 0.05);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + i * 0.05 + 0.3);
          gain.gain.setValueAtTime(0, now + i * 0.05);
          gain.gain.linearRampToValueAtTime(0.05, now + i * 0.05 + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.3);
          safeConnect(osc, gain);
          safeConnect(gain, soundGain);
          osc.start(now + i * 0.05);
          osc.stop(now + i * 0.05 + 0.3);
        });
        break;
      }
      case 'error': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        safeConnect(osc, gain);
        safeConnect(gain, soundGain);
        osc.start();
        osc.stop(now + 0.2);
        break;
      }
      case 'success': {
        [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + i * 0.06);
          gain.gain.setValueAtTime(0, now + i * 0.06);
          gain.gain.linearRampToValueAtTime(0.05, now + i * 0.06 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.3);
          safeConnect(osc, gain);
          safeConnect(gain, soundGain);
          osc.start(now + i * 0.06);
          osc.stop(now + i * 0.06 + 0.3);
        });
        break;
      }
      case 'transition': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(60, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.8);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.1, now + 0.2);
        gain.gain.linearRampToValueAtTime(0, now + 0.8);
        safeConnect(osc, gain);
        safeConnect(gain, soundGain);
        osc.start();
        osc.stop(now + 0.8);
        break;
      }
      case 'shimmer': {
        const noise = ctx.createBufferSource();
        const bufferSize = ctx.sampleRate * 0.3;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(3000, now);
        filter.frequency.exponentialRampToValueAtTime(6000, now + 0.3);
        filter.Q.setValueAtTime(2, now); // Lower Q = less glitchy

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.02, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        safeConnect(noise, filter);
        safeConnect(filter, gain);
        safeConnect(gain, soundGain);
        noise.start();
        noise.stop(now + 0.3);
        break;
      }
    }
  }, [enabled]);

  useEffect(() => {
    const handleSoundEvent = (e: any) => {
      if (e.detail?.type) {
        playSound(e.detail.type);
      }
    };

    window.addEventListener('mimi:sound', handleSoundEvent);
    return () => window.removeEventListener('mimi:sound', handleSoundEvent);
  }, [playSound]);

  useEffect(() => {
    if (enabled) {
      initAudio();
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      if (masterGainRef.current) {
        masterGainRef.current.gain.setTargetAtTime(volume, audioCtxRef.current!.currentTime, 0.1);
      }
      startDrone();
    } else {
      if (masterGainRef.current && audioCtxRef.current) {
        masterGainRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.1);
      }
      stopDrone();
      // Suspend context after a short delay to allow ramps to finish
      setTimeout(() => {
        if (!enabled && audioCtxRef.current?.state === 'running') {
          audioCtxRef.current.suspend();
        }
      }, 1000);
    }
  }, [enabled, volume]);

  return null;
};
