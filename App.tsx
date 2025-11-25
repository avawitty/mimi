


import React, { useState, useCallback } from 'react';
import { AppState, ZineContent, ToneTag, ZineMetadata } from './types';
import { createZine, MediaFile } from './services/geminiService';
import { saveZineToProfile } from './services/firebase';
import { InputStudio } from './components/InputStudio';
import { AnalysisDisplay } from './components/AnalysisDisplay';
import { ElevatorLoader } from './components/ElevatorLoader';
import { UserProvider, useUser } from './contexts/UserContext';
import { OnboardingModal } from './components/OnboardingModal';
import { Shelf } from './components/Shelf';
import { ArchiveView } from './components/ArchiveView';
import { ArchetypeIndex } from './components/ArchetypeIndex';
import { UserProfileView } from './components/UserProfileView';
import { BookOpen, Library, PenTool, Users, Star, User, Hash } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, profile, isOnboardingComplete } = useUser();
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [zineMetadata, setZineMetadata] = useState<ZineMetadata | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [view, setView] = useState<'create' | 'status-quo' | 'clique' | 'archive' | 'index' | 'profile'>('create');

  const handleRefine = useCallback(async (text: string, mediaFiles: MediaFile[], tone: ToneTag, useSearch: boolean, coverImageUrl?: string) => {
    setAppState(AppState.THINKING);
    setErrorMsg(null);
    try {
      // 1. Generate Zine with Gemini (Text + Media + Tone + Profile + Search)
      const content = await createZine(text, mediaFiles, tone, profile, useSearch);

      // 1.5 Inject cover image if provided manually. 
      if (coverImageUrl) {
         const coverPage = content.pages.find(p => p.layoutType === 'cover');
         if (coverPage) {
            coverPage.originalMediaUrl = coverImageUrl;
            coverPage.mediaType = 'image';
         }
      }

      // 2. Persist to Firebase if user exists
      let id = 'pending';
      const safeCoverUrl = coverImageUrl || null; // Explicit null for Firestore safety

      if (user && profile) {
        id = await saveZineToProfile(user.uid, profile.handle, profile.photoURL, content, tone, safeCoverUrl);
      }

      const metadata: ZineMetadata = {
        id,
        userId: user?.uid || 'anon',
        userHandle: profile?.handle || 'Anonymous',
        userAvatar: profile?.photoURL,
        title: content.title,
        tone: tone,
        coverImageUrl: safeCoverUrl,
        timestamp: Date.now(),
        likes: 0,
        content: content
      };

      setZineMetadata(metadata);
      setAppState(AppState.REVEALED);

    } catch (error) {
      console.error(error);
      setErrorMsg("Mimi is currently unavailable. She's closing the issue.");
      setAppState(AppState.ERROR);
    }
  }, [user, profile]);

  const handleReset = useCallback(() => {
    setZineMetadata(null);
    setAppState(AppState.IDLE);
    setErrorMsg(null);
  }, []);

  const handleOpenZine = (metadata: ZineMetadata) => {
    setZineMetadata(metadata);
    setAppState(AppState.REVEALED);
  };

  if (!isOnboardingComplete) {
    return <OnboardingModal />;
  }

  return (
    <div className="min-h-screen w-full bg-nous-base text-nous-text selection:bg-nous-blush selection:text-nous-text font-serif overflow-x-hidden pb-24 md:pb-0">
      
      {/* Desktop Header */}
      <header className="hidden md:flex fixed top-0 left-0 w-full p-8 md:p-12 z-50 pointer-events-none mix-blend-multiply justify-between items-start">
        <div onClick={() => { setView('create'); handleReset(); }} className="pointer-events-auto cursor-pointer group">
          <h1 className="font-serif text-[8rem] xl:text-[12rem] italic leading-[0.75] tracking-tighter text-nous-text group-hover:text-nous-accent transition-colors duration-500 scale-y-110 origin-top-left">
            Mimi.
          </h1>
          <span className="hidden md:block font-sans text-[11px] tracking-[0.3em] uppercase text-nous-subtle mt-6 ml-2 group-hover:text-nous-text transition-colors">
            {profile?.handle}
          </span>
        </div>
        
        <nav className="pointer-events-auto flex gap-6 bg-nous-base/80 backdrop-blur-md px-4 py-2 rounded-full border border-stone-100 shadow-sm mt-4">
           {(['create', 'status-quo', 'clique', 'archive', 'index', 'profile'] as const).map((v) => (
             <button 
               key={v}
               onClick={() => { setView(v); handleReset(); }}
               className={`font-sans text-[10px] tracking-[0.2em] uppercase transition-colors ${view === v ? 'text-nous-text font-bold' : 'text-nous-subtle hover:text-nous-text'}`}
             >
               {v === 'create' ? 'Studio' : v.replace('-', ' ')}
             </button>
           ))}
        </nav>
      </header>

      {/* Mobile Header (Fixed & Layered) */}
      <header className="md:hidden fixed top-0 left-0 w-full p-6 z-30 bg-nous-base/95 backdrop-blur-md border-b border-stone-100 flex justify-between items-center shadow-sm h-20">
         <div onClick={() => { setView('create'); handleReset(); }}>
           <h1 className="font-serif text-5xl italic leading-none tracking-tighter text-nous-text">Mimi.</h1>
           <span className="font-sans text-[8px] uppercase tracking-widest text-nous-subtle block mt-1">(Everyone)</span>
         </div>
         <button onClick={() => { setView('profile'); handleReset(); }} className="font-sans text-[9px] tracking-widest uppercase text-nous-subtle hover:text-nous-text transition-colors border border-stone-200 rounded-full px-3 py-1">
           {profile?.handle}
         </button>
      </header>

      {/* Main Content Area */}
      <main className="relative min-h-screen flex flex-col">
        
        {/* VIEW: STATUS-QUO (Community) */}
        {view === 'status-quo' && appState === AppState.IDLE && (
          <div className="animate-fade-in w-full pt-24 md:pt-48">
             <div className="px-6 md:px-12 mb-8 mt-4 md:mt-12">
               <h2 className="font-serif text-3xl italic text-nous-text">The Status Quo</h2>
               <p className="font-sans text-[10px] uppercase tracking-widest text-nous-subtle">
                 Community Issues
               </p>
             </div>
             <Shelf variant="community" onSelectZine={handleOpenZine} />
          </div>
        )}

        {/* VIEW: CLIQUE (Circle) */}
        {view === 'clique' && appState === AppState.IDLE && (
          <div className="animate-fade-in w-full pt-24 md:pt-48">
             <div className="px-6 md:px-12 mb-8 mt-4 md:mt-12">
               <h2 className="font-serif text-3xl italic text-nous-text">The Clique</h2>
               <p className="font-sans text-[10px] uppercase tracking-widest text-nous-subtle">
                 Inner Circle Feeds
               </p>
             </div>
             <Shelf variant="clique" onSelectZine={handleOpenZine} />
          </div>
        )}

        {/* VIEW: ARCHIVE (Personal + Pocket) */}
        {view === 'archive' && appState === AppState.IDLE && (
          <ArchiveView onSelectZine={handleOpenZine} />
        )}

        {/* VIEW: INDEX */}
        {view === 'index' && appState === AppState.IDLE && (
           <div className="pt-24 md:pt-48 mt-4 md:mt-12">
             <ArchetypeIndex onSelectZine={handleOpenZine} />
           </div>
        )}

        {/* VIEW: PROFILE */}
        {view === 'profile' && appState === AppState.IDLE && (
           <div className="pt-24 md:pt-48 mt-4 md:mt-12">
             <UserProfileView />
           </div>
        )}

        {/* VIEW: STUDIO / READING */}
        {((view === 'create') || appState === AppState.REVEALED) && (
          <>
            {appState === AppState.IDLE && (
              <InputStudio onRefine={handleRefine} isThinking={false} />
            )}

            {appState === AppState.THINKING && (
              <ElevatorLoader />
            )}

            {appState === AppState.REVEALED && zineMetadata && (
              <div className="pt-24 md:pt-48">
                <AnalysisDisplay metadata={zineMetadata} onReset={handleReset} />
              </div>
            )}

            {appState === AppState.ERROR && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 pt-32">
                <p className="font-serif text-xl italic text-red-900/60 mb-8 text-center max-w-md">
                  {errorMsg}
                </p>
                <button
                  onClick={() => setAppState(AppState.IDLE)}
                  className="font-sans text-xs tracking-[0.2em] uppercase text-nous-text border-b border-nous-text pb-1 hover:opacity-50 transition-opacity"
                >
                  Return
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-lg border-t border-stone-200 flex justify-around items-center py-2 px-2 z-50 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.02)]">
        <button 
          onClick={() => { setView('create'); handleReset(); }}
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${view === 'create' ? 'text-nous-text' : 'text-stone-400'}`}
        >
          <PenTool size={18} strokeWidth={1.5} />
          <span className="text-[7px] uppercase tracking-widest">Studio</span>
        </button>
        <button 
          onClick={() => { setView('status-quo'); handleReset(); }}
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${view === 'status-quo' ? 'text-nous-text' : 'text-stone-400'}`}
        >
          <Users size={18} strokeWidth={1.5} />
          <span className="text-[7px] uppercase tracking-widest">Feed</span>
        </button>
        <button 
          onClick={() => { setView('clique'); handleReset(); }}
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${view === 'clique' ? 'text-nous-text' : 'text-stone-400'}`}
        >
          <Hash size={18} strokeWidth={1.5} />
          <span className="text-[7px] uppercase tracking-widest">Clique</span>
        </button>
        <button 
          onClick={() => { setView('archive'); handleReset(); }}
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${view === 'archive' ? 'text-nous-text' : 'text-stone-400'}`}
        >
          <Library size={18} strokeWidth={1.5} />
          <span className="text-[7px] uppercase tracking-widest">Archive</span>
        </button>
        <button 
          onClick={() => { setView('profile'); handleReset(); }}
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${view === 'profile' ? 'text-nous-text' : 'text-stone-400'}`}
        >
          <User size={18} strokeWidth={1.5} />
          <span className="text-[7px] uppercase tracking-widest">Me</span>
        </button>
      </nav>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <UserProvider>
      <MainApp />
    </UserProvider>
  );
};

export default App;