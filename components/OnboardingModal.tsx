
import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { UserProfile } from '../types';
import { uploadFile } from '../services/firebase';
import { Sparkles, ArrowRight } from 'lucide-react';

export const OnboardingModal: React.FC = () => {
  const { user, updateProfile } = useUser();
  const [step, setStep] = useState(0); // 0: Manifesto, 1: Identity, 2: Visage, 3: Calibration
  const [handle, setHandle] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Calibration State
  const [processingMode, setProcessingMode] = useState<UserProfile['processingMode'] | null>(null);
  const [currentSeason, setCurrentSeason] = useState<UserProfile['currentSeason'] | null>(null);
  const [coreNeed, setCoreNeed] = useState<UserProfile['coreNeed'] | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!user || !handle || !processingMode || !currentSeason || !coreNeed) return;
    setIsSubmitting(true);

    let photoURL = '';
    if (avatarFile) {
      try {
        photoURL = await uploadFile(avatarFile, `avatars/${user.uid}`);
      } catch (e) {
        console.error("Avatar upload failed", e);
      }
    } else {
        // Generate abstract gradient avatar based on name if no file
        photoURL = `https://ui-avatars.com/api/?name=${handle}&background=random&color=fff`;
    }

    const newProfile: UserProfile = {
      uid: user.uid,
      handle,
      photoURL,
      processingMode,
      currentSeason,
      coreNeed,
      createdAt: Date.now()
    };

    await updateProfile(newProfile);
    setIsSubmitting(false);
  };

  const nextStep = () => setStep(s => s + 1);

  // STEP 0: MANIFESTO / PURPOSE
  if (step === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-nous-base flex flex-col items-center justify-center p-8 animate-fade-in text-center">
        <div className="max-w-md space-y-8">
           <div className="flex justify-center">
             <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center border border-stone-200">
               <Sparkles className="w-5 h-5 text-nous-text opacity-50" />
             </div>
           </div>
           
           <h1 className="font-serif text-3xl md:text-4xl italic text-nous-text">
             Mimi is a Style Engine.
           </h1>
           
           <div className="space-y-6 font-serif text-lg text-nous-accent leading-relaxed opacity-80">
             <p>
               This is not a chatbot. It is a curator for your subconscious.
             </p>
             <p>
               Input your raw queries, images, and fragments. 
               Mimi indexes them against cultural archetypes to build a 
               living archive of your taste and state of mind.
             </p>
           </div>

           <button
             onClick={nextStep}
             className="group mt-12 inline-flex items-center gap-3 font-sans text-xs tracking-[0.2em] uppercase text-nous-text border-b border-nous-text pb-1 hover:opacity-70 transition-all"
           >
             Initialize Engine <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
           </button>
        </div>
      </div>
    );
  }

  // STEP 1: IDENTITY
  if (step === 1) {
    return (
      <div className="fixed inset-0 z-50 bg-nous-base flex flex-col items-center justify-center p-8 animate-fade-in">
        <p className="font-sans text-xs tracking-[0.3em] uppercase text-nous-subtle mb-8">Phase I: Identity</p>
        <h2 className="font-serif text-4xl italic text-nous-text mb-12">Who are you in the dark?</h2>
        <input
          type="text"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="Enter your handle..."
          className="bg-transparent border-b border-stone-300 text-center font-serif text-2xl py-2 focus:outline-none focus:border-nous-text text-nous-text placeholder-stone-300 w-full max-w-md"
        />
        <button
          onClick={nextStep}
          disabled={!handle.trim()}
          className={`mt-12 font-sans text-xs tracking-[0.2em] uppercase border-b border-nous-text pb-1 transition-opacity ${!handle.trim() ? 'opacity-0' : 'opacity-100'}`}
        >
          Proceed
        </button>
      </div>
    );
  }

  // STEP 2: VISAGE
  if (step === 2) {
    return (
      <div className="fixed inset-0 z-50 bg-nous-base flex flex-col items-center justify-center p-8 animate-fade-in">
        <p className="font-sans text-xs tracking-[0.3em] uppercase text-nous-subtle mb-8">Phase II: Visage</p>
        <h2 className="font-serif text-4xl italic text-nous-text mb-12">Show us a glimpse.</h2>
        
        <div className="relative w-32 h-32 mb-8 rounded-full overflow-hidden bg-stone-100 border border-stone-200 flex items-center justify-center group cursor-pointer hover:border-nous-text transition-colors">
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <span className="text-stone-300 text-4xl font-light group-hover:text-stone-400">+</span>
          )}
          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleFileChange} />
        </div>

        <button
          onClick={nextStep}
          className="mt-8 font-sans text-xs tracking-[0.2em] uppercase border-b border-nous-text pb-1 hover:opacity-70"
        >
          {previewUrl ? 'Confirm Visage' : 'Skip & Remain Abstract'}
        </button>
      </div>
    );
  }

  // STEP 3: CALIBRATION
  if (step === 3) {
    const isComplete = processingMode && currentSeason && coreNeed;

    return (
      <div className="fixed inset-0 z-50 bg-nous-base flex flex-col items-center justify-center p-8 animate-fade-in overflow-y-auto">
        <p className="font-sans text-xs tracking-[0.3em] uppercase text-nous-subtle mb-8">Phase III: Calibration</p>
        
        <div className="space-y-12 w-full max-w-lg text-center">
          
          {/* Question 1 */}
          <div className="animate-slide-up" style={{animationDelay: '0.1s'}}>
            <h3 className="font-serif text-xl italic text-nous-text mb-4">How do you process memory?</h3>
            <div className="flex flex-wrap justify-center gap-3">
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

          {/* Question 2 */}
          <div className="animate-slide-up" style={{animationDelay: '0.2s'}}>
            <h3 className="font-serif text-xl italic text-nous-text mb-4">Your current season?</h3>
            <div className="flex flex-wrap justify-center gap-3">
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

          {/* Question 3 */}
          <div className="animate-slide-up" style={{animationDelay: '0.3s'}}>
            <h3 className="font-serif text-xl italic text-nous-text mb-4">What do you need?</h3>
            <div className="flex flex-wrap justify-center gap-3">
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

        <button
          onClick={handleSubmit}
          disabled={!isComplete || isSubmitting}
          className={`mt-16 font-sans text-xs tracking-[0.2em] uppercase border-b border-nous-text pb-1 transition-all ${!isComplete ? 'opacity-30' : 'opacity-100'} ${isSubmitting ? 'cursor-wait' : ''}`}
        >
          {isSubmitting ? 'Calibrating Engine...' : 'Enter Mimi'}
        </button>
      </div>
    );
  }

  return null;
};
