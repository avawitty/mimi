import React, { useState } from 'react';
import { Sparkles, Loader2, Plus } from 'lucide-react';
import { scryLink, generateTagsFromMedia } from '../services/geminiService';
import { useUser } from '../contexts/UserContext';

export const ScryLinkInput: React.FC<{ onAddImages: (urls: string[]) => void }> = ({ onAddImages }) => {
    const [url, setUrl] = useState('');
    const [isScrying, setIsScrying] = useState(false);
    const { profile } = useUser();

    const handleScry = async () => {
        if (!url.trim()) return;
        setIsScrying(true);
        try {
            const result = await scryLink(url, profile);
            if (result && result.imageUrls) {
                // Generate tags for the scryed images
                const tags = await generateTagsFromMedia(`Scryed images from: ${url}`, []);
                console.log("MIMI // Scryed tags:", tags);
                
                onAddImages(result.imageUrls);
                setUrl('');
            }
        } catch (e) {
            console.error("MIMI // Scry Failed:", e);
        } finally {
            setIsScrying(false);
        }
    };

    return (
        <div className="mt-6 p-4 border border-stone-200 dark:border-stone-800 rounded-sm bg-stone-50 dark:bg-stone-900">
            <h4 className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-400 mb-2">Scry Link</h4>
            <div className="flex gap-2">
                <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Paste Instagram/Pinterest URL..."
                    className="bg-transparent border-b border-stone-300 dark:border-stone-700 py-1 font-serif italic text-sm focus:outline-none focus:border-emerald-500 w-full"
                />
                <button 
                    onClick={handleScry}
                    disabled={isScrying}
                    className="text-emerald-500 hover:text-emerald-600 transition-colors"
                >
                    {isScrying ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                </button>
            </div>
        </div>
    );
};
