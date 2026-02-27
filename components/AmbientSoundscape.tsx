import React, { useEffect, useRef, useState, useCallback } from 'react';

export type SoundType = 'click' | 'manifest' | 'error' | 'success' | 'transition' | 'shimmer';

interface AmbientSoundscapeProps {
  enabled: boolean;
}

export const AmbientSoundscape: React.FC<AmbientSoundscapeProps> = ({ enabled }) => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const droneOscRef = useRef<OscillatorNode | null>(null);
  const droneGainRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);

  const initAudio = () => {
    if (audioCtxRef.current) return;
    const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
    if (!AudioContextClass) return;
    audioCtxRef.current = new AudioContextClass();
  };

  const safeConnect = (node: AudioNode, destination: AudioNode | AudioParam) => {
    try {
      if (!node || !destination) return;
      node.connect(destination as any);
    } catch (e) {
      console.warn("MIMI // Audio connection failed:", e);
    }
  };

  const startDrone = () => {
    if (!audioCtxRef.current || droneOscRef.current) return;

    const ctx = audioCtxRef.current;
    if (!ctx.destination) return;

    const gain = ctx.createGain();
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(55, ctx.currentTime); // A1

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, ctx.currentTime);
    filter.Q.setValueAtTime(1, ctx.currentTime);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 2);

    safeConnect(osc, filter);
    safeConnect(filter, gain);
    safeConnect(gain, ctx.destination);

    osc.start();

    // LFO for subtle movement
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(0.1, ctx.currentTime);
    lfoGain.gain.setValueAtTime(5, ctx.currentTime);
    safeConnect(lfo, lfoGain);
    safeConnect(lfoGain, filter.frequency);
    lfo.start();

    droneOscRef.current = osc;
    droneGainRef.current = gain;
    filterRef.current = filter;
  };

  const stopDrone = () => {
    if (droneGainRef.current && audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      droneGainRef.current.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
      setTimeout(() => {
        droneOscRef.current?.stop();
        droneOscRef.current = null;
        droneGainRef.current = null;
      }, 1100);
    }
  };

  const playSound = useCallback((type: SoundType) => {
    if (!enabled || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    if (!ctx.destination) return;
    const masterGain = ctx.createGain();
    safeConnect(masterGain, ctx.destination);
    masterGain.gain.setValueAtTime(0.2, now);

    switch (type) {
      case 'click': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        safeConnect(osc, gain);
        safeConnect(gain, masterGain);
        osc.start();
        osc.stop(now + 0.05);
        break;
      }
      case 'manifest': {
        for (let i = 0; i < 3; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          const freq = 200 + i * 150;
          osc.frequency.setValueAtTime(freq, now + i * 0.1);
          osc.frequency.exponentialRampToValueAtTime(freq * 2, now + i * 0.1 + 0.5);
          gain.gain.setValueAtTime(0, now + i * 0.1);
          gain.gain.linearRampToValueAtTime(0.1, now + i * 0.1 + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.6);
          safeConnect(osc, gain);
          safeConnect(gain, masterGain);
          osc.start(now + i * 0.1);
          osc.stop(now + i * 0.1 + 0.6);
        }
        break;
      }
      case 'error': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        safeConnect(osc, gain);
        safeConnect(gain, masterGain);
        osc.start();
        osc.stop(now + 0.3);
        break;
      }
      case 'success': {
        [440, 554.37, 659.25, 880].forEach((f, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + i * 0.08);
          gain.gain.setValueAtTime(0, now + i * 0.08);
          gain.gain.linearRampToValueAtTime(0.1, now + i * 0.08 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.4);
          safeConnect(osc, gain);
          safeConnect(gain, masterGain);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.4);
        });
        break;
      }
      case 'transition': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(40, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + 1);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.1);
        gain.gain.linearRampToValueAtTime(0, now + 1);
        safeConnect(osc, gain);
        safeConnect(gain, masterGain);
        osc.start();
        osc.stop(now + 1);
        break;
      }
      case 'shimmer': {
        const noise = ctx.createBufferSource();
        const bufferSize = ctx.sampleRate * 0.5;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2000, now);
        filter.frequency.exponentialRampToValueAtTime(8000, now + 0.5);
        filter.Q.setValueAtTime(10, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.05, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        safeConnect(noise, filter);
        safeConnect(filter, gain);
        safeConnect(gain, masterGain);
        noise.start();
        noise.stop(now + 0.5);
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
      startDrone();
    } else {
      stopDrone();
    }
  }, [enabled]);

  return null;
};
