
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
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'register' && !name.trim()) return;
    if (!password.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      if (mode === 'login') {
        const existingUser = await storageService.findUserByPassword(password.trim());
        if (existingUser) {
          await storageService.setCurrentUser(existingUser);
          onLogin(existingUser);
        } else {
          setError("Invalid access code. Please verify or register.");
        }
      } else {
        const existingUser = await storageService.findUserByName(name.trim());
        if (existingUser) {
          setError("Identity already exists. Please sign in.");
          return;
        }

        const existingPass = await storageService.findUserByPassword(password.trim());
        if (existingPass) {
          setError("This password is already reserved. Choose another.");
          return;
        }

        const newUser: User = {
          id: crypto.randomUUID(),
          username: name.trim(),
          password: password.trim(),
          streak: 1,
          tokens: 0,
        };
        await storageService.setCurrentUser(newUser);
        onLogin(newUser);
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
      <div className="flex flex-col items-center mb-10 text-center">
        <div className="w-16 h-16 flex items-center justify-center mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]">
          <img src="/logo.svg" className="object-contain w-full h-full" alt="Lexicon Logo" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-text leading-none font-display">Lexicon</h1>
        <span className="text-muted font-bold text-xs uppercase tracking-[0.4em] mt-3 leading-none">AI Journal</span>
      </div>

      <div className="w-full max-w-md bg-surface p-6 sm:p-12 rounded-3xl border border-white/5 shadow-2xl shadow-black/50 relative overflow-hidden text-center">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary"></div>
        
        <header className="mb-12">
          <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-primary block mb-3">Academic Link</span>
          <h2 className="text-3xl font-bold font-display text-text leading-tight">
            {mode === 'login' ? 'Scholar Access' : 'Begin Journal'}
          </h2>
        </header>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {mode === 'register' && (
            <div className="space-y-3 text-left">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted ml-1">Student Identity</label>
              <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name or Student ID"
                className="w-full p-5 bg-surfaceHighlight border border-white/5 rounded-xl focus:bg-surfaceHighlight focus:border-primary text-text placeholder-muted transition-all text-base font-sans"
                required
                autoFocus
              />
            </div>
          )}

          <div className="space-y-3 text-left">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted ml-1">Access Code (Password)</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your unique code"
                className="w-full p-5 bg-surfaceHighlight border border-white/5 rounded-xl focus:bg-surfaceHighlight focus:border-primary text-text placeholder-muted transition-all text-base font-sans pr-14"
                required
                autoFocus={mode === 'login'}
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

          {error && (
            <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest animate-pulse">{error}</div>
          )}

          <button
            type="submit"
            disabled={isLoading || (mode === 'register' && !name.trim()) || !password.trim()}
            className="w-full bg-primary text-white py-5 rounded-full font-bold uppercase tracking-[0.3em] text-xs hover:bg-secondary transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5 disabled:opacity-30 disabled:hover:translate-y-0"
          >
            {isLoading ? 'Processing...' : (mode === 'login' ? 'Authenticate' : 'Establish Record')}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-white/5">
          <button 
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
            className="text-[10px] text-muted font-bold uppercase tracking-[0.2em] hover:text-text transition-colors"
          >
            {mode === 'login' ? 'New scholar? Register here' : 'Already registered? Access archives'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
