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
// Assuming these imports exist in the user's project
// import { generateLinkedInMessage } from '../services/linkedinService';
// import { useAuth } from "../contexts/AuthContext";
// import { Subscription } from '../types/payment';
import { paymentService } from '../services/paymentService'; // Import paymentService to get plan details
import { useAuth } from "../contexts/AuthContext"; // Import useAuth

// Mocking the imported functions and types for a self-contained example.
// In a real application, these would be external.
const generateLinkedInMessage = async (formData: any) => {
  console.log('Generating message with data:', formData);
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call delay
  return [
    `Hi ${formData.recipientFirstName}, I hope you're having a great week! I came across your profile and was impressed by your work at ${formData.recipientCompany}. I'm reaching out because I'm very interested in ${formData.messagePurpose}. I would love to connect and learn more about your experience in the ${formData.industry} industry.`,
    `Hello ${formData.recipientFirstName}, I saw your role as ${formData.recipientJobTitle} at ${formData.recipientCompany} and was very impressed. My background is in a similar area, and I believe we share common interests. I'd love to connect on LinkedIn to expand my network and follow your journey. Best, ${formData.senderName}.`,
    `Hey ${formData.recipientFirstName}, I’m connecting with you because of ${formData.personalizedContext}. Your work at ${formData.recipientCompany} is really impressive, and I especially admire your approach to ${formData.messagePurpose}. Would love to connect and exchange ideas. Cheers, ${formData.senderName}.`
  ];
};

// Removed mock useAuth and Subscription, using actual imports

interface LinkedInMessageGeneratorProps {
  onNavigateBack: () => void;
  isAuthenticated: boolean;
  onShowAuth: () => void;
  userSubscription: Subscription | null;
  onShowSubscriptionPlans: () => void;
  onShowAlert: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error', actionText?: string, onAction?: () => void) => void;
  refreshUserSubscription: () => Promise<void>; // ADD THIS PROP
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
  messagePurpose: string;
  tone: MessageTone;
  personalizedContext: string;
  industry: string;
}

export const LinkedInMessageGenerator: React.FC<LinkedInMessageGeneratorProps> = ({
  onNavigateBack,
  isAuthenticated,
  onShowAuth,
  userSubscription,
  onShowSubscriptionPlans,
  onShowAlert,
  refreshUserSubscription, // DESTRUCTURE THE NEW PROP
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<MessageForm>({
    messageType: 'connection',
    recipientFirstName: '',
    recipientLastName: '',
    recipientCompany: '',
    recipientJobTitle: '',
    senderName: '',
    messagePurpose: '',
    tone: 'professional',
    personalizedContext: '',
    industry: ''
  });

  const [generatedMessages, setGeneratedMessages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

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
      onShowAlert('Authentication Required', 'Please sign in to generate LinkedIn messages.', 'error', 'Sign In', onShowAuth);
      return;
    }

    // Check subscription and LinkedIn message credits
    if (!userSubscription || (userSubscription.linkedinMessagesTotal - userSubscription.linkedinMessagesUsed) <= 0) {
      const planDetails = paymentService.getPlanById(userSubscription?.planId);
      const planName = planDetails?.name || 'your current plan';
      const linkedinMessagesTotal = planDetails?.linkedinMessages || 0;

      onShowAlert(
        'LinkedIn Message Credits Exhausted',
        `You have used all your ${linkedinMessagesTotal} LinkedIn Message generations from ${planName}. Please upgrade your plan to continue generating messages.`,
        'warning',
        'Upgrade Plan',
        onShowSubscriptionPlans
      );
      return;
    }

    if (!formData.recipientFirstName || !formData.messagePurpose) {
      onShowAlert('Missing Information', 'Please fill in the recipient name and message purpose.', 'warning');
      return;
    }

    setIsGenerating(true);
    try {
      const messages = await generateLinkedInMessage(formData);
      setGeneratedMessages(messages);

      // Decrement usage count and refresh subscription
      if (userSubscription) { // Ensure userSubscription is not null before attempting to use it
        const usageResult = await paymentService.useLinkedInMessage(userSubscription.userId); // Assuming useLinkedInMessage exists
        if (usageResult.success) {
          await refreshUserSubscription(); // Refresh the global subscription state
        } else {
          console.error('Failed to decrement LinkedIn message usage:', usageResult.error);
          onShowAlert('Usage Update Failed', 'Failed to record LinkedIn message usage. Please contact support.', 'error');
        }
      }

    } catch (error) {
      console.error('Error generating LinkedIn message:', error);
      onShowAlert('Generation Failed', `Failed to generate message: ${error.message || 'Unknown error'}. Please try again.`, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyMessage = async (message: string, index: number) => {
    try {
      // Using document.execCommand('copy') as navigator.clipboard.writeText()
      // might not work in some iframe environments.
      const el = document.createElement('textarea');
      el.value = message;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);

      setCopySuccess(index);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  // Function to validate current step
  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 0: // Message Type selection
        return !!formData.messageType;
      case 1: // Recipient Details
        return (
          !!formData.recipientFirstName.trim() &&
          !!formData.recipientCompany.trim() &&
          !!formData.recipientJobTitle.trim()
        );
      case 2: // Message Details
        return !!formData.messagePurpose.trim();
      default:
        return false;
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

          {/* Grid layout for message types, with improved interactive styling */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {messageTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleInputChange('messageType', type.id)}
                className={`p-6 rounded-2xl border-2 transition-all duration-300 text-left cursor-pointer transform hover:scale-105 ${
                  formData.messageType === type.id
                    ? 'border-blue-500 bg-blue-50 shadow-lg ring-4 ring-blue-200'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 shadow-md'
                }`}
              >
                <div className={`bg-gradient-to-r ${type.color} w-14 h-14 rounded-full flex items-center justify-center text-white mb-4`}>
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

          {/* Two-column responsive layout for input fields */}
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 resize-none transition-all"
              />
            </div>

            {/* Redesigned Tone Selection as a segmented control */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tone
              </label>
              {/* MODIFIED: Removed p-1, added gap-1 */}
              <div className="flex rounded-xl gap-1 bg-gray-100 border border-gray-200 shadow-inner">
                {(['professional', 'casual', 'friendly'] as MessageTone[]).map((tone) => (
                  <button
                    key={tone}
                    onClick={() => handleInputChange('tone', tone)}
                    className={`flex-1 text-center py-2 px-2 rounded-lg font-medium transition-all duration-300 capitalize ${ // px-2 is already there
                      formData.tone === tone
                        ? 'bg-white shadow-md text-blue-700 font-bold'
                        : 'text-gray-600 hover:text-blue-500'
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 resize-none transition-all"
              />
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 text-gray-900 font-sans">
      {/* Sticky Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
             <button
              onClick={onNavigateBack}
              className="mb-6 mt-5 bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-md hover:shadow-lg py-3 px-5 rounded-xl inline-flex items-center space-x-2 transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:block">Back to Home</span>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">LinkedIn Message Generator</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </div>

      {/* Main Content Area (Scrollable) */}
      <div className="flex-1 overflow-y-auto pb-24"> {/* pb-24 to prevent content from being hidden by the fixed footer */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-200">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Linkedin className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                Craft Perfect <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">LinkedIn Messages</span>
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Generate personalized LinkedIn messages that get responses. Perfect for networking, job hunting, and business outreach.
              </p>
            </div>
          </div>

          {!generatedMessages.length ? (
            <div className="space-y-8">
              {/* Progress Indicator */}
              <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Step {currentStep + 1}: {steps[currentStep].title}</h2>
                  <div className="text-sm font-medium text-gray-500">
                    Progress: {currentStep + 1} of {steps.length}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  {steps.map((step, index) => (
                    <React.Fragment key={index}>
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                            index < currentStep
                              ? 'bg-green-500 text-white border-green-500'
                              : index === currentStep
                              ? 'bg-blue-500 text-white border-blue-500 shadow-md scale-110'
                              : 'bg-white text-gray-500 border-gray-300'
                          }`}
                        >
                          {index < currentStep ? (
                            <CheckCircle className="w-6 h-6" />
                          ) : (
                            <span className="text-lg font-bold">{index + 1}</span>
                          )}
                        </div>
                        <span className={`text-xs mt-2 font-medium text-center ${
                          index <= currentStep ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {step.title}
                        </span>
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`flex-1 h-1 rounded-full mx-2 transition-all duration-300 ${
                          index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                        }`} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Current Step Content */}
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-200">
                {steps[currentStep].component}
              </div>
            </div>
          ) : (
            /* Generated Messages */
            <div className="space-y-8">
              {/* Results Header */}
              <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <h3 className="text-xl font-bold text-gray-900">
                      Messages Generated!
                    </h3>
                    <button
                      onClick={() => {
                        setGeneratedMessages([]);
                        setCurrentStep(0);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      Generate New
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600">Choose the message that best fits your style, and feel free to edit it before sending.</p>
                </div>
              </div>

              {/* Generated Messages List */}
              <div className="space-y-6">
                {generatedMessages.map((message, index) => (
                  <div key={index} className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Option {index + 1}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600 hidden sm:block">
                            {message.length} characters
                          </span>
                          <button
                            onClick={() => handleCopyMessage(message, index)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 ${
                              copySuccess === index
                                ? 'bg-green-600 text-white shadow-md'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
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
                      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                          {message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tips Section */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-6 border border-blue-200">
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

      {/* Sticky Navigation Footer */}
      {!generatedMessages.length && (
        <div className="sticky bottom-0 z-50 bg-white border-t border-gray-200 shadow-2xl">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  currentStep === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-600 hover:bg-gray-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Previous</span>
              </button>

              <div className="text-center hidden md:block">
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
                  disabled={!validateCurrentStep()}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    !validateCurrentStep()
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                  }`}
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
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
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
      )}
    </div>
  );
};
