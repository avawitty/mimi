import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, UserMinus, Loader2, Eye, UserCheck, UserX } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { getUserProfile, fetchUserZines } from '../services/firebaseUtils';
import { followUser, unfollowUser, fetchFollowers, fetchFollowing, checkConnectionStatus, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend } from '../services/connections';
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
  
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'friends' | 'request_sent' | 'request_received'>('none');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [connectLoading, setConnectLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Handle mock users
        if (['ghost', 'user1', 'user2'].includes(userId)) {
          const mockProfiles: Record<string, any> = {
            'ghost': {
              uid: 'ghost',
              handle: 'oracle',
              tailorDraft: { typographyIntent: { archetype: 'minimalist-sans' } },
              tasteProfile: { definition: 'The aesthetic is not a choice, it is a biological imperative.' }
            },
            'user1': {
              uid: 'user1',
              handle: 'velvet_void',
              tailorDraft: { typographyIntent: { archetype: 'editorial-serif' } },
              tasteProfile: { definition: 'Refracting the mundane through a lens of hyper-nostalgia.' }
            },
            'user2': {
              uid: 'user2',
              handle: 'chrome_heart',
              tailorDraft: { typographyIntent: { archetype: 'brutalist-mono' } },
              tasteProfile: { definition: 'Silence is the loudest texture.' }
            }
          };
          setProfile(mockProfiles[userId]);
          setZines([]);
          setFollowerCount(Math.floor(Math.random() * 100));
          setFollowingCount(Math.floor(Math.random() * 50));
          if (user) {
            const connStatus = await checkConnectionStatus(userId);
            setConnectionStatus(connStatus.status as any);
            setRequestId(connStatus.requestId);
          }
          setLoading(false);
          return;
        }

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
          const connStatus = await checkConnectionStatus(userId);
          setConnectionStatus(connStatus.status as any);
          setRequestId(connStatus.requestId);
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

  const handleConnectAction = async () => {
    if (!user) return;
    setConnectLoading(true);
    try {
      if (connectionStatus === 'none') {
        await sendFriendRequest(userId);
        setConnectionStatus('request_sent');
        // We don't have the requestId immediately from sendFriendRequest, 
        // but it's usually `${user.uid}_${userId}`
        setRequestId(`${user.uid}_${userId}`);
      } else if (connectionStatus === 'request_received' && requestId) {
        await acceptFriendRequest(requestId, userId);
        setConnectionStatus('friends');
      } else if (connectionStatus === 'friends') {
        await removeFriend(userId);
        setConnectionStatus('none');
      } else if (connectionStatus === 'request_sent' && requestId) {
        // Cancel request by deleting it
        const { db } = await import('../services/firebaseInit');
        const { deleteDoc, doc } = await import('firebase/firestore');
        await deleteDoc(doc(db, "friend_requests", requestId));
        setConnectionStatus('none');
        setRequestId(null);
      }
    } catch (e) {
      console.error("Connection action failed", e);
    } finally {
      setConnectLoading(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!requestId) return;
    setConnectLoading(true);
    try {
      await rejectFriendRequest(requestId);
      setConnectionStatus('none');
      setRequestId(null);
    } catch (e) {
      console.error("Reject action failed", e);
    } finally {
      setConnectLoading(false);
    }
  };

  const renderConnectButton = () => {
    if (connectLoading) {
      return (
        <button disabled className="px-8 py-3 rounded-full font-sans text-[9px] uppercase tracking-widest font-black transition-all flex items-center gap-2 border border-stone-200 dark:border-stone-800 text-stone-500">
          <Loader2 size={14} className="animate-spin" />
        </button>
      );
    }

    switch (connectionStatus) {
      case 'friends':
        return (
          <button onClick={handleConnectAction} className="px-8 py-3 rounded-full font-sans text-[9px] uppercase tracking-widest font-black transition-all flex items-center gap-2 bg-stone-100 dark:bg-stone-900 text-stone-500 border border-stone-200 dark:border-stone-800 hover:text-red-500 hover:border-red-500/30">
            <UserCheck size={14} /> Connected
          </button>
        );
      case 'request_sent':
        return (
          <button onClick={handleConnectAction} className="px-8 py-3 rounded-full font-sans text-[9px] uppercase tracking-widest font-black transition-all flex items-center gap-2 bg-stone-100 dark:bg-stone-900 text-stone-400 border border-stone-200 dark:border-stone-800 hover:text-red-500 hover:border-red-500/30">
            Pending (Cancel)
          </button>
        );
      case 'request_received':
        return (
          <div className="flex gap-2">
            <button onClick={handleConnectAction} className="px-8 py-3 rounded-full font-sans text-[9px] uppercase tracking-widest font-black transition-all flex items-center gap-2 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600">
              <UserPlus size={14} /> Accept
            </button>
            <button onClick={handleRejectRequest} className="px-6 py-3 rounded-full font-sans text-[9px] uppercase tracking-widest font-black transition-all flex items-center gap-2 border border-stone-200 dark:border-stone-800 text-stone-500 hover:text-red-500">
              Ignore
            </button>
          </div>
        );
      case 'none':
      default:
        return (
          <button onClick={handleConnectAction} className="px-8 py-3 rounded-full font-sans text-[9px] uppercase tracking-widest font-black transition-all flex items-center gap-2 border border-nous-text dark:border-white text-nous-text dark:text-white hover:bg-nous-text hover:text-white dark:hover:bg-white dark:hover:text-black">
            <UserPlus size={14} /> Connect
          </button>
        );
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
              
              {profile.tailorDraft?.typographyIntent?.archetype && (
                <div className="mt-2 px-3 py-1 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-full inline-block">
                  <span className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-500">
                    Archetype: {profile.tailorDraft.typographyIntent.archetype.replace('-', ' ')}
                  </span>
                </div>
              )}
              
              {profile.tasteProfile?.definition && (
                <p className="mt-4 font-serif italic text-sm text-stone-500 max-w-sm text-center">
                  "{profile.tasteProfile.definition}"
                </p>
              )}
              
              <div className="flex items-center gap-6 mt-6 mb-8">
                <div className="text-center">
                  <span className="block font-serif text-2xl italic text-nous-text dark:text-white">{followerCount}</span>
                  <span className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-400">Resonators</span>
                </div>
                <div className="w-px h-8 bg-stone-200 dark:bg-stone-800" />
                <div className="text-center">
                  <span className="block font-serif text-2xl italic text-nous-text dark:text-white">{followingCount}</span>
                  <span className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-400">Resonating</span>
                </div>
              </div>
              
              {user && user.uid !== userId && (
                <div className="flex gap-4">
                  <button 
                    onClick={handleFollowToggle}
                    disabled={actionLoading}
                    className={`px-8 py-3 rounded-full font-sans text-[9px] uppercase tracking-widest font-black transition-all flex items-center gap-2 ${isFollowing ? 'bg-stone-100 dark:bg-stone-900 text-stone-500 border border-stone-200 dark:border-stone-800' : 'bg-nous-text dark:bg-white text-white dark:text-black shadow-lg'}`}
                  >
                    {actionLoading ? <Loader2 size={14} className="animate-spin" /> : isFollowing ? <><UserMinus size={14} /> Stop Resonating</> : <><UserPlus size={14} /> Resonate</>}
                  </button>
                  {renderConnectButton()}
                </div>
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
