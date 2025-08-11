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
  const promptContent = `${getPromptForUserType(userType)}

CRITICAL REQUIREMENTS FOR BULLET POINTS:
1. Each bullet point must contain up to 20 words.
2. Include relevant keywords from the job description across bullet points; prioritize natural fit over quantity.
3. Use STRONG ACTION VERBS only (avoid: helped, assisted, worked on, responsible for, participated, involved in, contributed to).
4. Start each bullet with powerful verbs: Developed, Implemented, Architected, Optimized, Engineered, Designed, Led, Managed, Created, Built, Delivered, Achieved, Increased, Reduced, Streamlined, Automated, Transformed, Executed, Spearheaded, Established.
5. Avoid repeating the same word more than twice across all bullets.
6. Quantify achievements with specific numbers, percentages, or metrics where possible.
7. Focus on RESULTS and IMPACT, not just tasks.
8. Max three bullets per work item or project.
9. All section titles must be ALL CAPS (e.g., WORK EXPERIENCE).
10. Dates must be on the same line as roles/education, format: "Jan 2023 – Mar 2024".
11. Aim for strong JD alignment while keeping text concise and precise.
12. Do not add adjectives like "dedicated" or "hardworking" unless backed by measurable achievements.
13. Penalize poorly formatted sections (missing role/company/dates, >3 bullets, no action verbs, no metrics, wrong date format) by tightening content, not adding fluff.

SKILLS REQUIREMENTS:
1. Generate skills based on the resume content and job description.
2. Include 6–8 skill categories.
3. Each category should have 4–8 specific skills.
4. Match skills to job requirements and industry standards.
5. ONLY technical skills. Do NOT generate soft skills.

CERTIFICATIONS REQUIREMENTS:
1. If certifications exist, keep them concise. If the model emits objects, ensure each is convertible to a string via title/issuer/description.

SOCIAL LINKS REQUIREMENTS (CRITICAL):
1. LinkedIn URL: "${linkedinUrl || ''}" — include ONLY if non-empty.
2. GitHub URL: "${githubUrl || ''}" — include ONLY if non-empty.
3. Do NOT create or modify social links. Use EXACTLY what is provided; otherwise use "".

TARGET ROLE INFORMATION:
${targetRole ? `Target Role: "${targetRole}"` : 'No specific target role provided'}

CONDITIONAL SECTION GENERATION:
${userType === 'experienced' ? `
- Professional Summary: REQUIRED (2–3 lines).
- Education: MINIMAL or OMIT unless required by the job.
- Emphasize work experience and measurable achievements.
` : userType === 'student' ? `
- Career Objective: REQUIRED (2 lines, internship/learning focus).
- Education: PROMINENT (degree, institution, year, CGPA if present, location).
- Academic Projects: IMPORTANT (treat as main experience).
- Work Experience: Include internships/part-time/training.
- Achievements: Academic awards/competitions.
- Languages Known: Include if present.
- Include location in contact info and education.
` : `
- Professional Summary: OPTIONAL (only if internships/strong projects).
- Education: PROMINENT (degree, institution, year; CGPA if present; location).
- Work Experience: COMBINE internships/trainings/work into one section.
- Academic Projects: IMPORTANT (main experience if few jobs).
- Achievements / Extra-curricular / Languages / Personal Details: include only if present in original resume.
`}

IMPORTANT: Return ONLY valid JSON following the exact structure below. Include sections ONLY if they have meaningful content. Use "" for missing strings. Ensure dates like "Jan 2024 – Mar 2024". Do not fabricate links.

JSON Structure:
{
  "name": "${userName || ''}",
  "location": "",
  "phone": "${userPhone || ''}",
  "email": "${userEmail || ''}",
  "linkedin": "${userLinkedin || linkedinUrl || ''}",
  "github": "${userGithub || githubUrl || ''}",
  "targetRole": "${targetRole || ''}",
  ${userType === 'experienced' ? `"summary": "",` : ''}
  ${userType === 'student' ? `"careerObjective": "",` : ''}
  ${userType === 'fresher' ? `"summary": "",` : ''}
  "education": [],
  "workExperience": [],
  "projects": [],
  "skills": [],
  "certifications": []${(userType === 'fresher' || userType === 'student') ? `,
  "achievements": [],
  "extraCurricularActivities": [],
  "languagesKnown": [],
  "personalDetails": ""` : ''}
}

Resume:
${resume}

Job Description:
${jobDescription}

User Type: ${userType.toUpperCase()}

LinkedIn URL provided: ${linkedinUrl || 'NONE'}
GitHub URL provided: ${githubUrl || 'NONE'}
`;

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