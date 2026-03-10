import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, User, Clock, Loader2, X } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { db } from '../services/firebaseInit';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

interface Comment {
  id: string;
  zineId: string;
  userId: string;
  userHandle: string;
  text: string;
  timestamp: number;
}

export const ZineComments: React.FC<{ zineId: string; onClose?: () => void }> = ({ zineId, onClose }) => {
  const { user, profile } = useUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!zineId) return;
    
    const q = query(
      collection(db, 'zine_comments'),
      where('zineId', '==', zineId),
      orderBy('timestamp', 'asc')
    );

    console.log("MIMI // Fetching comments for zineId:", zineId);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("MIMI // Snapshot received, docs:", snapshot.docs.length);
      const fetchedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      setComments(fetchedComments);
      setIsLoading(false);
    }, (error) => {
      console.error("MIMI // Error fetching comments:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [zineId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'zine_comments'), {
        zineId,
        userId: user.uid,
        userHandle: profile?.handle || 'Anonymous',
        text: newComment.trim(),
        timestamp: Date.now()
      });
      setNewComment('');
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-[#0A0A0A] border border-stone-200 dark:border-stone-800 rounded-sm overflow-hidden flex flex-col h-[600px] max-h-[80vh]">
      {/* Header */}
      <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center bg-stone-50 dark:bg-[#111]">
        <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400">
          <MessageSquare size={16} />
          <span className="font-sans text-[10px] uppercase tracking-[0.2em] font-bold">Collaborative Discourse</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Comment List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FDFBF7] dark:bg-[#050505]">
        {isLoading ? (
          <div className="flex justify-center items-center h-full opacity-50">
            <Loader2 size={24} className="animate-spin text-stone-400" />
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-40 text-center space-y-4">
            <MessageSquare size={32} className="text-stone-300 dark:text-stone-700" />
            <p className="font-serif italic text-lg text-stone-500">The discourse is silent. Be the first to refract.</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4 group"
              >
                <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-stone-500" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-sans text-[10px] uppercase tracking-widest font-bold text-stone-900 dark:text-stone-200">
                      @{comment.userHandle}
                    </span>
                    <span className="font-mono text-[8px] text-stone-400 flex items-center gap-1">
                      <Clock size={8} />
                      {new Date(comment.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="font-serif text-sm md:text-base text-stone-700 dark:text-stone-300 leading-relaxed">
                    {comment.text}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0A0A0A]">
        {user ? (
          <form onSubmit={handleSubmit} className="relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a refraction to the discourse..."
              className="w-full bg-stone-50 dark:bg-[#111] border border-stone-200 dark:border-stone-800 rounded-sm py-3 pl-4 pr-12 font-serif text-sm md:text-base focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors resize-none h-24"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="absolute bottom-3 right-3 p-2 bg-stone-900 dark:bg-white text-white dark:text-black rounded-sm hover:bg-emerald-500 dark:hover:bg-emerald-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </form>
        ) : (
          <div className="text-center py-4 bg-stone-50 dark:bg-[#111] border border-stone-200 dark:border-stone-800 rounded-sm">
            <p className="font-sans text-[10px] uppercase tracking-widest text-stone-500">
              Authentication required to participate in discourse.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
