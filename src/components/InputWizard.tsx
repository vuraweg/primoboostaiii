import React, { useState } from 'react';
import {
  Upload,
  FileText,
  User,
  Briefcase,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle,
  Edit3 // Added for profile update button
} from 'lucide-react';
import { FileUpload } from './FileUpload';
import { InputSection } from './InputSection';
import { UserType } from '../types/resume';
import { User as AuthUser } from '../types/auth'; // Import User type from auth

interface InputWizardProps {
  resumeText: string;
  setResumeText: (value: string) => void;
  jobDescription: string;
  setJobDescription: (value: string) => void;
  targetRole: string;
  setTargetRole: (value: string) => void;
  userType: UserType;
  setUserType: (value: UserType) => void;
  handleOptimize: () => void;
  isAuthenticated: boolean;
  onShowAuth: () => void;
  user: AuthUser | null; // Added user prop
  onShowProfile: (mode?: 'profile' | 'wallet') => void; // Added onShowProfile prop
}

export const InputWizard: React.FC<InputWizardProps> = ({
  resumeText,
  setResumeText,
  jobDescription,
  setJobDescription,
  targetRole,
  setTargetRole,
  userType,
  setUserType,
  handleOptimize,
  isAuthenticated,
  onShowAuth,
  user, // Destructure user
  onShowProfile // Destructure onShowProfile
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      id: 'upload',
      title: 'Upload Resume',
      icon: <Upload className="w-6 h-6" />,
      component: (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Upload className="w-5 h-5 mr-2 text-blue-600" />
            Upload Resume
          </h2>
          <FileUpload onFileUpload={setResumeText} />
        </div>
      ),
      isValid: resumeText.trim().length > 0
    },
    {
      id: 'details',
      title: 'Job Details',
      icon: <FileText className="w-6 h-6" />,
      component: (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-green-600" />
            Resume & Job Details
          </h2>
          <InputSection
            resumeText={resumeText}
            jobDescription={jobDescription}
            onResumeChange={setResumeText}
            onJobDescriptionChange={setJobDescription}
          />
        </div>
      ),
      isValid: resumeText.trim().length > 0 && jobDescription.trim().length > 0
    },
    {
      id: 'social',
      title: 'Target Role',
      icon: <User className="w-6 h-6" />,
      component: (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2 text-purple-600" />
            Target Role (Optional)
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role Title
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g., Senior Software Engineer, Product Manager..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <p className="text-xs text-gray-500 mt-2">
                Specify the exact role title for more targeted project recommendations
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">📝 Profile Information</p>
                  <p className="text-blue-700">
                    Your name, email, phone, LinkedIn, and GitHub details will be automatically populated from your profile settings. You can update these in your profile settings from the user menu.
                  </p>
                </div>
              </div>
              {/* Updated button condition */}
              {isAuthenticated && user && (
                <button
                  onClick={() => onShowProfile('profile')} // Explicitly pass 'profile' mode
                  className="mt-4 w-full flex items-center justify-center space-x-2 btn-primary py-2 px-4 rounded-lg text-sm"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Update Your Details</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ),
      isValid: true // Optional step, always valid
    },
    {
      id: 'experience',
      title: 'Experience Level',
      icon: <Briefcase className="w-6 h-6" />,
      component: (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Briefcase className="w-5 h-5 mr-2 text-indigo-600" />
            Experience Level
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => setUserType('fresher')}
              className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all cursor-pointer ${
                userType === 'fresher'
                  ? 'border-green-500 bg-green-50 shadow-md'
                  : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
              }`}
            >
              <User className={`w-8 h-8 mb-3 ${userType === 'fresher' ? 'text-green-600' : 'text-gray-500'}`} />
              <span className="font-semibold text-lg mb-2">Fresher/New Graduate</span>
              <span className="text-sm text-gray-500 text-center">Recent graduate or entry-level professional</span>
            </button>

            <button
              onClick={() => setUserType('student')}
              className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all cursor-pointer ${
                userType === 'student'
                  ? 'border-purple-500 bg-purple-50 shadow-md'
                  : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
              }`}
            >
              <User className={`w-8 h-8 mb-3 ${userType === 'student' ? 'text-purple-600' : 'text-gray-500'}`} />
              <span className="font-semibold text-lg mb-2">College Student</span>
              <span className="text-sm text-gray-500 text-center">Current student seeking internships</span>
            </button>
            <button
              onClick={() => setUserType('experienced')}
              className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all cursor-pointer ${
                userType === 'experienced'
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <Briefcase className={`w-8 h-8 mb-3 ${userType === 'experienced' ? 'text-blue-600' : 'text-gray-500'}`} />
              <span className="font-semibold text-lg mb-2">Experienced Professional</span>
              <span className="text-sm text-gray-500 text-center">Professional with 1+ years of work experience</span>
            </button>
          </div>
        </div>
      ),
      isValid: true // Always valid since userType has a default value
    },
    {
      id: 'optimize',
      title: 'Optimize',
      icon: <Sparkles className="w-6 h-6" />,
      component: (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
            Ready to Optimize
          </h2>
          <div className="text-center space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Your Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    <span className="font-medium">Resume Uploaded</span>
                  </div>
                  <p className="text-gray-600">{resumeText.length} characters</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    <span className="font-medium">Job Description</span>
                  </div>
                  <p className="text-gray-600">{jobDescription.length} characters</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center mb-2">
                    <User className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="font-medium">Experience Level</span>
                  </div>
                  <p className="text-gray-600 capitalize">
                    {userType === 'student' ? 'College Student' : userType}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center mb-2">
                    <Briefcase className="w-4 h-4 text-purple-600 mr-2" />
                    <span className="font-medium">Target Role</span>
                  </div>
                  <p className="text-gray-600">{targetRole || 'Not specified'}</p>
                </div>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Optimize button clicked', { isAuthenticated, resumeText: resumeText.length, jobDescription: jobDescription.length });
                if (isAuthenticated) {
                  handleOptimize();
                } else {
                  onShowAuth();
                }
              }}
              disabled={!resumeText.trim() || !jobDescription.trim()}
              className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center space-x-3 ${
                !resumeText.trim() || !jobDescription.trim()
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl cursor-pointer'
              }`}
              type="button"
            >
              <Sparkles className="w-6 h-6" />
              <span>{isAuthenticated ? 'Optimize My Resume' : 'Sign In to Optimize'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            {!isAuthenticated && (
              <p className="text-center text-sm text-gray-500">
                You need to be signed in to optimize your resume.
              </p>
            )}
          </div>
        </div>
      ),
      isValid: resumeText.trim().length > 0 && jobDescription.trim().length > 0
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const itemBaseWidth = 96;
  const itemMarginRight = 16;
  const itemFullWidth = itemBaseWidth + itemMarginRight;

  const visibleIconsCount = 3;

  const maxScrollLeft = -(Math.max(0, steps.length - visibleIconsCount) * itemFullWidth);

  let translateX = 0;
  const targetCenterIndex = Math.floor(visibleIconsCount / 2);

  if (currentStep > targetCenterIndex) {
    translateX = -(currentStep - targetCenterIndex) * itemFullWidth;
  }

  translateX = Math.max(maxScrollLeft, translateX);
  translateX = Math.min(0, translateX);

  const currentStepData = steps[currentStep];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Progress Indicator */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Resume Optimization </h1>
          <div className="text-sm text-gray-500">
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>

        {/* Step Progress Bar - Carousel Effect */}
        <div className="relative overflow-hidden w-[320px] mx-auto md:w-auto">
          <div
            className="flex items-center space-x-4 mb-6 transition-transform duration-300"
            style={{ transform: `translateX(${translateX}px)` }}
          >
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center w-24 flex-shrink-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      index < currentStep
                        ? 'bg-green-500 text-white'
                        : index === currentStep
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {index < currentStep ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <span className={`text-xs mt-2 font-medium text-center ${
                    index <= currentStep ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                    index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Current Step Content */}
      <div className="transition-all duration-300">
        {currentStepData.component}
      </div>

      {/* Navigation Buttons */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex justify-between items-center gap-2">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 w-1/3 sm:w-auto flex-shrink-0 ${
              currentStep === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-600 hover:bg-gray-700 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Previous</span>
          </button>

          <div className="text-center w-1/3 sm:w-48 flex-shrink-0">
            <div className="text-sm text-gray-500 mb-1">Progress</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!currentStepData.isValid}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 w-1/3 sm:w-auto flex-shrink-0 ${
                !currentStepData.isValid
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              <span>Next</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-1/3 sm:w-24 flex-shrink-0" />
          )}
        </div>
      </div>
    </div>
  );
};