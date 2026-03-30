import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchProfileByHandle } from '../services/firebase';
import { UserProfile } from '../types';
import { Loader2 } from 'lucide-react';

export const PublicProfileView: React.FC = () => {
  const { handle } = useParams<{ handle: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (handle) {
      fetchProfileByHandle(handle.replace('@', '')).then(p => {
        setProfile(p);
        setLoading(false);
      });
    }
  }, [handle]);

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" /></div>;
  if (!profile) return <div className="p-8 text-center">Profile not found.</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="font-serif text-4xl italic mb-4">{profile.displayName}</h1>
      <p className="font-mono text-sm text-nous-subtle mb-8">@{profile.handle}</p>
      {/* Add more profile details here */}
    </div>
  );
};
