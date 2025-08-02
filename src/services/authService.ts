import { User, LoginCredentials, SignupCredentials, ForgotPasswordData } from '../types/auth';
import { supabase } from '../lib/supabaseClient';
import { deviceTrackingService } from './deviceTrackingService';
import { paymentService } from './paymentService';

class AuthService {
  private isValidGmail(email: string): boolean {
    const gmailRegex = /^[^\s@]+@gmail\.com$/;
    return gmailRegex.test(email);
  }

  private validatePasswordStrength(password: string): { isValid: boolean; message?: string } {
    if (password.length < 8) return { isValid: false, message: 'Password must be at least 8 characters long' };
    if (!/(?=.*[a-z])/.test(password)) return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    if (!/(?=.*[A-Z])/.test(password)) return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    if (!/(?=.*\d)/.test(password)) return { isValid: false, message: 'Password must contain at least one number' };
    if (!/(?=.*[@$!%*?&])/.test(password)) return { isValid: false, message: 'Password must contain at least one special character (@$!%*?&)' };
    return { isValid: true };
  }

  async login(credentials: LoginCredentials): Promise<User> {
    if (!this.isValidGmail(credentials.email)) throw new Error('Please enter a valid Gmail address (@gmail.com)');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Login failed. Please try again.');

    // Register device and create session for tracking
    try {
      const deviceId = await deviceTrackingService.registerDevice(data.user.id);
      if (deviceId && data.session) {
        await deviceTrackingService.createSession(data.user.id, deviceId, data.session.access_token);
        await deviceTrackingService.logActivity(data.user.id, 'login', {
          loginMethod: 'email_password',
          success: true
        }, deviceId);
      }
    } catch (deviceError) {
      console.warn('Device tracking failed during login:', deviceError);
      // Don't fail login if device tracking fails
    }

    const profile = await this.getUserProfile(data.user.id).catch(() => null);
    return {
      id: data.user.id,
      name: profile?.full_name || data.user.email?.split('@')[0] || 'User',
      email: profile?.email_address || data.user.email!, // Prioritize profile email
      phone: profile?.phone || undefined, // Include phone from profile
      linkedin: profile?.linkedin_profile || undefined, // Include linkedin from profile
      github: profile?.wellfound_profile || undefined, // Mapped to wellfound_profile from DB
      // Removed location: profile?.location || undefined, // Removed new location field
      isVerified: data.user.email_confirmed_at !== null,
      createdAt: data.user.created_at || new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      hasSeenProfilePrompt: profile?.has_seen_profile_prompt || false, // Include this for consistency
    };
  }

  async signup(credentials: SignupCredentials): Promise<{ needsVerification: boolean; email: string }> {
    if (!credentials.name.trim()) throw new Error('Full name is required');
    if (credentials.name.trim().length < 2) throw new Error('Name must be at least 2 characters long');
    if (!/^[a-zA-Z\s]+$/.test(credentials.name.trim())) throw new Error('Name can only contain letters and spaces');
    if (!credentials.email) throw new Error('Gmail address is required');
    if (!this.isValidGmail(credentials.email)) throw new Error('Please enter a valid Gmail address (@gmail.com)');

    const passwordValidation = this.validatePasswordStrength(credentials.password);
    if (!passwordValidation.isValid) throw new Error(passwordValidation.message!);
    if (credentials.password !== credentials.confirmPassword) throw new Error('Passwords do not match');

    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          name: credentials.name.trim(),
          referralCode: credentials.referralCode || null
        }
      }
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Failed to create account. Please try again.');

    // Register device for new user
    try {
      const deviceId = await deviceTrackingService.registerDevice(data.user.id);
      if (deviceId) {
        await deviceTrackingService.logActivity(data.user.id, 'signup', {
          signupMethod: 'email_password',
          success: true
        }, deviceId);
      }
    } catch (deviceError) {
      console.warn('Device tracking failed during signup:', deviceError);
      // Don't fail signup if device tracking fails
    }

    // Activate free trial for new users
    try {
      await paymentService.activateFreeTrial(data.user.id);
      console.log('Free trial activated for new user:', data.user.id);
    } catch (trialError) {
      console.error('Failed to activate free trial for new user:', trialError);
    }

    return {
      needsVerification: !data.session,
      email: credentials.email
    };
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      // Get current session with timeout
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Session timeout')), 500000)
      );

      let sessionData;
      try {
        sessionData = await Promise.race([sessionPromise, timeoutPromise]) as any;
      } catch (timeoutError) {
        console.warn('Session check timed out, user might be offline');
        return null;
      }

      const { data: { session }, error } = sessionData;
      if (error) {
        console.error('Session error:', error);
        return null;
      }

      if (!session?.user) return null;

      // Validate session is not expired
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at < now + 300) { // Refresh if expires in 5 minutes
        console.log('Session expiring soon, refreshing...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshData.session) {
          console.error('Session refresh failed:', refreshError);
          return null;
        }
        console.log('✅ Session refreshed successfully');
        // Use refreshed session
        const refreshedSession = refreshData.session;
        const profile = await this.getUserProfile(refreshedSession.user.id).catch(() => null);
        return {
          id: refreshedSession.user.id,
          name: profile?.full_name || refreshedSession.user.email?.split('@')[0] || 'User',
          email: profile?.email_address || refreshedSession.user.email!, // Prioritize profile email
          phone: profile?.phone || undefined,
          linkedin: profile?.linkedin_profile || undefined,
          github: profile?.wellfound_profile || undefined, // Mapped to wellfound_profile from DB
          username: profile?.username || undefined, // Include username from profile
          referralCode: profile?.referral_code || undefined, // Include referral code from profile
          // Removed location: profile?.location || undefined, // Removed location
          isVerified: refreshedSession.user.email_confirmed_at !== null,
          createdAt: refreshedSession.user.created_at || new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          hasSeenProfilePrompt: profile?.has_seen_profile_prompt || false,
        };
      }

      // Update device activity for current session
      try {
        const deviceId = await deviceTrackingService.registerDevice(session.user.id);
        if (deviceId) {
          await deviceTrackingService.logActivity(session.user.id, 'session_activity', {
            action: 'session_check',
            timestamp: new Date().toISOString()
          }, deviceId);
        }
      } catch (deviceError) {
        console.warn('Device activity update failed during session check:', deviceError);
        // Don't fail session check if device tracking fails
      }

      const profile = await this.getUserProfile(session.user.id).catch(() => null);
      return {
        id: session.user.id,
        name: profile?.full_name || session.user.email?.split('@')[0] || 'User',
        email: profile?.email_address || session.user.email!, // Prioritize profile email
        phone: profile?.phone || undefined,
        linkedin: profile?.linkedin_profile || undefined,
        github: profile?.wellfound_profile || undefined, // Mapped to wellfound_profile from DB
        referralCode: profile?.referral_code || undefined, // Include referral code from profile
        username: profile?.username || undefined, // Include username from profile
        // Removed location: profile?.location || undefined, // Removed location
        isVerified: session.user.email_confirmed_at !== null,
        createdAt: session.user.created_at || new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        hasSeenProfilePrompt: profile?.has_seen_profile_prompt || false,
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    console.log('authService: Logout initiated.'); // Log 1: Start of logout process
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log('authService: Session found, attempting device tracking and session end.'); // Log 2: Session found
        const deviceId = await deviceTrackingService.registerDevice(session.user.id);
        if (deviceId) {
          console.log('authService: Device registered, logging activity.'); // Log 3: Device registered
          await deviceTrackingService.logActivity(session.user.id, 'logout', {
            logoutMethod: 'manual',
            timestamp: new Date().toISOString()
          }, deviceId);
          console.log('authService: Logout activity logged, ending session.'); // Log 4: Activity logged
          await deviceTrackingService.endSession(session.access_token, 'logout');
          console.log('authService: Session ended via device tracking service.'); // Log 5: Session ended
        } else {
          console.warn('authService: Device ID not obtained, skipping device tracking session end.'); // Log 6: Device ID not found
        }
      } else {
        console.log('authService: No active session found for device tracking, proceeding with signOut.'); // Log 7: No session for tracking
      }
    } catch (error) {
      console.warn('authService: Failed to log logout activity or end session via device tracking:', error); // Log 8: Error in device tracking
      // This catch block does NOT re-throw the error, so the main signOut will still proceed.
    }
    console.log('authService: Calling supabase.auth.signOut().'); // Log 9: Before Supabase signOut
    const { error } = await supabase.auth.signOut(); // This is the core logout
    if (error) {
      console.error('authService: supabase.auth.signOut() failed:', error); // Log 10: Supabase signOut failed
      throw new Error('Failed to sign out. Please try again.');
    }
    console.log('authService: supabase.auth.signOut() completed successfully.'); // Log 11: Supabase signOut successful
    console.log('authService: Logout process finished.'); // Log 12: End of logout process
  }

  async forgotPassword(data: ForgotPasswordData): Promise<void> {
    if (!this.isValidGmail(data.email)) throw new Error('Please enter a valid Gmail address (@gmail.com)');
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) throw new Error(error.message);
  }

  async resetPassword(newPassword: string): Promise<void> {
    const passwordValidation = this.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) throw new Error(passwordValidation.message!);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  }

  // Updated to select 'wellfound_profile'
  private async getUserProfile(userId: string): Promise<{
    full_name: string,
    email_address: string,
    phone?: string,
    linkedin_profile?: string,
    wellfound_profile?: string, // Changed back to wellfound_profile
    username?: string,
    referral_code?: string,
    has_seen_profile_prompt?: boolean
  } | null> {
    try {
      const { data, error }
        = await supabase
        .from('user_profiles')
        .select('full_name, email_address, phone, linkedin_profile, wellfound_profile, username, referral_code, has_seen_profile_prompt') // <-- Updated select fields
        .eq('id', userId)
        .maybeSingle();
      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      return null;
    }
  }

  // Update user profile - updated to accept wellfound_profile
  async updateUserProfile(userId: string, updates: {
    full_name?: string;
    email_address?: string;
    phone?: string;
    linkedin_profile?: string;
    github_profile?: string; // This is the frontend property name
    has_seen_profile_prompt?: boolean;
  }): Promise<void> {
    try {
      // Map frontend github_profile to backend wellfound_profile
      const dbUpdates: { [key: string]: any } = {
        full_name: updates.full_name,
        email_address: updates.email_address,
        phone: updates.phone,
        linkedin_profile: updates.linkedin_profile,
        has_seen_profile_prompt: updates.has_seen_profile_prompt,
        profile_updated_at: new Date().toISOString()
      };

      if (updates.github_profile !== undefined) {
        dbUpdates.wellfound_profile = updates.github_profile; // Explicitly map
      }

      const { error } = await supabase
        .from('user_profiles')
        .update(dbUpdates)
        .eq('id', userId);

      if (error) {
        console.error('Error updating user profile:', error);
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      throw error;
    }
  }

  // Mark profile prompt as seen
  async markProfilePromptSeen(userId: string): Promise<void> {
    try {
      await this.updateUserProfile(userId, {
        has_seen_profile_prompt: true
      });
    } catch (error) {
      console.error('Error marking profile prompt as seen:', error);
      throw new Error('Failed to update profile prompt status');
    }
  }

  // Helper method to ensure session is valid before long operations
  async ensureValidSession(): Promise<boolean> {
    try {
      // First check if we have a current session
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Session check failed:', error);
        return false;
      }

      if (!session) {
        console.log('No active session found');
        return false;
      }

      // Check if session is expired
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at < now + 300) { // Refresh if expires in 5 minutes
        console.log('Session expiring soon, refreshing...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshData.session) {
          console.error('Session refresh failed:', refreshError);
          return false;
        }
        console.log('✅ Session refreshed successfully');
      }

      return true;
    } catch (error) {
      console.error('Failed to ensure valid session:', error);
      return false;
    }
  }

  // Get user's device management data
  async getUserDevices(userId: string) {
    return deviceTrackingService.getUserDevices(userId);
  }

  async getUserSessions(userId: string) {
    return deviceTrackingService.getUserSessions(userId);
  }

  async getUserActivityLogs(userId: string, limit?: number) {
    return deviceTrackingService.getUserActivityLogs(userId, limit);
  }

  // Device management methods
  async trustDevice(deviceId: string) {
    return deviceTrackingService.trustDevice(deviceId);
  }

  async removeDevice(deviceId: string) {
    return deviceTrackingService.removeDevice(deviceId);
  }

  async endSession(sessionId: string) {
    return deviceTrackingService.endSpecificSession(sessionId);
  }

  async endAllOtherSessions(userId: string, currentSessionToken: string) {
    return deviceTrackingService.endAllOtherSessions(userId, currentSessionToken);
  }
}

export const authService = new AuthService();
