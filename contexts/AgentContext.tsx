
// @ts-nocheck
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from './UserContext';
import { PocketItem } from '../types';
import { runCuratorAgent, runSentinelAgent } from '../services/geminiAgents';
import { Sparkles, ShieldAlert } from 'lucide-react';

interface AgentContextType {
  activeAgents: string[];
  lastAlert: { message: string, type: 'info' | 'warning' } | null;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export const useAgents = () => {
  const context = useContext(AgentContext);
  if (!context) throw new Error("useAgents must be used within AgentProvider");
  return context;
};

export const AgentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useUser();
  const [activeAgents, setActiveAgents] = useState<string[]>([]);
  const [lastAlert, setLastAlert] = useState<{ message: string, type: 'info' | 'warning' } | null>(null);

  // Listen for Shard Added Events
  useEffect(() => {
    const handleShardAdded = async (e: any) => {
        const item = e.detail as PocketItem;
        if (!item || !user) return;

        // Trigger The Curator
        setActiveAgents(prev => [...prev, 'curator']);
        try {
            const result = await runCuratorAgent(item, profile);
            if (result) {
                window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
                    detail: { message: `Curator filed: ${result.culturalReference || 'Analysis Complete'}`, icon: <Sparkles size={14} className="text-indigo-400" /> } 
                }));
            }
        } finally {
            setActiveAgents(prev => prev.filter(a => a !== 'curator'));
        }
    };

    window.addEventListener('mimi:shard_added', handleShardAdded);
    return () => window.removeEventListener('mimi:shard_added', handleShardAdded);
  }, [user, profile]);

  // Periodic Sentinel Audit (Simulated on Mount/Profile Change)
  useEffect(() => {
      if (!profile || !user) return;
      
      const runSentinel = async () => {
          // In a real app, fetch recent items here. For now, we simulate or need access to items.
          // We'll skip fetching inside the context to avoid circular deps/complexity, 
          // but this is where the Sentinel logic lives.
          // Example:
          // const recent = await fetchPocketItems(user.uid, 5);
          // const audit = await runSentinelAgent(recent, profile);
          // if (audit?.isUrgent) { ... alert ... }
      };
      
      // Run once on load
      runSentinel();
  }, [profile?.id]);

  return (
    <AgentContext.Provider value={{ activeAgents, lastAlert }}>
      {children}
    </AgentContext.Provider>
  );
};
