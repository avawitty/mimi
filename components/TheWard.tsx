import React, { useState, useEffect } from 'react';
import { X, Search, Bell, Radar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TasteGraph } from './TasteGraph';
import { useUser } from '../contexts/UserContext';
import { getTasteGraph } from '../services/tasteGraphService';
import { TasteGraphNode, Notification } from '../types';
import { subscribeToNotifications } from '../services/notificationService';

export const TheWard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'graph' | 'notifications'>('graph');
  const [nodes, setNodes] = useState<TasteGraphNode[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (user?.uid) {
      getTasteGraph().then(graph => setNodes(graph.nodes));
      const unsubscribe = subscribeToNotifications(user.uid, setNotifications);
      return () => unsubscribe();
    }
  }, [user]);

  const navigateToScry = (label: string) => {
    window.dispatchEvent(new CustomEvent('mimi:change_view', { detail: 'scry' }));
    setTimeout(() => {
        window.dispatchEvent(new CustomEvent('mimi:scry_search', { detail: label }));
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-50 dark:bg-stone-950 p-8 flex flex-col">
        <div className="flex justify-between items-center mb-8">
            <div className="space-y-1">
                <h2 className="font-serif text-4xl italic tracking-tighter text-stone-900 dark:text-white">The Ward.</h2>
                <p className="font-sans text-[10px] uppercase tracking-widest text-stone-500">Aesthetic Interrogation Room</p>
            </div>
            <button onClick={onClose} className="text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors">
                <X size={24} />
            </button>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 overflow-hidden">
            {/* Left: Graph */}
            <div className="overflow-y-auto space-y-8">
                <TasteGraph />
            </div>

            {/* Right: Points & Feed */}
            <div className="bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-sm p-8 space-y-6 flex flex-col">
                <div className="flex gap-4">
                    <button onClick={() => setActiveTab('graph')} className={`font-sans text-[10px] uppercase tracking-widest font-black ${activeTab === 'graph' ? 'text-emerald-600 dark:text-emerald-500' : 'text-stone-500'}`}>Graph Points</button>
                    <button onClick={() => setActiveTab('notifications')} className={`font-sans text-[10px] uppercase tracking-widest font-black ${activeTab === 'notifications' ? 'text-emerald-600 dark:text-emerald-500' : 'text-stone-500'}`}>Feed</button>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                    {activeTab === 'graph' ? (
                        <div className="space-y-2">
                            {nodes.map(node => (
                                <button key={node.id} onClick={() => navigateToScry(node.label)} className="w-full p-4 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-sm text-left hover:border-emerald-500 transition-colors">
                                    <p className="font-sans text-xs text-stone-800 dark:text-stone-200">{node.label}</p>
                                    <p className="font-mono text-[9px] text-stone-500 uppercase">{node.type}</p>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {notifications.map(n => (
                                <div key={n.id} className="p-4 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-sm">
                                    <p className="font-sans text-xs text-stone-800 dark:text-stone-200">{n.message}</p>
                                    <p className="font-mono text-[9px] text-stone-500 uppercase">{new Date(n.timestamp).toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};
