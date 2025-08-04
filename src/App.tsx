import React, { useState, useEffect } from 'react';
import { Menu, X, Home, Info, BookOpen, Phone, FileText, LogIn, LogOut, User, Wallet } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { Header } from './components/Header';
import { Navigation } from './components/navigation/Navigation';
import ResumeOptimizer from './components/ResumeOptimizer';
import { HomePage } from './components/pages/HomePage';
import { GuidedResumeBuilder } from './components/GuidedResumeBuilder';
import { ResumeScoreChecker } from './components/ResumeScoreChecker';
import { LinkedInMessageGenerator } from './components/LinkedInMessageGenerator';
import { AboutUs } from './components/pages/AboutUs';
import { Contact } from './components/pages/Contact';
import { Tutorials } from './components/pages/Tutorials';
import { AuthModal } from './components/auth/AuthModal';
import { UserProfileManagement } from './components/UserProfileManagement';
import { SubscriptionPlans } from './components/payment/SubscriptionPlans';
import { paymentService } from './services/paymentService';
import { AlertModal } from './components/AlertModal'; // Import AlertModal

function App() {
  const { isAuthenticated, user, markProfilePromptSeen, isLoading } = useAuth(); // Destructure isLoading

  const [currentPage, setCurrentPage] = useState('new-home');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileManagement, setShowProfileManagement] = useState(false);
  const [showSubscriptionPlans, setShowSubscriptionPlans] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [profileViewMode, setProfileViewMode] = useState<'profile' | 'wallet'>('profile');
  const [userSubscription, setUserSubscription] = useState<any>(null);

  // New state for AlertModal
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [alertActionText, setAlertActionText] = useState<string | undefined>(undefined);
  const [alertActionCallback, setAlertActionCallback] = useState<(() => void) | undefined>(undefined);

  // NEW state for AuthModal's initial view
  const [authModalInitialView, setAuthModalInitialView] = useState<'login' | 'signup' | 'forgot-password' | 'success' | 'postSignupPrompt'>('login');


  // Handle mobile menu toggle
  const handleMobileMenuToggle = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  const logoImage = "https://res.cloudinary.com/dlkovvlud/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_red,b_rgb:262c35/v1751536902/a-modern-logo-design-featuring-primoboos_XhhkS8E_Q5iOwxbAXB4CqQ_HnpCsJn4S1yrhb826jmMDw_nmycqj.jpg";

  // Handle page change from mobile nav
  const handlePageChange = (page: string) => {
    if (page === 'menu') {
      handleMobileMenuToggle();
    } else if (page === 'profile') {
      handleShowProfile(); // Defaults to 'profile' mode
      setShowMobileMenu(false);
    } else {
      setCurrentPage(page);
      setShowMobileMenu(false);
    }
  };

  // Handle showing auth modal
  const handleShowAuth = () => {
    console.log('handleShowAuth called in App.tsx');
    setShowAuthModal(true);
    setAuthModalInitialView('login'); // Ensure it opens to login by default
    console.log('showAuthModal set to true');
    setShowMobileMenu(false);
  };

  // UPDATED: Handle showing profile modal with an optional mode
  const handleShowProfile = (mode: 'profile' | 'wallet' = 'profile') => {
    setProfileViewMode(mode);
    setShowProfileManagement(true);
    setShowMobileMenu(false);
    console.log('App.tsx: handleShowProfile called. showProfileManagement set to true.');
  };

  // Handle profile completion
  const handleProfileCompleted = () => {
  setShowProfileManagement(false);
  setCurrentPage('new-home'); // ✅ redirect

  // ✅ CRITICAL: Mark profile prompt as seen here
  if (user) {
    markProfilePromptSeen(); // 🔥 THIS MUST BE ADDED
  }

  // ✅ Show success notification
  setSuccessMessage('Profile updated successfully!');
  setShowSuccessNotification(true);
  setTimeout(() => {
    setShowSuccessNotification(false);
    setSuccessMessage('');
  }, 3000);
};


  // New function to navigate back to the home page
  const handleNavigateHome = () => {
    setCurrentPage('new-home');
  };

  // New prop handler for showing subscription plans
  const handleShowSubscriptionPlans = () => {
    setShowSubscriptionPlans(true);
  };

  // New function to show generic alert modal
  const handleShowAlert = (
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    actionText?: string,
    onAction?: () => void
  ) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertActionText(actionText);
    setAlertActionCallback(() => { // Wrap in a function to prevent immediate execution
      if (onAction) onAction();
      setShowAlertModal(false); // Close modal after action
    });
    setShowAlertModal(true);
  };


  // Fetch user subscription on auth state change
  const fetchSubscription = async () => {
    if (isAuthenticated && user) {
      const sub = await paymentService.getUserSubscription(user.id);
      setUserSubscription(sub);
    } else {
      setUserSubscription(null);
    }
  };
  
  useEffect(() => {
    fetchSubscription();
  }, [isAuthenticated, user]);

  // Close mobile menu on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) { // 768px is typically md breakpoint
        setShowMobileMenu(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // NEW useEffect to manage AuthModal visibility based on user profile status
  useEffect(() => {
    console.log('App.tsx useEffect: isAuthenticated:', isAuthenticated, 'user:', user?.id, 'hasSeenProfilePrompt:', user?.hasSeenProfilePrompt, 'isLoadingAuth:', isLoading);

    // Wait until authentication state and user profile are fully loaded
    if (isLoading) {
      console.log('App.tsx useEffect: AuthContext is still loading, deferring AuthModal logic.');
      return;
    }

    if (isAuthenticated && user) {
      // CRITICAL: Only proceed if hasSeenProfilePrompt is explicitly true or false, not undefined
      if (user.hasSeenProfilePrompt === undefined) {
        console.log('App.tsx useEffect: user.hasSeenProfilePrompt is undefined, waiting for full profile load.');
        return; // Wait for the next render cycle when it's defined
      }

      // User is authenticated
      // Check if hasSeenProfilePrompt is explicitly false
      if (user.hasSeenProfilePrompt === false) {
        console.log('App.tsx useEffect: User authenticated and profile incomplete, opening AuthModal to prompt.');
        setAuthModalInitialView('postSignupPrompt');
        setShowAuthModal(true);
      } else {
        // User authenticated and profile is complete (hasSeenProfilePrompt is true)
        console.log('App.tsx useEffect: User authenticated and profile complete, ensuring AuthModal is closed.');
        setShowAuthModal(false);
        setAuthModalInitialView('login'); // Reset to default view for next time
      }
    } else {
      // User is not authenticated
      console.log('App.tsx useEffect: User not authenticated, ensuring AuthModal is closed.');
      setShowAuthModal(false);
      setAuthModalInitialView('login'); // Reset to default view
    }
  }, [isAuthenticated, user, user?.hasSeenProfilePrompt, isLoading]); // Add isLoading to dependencies

  const handleSubscriptionSuccess = async () => { // Make function async
    setShowSubscriptionPlans(false);
    setSuccessMessage('Subscription activated successfully!');
    setShowSuccessNotification(true);
    setTimeout(() => {
      setShowSuccessNotification(false);
      setSuccessMessage('');
    }, 3000);
    await fetchSubscription(); // Re-fetch subscription details
  };

  const renderCurrentPage = (isAuthenticatedProp: boolean) => {
    // Define props for HomePage once to ensure consistency
    const homePageProps = {
      onPageChange: setCurrentPage,
      isAuthenticated: isAuthenticatedProp,
      onShowAuth: handleShowAuth,
      onShowSubscriptionPlans: handleShowSubscriptionPlans, // This is the corrected line
      userSubscription: userSubscription,
      onShowAlert: handleShowAlert // Pass handleShowAlert
    };

    switch (currentPage) {
      case 'new-home':
        return <HomePage {...homePageProps} />;
      case 'guided-builder':
        return <GuidedResumeBuilder
          onNavigateBack={() => setCurrentPage('new-home')}
          userSubscription={userSubscription}
          onShowSubscriptionPlans={handleShowSubscriptionPlans}
          onShowAlert={handleShowAlert} // Pass handleShowAlert
        />;
      case 'score-checker':
        return <ResumeScoreChecker
          onNavigateBack={() => setCurrentPage('new-home')}
          isAuthenticated={isAuthenticatedProp}
          onShowAuth={handleShowAuth}
          userSubscription={userSubscription} // Pass userSubscription
          onShowSubscriptionPlans={handleShowSubscriptionPlans} // Pass onShowSubscriptionPlans
          onShowAlert={handleShowAlert} // Pass handleShowAlert
        />;
      case 'optimizer':
        return (
          <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            <ResumeOptimizer
              isAuthenticated={isAuthenticatedProp}
              onShowAuth={handleShowAuth}
              onShowProfile={handleShowProfile}
              onNavigateBack={handleNavigateHome}
              onShowSubscriptionPlans={handleShowSubscriptionPlans} // Pass onShowSubscriptionPlans
              onShowAlert={handleShowAlert} // Pass handleShowAlert
            />
          </main>
        );
      case 'about':
        return <AboutUs />;
      case 'contact':
        return <Contact />;
      case 'tutorials':
        return <Tutorials />;
      case 'linkedin-generator':
        return <LinkedInMessageGenerator
          onNavigateBack={() => setCurrentPage('new-home')}
          isAuthenticated={isAuthenticatedProp}
          onShowAuth={handleShowAuth}
          userSubscription={userSubscription} // Pass userSubscription
          onShowSubscriptionPlans={handleShowSubscriptionPlans} // Pass onShowSubscriptionPlans
          onShowAlert={handleShowAlert} // Pass handleShowAlert
        />;
      default:
        // Pass all props here as a fallback
        return <HomePage {...homePageProps} />;
    }
  };


  return (
    <div className="min-h-screen pb-safe-bottom safe-area">
      {/* Global Success Notification */}
      {showSuccessNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 p-3 bg-green-500 text-white rounded-lg shadow-lg animate-fade-in-down">
          {successMessage}
        </div>
      )}

      {/* Always render the Header component */}
      <Header onMobileMenuToggle={handleMobileMenuToggle} showMobileMenu={showMobileMenu} onShowProfile={handleShowProfile}>
        <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
      </Header>

      {/* Render the current page content below the header */}
      {renderCurrentPage(isAuthenticated)}

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMobileMenu(false)}
          />
          <div className="fixed top-0 right-0 h-full w-80 max-w-[90vw] bg-white shadow-2xl overflow-y-auto safe-area">
            <div className="flex flex-col space-y-4 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-lg">
                    <img
                      src={logoImage}
                      alt="PrimoBoost AI Logo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h1 className="text-lg sm:text-xl font-bold text-secondary-900">PrimoBoost AI</h1>
                </div>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="min-w-touch min-h-touch p-2 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="border-t border-secondary-200 pt-4">
                <nav className="flex flex-col space-y-4">
                  {[
                    { id: 'new-home', label: 'Home', icon: <Home className="w-5 h-5" /> },
                    { id: 'about', label: 'About Us', icon: <Info className="w-5 h-5" /> },
                    { id: 'tutorials', label: 'Tutorials', icon: <BookOpen className="w-5 h-5" /> },
                    { id: 'contact', label: 'Contact', icon: <Phone className="w-5 h-5" /> },
                    // Conditionally render the 'referral' item
                    ...(isAuthenticated ? [{ id: 'referral', label: 'Referral', icon: <Wallet className="w-5 h-5" /> }] : []),
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.id === 'referral') {
                          handleShowProfile('wallet'); // Pass 'wallet' mode here
                          setShowMobileMenu(false);
                        } else {
                          setCurrentPage(item.id);
                          setShowMobileMenu(false);
                        }
                      }}
                      className={`flex items-center space-x-3 min-h-touch px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                        currentPage === item.id
                          ? 'bg-primary-100 text-primary-700 shadow-md'
                          : 'text-secondary-700 hover:text-primary-600 hover:bg-primary-50'
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              <div className="border-t border-secondary-200 pt-4">
                <AuthButtons
                  onPageChange={setCurrentPage}
                  onClose={() => setShowMobileMenu(false)}
                  onShowAuth={handleShowAuth}
                  onShowProfile={handleShowProfile} // onShowProfile passed directly
                />
              </div>

              <div className="mt-auto pt-4 border-t border-secondary-200">
                <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-4">
                  <p className="text-sm text-secondary-700 mb-2">
                    Need help with your resume?
                  </p>
                  <button
                    onClick={() => {
                      setCurrentPage('new-home');
                      setShowMobileMenu(false);
                    }}
                    className="w-full btn-primary text-sm flex items-center justify-center space-x-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Optimize Now</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          // IMPORTANT: Do NOT reset authModalInitialView here.
          // The useEffect in App.tsx will correctly set it based on user.hasSeenProfilePrompt.
          console.log('AuthModal closed, showAuthModal set to false');
        }}
        onProfileFillRequest={handleShowProfile} // Passed handleShowProfile here
        initialView={authModalInitialView} // Pass the initial view
        onPromptDismissed={() => {
          // When user dismisses the prompt, mark it as seen so it doesn't reappear immediately
          if (user) {
            markProfilePromptSeen();
          }
          setShowAuthModal(false); // Close the modal
          // IMPORTANT: Do NOT reset authModalInitialView here.
          // The useEffect in App.tsx will correctly set it based on user.hasSeenProfilePrompt.
        }}
      />

      {/* Profile Management Modal */}
      <UserProfileManagement
        isOpen={showProfileManagement}
        onClose={() => setShowProfileManagement(false)}
        onProfileCompleted={handleProfileCompleted}
        viewMode={profileViewMode}
      />

      {/* Subscription Plans Modal */}
      {showSubscriptionPlans && (
        <SubscriptionPlans
          isOpen={showSubscriptionPlans}
          onNavigateBack={() => setShowSubscriptionPlans(false)}
          onSubscriptionSuccess={handleSubscriptionSuccess}
        />
      )}

      {/* Generic Alert Modal */}
      <AlertModal
        isOpen={showAlertModal}
        onClose={() => setShowAlertModal(false)}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        actionText={alertActionText}
        onAction={alertActionCallback}
      />
    </div>
  );
}

// Authentication Buttons Component (moved inside App.tsx for AuthProvider context access)
const AuthButtons: React.FC<{
  onPageChange: (page: string) => void;
  onClose: () => void;
  onShowAuth: () => void;
  onShowProfile: (mode?: 'profile' | 'wallet') => void;
}> = ({ onPageChange, onClose, onShowAuth, onShowProfile }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      onClose(); // Close mobile menu after logout
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Sign in button clicked - calling onShowAuth');
    onShowAuth(); // This should show the auth modal and close the mobile menu
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-secondary-500 mb-3">Account</h3>
      {isAuthenticated && user ? (
        <div className="space-y-3">
          <div className="flex items-center space-x-3 px-4 py-3 bg-primary-50 rounded-xl">
            <div className="bg-primary-600 w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold">
              {user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
            </div>
            <div className="overflow-hidden">
              <p className="font-medium text-secondary-900 truncate">{user.name}</p>
              <p className="text-xs text-secondary-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => onShowProfile('profile')} // Pass 'profile' mode explicitly
            className="w-full flex items-center space-x-3 min-h-touch px-4 py-3 rounded-xl font-medium transition-all duration-200 text-secondary-700 hover:text-primary-600 hover:bg-primary-50"
          >
            <User className="w-5 h-5" />
            <span>Profile Settings</span>
          </button>
          <button
            onClick={() => onShowProfile('wallet')}
            className="w-full flex items-center space-x-3 min-h-touch px-4 py-3 rounded-xl font-medium transition-all duration-200 text-secondary-700 hover:text-primary-600 hover:bg-primary-50"
          >
            <Wallet className="w-5 h-5" />
            <span>My Wallet</span>
          </button>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center space-x-3 min-h-touch px-4 py-3 rounded-xl font-medium transition-all duration-200 text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5" />
            <span>{isLoggingOut ? 'Signing Out...' : 'Sign Out'}</span>
          </button>
        </div>
      ) : (
        <button
          onClick={handleLogin}
          className="w-full flex items-center space-x-3 min-h-touch px-4 py-3 rounded-xl font-medium transition-all duration-200 btn-primary"
          type="button"
        >
          <LogIn className="w-5 h-5" />
          <span>Sign In</span>
        </button>
      )}
    </div>
  );
};

export default App;
