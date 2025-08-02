import React, { useState } from 'react';
import {
  Upload,
  FileText,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Target,
  Award,
  Lightbulb,
  Zap, // For Impact
  Clock, // For Brevity
  Palette, // For Style
  Sparkles, // For Skills Score
  FileCheck, // For ATS Compatibility
  Search, // For Keyword & Skill Match
  Briefcase, // For Project & Work Relevance
  LayoutDashboard, // For Structure & Flow
  Bug, // For Critical Fixes & Red Flags
  ArrowRight, // <--- ADD THIS LINE
} from 'lucide-react';
import { FileUpload } from './FileUpload';
import { getDetailedResumeScore } from '../services/scoringService';
import { DetailedScore } from '../types/resume';

interface ResumeScoreCheckerProps {
  onNavigateBack: () => void;
  isAuthenticated: boolean;
  onShowAuth: () => void;
}

export const ResumeScoreChecker: React.FC<ResumeScoreCheckerProps> = ({
  onNavigateBack,
  isAuthenticated,
  onShowAuth
}) => {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scoreResult, setScoreResult] = useState<DetailedScore | null>(null);

  const handleFileUpload = (text: string) => {
    setResumeText(text);
  };

  const analyzeResume = async () => {
    if (!isAuthenticated) {
      onShowAuth();
      return;
    }

    if (!resumeText.trim()) {
      alert('Please upload your resume first');
      return;
    }

    const jd = jobDescription.trim() || 'General professional role requiring relevant skills, experience, and qualifications.';

    try {
      const result = await getDetailedResumeScore(
        { rawText: resumeText } as any, // Cast to any for now; ideally, extract structured data from resumeText
        jd,
        setIsAnalyzing
      );
      setScoreResult(result);
    } catch (error) {
      console.error('Error analyzing resume:', error);
      alert('Failed to analyze resume. Please try again.');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreGrade = (score: number) => {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 75) return 'C+';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  const getCategoryScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'atsCompatibility': return <FileCheck className="w-5 h-5 mr-2 text-blue-600" />;
      case 'keywordSkillMatch': return <Search className="w-5 h-5 mr-2 text-green-600" />;
      case 'projectWorkRelevance': return <Briefcase className="w-5 h-5 mr-2 text-purple-600" />;
      case 'structureFlow': return <LayoutDashboard className="w-5 h-5 mr-2 text-indigo-600" />;
      case 'criticalFixesRedFlags': return <Bug className="w-5 h-5 mr-2 text-red-600" />;
      case 'impactScore': return <Zap className="w-5 h-5 mr-2 text-orange-600" />;
      case 'brevityScore': return <Clock className="w-5 h-5 mr-2 text-gray-600" />;
      case 'styleScore': return <Palette className="w-5 h-5 mr-2 text-pink-600" />;
      case 'skillsScore': return <Sparkles className="w-5 h-5 mr-2 text-teal-600" />;
      default: return null;
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'atsCompatibility': return 'ATS Compatibility';
      case 'keywordSkillMatch': return 'Keyword & Skill Match';
      case 'projectWorkRelevance': return 'Project & Work Relevance';
      case 'structureFlow': return 'Structure & Flow';
      case 'criticalFixesRedFlags': return 'Critical Fixes & Red Flags';
      case 'impactScore': return 'Impact Score';
      case 'brevityScore': return 'Brevity Score';
      case 'styleScore': return 'Style Score';
      case 'skillsScore': return 'Skills Score';
      default: return category;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="container-responsive">
          <div className="flex items-center justify-between h-16">
             <button
              onClick={onNavigateBack}
              className="mb-6 bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-md hover:shadow-lg py-3 px-5 rounded-xl inline-flex items-center space-x-2 transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:block">Back to Home</span>
            </button>

            <h1 className="text-lg font-semibold text-gray-900">Resume Score Checker</h1>

            <div className="w-24"></div> {/* Spacer for alignment */}
          </div>
        </div>
      </div>

      <div className="container-responsive py-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                Get Your Resume Score
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Upload your resume and get an instant ATS score with detailed analysis and improvement suggestions.
              </p>
            </div>
          </div>

          {!scoreResult ? (
            <div className="space-y-8">
              {/* Resume Upload Section */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Upload className="w-5 h-5 mr-2 text-blue-600" />
                    Upload Your Resume
                  </h2>
                  <p className="text-gray-600 mt-1">Upload your current resume for analysis</p>
                </div>
                <div className="p-6">
                  <FileUpload onFileUpload={handleFileUpload} />
                </div>
              </div>

              {/* Job Description Section (Optional) */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-green-600" />
                    Job Description (Optional)
                  </h2>
                  <p className="text-gray-600 mt-1">Add a job description for more targeted analysis</p>
                </div>
                <div className="p-6">
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description here for more specific analysis. If left empty, we'll use general industry standards."
                    className="w-full h-32 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
              </div>

              {/* Analyze Button */}
              <div className="text-center">
                <button
                  onClick={analyzeResume}
                  disabled={!resumeText.trim() || isAnalyzing}
                  className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center space-x-3 mx-auto ${
                    !resumeText.trim() || isAnalyzing
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105'
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>Analyzing Resume...</span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-6 h-6" />
                      <span>{isAuthenticated ? 'Analyze My Resume' : 'Sign In to Analyze'}</span>
                    </>
                  )}
                </button>

                {!isAuthenticated && (
                  <p className="text-sm text-gray-500 mt-3">
                    Sign in to access our AI-powered resume analysis
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Score Results */
            <div className="space-y-8">
              {/* Score Overview */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Award className="w-5 h-5 mr-2 text-green-600" />
                    Your Resume Score
                  </h2>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                    {/* Score Circle */}
                    <div className="text-center">
                      <div className="relative w-32 h-32 mx-auto mb-4">
                        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                          <circle
                            cx="60"
                            cy="60"
                            r="50"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="8"
                          />
                          <circle
                            cx="60"
                            cy="60"
                            r="50"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            strokeDasharray={`${(scoreResult.totalScore / 100) * 314} 314`}
                            strokeLinecap="round"
                            className={getScoreColor(scoreResult.totalScore)}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className={`text-3xl font-bold ${getScoreColor(scoreResult.totalScore)}`}>
                              {scoreResult.totalScore}%
                            </div>
                            <div className="text-sm text-gray-500">Grade: {getScoreGrade(scoreResult.totalScore)}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Analysis Summary */}
                    <div className="md:col-span-2">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Overall Analysis</h3>
                      <p className="text-gray-700 leading-relaxed mb-4">{scoreResult.analysis}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <h4 className="font-medium text-green-800 mb-2">Key Strengths</h4>
                          <div className="text-sm text-green-700">
                            {scoreResult.keyStrengths.length} key strengths identified
                          </div>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                          <h4 className="font-medium text-orange-800 mb-2">Areas for Improvement</h4>
                          <div className="text-sm text-orange-700">
                            {scoreResult.improvementAreas.length} areas for improvement
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown Section */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-teal-50 p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-600" />
                    Detailed Score Breakdown
                  </h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(scoreResult.breakdown).map(([category, data]) => (
                    <div key={category} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                        {getCategoryIcon(category)} {getCategoryTitle(category)}
                      </h4>
                      <div className="flex items-center mb-2">
                        <span className={`text-2xl font-bold ${getCategoryScoreColor(data.score, data.maxScore)}`}>
                          {data.score}
                        </span>
                        <span className="text-gray-500">/{data.maxScore}</span>
                      </div>
                      <p className="text-sm text-gray-700">{data.details}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations Section */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Lightbulb className="w-5 h-5 mr-2 text-purple-600" />
                    Actionable Recommendations
                  </h2>
                </div>
                <div className="p-6">
                  <ul className="space-y-3">
                    {scoreResult.recommendations.length > 0 ? (
                      scoreResult.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <ArrowRight className="w-5 h-5 text-purple-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{rec}</span>
                        </li>
                      ))
                    ) : (
                      <p className="text-gray-600 italic">No specific recommendations at this time. Your resume looks great!</p>
                    )}
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="text-center space-y-4">
                <button
                  onClick={() => setScoreResult(null)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 mr-4"
                >
                  Check Another Resume
                </button>
                <button
                  onClick={onNavigateBack}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
                >
                  Back to Home
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};