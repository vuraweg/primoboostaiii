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

  const promptContent = `${getPromptForUserType(userType)}

CRITICAL REQUIREMENTS FOR BULLET POINTS:
1. Each bullet point must contain up to 15 words
2. Include at least 20 relevant keywords from the job description across all bullet points
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
- Education: INCLUDE CGPA if mentioned in original resume (e.g., "CGPA: 8.4/10")
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
  "linkedin": "${userLinkedin || linkedinUrl || '...'}",
  "github": "${userGithub || githubUrl || '...'}",
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
  "personalDetails": "..."` : ''}
}
Resume:
${resume}

Job Description:
${jobDescription}

User Type: ${userType.toUpperCase()}

LinkedIn URL provided: ${linkedinUrl || 'NONE - leave empty'}
GitHub URL provided: ${githubUrl || 'NONE - leave empty'}`;
 
   const maxRetries = 5; // Increased from 3 to 5
   let retryCount = 3;
   let delay = 2000; // Increased from 1000 (1 second) to 2000 (2 seconds)

  while (retryCount < maxRetries) {
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
              content: promptContent // Use promptContent here
            }
          ]
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error response:', errorText);

        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your OpenRouter API key configuration.');
        } else if (response.status === 429 || response.status >= 500) {
          // Retry for rate limits or server errors
          console.warn(`Retrying due to OpenRouter API error: ${response.status}. Attempt ${retryCount + 1}/${maxRetries}. Retrying in ${delay / 1000}s...`);
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
          continue; // Continue to the next iteration of the while loop
        } else {
          // Non-retryable error
          throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
        }
      }

      const data = await response.json();
      let result = data?.choices?.[0]?.message?.content;

      if (!result) {
        throw new Error('No response content from OpenRouter API');
      }

      // Enhanced JSON extraction
      const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/);
      let cleanedResult: string;
      if (jsonMatch && jsonMatch[1]) {
        cleanedResult = jsonMatch[1].trim();
      } else {
        // Fallback to simpler cleaning if no ```json block is found
        cleanedResult = result.replace(/```json/g, '').replace(/```/g, '').trim();
      }

      try {
        const parsedResult = JSON.parse(cleanedResult);

        // Ensure skills have proper count values
        if (parsedResult.skills && Array.isArray(parsedResult.skills)) {
          parsedResult.skills = parsedResult.skills.map((skill: any) => ({
            ...skill,
            count: skill.list ? skill.list.length : 0
          }));
        }

        // Ensure certifications are strings, not objects
        if (parsedResult.certifications && Array.isArray(parsedResult.certifications)) {
          parsedResult.certifications = parsedResult.certifications.map((cert: any) => {
            if (typeof cert === 'object' && cert !== null) {
              // Handle various object formats
              if (cert.title && cert.description) {
                return `${cert.title} - ${cert.description}`;
              } else if (cert.title && cert.issuer) {
                return `${cert.title} - ${cert.issuer}`;
              } else if (cert.title) {
                return cert.title;
              } else if (cert.name) {
                return cert.name;
              } else if (cert.description) {
                return cert.description;
              } else {
                // Convert any other object structure to string
                return Object.values(cert).filter(Boolean).join(' - ');
              }
            }
            // If it's already a string, return as is
            return String(cert);
          });
        }

        // Ensure work experience is properly formatted
        if (parsedResult.workExperience && Array.isArray(parsedResult.workExperience)) {
          parsedResult.workExperience = parsedResult.workExperience.filter((work: any) =>
            work && work.role && work.company && work.year
          );
        }

        // Ensure projects are properly formatted
        if (parsedResult.projects && Array.isArray(parsedResult.projects)) {
          parsedResult.projects = parsedResult.projects.filter((project: any) =>
            project && project.title && project.bullets && project.bullets.length > 0
          );
        }

        // Prioritize user profile data first
        parsedResult.name = userName || parsedResult.name || "";
        parsedResult.linkedin = userLinkedin || linkedinUrl || "";
        parsedResult.github = userGithub || githubUrl || "";

        // Targeted cleaning and fallback for email
        if (userEmail) {
          parsedResult.email = userEmail; // Prioritize user provided email
        } else if (parsedResult.email) {
          const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
          const match = parsedResult.email.match(emailRegex);
          parsedResult.email = match && match[1] ? match[1] : ""; // Extract valid email or set empty
        } else {
          parsedResult.email = ""; // Ensure it's an empty string if nothing is found
        }

        // Targeted cleaning and fallback for phone
        if (userPhone) {
          parsedResult.phone = userPhone; // Prioritize user provided phone
        } else if (parsedResult.phone) {
          // This regex tries to capture common phone number patterns including international codes, parentheses, spaces, and hyphens.
          // It's designed to be robust but might need adjustments for very unusual formats.
          const phoneRegex = /(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/;
          const match = parsedResult.phone.match(phoneRegex);
          parsedResult.phone = match && match[0] ? match[0] : ""; // Extract valid phone or set empty
        } else {
          parsedResult.phone = ""; // Ensure it's an empty string if nothing is found
        }

        return parsedResult;
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.error('Raw response attempted to parse:', cleanedResult); // Log the string that failed to parse
        throw new Error('Invalid JSON response from OpenRouter API');
      }
    } catch (error) {
      console.error('Error calling OpenRouter API:', error);

      // Re-throw with more specific error message if it's already a known error
      if (error instanceof Error && (
          error.message.includes('API key') ||
          error.message.includes('Rate limit') ||
          error.message.includes('service is temporarily unavailable') ||
          error.message.includes('Invalid JSON response')
      )) {
        throw error;
      }

      // Generic error for network issues or other unknown errors
      throw new Error('Failed to connect to OpenRouter API. Please check your internet connection and try again.');
    }
  }
  // If the loop finishes, it means all retries failed
  throw new Error(`Failed to optimize resume after ${maxRetries} attempts.`);
};