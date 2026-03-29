import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../contexts/UserContext';
import { Mail, X, ArrowRight, Shield, Zap, Lock } from 'lucide-react';
import { t } from '../lib/i18n';

interface MimiGatewayProps {
 isOpen: boolean;
 onClose: () => void;
}

export const MimiGateway: React.FC<MimiGatewayProps> = ({ isOpen, onClose }) => {
 const { login, linkAccount, user, signUpWithEmailPassword, signInWithEmailPassword, upgradeGhostAccount } = useUser();
 const [mode, setMode] = useState<'options' | 'email'>('options');
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [isRegistering, setIsRegistering] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [isLoading, setIsLoading] = useState(false);

 const handleGoogleLogin = async () => {
 try {
 await linkAccount(true);
 onClose();
 } catch (e: any) {
 setError(e.message ||"Failed to sign in with Google.");
 }
 };

 const handleEmailAuth = async (e: React.FormEvent) => {
 e.preventDefault();
 setIsLoading(true);
 setError(null);
 try {
 if (user?.isAnonymous) {
 await upgradeGhostAccount(email, password);
 } else if (isRegistering) {
 await signUpWithEmailPassword(email, password);
 } else {
 await signInWithEmailPassword(email, password);
 }
 onClose();
 } catch (err: any) {
 setError(err.message ||"Authentication failed.");
 } finally {
 setIsLoading(false);
 }
 };

 return (
 <AnimatePresence>
 {isOpen && (
 <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="absolute inset-0 bg-black/60 backdrop-blur-sm"
 onClick={onClose}
 />
 <motion.div
 initial={{ opacity: 0, scale: 0.95, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 20 }}
 className="relative w-full max-w-md bg-white rounded-none overflow-hidden border border-nous-border"
 >
 <button
 onClick={onClose}
 className="absolute top-4 right-4 p-2 text-nous-subtle hover:text-nous-text dark:hover:text-white transition-colors"
 >
 <X size={20} />
 </button>

 <div className="p-8">
 <div className="text-center mb-8">
 <h2 className="text-h1 text-nous-text  mb-3">
 {user?.isAnonymous ? 'Claim your trial' : 'Join the Vanguard'}
 </h2>
 <p className="text-body text-nous-text0 max-w-[280px] mx-auto">
 {user?.isAnonymous 
 ? 'You have 12 credits waiting. Enter your email to unlock the full Mimi Zine experience.'
 : 'A sovereign editorial machine for the aesthetic superintelligence. Translate latent intent into defensible conceptual architecture.'}
 </p>
 </div>

 {error && (
 <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-none text-center border border-red-100 dark:border-red-900/50">
 {error}
 </div>
 )}

 {mode === 'options' ? (
 <div className="space-y-4">
 <button
 onClick={handleGoogleLogin}
 className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-nous-text hover:bg-nous-text0 text-nous-base rounded-none transition-colors font-sans text-sm font-bold tracking-wide"
 >
 <svg className="w-5 h-5"viewBox="0 0 24 24">
 <path fill="currentColor"d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
 <path fill="currentColor"d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
 <path fill="currentColor"d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
 <path fill="currentColor"d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
 </svg>
 {t('auth.fastAccess')}
 </button>
 
 <button
 onClick={() => setMode('email')}
 className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-nous-base hover:bg-stone-200 dark:hover:bg-stone-700 text-nous-text dark:text-white rounded-none transition-colors font-sans text-sm font-medium"
 >
 <Mail size={18} />
 {t('auth.continueEmail')}
 </button>
 </div>
 ) : (
 <form onSubmit={handleEmailAuth} className="space-y-4">
 <div>
 <label className="block text-micro mb-2">{t('auth.email')}</label>
 <input
 type="email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 required
 className="w-full px-4 py-3 bg-nous-base border border-nous-border rounded-none focus:outline-none focus:border-nous-border dark:focus:border-nous-border dark:focus:border-nous-border transition-colors text-nous-text dark:text-white"
 placeholder="you@example.com"
 />
 </div>
 <div>
 <label className="block text-micro mb-2">{t('auth.password')}</label>
 <input
 type="password"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 required
 className="w-full px-4 py-3 bg-nous-base border border-nous-border rounded-none focus:outline-none focus:border-nous-border dark:focus:border-nous-border transition-colors text-nous-text dark:text-white"
 placeholder="••••••••"
 />
 </div>
 
 <button
 type="submit"
 disabled={isLoading}
 className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-nous-text text-nous-base rounded-none font-sans text-xs uppercase tracking-widest font-bold hover:bg-nous-text0 transition-colors disabled:opacity-50"
 >
 {isLoading ? t('app.loading') : (isRegistering ? t('auth.joinWaitlist') : t('auth.signIn'))}
 {!isLoading && <ArrowRight size={16} />}
 </button>

 <div className="pt-4 text-center">
 <button
 type="button"
 onClick={() => setIsRegistering(!isRegistering)}
 className="text-xs text-nous-text0 hover:text-nous-text dark:hover:text-white transition-colors"
 >
 {isRegistering ? 'Already have access? Sign in' :"Don't have an account? Join Waitlist"}
 </button>
 </div>
 
 <div className="pt-2 text-center">
 <button
 type="button"
 onClick={() => setMode('options')}
 className="text-[10px] uppercase tracking-widest text-nous-subtle hover:text-nous-subtle transition-colors"
 >
 ← Back to options
 </button>
 </div>
 </form>
 )}

 {/* Privacy Promise */}
 <div className="mt-8 pt-6 border-t border-nous-border">
 <div className="flex items-center justify-center gap-6 text-[10px] uppercase tracking-widest text-nous-subtle font-sans">
 <div className="flex items-center gap-1.5">
 <Shield size={12} />
 <span>Private</span>
 </div>
 <div className="flex items-center gap-1.5">
 <Lock size={12} />
 <span>Secure</span>
 </div>
 <div className="flex items-center gap-1.5">
 <Zap size={12} />
 <span>Fast</span>
 </div>
 </div>
 <p className="text-center text-small mt-4 font-serif italic">
 {t('auth.privacyPromise')}
 </p>
 </div>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 );
};
