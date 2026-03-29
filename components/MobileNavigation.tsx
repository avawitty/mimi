import React from 'react';
import { BookOpen, PlusCircle, Sparkles, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { UserProfile } from '../types';

interface MobileNavigationProps {
 currentView: string;
 setViewMode: (view: string) => void;
 profile?: UserProfile | null;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ currentView, setViewMode, profile }) => {
 const tabs = [
 { id: 'stand', label: 'The Stand', icon: BookOpen },
 { id: 'studio', label: 'The Studio', icon: PlusCircle },
 { id: 'oracle', label: 'The Oracle', icon: Sparkles },
 { id: 'membership', label: 'Membership', icon: ShieldCheck },
 ];

 return (
 <div className="fixed bottom-0 left-0 right-0 w-full bg-white/80 backdrop-blur-xl border-t border-nous-border/50 z-[60] pb-safe md:hidden">
 <div className="flex justify-around items-center h-16 px-2">
 {tabs.map((tab) => {
 const isActive = currentView === tab.id;
 const Icon = tab.icon;
 
 let iconColorClass = isActive ? 'text-nous-text' : 'text-nous-subtle';
 if (tab.id === 'membership' && profile?.plan && profile.plan !== 'free') {
 iconColorClass = profile.plan === 'lab' ? 'text-nous-subtle' :
 profile.plan === 'pro' ? 'text-purple-500' :
 'text-orange-500';
 }
 
 return (
 <button
 key={tab.id}
 onClick={() => {
 if (tab.id === 'membership') {
 if (profile?.planStatus === 'ghost') {
 window.dispatchEvent(new CustomEvent('mimi:open_gateway'));
 } else {
 window.dispatchEvent(new CustomEvent('mimi:open_patron_modal'));
 }
 } else {
 setViewMode(tab.id);
 }
 }}
 className="relative flex flex-col items-center justify-center w-full h-full space-y-1"
 >
 <Icon 
 size={22} 
 strokeWidth={1.25}
 className={`transition-colors duration-300 ${iconColorClass}`} 
 />
 <span className={`text-[8px] uppercase tracking-widest font-sans ${isActive ? 'text-nous-text font-bold' : 'text-nous-subtle'}`}>
 {tab.label}
 </span>
 
 {isActive && (
 <motion.div
 layoutId="mobile-nav-indicator"
 className="absolute top-0 w-8 h-0.5 bg-nous-base rounded-none"
 initial={false}
 transition={{ type:"spring", stiffness: 500, damping: 30 }}
 />
 )}
 </button>
 );
 })}
 </div>
 </div>
 );
};
