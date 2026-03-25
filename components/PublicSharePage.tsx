import React, { useEffect, useState } from 'react';
import { getUserByHandle } from '../services/firebaseUtils';
import { UserProfile } from '../types';
import { Share2 } from 'lucide-react';

export const PublicSharePage: React.FC = () => {
 const [profile, setProfile] = useState<UserProfile | null>(null);
 const [loading, setLoading] = useState(true);
 const handle = window.location.pathname.split('/@')[1];

 useEffect(() => {
 const fetchProfile = async () => {
 if (handle) {
 const p = await getUserByHandle(handle);
 setProfile(p);
 }
 setLoading(false);
 };
 fetchProfile();
 }, [handle]);

 if (loading) return <div className="h-screen flex items-center justify-center font-serif italic text-stone-500">Manifesting...</div>;
 if (!profile) return <div className="h-screen flex items-center justify-center font-serif italic text-stone-500">Registry not found.</div>;

 return (
 <div className="min-h-screen bg dark:bg-stone-950 p-8 md:p-16 flex flex-col items-center">
 <div className="max-w-2xl w-full space-y-8">
 <div className="text-center space-y-2">
 <h1 className="font-header italic text-5xl text-stone-900 dark:text-white">@{profile.handle}</h1>
 <p className="font-sans text-[10px] uppercase tracking-[0.4em] text-stone-500 font-black">Sovereign Identity</p>
 </div>
 
 <div className="w-full bg-white dark:bg-stone-900 rounded-none border border-stone-100 dark:border-stone-800 p-8">
 <h2 className="font-serif italic text-2xl text-stone-900 dark:text-white mb-2">Aesthetic Identity</h2>
 <p className="font-sans text-[10px] uppercase tracking-widest text-stone-500 mb-6">Semantic Baseline</p>

 {profile?.tasteProfile ? (
 <div className="space-y-6">
 <div>
 <h3 className="text-[10px] uppercase tracking-widest font-mono text-stone-500 mb-3">Dominant Archetypes</h3>
 <div className="flex flex-wrap gap-2">
 {profile.tasteProfile.dominant_archetypes.map((archetype, i) => (
 <span key={i} className="px-4 py-2 bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-mono rounded-none border border-stone-200 dark:border-stone-700">
 {archetype}
 </span>
 ))}
 </div>
 </div>
 {profile.tasteProfile.constraints && profile.tasteProfile.constraints.length > 0 && (
 <div>
 <h3 className="text-[10px] uppercase tracking-widest font-mono text-stone-500 mb-3">Constraints</h3>
 <div className="flex flex-wrap gap-2">
 {profile.tasteProfile.constraints.map((constraint, i) => (
 <span key={i} className="px-4 py-2 bg-stone-50 dark:bg-stone-900/50 text-stone-600 dark:text-stone-400 text-xs font-mono rounded-none border border-stone-200 dark:border-stone-800">
 {constraint}
 </span>
 ))}
 </div>
 </div>
 )}
 </div>
 ) : (
 <div className="text-center p-8 border border-dashed border-stone-200 dark:border-stone-800 rounded-none">
 <p className="font-mono text-xs text-stone-400 uppercase tracking-widest">No Graph Data Detected</p>
 </div>
 )}
 </div>

 <div className="p-6 border border-stone-100 dark:border-stone-800 rounded-none bg-stone-50 dark:bg-stone-900/50">
 <h3 className="font-sans text-[10px] uppercase tracking-widest font-black text-stone-400 mb-4">Aesthetic Profile</h3>
 <p className="font-serif italic text-stone-700 dark:text-stone-300 leading-relaxed">
 {profile.tasteProfile?.semantic_signature ||"This registry has not yet manifested a descriptive signature."}
 </p>
 </div>

 <button 
 onClick={() => navigator.clipboard.writeText(window.location.href).catch(e => console.error("MIMI // Clipboard error", e))}
 className="w-full py-4 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-none font-sans text-[10px] uppercase tracking-[0.4em] font-black flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
 >
 <Share2 size={14} /> Share Taste Graph
 </button>
 </div>
 </div>
 );
};
