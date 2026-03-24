import React from 'react';
import { BookOpen, PlusCircle, Sparkles, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';

interface MobileNavigationProps {
  currentView: string;
  setViewMode: (view: string) => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ currentView, setViewMode }) => {
  const tabs = [
    { id: 'stand', label: 'The Stand', icon: BookOpen },
    { id: 'studio', label: 'The Studio', icon: PlusCircle },
    { id: 'oracle', label: 'The Oracle', icon: Sparkles },
    { id: 'thimble', label: 'The Thimble', icon: ShoppingBag },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full bg-white/80 backdrop-blur-xl border-t border-stone-200/50 z-[60] pb-safe md:hidden">
      <div className="flex justify-around items-center h-16 px-2">
        {tabs.map((tab) => {
          const isActive = currentView === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className="relative flex flex-col items-center justify-center w-full h-full space-y-1"
            >
              <Icon 
                size={22} 
                strokeWidth={1.25}
                className={`transition-colors duration-300 ${isActive ? 'text-stone-800' : 'text-stone-400'}`} 
              />
              <span className={`text-[8px] uppercase tracking-widest font-sans ${isActive ? 'text-stone-800 font-bold' : 'text-stone-400'}`}>
                {tab.label}
              </span>
              
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute top-0 w-8 h-0.5 bg-stone-800 rounded-b-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
