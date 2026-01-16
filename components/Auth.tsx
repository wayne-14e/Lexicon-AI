
import React, { useState } from 'react';
import { User, AuthMode } from '../types';
import { storageService } from '../services/storageService';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>('register');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      if (mode === 'login') {
        const existingUser = await storageService.findUserByName(name.trim());
        if (existingUser) {
          await storageService.setCurrentUser(existingUser);
          onLogin(existingUser);
        } else {
          setError("Account not found. Please establish account.");
        }
      } else {
        const existingUser = await storageService.findUserByName(name.trim());
        if (existingUser) {
          setError("Identity already exists. Please sign in.");
        } else {
          const newUser: User = {
            id: crypto.randomUUID(),
            username: name.trim(),
            email: `${name.trim().toLowerCase().replace(/\s+/g, '.')}@lexicon.edu`,
          };
          await storageService.setCurrentUser(newUser);
          onLogin(newUser);
        }
      }
    } catch (err) {
      setError("Authorization system failure.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12 animate-in fade-in zoom-in-95 duration-700">
      <div className="w-full max-w-md bg-white p-12 rounded-3xl border border-gray-100 sat-shadow-lg relative overflow-hidden text-center">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-black"></div>
        
        <header className="mb-12">
          <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-blue-600 block mb-3">Academic Link</span>
          <h2 className="text-4xl font-bold serif text-black leading-tight">
            {mode === 'login' ? 'Scholar Access' : 'Begin Journal'}
          </h2>
        </header>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-3 text-left">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Student Identity</label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name or Student ID"
              className="w-full p-5 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white transition-all text-base serif"
              required
              autoFocus
            />
          </div>

          {error && (
            <div className="text-[10px] font-bold text-red-500 uppercase tracking-widest animate-pulse">{error}</div>
          )}

          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="w-full bg-black text-white py-5 rounded-full font-bold uppercase tracking-[0.3em] text-xs hover:bg-blue-600 transition-all shadow-xl hover:-translate-y-0.5 disabled:opacity-30"
          >
            {isLoading ? 'Processing...' : (mode === 'login' ? 'Authenticate' : 'Establish Record')}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-gray-50">
          <button 
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
            className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] hover:text-black transition-colors"
          >
            {mode === 'login' ? 'New scholar? Register here' : 'Already registered? Access archives'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
