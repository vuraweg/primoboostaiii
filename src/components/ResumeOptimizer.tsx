// src/components/InputWizard.tsx
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
  Edit3,
  Loader2
} from 'lucide-react';
import { FileUpload } from './FileUpload';
import { InputSection } from './InputSection';
import { UserType } from '../types/resume';
import { User as AuthUser } from '../types/auth';

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
  user: AuthUser | null;
  onShowProfile: (mode?: 'profile' | 'wallet') => void;
  isOptimizing: boolean;
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
  user,
  onShowProfile,
  isOptimizing
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const onClickOptimize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOptimizing) {
      console.log("🔁 Already optimizing...");
      return;
    }
    if (isAuthenticated) {
      console.log("🚀 Optimize Clicked", {
        resumeLength: resumeText.length,
        jdLength: jobDescription.length,
        userType,
      });
      handleOptimize();
    } else {
      console.log("⚠️ Not authenticated. Showing Auth Modal.");
      onShowAuth();
    }
  };

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
              {isAuthenticated && user && (
                <button
                  onClick={() => onShowProfile('profile')}
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
      isValid: true
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
            {/* fresher, student, experienced buttons */}
          </div>
        </div>
      ),
      isValid: true
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
              {/* resume summary cards */}
            </div>
            <button
              onClick={onClickOptimize}
              disabled={!resumeText.trim() || !jobDescription.trim() || isOptimizing}
              className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center space-x-3 ${
                !resumeText.trim() || !jobDescription.trim() || isOptimizing
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl cursor-pointer'
              }`}
              type="button"
            >
              {isOptimizing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Optimizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  <span>{isAuthenticated ? 'Optimize My Resume' : 'Sign In to Optimize'}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
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

  const currentStepData = steps[currentStep];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {currentStepData.component}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex justify-between items-center gap-2">
          <button onClick={handlePrevious} disabled={currentStep === 0} className="...">
            <ArrowLeft className="w-5 h-5" />
            <span>Previous</span>
          </button>
          <div className="text-center w-1/3 sm:w-48 flex-shrink-0">
            <div className="text-sm text-gray-500 mb-1">Progress</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300" style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }} />
            </div>
          </div>
          {currentStep < steps.length - 1 ? (
            <button onClick={handleNext} disabled={!currentStepData.isValid} className="...">
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
