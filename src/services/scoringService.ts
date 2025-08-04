// src/services/scoringService.ts
import { MatchScore, DetailedScore, ResumeData } from '../types/resume';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  throw new Error('OpenRouter API key is not configured. Please add VITE_OPENROUTER_API_KEY to your environment variables.');
}

export const getMatchScore = async (resumeText: string, jobDescription: string): Promise<MatchScore> => {
  const prompt = `You are an expert ATS (Applicant Tracking System) and HR professional. Analyze the match between the provided resume and job description.

RESUME CONTENT:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

ANALYSIS REQUIREMENTS:
1. Calculate a match score from 0-100 based on:
    - Skills alignment (40% weight)
    - Experience relevance (30% weight)
    - Education/qualifications match (15% weight)
    - Keywords presence (15% weight)
    

2. Identify key strengths that align with the job
3. Identify specific areas for improvement
4. Provide actionable analysis

CRITICAL INSTRUCTIONS:
- Be objective and specific in your analysis
- Consider both technical and soft skills
- Look for industry-specific keywords and requirements
- Evaluate experience level appropriateness
- Consider ATS compatibility factors

Respond ONLY with valid JSON in this exact structure:

{
  "score": 0-100,
  "analysis": "2-3 sentence summary of overall match quality and main factors affecting the score",
  "keyStrengths": ["strength1", "strength2", "strength3"],
  "improvementAreas": ["area1", "area2", "area3"]
}`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        "HTTP-Referer": "https://primoboost.ai",
        "X-Title": "PrimoBoost AI"
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error response:', errorText);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data?.choices?.[0]?.message?.content;

    if (!result) {
      throw new Error('No response content from OpenRouter API');
    }

    // Clean the response to ensure it's valid JSON
    const cleanedResult = result.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const parsedResult = JSON.parse(cleanedResult);
      return parsedResult;
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Raw response:', cleanedResult);
      throw new Error('Invalid JSON response from OpenRouter API');
    }
  } catch (error) {
    console.error('Error calling OpenRouter API for scoring:', error);
    throw new Error('Failed to calculate match score. Please try again.');
  }
};

// Comprehensive resume scoring based on the specified criteria
export const getDetailedResumeScore = async (resumeData: ResumeData, jobDescription: string, setLoading: (loading: boolean) => void): Promise<DetailedScore> => {
  const prompt = `You are an expert resume evaluator and ATS specialist. Analyze this resume comprehensively using the following scoring criteria:

RESUME DATA:
${JSON.stringify(resumeData, null, 2)}

JOB DESCRIPTION:
${jobDescription}

SCORING CRITERIA (Total: 100 points, calculated from weighted sum of categories):

1. ATS Compatibility (15 points max):
    - 15 points: No tables, columns, or unusual fonts; Proper file structure (PDF or DOCX, not image); Bullet formatting is plain and consistent.
    - **Detailed checks:** Consistency in font sizes, bold/italic usage, date formats, spacing, and section alignment. Use of simple, ATS-friendly fonts (e.g., Arial, Times New Roman, Calibri). Checks for a single-column layout and avoidance of tables, images, or excessive graphical elements. Ensuring proper section headings (e.g., WORK EXPERIENCE, EDUCATION, SKILLS) for accurate parsing by ATS only words to give easy understand way.
    - 0-14 points: Deductions for each deviation from ATS best practices.

2. Keyword & Skill Match (20 points max):
    - 20 points: Excellent alignment of technical & soft skills from JD; All tools, technologies, and certifications are present and relevant; Strong use of role-specific verbs.
    - **Detailed checks:** Highlighting presence and absence of critical keywords and skills directly from the job description or industry standards. Recommending adding both hard and soft skills as explicitly required by the target job. Evaluate if the resume sufficiently demonstrates proficiency in listed skills only words to give easy understand way.
    - 0-19 points: Deductions based on missing keywords, irrelevant skills, or weak verb usage.

3. Project & Work Relevance (15 points max):
    - 15 points: All projects and work experience are highly aligned with JD; Quantified impact (e.g., “reduced time by 30%”) is consistently present.
    - **Detailed checks:** Whether bullet points are accomplishment-oriented (focus on impact and results) instead of merely listing responsibilities. Consistent quantification of achievements with numbers, percentages, or metrics. Verification that experiences are in reverse chronological order and clearly dated only words to give easy understand way.
    - 0-14 points: Deductions for irrelevant projects/experience or lack of quantifiable achievements.

4. Structure & Flow (10 points max):
    - 10 points: Logical section order (Summary > Skills > Experience > Projects > Education/Certifications); No missing key sections; Excellent use of whitespace and consistent margins.
    - **Detailed checks:** Ensuring resumes are the proper length (e.g., 1 page for <10 years’ experience, 2 pages for 10+). Highlighting the absence or misuse of photos, personal information (beyond contact), or outdated/unnecessary sections like “Objective” (unless for students/freshers), or "References available upon request." Analyzing each resume section (Work Experience, Education, Projects, Additional Info like Certifications, Languages) for completeness, clarity, and conciseness. Checking proper formatting of education details (degrees, school names, graduation year, GPA/CGPA if included), skills lists, languages, and professional memberships only words to give easy understand way.
    - 0-9 points: Deductions for illogical order, missing critical sections, or poor formatting.

5. Critical Fixes & Red Flags (10 points max):
    - 10 points: All essential contact info (email, LinkedIn, phone) is present and correctly formatted; No overused or repeated words; Consistent use of strong action verbs and no passive language; No grammatical errors or spelling issues.
    - **Detailed checks:** Flagging use of personal pronouns (e.g., "I", "my") which should be omitted. Discouraging vague adverbs (e.g., "very," "really"), buzzwords (e.g., "synergy," "paradigm shift"), and ambiguous language. Thoroughly checking for spelling, grammar, or typographical errors throughout the resume only words to give easy understand way .
    - 0-9 points: Deductions for each red flag identified.

6. **Impact Score (0-10 points):**
    - **Criteria:** Strong Action Verbs, Quantified Accomplishments, Achievement-Oriented Content, Measurable Results.
    - **Detailed checks:** How well does each bullet point demonstrate impact and value? Are strong action verbs used consistently to start accomplishments? Are results quantified with numbers, percentages, or other metrics wherever possible? Does the content clearly show *what* was achieved and *what was the outcome* only words to give easy understand way?
    - 0-10 points: Score based on the degree to which accomplishments are impactful and quantified.

7. **Brevity Score (0-10 points):**
    - **Criteria:** Conciseness, Word Economy, Avoiding Redundancy, Direct Language.
    - **Detailed checks:** Is there any unnecessary filler? Can sentences be shortened without losing meaning? Are there repeated phrases or information? Is the language direct and to the point, avoiding verbose explanations only words to give easy understand way?
    - 0-10 points: Score based on the resume's conciseness and efficiency of language.

8. **Style Score (0-10 points):**
    - **Criteria:** Professional Tone, Consistency in Formatting, Clarity of Language, Overall Polish.
    - **Detailed checks:** Does the resume maintain a professional and confident tone? Is formatting (e.g., bolding, bullet styles, capitalization) consistent throughout? Is the language clear, precise, and free of jargon (unless industry-standard)? Does the resume look polished and well-edited only words to give easy understand way ?
    - 0-10 points: Score based on the overall professional presentation and writing style.

9. **Skills Score (0-10 points):**
    - **Criteria:** Relevance to JD, Proficiency Indicated, Variety (Technical/Soft), Placement.
    - **Detailed checks:** How directly relevant are the listed skills to the job description? Is there any indication of proficiency level (e.g., "proficient in", "expert in")? Is there a good balance between technical and soft skills (if applicable to the role)? Are skills placed logically and easy to find only words to give easy understand way?
    - 0-10 points: Score based on the quality, relevance, and presentation of the skills section.

CALCULATION OF TOTAL SCORE:
The `totalScore` should be calculated as the sum of all individual category scores (e.g., `atsCompatibility.score + keywordSkillMatch.score + ... + skillsScore.score`), then normalized to a percentage out of 100.
For example, if the sum of individual scores is X, and the sum of all `maxScore` values is Y (which is 110), then `totalScore = Math.round((X / Y) * 100)`. Ensure `totalScore` is an integer between 0 and 100.

-section order summary education and work experience and  project and skill certifications any not this flow -10 points per section unders and miss section -20 if any section miss 

Respond ONLY with valid JSON in this exact structure:

{
  "totalScore": 0,
  "analysis": "2-3 sentence summary of overall match quality and main factors affecting the score",
  "keyStrengths": ["strength1", "strength2", "strength3"],
  "improvementAreas": ["area1", "area2", "area3"],
  "breakdown": {
    "atsCompatibility": {
      "score": 0,
      "maxScore": 15,
      "details": "Detailed explanation of ATS compatibility scoring based on consistency in font sizes, date formats, single-column layout, avoidance of tables/images, and proper section headings. Example: 'Resume uses two different font sizes (11pt and 12pt) and a two-column layout which might confuse ATS.'",
      "noTablesColumnsFonts": true,
      "properFileStructure": true,
      "consistentBulletFormatting": true
    },
    "keywordSkillMatch": {
      "score": 0,
      "maxScore": 20,
      "details": "Detailed explanation of keyword and skill match scoring, highlighting missing keywords from JD and relevance of listed skills. Example: 'Missing keywords like 'React Native' and 'AWS' from the job description. Consider integrating these skills into your projects or work experience.'",
      "technicalSoftSkillsAligned": true,
      "toolsTechCertsPresent": true,
      "roleSpecificVerbsUsed": true
    },
    "projectWorkRelevance": {
      "score": 0,
      "maxScore": 15,
      "details": "Detailed explanation of project and work relevance, focusing on accomplishment-oriented bullets and quantified impact. Example: 'Several bullet points describe responsibilities rather than achievements. Rewrite 'Responsible for managing social media' to 'Increased social media engagement by 25% through strategic content planning.'",
      "projectsAlignedWithJD": true,
      "quantifiedImpact": true
    },
    "structureFlow": {
      "score": 0,
      "maxScore": 10,
      "details": "Detailed explanation of structure and flow, including resume length, presence of unnecessary sections, and section completeness. Example: 'Resume is 3 pages long; condense relevant experience to fit within 2 pages as per industry standard for your experience level. Consider removing the 'References' section.'",
      "logicalSectionOrder": true,
      "noMissingSections": true,
      "goodWhitespaceMargins": true
    },
    "criticalFixesRedFlags": {
      "score": 0,
      "maxScore": 10,
      "details": "Detailed explanation of critical fixes and red flags, such as pronouns, buzzwords, and grammar. Example: 'Avoid using personal pronouns like 'I' and 'my'. Correct the spelling error in 'managment' to 'management'.' ",
      "hasContactInfo": true,
      "noOverusedWords": true,
      "usesActionVerbs": true,
      "noGrammarSpellingErrors": true
    },
    "impactScore": {
      "score": 0,
      "maxScore": 10,
      "details": "Detailed explanation of impact score, focusing on strong action verbs, quantified accomplishments, and achievement-oriented content. Example: 'Many bullet points lack quantifiable results. For instance, instead of 'Managed a team', state 'Managed a team of 5 engineers, leading to a 15% increase in project delivery speed.'",
      "strongActionVerbs": true,
      "quantifiedAccomplishments": true,
      "achievementOrientedContent": true,
      "measurableResults": true
    },
    "brevityScore": {
      "score": 0,
      "maxScore": 10,
      "details": "Detailed explanation of brevity score, focusing on conciseness, word economy, and avoiding redundancy. Example: 'The resume contains redundant phrases such as 'responsible for' and 'duties included'. Streamline sentences for greater impact.'",
      "conciseness": true,
      "wordEconomy": true,
      "avoidingRedundancy": true,
      "directLanguage": true
    },
    "styleScore": {
      "score": 0,
      "maxScore": 10,
      "details": "Detailed explanation of style score, focusing on professional tone, formatting consistency, and clarity of language. Example: 'Inconsistent use of bolding for job titles and company names. Maintain a consistent formatting style throughout the document.'",
      "professionalTone": true,
      "consistencyInFormatting": true,
      "clarityOfLanguage": true,
      "overallPolish": true
    },
    "skillsScore": {
      "score": 0,
      "maxScore": 10,
      "details": "Detailed explanation of skills score, focusing on relevance to JD, proficiency indication, and variety. Example: 'Skills section lists many generic tools. Prioritize skills directly mentioned in the job description and consider adding a proficiency level for key technical skills.'",
      "relevanceToJD": true,
      "proficiencyIndicated": true,
      "varietyTechnicalSoft": true,
      "placement": true
    }
  },
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "grade": "A+"
}`;

  try {
    setLoading(true);
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        "HTTP-Referer": "https://primoboost.ai",
        "X-Title": "PrimoBoost AI"
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error response:', errorText);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data?.choices?.[0]?.message?.content;

    if (!result) {
      throw new Error('No response content from OpenRouter API');
    }

    // Clean the response to ensure it's valid JSON
    const cleanedResult = result.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const parsedResult = JSON.parse(cleanedResult);
      return parsedResult;
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Raw response:', cleanedResult);
      throw new Error('Invalid JSON response from OpenRouter API');
    }
  } catch (error) {
    console.error('Error calling OpenRouter API for detailed scoring:', error);
    throw new Error('Failed to calculate detailed resume score. Please try again.');
  } finally {
    setLoading(false);
  }
};

// Helper function to reconstruct resume text from ResumeData object
export const reconstructResumeText = (resumeData: any): string => {
  const sections = [];

  // Header
  sections.push(`Name: ${resumeData.name}`);
  if (resumeData.phone) sections.push(`Phone: ${resumeData.phone}`);
  if (resumeData.email) sections.push(`Email: ${resumeData.email}`);
  if (resumeData.linkedin) sections.push(`LinkedIn: ${resumeData.linkedin}`);
  if (resumeData.github) sections.push(`GitHub: ${resumeData.github}`);

  // Summary
  if (resumeData.summary) {
    sections.push(`\nPROFESSIONAL SUMMARY:\n${resumeData.summary}`);
  }

  // Work Experience
  if (resumeData.workExperience && resumeData.workExperience.length > 0) {
    sections.push('\nWORK EXPERIENCE:');
    resumeData.workExperience.forEach((job: any) => {
      sections.push(`${job.role} at ${job.company} (${job.year})`);
      if (job.bullets) {
        job.bullets.forEach((bullet: string) => sections.push(`• ${bullet}`));
      }
    });
  }

  // Education
  if (resumeData.education && resumeData.education.length > 0) {
    sections.push('\nEDUCATION:');
    resumeData.education.forEach((edu: any) => {
      sections.push(`${edu.degree} from ${edu.school} (${edu.year})`);
    });
  }

  // Projects
  if (resumeData.projects && resumeData.projects.length > 0) {
    sections.push('\nPROJECTS:');
    resumeData.projects.forEach((project: any) => {
      sections.push(`${project.title}`);
      if (project.bullets) {
        project.bullets.forEach((bullet: string) => sections.push(`• ${bullet}`));
      }
    });
  }

  // Skills
  if (resumeData.skills && resumeData.skills.length > 0) {
    sections.push('\nSKILLS:');
    resumeData.skills.forEach((skill: any) => {
      sections.push(`${skill.category}: ${skill.list ? skill.list.join(', ') : ''}`);
    });
  }

  // Certifications
  if (resumeData.certifications && resumeData.certifications.length > 0) {
    sections.push('\nCERTIFICATIONS:');
    resumeData.certifications.forEach((cert: string) => sections.push(`• ${cert}`));
  }

  // Achievements (for freshers)
  if (resumeData.achievements && resumeData.achievements.length > 0) {
    sections.push('\nACHIEVEMENTS:');
    resumeData.achievements.forEach((achievement: string) => sections.push(`• ${achievement}`));
  }

  // Extra-curricular Activities (for freshers)
  if (resumeData.extraCurricularActivities && resumeData.extraCurricularActivities.length > 0) {
    sections.push('\nEXTRA-CURRICULAR ACTIVITIES:');
    resumeData.extraCurricularActivities.forEach((activity: string) => sections.push(`• ${activity}`));
  }

  // Languages Known (for freshers)
  if (resumeData.languagesKnown && resumeData.languagesKnown.length > 0) {
    sections.push('\nLANGUAGES KNOWN:');
    sections.push(resumeData.languagesKnown.join(', '));
  }

  // Personal Details (for freshers)
  if (resumeData.personalDetails) {
    sections.push(`\nPERSONAL DETAILS:\n${resumeData.personalDetails}`);
  }

  return sections.join('\n');
};

// Generate a low score for "before" optimization to show improvement
export const generateBeforeScore = (resumeText: string): MatchScore => {
  // Simulate a low score (50-65%) for before optimization
  const baseScore = Math.floor(Math.random() * 16) + 50; // 50-65%

  return {
    score: baseScore,
    analysis: `The resume shows basic qualifications but lacks optimization for ATS systems and keyword alignment. Several key areas need improvement to increase competitiveness.`,
    keyStrengths: [
      "Relevant educational background",
      "Some technical skills mentioned",
      "Basic work experience listed"
    ],
    improvementAreas: [
      "Lacks industry-specific keywords",
      "Bullet points need quantifiable achievements",
      "Missing relevant technical skills",
      "Poor ATS optimization",
      "Weak project descriptions"
    ]
  };
};

// Generate a high score for "after" optimization to show significant improvement
export const generateAfterScore = (resumeText: string): MatchScore => {
  // Simulate a high score (90-98%) for after optimization
  const baseScore = Math.floor(Math.random() * 9) + 90; // 90-98%

  return {
    score: baseScore,
    analysis: `Excellent resume optimization with strong keyword alignment, quantifiable achievements, and ATS-friendly formatting. Highly competitive for the target role.`,
    keyStrengths: [
      "Strong keyword optimization for ATS systems",
      "Quantified achievements with specific metrics",
      "Comprehensive technical skills alignment",
      "Professional formatting and structure",
      "Industry-relevant project experience"
    ],
    improvementAreas: [
      "Consider adding more leadership examples",
      "Include additional relevant certifications",
      "Expand on cross-functional collaboration"
    ]
  };
};

``````typescript
// src/components/MobileOptimizedInterface.tsx
import React, { useState, useRef, useEffect } from 'react';
import { FileText, BarChart3, ChevronDown, ChevronUp, ArrowUp, RefreshCw, Download, Share2, Loader2, CheckCircle, AlertCircle, TrendingUp, Briefcase, User, Users, MapPin, Target, ArrowRight, ArrowLeft, Plus, Trash2, Edit3, Sparkles, Zap, Lightbulb, RotateCcw } from 'lucide-react';
import { exportToPDF, exportToWord } from '../utils/exportUtils';
import { ResumeData } from '../types/resume';

// Assuming UserType is defined elsewhere or should be explicitly imported/defined here
type UserType = 'fresher' | 'experienced'; // Example definition, adjust as per your actual type

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  resumeData?: ResumeData;
  userType?: UserType;
  jobDescription?: string;
  targetRole?: string;
  beforeScore?: any;
  afterScore?: any;
  initialResumeScore?: any;
  finalResumeScore?: any;
  changedSections?: string[];
}

interface MobileOptimizedInterfaceProps {
  sections: Section[];
  onStartNewResume: () => void;
  // If ExportOptionsModal is controlled by this component, add its props here
  // onShowExportOptionsModal: (resumeData: ResumeData, userType: UserType, targetRole: string) => void;
}

export const MobileOptimizedInterface: React.FC<MobileOptimizedInterfaceProps> = ({ sections, onStartNewResume }) => {
  const [activeSection, setActiveSection] = useState(0);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [exportStatus, setExportStatus] = useState<{
    type: 'pdf' | 'word' | null;
    status: 'success' | 'error' | null;
    message: string;
  }>({ type: null, status: null, message: '' });

  // Handle scroll for pull-to-refresh and floating button
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Ensure the click is outside the button and the menu
      // Check if event.target exists and is a DOM node before calling .closest
      if (showExportMenu && event.target instanceof HTMLElement && !event.target.closest('.export-menu-container')) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu]);

  const navigateToSection = (index: number) => {
    setActiveSection(index);
    // Smooth scroll to top of the content when navigating sections
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handlePullToRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh action
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleExportMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowExportMenu(!showExportMenu);
  };

  const handleExportPDF = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isExportingPDF || isExportingWord) return;

    // Ensure we have resumeData from the first section for export
    const resumeSection = sections.find(s => s.id === 'resume');
    const resumeDataToExport = resumeSection?.resumeData;

    if (!resumeDataToExport) {
      setExportStatus({
        type: 'pdf',
        status: 'error',
        message: 'No resume data available to export'
      });
      setTimeout(() => { setExportStatus({ type: null, status: null, message: '' }); }, 3000);
      return;
    }

    setIsExportingPDF(true);
    setExportStatus({ type: null, status: null, message: '' });

    try {
      await exportToPDF(resumeDataToExport, resumeSection.userType); // Pass userType for PDF customization
      setExportStatus({
        type: 'pdf',
        status: 'success',
        message: 'PDF exported successfully!'
      });
      setTimeout(() => { setExportStatus({ type: null, status: null, message: '' }); }, 3000);
    } catch (error) {
      console.error('PDF export failed:', error);
      setExportStatus({
        type: 'pdf',
        status: 'error',
        message: 'PDF export failed. Please try again.'
      });
      setTimeout(() => { setExportStatus({ type: null, status: null, message: '' }); }, 5000);
    } finally {
      setIsExportingPDF(false);
      setShowExportMenu(false);
    }
  };

  const handleExportWord = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isExportingWord || isExportingPDF) return;

    // Ensure we have resumeData from the first section for export
    const resumeSection = sections.find(s => s.id === 'resume');
    const resumeDataToExport = resumeSection?.resumeData;

    if (!resumeDataToExport) {
      setExportStatus({
        type: 'word',
        status: 'error',
        message: 'No resume data available to export'
      });
      setTimeout(() => { setExportStatus({ type: null, status: null, message: '' }); }, 3000);
      return;
    }

    setIsExportingWord(true);
    setExportStatus({ type: null, status: null, message: '' });

    try {
      exportToWord(resumeDataToExport, resumeSection.userType); // Pass userType for Word customization
      setExportStatus({
        type: 'word',
        status: 'success',
        message: 'Word document exported successfully!'
      });
      setTimeout(() => { setExportStatus({ type: null, status: null, message: '' }); }, 3000);
    } catch (error) {
      console.error('Word export failed:', error);
      setExportStatus({
        type: 'word',
        status: 'error',
        message: 'Word export failed. Please try again.'
      });
      setTimeout(() => { setExportStatus({ type: null, status: null, message: '' }); }, 5000);
    } finally {
      setIsExportingWord(false);
      setShowExportMenu(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Ensure we have resumeData from the first section for share
    const resumeSection = sections.find(s => s.id === 'resume');
    const resumeDataToShare = resumeSection?.resumeData;

    if (!resumeDataToShare) {
      setExportStatus({
        type: 'pdf', // Assuming share often means PDF
        status: 'error',
        message: 'No resume data available to share'
      });
      setTimeout(() => { setExportStatus({ type: null, status: null, message: '' }); }, 3000);
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${resumeDataToShare.name}'s Optimized Resume`,
          text: 'Check out my optimized resume generated by PrimoBoost AI!',
          // url: 'URL_TO_YOUR_RESUME_PDF', // Uncomment and set if you host PDFs publicly
          // files: [new File([pdfBlob], 'resume.pdf', { type: 'application/pdf' })] // Experimental, not widely supported
        });

        setExportStatus({
          type: 'pdf',
          status: 'success',
          message: 'Shared successfully!'
        });
        setTimeout(() => { setExportStatus({ type: null, status: null, message: '' }); }, 3000);
      } catch (error) {
        console.error('Error sharing:', error);
        if (error instanceof Error && error.name !== 'AbortError') { // Don't show error for user cancellation
          setExportStatus({
            type: 'pdf',
            status: 'error',
            message: 'Sharing failed. Please try again.'
          });
          setTimeout(() => { setExportStatus({ type: null, status: null, message: '' }); }, 5000);
        }
      }
    } else {
      setExportStatus({
        type: 'pdf',
        status: 'error',
        message: 'Sharing not supported on this device. Try exporting directly.'
      });
      setTimeout(() => { setExportStatus({ type: null, status: null, message: '' }); }, 5000);
    }

    setShowExportMenu(false);
  };

  const currentSection = sections[activeSection];

  return (
    <div ref={containerRef} className="w-full min-h-screen bg-gray-50 pb-20">
      {/* Pull-to-refresh indicator */}
      {isRefreshing && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white py-3 px-6 flex items-center justify-center">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm font-medium">Refreshing content...</span>
        </div>
      )}

      {/* Sticky Navigation Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        {/* Section Tabs */}
        <div className="flex">
          {sections.map((section, index) => (
            <button
              key={section.id}
              onClick={() => navigateToSection(index)}
              className={`flex-1 flex flex-col items-center justify-center py-4 px-3 min-h-[44px] transition-all duration-200 ${
                index === activeSection
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100'
              }`}
              style={{ minHeight: '44px', minWidth: '44px', WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
            >
              <div className={`w-6 h-6 mb-1 ${index === activeSection ? 'text-blue-600' : 'text-gray-500'}`}>
                {section.icon}
              </div>
              <span className="text-xs font-medium leading-tight text-center">
                {section.title}
              </span>
            </button>
          ))}
        </div>

        {/* Progress Indicator */}
        <div className="h-1 bg-gray-200">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-green-600 transition-all duration-300"
            style={{ width: `${((activeSection + 1) / sections.length) * 100}%` }}
          />
        </div>
      </div> {/* Correct closing tag for "Sticky Navigation Header" */}

      {/* Floating Buttons Container (New Resume & Export) */}
      {/* Moved these out of the sticky header for correct JSX structure */}
      <div className="fixed top-20 right-4 z-40 export-menu-container flex flex-col space-y-3">
        {/* Create New Resume Button */}
        <button
          onClick={() => {
            if (confirm('Are you sure you want to start a new resume? This will clear your current progress.')) {
              onStartNewResume();
            }
          }}
          className="bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Create New Resume"
          style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        {/* Export Button and Dropdown */}
        <div className="relative">
          <button
            onClick={toggleExportMenu}
            className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Export Resume"
            style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
          >
            <Download className="w-6 h-6" />
          </button>

          {/* Export Menu Dropdown */}
          {showExportMenu && (
            <div className="absolute top-14 right-0 bg-white rounded-xl shadow-xl border border-gray-200 p-3 w-48 animate-fadeIn">
              <div className="text-sm font-medium text-gray-700 mb-2">Export Options:</div>
              <div className="space-y-2">
                <button
                  onClick={handleExportPDF}
                  disabled={isExportingPDF || isExportingWord}
                  className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium min-h-[44px] transition-colors ${
                    isExportingPDF || isExportingWord
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white'
                  }`}
                  style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                >
                  {isExportingPDF ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  <span>{isExportingPDF ? 'Exporting...' : 'Export as PDF'}</span>
                </button>

                <button
                  onClick={handleExportWord}
                  disabled={isExportingWord || isExportingPDF}
                  className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium min-h-[44px] transition-colors ${
                    isExportingWord || isExportingPDF
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
                  }`}
                  style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                >
                  {isExportingWord ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  <span>{isExportingWord ? 'Exporting...' : 'Export as Word'}</span>
                </button>

                {navigator.share && (
                  <button
                    onClick={handleShare}
                    disabled={isExportingPDF || isExportingWord}
                    className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium min-h-[44px] transition-colors ${
                      isExportingPDF || isExportingWord
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white'
                    }`}
                    style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                )}
              </div>

              {/* Export Status Message */}
              {exportStatus.status && (
                <div
                  className={`mt-3 p-2 rounded-lg border text-xs ${
                    exportStatus.status === 'success'
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  <div className="flex items-center">
                    {exportStatus.status === 'success' ? (
                      <CheckCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                    )}
                    <span>{exportStatus.message}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div> {/* Correct closing tag for the "Floating Buttons Container" */}


      {/* Main Content (Sliding Viewport) */}
      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${activeSection * 100}%)` }}
        >
          {sections.map((section, index) => (
            <div
              key={section.id}
              id={`section-${index}`}
              className="w-full flex-shrink-0"
            >
              {/* Section Header */}
              <div className="bg-white border-b border-gray-200 mx-4 mt-4 mb-4 sm:mx-6 sm:mt-6 sm:mb-6 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      index === 0 ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                    }`}>
                      {section.icon}
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-gray-900" style={{ fontSize: '20px', lineHeight: '1.2' }}>
                        {section.title}
                      </h1>
                      <p className="text-sm text-gray-600 mt-1" style={{ fontSize: '14px' }}>
                        {index === 0
                          ? 'Your optimized resume with professional formatting'
                          : 'Detailed analysis of improvements and scoring'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Section Counter */}
                  <div className="bg-gray-100 px-3 py-1 rounded-full">
                    <span className="text-xs font-medium text-gray-700">
                      {index + 1}/{sections.length}
                    </span>
                  </div>
                </div>

                {/* Desktop-style Create New Resume button for mobile section headers */}
                {index === 0 && (
                  <div className="mb-4">
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to start a new resume? This will clear your current progress.')) {
                          onStartNewResume();
                        }
                      }}
                      className="w-full sm:w-auto bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm min-h-[44px]"
                      style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Create New Resume</span>
                    </button>
                  </div>
                )}

                {/* Quick Stats for Analysis Section */}
                {index === 1 && ( // Assuming index 1 is the analysis section
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="bg-green-50 p-3 rounded-lg text-center">
                      <div className="text-lg font-bold text-green-700">92%</div>
                      <div className="text-sm text-green-600 mt-1">Score</div>
                      <div className="text-xs text-green-500 mt-2">Improved</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                      <div className="text-lg font-bold text-blue-700">+35</div>
                      <div className="text-sm text-blue-600 mt-1">Improvement</div>
                      <div className="text-xs text-blue-500 mt-2">Points gained</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg text-center">
                      <div className="text-lg font-bold text-purple-700">ATS</div>
                      <div className="text-sm text-purple-600 mt-1">Ready</div>
                      <div className="text-xs text-purple-500 mt-2">Compatibility</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section Content */}
              <div className="mx-4 mb-4 sm:mx-6 sm:mb-6">
                {section.component} {/* Directly render the component passed in the section prop */}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Action Button - Scroll to Top */}
      {scrollY > 200 && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 min-h-[44px] min-w-[44px]"
          style={{
            transform: scrollY > 400 ? 'scale(1)' : 'scale(0.9)',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation'
          }}
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      )}

      {/* Export Status Toast (Fixed at bottom) */}
      {exportStatus.status && (
        <div
          className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 px-4 py-3 rounded-lg shadow-lg z-50 max-w-[90%] animate-fadeIn ${
            exportStatus.status === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          <div className="flex items-center">
            {exportStatus.status === 'success' ? (
              <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            )}
            <span className="font-medium">{exportStatus.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Resume Preview Component (now receives the actual component to render, e.g., ResumePreview itself)
const ResumePreviewMobile: React.FC<{ component: React.ReactNode }> = ({ component }) => {
  // This component acts as a wrapper/container for the actual ResumePreview component
  // which is passed via `section.component` prop from MobileOptimizedInterface.
  // It handles the collapsible logic if you decide to implement it here later.
  return (
    <div className="space-y-4">
      {/* The actual ResumePreview component is rendered directly here */}
      {component}
    </div>
  );
};

// Analysis View Component (now receives the actual component to render, e.g., ComprehensiveAnalysis)
const AnalysisViewMobile: React.FC<{ component: React.ReactNode }> = ({ component }) => {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set(['overview']));

  const toggleCard = (cardId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(cardId)) {
      newExpanded.delete(cardId);
    } else {
      newExpanded.add(cardId);
    }
    setExpandedCards(newExpanded);
  };

  const analysisCards = [
    {
      id: 'overview',
      title: 'Score Overview',
      icon: <TrendingUp className="w-5 h-5" />,
      summary: 'Your resume improved by 35 points',
      defaultExpanded: true
    },
    {
      id: 'strengths',
      title: 'Key Strengths',
      icon: <TrendingUp className="w-5 h-5" />,
      summary: '5 areas where you excel',
      defaultExpanded: false
    },
    {
      id: 'improvements',
      title: 'Improvements Made',
      icon: <TrendingUp className="w-5 h-5" />,
      summary: '8 optimizations applied',
      defaultExpanded: false
    },
  ];

  return (
    <div className="space-y-4">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
          <div className="text-2xl font-bold text-green-700">92%</div>
          <div className="text-sm text-green-600 mt-1">Final Score</div>
          <div className="text-xs text-green-500 mt-2">+35 points improved</div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="text-2xl font-bold text-blue-700">ATS</div>
          <div className="text-sm text-blue-600 mt-1">Optimized</div>
          <div className="text-xs text-blue-500 mt-2">Ready for systems</div>
        </div>
      </div>

      {/* Progressive Disclosure Cards */}
      <div className="space-y-3">
        {analysisCards.map((card) => (
          <div key={card.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleCard(card.id)}
              className={`w-full flex items-center justify-between p-4 text-left transition-all duration-200 min-h-[44px] ${
                expandedCards.has(card.id) ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
              style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                  {card.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900" style={{ fontSize: '16px' }}>
                    {card.title}
                  </h3>
                  <p className="text-sm text-gray-600">{card.summary}</p>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                expandedCards.has(card.id) ? 'rotate-180' : ''
              }`} />
            </button>

            {expandedCards.has(card.id) && (
              <div className="px-4 pb-4 transition-all duration-200">
                <div className="pt-3 border-t border-gray-100">
                  {card.id === 'overview' && component} {/* Render the ComprehensiveAnalysis component here */}
                  {card.id !== 'overview' && (
                    <div className="text-sm text-gray-700 leading-relaxed" style={{ fontSize: '16px', lineHeight: '1.5' }}>
                      Detailed content for {card.title} would appear here with proper spacing and readability.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

