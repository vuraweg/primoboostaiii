import React, { useState, useEffect } from 'react'; // Ensure useEffect is imported for the hook
import { X, CheckCircle, Sparkles, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, User as UserIcon, UserPlus } from 'lucide-react'; // Added necessary icons for forms
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth hook

type AuthView = 'login' | 'signup' | 'forgot-password' | 'success' | 'postSignupPrompt' | 'reset_password'; // Added 'reset_password'

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: AuthView;
  onProfileFillRequest?: (mode?: 'profile' | 'wallet') => void; // Allow mode parameter
  onPromptDismissed?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialView = 'login',
  onProfileFillRequest = () => {},
  onPromptDismissed = () => {}
}) => {
  const { user, isAuthenticated } = useAuth(); // Call useAuth hook
  const [currentView, setCurrentView] = useState<AuthView>(initialView);
  const [signupEmail, setSignupEmail] = useState<string>(''); // To pass email to success/prompt view

  // Handle prompt dismissal when modal is closed while showing postSignupPrompt
  useEffect(() => {
    console.log('AuthModal isOpen prop changed:', isOpen);
    if (!isOpen && currentView === 'postSignupPrompt') {
      onPromptDismissed();
      setCurrentView('login'); // Reset to login view for next time
    }
    // Also reset error/success messages when modal closes
    if (!isOpen) {
      // You might have local state in forms that also need reset,
      // but the main AuthModal state controlled here should be clean.
    }
  }, [isOpen, currentView, onPromptDismissed]);

  // NEW useEffect: Auto-close modal on successful authentication
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    // Check if authenticated, user object is loaded, modal is open,
    // AND we are not currently showing the needs-email-verification or post-signup-prompt view
    if (
      isAuthenticated &&
      user &&
      isOpen &&
      currentView !== 'postSignupPrompt' && // Do not auto-close if showing post-signup prompt
      currentView !== 'success' // Do not auto-close if showing a generic success message that needs to be seen
      // You might add other views here that should NOT trigger auto-close
    ) {
      console.log('User signed in, checking if profile needs update or closing AuthModal...');
      if (user.hasSeenProfilePrompt === false) { // Assuming false means profile not filled/prompt not seen
        console.log('User needs to fill profile. Prompting...');
        timer = setTimeout(() => {
          onProfileFillRequest('profile'); // Call the prop function, directing to profile
          onClose(); // Close AuthModal
        }, 300); // Short delay to ensure state updates
      } else {
        console.log('User profile is complete or prompt seen. Closing AuthModal...');
        timer = setTimeout(() => {
          onClose(); // Close the modal
        }, 300); // Short delay for smoother transition
      }
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isAuthenticated, user, isOpen, currentView, onClose, onProfileFillRequest]);


  // --- CONDITIONAL RETURN IS NOW AFTER ALL HOOKS ---
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
    setSignupEmail(email); // Store email for the prompt
    // We determine if verification is needed within the signup function in AuthContext
    // If not needing verification, isAuthenticated will become true, and the useEffect will handle the close.
    // If needs verification, the AuthModal will switch to a "check your email" message.
    // The previous AuthModal's internal logic was to change view to 'postSignupPrompt' here
    // However, the new useEffect takes precedence for immediate signed-in users.
    // If signup is successful AND it requires email verification (i.e. not auto-signed in),
    // then we still want to show the 'needs verification' message.
    // The AuthContext.signup function's return (needsVerification) should be handled here.
    // For now, removing this direct call as useEffect will monitor isAuthenticated.
    // If the signup flow implies *auto-login*, then the useEffect above will handle closing.
    // If it implies *email verification needed*, then you'd switch to a specific "check your email" view.
    // Assuming `signup` in AuthContext sets `needsVerification` and does *not* auto-sign in if verification is pending.
    // If `AuthContext.signup` automatically signs in, then `isAuthenticated` changes and the useEffect above fires.
    // If `AuthContext.signup` doesn't auto-sign in but indicates `needsVerification`,
    // then this component needs to respond by setting `currentView` to a verification message.
    // Let's adjust AuthModal's submit handlers to reflect this.
  };

  const handleForgotPasswordSuccess = () => {
    setCurrentView('success');
    // The useEffect will not prevent this success message as currentView is 'success'
    setTimeout(() => {
      onClose();
      setCurrentView('login'); // Reset to login view for next time
    }, 2500);
  };

  const getTitle = () => {
    switch (currentView) {
      case 'login': return 'Welcome Back';
      case 'signup': return 'Join Resume Optimizer';
      case 'forgot-password': return 'Reset Password';
      case 'reset_password': return 'Reset Your Password'; // Added reset_password title
      case 'success': return 'Success!';
      case 'postSignupPrompt': return 'Account Created!';
      default: return 'Authentication';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-sm" onClick={handleBackdropClick}>
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-[95vw] sm:max-w-md max-h-[98vh] sm:max-h-[95vh] border border-gray-100 flex flex-col">
        {/* Header */}
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
              {currentView === 'reset_password' && 'Enter your new password below.'} {/* Subtitle for reset_password */}
              {currentView === 'success' && 'Everything is set up perfectly!'}
              {currentView === 'postSignupPrompt' && 'Your account is ready!'}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0">
          {currentView === 'login' && (
            <LoginForm
              onSwitchToSignup={() => setCurrentView('signup')}
              onForgotPassword={() => setCurrentView('forgot-password')}
              // onClose={onClose} // AuthModal now handles closing
            />
          )}

          {currentView === 'signup' && (
            <SignupForm
              onSwitchToLogin={() => setCurrentView('login')}
              // The onSignupSuccess handler needs to manage the AuthModal's internal view state.
              // We'll pass a function that updates AuthModal's state based on signup result.
              onSignupSuccess={(needsVerification: boolean, email: string) => {
                setSignupEmail(email);
                if (needsVerification) {
                  // If verification needed, switch to a view indicating email check
                  setCurrentView('success'); // Re-using success view for email verification message
                }
                // If not needsVerification, isAuthenticated will become true, and the useEffect above will handle closing.
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
            <form onSubmit={e => e.preventDefault()} className="space-y-4"> {/* Dummy form for structure */}
                <p className="text-gray-600 text-sm mb-4">You can now set a new password.</p>
                {/* This would typically render the actual ResetPasswordForm component */}
                {/* For example, if you have a <ResetPasswordForm /> component */}
                {/* <ResetPasswordForm onSuccess={() => setCurrentView('login')} onBackToLogin={() => setCurrentView('login')} /> */}
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
              {/* Conditional message based on whether it's forgot password success or signup email sent */}
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
                onClick={() => onClose()} // Simply close if it's a generic success message
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
                    onProfileFillRequest(); // Call the prop function
                    onClose(); // Close the modal
                  }}
                  className="w-full btn-primary py-3 px-4 rounded-xl font-semibold text-sm transition-colors"
                >
                  Complete Profile
                </button>
                <button
                  onClick={() => {
                    onPromptDismissed(); // Mark prompt as dismissed
                    onClose(); // Just close the modal
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
