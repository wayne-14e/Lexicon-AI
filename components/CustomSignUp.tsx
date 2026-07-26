import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useSignUp } from '@clerk/clerk-react';
import { storageService } from '../services/storageService';

interface CustomSignUpProps {
  onSwitchToSignIn: () => void;
}

const CustomSignUp: React.FC<CustomSignUpProps> = ({ onSwitchToSignIn }) => {
  const { isLoaded, signUp, setActive } = useSignUp();
  
  const [username, setUsername] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || isLoading) return;

    setError('');
    setIsLoading(true);

    try {
      // 1. Verify username uniqueness in Supabase first
      const trimmedUsername = username.trim();
      
      if (!trimmedUsername) {
        setError('Username is required.');
        setIsLoading(false);
        return;
      }
      
      if (trimmedUsername.length < 3) {
        setError('Username must be at least 3 characters long.');
        setIsLoading(false);
        return;
      }
      
      // Query our DB directly
      const existingProfile = await storageService.findProfileByName(trimmedUsername);
      if (existingProfile) {
        setError('That username is already taken. Please choose another.');
        setIsLoading(false);
        return;
      }

      // 2. Create the user in Clerk
      await signUp.create({
        username: trimmedUsername,
        emailAddress,
        password,
      });

      // 3. Initiate email verification
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      
      setPendingVerification(true);
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      // Display the most relevant error message from Clerk
      if (err.errors && err.errors.length > 0) {
        setError(err.errors[0].longMessage || err.errors[0].message);
      } else {
        setError('An unexpected error occurred during sign up.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!isLoaded || isGoogleLoading || !signUp) return;

    setError('');
    setIsGoogleLoading(true);

    try {
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/',
      });
    } catch (err: any) {
      setIsGoogleLoading(false);
      if (err.errors && err.errors.length > 0) {
        setError(err.errors[0].longMessage || err.errors[0].message);
      } else {
        setError('Failed to sign up with Google. Please try again.');
      }
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || isLoading) return;

    setError('');
    setIsLoading(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === 'complete') {
        // Clerk will handle redirection automatically when session becomes active,
        // triggering the SignedIn component in App.tsx
        await setActive({ session: completeSignUp.createdSessionId });
      } else {
        console.error(JSON.stringify(completeSignUp, null, 2));
        setError('Unable to verify email at this time.');
      }
    } catch (err: any) {
      console.error('Error:', JSON.stringify(err, null, 2));
      if (err.errors && err.errors.length > 0) {
        setError(err.errors[0].longMessage || err.errors[0].message);
      } else {
        setError('Invalid verification code.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-surface border border-white/5 shadow-2xl rounded-3xl overflow-hidden mx-auto w-full p-8 max-w-[400px]">
      <div className="flex flex-col items-center mb-6">
        <h2 className="font-display text-text text-2xl font-bold text-center w-full">Create your account</h2>
        <p className="text-muted text-sm text-center w-full mt-1">Welcome to Lexicon AI Journal</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-xs p-3 rounded-xl mb-4 font-bold text-center">
          {error}
        </div>
      )}

      {!pendingVerification ? (
        <div className="flex flex-col space-y-4">
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={isGoogleLoading}
            className="flex items-center justify-center space-x-3 bg-white hover:bg-gray-100 text-gray-800 text-sm font-semibold py-3 rounded-xl transition-all w-full border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>{isGoogleLoading ? 'Connecting...' : 'Continue with Google'}</span>
          </button>

          <div className="flex items-center space-x-3 my-1">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-muted text-[10px] uppercase tracking-widest font-bold">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

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

            <div className="flex flex-col">
              <label className="text-muted text-[10px] uppercase tracking-widest font-bold mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className="bg-surfaceHighlight border border-white/5 text-text rounded-xl p-3 focus:border-primary/50 transition-all focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="flex flex-col">
              <label className="text-muted text-[10px] uppercase tracking-widest font-bold mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-surfaceHighlight border border-white/5 text-text rounded-xl p-3 pr-10 focus:border-primary/50 transition-all focus:outline-none focus:ring-1 focus:ring-primary w-full"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90 text-sm font-bold uppercase tracking-widest py-3 rounded-xl transition-all shadow-lg shadow-primary/20 w-full text-white mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Continue'}
            </button>
          </form>
        </div>
      ) : (
        <form onSubmit={handleVerify} className="flex flex-col space-y-4">
          <p className="text-sm text-text text-center mb-2">
            A verification code has been sent to <span className="font-bold">{emailAddress}</span>.
          </p>
          <div className="flex flex-col">
            <label className="text-muted text-[10px] uppercase tracking-widest font-bold mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="bg-surfaceHighlight border border-white/5 text-text rounded-xl p-3 focus:border-primary/50 transition-all focus:outline-none focus:ring-1 focus:ring-primary text-center tracking-widest"
              placeholder="123456"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90 text-sm font-bold uppercase tracking-widest py-3 rounded-xl transition-all shadow-lg shadow-primary/20 w-full text-white mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>
      )}

    </div>
  );
};

export default CustomSignUp;
