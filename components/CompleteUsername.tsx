import React, { useState, useEffect } from 'react';
import { useSignUp, useAuth } from '@clerk/clerk-react';
import { storageService } from '../services/storageService';

// Shown at /complete-username when a Google OAuth sign-up still has
// missing requirements (e.g. username is required on the Clerk instance
// but OAuth providers don't supply one). Completes the pending sign-up
// via signUp.update() + setActive(), then returns to '/'.
const CompleteUsername: React.FC = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { isSignedIn } = useAuth();

  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [autoContinued, setAutoContinued] = useState(false);

  // Already signed in (or sign-up finished elsewhere) -> back to the app.
  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      window.location.href = '/';
      return;
    }
    if (signUp && signUp.status === 'complete' && !autoContinued) {
      setAutoContinued(true);
      (async () => {
        try {
          if (signUp.createdSessionId) {
            await setActive({ session: signUp.createdSessionId });
          }
        } catch (err) {
          console.error('CompleteUsername auto-continue failed:', err);
        }
        window.location.href = '/';
      })();
    }
  }, [isLoaded, isSignedIn, signUp, autoContinued, setActive]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp || isLoading) return;

    setError('');
    const trimmedUsername = username.trim().toLowerCase();

    if (!trimmedUsername) {
      setError('Username is required.');
      return;
    }

    if (trimmedUsername.length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      // Same Supabase uniqueness pre-check as the email sign-up form.
      const existingProfile = await storageService.findProfileByName(trimmedUsername);
      if (existingProfile) {
        setError('That username is already taken. Please choose another.');
        setIsLoading(false);
        return;
      }

      const updated = await signUp.update({ username: trimmedUsername });

      if (updated.status === 'complete') {
        await setActive({ session: updated.createdSessionId });
        window.location.href = '/';
      } else if (updated.missingFields && updated.missingFields.length > 0) {
        setError(`Almost there — still required: ${updated.missingFields.join(', ')}.`);
      } else {
        setError('Unable to complete sign up at this time. Please try again.');
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      if (err.errors && err.errors.length > 0) {
        setError(err.errors[0].longMessage || err.errors[0].message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded || isSignedIn || (signUp && signUp.status === 'complete')) {
    return (
      <div className="bg-surface border border-white/5 shadow-2xl rounded-3xl overflow-hidden mx-auto w-full p-8 max-w-[400px] flex flex-col items-center space-y-6">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] text-muted font-medium tracking-[0.2em] uppercase">Finishing Sign Up</p>
      </div>
    );
  }

  if (!signUp) {
    return (
      <div className="bg-surface border border-white/5 shadow-2xl rounded-3xl overflow-hidden mx-auto w-full p-8 max-w-[400px]">
        <div className="flex flex-col items-center mb-6">
          <h2 className="font-display text-text text-2xl font-bold text-center w-full">No pending sign-up</h2>
          <p className="text-muted text-sm text-center w-full mt-1">We couldn't find a sign-up to complete.</p>
        </div>
        <button
          type="button"
          onClick={() => { window.location.href = '/'; }}
          className="bg-primary hover:bg-primary/90 text-sm font-bold uppercase tracking-widest py-3 rounded-xl transition-all shadow-lg shadow-primary/20 w-full text-white"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const missing: string[] = signUp.missingFields ?? [];
  const needsUsername =
    missing.includes('username') ||
    (!signUp.username && signUp.status === 'missing_requirements');

  if (!needsUsername) {
    return (
      <div className="bg-surface border border-white/5 shadow-2xl rounded-3xl overflow-hidden mx-auto w-full p-8 max-w-[400px]">
        <div className="flex flex-col items-center mb-6">
          <h2 className="font-display text-text text-2xl font-bold text-center w-full">One more step</h2>
          <p className="text-muted text-sm text-center w-full mt-1">
            Your sign-up still requires: {missing.length > 0 ? missing.join(', ') : 'additional verification'}.
            Please try signing up again.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { window.location.href = '/'; }}
          className="bg-primary hover:bg-primary/90 text-sm font-bold uppercase tracking-widest py-3 rounded-xl transition-all shadow-lg shadow-primary/20 w-full text-white"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-white/5 shadow-2xl rounded-3xl overflow-hidden mx-auto w-full p-8 max-w-[400px]">
      <div className="flex flex-col items-center mb-6">
        <h2 className="font-display text-text text-2xl font-bold text-center w-full">Choose your username</h2>
        <p className="text-muted text-sm text-center w-full mt-1">
          One last step to finish setting up your Lexicon AI Journal
          {signUp.emailAddress ? (
            <> as <span className="font-bold text-text">{signUp.emailAddress}</span></>
          ) : null}
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-xs p-3 rounded-xl mb-4 font-bold text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        <div className="flex flex-col">
          <label className="text-muted text-[10px] uppercase tracking-widest font-bold mb-2">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            className="bg-surfaceHighlight border border-white/5 text-text rounded-xl p-3 focus:border-primary/50 transition-all focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="e.g. wordmaster"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="bg-primary hover:bg-primary/90 text-sm font-bold uppercase tracking-widest py-3 rounded-xl transition-all shadow-lg shadow-primary/20 w-full text-white mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : 'Complete Sign Up'}
        </button>
      </form>
    </div>
  );
};

export default CompleteUsername;
