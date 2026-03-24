import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { generateSignatureImage } from '../services/geminiService';
import { AestheticSignature } from '../types';

interface Props {
  signature: AestheticSignature;
}

export const SignatureImageGenerator: React.FC<Props> = ({ signature }) => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateSignatureImage(signature);
      if (!result) {
        throw new Error("Generation failed or returned no image.");
      }
      setImage(result);
    } catch (error) {
      console.error("Failed to generate signature image", error);
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
        detail: { 
            message: "Oracle Overloaded. The frequency is too high.", 
            icon: <AlertCircle size={14} className="text-red-500" /> 
        } 
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#111] border border-stone-200 dark:border-stone-800 p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg italic font-light">Visual Synthesis</h3>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
        </button>
      </div>
      {image ? (
        <img src={image} alt="Aesthetic Signature" className="w-full h-auto" referrerPolicy="no-referrer" />
      ) : (
        <div className="w-full aspect-square bg-stone-100 dark:bg-stone-900 flex items-center justify-center text-stone-400 text-xs uppercase tracking-widest">
          Generate to visualize
        </div>
      )}
    </div>
  );
};
