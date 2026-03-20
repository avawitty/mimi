import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Key, Ghost, Sparkles, FastForward, Compass } from 'lucide-react';

interface MimiGatewayProps {
  onGoogleLogin: () => void;
  onGhostLogin: () => void;
  onEmailLogin: (email: string, password: string, isSignUp: boolean) => void;
  onSendEmailLink: (email: string) => void;
  onRequestCredentials: () => void;
  onSystemStatus: () => void;
  error?: string | null;
}

export const MimiGateway: React.FC<MimiGatewayProps> = ({ 
  onGoogleLogin, 
  onGhostLogin, 
  onEmailLogin, 
  onSendEmailLink,
  onRequestCredentials, 
  onSystemStatus,
  error
}) => {
  const [identity, setIdentity] = React.useState('');
  const [cipher, setCipher] = React.useState('');
  const [isSignUp, setIsSignUp] = React.useState(false);
  const [mode, setMode] = React.useState<'ritual' | 'email' | 'link'>('ritual');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'email') {
      onEmailLogin(identity, cipher, isSignUp);
    } else if (mode === 'link') {
      onSendEmailLink(identity);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F7F2] font-['Inter',sans-serif] text-[#1A1A1A] flex items-center justify-center p-4 md:p-8 selection:bg-black selection:text-white">
      <div className="fixed inset-4 md:inset-8 border border-[#D4D1C9] pointer-events-none z-50"></div>
      
      <main className="w-full max-w-lg z-10">
        <header className="text-center mb-16">
          <span className="block text-[10px] uppercase tracking-[0.4em] text-[#666666] mb-6">Mimi Editorial System</span>
          <h1 className="font-['Cormorant_Garamond',serif] text-6xl md:text-7xl font-light italic leading-tight">Mimi Gateway</h1>
        </header>

        <div className="px-6 md:px-12">
          {error && (
            <div className="mb-8 p-4 border border-red-900/30 bg-red-900/10 text-red-500 text-[10px] uppercase tracking-widest text-center">
              {error}
            </div>
          )}

          {mode === 'ritual' && (
            <div className="space-y-8">
              <button onClick={onGoogleLogin} className="w-full py-4 border border-[#1A1A1A] text-[11px] uppercase tracking-[0.25em] hover:bg-[#1A1A1A] hover:text-white transition-all">
                Google Anchor
              </button>
              <button onClick={onGhostLogin} className="w-full py-4 border border-[#1A1A1A] text-[11px] uppercase tracking-[0.25em] hover:bg-[#1A1A1A] hover:text-white transition-all">
                Enter Ghost
              </button>
              <button onClick={() => setMode('email')} className="w-full py-4 border border-[#1A1A1A] text-[11px] uppercase tracking-[0.25em] hover:bg-[#1A1A1A] hover:text-white transition-all">
                Manual Registry
              </button>
            </div>
          )}

          {(mode === 'email' || mode === 'link') && (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="text-center">
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[#666666] mb-2" htmlFor="identity">
                  {mode === 'email' ? 'Contributor Identity (Email)' : 'Email for Link'}
                </label>
                <input 
                  className="bg-transparent border-none border-b border-[#D4D1C9] w-full py-3 text-center focus:outline-none focus:border-[#1A1A1A] font-light" 
                  id="identity" 
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                  placeholder="Enter Identity" 
                  type="text"
                />
              </div>
              
              {mode === 'email' && (
                <div className="text-center">
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-[#666666] mb-2" htmlFor="access_key">
                    Access Cipher
                  </label>
                  <input 
                    className="bg-transparent border-none border-b border-[#D4D1C9] w-full py-3 text-center focus:outline-none focus:border-[#1A1A1A] font-light" 
                    id="access_key" 
                    value={cipher}
                    onChange={(e) => setCipher(e.target.value)}
                    placeholder="••••••••" 
                    type="password"
                  />
                </div>
              )}

              <div className="pt-6 flex flex-col items-center space-y-4">
                <button className="px-12 py-3 border border-[#1A1A1A] text-[11px] uppercase tracking-[0.25em] hover:bg-[#1A1A1A] hover:text-white transition-all" type="submit">
                  {mode === 'email' ? (isSignUp ? 'Sign Up' : 'Authorize') : 'Send Link'}
                </button>
                {mode === 'email' && (
                  <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-[10px] uppercase tracking-[0.15em] text-[#666666]">
                    {isSignUp ? 'Switch to Sign In' : 'Switch to Sign Up'}
                  </button>
                )}
                <button type="button" onClick={() => setMode('ritual')} className="text-[10px] uppercase tracking-[0.15em] text-[#666666]">
                  Return
                </button>
              </div>
            </form>
          )}
        </div>

        <footer className="mt-24 text-center">
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-12">
            <button onClick={onRequestCredentials} className="text-[10px] uppercase tracking-[0.15em] text-[#666666] hover:text-[#1A1A1A] transition-colors border-b border-transparent hover:border-[#1A1A1A] pb-1">
              Request Credentials
            </button>
            <button onClick={onSystemStatus} className="text-[10px] uppercase tracking-[0.15em] text-[#666666] hover:text-[#1A1A1A] transition-colors border-b border-transparent hover:border-[#1A1A1A] pb-1">
              System Status
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
};
