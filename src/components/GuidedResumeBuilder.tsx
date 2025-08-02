import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  User,
  GraduationCap,
  Briefcase,
  Code,
  Award,
  Plus,
  Minus,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Github,
  Calendar,
  Building,
  FileText,
  CheckCircle,
  Loader2,
  Download,
  Eye
} from 'lucide-react';
import { UserType, ResumeData } from '../types/resume';
import { optimizeResume } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { ResumePreview } from './ResumePreview';
import { ExportButtons } from './ExportButtons';

interface ContactDetails {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
}

interface Education {
  degree: string;
  school: string;
  year: string;
  cgpa: string;
  location: string;
}

interface WorkExperience {
  role: string;
  company: string;
  year: string;
  bullets: string[];
}

interface Project {
  title: string;
  bullets: string[];
}

interface FormData {
  experienceLevel: UserType;
  contactDetails: ContactDetails;
  education: Education[];
  workExperience: WorkExperience[];
  projects: Project[];
  skills: { [category: string]: string[] };
  certifications: string[];
  achievements: string[];
  additionalSections: {
    includeCertifications: boolean;
    includeAchievements: boolean;
  };
}

interface GuidedResumeBuilderProps {
  onNavigateBack: () => void;
}

export const GuidedResumeBuilder: React.FC<GuidedResumeBuilderProps> = ({ onNavigateBack }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResume, setGeneratedResume] = useState<ResumeData | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    experienceLevel: 'fresher',
    contactDetails: {
      fullName: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      location: '',
      linkedin: user?.linkedin || '',
      github: user?.github || ''
    },
    education: [{
      degree: '',
      school: '',
      year: '',
      cgpa: '',
      location: ''
    }],
    workExperience: [{
      role: '',
      company: '',
      year: '',
      bullets: ['']
    }],
    projects: [{
      title: '',
      bullets: ['']
    }],
    skills: {
      'Programming Languages': [''],
      'Frameworks & Libraries': [''],
      'Tools & Technologies': [''],
      'Soft Skills': ['']
    },
    certifications: [''],
    achievements: [''],
    additionalSections: {
      includeCertifications: false,
      includeAchievements: false
    }
  });

  const steps = [
    {
      id: 'experience',
      title: 'Experience Level',
      icon: <User className="w-5 h-5" />,
      description: 'Tell us about your professional background'
    },
    {
      id: 'contact',
      title: 'Contact Details',
      icon: <Mail className="w-5 h-5" />,
      description: 'Your basic information and contact details'
    },
    {
      id: 'education',
      title: 'Education',
      icon: <GraduationCap className="w-5 h-5" />,
      description: 'Your academic background and qualifications'
    },
    {
      id: 'experience-work',
      title: 'Work Experience',
      icon: <Briefcase className="w-5 h-5" />,
      description: 'Your professional experience and internships'
    },
    {
      id: 'projects',
      title: 'Projects',
      icon: <Code className="w-5 h-5" />,
      description: 'Your personal and academic projects'
    },
    {
      id: 'skills',
      title: 'Skills',
      icon: <Award className="w-5 h-5" />,
      description: 'Your technical and soft skills'
    },
    {
      id: 'additional',
      title: 'Additional Sections',
      icon: <Plus className="w-5 h-5" />,
      description: 'Optional sections like certifications and achievements'
    },
    {
      id: 'review',
      title: 'Review & Generate',
      icon: <CheckCircle className="w-5 h-5" />,
      description: 'Review your information and generate your resume'
    }
  ];

  const updateFormData = (section: keyof FormData, data: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: data
    }));
  };

  const addArrayItem = (section: keyof FormData, item: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: [...(prev[section] as any[]), item]
    }));
  };

  const removeArrayItem = (section: keyof FormData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [section]: (prev[section] as any[]).filter((_, i) => i !== index)
    }));
  };

  const updateArrayItem = (section: keyof FormData, index: number, data: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: (prev[section] as any[]).map((item, i) => i === index ? data : item)
    }));
  };

  const updateSkills = (category: string, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: prev.skills[category].map((skill, i) => i === index ? value : skill)
      }
    }));
  };

  const addSkill = (category: string) => {
    setFormData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: [...prev.skills[category], '']
      }
    }));
  };

  const removeSkill = (category: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: prev.skills[category].filter((_, i) => i !== index)
      }
    }));
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 0: // Experience Level
        return formData.experienceLevel !== '';
      case 1: // Contact Details
        return formData.contactDetails.fullName && formData.contactDetails.email;
      case 2: // Education
        return formData.education.some(edu => edu.degree && edu.school);
      case 3: // Work Experience
        // Work experience is optional, so it's always true.
        // If you wanted to make it required for 'experienced' users, you'd add:
        // return formData.experienceLevel === 'fresher' || formData.workExperience.some(exp => exp.role && exp.company);
        return true;
      case 4: // Projects
        // Projects are optional. If you wanted to make at least one title required:
        // return formData.projects.some(proj => proj.title.trim() !== '');
        return true;
      case 5: // Skills
        // Requires at least one non-empty skill across all categories
        return Object.values(formData.skills).some(skillArray => skillArray.some(skill => skill.trim() !== ''));
      case 6: // Additional Sections
        // Additional sections are optional, so it's always true.
        return true;
      case 7: // Review & Generate - always can proceed to generate once here
        return true;
      default:
        return true;
    }
  };

  const generateResume = async () => {
    setIsGenerating(true);
    try {
      // Construct a basic resume text from form data
      const resumeText = constructResumeText(formData);

      // Use a generic job description for formatting
      const genericJobDescription = "We are looking for a motivated individual with strong technical skills and good communication abilities. The ideal candidate should have relevant education and experience in their field.";

      const result = await optimizeResume(
        resumeText,
        genericJobDescription,
        formData.experienceLevel,
        formData.contactDetails.fullName,
        formData.contactDetails.email,
        formData.contactDetails.phone,
        formData.contactDetails.linkedin,
        formData.contactDetails.github,
        formData.contactDetails.linkedin, // These last two seem redundant based on your current setup.
        formData.contactDetails.github,   // You might want to review the optimizeResume signature.
        '' // No specific target role
      );

      setGeneratedResume(result);
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating resume:', error);
      alert('Failed to generate resume. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const constructResumeText = (data: FormData): string => {
    let text = `Name: ${data.contactDetails.fullName}\n`;
    text += `Email: ${data.contactDetails.email}\n`;
    text += `Phone: ${data.contactDetails.phone}\n`;
    if (data.contactDetails.location) text += `Location: ${data.contactDetails.location}\n`;
    if (data.contactDetails.linkedin) text += `LinkedIn: ${data.contactDetails.linkedin}\n`;
    if (data.contactDetails.github) text += `GitHub: ${data.contactDetails.github}\n`;

    // Education
    text += '\nEDUCATION:\n';
    data.education.forEach(edu => {
      if (edu.degree.trim() && edu.school.trim()) {
        text += `${edu.degree} from ${edu.school} (${edu.year})`;
        if (edu.cgpa.trim()) text += ` - CGPA: ${edu.cgpa}`;
        if (edu.location.trim()) text += ` - ${edu.location}`;
        text += '\n';
      }
    });

    // Work Experience
    if (data.workExperience.some(exp => exp.role.trim() && exp.company.trim())) {
      text += '\nWORK EXPERIENCE:\n';
      data.workExperience.forEach(exp => {
        if (exp.role.trim() && exp.company.trim()) {
          text += `${exp.role} at ${exp.company} (${exp.year})\n`;
          exp.bullets.forEach(bullet => {
            if (bullet.trim()) text += `• ${bullet}\n`;
          });
        }
      });
    }

    // Projects
    if (data.projects.some(proj => proj.title.trim())) {
      text += '\nPROJECTS:\n';
      data.projects.forEach(proj => {
        if (proj.title.trim()) {
          text += `${proj.title}\n`;
          proj.bullets.forEach(bullet => {
            if (bullet.trim()) text += `• ${bullet}\n`;
          });
        }
      });
    }

    // Skills
    text += '\nSKILLS:\n';
    Object.entries(data.skills).forEach(([category, skills]) => {
      const filteredSkills = skills.filter(skill => skill.trim() !== '');
      if (filteredSkills.length > 0) {
        text += `${category}: ${filteredSkills.join(', ')}\n`;
      }
    });

    // Certifications
    if (data.additionalSections.includeCertifications && data.certifications.some(cert => cert.trim())) {
      text += '\nCERTIFICATIONS:\n';
      data.certifications.forEach(cert => {
        if (cert.trim()) text += `• ${cert}\n`;
      });
    }

    // Achievements
    if (data.additionalSections.includeAchievements && data.achievements.some(ach => ach.trim())) {
      text += '\nACHIEVEMENTS:\n';
      data.achievements.forEach(ach => {
        if (ach.trim()) text += `• ${ach}\n`;
      });
    }

    return text;
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === steps.length - 1) {
      // This is the "Review & Generate" step
      generateResume();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // This entire block handles displaying the generated resume and export options
  if (showPreview && generatedResume) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container-responsive py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="w-12 h-12 text-green-600 mr-3" />
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Resume Generated Successfully!</h1>
                  <p className="text-gray-600 mt-1">Your professional resume is ready for download</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setShowPreview(false)}
                  className="flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
                >
                  <Eye className="w-5 h-5" />
                  <span>Edit Resume</span>
                </button>
                <button
                  onClick={onNavigateBack}
                  className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="block sm:inline">Back to Home</span>

                </button>
              </div>
            </div>
          </div>

          {/* Resume Preview and Export */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Resume Preview */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-green-600" />
                    Your Generated Resume
                  </h2>
                </div>
                <ResumePreview resumeData={generatedResume} userType={formData.experienceLevel} />
              </div>
            </div>

            {/* Export Options */}
            <div className="lg:col-span-1">
              <ExportButtons resumeData={generatedResume} userType={formData.experienceLevel} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Experience Level
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">What's your experience level?</h2>
              <p className="text-gray-600">This helps us customize your resume format</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { id: 'fresher', label: 'Fresher/New Graduate', desc: 'Just graduated or starting career', icon: <GraduationCap className="w-8 h-8" /> },
                { id: 'student', label: 'Student', desc: 'Currently studying, seeking internships', icon: <User className="w-8 h-8" /> },
                { id: 'experienced', label: 'Experienced Professional', desc: '1+ years of work experience', icon: <Briefcase className="w-8 h-8" /> }
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => updateFormData('experienceLevel', option.id as UserType)}
                  className={`p-6 rounded-2xl border-2 transition-all duration-300 text-center hover:scale-105 ${
                    formData.experienceLevel === option.id
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    formData.experienceLevel === option.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {option.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{option.label}</h3>
                  <p className="text-sm text-gray-600">{option.desc}</p>
                </button>
              ))}
            </div>
          </div>
        );

      case 1: // Contact Details
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Contact Information</h2>
              <p className="text-gray-600">Tell us how employers can reach you</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.contactDetails.fullName}
                    onChange={(e) => updateFormData('contactDetails', { ...formData.contactDetails, fullName: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.contactDetails.email}
                    onChange={(e) => updateFormData('contactDetails', { ...formData.contactDetails, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.contactDetails.phone}
                    onChange={(e) => updateFormData('contactDetails', { ...formData.contactDetails, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.contactDetails.location}
                    onChange={(e) => updateFormData('contactDetails', { ...formData.contactDetails, location: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="City, State"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn Profile
                </label>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="url"
                    value={formData.contactDetails.linkedin}
                    onChange={(e) => updateFormData('contactDetails', { ...formData.contactDetails, linkedin: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GitHub Profile
                </label>
                <div className="relative">
                  <Github className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="url"
                    value={formData.contactDetails.github}
                    onChange={(e) => updateFormData('contactDetails', { ...formData.contactDetails, github: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://github.com/yourusername"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 2: // Education
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Education Background</h2>
              <p className="text-gray-600">Add your educational qualifications</p>
            </div>

            {formData.education.map((edu, index) => (
              <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Education #{index + 1}</h3>
                  {formData.education.length > 1 && (
                    <button
                      onClick={() => removeArrayItem('education', index)}
                      className="text-red-600 hover:text-red-700 p-2"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Degree *</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => updateArrayItem('education', index, { ...edu, degree: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Bachelor of Science in Computer Science"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">School/University *</label>
                    <input
                      type="text"
                      value={edu.school}
                      onChange={(e) => updateArrayItem('education', index, { ...edu, school: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Stanford University"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                    <input
                      type="text"
                      value={edu.year}
                      onChange={(e) => updateArrayItem('education', index, { ...edu, year: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 2020-2024"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CGPA/GPA</label>
                    <input
                      type="text"
                      value={edu.cgpa}
                      onChange={(e) => updateArrayItem('education', index, { ...edu, cgpa: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 3.8/4.0"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      value={edu.location}
                      onChange={(e) => updateArrayItem('education', index, { ...edu, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Stanford, CA"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={() => addArrayItem('education', { degree: '', school: '', year: '', cgpa: '', location: '' })}
              className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 text-gray-600 hover:text-gray-800 hover:border-gray-400 transition-colors flex items-center justify-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Another Education
            </button>
          </div>
        );

      case 3: // Work Experience
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Work Experience</h2>
              <p className="text-gray-600">Highlight your professional work history</p>
            </div>

            {formData.workExperience.map((experience, expIndex) => (
              <div key={expIndex} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Work Experience #{expIndex + 1}</h3>
                  {formData.workExperience.length > 1 && (
                    <button
                      onClick={() => removeArrayItem('workExperience', expIndex)}
                      className="text-red-600 hover:text-red-700 p-2"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <input
                      type="text"
                      value={experience.role}
                      onChange={(e) => updateArrayItem('workExperience', expIndex, { ...experience, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Software Engineer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                    <input
                      type="text"
                      value={experience.company}
                      onChange={(e) => updateArrayItem('workExperience', expIndex, { ...experience, company: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Google"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Years (e.g., 2022-Present or 2020-2022)</label>
                    <input
                      type="text"
                      value={experience.year}
                      onChange={(e) => updateArrayItem('workExperience', expIndex, { ...experience, year: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 2022-Present"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Responsibilities / Achievements (Bullet Points)</label>
                  {experience.bullets.map((bullet, bulletIndex) => (
                    <div key={bulletIndex} className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={bullet}
                        onChange={(e) => {
                          const newBullets = [...experience.bullets];
                          newBullets[bulletIndex] = e.target.value;
                          updateArrayItem('workExperience', expIndex, { ...experience, bullets: newBullets });
                        }}
                        className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Developed and maintained web applications"
                      />
                      {experience.bullets.length > 1 && (
                        <button
                          onClick={() => {
                            const newBullets = experience.bullets.filter((_, i) => i !== bulletIndex);
                            updateArrayItem('workExperience', expIndex, { ...experience, bullets: newBullets });
                          }}
                          className="text-red-500 hover:text-red-700 p-1 rounded"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newBullets = [...experience.bullets, ''];
                      updateArrayItem('workExperience', expIndex, { ...experience, bullets: newBullets });
                    }}
                    className="mt-2 text-blue-600 hover:text-blue-800 flex items-center text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Bullet Point
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={() => addArrayItem('workExperience', { role: '', company: '', year: '', bullets: [''] })}
              className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 text-gray-600 hover:text-gray-800 hover:border-gray-400 transition-colors flex items-center justify-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Another Work Experience
            </button>
          </div>
        );

      case 4: // Projects
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Projects</h2>
              <p className="text-gray-600">Showcase your personal or academic projects</p>
            </div>

            {formData.projects.map((project, projIndex) => (
              <div key={projIndex} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Project #{projIndex + 1}</h3>
                  {formData.projects.length > 1 && (
                    <button
                      onClick={() => removeArrayItem('projects', projIndex)}
                      className="text-red-600 hover:text-red-700 p-2"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Title *</label>
                  <input
                    type="text"
                    value={project.title}
                    onChange={(e) => updateArrayItem('projects', projIndex, { ...project, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., E-commerce Platform"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Details (Bullet Points)</label>
                  {project.bullets.map((bullet, bulletIndex) => (
                    <div key={bulletIndex} className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={bullet}
                        onChange={(e) => {
                          const newBullets = [...project.bullets];
                          newBullets[bulletIndex] = e.target.value;
                          updateArrayItem('projects', projIndex, { ...project, bullets: newBullets });
                        }}
                        className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Implemented user authentication with OAuth"
                      />
                      {project.bullets.length > 1 && (
                        <button
                          onClick={() => {
                            const newBullets = project.bullets.filter((_, i) => i !== bulletIndex);
                            updateArrayItem('projects', projIndex, { ...project, bullets: newBullets });
                          }}
                          className="text-red-500 hover:text-red-700 p-1 rounded"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newBullets = [...project.bullets, ''];
                      updateArrayItem('projects', projIndex, { ...project, bullets: newBullets });
                    }}
                    className="mt-2 text-blue-600 hover:text-blue-800 flex items-center text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Bullet Point
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={() => addArrayItem('projects', { title: '', bullets: [''] })}
              className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 text-gray-600 hover:text-gray-800 hover:border-gray-400 transition-colors flex items-center justify-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Another Project
            </button>
          </div>
        );

      case 5: // Skills
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Skills</h2>
              <p className="text-gray-600">List your technical, soft, and other relevant skills</p>
            </div>

            {Object.keys(formData.skills).map((category) => (
              <div key={category} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">{category}</h3>
                <div className="space-y-2">
                  {formData.skills[category].map((skill, skillIndex) => (
                    <div key={skillIndex} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={skill}
                        onChange={(e) => updateSkills(category, skillIndex, e.target.value)}
                        className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={`Add a ${category.toLowerCase().replace(' skills', '').slice(0, -1)} skill`}
                      />
                      {formData.skills[category].length > 1 && (
                        <button
                          onClick={() => removeSkill(category, skillIndex)}
                          className="text-red-500 hover:text-red-700 p-1 rounded"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addSkill(category)}
                    className="mt-2 text-blue-600 hover:text-blue-800 flex items-center text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Skill
                  </button>
                </div>
              </div>
            ))}
          </div>
        );

      case 6: // Additional Sections
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Additional Sections</h2>
              <p className="text-gray-600">Include optional sections to enhance your resume</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              {/* Certifications Toggle */}
              <div className="flex items-center justify-between">
                <label htmlFor="includeCertifications" className="text-lg font-medium text-gray-900 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-yellow-500" />
                  Certifications
                </label>
                <input
                  type="checkbox"
                  id="includeCertifications"
                  checked={formData.additionalSections.includeCertifications}
                  onChange={(e) =>
                    updateFormData('additionalSections', {
                      ...formData.additionalSections,
                      includeCertifications: e.target.checked,
                    })
                  }
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              {formData.additionalSections.includeCertifications && (
                <div className="space-y-2 pt-4 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">List your certifications (one per line)</label>
                  {formData.certifications.map((cert, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={cert}
                        onChange={(e) => updateArrayItem('certifications', index, e.target.value)}
                        className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., AWS Certified Solutions Architect"
                      />
                      {formData.certifications.length > 1 && (
                        <button
                          onClick={() => removeArrayItem('certifications', index)}
                          className="text-red-500 hover:text-red-700 p-1 rounded"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addArrayItem('certifications', '')}
                    className="mt-2 text-blue-600 hover:text-blue-800 flex items-center text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Certification
                  </button>
                </div>
              )}

              {/* Achievements Toggle */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <label htmlFor="includeAchievements" className="text-lg font-medium text-gray-900 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                  Achievements
                </label>
                <input
                  type="checkbox"
                  id="includeAchievements"
                  checked={formData.additionalSections.includeAchievements}
                  onChange={(e) =>
                    updateFormData('additionalSections', {
                      ...formData.additionalSections,
                      includeAchievements: e.target.checked,
                    })
                  }
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              {formData.additionalSections.includeAchievements && (
                <div className="space-y-2 pt-4 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">List your key achievements (one per line)</label>
                  {formData.achievements.map((achievement, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={achievement}
                        onChange={(e) => updateArrayItem('achievements', index, e.target.value)}
                        className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Awarded 'Employee of the Year' 2023"
                      />
                      {formData.achievements.length > 1 && (
                        <button
                          onClick={() => removeArrayItem('achievements', index)}
                          className="text-red-500 hover:text-red-700 p-1 rounded"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addArrayItem('achievements', '')}
                    className="mt-2 text-blue-600 hover:text-blue-800 flex items-center text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Achievement
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case 7: // Review & Generate
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Resume Information</h2>
              <p className="text-gray-600">Please review the details below. If everything looks good, click "Generate Resume"!</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
              {/* Contact Details Summary */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <Mail className="w-5 h-5 mr-2 text-blue-600" /> Contact Details
                </h3>
                <p className="text-gray-700"><strong>Full Name:</strong> {formData.contactDetails.fullName || 'N/A'}</p>
                <p className="text-gray-700"><strong>Email:</strong> {formData.contactDetails.email || 'N/A'}</p>
                <p className="text-gray-700"><strong>Phone:</strong> {formData.contactDetails.phone || 'N/A'}</p>
                <p className="text-gray-700"><strong>Location:</strong> {formData.contactDetails.location || 'N/A'}</p>
                <p className="text-gray-700"><strong>LinkedIn:</strong> {formData.contactDetails.linkedin || 'N/A'}</p>
                <p className="text-gray-700"><strong>GitHub:</strong> {formData.contactDetails.github || 'N/A'}</p>
              </div>

              <hr className="border-t border-gray-200" />

              {/* Education Summary */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <GraduationCap className="w-5 h-5 mr-2 text-blue-600" /> Education
                </h3>
                {formData.education.length > 0 && formData.education.some(edu => edu.degree.trim() || edu.school.trim()) ? (
                  formData.education.map((edu, index) => (
                    <div key={index} className="mb-2 last:mb-0">
                      <p className="text-gray-700 font-medium">{edu.degree || 'N/A'} from {edu.school || 'N/A'}</p>
                      <p className="text-gray-600 text-sm">{edu.year} {edu.cgpa && `- CGPA: ${edu.cgpa}`} {edu.location && `(${edu.location})`}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 italic">No education details added.</p>
                )}
              </div>

              <hr className="border-t border-gray-200" />

              {/* Work Experience Summary */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <Briefcase className="w-5 h-5 mr-2 text-blue-600" /> Work Experience
                </h3>
                {formData.workExperience.length > 0 && formData.workExperience.some(exp => exp.role.trim() || exp.company.trim()) ? (
                  formData.workExperience.map((exp, index) => (
                    <div key={index} className="mb-2 last:mb-0">
                      <p className="text-gray-700 font-medium">{exp.role || 'N/A'} at {exp.company || 'N/A'}</p>
                      <p className="text-gray-600 text-sm mb-1">{exp.year}</p>
                      <ul className="list-disc list-inside text-gray-700 text-sm ml-4">
                        {exp.bullets.filter(bullet => bullet.trim() !== '').map((bullet, bulletIndex) => (
                          <li key={bulletIndex}>{bullet}</li>
                        ))}
                      </ul>
                      {exp.bullets.filter(bullet => bullet.trim() !== '').length === 0 && <p className="text-gray-600 text-sm italic">No bullet points provided.</p>}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 italic">No work experience added.</p>
                )}
              </div>

              <hr className="border-t border-gray-200" />

              {/* Projects Summary */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <Code className="w-5 h-5 mr-2 text-blue-600" /> Projects
                </h3>
                {formData.projects.length > 0 && formData.projects.some(proj => proj.title.trim()) ? (
                  formData.projects.map((proj, index) => (
                    <div key={index} className="mb-2 last:mb-0">
                      <p className="text-gray-700 font-medium">{proj.title || 'N/A'}</p>
                      <ul className="list-disc list-inside text-gray-700 text-sm ml-4">
                        {proj.bullets.filter(bullet => bullet.trim() !== '').map((bullet, bulletIndex) => (
                          <li key={bulletIndex}>{bullet}</li>
                        ))}
                      </ul>
                      {proj.bullets.filter(bullet => bullet.trim() !== '').length === 0 && <p className="text-gray-600 text-sm italic">No bullet points provided.</p>}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 italic">No projects added.</p>
                )}
              </div>

              <hr className="border-t border-gray-200" />

              {/* Skills Summary */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-blue-600" /> Skills
                </h3>
                {Object.keys(formData.skills).every(cat => formData.skills[cat].filter(s => s.trim() !== '').length === 0) ? (
                  <p className="text-gray-600 italic">No skills added.</p>
                ) : (
                  Object.entries(formData.skills).map(([category, skills]) => {
                    const filteredSkills = skills.filter(skill => skill.trim() !== '');
                    return filteredSkills.length > 0 && (
                      <p key={category} className="text-gray-700 mb-1">
                        <strong>{category}:</strong> {filteredSkills.join(', ')}
                      </p>
                    );
                  })
                )}
              </div>

              {(formData.additionalSections.includeCertifications || formData.additionalSections.includeAchievements) && (
                <hr className="border-t border-gray-200" />
              )}

              {/* Certifications Summary */}
              {formData.additionalSections.includeCertifications && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                    <Award className="w-5 h-5 mr-2 text-yellow-500" /> Certifications
                  </h3>
                  {formData.certifications.length > 0 && formData.certifications.some(cert => cert.trim() !== '') ? (
                    <ul className="list-disc list-inside text-gray-700 text-sm ml-4">
                      {formData.certifications.filter(cert => cert.trim() !== '').map((cert, index) => (
                        <li key={index}>{cert}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600 italic">No certifications added.</p>
                  )}
                </div>
              )}

              {/* Achievements Summary */}
              {formData.additionalSections.includeAchievements && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-500" /> Achievements
                  </h3>
                  {formData.achievements.length > 0 && formData.achievements.some(ach => ach.trim() !== '') ? (
                    <ul className="list-disc list-inside text-gray-700 text-sm ml-4">
                      {formData.achievements.filter(ach => ach.trim() !== '').map((ach, index) => (
                        <li key={index}>{ach}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600 italic">No achievements added.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Step Not Implemented</h2>
            <p className="text-gray-600">This step is currently under development.</p>
          </div>
        );
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
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </button>

            <h1 className="text-lg font-semibold text-gray-900">Resume Builder</h1>

            <div className="text-sm text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-responsive">
          <div className="flex items-center py-4 overflow-x-auto">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-shrink-0">
                <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                  index === currentStep ? 'bg-blue-100 text-blue-700' :
                  index < currentStep ? 'bg-green-100 text-green-700' :
                  'text-gray-500'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index === currentStep ? 'bg-blue-500 text-white' :
                    index < currentStep ? 'bg-green-500 text-white' :
                    'bg-gray-200'
                  }`}>
                    {index < currentStep ? <CheckCircle className="w-4 h-4" /> : step.icon}
                  </div>
                  <span className="font-medium hidden sm:block">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className="w-8 h-px bg-gray-300 mx-2"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-responsive py-8">
        <div className="max-w-4xl mx-auto">
          {/* Step Description */}
          <div className="text-center mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center text-blue-600">
                  {steps[currentStep].icon}
                </div>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{steps[currentStep].title}</h2>
              <p className="text-gray-600">{steps[currentStep].description}</p>
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 mb-8">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={prevStep}
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
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>

            <button
              onClick={nextStep}
              disabled={!canProceedToNext() || isGenerating}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                !canProceedToNext() || isGenerating
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : currentStep === steps.length - 1
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <span>{currentStep === steps.length - 1 ? 'Generate Resume' : 'Next'}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};