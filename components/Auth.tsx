
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { User, AuthMode } from '../types';
import { storageService } from '../services/storageService';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [verifyEmailSent, setVerifyEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'register') {
      if (!name.trim()) return;
      if (name.trim().length < 2 || !/[a-zA-Z]/.test(name.trim())) {
        setError("Identity must be at least 2 characters and contain letters.");
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setError("Please provide a valid email.");
        return;
      }
      if (!password || password.length < 4) {
        setError("Password must have at least 4 characters.");
        return;
      }
    } else if (mode === 'login') {
      if (!email.trim() || !password) return;
    } else if (mode === 'reset') {
      if (!email.trim() || !email.includes('@')) {
        setError("Please provide a valid email to reset your password.");
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    try {
      if (mode === 'reset') {
        const { error: resetError } = await storageService.sendPasswordReset(email.trim());
        if (resetError) {
          setError(resetError.message || "Failed to send reset email.");
        } else {
          setResetSent(true);
        }
      } else if (mode === 'login') {
        const { data, error: signInError } = await storageService.signInWithEmail(email.trim(), password);
        if (signInError) {
          setError(signInError.message || "Invalid access code or email. Please verify or register.");
        } else if (data.user) {
          const u = await storageService.getCurrentUser();
          if (u) {
            onLogin(u);
          } else {
             setError("Failed to sync user data.");
          }
        }
      } else {
        // Register Mode
        const [existingName, existingEmail] = await Promise.all([
          storageService.findProfileByName(name.trim()),
          storageService.findProfileByEmail(email.trim())
        ]);

        if (existingName) {
          setError("Identity already exists. Please sign in.");
          return;
        }

        if (existingEmail) {
          setError("Email already registered. Please sign in.");
          return;
        }

        const { data, error: signUpError } = await storageService.signUpWithEmail(email.trim(), password, name.trim());
        
        if (signUpError) {
          setError(signUpError.message || "Failed to create account.");
          return;
        }

        // UX FIX: If Supabase returns success but NO identities, it means the email is already in use
        // but Supabase is configured for silent failures for security.
        if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
          setError("Email already registered. Please sign in.");
          return;
        }

        if (data.user) {
           if (data.session) {
             const u = await storageService.getCurrentUser();
             if (u) {
               onLogin(u);
             }
           } else {
             // Supabase is configured to require email confirmations
             setVerifyEmailSent(true);
             storageService.logout(); // Ensure they are cleared out until they sign in
           }
        }
      }
    } catch (err) {
      setError("Authorization system failure.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col items-center justify-center py-12 animate-in fade-in zoom-in-95 duration-700">
      {/* Top Header Logo */}
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="w-14 h-14 sm:w-14 sm:h-14 flex items-center justify-center mb-5 drop-shadow-[0_0_20px_rgba(66,154,218,0.4)]">
          <img src="/logo.svg" className="object-contain w-full h-full" alt="Lexicon Logo" />
        </div>
        <div className="flex flex-col items-center text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text leading-none font-display">Lexicon</h1>
          <span className="text-muted font-bold text-[8px] sm:text-[10px] uppercase tracking-[0.5em] mt-1 -mr-[0.5em]">AI Journal</span>
        </div>
      </div>

      <div className="w-full max-w-md bg-surface p-6 sm:p-12 rounded-3xl border border-white/5 shadow-2xl shadow-black/50 relative overflow-hidden text-center">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary"></div>
        
        <header className="mb-12">
          <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-primary block mb-3">Academic Link</span>
          <h2 className="text-3xl font-bold font-display text-text leading-tight">
            {mode === 'login' ? 'Scholar Access' : mode === 'register' ? 'Begin Journal' : 'Recover Access'}
          </h2>
        </header>
        
        {resetSent ? (
          <div className="space-y-6">
            <div className="text-sm text-text bg-green-500/10 border border-green-500/20 p-4 rounded-xl">
              A recovery link has been dispatched to your email. Check your inbox to proceed.
            </div>
            <button
              onClick={() => { setMode('login'); setResetSent(false); }}
              className="w-full bg-surfaceHighlight text-text py-4 rounded-xl font-bold tracking-widest text-xs hover:bg-white/10 transition-all"
            >
              Back to Access
            </button>
          </div>
        ) : verifyEmailSent ? (
          <div className="space-y-6">
            <div className="text-sm text-text bg-green-500/10 border border-green-500/20 p-4 rounded-xl">
              Registration successful! Please check your email to confirm your address and activate your account.
            </div>
            <button
              onClick={() => { setMode('login'); setVerifyEmailSent(false); }}
              className="w-full bg-surfaceHighlight text-text py-4 rounded-xl font-bold tracking-widest text-xs hover:bg-white/10 transition-all"
            >
              Proceed to Access
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'register' && (
              <div className="space-y-3 text-left">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted ml-1">Student Identity</label>
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name or Student ID"
                  className="w-full p-4 bg-surfaceHighlight border border-white/5 rounded-xl focus:bg-surfaceHighlight focus:border-primary text-text placeholder-muted transition-all text-base font-sans"
                  required
                />
              </div>
            )}

            <div className="space-y-3 text-left">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted ml-1">Communication Protocol</label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full p-4 bg-surfaceHighlight border border-white/5 rounded-xl focus:bg-surfaceHighlight focus:border-primary text-text placeholder-muted transition-all text-base font-sans"
                required
              />
            </div>

            {mode !== 'reset' && (
              <div className="space-y-3 text-left">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted ml-1">Access Code (Password)</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your private key"
                    className="w-full p-4 bg-surfaceHighlight border border-white/5 rounded-xl focus:bg-surfaceHighlight focus:border-primary text-text placeholder-muted transition-all text-base font-sans pr-14"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors p-2"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest animate-pulse">{error}</div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white py-4 mt-2 rounded-full font-bold uppercase tracking-[0.3em] text-xs hover:bg-secondary transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5 disabled:opacity-30 disabled:hover:translate-y-0"
            >
              {isLoading ? 'Processing...' : mode === 'login' ? 'Authenticate' : mode === 'register' ? 'Establish Record' : 'Dispatch Probe'}
            </button>
          </form>
        )}

        {!resetSent && !verifyEmailSent && (
          <div className="mt-8 flex flex-col space-y-4">
            {mode === 'login' && (
              <button 
                type="button"
                onClick={() => { setMode('reset'); setError(null); }}
                className="text-[10px] text-muted font-bold uppercase tracking-[0.2em] hover:text-primary transition-colors inline-block"
              >
                Access code forgotten?
              </button>
            )}
            
            <div className="pt-6 border-t border-white/5">
              <button 
                type="button"
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
                className="text-[10px] text-muted font-bold uppercase tracking-[0.2em] hover:text-text transition-colors inline-block"
              >
                {mode === 'login' ? 'New scholar? Register here' : 'Already registered? Access archives'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
