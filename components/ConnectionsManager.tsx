import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, UserPlus, UserMinus, Check, X, Loader2, Users, Heart, ArrowRight, Search } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { fetchFollowers, fetchFollowing, fetchFriends, fetchFriendRequests, acceptFriendRequest, rejectFriendRequest, removeFriend, unfollowUser, Friendship, FriendRequest, Connection, sendFriendRequest, followUser, checkConnectionStatus } from '../services/connections';
import { getUserProfile, searchUsers } from '../services/firebaseUtils';
import { UserProfile } from '../types';

interface ConnectionItemProps {
  userId: string;
  type: 'friend' | 'follower' | 'following' | 'request' | 'search';
  requestId?: string;
  onActionComplete: () => void;
}

const ConnectionItem: React.FC<ConnectionItemProps> = ({ userId, type, requestId, onActionComplete }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ status: string, requestId: string | null } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const p = await getUserProfile(userId);
        setProfile(p);
        
        if (type === 'search') {
          const status = await checkConnectionStatus(userId);
          setConnectionStatus(status);
        }
      } catch (e) {
        console.error("Failed to load connection data", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [userId, type]);

  const handleAccept = async () => {
    if (!requestId) return;
    setActionLoading(true);
    try {
      await acceptFriendRequest(requestId, userId);
      onActionComplete();
    } catch (e) {
      console.error("Failed to accept request", e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!requestId) return;
    setActionLoading(true);
    try {
      await rejectFriendRequest(requestId);
      onActionComplete();
    } catch (e) {
      console.error("Failed to reject request", e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    setActionLoading(true);
    try {
      await removeFriend(userId);
      onActionComplete();
    } catch (e) {
      console.error("Failed to remove friend", e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnfollow = async () => {
    setActionLoading(true);
    try {
      await unfollowUser(userId);
      onActionComplete();
    } catch (e) {
      console.error("Failed to unfollow", e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConnect = async () => {
    setActionLoading(true);
    try {
      await sendFriendRequest(userId);
      onActionComplete();
    } catch (e) {
      console.error("Failed to send request", e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFollow = async () => {
    setActionLoading(true);
    try {
      await followUser(userId);
      onActionComplete();
    } catch (e) {
      console.error("Failed to follow", e);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="h-16 animate-pulse bg-stone-100 dark:bg-stone-900/50 rounded-sm" />;
  if (!profile) return null;

  return (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-stone-900/30 border border-stone-100 dark:border-stone-800 rounded-sm group transition-all hover:border-stone-200 dark:hover:border-stone-700">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full overflow-hidden border border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-950">
          <img src={profile.photoURL || `https://ui-avatars.com/api/?name=${profile.handle || 'U'}&background=1c1917&color=fff`} className="w-full h-full object-cover grayscale" alt="" />
        </div>
        <div>
          <h4 className="font-serif italic text-sm text-nous-text dark:text-white">@{profile.handle}</h4>
          <p className="font-sans text-[7px] uppercase tracking-widest text-stone-400 font-black">
            {type === 'friend' ? 'Connected' : type === 'follower' ? 'Resonator' : type === 'following' ? 'Resonating' : 'Pending Request'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {type === 'request' ? (
          <>
            <button 
              onClick={handleAccept} 
              disabled={actionLoading}
              className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-full transition-colors"
            >
              {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={16} />}
            </button>
            <button 
              onClick={handleReject} 
              disabled={actionLoading}
              className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
          </>
        ) : type === 'friend' ? (
          <button 
            onClick={handleRemoveFriend} 
            disabled={actionLoading}
            className="px-3 py-1.5 font-sans text-[7px] uppercase tracking-widest font-black text-stone-400 hover:text-red-500 transition-colors"
          >
            {actionLoading ? <Loader2 size={10} className="animate-spin" /> : 'Disconnect'}
          </button>
        ) : type === 'following' ? (
          <button 
            onClick={handleUnfollow} 
            disabled={actionLoading}
            className="px-3 py-1.5 font-sans text-[7px] uppercase tracking-widest font-black text-stone-400 hover:text-red-500 transition-colors"
          >
            {actionLoading ? <Loader2 size={10} className="animate-spin" /> : 'Stop Resonating'}
          </button>
        ) : type === 'search' ? (
          <div className="flex items-center gap-2">
            {connectionStatus?.status === 'friends' ? (
              <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full font-sans text-[7px] uppercase tracking-widest font-black border border-emerald-500/20">
                Connected
              </span>
            ) : connectionStatus?.status === 'request_sent' ? (
              <span className="px-3 py-1.5 bg-stone-100 dark:bg-stone-800 text-stone-400 rounded-full font-sans text-[7px] uppercase tracking-widest font-black border border-stone-200 dark:border-stone-700">
                Request Sent
              </span>
            ) : connectionStatus?.status === 'request_received' ? (
              <button 
                onClick={() => handleAccept()} 
                disabled={actionLoading}
                className="px-3 py-1.5 bg-emerald-500 text-white rounded-full font-sans text-[7px] uppercase tracking-widest font-black hover:bg-emerald-600 transition-all"
              >
                Accept Request
              </button>
            ) : (
              <>
                <button 
                  onClick={handleConnect} 
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-nous-text dark:bg-white text-white dark:text-black rounded-full font-sans text-[7px] uppercase tracking-widest font-black hover:opacity-80 transition-all"
                >
                  {actionLoading ? <Loader2 size={10} className="animate-spin" /> : 'Connect'}
                </button>
                <button 
                  onClick={handleFollow} 
                  disabled={actionLoading}
                  className="px-3 py-1.5 border border-stone-200 dark:border-stone-700 rounded-full font-sans text-[7px] uppercase tracking-widest font-black text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all"
                >
                  {actionLoading ? <Loader2 size={10} className="animate-spin" /> : 'Resonate'}
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export const ConnectionsManager: React.FC = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'followers' | 'following' | 'search'>('friends');
  const [friends, setFriends] = useState<(Friendship & { friendId: string })[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [followers, setFollowers] = useState<Connection[]>([]);
  const [following, setFollowing] = useState<Connection[]>([]);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [f, r, fl, fg] = await Promise.all([
        fetchFriends(user.uid),
        fetchFriendRequests(user.uid),
        fetchFollowers(user.uid),
        fetchFollowing(user.uid)
      ]);
      setFriends(f);
      setRequests(r);
      setFollowers(fl);
      setFollowing(fg);
    } catch (e) {
      console.error("Failed to load connections data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length >= 2) {
        setSearching(true);
        try {
          const results = await searchUsers(searchTerm);
          // Filter out current user
          setSearchResults(results.filter(r => r.uid !== user?.uid));
        } catch (e) {
          console.error("Search failed", e);
        } finally {
          setSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, user]);

  const tabs = [
    { id: 'friends', label: 'Connected', count: friends.length, icon: <Users size={14} /> },
    { id: 'requests', label: 'Requests', count: requests.length, icon: <UserPlus size={14} />, highlight: requests.length > 0 },
    { id: 'followers', label: 'Resonators', count: followers.length, icon: <Heart size={14} /> },
    { id: 'following', label: 'Resonating', count: following.length, icon: <ArrowRight size={14} /> },
    { id: 'search', label: 'Search', count: 0, icon: <Search size={14} /> },
  ];

  return (
    <div className="w-full space-y-8">
      <div className="flex flex-wrap items-center justify-center gap-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 rounded-full border transition-all flex items-center gap-3 relative ${activeTab === tab.id ? 'bg-nous-text dark:bg-white text-white dark:text-black border-nous-text dark:border-white shadow-lg' : 'bg-white dark:bg-stone-900 text-stone-400 border-stone-100 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-600'}`}
          >
            {tab.icon}
            <span className="font-sans text-[8px] uppercase tracking-widest font-black">{tab.label}</span>
            {tab.count > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[7px] font-black ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-500'}`}>
                {tab.count}
              </span>
            )}
            {tab.highlight && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-nous-base dark:border-stone-950 animate-pulse" />
            )}
          </button>
        ))}
      </div>

      <div className="min-h-[300px] relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-stone-300" />
          </div>
        ) : (
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {activeTab === 'friends' && (
              friends.length > 0 ? (
                friends.map(f => <ConnectionItem key={f.id} userId={f.friendId} type="friend" onActionComplete={loadData} />)
              ) : (
                <EmptyState message="No connections established yet." />
              )
            )}
            {activeTab === 'requests' && (
              requests.length > 0 ? (
                requests.map(r => <ConnectionItem key={r.id} userId={r.senderId} type="request" requestId={r.id} onActionComplete={loadData} />)
              ) : (
                <EmptyState message="No pending connection requests." />
              )
            )}
            {activeTab === 'followers' && (
              followers.length > 0 ? (
                followers.map(f => <ConnectionItem key={f.id} userId={f.followerId} type="follower" onActionComplete={loadData} />)
              ) : (
                <EmptyState message="No resonators yet." />
              )
            )}
            {activeTab === 'following' && (
              following.length > 0 ? (
                following.map(f => <ConnectionItem key={f.id} userId={f.followingId} type="following" onActionComplete={loadData} />)
              ) : (
                <EmptyState message="You haven't resonated with anyone yet." />
              )
            )}
            {activeTab === 'search' && (
              <div className="col-span-full space-y-6">
                <div className="relative max-w-md mx-auto">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                  <input 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by handle..."
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-full focus:outline-none focus:ring-2 focus:ring-nous-text dark:focus:ring-white transition-all font-serif italic"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {searching ? (
                    <div className="col-span-full flex justify-center py-10">
                      <Loader2 size={24} className="animate-spin text-stone-300" />
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map(r => <ConnectionItem key={r.uid} userId={r.uid} type="search" onActionComplete={loadData} />)
                  ) : searchTerm.length >= 2 ? (
                    <EmptyState message="No users found matching that handle." />
                  ) : (
                    <div className="col-span-full py-10 text-center opacity-40">
                      <p className="font-serif italic text-stone-500">Enter at least 2 characters to search.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
    <Users size={40} className="text-stone-300" />
    <p className="font-serif italic text-stone-500">{message}</p>
  </div>
);
