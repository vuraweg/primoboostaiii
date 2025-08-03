import React, { useState, useEffect } from 'react';
import { FileText, Sparkles, Download, BarChart3, TrendingUp, Target, RefreshCw, Loader2 } from 'lucide-react';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';

// Mocked dependencies to make the app self-contained
// In a real application, these would be separate files and services.

const mockOptimizeResume = async (resume, jd) => {
  // Simulate a network delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const mockOptimizedData = {
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    phone: '+1 (555) 123-4567',
    linkedin: 'linkedin.com/in/janedoe',
    github: 'github.com/janedoe',
    summary: "Experienced software engineer with a strong background in developing scalable web applications. Adept at leveraging modern JavaScript frameworks to deliver high-quality, performant, and user-centric solutions.",
    workExperience: [
      {
        role: 'Senior Software Engineer',
        company: 'Innovatech Solutions',
        duration: 'Jan 2022 - Present',
        bullets: [
          "Developed and deployed a new microservices architecture, reducing latency by 40%.",
          "Mentored junior developers on best practices for React and Node.js.",
          "Led a project to refactor the e-commerce checkout flow, increasing conversion rates by 15%."
        ]
      },
    ],
    projects: [
      {
        title: 'Personal Portfolio',
        bullets: [
          "Developed a personal portfolio website using React, Tailwind CSS, and a serverless backend.",
          "Integrated continuous deployment pipeline for automated updates."
        ]
      },
    ],
    skills: [
      {
        category: 'Languages',
        list: ['JavaScript', 'TypeScript', 'Python']
      },
      {
        category: 'Frameworks',
        list: ['React', 'Node.js', 'Express', 'Tailwind CSS']
      }
    ]
  };

  return mockOptimizedData;
};

const mockGetDetailedResumeScore = async (resumeData, jobDescription) => {
  // Simulate a network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const totalScore = 75 + Math.floor(Math.random() * 25);
  return {
    totalScore,
    breakdown: {
      projects: { score: 85, feedback: "Your projects are well-aligned with the job description." },
      skills: { score: 92, feedback: "Excellent match on technical skills." },
      experience: { score: 70, feedback: "Work experience is good, but could be more results-oriented." },
      keywords: { score: 95, feedback: "Strong keyword density and relevance." }
    }
  };
};

const mockGenerateBeforeScore = (resumeText) => ({
  score: 60 + Math.floor(Math.random() * 20),
  feedback: "This is a baseline score based on your unoptimized resume."
});

const mockGenerateAfterScore = (optimizedText) => ({
  score: 85 + Math.floor(Math.random() * 15),
  feedback: "This score reflects improvements after optimization."
});

const mockCheckSubscriptionStatus = async () => {
    return {
        optimizationsTotal: 10,
        optimizationsUsed: 2,
    }
};

const mockUseOptimization = async () => {
    return {
        success: true
    }
};


// Main App Component
function App() {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [optimizedResume, setOptimizedResume] = useState(null);
  const [activeTab, setActiveTab] = useState('resume');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [beforeScore, setBeforeScore] = useState(null);
  const [afterScore, setAfterScore] = useState(null);
  const [initialDetailedScore, setInitialDetailedScore] = useState(null);
  const [finalDetailedScore, setFinalDetailedScore] = useState(null);
  const [subscription, setSubscription] = useState(null);

  // Function to handle the optimization process
  const handleOptimize = async () => {
    if (!resumeText.trim() || !jobDescription.trim()) {
      alert('Please provide both resume content and a job description.');
      return;
    }
    
    // Simulating subscription check
    if (!subscription || (subscription.optimizationsTotal - subscription.optimizationsUsed) <= 0) {
      alert('You have no optimizations remaining.');
      return;
    }

    setIsOptimizing(true);
    setOptimizedResume(null);
    setBeforeScore(null);
    setAfterScore(null);

    try {
      // Step 1: Generate initial score before optimization
      const initialScoreData = mockGenerateBeforeScore(resumeText);
      setBeforeScore(initialScoreData);
      
      const initialDetailedScoreData = await mockGetDetailedResumeScore(null, jobDescription);
      setInitialDetailedScore(initialDetailedScoreData);

      // Step 2: Simulate the AI optimization
      const optimizedData = await mockOptimizeResume(resumeText, jobDescription);
      setOptimizedResume(optimizedData);

      // Step 3: Generate score after optimization
      const afterScoreData = mockGenerateAfterScore(JSON.stringify(optimizedData));
      setAfterScore(afterScoreData);
      
      const finalDetailedScoreData = await mockGetDetailedResumeScore(optimizedData, jobDescription);
      setFinalDetailedScore(finalDetailedScoreData);

      // Step 4: Simulate using an optimization credit
      await mockUseOptimization();
      const updatedSubscription = await mockCheckSubscriptionStatus();
      setSubscription({
        ...updatedSubscription,
        optimizationsUsed: updatedSubscription.optimizationsUsed + 1
      });
      
      setActiveTab('resume');
    } catch (error) {
      console.error('Optimization failed:', error);
      alert('An error occurred during optimization. Please try again.');
    } finally {
      setIsOptimizing(false);
    }
  };
  
  const handleStartNewResume = () => {
    setResumeText('');
    setJobDescription('');
    setOptimizedResume(null);
    setBeforeScore(null);
    setAfterScore(null);
    setInitialDetailedScore(null);
    setFinalDetailedScore(null);
    setActiveTab('resume');
  };
  
  useEffect(() => {
    // Simulate fetching the initial subscription status on load
    const fetchSubscription = async () => {
        const sub = await mockCheckSubscriptionStatus();
        setSubscription(sub);
    };
    fetchSubscription();
  }, []);

  const ResumePreview = ({ resumeData }) => {
    if (!resumeData) return null;
    return (
      <div className="p-8 text-sm md:p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <h1 className="text-3xl font-bold text-gray-900">{resumeData.name}</h1>
          <p className="mt-1 text-gray-600">{resumeData.email} | {resumeData.phone}</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 mt-2 text-blue-600">
            <a href={`https://${resumeData.linkedin}`} target="_blank" rel="noopener noreferrer" className="hover:underline">LinkedIn</a>
            <a href={`https://${resumeData.github}`} target="_blank" rel="noopener noreferrer" className="hover:underline">GitHub</a>
          </div>
        </div>
        
        {/* Summary Section */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-blue-800 border-b-2 border-blue-200 pb-1">Summary</h2>
          <p className="mt-2 text-gray-700">{resumeData.summary}</p>
        </div>

        {/* Work Experience Section */}
        <div className="mt-6">
          <h2 className="text-xl font-bold text-blue-800 border-b-2 border-blue-200 pb-1">Work Experience</h2>
          {resumeData.workExperience.map((exp, index) => (
            <div key={index} className="mt-4">
              <div className="flex justify-between font-semibold text-gray-900">
                <span>{exp.role}</span>
                <span className="text-gray-600">{exp.duration}</span>
              </div>
              <p className="font-medium text-gray-700">{exp.company}</p>
              <ul className="list-disc list-inside mt-1 space-y-1 text-gray-600">
                {exp.bullets.map((bullet, i) => (
                  <li key={i} className="pl-2">{bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        {/* Projects Section */}
        <div className="mt-6">
          <h2 className="text-xl font-bold text-blue-800 border-b-2 border-blue-200 pb-1">Projects</h2>
          {resumeData.projects.map((proj, index) => (
            <div key={index} className="mt-4">
              <h3 className="font-semibold text-gray-900">{proj.title}</h3>
              <ul className="list-disc list-inside mt-1 space-y-1 text-gray-600">
                {proj.bullets.map((bullet, i) => (
                  <li key={i} className="pl-2">{bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Skills Section */}
        <div className="mt-6">
          <h2 className="text-xl font-bold text-blue-800 border-b-2 border-blue-200 pb-1">Skills</h2>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-gray-700">
            {resumeData.skills.map((skillGroup, index) => (
              <div key={index}>
                <span className="font-semibold text-gray-900">{skillGroup.category}:</span> {skillGroup.list.join(', ')}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  const ComprehensiveAnalysis = ({ beforeScore, afterScore, initialDetailedScore, finalDetailedScore }) => {
    const renderScoreSection = (title, scoreData, detailedScoreData, isInitial) => {
        const score = isInitial ? detailedScoreData?.totalScore : scoreData?.score;
        return (
            <div className={`p-6 rounded-xl shadow-md ${isInitial ? 'bg-orange-50' : 'bg-green-50'}`}>
                <h3 className="text-2xl font-bold flex items-center gap-2">
                    {isInitial ? <TrendingUp className="text-orange-500" /> : <TrendingUp className="text-green-500" />}
                    {title}
                </h3>
                <div className="mt-4 flex items-baseline">
                    <span className={`text-6xl font-extrabold ${isInitial ? 'text-orange-600' : 'text-green-600'}`}>
                        {score || 'N/A'}
                    </span>
                    <span className="text-2xl font-semibold text-gray-500">/100</span>
                </div>
                <p className="mt-2 text-gray-600 font-medium">{scoreData?.feedback}</p>
                {detailedScoreData && (
                    <div className="mt-4 space-y-2">
                        {Object.entries(detailedScoreData.breakdown).map(([section, data]) => (
                            <div key={section} className="flex items-center justify-between text-gray-700">
                                <span className="capitalize font-medium">{section.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                <span className="font-bold">{data.score}/100</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="grid md:grid-cols-2 gap-8">
            {renderScoreSection('Before Optimization Score', beforeScore, initialDetailedScore, true)}
            {renderScoreSection('After Optimization Score', afterScore, finalDetailedScore, false)}
        </div>
    );
};

  return (
    <div className="min-h-screen bg-gray-50 font-sans p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-extrabold text-center text-gray-900 mt-8">
          Resume Optimizer <Sparkles className="inline-block text-yellow-500 w-8 h-8 ml-2" />
        </h1>
        <p className="text-center text-gray-600 max-w-2xl mx-auto">
          Upload your resume and a job description to get an AI-powered, optimized resume and a comprehensive score analysis.
        </p>

        {isOptimizing && (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-lg">
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
            <p className="mt-4 text-xl font-semibold text-gray-700">Optimizing Your Resume...</p>
            <p className="mt-2 text-sm text-gray-500">This may take a moment as our AI works its magic.</p>
          </div>
        )}

        {!isOptimizing && !optimizedResume && (
          <div className="p-8 bg-white rounded-xl shadow-lg">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Resume Text</label>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your resume text here..."
                  rows={10}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Description</label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                  rows={5}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={handleOptimize}
                className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Sparkles className="w-5 h-5" />
                <span>Optimize My Resume</span>
              </button>
            </div>
          </div>
        )}

        {!isOptimizing && optimizedResume && (
          <div className="mt-8">
            <div className="flex justify-center space-x-4 mb-6">
              <button
                onClick={() => setActiveTab('resume')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-colors ${
                  activeTab === 'resume' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span>Optimized Resume</span>
              </button>
              <button
                onClick={() => setActiveTab('analysis')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-colors ${
                  activeTab === 'analysis' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                <span>Score Analysis</span>
              </button>
              <button
                onClick={handleStartNewResume}
                className="flex items-center space-x-2 px-6 py-3 rounded-xl font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Start New</span>
              </button>
            </div>

            {activeTab === 'resume' && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-100 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                    <FileText className="text-green-600" />
                    <span>Your Optimized Resume</span>
                  </h2>
                </div>
                <ResumePreview resumeData={optimizedResume} />
              </div>
            )}
            
            {activeTab === 'analysis' && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <ComprehensiveAnalysis 
                  beforeScore={beforeScore}
                  afterScore={afterScore}
                  initialDetailedScore={initialDetailedScore}
                  finalDetailedScore={finalDetailedScore}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
