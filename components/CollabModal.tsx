import React from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2, Loader2 } from 'lucide-react';
import { UserProfile } from '../types';

interface CollabModalProps {
    isOpen: boolean;
    onClose: () => void;
    collabSearchTerm: string;
    setCollabSearchTerm: (term: string) => void;
    handleSearchCollaborators: () => void;
    isSearchingCollab: boolean;
    collabSearchResults: UserProfile[];
    handleAddCollaborator: (uid: string) => void;
    collabProfiles: UserProfile[];
    handleRemoveCollaborator: (uid: string) => void;
}

export const CollabModal: React.FC<CollabModalProps> = ({
    isOpen, onClose, collabSearchTerm, setCollabSearchTerm, handleSearchCollaborators,
    isSearchingCollab, collabSearchResults, handleAddCollaborator, collabProfiles, handleRemoveCollaborator
}) => {
    if (!isOpen) return null;
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[7000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-[#111] p-8 rounded-sm shadow-2xl max-w-lg w-full space-y-6 border border-stone-800">
                <div className="flex justify-between items-center border-b border-stone-800 pb-4">
                    <h3 className="font-serif italic text-2xl text-stone-200">Manage Collaborators.</h3>
                    <button onClick={onClose}><X size={20} className="text-stone-500 hover:text-stone-300" /></button>
                </div>
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <input 
                            value={collabSearchTerm} 
                            onChange={e => setCollabSearchTerm(e.target.value)} 
                            placeholder="Search by handle..." 
                            className="flex-1 bg-stone-900/50 border border-stone-800 p-3 font-mono text-sm focus:outline-none focus:border-emerald-500 rounded-sm text-stone-300 placeholder:text-stone-700" 
                        />
                        <button onClick={handleSearchCollaborators} className="px-4 py-2 bg-emerald-500 text-black rounded-sm font-mono text-[9px] uppercase font-bold tracking-widest hover:bg-emerald-600 transition-colors">Search</button>
                    </div>
                    {isSearchingCollab && <Loader2 size={20} className="animate-spin text-emerald-500 mx-auto" />}
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {collabSearchResults.map(profile => (
                            <div key={profile.uid} className="flex justify-between items-center p-2 border border-stone-800 rounded-sm">
                                <span className="font-mono text-sm text-stone-300">{profile.handle}</span>
                                <button onClick={() => handleAddCollaborator(profile.uid)} className="text-emerald-500 hover:text-emerald-400"><Plus size={16} /></button>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-stone-800 pt-4 space-y-2">
                        <h4 className="font-mono text-[9px] uppercase tracking-widest font-bold text-stone-500">Current Collaborators</h4>
                        {collabProfiles.map(profile => (
                            <div key={profile.uid} className="flex justify-between items-center p-2 border border-stone-800 rounded-sm">
                                <span className="font-mono text-sm text-stone-300">{profile.handle}</span>
                                <button onClick={() => handleRemoveCollaborator(profile.uid)} className="text-red-500 hover:text-red-400"><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
