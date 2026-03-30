import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getProfileByHandle } from '../services/firebaseUtils';
import { UserProfile } from '../types';
import { AestheticDNA } from './AestheticDNA';
import { Loader2, Share2, ShieldAlert } from 'lucide-react';

export const PublicDnaBadge: React.FC<{ handle: string }> = ({ handle }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const p = await getProfileByHandle(handle);
        if (p) {
          setProfile(p);
        } else {
          setError('Profile not found.');
        }
      } catch (e) {
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [handle]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">
        <Loader2 className="animate-spin text-white/50" size={24} />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center font-mono space-y-4">
        <ShieldAlert size={32} className="text-red-500" />
        <p className="text-white/50 uppercase tracking-widest text-xs">{error || 'Identity not found.'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 font-mono selection:bg-white/30">
      <div className="w-full max-w-2xl space-y-12">
        <header className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-serif italic tracking-tighter">@{profile.handle}</h1>
          <p className="text-xs text-white/50 uppercase tracking-[0.3em]">Aesthetic DNA Registry</p>
        </header>

        {profile.aestheticDNA ? (
          <div className="bg-[#0A0A0A] border border-white/10 p-8">
            <AestheticDNA dna={profile.aestheticDNA} />
          </div>
        ) : (
          <div className="text-center p-12 border border-white/10 border-dashed">
            <p className="text-white/50 italic font-serif">DNA sequence not yet synthesized.</p>
          </div>
        )}

        <footer className="flex justify-center">
          <button 
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('DNA Link Copied');
            }}
            className="flex items-center gap-2 px-6 py-3 border border-white/20 hover:bg-white/5 transition-colors text-xs uppercase tracking-widest"
          >
            <Share2 size={14} />
            Copy DNA Link
          </button>
        </footer>
      </div>
    </div>
  );
};
