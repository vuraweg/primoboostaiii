import React, { useState, useEffect } from 'react';

// Supabase client and auth context
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

// Lucide React Icons
import {
  FileText, Sparkles, Download, TrendingUp, Target, Award, User, Briefcase,
  AlertCircle, CheckCircle, Loader2, RefreshCw, Zap, Plus, Eye, EyeOff, Crown,
  Calendar, Clock, Users, Star, ArrowRight, Shield, Settings, LogOut, Menu, X,
  Upload, BarChart3, Lightbulb, ArrowLeft, SwitchHorizontal, ChevronUp, ChevronDown
} from 'lucide-react';

// Local Components
import { Header } from './Header'; // Assuming Header component is used elsewhere
import { Navigation } from './navigation/Navigation'; // Assuming Navigation is a separate component
import { FileUpload } from './FileUpload'; // Component for handling resume file uploads
import { InputSection } from './InputSection'; // Assuming this component is part of the InputWizard
import { ResumePreview } from './ResumePreview'; // Displays the formatted resume
import { ExportButtons } from './ExportButtons'; // Handles PDF and DOCX export
import { ComprehensiveAnalysis } from './ComprehensiveAnalysis'; // Displays score analysis and detailed feedback
import { ProjectAnalysisModal } from './ProjectAnalysisModal'; // Modal for project analysis
import { MobileOptimizedInterface } from './MobileOptimizedInterface'; // Mobile-specific UI
import { ProjectEnhancement } from './ProjectEnhancement'; // Modal for project enhancement suggestions
import { SubscriptionPlans } from './payment/SubscriptionPlans'; // Modal for payment/subscription plans
import { SubscriptionStatus } from './payment/SubscriptionStatus'; // Component to display subscription info
import { MissingSectionsModal } from './MissingSectionsModal'; // Modal for user to add missing sections
import { InputWizard } from './InputWizard'; // Main input wizard component

// Services and Utilities
import { parseFile } from '../utils/fileParser';
import { optimizeResume } from '../services/geminiService';
import {
  getMatchScore, generateBeforeScore, generateAfterScore,
  getDetailedResumeScore, reconstructResumeText
} from '../services/scoringService';
import { analyzeProjectAlignment } from '../services/projectAnalysisService';
import { paymentService } from '../services/paymentService';

// Data Types
import { ResumeData, UserType, MatchScore, DetailedScore } from '../types/resume';

interface ResumeOptimizerProps {
  isAuthenticated: boolean;
  onShowAuth: () => void;
  onShowProfile: (mode?: 'profile' | 'wallet') => void;
  onNavigateBack: () => void;
}

const ResumeOptimizer: React.FC<ResumeOptimizerProps> = ({
  isAuthenticated,
  onShowAuth,
  onShowProfile,
  onNavigateBack,
  userSubscription,
  refreshUserSubscription,
  onShowSubscriptionPlans
}) => {
  const { user } = useAuth();

  // --- State Variables ---
  // Input data state
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [userType, setUserType] = useState<UserType>('fresher');

  // Optimization process state
  const [optimizedResume, setOptimizedResume] = useState<ResumeData | null>(null);
  const [parsedResumeData, setParsedResumeData] = useState<ResumeData | null>(null);
  const [pendingResumeData, setPendingResumeData] = useState<ResumeData | null>(null);

  // Score and analysis state
  const [beforeScore, setBeforeScore] = useState<MatchScore | null>(null);
  const [afterScore, setAfterScore] = useState<MatchScore | null>(null);
  const [initialResumeScore, setInitialResumeScore] = useState<DetailedScore | null>(null);
  const [finalResumeScore, setFinalResumeScore] = useState<DetailedScore | null>(null);
  const [changedSections, setChangedSections] = useState<string[]>([]);

  // Loading and UI state
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isCalculatingScore, setIsCalculatingScore] = useState(false);
  const [isProcessingMissingSections, setIsProcessingMissingSections] = useState(false);
  const [activeTab, setActiveTab] = useState<'resume' | 'analysis'>('resume');
  const [showOptimizationDropdown, setShowOptimizationDropdown] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Modal-specific state
  const [showProjectAnalysis, setShowProjectAnalysis] = useState(false);
  const [showMissingSectionsModal, setShowMissingSectionsModal] = useState(false);
  const [missingSections, setMissingSections] = useState<string[]>([]);
  const [showSubscriptionPlans, setShowSubscriptionPlans] = useState(false);

  // Other UI/form-related state (e.g., for manual project add)
  const [showMobileInterface, setShowMobileInterface] = useState(false);
  const [showProjectMismatch, setShowProjectMismatch] = useState(false);
  const [showProjectOptions, setShowProjectOptions] = useState(false);
  const [showManualProjectAdd, setShowManualProjectAdd] = useState(false);
  const [lowScoringProjects, setLowScoringProjects] = useState<any[]>([]);
  const [manualProject, setManualProject] = useState({
    title: '',
    startDate: '',
    endDate: '',
    techStack: [] as string[],
    oneLiner: ''
  });
  const [newTechStack, setNewTechStack] = useState('');
  const [showProjectEnhancement, setShowProjectEnhancement] = useState(false);

  // Subscription and wallet state
  const [subscription, setSubscription] = useState<any>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [walletRefreshKey, setWalletRefreshKey] = useState(0);

  // Deprecated/unused variables from original prompt, retained for clarity
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');


  // --- Effects and Handlers ---

  /**
   * Clears all state and resets the UI to the initial input wizard view.
   */
  const handleStartNewResume = () => {
    setOptimizedResume(null);
    setResumeText('');
    setJobDescription('');
    setTargetRole('');
    setUserType('fresher');
    setBeforeScore(null);
    setAfterScore(null);
    setInitialResumeScore(null);
    setFinalResumeScore(null);
    setParsedResumeData(null);
    setManualProject({ title: '', startDate: '', endDate: '', techStack: [], oneLiner: '' });
    setNewTechStack('');
    setLowScoringProjects([]);
    setChangedSections([]);
    setCurrentStep(1);
    setActiveTab('resume');
    setShowOptimizationDropdown(false);
    setShowMobileInterface(false);
  };

  /**
   * Fetches the user's subscription status.
   */
  const checkSubscriptionStatus = async () => {
    if (!user) return;
    try {
      const userSubscription = await paymentService.getUserSubscription(user.id);
      setSubscription(userSubscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoadingSubscription(false);
    }
  };

  /**
   * Initial effect to check for authentication and fetch subscription status.
   */
  useEffect(() => {
    if (isAuthenticated && user) {
      checkSubscriptionStatus();
    } else {
      setLoadingSubscription(false);
    }
  }, [isAuthenticated, user]);

  /**
   * Effect to auto-advance the wizard step after a resume is uploaded.
   */
  useEffect(() => {
    if (resumeText.trim().length > 0 && currentStep === 1) {
      setCurrentStep(2);
    }
  }, [resumeText, currentStep]);

  /**
   * Main function to handle the entire resume optimization process.
   * Includes session validation, subscription checks, and API calls.
   */
  const handleOptimize = async () => {
    console.log('handleOptimize: Function called.');

    if (!resumeText.trim() || !jobDescription.trim()) {
      alert('Please provide both resume content and job description');
      return;
    }
    if (!user) {
      alert('User information not available. Please sign in again.');
      onShowAuth();
      return;
    }

    try {
      console.log('handleOptimize: Manually refreshing session...');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error('handleOptimize: Session refresh failed:', refreshError.message);
        alert('Your session has expired. Please sign in again.');
        onShowAuth();
        return;
      }
      
      const session = refreshData.session;
      if (!session || !session.access_token) {
        console.error('handleOptimize: Session refresh returned no valid session.');
        alert('Your session has expired. Please sign in again.');
        onShowAuth();
        return;
      }
      console.log('handleOptimize: Session refreshed successfully. Session is now:', session);

      console.log('handleOptimize: Current subscription:', subscription);
      console.log('handleOptimize: Optimizations remaining:', subscription ? (subscription.optimizationsTotal - subscription.optimizationsUsed) : 'N/A');

      if (!subscription || (subscription.optimizationsTotal - subscription.optimizationsUsed) <= 0) {
        setShowSubscriptionPlans(true);
        return;
      }

      setIsOptimizing(true);
      try {
        const parsedResume = await optimizeResume(
          resumeText,
          jobDescription,
          userType,
          user.name,
          user.email,
          user.phone,
          user.linkedin,
          user.github,
          undefined,
          undefined,
          targetRole
        );

        setParsedResumeData(parsedResume);
        const missing = checkForMissingSections(parsedResume);

        if (missing.length > 0) {
          setMissingSections(missing);
          setPendingResumeData(parsedResume);
          setShowMissingSectionsModal(true);
          setIsOptimizing(false);
          return;
        }

        await continueOptimizationProcess(parsedResume, session.access_token);

      } catch (error: any) {
        console.error('Error optimizing resume:', error);
        alert('Failed to optimize resume. Please try again.');
      } finally {
        setIsOptimizing(false);
      }
    } catch (error: any) {
      console.error('handleOptimize: Error during session validation or subscription check:', error);
      alert(`An error occurred: ${error.message || 'Failed to validate session or check subscription.'}`);
      setIsOptimizing(false);
    }
  };

  /**
   * Helper function to start the optimization process after missing sections are handled.
   */
  const continueOptimizationProcess = async (resumeData: ResumeData, accessToken: string) => {
    try {
      await handleInitialResumeProcessing(resumeData, accessToken);
    } catch (error) {
      console.error('Error in optimization process:', error);
      alert('Failed to continue optimization. Please try again.');
      setIsOptimizing(false);
    }
  };

  /**
   * Performs the first pass of scoring and sets up for project analysis.
   */
  const handleInitialResumeProcessing = async (resumeData: ResumeData, accessToken: string) => {
    try {
      setIsCalculatingScore(true);
      const initialScore = await getDetailedResumeScore(resumeData, jobDescription, setIsCalculatingScore);
      setInitialResumeScore(initialScore);
      setOptimizedResume(resumeData);
      setParsedResumeData(resumeData);

      if (resumeData.projects && resumeData.projects.length > 0) {
        setShowProjectAnalysis(true);
      } else {
        await proceedWithFinalOptimization(resumeData, initialScore, accessToken);
      }
    } catch (error) {
      console.error('Error in initial resume processing:', error);
      alert('Failed to process resume. Please try again.');
    } finally {
      setIsCalculatingScore(false);
    }
  };

  /**
   * Checks the parsed resume data for any missing key sections.
   */
  const checkForMissingSections = (resumeData: ResumeData): string[] => {
    const missing: string[] = [];
    if (!resumeData.workExperience || resumeData.workExperience.length === 0 || resumeData.workExperience.every(exp => !exp.role?.trim())) {
      missing.push('workExperience');
    }
    if (!resumeData.projects || resumeData.projects.length === 0 || resumeData.projects.every(proj => !proj.title?.trim())) {
      missing.push('projects');
    }
    if (!resumeData.skills || resumeData.skills.length === 0 || resumeData.skills.every(skillCat => !skillCat.list || skillCat.list.every(s => !s.trim()))) {
      missing.push('skills');
    }
    return missing;
  };

  /**
   * Handles the data provided by the user in the MissingSectionsModal.
   */
  const handleMissingSectionsProvided = async (data: any) => {
    setIsProcessingMissingSections(true);
    try {
      if (!pendingResumeData) {
        throw new Error("No pending resume data to update.");
      }
      const updatedResume: ResumeData = {
        ...pendingResumeData,
        ...(data.workExperience && data.workExperience.length > 0 && { workExperience: data.workExperience }),
        ...(data.projects && data.projects.length > 0 && { projects: data.projects }),
        ...(data.skills && data.skills.length > 0 && { skills: data.skills }),
        ...(data.summary && { summary: data.summary }),
      };
      setShowMissingSectionsModal(false);
      setMissingSections([]);
      setPendingResumeData(null);
      const { data: { session } } = await supabase.auth.getSession();
      await handleInitialResumeProcessing(updatedResume, session?.access_token || '');
    } catch (error) {
      console.error('Error processing missing sections:', error);
      alert('Failed to process the provided information. Please try again.');
    } finally {
      setIsProcessingMissingSections(false);
    }
  };

  /**
   * Performs the final AI optimization pass on the resume.
   */
  const proceedWithFinalOptimization = async (resumeData: ResumeData, initialScore: DetailedScore, accessToken: string) => {
    try {
      setIsOptimizing(true);
      const finalOptimizedResume = await optimizeResume(
        reconstructResumeText(resumeData),
        jobDescription,
        userType,
        user!.name,
        user!.email,
        user!.phone,
        user!.linkedin,
        user!.github,
        undefined,
        undefined,
        targetRole
      );

      const beforeScoreData = generateBeforeScore(reconstructResumeText(resumeData));
      setBeforeScore(beforeScoreData);

      const finalScore = await getDetailedResumeScore(finalOptimizedResume, jobDescription, setIsCalculatingScore);
      setFinalResumeScore(finalScore);

      const afterScoreData = generateAfterScore(reconstructResumeText(finalOptimizedResume));
      setAfterScore(afterScoreData);

      const sections = ['workExperience', 'education', 'projects', 'skills', 'certifications'];
      setChangedSections(sections);

      const optimizationResult = await paymentService.useOptimization(user!.id);
      if (optimizationResult.success) {
        await checkSubscriptionStatus();
        setWalletRefreshKey(prevKey => prevKey + 1);
      }

      if (window.innerWidth < 768) {
        setShowMobileInterface(true);
      }
      setActiveTab('resume');
      setOptimizedResume(finalOptimizedResume);
    } catch (error) {
      console.error('Error in final optimization pass:', error);
      alert('Failed to complete resume optimization. Please try again.');
    } finally {
      setIsOptimizing(false);
      setIsCalculatingScore(false);
    }
  };

  /**
   * Handles user response from the project mismatch modal.
   */
  const handleProjectMismatchResponse = (proceed: boolean) => {
    setShowProjectMismatch(false);
    if (proceed) {
      setShowProjectOptions(true);
    } else {
      if (parsedResumeData && initialResumeScore) {
        const { data: { session } } = supabase.auth.getSession();
        proceedWithFinalOptimization(parsedResumeData, initialResumeScore, session?.access_token || '');
      }
    }
  };

  /**
   * Handles user selection of how to add a project.
   */
  const handleProjectOptionSelect = (option: 'manual' | 'ai') => {
    setShowProjectOptions(false);
    if (option === 'manual') {
      setShowManualProjectAdd(true);
    } else {
      setShowProjectEnhancement(true);
    }
  };

  /**
   * Adds a new tech stack item to the manual project state.
   */
  const addTechToStack = () => {
    if (newTechStack.trim() && !manualProject.techStack.includes(newTechStack.trim())) {
      setManualProject(prev => ({
        ...prev,
        techStack: [...prev.techStack, newTechStack.trim()],
      }));
      setNewTechStack('');
    }
  };

  /**
   * Removes a tech stack item from the manual project state.
   */
  const removeTechFromStack = (tech: string) => {
    setManualProject(prev => ({
      ...prev,
      techStack: prev.techStack.filter(t => t !== tech)
    }));
  };

  /**
   * Generates a project description based on manual input (a placeholder for a future AI call).
   */
  const generateProjectDescription = async (project: typeof manualProject, jd: string): Promise<string> => {
    // This function would ideally call a Gemini service to generate a detailed description
    return `• Developed ${project.title} using ${project.techStack.join(', ')} technologies
• Implemented core features and functionality aligned with industry best practices
• Delivered scalable solution with focus on performance and user experience`;
  };

  /**
   * Handles the submission of a manually added project.
   */
  const handleManualProjectSubmit = async () => {
    if (!manualProject.title || manualProject.techStack.length === 0 || !parsedResumeData) {
      alert('Please provide project title and tech stack.');
      return;
    }

    setIsOptimizing(true);
    try {
      const projectDescriptionText = await generateProjectDescription(manualProject, jobDescription);
      const newProject = {
        title: manualProject.title,
        bullets: projectDescriptionText.split('\n').filter(line => line.trim().startsWith('•')).map(line => line.replace('•', '').trim()),
        githubUrl: '' // Assuming no github URL is provided
      };

      const updatedResume = { ...parsedResumeData, projects: [...(parsedResumeData.projects || []), newProject] };

      setShowManualProjectAdd(false);
      const { data: { session } } = await supabase.auth.getSession();
      if (initialResumeScore) {
        await proceedWithFinalOptimization(updatedResume, initialResumeScore, session?.access_token || '');
      } else {
        const newInitialScore = await getDetailedResumeScore(updatedResume, jobDescription, setIsCalculatingScore);
        await proceedWithFinalOptimization(updatedResume, newInitialScore, session?.access_token || '');
      }
    } catch (error) {
      console.error('Error creating manual project:', error);
      alert('Failed to create project. Please try again.');
    } finally {
      setIsOptimizing(false);
    }
  };

  /**
   * Handles a situation where projects are updated (e.g., from the ProjectEnhancement modal).
   */
  const handleProjectsUpdated = async (updatedResumeData: ResumeData) => {
    console.log('Projects updated, triggering final AI re-optimization...');
    setOptimizedResume(updatedResumeData);
    setParsedResumeData(updatedResumeData);

    const { data } = await supabase.auth.getSession();
    const session = data?.session;
    
    if (initialResumeScore) {
      proceedWithFinalOptimization(updatedResumeData, initialResumeScore, session?.access_token || '');
    } else {
      generateScoresAfterProjectAdd(updatedResumeData, session?.access_token || '');
    }
  };

  /**
   * Generates new scores after a project is added, then proceeds with final optimization.
   */
  const generateScoresAfterProjectAdd = async (updatedResume: ResumeData, accessToken: string) => {
    try {
      setIsCalculatingScore(true);
      const freshInitialScore = await getDetailedResumeScore(updatedResume, jobDescription, setIsCalculatingScore);
      setInitialResumeScore(freshInitialScore);
      await proceedWithFinalOptimization(updatedResume, freshInitialScore, accessToken);
    } catch (error) {
      console.error('Error generating scores after project add:', error);
      alert('Failed to generate updated scores. Please try again.');
    } finally {
      setIsCalculatingScore(false);
    }
  };

  /**
   * Handles a successful subscription purchase.
   */
  const handleSubscriptionSuccess = () => {
    checkSubscriptionStatus();
    setShowSubscriptionPlans(false);
    setWalletRefreshKey(prevKey => prevKey + 1);
  };

  // --- Conditional UI Rendering ---

  if (showMobileInterface && optimizedResume) {
    const mobileSections = [
      {
        id: 'resume',
        title: 'Optimized Resume',
        icon: <FileText className="w-5 h-5" />,
        component: (
          <>
            {optimizedResume ? (
              <ResumePreview resumeData={optimizedResume} userType={userType} />
            ) : null}
            {optimizedResume && (
              <ExportButtons
                resumeData={optimizedResume}
                userType={userType}
                targetRole={targetRole}
                onShowProfile={onShowProfile}
                walletRefreshKey={walletRefreshKey}
              />
            )}
          </>
        ),
        resumeData: optimizedResume
      },
      {
        id: 'analysis',
        title: 'Resume Analysis',
        icon: <BarChart3 className="w-5 h-5" />,
        component: beforeScore && afterScore && optimizedResume && jobDescription && targetRole ? (
          <ComprehensiveAnalysis
            beforeScore={beforeScore}
            afterScore={afterScore}
            changedSections={changedSections}
            resumeData={optimizedResume}
            jobDescription={jobDescription}
            targetRole={targetRole || "Target Role"}
            initialDetailedScore={initialResumeScore}
            finalDetailedScore={finalResumeScore}
          />
        ) : null
      }
    ];
    return <MobileOptimizedInterface sections={mobileSections} onStartNewResume={handleStartNewResume} />;
  }

  if (isOptimizing || isCalculatingScore || isProcessingMissingSections) {
    let loadingMessage = "Optimizing Your Resume...";
    let subMessage = "Please wait while our AI analyzes your resume and job description to generate the best possible match.";
    if (isCalculatingScore) {
      loadingMessage = "OPTIMIZING RESUME...";
      subMessage = "Our AI is evaluating your resume based on comprehensive criteria.";
    } else if (isProcessingMissingSections) {
      loadingMessage = "Processing Your Information...";
      subMessage = "We're updating your resume with the new sections you provided.";
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{loadingMessage}</h2>
          <p className="text-gray-600 mb-4">{subMessage}</p>
          <p className="text-sm text-gray-500">
            This may take a few moments as we process complex data and apply advanced algorithms.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-16 px-4 sm:px-0">
      <div className="w-90vh max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 py-8">
        {!optimizedResume ? (
          <>
            <button
              onClick={onNavigateBack}
              className="mb-6 bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-md hover:shadow-lg py-3 px-5 rounded-xl inline-flex items-center space-x-2 transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:block">Back to Home</span>
            </button>

            {isAuthenticated && !loadingSubscription && (
              <div className="relative text-center mb-8 z-10">
                <button
                  onClick={() => setShowOptimizationDropdown(!showOptimizationDropdown)}
                  className="inline-flex items-center space-x-2 px-6 py-3 rounded-full transition-all duration-200 font-semibold text-sm bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 max-w-[300px] mx-auto justify-center"
                >
                  <span>
                    {subscription
                      ? `Optimizations Left: ${subscription.optimizationsTotal - subscription.optimizationsUsed}`
                      : 'No Active Plan'}
                  </span>
                  {showOptimizationDropdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showOptimizationDropdown && (
                  <div className="absolute left-1/2 -translate-x-1/2 mt-3 w-72 bg-white rounded-xl shadow-xl border border-secondary-200 py-3 z-20">
                    {subscription ? (
                      <div className="text-center px-4">
                        <p className="text-sm text-secondary-700 mb-3">
                          You have **{subscription.optimizationsTotal - subscription.optimizationsUsed}** optimizations remaining.
                        </p>
                        <button
                          onClick={() => { setShowSubscriptionPlans(true); setShowOptimizationDropdown(false); }}
                          className="w-full btn-secondary py-2 px-4 rounded-lg text-sm flex items-center justify-center space-x-2"
                        >
                          <Zap className="w-4 h-4" />
                          <span>Upgrade Plan</span>
                        </button>
                      </div>
                    ) : (
                      <div className="text-center px-4">
                        <p className="text-sm text-secondary-700 mb-3">
                          You currently do not have an active subscription plan.
                        </p>
                        <button
                          onClick={() => { setShowSubscriptionPlans(true); setShowOptimizationDropdown(false); }}
                          className="w-full btn-primary py-2 px-4 rounded-lg text-sm flex items-center justify-center space-x-2"
                        >
                          <Crown className="w-4 h-4" />
                          <span>Choose Your Plan</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <div className="max-w-7xl mx-auto space-y-6">
              <InputWizard
                resumeText={resumeText}
                setResumeText={setResumeText}
                jobDescription={jobDescription}
                setJobDescription={setJobDescription}
                targetRole={targetRole}
                setTargetRole={setTargetRole}
                userType={userType}
                setUserType={setUserType}
                handleOptimize={handleOptimize}
                isAuthenticated={isAuthenticated}
                onShowAuth={onShowAuth}
                currentStep={currentStep}
                setCurrentStep={setCurrentStep}
              />
            </div>
          </>
        ) : (
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="text-center flex flex-col items-center gap-4">
              <div className="flex gap-3">
                <button
                  onClick={() => setActiveTab('resume')}
                  className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors font-medium text-sm ${
                    activeTab === 'resume'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Resume Preview</span>
                </button>
                <button
                  onClick={() => setActiveTab('analysis')}
                  className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors font-medium text-sm ${
                    activeTab === 'analysis'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Score Analysis</span>
                </button>
              </div>

              <button
                onClick={handleStartNewResume}
                className="inline-flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-xl shadow transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Create New Resume</span>
              </button>
            </div>

            {optimizedResume && activeTab === 'resume' && (
              <>
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-green-600" />
                      Optimized Resume
                    </h2>
                  </div>
                  <ResumePreview resumeData={optimizedResume} userType={userType} />
                </div>
                <ExportButtons
                  resumeData={optimizedResume}
                  userType={userType}
                  targetRole={targetRole}
                  onShowProfile={onShowProfile}
                  walletRefreshKey={walletRefreshKey}
                />
              </>
            )}

            {optimizedResume && activeTab === 'analysis' && beforeScore && afterScore && (
              <>
                <ComprehensiveAnalysis
                  beforeScore={beforeScore}
                  afterScore={afterScore}
                  changedSections={changedSections}
                  resumeData={optimizedResume}
                  jobDescription={jobDescription}
                  targetRole={targetRole || "Target Role"}
                  initialDetailedScore={initialResumeScore}
                  finalDetailedScore={finalResumeScore}
                />
              </>
            )}
          </div>
        )}
      </div>

      {showProjectMismatch && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-orange-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Project Mismatch Detected</h2>
                <p className="text-gray-600">
                  Your current projects don't align well with the job description. Would you like to add a relevant project to improve your resume score?
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 mb-1">
                    {initialResumeScore?.totalScore}/100
                  </div>
                  <div className="text-sm text-red-700">Current Resume Score</div>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleProjectMismatchResponse(true)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
                >
                  Yes, Add Project
                </button>
                <button
                  onClick={() => handleProjectMismatchResponse(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-colors"
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProjectOptions && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Choose Project Addition Method</h2>
                <p className="text-gray-600">
                  How would you like to add a relevant project to your resume?
                </p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => handleProjectOptionSelect('manual')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2"
                >
                  <User className="w-5 h-5" />
                  <span>Manual Add - I'll provide project details</span>
                </button>
                <button
                  onClick={() => handleProjectOptionSelect('ai')}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>AI-Suggested - Generate automatically</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showManualProjectAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Add Project Manually</h2>
                <p className="text-gray-600">
                  Provide project details and AI will generate a professional description
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    value={manualProject.title}
                    onChange={(e) => setManualProject(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., E-commerce Website"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="month"
                      value={manualProject.startDate}
                      onChange={(e) => setManualProject(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date *
                    </label>
                    <input
                      type="month"
                      value={manualProject.endDate}
                      onChange={(e) => setManualProject(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tech Stack *
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newTechStack}
                      onChange={(e) => setNewTechStack(e.target.value)}
                      placeholder="e.g., React, Node.js"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      onKeyPress={(e) => e.key === 'Enter' && addTechToStack()}
                    />
                    <button
                      onClick={addTechToStack}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {manualProject.techStack.map((tech, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                      >
                        {tech}
                        <button
                          onClick={() => removeTechFromStack(tech)}
                          className="ml-2 text-green-600 hover:text-green-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    One-liner Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={manualProject.oneLiner}
                    onChange={(e) => setManualProject(prev => ({ ...prev, oneLiner: e.target.value }))}
                    placeholder="Brief description of the project"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleManualProjectSubmit}
                  disabled={!manualProject.title || manualProject.techStack.length === 0}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
                >
                  Generate & Add Project
                </button>
                <button
                  onClick={() => setShowManualProjectAdd(false)}
                  className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ProjectEnhancement
        isOpen={showProjectEnhancement}
        onClose={() => setShowProjectEnhancement(false)}
        currentResume={parsedResumeData || optimizedResume || { name: '', phone: '', email: '', linkedin: '', github: '', education: [], workExperience: [], projects: [], skills: [], certifications: [] }}
        jobDescription={jobDescription}
        onProjectsAdded={handleProjectsUpdated}
      />

      <ProjectAnalysisModal
        isOpen={showProjectAnalysis}
        onClose={() => setShowProjectAnalysis(false)}
        resumeData={parsedResumeData || optimizedResume || { name: '', phone: '', email: '', linkedin: '', github: '', education: [], workExperience: [], projects: [], skills: [], certifications: [] }}
        jobDescription={jobDescription}
        targetRole={targetRole}
        onProjectsUpdated={handleProjectsUpdated}
      />

      {showSubscriptionPlans && (
        <SubscriptionPlans
          isOpen={showSubscriptionPlans}
          onNavigateBack={() => setShowSubscriptionPlans(false)}
          onSubscriptionSuccess={handleSubscriptionSuccess}
        />
      )}

      <MissingSectionsModal
        isOpen={showMissingSectionsModal}
        onClose={() => {
          setShowMissingSectionsModal(false);
          setMissingSections([]);
          setPendingResumeData(null);
          setIsOptimizing(false);
        }}
        missingSections={missingSections}
        onSectionsProvided={handleMissingSectionsProvided}
      />
    </div>
  );
};

export default ResumeOptimizer;