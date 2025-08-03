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

  // The rest of your step setup remains unchanged until the Optimize step
  // Replace the optimize step's button handler with onClickOptimize

  // ... your component's remaining logic and JSX ...

  // For brevity, not repeating the unchanged JSX here

  return (
    <div className="...">
      {/* your JSX with <button onClick={onClickOptimize} ...> */}
    </div>
  );
};
