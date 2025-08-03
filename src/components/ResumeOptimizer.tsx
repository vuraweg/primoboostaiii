// src/components/ResumeOptimizer.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

// CORRECTED IMPORT STATEMENT:
// The Header component is in the same directory, so the path should be './Header'.
import { Header } from './Header';
import { Navigation } from './navigation/Navigation';

// Added ChevronUp and ChevronDown
import { FileText, Sparkles, Download, TrendingUp, Target, Award, User, Briefcase, AlertCircle, CheckCircle, Loader2, RefreshCw, Zap, Plus, Eye, EyeOff, Crown, Calendar, Clock, Users, Star, ArrowRight, Shield, Settings, LogOut, Menu, X, Upload, BarChart3, Lightbulb, ArrowLeft, StretchHorizontal as SwitchHorizontal, ChevronUp, ChevronDown } from 'lucide-react';

import { FileUpload } from './FileUpload';

import { InputSection } from './InputSection'; // Assuming this is used if not within InputWizard

import { ResumePreview } from './ResumePreview';
import { ExportButtons } from './ExportButtons';
import { ComprehensiveAnalysis } from './ComprehensiveAnalysis';
import { ProjectAnalysisModal } from './ProjectAnalysisModal';
import { MobileOptimizedInterface } from './MobileOptimizedInterface';
import { ProjectEnhancement } from './ProjectEnhancement';
import { SubscriptionPlans } from './payment/SubscriptionPlans';
import { SubscriptionStatus } from './payment/SubscriptionStatus';
import { MissingSectionsModal } from './MissingSectionsModal';
import { InputWizard } from './InputWizard';

import { parseFile } from '../utils/fileParser';

import { optimizeResume } from '../services/geminiService';

import { getMatchScore, generateBeforeScore, generateAfterScore, getDetailedResumeScore, reconstructResumeText } from '../services/scoringService';
import { analyzeProjectAlignment } from '../services/projectAnalysisService';
import { advancedProjectAnalyzer } from '../services/advancedProjectAnalyzer';
import { paymentService } from '../services/paymentService';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService'; // Corrected import


import { ResumeData, UserType, MatchScore, DetailedScore } from '../types/resume';

interface ResumeOptimizerProps {
  isAuthenticated: boolean;
  onShowAuth: () => void;
  onShowProfile: (mode?: 'profile' | 'wallet') => void;
  // Added the new prop for navigating back
  onNavigateBack: () => void;
}

const ResumeOptimizer: React.FC<ResumeOptimizerProps> = ({
  isAuthenticated,
  onShowAuth,
  onShowProfile,
  onNavigateBack // Destructured the new prop
}) => {
  const { user } = useAuth();
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState(''); // Retained for form data structure, but marked as deprecated in optimizeResume call
  const [githubUrl, setGithubUrl] = useState('');      // Retained for form data structure, but marked as deprecated in optimizeResume call
  const [userType, setUserType] = useState<UserType>('fresher');
  const [optimizedResume, setOptimizedResume] = useState<ResumeData | null>(null);
  const [activeTab, setActiveTab] = useState<'resume' | 'analysis'>('resume'); // NEW: Added activeTab state

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showProjectMismatch, setShowProjectMismatch] = useState(false);
  const [showProjectOptions, setShowProjectOptions] = useState(false);
  const [showManualProjectAdd, setShowManualProjectAdd] = useState(false);
  const [lowScoringProjects, setLowScoringProjects] = useState<any[]>([]); // This might need a more specific type
  const [initialResumeScore, setInitialResumeScore] = useState<DetailedScore | null>(null);
  const [finalResumeScore, setFinalResumeScore] = useState<DetailedScore | null>(null);
  const [parsedResumeData, setParsedResumeData] = useState<ResumeData | null>(null);
  const [manualProject, setManualProject] = useState({
    title: '',
    startDate: '',
    endDate: '',
    techStack: [] as string[],
    oneLiner: ''
  });
  const [newTechStack, setNewTechStack] = useState('');
  const [beforeScore, setBeforeScore] = useState<MatchScore | null>(null);
  const [afterScore, setAfterScore] = useState<MatchScore | null>(null);
  const [changedSections, setChangedSections] = useState<string[]>([]);
  const [showMobileInterface, setShowMobileInterface] = useState(false);
  const [showProjectEnhancement, setShowProjectEnhancement] = useState(false);
  const [showSubscriptionPlans, setShowSubscriptionPlans] = useState(false);
  const [showProjectAnalysis, setShowProjectAnalysis] = useState(false);
  const [subscription, setSubscription] = useState<any>(null); // This might need a more specific type
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [showOptimizationDropdown, setShowOptimizationDropdown] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // Assuming InputWizard starts at step 1
  const [showMissingSectionsModal, setShowMissingSectionsModal] = useState(false);
  const [missingSections, setMissingSections] = useState<string[]>([]);
  const [isProcessingMissingSections, setIsProcessingMissingSections] = useState(false);
  const [pendingResumeData, setPendingResumeData] = useState<ResumeData | null>(null);
  const [isCalculatingScore, setIsCalculatingScore] = useState(false);
  const [walletRefreshKey, setWalletRefreshKey] = useState(0);

  // NEW: handleStartNewResume function
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
    setCurrentStep(1); // Go back to the first step of InputWizard
    setActiveTab('resume');
    setShowOptimizationDropdown(false);
    setShowMobileInterface(false); // Ensure mobile interface is hidden on new resume start
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      checkSubscriptionStatus();
    } else {
      setLoadingSubscription(false);
    }
  }, [isAuthenticated, user]);

  const checkSubscriptionStatus = async () => {
    if (!user) return;
    try {
      const userSubscription = await paymentService.getUserSubscription(user.id);
      setSubscription(userSubscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
      // Optionally alert user or display a message about failed subscription load
    } finally {
      setLoadingSubscription(false);
    }
  };

  const handleFileUpload = async (text: string) => {
    try {
      setResumeText(text);
      // Auto-advance step after file upload if initial setup for InputWizard is linear
      // This might be handled directly in InputWizard if it controls steps internally
      // For now, assuming currentStep is managed by InputWizard after upload
    } catch (error) {
      console.error('Error handling file upload:', error);
      alert('Error processing file. Please try a different format or check if the file is corrupted.');
    }
  };

  // This useEffect might be handled by InputWizard directly, or ResumeOptimizer
  // can react to changes in resumeText to determine InputWizard's step.
  // Assuming InputWizard manages its internal steps, this might be redundant here.
  useEffect(() => {
    if (resumeText.trim().length > 0 && currentStep === 1) {
      setCurrentStep(2); // Advance to the next step after resume upload
    }
  }, [resumeText, currentStep]);


  const handleOptimize = async () => {
    setIsOptimizing(true); // Set loading state immediately
    console.log('ResumeOptimizer: Starting handleOptimize function. isOptimizing=true');

    try {
      // Session validation before any API call
      const { data: { session } } = await supabase.auth.getSession();
      const sessionValid = await authService.ensureValidSession();
      if (!sessionValid || !session?.access_token) {
        alert('Your session has expired. Please sign in again.');
        onShowAuth(); // Prompt user to sign in
        return; // Exit, finally block will set isOptimizing to false
      }

      if (!resumeText.trim() || !jobDescription.trim()) {
        alert('Please provide both resume content and job description');
        return; // Exit, finally block will set isOptimizing to false
      }
      if (!user) {
        alert('User information not available. Please sign in again.');
        return; // Exit, finally block will set isOptimizing to false
      }

      // Subscription check before proceeding with optimization
      if (!subscription || (subscription.optimizationsTotal - subscription.optimizationsUsed) <= 0) {
        alert('You have used all your optimizations or do not have an active plan. Please upgrade your plan.');
        setShowSubscriptionPlans(true); // Show subscription plans modal
        return; // Exit, finally block will set isOptimizing to false
      }

      // Step 1: Initial optimization to parse the resume and get structured data
      const parsedResume = await optimizeResume(
        resumeText,
        jobDescription,
        userType,
        user.name,
        user.email,
        user.phone,
        user.linkedin,
        user.github,
        undefined, // linkedinUrl (deprecated for this call, as user.linkedin is used)
        undefined, // githubUrl (deprecated for this call, as user.github is used)
        targetRole
      );

      setParsedResumeData(parsedResume); // Store the parsed data

      // Check for missing sections identified by the AI in the parsed resume
      const missing = checkForMissingSections(parsedResume);

      if (missing.length > 0) {
        setMissingSections(missing);
        setPendingResumeData(parsedResume); // Store parsedResume for later use after modal
        setShowMissingSectionsModal(true); // Show modal to collect missing info
        // Do NOT set isOptimizing(false) here. The modal will handle its own processing state.
        // The main isOptimizing will remain true until the modal is closed or its process completes.
        return; // Exit handleOptimize, the modal will trigger the next step via handleMissingSectionsProvided
      }

      // If no missing sections, proceed directly
      await continueOptimizationProcess(parsedResume, session.access_token);

    } catch (error: any) {
      console.error('ResumeOptimizer: Error in handleOptimize (top-level catch):', error);
      if (error.message && (error.message.includes('429') || error.message.includes('Too Many Requests'))) {
        alert('Too many requests. Please wait a moment and try again.');
      } else {
        alert('Failed to optimize resume. Please try again.');
      }
      // Error caught, main finally will set isOptimizing to false
    } finally {
      console.log('ResumeOptimizer: handleOptimize finally block. Setting isOptimizing=false');
      setIsOptimizing(false); // Ensure main loading state is always turned off
    }
  };

  const continueOptimizationProcess = async (resumeData: ResumeData, accessToken: string) => {
    try {
      await handleInitialResumeProcessing(resumeData, accessToken);
    } catch (error) {
      console.error('ResumeOptimizer: Error in continueOptimizationProcess:', error);
      alert('Failed to continue optimization. Please try again.');
      throw error; // Re-throw to be caught by handleOptimize's top-level catch
    }
  };

  const handleInitialResumeProcessing = async (resumeData: ResumeData, accessToken: string) => {
    setIsCalculatingScore(true); // Set specific loading for scoring
    try {
      const initialScore = await getDetailedResumeScore(resumeData, jobDescription, setIsCalculatingScore);
      setInitialResumeScore(initialScore);

      // Set the initial optimized resume data to show the baseline preview
      setOptimizedResume(resumeData);
      setParsedResumeData(resumeData); // Ensure parsedResumeData is also updated for subsequent steps

      // Decide whether to show project analysis or proceed with final optimization
      // For now, always showing project analysis if projects exist in the resume
      if (resumeData.projects && resumeData.projects.length > 0) {
        setShowProjectAnalysis(true); // Show the project analysis modal
        // Do NOT set isCalculatingScore(false) here, it will be set in finally.
        // Do NOT set isOptimizing(false) here. The modal will trigger the next step.
      } else {
        await proceedWithFinalOptimization(resumeData, initialScore, accessToken);
      }

    } catch (error) {
      console.error('ResumeOptimizer: Error in handleInitialResumeProcessing:', error);
      alert('Failed to process resume. Please try again.');
      throw error; // Re-throw to be caught by continueOptimizationProcess or handleOptimize
    } finally {
      setIsCalculatingScore(false); // Ensure specific scoring loading is turned off
    }
  };

  const checkForMissingSections = (resumeData: ResumeData): string[] => {
    const missing: string[] = [];
    
    // Check if relevant sections are empty or contain only whitespace entries
    if (!resumeData.workExperience || resumeData.workExperience.length === 0 ||
        resumeData.workExperience.every(exp => !exp.role?.trim() && !exp.company?.trim())) {
      missing.push('workExperience');
    }
    if (!resumeData.projects || resumeData.projects.length === 0 ||
        resumeData.projects.every(proj => !proj.title?.trim())) {
      missing.push('projects');
    }
    if (!resumeData.certifications || resumeData.certifications.length === 0 ||
        resumeData.certifications.every(cert => !cert.trim())) {
      missing.push('certifications');
    }
    if (!resumeData.skills || resumeData.skills.length === 0 ||
        resumeData.skills.every(skillCat => !skillCat.list || skillCat.list.every(s => !s.trim()))) {
      missing.push('skills');
    }

    // Exclude 'summary' and 'careerObjective' from missing sections to be manually added
    // as these are typically AI-generated or handled otherwise.

    return missing;
  };

  const handleMissingSectionsProvided = async (data: any) => {
    setIsProcessingMissingSections(true); // Start loading for processing modal input
    try {
      if (!pendingResumeData) {
        throw new Error("No pending resume data to update.");
      }

      // Merge newly provided data into the pending resume data
      const updatedResume: ResumeData = {
        ...pendingResumeData,
        // Conditionally update properties if data is provided and not empty
        ...(data.workExperience && data.workExperience.length > 0 && { workExperience: data.workExperience }),
        ...(data.projects && data.projects.length > 0 && { projects: data.projects }),
        ...(data.certifications && data.certifications.length > 0 && { certifications: data.certifications }),
        ...(data.skills && data.skills.length > 0 && { skills: data.skills }),
        ...(data.summary && { summary: data.summary }), // Assuming modal might give summary/objective
        ...(data.careerObjective && { careerObjective: data.careerObjective }),
      };

      setShowMissingSectionsModal(false); // Close the modal
      setMissingSections([]); // Clear missing sections list
      setPendingResumeData(null); // Clear pending data

      const { data: { session } } = await supabase.auth.getSession();
      // Re-initiate the optimization process with the updated resume data
      await handleInitialResumeProcessing(updatedResume, session?.access_token || '');

    } catch (error) {
      console.error('ResumeOptimizer: Error processing missing sections:', error);
      alert('Failed to process the provided information. Please try again.');
      throw error; // Re-throw to be caught by handleOptimize
    } finally {
      setIsProcessingMissingSections(false); // Stop loading after processing modal input
    }
  };


  const proceedWithFinalOptimization = async (resumeData: ResumeData, initialScore: DetailedScore, accessToken: string) => {
    // Do NOT set isOptimizing(true) here. It's controlled by handleOptimize.
    try {
      await proceedWithOptimization(resumeData, initialScore, accessToken);
    } catch (error) {
      console.error('ResumeOptimizer: Error in proceedWithFinalOptimization:', error);
      alert('Failed to complete final optimization. Please try again.');
      throw error; // Re-throw to be caught by handleInitialResumeProcessing or handleOptimize
    }
    // Do NOT set isOptimizing(false) here. It's controlled by handleOptimize.
  };


  const proceedWithOptimization = async (resumeData: ResumeData, initialScore: DetailedScore, accessToken: string) => {
    try {
      console.log('Starting final AI optimization pass...');

      // First, regenerate the resume text from the *structured* resumeData, as this is what the
      // optimizeResume function currently expects as its first argument (a string).
      // If optimizeResume's first arg should be ResumeData object, adjust its signature and prompt.
      const resumeContentForOptimization = reconstructResumeText(resumeData);

      const finalOptimizedResume = await optimizeResume(
        resumeContentForOptimization,
        jobDescription,
        userType,
        user!.name,
        user!.email,
        user!.phone,
        user!.linkedin,
        user!.github,
        undefined, // linkedinUrl (deprecated)
        undefined, // githubUrl (deprecated)
        targetRole
      );

      let finalResumeData = { // Prepare the final data object
        ...finalOptimizedResume,
        targetRole: targetRole
      };

      // For this example, assuming a placeholder for advancedProjectAnalyzer
      const advancedProjectAnalyzer = {
        analyzeAndReplaceProjects: async (resume, role, jd, setLoading) => {
          setLoading(true);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
          setLoading(false);
          return { projectsToReplace: [], replacementSuggestions: [] }; // Return dummy data
        }
      };

      // Handle advanced project analysis and replacement if projects exist
      if (finalOptimizedResume.projects && finalOptimizedResume.projects.length > 0) {
        try {
          const projectAnalysis = await advancedProjectAnalyzer.analyzeAndReplaceProjects(
            finalOptimizedResume,
            targetRole || 'Software Engineer',
            jobDescription,
            setIsCalculatingScore // Pass setLoading to project analyzer
          );

          const suitableProjects = finalOptimizedResume.projects?.filter(project =>
            !projectAnalysis.projectsToReplace.some(p => p.title === project.title)
          ) || [];

          const replacementProjects = projectAnalysis.replacementSuggestions.map(suggestion => ({
            title: suggestion.title,
            bullets: suggestion.bullets,
            githubUrl: suggestion.githubUrl
          }));

          const tempFinalProjects = [...suitableProjects];
          for (const newProject of replacementProjects) {
            if (tempFinalProjects.length < 3) { // Limit to 3 projects total after replacement
              tempFinalProjects.push(newProject);
            } else {
              break;
            }
          }
          finalResumeData = {
            ...finalOptimizedResume,
            projects: tempFinalProjects
          };
          console.log(`Project replacement: ${finalOptimizedResume.projects.length} original → ${suitableProjects.length} kept + ${tempFinalProjects.length - suitableProjects.length} new = ${tempFinalProjects.length} total`);

        } catch (projectError) {
          console.warn('Project analysis/replacement failed, using original projects:', projectError);
          finalResumeData = { // Fallback to original projects if analysis fails
            ...finalOptimizedResume,
            projects: finalOptimizedResume.projects
          };
        }
      }

      // Generate "before" and "after" scores for comparison display
      const beforeScoreData = generateBeforeScore(reconstructResumeText(resumeData));
      setBeforeScore(beforeScoreData);

      const finalScore = await getDetailedResumeScore(finalResumeData, jobDescription, setIsCalculatingScore);
      setFinalResumeScore(finalScore); // Set the final detailed score

      const afterScoreData = generateAfterScore(reconstructResumeText(finalResumeData));
      setAfterScore(afterScoreData);

      // Determine changed sections for highlighting (simplified for this example)
      const sections = ['workExperience', 'education', 'projects', 'skills', 'certifications'];
      setChangedSections(sections);

      // Decrement optimization count and refresh subscription status
      const optimizationResult = await paymentService.useOptimization(user!.id);
      if (optimizationResult.success) {
        await checkSubscriptionStatus();
        setWalletRefreshKey(prevKey => prevKey + 1); // Trigger wallet refresh
      }

      // Handle mobile interface redirect
      if (window.innerWidth < 768) {
        setShowMobileInterface(true);
      }
      setActiveTab('resume'); // Ensure 'Resume Preview' tab is active upon completion

      setOptimizedResume(finalResumeData); // Final set of optimized resume data
    } catch (error) {
      console.error('ResumeOptimizer: Error in proceedWithOptimization:', error);
      alert('Failed to complete resume optimization. Please try again.');
      throw error; // Re-throw to be caught by proceedWithFinalOptimization or handleOptimize
    } finally {
      // Do NOT set isOptimizing(false) here. It's controlled by handleOptimize.
      setIsCalculatingScore(false); // Ensure specific scoring loading is turned off
    }
  };

  // Handlers for project-related modals
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

  const handleProjectOptionSelect = (option: 'manual' | 'ai') => {
    setShowProjectOptions(false);
    if (option === 'manual') {
      setShowManualProjectAdd(true);
    } else {
      setShowProjectEnhancement(true); // Directs to ProjectEnhancement modal for AI suggestions
    }
  };

  // Helper for manual project input tech stack
  const addTechToStack = () => {
    if (newTechStack.trim() && !manualProject.techStack.includes(newTechStack.trim())) {
      setManualProject(prev => ({
        ...prev,
        techStack: [...prev.techStack, newTechStack.trim()],
      }));
      setNewTechStack('');
    }
  };

  const removeTechFromStack = (tech: string) => {
    setManualProject(prev => ({
      ...prev,
      techStack: prev.techStack.filter(t => t !== tech)
    }));
  };

  // Generates project description for manual projects (can be AI-powered)
  const generateProjectDescription = async (project: typeof manualProject, jd: string): Promise<string> => {
    // This would typically involve an AI call to generate rich bullets
    return `• Developed ${project.title} using ${project.techStack.join(', ')} technologies
• Implemented core features and functionality aligned with industry best practices
• Delivered scalable solution with focus on performance and user experience`;
  };

  // Submits manually added project and triggers final optimization
  const handleManualProjectSubmit = async () => {
    if (!manualProject.title || manualProject.techStack.length === 0 || !parsedResumeData) {
      alert('Please provide project title and tech stack.');
      return;
    }

    // Do NOT set isOptimizing(true) here. It's controlled by handleOptimize.
    try {
      const projectDescriptionText = await generateProjectDescription(manualProject, jobDescription);
      const newProject = {
        title: manualProject.title,
        bullets: projectDescriptionText.split('\n').filter(line => line.trim().startsWith('•')).map(line => line.replace('•', '').trim()),
        githubUrl: manualProject.githubUrl
      };

      let updatedResume: ResumeData;
      if (lowScoringProjects.length > 0) {
        const filteredProjects = parsedResumeData.projects?.filter(project =>
          !lowScoringProjects.some(lowProject => lowProject.title === project.title)
        ) || [];
        updatedResume = { ...parsedResumeData, projects: [...filteredProjects, newProject] };
      } else {
        updatedResume = { ...parsedResumeData, projects: [...(parsedResumeData.projects || []), newProject] };
      }

      setShowManualProjectAdd(false);
      const { data: { session } } = await supabase.auth.getSession();
      // Proceed with the final AI optimization pass using the updated resume data
      if (initialResumeScore) {
        await proceedWithFinalOptimization(updatedResume, initialResumeScore, session?.access_token || '');
      } else {
        const newInitialScore = await getDetailedResumeScore(updatedResume, jobDescription, setIsCalculatingScore);
        await proceedWithFinalOptimization(updatedResume, newInitialScore, session?.access_token || '');
      }

    } catch (error) {
      console.error('Error creating manual project:', error);
      alert('Failed to create project. Please try again.');
      throw error; // Re-throw to be caught by handleOptimize
    } finally {
      // Do NOT set isOptimizing(false) here. It's controlled by handleOptimize.
    }
  };

  // Callback from ProjectEnhancement/ProjectAnalysisModal when projects are updated
  const handleProjectsUpdated = (updatedResumeData: ResumeData) => {
    console.log('Projects updated, triggering final AI re-optimization...');

    setOptimizedResume(updatedResumeData);
    setParsedResumeData(updatedResumeData);

    const { data: { session } } = supabase.auth.getSession();
    if (initialResumeScore) {
      proceedWithFinalOptimization(updatedResumeData, initialResumeScore, session?.access_token || '');
    } else {
      generateScoresAfterProjectAdd(updatedResumeData, session?.access_token || ''); // Recalculate score and then proceed
    }
  };

  // Helper to generate scores after project addition/modification, then proceed to final optimization
  const generateScoresAfterProjectAdd = async (updatedResume: ResumeData, accessToken: string) => {
    try {
      setIsCalculatingScore(true);
      const freshInitialScore = await getDetailedResumeScore(updatedResume, jobDescription, setIsCalculatingScore);
      setInitialResumeScore(freshInitialScore);
      await proceedWithFinalOptimization(updatedResume, freshInitialScore, accessToken);
    } catch (error) {
      console.error('Error generating scores after project add:', error);
      alert('Failed to generate updated scores. Please try again.');
      throw error; // Re-throw to be caught by handleOptimize
    } finally {
      setIsCalculatingScore(false);
    }
  };

  // Handlers for subscription success (closes modal, refreshes status)
  const handleSubscriptionSuccess = () => {
    checkSubscriptionStatus();
    setShowSubscriptionPlans(false);
    setWalletRefreshKey(prevKey => prevKey + 1); // Triggers wallet balance refresh in dependent components
  };

  // Mobile interface sections configuration
  const mobileSections = [
    {
      id: 'resume',
      title: 'Optimized Resume',
      icon: <FileText className="w-5 h-5" />,
      component: optimizedResume ? (
        <ResumePreview resumeData={optimizedResume} userType={userType} />
      ) : null,
      resumeData: optimizedResume // Pass resumeData directly for potential internal use
    },
    {
      id: 'analysis',
      title: 'Resume Analysis',
      icon: <BarChart3 className="w-5 h-5" />,
      component: beforeScore && afterScore && optimizedResume && jobDescription && targetRole ? (
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
      ) : null
    }
  ];

  // Renders a mobile-optimized interface if conditions met
  if (showMobileInterface && optimizedResume) {
    return <MobileOptimizedInterface sections={mobileSections} onStartNewResume={handleStartNewResume} />;
  }

  // Centralized loading overlay for all major processing states
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
          <p className="text-gray-600 mb-4">
            {subMessage}
          </p>
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
        {!optimizedResume ? ( // Conditional rendering: show input form OR results tabs
          <>
            
            <button
              onClick={onNavigateBack}
              className="mb-6 bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-md hover:shadow-lg py-3 px-5 rounded-xl inline-flex items-center space-x-2 transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:block">Back to Home</span>
            </button>

            {/* Optimization Status Dropdown (visible before optimization) */}
            {isAuthenticated && !loadingSubscription && (

            
              <div className="relative text-center mb-8 z-10">
                <button
                  onClick={() => setShowOptimizationDropdown(!showOptimizationDropdown)}
                  className="inline-flex items-center space-x-2 px-6 py-3 rounded-full transition-all duration-200 font-semibold text-sm
                                          bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                                          max-w-[300px] mx-auto justify-center"
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
            {/* End Optimization Status Dropdown */}

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
                user={user}
                onShowProfile={onShowProfile}
                isOptimizing={isOptimizing}
                currentStep={currentStep}
                setCurrentStep={setCurrentStep}
              />
            </div>
          </>
        ) : ( // Optimized resume and analysis tabs are shown after optimization
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Tabbed Navigation */}
            {optimizedResume && (
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
            )}
            {/* End Tabbed Navigation */}

            {/* Conditional Content based on Active Tab */}
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
                  finalDetailedScore={finalDetailedScore}
                />
              </>
            )}
            {/* End Conditional Content */}

          </div>
        )}

        {/* Removed SubscriptionStatus Display */}
      </div>

      {/* Modals */}
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
          // When the missing sections modal is closed without completing,
          // we should ensure the main loading state is turned off.
          setIsOptimizing(false);
        }}
        missingSections={missingSections}
        onSectionsProvided={handleMissingSectionsProvided}
      />
    </div>
  );
};

export default ResumeOptimizer;
