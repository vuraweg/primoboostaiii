// src/components/LinkedInMessageGenerator.tsx
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  MessageCircle,
  Send,
  Copy,
  RefreshCw,
  User,
  Building,
  Target,
  Loader2,
  CheckCircle,
  AlertCircle,
  Linkedin,
  Users,
  Mail,
  Phone,
  Sparkles,
  Zap,
  Heart,
  ArrowRight,
  Briefcase
} from 'lucide-react';
import { generateLinkedInMessage } from '../services/linkedinService';
import { useAuth } from "../contexts/AuthContext";

interface LinkedInMessageGeneratorProps {
  onNavigateBack: () => void;
  isAuthenticated: boolean;
  onShowAuth: () => void;
}

type MessageType = 'connection' | 'cold-outreach' | 'follow-up' | 'job-inquiry';
type MessageTone = 'professional' | 'casual' | 'friendly';

interface MessageForm {
  messageType: MessageType;
  recipientFirstName: string;
  recipientLastName: string;
  recipientCompany: string;
  recipientJobTitle: string;
  senderName: string;
  // senderCompany: string; // Removed
  // senderRole: string; // Removed
  messagePurpose: string;
  tone: MessageTone;
  personalizedContext: string;
  industry: string;
}

export const LinkedInMessageGenerator: React.FC<LinkedInMessageGeneratorProps> = ({
  onNavigateBack,
  isAuthenticated,
  onShowAuth
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<MessageForm>({
    messageType: 'connection',
    recipientFirstName: '',
    recipientLastName: '',
    recipientCompany: '',
    recipientJobTitle: '',
    senderName: '',
    // senderCompany: '', // Removed
    // senderRole: '', // Removed
    messagePurpose: '',
    tone: 'professional',
    personalizedContext: '',
    industry: ''
  });

  const [generatedMessages, setGeneratedMessages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(0); // Start from 0, as "Message Type" is now the first step

  // Automatically set the sender's name from the authenticated user's data
  useEffect(() => {
    if (user?.name) {
      setFormData(prev => ({ ...prev, senderName: user.name }));
    }
  }, [user]);

  const messageTypes = [
    {
      id: 'connection' as MessageType,
      title: 'Connection Request',
      description: 'Send a personalized connection request to expand your network',
      icon: <Users className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'cold-outreach' as MessageType,
      title: 'Cold Outreach',
      description: 'Reach out to prospects or potential collaborators',
      icon: <Mail className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'follow-up' as MessageType,
      title: 'Follow-up Message',
      description: 'Follow up on previous conversations or meetings',
      icon: <RefreshCw className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'job-inquiry' as MessageType,
      title: 'Job Inquiry',
      description: 'Inquire about job opportunities or express interest',
      icon: <Briefcase className="w-6 h-6" />,
      color: 'from-orange-500 to-red-500'
    }
  ];

  const handleInputChange = (field: keyof MessageForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerateMessage = async () => {
    if (!isAuthenticated) {
      onShowAuth();
      return;
    }

    if (!formData.recipientFirstName || !formData.messagePurpose) {
      alert('Please fill in the recipient name and message purpose');
      return;
    }

    setIsGenerating(true);
    try {
      const messages = await generateLinkedInMessage(formData);
      setGeneratedMessages(messages);
    } catch (error) {
      console.error('Error generating LinkedIn message:', error);
      alert('Failed to generate message. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyMessage = async (message: string, index: number) => {
    try {
      await navigator.clipboard.writeText(message); // Use modern clipboard API
      setCopySuccess(index);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
      // Fallback for older browsers if needed, but navigator.clipboard is widely supported
    }
  };

  const steps = [
    {
      title: 'Message Type',
      component: (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Choose Message Type</h2>
            <p className="text-gray-600">Select the type of LinkedIn message you want to generate</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {messageTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleInputChange('messageType', type.id)}
                className={`p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                  formData.messageType === type.id
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <div className={`bg-gradient-to-r ${type.color} w-12 h-12 rounded-lg flex items-center justify-center text-white mb-4`}>
                  {type.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{type.title}</h3>
                <p className="text-gray-600 text-sm">{type.description}</p>
              </button>
            ))}
          </div>
        </div>
      )
    },
    {
      title: 'Recipient Details',
      component: (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Recipient Information</h2>
            <p className="text-gray-600">Tell us about the person you're reaching out to</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                value={formData.recipientFirstName}
                onChange={(e) => handleInputChange('recipientFirstName', e.target.value)}
                placeholder="John"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={formData.recipientLastName}
                onChange={(e) => handleInputChange('recipientLastName', e.target.value)}
                placeholder="Smith"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company *
              </label>
              <input
                type="text"
                value={formData.recipientCompany}
                onChange={(e) => handleInputChange('recipientCompany', e.target.value)}
                placeholder="TechCorp Inc."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                value={formData.recipientJobTitle}
                onChange={(e) => handleInputChange('recipientJobTitle', e.target.value)}
                placeholder="Senior Software Engineer"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry
              </label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                placeholder="Technology, Healthcare, Finance, etc."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Message Details',
      component: (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Message Configuration</h2>
            <p className="text-gray-600">Customize your message tone and purpose</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Purpose *
              </label>
              <textarea
                value={formData.messagePurpose}
                onChange={(e) => handleInputChange('messagePurpose', e.target.value)}
                placeholder="Why are you reaching out? What do you want to achieve?"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tone
              </label>
              <div className="grid grid-cols-3 gap-4">
                {(['professional', 'casual', 'friendly'] as MessageTone[]).map((tone) => (
                  <button
                    key={tone}
                    onClick={() => handleInputChange('tone', tone)}
                    className={`p-4 rounded-lg border-2 transition-all capitalize ${
                      formData.tone === tone
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Personalized Context
              </label>
              <textarea
                value={formData.personalizedContext}
                onChange={(e) => handleInputChange('personalizedContext', e.target.value)}
                placeholder="Any specific details about them or shared connections/interests..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 resize-none"
              />
            </div>
          </div>
        </div>
      )
    }
  ];

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


            <h1 className="text-lg font-semibold text-gray-900">LinkedIn Message Generator</h1>

            <div className="w-24"></div>
          </div>
        </div>
      </div>

      <div className="container-responsive py-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                LinkedIn Message Generator
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Generate personalized LinkedIn messages that get responses. Perfect for networking, job hunting, and business outreach.
              </p>
            </div>
          </div>

          {!generatedMessages.length ? (
            <div className="space-y-8">
              {/* Progress Indicator */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Message Setup</h2>
                  <div className="text-sm text-gray-500">
                    Step {currentStep + 1} of {steps.length}
                  </div>
                </div>

                <div className="flex items-center space-x-4 mb-6">
                  {steps.map((step, index) => (
                    <React.Fragment key={index}>
                      <div className="flex flex-col items-center">
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
                            <span className="text-sm font-bold">{index + 1}</span>
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

              {/* Current Step Content */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                {steps[currentStep].component}
              </div>

              {/* Navigation */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                      currentStep === 0
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-600 hover:bg-gray-700 text-white shadow-lg hover:shadow-xl'
                    }`}
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Previous</span>
                  </button>

                  <div className="text-center">
                    <div className="text-sm text-gray-500 mb-1">Progress</div>
                    <div className="w-48 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  {currentStep < steps.length - 1 ? (
                    <button
                      onClick={() => setCurrentStep(currentStep + 1)}
                      className="flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
                    >
                      <span>Next</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      onClick={handleGenerateMessage}
                      disabled={!formData.recipientFirstName || !formData.messagePurpose || isGenerating}
                      className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                        !formData.recipientFirstName || !formData.messagePurpose || isGenerating
                          ? 'bg-gray-400 cursor-not-allowed text-white'
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          <span>{isAuthenticated ? 'Generate Messages' : 'Sign In to Generate'}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Generated Messages */
            <div className="space-y-8">
              {/* Results Header */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Messages Generated!
                    </h3>
                    <button
                      onClick={() => {
                        setGeneratedMessages([]);
                        setCurrentStep(0);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      Generate New
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600">Choose the message that best fits your style</p>
                </div>
              </div>

              {/* Generated Messages */}
              <div className="space-y-6">
                {generatedMessages.map((message, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Message Option {index + 1}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">
                            {message.length} characters
                          </span>
                          <button
                            onClick={() => handleCopyMessage(message, index)}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all ${
                              copySuccess === index
                                ? 'bg-green-600 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            {copySuccess === index ? (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                          {message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tips Section */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Zap className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">💡 Tips for Better Results</h4>
                    <ul className="text-blue-800 text-sm space-y-1">
                      <li>• Personalize with specific details about their work or company</li>
                      <li>• Keep messages concise and focused on value</li>
                      <li>• Always include a clear call-to-action</li>
                      <li>• Follow up if you don't get a response within a week</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
