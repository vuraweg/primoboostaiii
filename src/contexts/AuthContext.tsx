import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState, LoginCredentials, SignupCredentials, ForgotPasswordData } from '../types/auth';
import { authService } from '../services/authService';
import { supabase } from '../lib/supabaseClient';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<{ needsVerification: boolean; email: string }>;
  logout: () => Promise<void>;
  forgotPassword: (data: ForgotPasswordData) => Promise<void>;
  resetPassword: (newPassword: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  revalidateUserSession: () => Promise<void>;
  markProfilePromptSeen: () => Promise<void>;
}

// Change createContext to explicitly use null as default
const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  // Check for null instead of undefined
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
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
    const timer = setTimeout(async () => {
      try {
        console.log('AuthContext: Attempting scheduled session refresh...');
        await refreshSession();
        scheduleSessionRefresh(); // Schedule next refresh
      } catch (error) {
        console.error('AuthContext: Scheduled session refresh failed:', error);
      }
    }, 45 * 60 * 1000); // 45 minutes
    setSessionRefreshTimer(timer);
  };

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('AuthContext: Session refresh error:', error);
        throw error;
      }
      console.log('AuthContext: ✅ Session refreshed successfully');
      return data;
    } catch (error) {
      console.error('AuthContext: Failed to refresh session:', error);
      throw error;
    }
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
            
            // Directly await fetching the full profile to ensure the user object is complete.
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
              hasSeenProfilePrompt: fullProfile?.has_seen_profile_prompt ?? false,
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

  const login = async (credentials: LoginCredentials) => {
    try {
      console.log('AuthContext: Calling authService.login...');
      await authService.login(credentials);
      console.log('AuthContext: authService.login completed.');
    } catch (error) {
      console.error('AuthContext: Login failed:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const signup = async (credentials: SignupCredentials) => {
    try {
      console.log('AuthContext: Calling authService.signup...');
      const result = await authService.signup(credentials);
      console.log('AuthContext: authService.signup completed. Needs verification:', result.needsVerification);
      if (result.needsVerification) {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
      return result;
    } catch (error) {
      console.error('AuthContext: Signup failed:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('AuthContext: Initiating logout...');
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: true,
      });
      await authService.logout();
      console.log('AuthContext: authService.logout completed.');
    } catch (error) {
      console.error('AuthContext: Logout error:', error);
    } finally {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      if (sessionRefreshTimer) clearTimeout(sessionRefreshTimer);
      console.log('AuthContext: Logout process finished.');
    }
  };

  const forgotPassword = async (data: ForgotPasswordData) => {
    console.log('AuthContext: Calling authService.forgotPassword...');
    await authService.forgotPassword(data);
    console.log('AuthContext: authService.forgotPassword completed.');
  };

  const resetPassword = async (newPassword: string) => {
    console.log('AuthContext: Calling authService.resetPassword...');
    await authService.resetPassword(newPassword);
    console.log('AuthContext: authService.resetPassword completed.');
  };

  const markProfilePromptSeen = async () => {
    if (!authState.user) return;
    console.log('AuthContext: Marking profile prompt as seen for user:', authState.user.id);
    try {
      await authService.markProfilePromptSeen(authState.user.id);
      setAuthState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, hasSeenProfilePrompt: true } : null
      }));
      console.log('AuthContext: Profile prompt marked as seen.');
    } catch (error) {
      console.error('AuthContext: Error marking profile prompt as seen:', error);
    }
  };

  const value: AuthContextType = {
    ...authState,
    login,
    signup,
    logout,
    forgotPassword,
    resetPassword,
    refreshSession,
    revalidateUserSession,
    markProfilePromptSeen,
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
