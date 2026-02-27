import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, UserMinus, Loader2, Eye } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { getUserProfile, fetchUserZines } from '../services/firebaseUtils';
import { followUser, unfollowUser, fetchFollowers, fetchFollowing } from '../services/connections';
import { UserProfile, ZineMetadata } from '../types';

interface PublicProfileModalProps {
  userId: string;
  onClose: () => void;
  onSelectZine?: (zine: ZineMetadata) => void;
}

export const PublicProfileModal: React.FC<PublicProfileModalProps> = ({ userId, onClose, onSelectZine }) => {
  const { user } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [zines, setZines] = useState<ZineMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const p = await getUserProfile(userId);
        setProfile(p);
        
        const z = await fetchUserZines(userId);
        setZines(z.filter(zine => zine.isPublic));
        
        const followers = await fetchFollowers(userId);
        setFollowerCount(followers.length);
        
        const following = await fetchFollowing(userId);
        setFollowingCount(following.length);
        
        if (user) {
          setIsFollowing(followers.some(f => f.followerId === user.uid));
        }
      } catch (e) {
        console.error("Failed to load profile", e);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [userId, user]);

  const handleFollowToggle = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(userId);
        setIsFollowing(false);
        setFollowerCount(prev => prev - 1);
      } else {
        await followUser(userId);
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
      }
    } catch (e) {
      console.error("Follow action failed", e);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-2xl bg-nous-base dark:bg-[#050505] border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-8 border-b border-stone-200 dark:border-stone-800 flex flex-col items-center text-center">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-stone-400 hover:text-nous-text dark:hover:text-white transition-colors">
            <X size={20} />
          </button>
          
          {loading ? (
            <div className="py-12"><Loader2 size={32} className="animate-spin text-stone-400" /></div>
          ) : profile ? (
            <>
              <div className="w-24 h-24 rounded-full overflow-hidden border border-stone-200 dark:border-stone-800 mb-6 bg-stone-100 dark:bg-stone-900">
                <img src={profile.photoURL || `https://ui-avatars.com/api/?name=${profile.handle || 'U'}&background=1c1917&color=fff`} className="w-full h-full object-cover grayscale" alt="" />
              </div>
              <h2 className="font-serif text-4xl italic tracking-tighter text-nous-text dark:text-white mb-2">@{profile.handle}</h2>
              
              <div className="flex items-center gap-6 mt-6 mb-8">
                <div className="text-center">
                  <span className="block font-serif text-2xl italic text-nous-text dark:text-white">{followerCount}</span>
                  <span className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-400">Witnesses</span>
                </div>
                <div className="w-px h-8 bg-stone-200 dark:bg-stone-800" />
                <div className="text-center">
                  <span className="block font-serif text-2xl italic text-nous-text dark:text-white">{followingCount}</span>
                  <span className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-400">Witnessing</span>
                </div>
              </div>
              
              {user && user.uid !== userId && (
                <button 
                  onClick={handleFollowToggle}
                  disabled={actionLoading}
                  className={`px-8 py-3 rounded-full font-sans text-[9px] uppercase tracking-widest font-black transition-all flex items-center gap-2 ${isFollowing ? 'bg-stone-100 dark:bg-stone-900 text-stone-500 border border-stone-200 dark:border-stone-800' : 'bg-nous-text dark:bg-white text-white dark:text-black shadow-lg'}`}
                >
                  {actionLoading ? <Loader2 size={14} className="animate-spin" /> : isFollowing ? <><UserMinus size={14} /> Unwitness</> : <><UserPlus size={14} /> Witness</>}
                </button>
              )}
            </>
          ) : (
            <div className="py-12"><p className="font-serif italic text-stone-500">Profile not found.</p></div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-stone-50 dark:bg-black/20">
          <h3 className="font-sans text-[10px] uppercase tracking-[0.2em] font-black text-stone-400 mb-6 text-center">Public Manifests</h3>
          
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-stone-400" /></div>
          ) : zines.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {zines.map(zine => (
                <div 
                  key={zine.id}
                  onClick={() => {
                    if (onSelectZine) {
                      onSelectZine(zine);
                      onClose();
                    }
                  }}
                  className="aspect-[3/4] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 relative group cursor-pointer overflow-hidden"
                >
                  {zine.coverImageUrl ? (
                    <img src={zine.coverImageUrl} alt={zine.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-4 text-center">
                      <span className="font-serif italic text-sm text-stone-500">{zine.title}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Eye size={24} className="text-white" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="font-serif italic text-stone-500">No public manifests available.</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
