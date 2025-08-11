import { ResumeData, UserType } from '../types/resume';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  throw new Error('OpenRouter API key is not configured. Please add VITE_OPENROUTER_API_KEY to your environment variables.');
}

export const optimizeResume = async (
  resume: string,
  jobDescription: string,
  userType: UserType,
  userName?: string,
  userEmail?: string,
  userPhone?: string,
  userLinkedin?: string,
  userGithub?: string,
  linkedinUrl?: string,
  githubUrl?: string,
  targetRole?: string
): Promise<ResumeData> => {
  const getPromptForUserType = (type: UserType) => {
    if (type === 'experienced') {
      return `You are a professional resume optimization assistant for EXPERIENCED PROFESSIONALS. Analyze the provided resume and job description, then create an optimized resume that better matches the job requirements.

EXPERIENCED PROFESSIONAL REQUIREMENTS:
1. MUST include a compelling Professional Summary (2-3 lines highlighting key experience and value proposition)
2. PRIORITIZE Work Experience section - this should be the most prominent
3. Education section should be minimal or omitted unless specifically required by the job
4. Focus on quantifiable achievements and leadership experience
5. Emphasize career progression and increasing responsibilities

SECTION ORDER FOR EXPERIENCED PROFESSIONALS:
1. Contact Information
2. Professional Summary (REQUIRED)
3. Technical Skills
4. Professional Experience (MOST IMPORTANT)
5. Projects (if relevant to role)
6. Certifications
7. Education (minimal or omit if not required)`;
    } else if (type === 'student') {
      return `You are a professional resume optimization assistant for COLLEGE STUDENTS. Analyze the provided resume and job description, then create an optimized resume that better matches the job requirements.

COLLEGE STUDENT REQUIREMENTS:
1. MUST include a compelling Career Objective (2 lines, ATS-readable, focusing on learning goals and internship aspirations)
2. PRIORITIZE Education section - this should be prominent with CGPA and institution location
3. Focus on academic projects, coursework, and transferable skills
4. Include achievements, certifications, and extracurricular activities
5. Highlight learning ability, enthusiasm, and academic excellence
6. ALL INTERNSHIPS, TRAININGS, and WORK EXPERIENCE should be categorized under "workExperience" section
7. Extract CGPA from education if mentioned (e.g., "CGPA: 8.4/10" or "GPA: 3.8/4.0")
8. Include location in contact information and education details

SECTION ORDER FOR COLLEGE STUDENTS:
1. Contact Information (including location)
2. Career Objective (REQUIRED - 2 lines focusing on internship goals)
3. Education (PROMINENT - with CGPA and location)
4. Technical Skills
5. Academic Projects (IMPORTANT)
6. Internships & Work Experience (if any)
7. Certifications
8. Achievements (academic awards, competitions, etc.)
9. Languages Known (if present in original resume)`;
    } else {
      return `You are a professional resume optimization assistant for FRESHERS/NEW GRADUATES. Analyze the provided resume and job description, then create an optimized resume that better matches the job requirements.

FRESHER REQUIREMENTS:
1. Professional Summary is OPTIONAL - only include if the candidate has relevant internships or strong projects
2. PRIORITIZE Education, Academic Projects, and Internships
3. Include additional sections that showcase potential: Achievements, Extra-curricular Activities, Languages
4. Focus on academic projects, internships, and transferable skills
5. Highlight learning ability, enthusiasm, and relevant coursework
6. ALL INTERNSHIPS, TRAININGS, and WORK EXPERIENCE should be categorized under "workExperience" section
7. Extract CGPA from education if mentioned (e.g., "CGPA: 8.4/10")

SECTION ORDER FOR FRESHERS:
1. Contact Information
2. Professional Summary (OPTIONAL - only if relevant experience exists)
3. Technical Skills
4. Education (PROMINENT)
5. Internships & Work Experience (IMPORTANT - includes all internships, trainings, and work)
6. Academic Projects (IMPORTANT)
7. Achievements (if present in original resume)
8. Extra-curricular Activities (if present in original resume)
9. Certifications
10. Languages Known (if present in original resume)
11. Personal Details (if present in original resume)`;
    }
  };

  const atsBlock = `
ATS OUTPUT REQUIREMENTS:
1) Return an ATS-ready resume TEXT inside a JSON field named "atsResume".
2) "atsResume" must be plain text, single column, no tables/images/emojis, no headers/footers.
3) Use ASCII hyphen "-" bullets only.
4) ALL CAPS section headings in this exact order (omit if empty):
   - CONTACT INFORMATION
   - SUMMARY
   - TECHNICAL SKILLS
   - WORK EXPERIENCE
   - PROJECTS
   - EDUCATION
   - CERTIFICATIONS
   - ACHIEVEMENTS
   - EXTRA-CURRICULAR ACTIVITIES
   - LANGUAGES KNOWN
5) Contact line format: Name | Location | Phone | Email | LinkedIn: <url> (if not empty) | GitHub: <url> (if not empty)
6) Dates: "Mon YYYY – Mon YYYY"; for current roles use "Present".
7) Role line format: Title – Company | Location (optional) | Dates (same line).
8) Max 3 bullets per item, <= 20 words each, start with strong action verbs, include quantified impact.
9) Avoid repeating any single word > 2 times overall; include JD keywords naturally.
10) No bold/italics/page numbers/columns/graphics.

ATS TEXT TEMPLATE (scaffold):
CONTACT INFORMATION
\${name} | \${location} | \${phone} | \${email}\${linkedinOpt}\${githubOpt}

\${summaryOpt}

TECHNICAL SKILLS
- \${SkillCategory1}: \${skill1}, \${skill2}, \${skill3}, \${skill4}
- \${SkillCategory2}: \${skill1}, \${skill2}, \${skill3}, \${skill4}

WORK EXPERIENCE
\${Role} – \${Company} | \${LocationOpt} | \${Dates}
- \${Bullet 1}
- \${Bullet 2}
- \${Bullet 3}

PROJECTS
\${Project Title} | \${TechOpt}
- \${Bullet 1}
- \${Bullet 2}
- \${Bullet 3}

EDUCATION
\${Degree} – \${School} | \${LocationOpt} | \${DatesOrYear} \${CGPAOpt}

CERTIFICATIONS
- \${Cert 1}
- \${Cert 2}

ACHIEVEMENTS
- \${Achievement 1}
- \${Achievement 2}

EXTRA-CURRICULAR ACTIVITIES
- \${Activity 1}
- \${Activity 2}

LANGUAGES KNOWN
- \${Language 1}
- \${Language 2}

Where:
- linkedinOpt is " | LinkedIn: <url>" only if linkedin != ""
- githubOpt is " | GitHub: <url>" only if github != ""
- summaryOpt included only if "summary" exists
- LocationOpt/TechOpt optional if present
`;

  const promptContent = `${getPromptForUserType(userType)}

CRITICAL REQUIREMENTS FOR BULLET POINTS:
1. Each bullet point must contain up to 20 words
2. Include at least 30 relevant keywords from the job description across all bullet points
3. Use STRONG ACTION VERBS only (no weak verbs like "helped", "assisted", "worked on", "was responsible for", "participated in", "involved in", "contributed to")
4. Start each bullet with powerful verbs like: Developed, Implemented, Architected, Optimized, Engineered, Designed, Led, Managed, Created, Built, Delivered, Achieved, Increased, Reduced, Streamlined, Automated, Transformed, Executed, Spearheaded, Established
5. No word should be repeated more than twice across all bullet points
6. Quantify achievements with specific numbers, percentages, or metrics wherever possible
7. Focus on RESULTS and IMPACT, not just tasks
8. Don't give more than three bullet points for each project or work experience
9. All section titles should be in ALL CAPS (e.g., WORK EXPERIENCE)
10. Dates should be on the same line as roles/education, using format "Jan 2023 – Mar 2024"
11. Ensure at least 70% of resume keywords match the job description for better ATS compatibility
12. Avoid using adjectives like "passionate", "dedicated", or "hardworking" unless contextually backed with measurable achievements DO NOT add adjectives like “dedicated”, “motivated”, or “hardworking” unless backed by resume content.
13. Penalize any section (WORK EXPERIENCE, PROJECTS, INTERNSHIPS) that lacks proper formatting:
    - Missing roles, company names, or dates
    - More than 3 bullets per item
    - Bullets that do not begin with action verbs
    - No quantified metrics
    - Disorganized or incomplete structure
    - Date format not in "Jan 2023 – Mar 2024" format
14. If formatting is poor or inconsistent in any section, reduce overall score by 5–15% depending on severity.

SKILLS REQUIREMENTS:
1. Generate comprehensive skills based on the resume content and job description
2. Include at least 6-8 skill categories
3. Each category should have 5-8 specific skills
4. Match skills to job requirements and industry standards
5. Include both technical and soft skills relevant to the role
6.NO NEED TO GENERATE SOFT SKILLS

CERTIFICATIONS REQUIREMENTS:
1. For each certification, provide a concise 2-3 sentence description in the 'description' field.

SOCIAL LINKS REQUIREMENTS - CRITICAL:
1. LinkedIn URL: "${linkedinUrl || ''}" - ONLY include if this is NOT empty
2. GitHub URL: "${githubUrl || ''}" - ONLY include if this is NOT empty
3. If LinkedIn URL is empty (""), set linkedin field to empty string ""
4. If GitHub URL is empty (""), set github field to empty string ""
5. DO NOT create, modify, or generate any social media links
6. Use EXACTLY what is provided - no modifications

TARGET ROLE INFORMATION:
${targetRole ? `Target Role: "${targetRole}"` : 'No specific target role provided'}

CONDITIONAL SECTION GENERATION:
${userType === 'experienced' ? `
- Professional Summary: REQUIRED - Create a compelling 2-3 line summary
- Education: MINIMAL or OMIT unless specifically required by job
- Focus heavily on work experience and achievements
- Omit or minimize fresher-specific sections
` : userType === 'student' ? `
- Career Objective: REQUIRED - Create a compelling 2-line objective focusing on internship goals
- Education: PROMINENT - include degree, institution, year, CGPA, and location
- Academic Projects: IMPORTANT - treat as main experience section
- Work Experience: Include any internships, part-time jobs, or training
- Achievements: Include academic awards, competitions, rankings
- Languages Known: Include if present (list languages with proficiency levels if available)
- Location: Include in contact information and education details
` : `
- Professional Summary: OPTIONAL - only include if candidate has relevant internships/experience
- Education: PROMINENT - include degree, institution, year, relevant coursework if applicable
- Education: INCLUDE CGPA if mentioned in original resume (e.g., "CGPA: 8.4/10") and date format ex;2021-2024 
- Academic Projects: IMPORTANT - treat as main experience section
- Work Experience: COMBINE all internships, trainings, and work experience under this single section
- Achievements: Include if present in original resume (academic awards, competitions, etc.)
- Extra-curricular Activities: Include if present (leadership roles, clubs, volunteer work)
- Languages Known: Include if present (list languages with proficiency levels if available)
- Personal Details: Include if present in original resume (brief personal information)
`}

IMPORTANT: Follow the exact structure provided below. Only include sections that have actual content.

Rules:
1. Only respond with valid JSON
2. Use the exact structure provided below
3. Rewrite bullet points following the CRITICAL REQUIREMENTS above
4. Generate comprehensive skills section based on resume and job description
5. Only include sections that have meaningful content
6. If optional sections don't exist in original resume, set them as empty arrays or omit
7. Ensure all dates are in proper format (e.g., "Jan 2024 – Mar 2024")
8. Use professional language and industry-specific keywords from the job description
9. For LinkedIn and GitHub, use EXACTLY what is provided - empty string if not provided
10. The "name" field in the JSON should ONLY contain the user's name. The "email", "phone", "linkedin", "github", and "location" fields MUST NOT contain the user's name or any part of it. The user's name should appear ONLY in the dedicated "name" field.

JSON Structure:
{
  "name": "${userName || '...'}",
  "location": "...",
  "phone": "${userPhone || '...'}",
  "email": "${userEmail || '...'}",
  "linkedin": "${userLinkedin || linkedinUrl || ''}",
  "github": "${userGithub || githubUrl || ''}",
  "targetRole": "${targetRole || '...'}",
  ${userType === 'experienced' ? '"summary": "...",' : ''}
  ${userType === 'student' ? '"careerObjective": "...",' : ''}
  ${userType === 'fresher' ? '"summary": "...",' : ''}
  "education": [
    {"degree": "...", "school": "...", "year": "...", "cgpa": "...", "location": "..."}
  ],
  "workExperience": [
    {"role": "...", "company": "...", "year": "...", "bullets": ["...", "...", "..."]}
  ],
  "projects": [
    {"title": "...", "bullets": ["...", "...", "..."]}
  ],
  "skills": [
    {"category": "...", "count": 0, "list": ["...", "..."]}
  ],
  "certifications": ["...", "..."],
  ${userType === 'fresher' || userType === 'student' ? `
  "achievements": ["...", "..."],
  "extraCurricularActivities": ["...", "..."],
  "languagesKnown": ["...", "..."],
  "personalDetails": "..." ,` : ''}
  "fileName": "Resume_${userName || 'Candidate'}_${targetRole || 'Role'}.txt",
  "atsResume": "..."
}

${atsBlock}

Resume:
${resume}

Job Description:
${jobDescription}

User Type: ${userType.toUpperCase()}

LinkedIn URL provided: ${linkedinUrl || 'NONE - leave empty'}
GitHub URL provided: ${githubUrl || 'NONE - leave empty'}`;

  const maxRetries = 5;
  let retryCount = 0;
  let delay = 2000;

  while (retryCount < maxRetries) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://primoboost.ai',
          'X-Title': 'PrimoBoost AI'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: promptContent }],
          temperature: 0.2
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error response:', errorText);

        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your OpenRouter API key configuration.');
        } else if (response.status === 429 || response.status >= 500) {
          console.warn(`Retrying due to OpenRouter API error: ${response.status}. Attempt ${retryCount + 1}/${maxRetries}. Retrying in ${Math.round(delay / 1000)}s...`);
          retryCount++;
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay = Math.min(delay * 2, 20000);
          continue;
        } else {
          throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
        }
      }

      const data = await response.json();
      let result = data?.choices?.[0]?.message?.content;
      if (!result) throw new Error('No response content from OpenRouter API');

      // Extract JSON (supports fenced and unfenced)
      const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/i);
      let cleanedResult: string = jsonMatch?.[1]?.trim()
        ?? result.replace(/```json/gi, '').replace(/```/g, '').trim();

      // Remove leading/trailing junk before/after the first "{" and last "}"
      const firstBrace = cleanedResult.indexOf('{');
      const lastBrace = cleanedResult.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleanedResult = cleanedResult.slice(firstBrace, lastBrace + 1);
      }

      let parsedResult: any;
      try {
        parsedResult = JSON.parse(cleanedResult);
      } catch (e) {
        console.error('JSON parsing error:', e);
        console.error('Raw response attempted to parse:', cleanedResult);
        throw new Error('Invalid JSON response from OpenRouter API');
      }

      // Normalize skills count
      if (parsedResult.skills && Array.isArray(parsedResult.skills)) {
        parsedResult.skills = parsedResult.skills.map((skill: any) => ({
          ...skill,
          count: Array.isArray(skill.list) ? skill.list.length : 0
        }));
      }

      // Normalize certifications to strings
      if (parsedResult.certifications && Array.isArray(parsedResult.certifications)) {
        parsedResult.certifications = parsedResult.certifications.map((cert: any) => {
          if (typeof cert === 'string') return cert;
          if (cert && typeof cert === 'object') {
            if (cert.title && cert.description) return `${cert.title} - ${cert.description}`;
            if (cert.title && cert.issuer) return `${cert.title} - ${cert.issuer}`;
            if (cert.title) return cert.title;
            if (cert.name) return cert.name;
            if (cert.description) return cert.description;
            return Object.values(cert).filter(Boolean).join(' - ');
          }
          return String(cert ?? '');
        });
      }

      // Filter malformed experience/projects
      if (Array.isArray(parsedResult.workExperience)) {
        parsedResult.workExperience = parsedResult.workExperience.filter(
          (w: any) => w && w.role && w.company && w.year
        );
      }
      if (Array.isArray(parsedResult.projects)) {
        parsedResult.projects = parsedResult.projects.filter(
          (p: any) => p && p.title && Array.isArray(p.bullets) && p.bulle
