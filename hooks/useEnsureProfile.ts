import { useUser, useAuth } from '@clerk/clerk-react';
import { useEffect, useRef } from 'react';
import { storageService } from '../services/storageService';
import { User } from '../types';

export function useEnsureProfile(isDbReady: boolean) {
  const { user, isLoaded } = useUser();
  const { isSignedIn } = useAuth();
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    if (!isSignedIn || !isLoaded || !user || !isDbReady) return;

    const syncProfile = async () => {
      console.log('useEnsureProfile: Attempting to sync profile for', user.id);
      const profileData: Partial<User> = {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        full_name: user.fullName || user.username || undefined,
        avatar_url: user.imageUrl,
        username: user.username || user.fullName || (user.primaryEmailAddress?.emailAddress?.split('@')[0]) || `Scholar${Math.floor(100 + Math.random() * 900)}`,
      };

      try {
        const result = await storageService.upsertProfile(profileData as User);
        console.log('useEnsureProfile: Profile sync successful', result);

        // Apply referral bonus if there's a stored referral code and this is a new user
        if (!hasSyncedRef.current) {
          hasSyncedRef.current = true;
          const storedRefCode = localStorage.getItem('lexicon_ref_code');
          if (storedRefCode && result) {
            console.log('useEnsureProfile: Applying referral bonus with code:', storedRefCode);
            try {
              await storageService.applyReferralBonus(user.id, storedRefCode);
              localStorage.removeItem('lexicon_ref_code');
              console.log('useEnsureProfile: Referral bonus applied successfully');
              // Dispatch a custom event to notify the app to refresh user data
              window.dispatchEvent(new CustomEvent('lexicon:referral-applied'));
            } catch (refError) {
              console.error('useEnsureProfile: Referral bonus application failed:', refError);
            }
          }
        }
      } catch (error) {
        console.error('useEnsureProfile: Profile sync failed', error);
      }
    };

    syncProfile();
  }, [isSignedIn, isLoaded, user]);
}
