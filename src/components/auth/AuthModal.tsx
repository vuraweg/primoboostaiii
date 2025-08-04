import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';
import { authService } from '../services/authService';

interface User {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
  createdAt: string;
  lastLogin: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  username?: string;
  referralCode?: string;
  hasSeenProfilePrompt: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  revalidateUserSession: () => void;
  login: typeof authService.login;
  signup: typeof authService.signup;
  logout: typeof authService.logout;
  forgotPassword: typeof authService.forgotPassword;
  resetPassword: typeof authService.resetPassword;
  updateUserProfile: typeof authService.updateUserProfile;
  markProfilePromptSeen: typeof authService.markProfilePromptSeen;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true, // Start as loading
  });

  const [sessionRefreshTimer, setSessionRefreshTimer] = useState<NodeJS.Timeout | null>(null);

  const scheduleSessionRefresh = () => {
    if (sessionRefreshTimer) clearTimeout(sessionRefreshTimer);
    const timeout = setTimeout(async () => {
      console.log('AuthContext: Automatically refreshing session...');
      await authService.getCurrentUser();
      scheduleSessionRefresh();
    }, 5 * 60 * 1000); // Refresh every 5 minutes
    setSessionRefreshTimer(timeout);
  };

  const revalidateUserSession = async () => {
    try {
      console.log('AuthContext: Revalidating user session...');
      const user = await authService.getCurrentUser();
      console.log('AuthContext: User revalidated. User:', user ? user.id : 'none');
      setAuthState(prev => ({
        ...prev,
        user,
        isAuthenticated: !!user,
        isLoading: false,
      }));
    } catch (error) {
      console.error('AuthContext: Error revalidating user session:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    let mounted = true;
    let initialLoadProcessed = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        console.log('AuthContext: Auth state changed event:', event, 'Session:', session ? session.user?.id : 'none');

        if (!initialLoadProcessed) {
          setAuthState(prev => ({ ...prev, isLoading: false }));
          initialLoadProcessed = true;
        }

        if (event === 'SIGNED_IN' && session?.user) {
          try {
            console.log('AuthContext: SIGNED_IN event. Setting basic user info and fetching full profile...');
            
            // Fetch the full profile immediately and await the result
            const fullProfile = await authService.fetchUserProfile(session.user.id);
            console.log('AuthContext: Full user profile fetched:', fullProfile ? fullProfile.full_name : 'none');

            // Construct the complete user object
            const userObject: User = {
              id: session.user.id,
              name: fullProfile?.full_name || session.user.email?.split('@')[0] || 'User',
              email: fullProfile?.email_address || session.user.email!,
              phone: fullProfile?.phone || undefined,
              linkedin: fullProfile?.linkedin_profile || undefined,
              github: fullProfile?.wellfound_profile || undefined,
              username: fullProfile?.username || undefined,
              referralCode: fullProfile?.referral_code || undefined,
              isVerified: session.user.email_confirmed_at !== null,
              createdAt: session.user.created_at || new Date().toISOString(),
              lastLogin: new Date().toISOString(),
              hasSeenProfilePrompt: fullProfile?.has_seen_profile_prompt ?? false, // Use nullish coalescing to safely default to false
            };

            setAuthState({
              user: userObject,
              isAuthenticated: true,
              isLoading: false,
            });

            scheduleSessionRefresh();
          } catch (error) {
            console.error('AuthContext: Error getting user after sign in:', error);
            setAuthState({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('AuthContext: SIGNED_OUT event.');
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
          if (sessionRefreshTimer) clearTimeout(sessionRefreshTimer);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('AuthContext: ✅ Token refreshed automatically.');
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
          }));
        } else if (event === 'USER_UPDATED' && session?.user) {
          console.log('AuthContext: USER_UPDATED event. Revalidating user session...');
          revalidateUserSession();
        }
      }
    );

    return () => {
      mounted = false;
      if (sessionRefreshTimer) clearTimeout(sessionRefreshTimer);
      subscription.unsubscribe();
      console.log('AuthContext: AuthProvider unmounted. Cleaned up timers and subscriptions.');
    };
  }, []);

  const value = {
    ...authState,
    revalidateUserSession,
    login: authService.login,
    signup: authService.signup,
    logout: authService.logout,
    forgotPassword: authService.forgotPassword,
    resetPassword: authService.resetPassword,
    updateUserProfile: authService.updateUserProfile,
    markProfilePromptSeen: authService.markProfilePromptSeen,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
