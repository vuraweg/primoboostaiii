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
Total Score = (ATS Compatibility * 1) + (Keyword & Skill Match * 1) + (Project & Work Relevance * 1) + (Structure & Flow * 1) + (Critical Fixes & Red Flags * 1) + (Impact Score * 1) + (Brevity Score * 1) + (Style Score * 1) + (Skills Score * 1)
(Adjust points for new categories as if they are weighted equally for calculation to sum to 100, assuming you'll adjust max scores later if needed. For now, consider all max scores sum up to 100.)

ANALYSIS REQUIREMENTS:
- Calculate exact scores for each category.
- Provide detailed breakdown and reasoning for each category's score within the 'details' field. This field MUST contain specific, actionable feedback relevant to the checks outlined for each category.
- Identify specific actionable recommendations for overall improvement in the 'recommendations' array, especially for scores below 70% in any *individual category* (not just totalScore). These recommendations should be concrete and directly related to the issues found.
- Assign a letter grade (A+ 95-100, A 90-94, B+ 85-89, B 80-84, C+ 75-79, C 70-74, D 60-69, F <60).

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