

import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { UserProfile } from '../types';
import { uploadFile } from '../services/firebase';
import { Loader2, Save, Camera } from 'lucide-react';

export const UserProfileView: React.FC = () => {
  const { user, profile, updateProfile } = useUser();
  const [handle, setHandle] = useState('');
  const [processingMode, setProcessingMode] = useState<UserProfile['processingMode']>('movie');
  const [currentSeason, setCurrentSeason] = useState<UserProfile['currentSeason']>('blooming');
  const [coreNeed, setCoreNeed] = useState<UserProfile['coreNeed']>('truth');
  
  // Taste Archive Fields
  const [inspirations, setInspirations] = useState('');
  const [favoriteMedia, setFavoriteMedia] = useState('');
  const [keywords, setKeywords] = useState('');

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setHandle(profile.handle);
      setProcessingMode(profile.processingMode);
      setCurrentSeason(profile.currentSeason);
      setCoreNeed(profile.coreNeed);
      setPreviewUrl(profile.photoURL || null);
      if (profile.tasteProfile) {
        setInspirations(profile.tasteProfile.inspirations || '');
        setFavoriteMedia(profile.tasteProfile.favoriteMedia || '');
        setKeywords(profile.tasteProfile.keywords || '');
      }
    }
  }, [profile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;
    setIsSaving(true);
    setMessage(null);

    try {
      let photoURL = profile.photoURL;
      if (avatarFile) {
        photoURL = await uploadFile(avatarFile, `avatars/${user.uid}_${Date.now()}`);
      }

      const updatedProfile: UserProfile = {
        ...profile,
        handle,
        photoURL,
        processingMode,
        currentSeason,
        coreNeed,
        tasteProfile: {
           inspirations,
           favoriteMedia,
           keywords
        }
      };

      await updateProfile(updatedProfile);
      setMessage("Profile updated successfully.");
    } catch (e) {
      console.error("Failed to update profile", e);
      setMessage("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="w-full max-w-2xl mx-auto px-6 py-12 animate-fade-in">
      <h2 className="font-serif text-3xl italic text-nous-text mb-8 border-b border-stone-200 pb-4">Identity & Calibration</h2>

      <div className="space-y-12">
        
        {/* Avatar & Handle */}
        <div className="flex flex-col items-center gap-6">
          <div className="relative group cursor-pointer">
            <div className="w-32 h-32 rounded-full overflow-hidden border border-stone-200">
              {previewUrl ? (
                <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-300 text-4xl">+</div>
              )}
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="text-white w-8 h-8" />
            </div>
            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleFileChange} />
          </div>

          <div className="w-full max-w-xs">
            <label className="block font-sans text-[9px] uppercase tracking-widest text-nous-subtle mb-2 text-center">Handle</label>
            <input 
              type="text" 
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className="w-full bg-transparent border-b border-stone-300 text-center font-serif text-xl py-2 focus:outline-none focus:border-nous-text"
            />
          </div>
        </div>

        {/* Calibration Settings */}
        <div className="space-y-8">
          <div>
            <h3 className="font-sans text-[10px] uppercase tracking-widest text-nous-subtle mb-4">Processing Mode</h3>
            <div className="flex flex-wrap gap-3">
              {(['movie', 'list', 'fever-dream'] as const).map(opt => (
                <button
                  key={opt}
                  onClick={() => setProcessingMode(opt)}
                  className={`px-4 py-2 border rounded-full text-xs uppercase tracking-widest transition-all ${processingMode === opt ? 'bg-nous-text text-white border-nous-text' : 'border-stone-200 text-nous-subtle hover:border-nous-text'}`}
                >
                  {opt.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-sans text-[10px] uppercase tracking-widest text-nous-subtle mb-4">Current Season</h3>
            <div className="flex flex-wrap gap-3">
              {(['rotting', 'blooming', 'frozen', 'burning'] as const).map(opt => (
                <button
                  key={opt}
                  onClick={() => setCurrentSeason(opt)}
                  className={`px-4 py-2 border rounded-full text-xs uppercase tracking-widest transition-all ${currentSeason === opt ? 'bg-nous-text text-white border-nous-text' : 'border-stone-200 text-nous-subtle hover:border-nous-text'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-sans text-[10px] uppercase tracking-widest text-nous-subtle mb-4">Core Need</h3>
            <div className="flex flex-wrap gap-3">
              {(['truth', 'comfort', 'chaos', 'silence'] as const).map(opt => (
                <button
                  key={opt}
                  onClick={() => setCoreNeed(opt)}
                  className={`px-4 py-2 border rounded-full text-xs uppercase tracking-widest transition-all ${coreNeed === opt ? 'bg-nous-text text-white border-nous-text' : 'border-stone-200 text-nous-subtle hover:border-nous-text'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Taste Archive (New Section) */}
        <div className="pt-12 border-t border-stone-100">
           <h3 className="font-serif text-2xl italic text-nous-text mb-6">Taste Archive</h3>
           <p className="font-sans text-[10px] uppercase tracking-widest text-nous-subtle mb-8">
              Data points for future curation.
           </p>

           <div className="space-y-8">
               <div>
                  <label className="block font-sans text-[9px] uppercase tracking-widest text-nous-subtle mb-2">Aesthetic Inspirations</label>
                  <textarea 
                     value={inspirations}
                     onChange={(e) => setInspirations(e.target.value)}
                     placeholder="e.g. brutalist architecture, 90s anime, fog, lace..."
                     className="w-full bg-stone-50 border border-stone-200 p-4 font-serif text-sm focus:outline-none focus:border-nous-text h-24 resize-none"
                  />
               </div>

               <div>
                  <label className="block font-sans text-[9px] uppercase tracking-widest text-nous-subtle mb-2">Favorite Media (Books, Films, Audio)</label>
                  <textarea 
                     value={favoriteMedia}
                     onChange={(e) => setFavoriteMedia(e.target.value)}
                     placeholder="e.g. Chungking Express, The Bell Jar, Massive Attack..."
                     className="w-full bg-stone-50 border border-stone-200 p-4 font-serif text-sm focus:outline-none focus:border-nous-text h-24 resize-none"
                  />
               </div>

               <div>
                  <label className="block font-sans text-[9px] uppercase tracking-widest text-nous-subtle mb-2">Defining Keywords</label>
                  <input 
                     type="text"
                     value={keywords}
                     onChange={(e) => setKeywords(e.target.value)}
                     placeholder="e.g. liminal, soft, glitch, velvet"
                     className="w-full bg-transparent border-b border-stone-200 py-2 font-serif text-lg focus:outline-none focus:border-nous-text"
                  />
               </div>
           </div>
        </div>

        {/* Action */}
        <div className="flex flex-col items-center gap-4 pt-12 mt-12 border-t border-stone-100">
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3 bg-nous-text text-white font-sans text-xs tracking-[0.2em] uppercase hover:bg-nous-accent transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
          {message && <p className="font-sans text-[10px] uppercase tracking-widest text-nous-subtle animate-fade-in">{message}</p>}
        </div>

      </div>
    </div>
  );
};