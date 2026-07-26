import { useUser, useAuth } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { storageService } from '../services/storageService';
import { User } from '../types';

export function useEnsureProfile() {
  const { user, isLoaded } = useUser();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (!isSignedIn || !isLoaded || !user) return;

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
      } catch (error) {
        console.error('useEnsureProfile: Profile sync failed', error);
      }
    };

    syncProfile();
  }, [isSignedIn, isLoaded, user]);
}
