import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Sparkles, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, User as UserIcon, UserPlus } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';\
import { paymentService } from './paymentService'; // Add this line
import { useAuth } from '../../contexts/AuthContext';

type AuthView = 'login' | 'signup' | 'forgot-password' | 'success' | 'postSignupPrompt' | 'reset_password';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: AuthView;
  onProfileFillRequest?: (mode?: 'profile' | 'wallet') => void;
  onPromptDismissed?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialView = 'login',
  onProfileFillRequest = () => {},
  onPromptDismissed = () => {}
}) => {
  const { user, isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState<AuthView>(initialView);
  const [signupEmail, setSignupEmail] = useState<string>('');

  useEffect(() => {
    console.log('AuthModal isOpen prop changed:', isOpen);
    if (!isOpen && currentView === 'postSignupPrompt') {
      onPromptDismissed();
      setCurrentView('login');
    }
    if (!isOpen) {
      // No local state to reset on close.
    }
  }, [isOpen, currentView, onPromptDismissed]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    console.log('AuthModal useEffect: Running. isAuthenticated:', isAuthenticated, 'user:', user, 'isOpen:', isOpen, 'currentView:', currentView);

    if (isAuthenticated && user && (user.hasSeenProfilePrompt === null || user.hasSeenProfilePrompt === undefined)) {
      console.log('AuthModal useEffect: User authenticated, but profile prompt status not yet loaded. Waiting...');
      return;
    }

    if (
      isAuthenticated &&
      user &&
      isOpen &&
      currentView !== 'postSignupPrompt' &&
      currentView !== 'success'
    ) {
      console.log('AuthModal useEffect: User is authenticated and modal is open. Checking profile prompt status.');
      console.log('AuthModal useEffect: user.hasSeenProfilePrompt:', user.hasSeenProfilePrompt);
      if (user.hasSeenProfilePrompt === false) {
        console.log('AuthModal useEffect: User needs to fill profile. Calling onProfileFillRequest.');
        timer = setTimeout(() => {
          onProfileFillRequest('profile');
          onClose();
        }, 300);
      } else {
        console.log('AuthModal useEffect: User profile is complete or prompt seen. Closing AuthModal.');
        timer = setTimeout(() => {
          onClose();
        }, 300);
      }
    } else {
      console.log('AuthModal useEffect: Conditions not met for profile prompt check. isAuthenticated:', isAuthenticated, 'user:', !!user, 'isOpen:', isOpen, 'currentView:', currentView);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isAuthenticated, user, isOpen, currentView, onClose, onProfileFillRequest]);

  if (!isOpen) {
    console.log('AuthModal is NOT open, returning null');
    return null;
  }
  
  console.log('AuthModal IS open, rendering content');

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleCloseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  const handleSignupSuccess = (email: string) => {
    setSignupEmail(email);
  };

  const handleForgotPasswordSuccess = () => {
    setCurrentView('success');
    setTimeout(() => {
      onClose();
      setCurrentView('login');
    }, 2500);
  };

  const getTitle = () => {
    switch (currentView) {
      case 'login': return 'Welcome Back';
      case 'signup': return 'Join Resume Optimizer';
      case 'forgot-password': return 'Reset Password';
      case 'reset_password': return 'Reset Your Password';
      case 'success': return 'Success!';
      case 'postSignupPrompt': return 'Account Created!';
      default: return 'Authentication';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-sm" onClick={handleBackdropClick}>
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-[95vw] sm:max-w-md max-h-[98vh] sm:max-h-[95vh] border border-gray-100 flex flex-col">
        <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 px-4 sm:px-6 py-4 sm:py-8 border-b border-gray-100 flex-shrink-0">
          <button
            onClick={handleCloseClick}
            className="absolute top-2 sm:top-4 right-2 sm:right-4 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-white/50 z-10 min-w-[44px] min-h-[44px]"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <div className="text-center">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2 px-4">
              {getTitle()}
            </h1>
            <p className="text-gray-600 text-xs sm:text-sm px-4">
              {currentView === 'login' && 'Sign in to optimize your resume with AI'}
              {currentView === 'signup' && 'Create your account and start optimizing'}
              {currentView === 'forgot-password' && 'We\'ll help you reset your password'}
              {currentView === 'reset_password' && 'Enter your new password below.'}
              {currentView === 'success' && 'Everything is set up perfectly!'}
              {currentView === 'postSignupPrompt' && 'Your account is ready!'}
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0">
          {currentView === 'login' && (
            <LoginForm
              onSwitchToSignup={() => setCurrentView('signup')}
              onForgotPassword={() => setCurrentView('forgot-password')}
            />
          )}

          {currentView === 'signup' && (
            <SignupForm
              onSwitchToLogin={() => setCurrentView('login')}
              onSignupSuccess={(needsVerification: boolean, email: string) => {
                setSignupEmail(email);
                if (needsVerification) {
                  setCurrentView('success');
                } else {
                  setCurrentView('postSignupPrompt');
                }
              }}
            />
          )}

          {currentView === 'forgot-password' && (
            <ForgotPasswordForm
              onBackToLogin={() => setCurrentView('login')}
              onSuccess={handleForgotPasswordSuccess}
            />
          )}

          {currentView === 'reset_password' && (
            <form onSubmit={e => e.preventDefault()} className="space-y-4">
              <p className="text-gray-600 text-sm mb-4">You can now set a new password.</p>
              <button
                onClick={() => setCurrentView('login')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Back to Login
              </button>
            </form>
          )}

          {currentView === 'success' && (
            <div className="text-center py-6 sm:py-8">
              <div className="bg-green-100 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
              </div>
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-3">All Set!</h2>
              {signupEmail ? (
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed px-4">
                    A verification email has been sent to **{signupEmail}**. Please check your inbox to activate your account.
                  </p>
                ) : (
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed px-4">
                  Password reset email sent. Check your inbox!
                </p>
              )}
              <button
                onClick={() => onClose()}
                className="w-full mt-6 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-xl text-sm transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {currentView === 'postSignupPrompt' && (
            <div className="text-center py-6 sm:py-8">
              <div className="bg-blue-100 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
              </div>
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-3">Welcome!</h2>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed px-4 mb-6">
                Your account for **{signupEmail}** has been created successfully!
                Would you like to complete your profile now?
              </p>
              <div className="flex flex-col sm:flex-row gap-3 px-4">
                <button
                  onClick={() => {
                    onProfileFillRequest();
                    onClose();
                  }}
                  className="w-full btn-primary py-3 px-4 rounded-xl font-semibold text-sm transition-colors"
                >
                  Complete Profile
                </button>
                <button
                  onClick={() => {
                    onPromptDismissed();
                    onClose();
                  }}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-xl text-sm transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
