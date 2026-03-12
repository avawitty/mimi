import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../contexts/UserContext';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Mic, MicOff, Activity, X, Loader2, Search, Target, Palette, Type } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TasteGraph } from './TasteGraph';
import { fetchUserZines } from '../services/firebaseUtils';

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
  const { profile } = useUser();

  return (
    <div className="fixed inset-0 z-50 bg-stone-50 dark:bg-stone-950 p-8 flex flex-col">
        <div className="flex justify-between items-center mb-8">
            <div className="space-y-1">
                <h2 className="font-serif text-4xl italic tracking-tighter text-stone-900 dark:text-white">The Ward.</h2>
                <p className="font-sans text-[10px] uppercase tracking-widest text-stone-500">Aesthetic Interrogation Room & SEO Alignment</p>
            </div>
            <button onClick={onClose} className="text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors">
                <X size={24} />
            </button>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 overflow-hidden">
            {/* Left: Graph & DNA */}
            <div className="overflow-y-auto space-y-8">
                {profile?.tasteProfile && (
                    <TasteGraph tasteVector={profile.tasteVector || profile.tasteProfile.archetype_weights} variant="diagnostic" />
                )}
            </div>

            {/* Right: Aesthetic SEO */}
            <div className="bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-sm p-8 space-y-6">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500">
                    <Search size={16} />
                    <h4 className="font-sans text-[10px] uppercase tracking-widest font-black">Aesthetic SEO Alignment</h4>
                </div>
                <p className="font-serif italic text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                    Your aesthetic DNA acts as a proprietary search signal. Current alignment analysis:
                </p>
                <div className="space-y-4">
                    <div className="p-4 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-sm">
                        <span className="font-mono text-[9px] text-emerald-500 uppercase">High Alignment</span>
                        <p className="font-sans text-xs text-stone-800 dark:text-stone-200 mt-1">Brutalist Architecture & Glacial Minimalism</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
