import React from 'react';
import { ResumeData, UserType } from '../types/resume';
import { ExportOptions } from '../types/export';

interface ResumePreviewProps {
  resumeData: ResumeData;
  userType?: UserType;
  exportOptions?: ExportOptions;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({
  resumeData,
  userType = 'experienced',
  exportOptions
}) => {
  // Debug logging to check what data we're receiving
  console.log('ResumePreview received data:', resumeData);

  // Add validation to ensure we have valid resume data
  if (!resumeData) {
    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-8 text-center">
          <div className="text-gray-500 mb-4">No resume data available</div>
          <div className="text-sm text-gray-400">Please ensure your resume has been properly optimized</div>
        </div>
      </div>
    );
  }

  // Ensure we have at least a name to display
  if (!resumeData.name || resumeData.name.trim() === '') {
    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-8 text-center">
          <div className="text-gray-500 mb-4">Invalid resume data</div>
          <div className="text-sm text-gray-400">Resume name is missing or empty</div>
        </div>
      </div>
    );
  }

  // --- Moved style constants here (top of component function body) ---
  // Helper function to convert mm to px (1mm = 3.779528px at 96 DPI)
  const mmToPx = (mm: number) => mm * 3.779528;

  // Helper function to convert pt to px (1pt = 1.333px at 96 DPI)
  const ptToPx = (pt: number) => pt * 1.333;

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: exportOptions ? `${ptToPx(exportOptions.sectionHeaderSize)}px` : '13.33px', // Default 10pt converted to px
    fontWeight: 'bold',
    marginBottom: exportOptions ? `${mmToPx(exportOptions.sectionSpacing * 0.4)}px` : '5.33px',
    marginTop: exportOptions ? `${mmToPx(exportOptions.sectionSpacing)}px` : '11.34px',
    fontFamily: exportOptions ? `${exportOptions.fontFamily}, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif` : 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    letterSpacing: '0.5pt',
    textTransform: 'uppercase'
  } as const;

  const sectionUnderlineStyle: React.CSSProperties = {
    borderBottomWidth: '0.5pt',
    borderColor: '#404040',
    height: '1px',
    marginBottom: exportOptions ? `${mmToPx(exportOptions.sectionSpacing * 0.6)}px` : '8px'
  };

  const bodyTextStyle: React.CSSProperties = {
    fontSize: exportOptions ? `${ptToPx(exportOptions.bodyTextSize)}px` : '12.67px',
    fontFamily: exportOptions ? `${exportOptions.fontFamily}, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif` : 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    lineHeight: '1.25'
  };

  // Build contact information with proper separators
  const buildContactInfo = () => {
    const parts: React.ReactNode[] = [];

    if (resumeData.email) {
      parts.push(
        <span key="email" style={{ fontSize: exportOptions ? `${ptToPx(exportOptions.bodyTextSize - 0.5)}px` : '12px' }}>
          {resumeData.email}
        </span>
      );
    }

    if (resumeData.phone) {
      parts.push(
        <span key="phone" style={{ fontSize: exportOptions ? `${ptToPx(exportOptions.bodyTextSize - 0.5)}px` : '12px' }}>
          {resumeData.phone}
        </span>
      );
    }

    if (resumeData.location) {
      parts.push(
        <span key="location" style={{ fontSize: exportOptions ? `${ptToPx(exportOptions.bodyTextSize - 0.5)}px` : '12px' }}>
          {resumeData.location}
        </span>
      );
    }

    if (resumeData.linkedin) {
      parts.push(
        <span key="linkedin" style={{ fontSize: exportOptions ? `${ptToPx(exportOptions.bodyTextSize - 0.5)}px` : '12px' }}>
          {resumeData.linkedin}
        </span>
      );
    }

    if (resumeData.github) {
      parts.push(
        <span key="github" style={{ fontSize: exportOptions ? `${ptToPx(exportOptions.bodyTextSize - 0.5)}px` : '12px' }}>
          {resumeData.github}
        </span>
      );
    }

    // Join with | separator
    return parts.map((part, index) => (
      <React.Fragment key={index}>
        {part}
        {index < parts.length - 1 && <span className="mx-1" style={{ fontSize: exportOptions ? `${ptToPx(exportOptions.bodyTextSize)}px` : '13.33px' }}>|</span>}
      </React.Fragment>
    ));
  };

  const contactElements = buildContactInfo();

  // Define section order based on user type
  const getSectionOrder = () => {
    if (userType === 'experienced') {
      return [
        'summary',
        'workExperience',
        'projects',
        'skills',
        'certifications',
        'education'
      ];
    } else { // Fresher or Student
      return [
        'summary', // This 'summary' case will now handle both professional summary and career objective
        'education', // Prominent for freshers/students
        'workExperience', // Internships & Work Experience
        'projects', // Academic projects
        'skills',
        'certifications',
        'achievementsAndExtras' // Combined section for fresher/student extras
      ];
    }
  };

  const sectionOrder = getSectionOrder();

  const renderSection = (sectionName: string) => {
    // Style constants are now accessible from outside this function scope
    // No need to redefine them here.

    switch (sectionName) {
      case 'summary':
        // Conditional logic for 'Professional Summary' or 'Career Objective'
        if (userType === 'student') {
          if (!resumeData.careerObjective || resumeData.careerObjective.trim() === '') return null;
          return (
            <div style={{ marginBottom: exportOptions ? `${mmToPx(exportOptions.sectionSpacing * 0.5)}px` : '16px' }}>
              <h2 style={sectionTitleStyle}>
                CAREER OBJECTIVE
              </h2>
              <div style={sectionUnderlineStyle}></div>
              <p style={{ ...bodyTextStyle, marginBottom: exportOptions ? `${mmToPx(exportOptions.entrySpacing)}px` : '7.56px' }}>
                {resumeData.careerObjective}
              </p>
            </div>
          );
        } else { // 'experienced' or 'fresher'
          if (!resumeData.summary || resumeData.summary.trim() === '') return null;
          return (
            <div style={{ marginBottom: exportOptions ? `${mmToPx(exportOptions.sectionSpacing * 0.5)}px` : '16px' }}>
              <h2 style={sectionTitleStyle}>
                PROFESSIONAL SUMMARY
              </h2>
              <div style={sectionUnderlineStyle}></div>
              <p style={{ ...bodyTextStyle, marginBottom: exportOptions ? `${mmToPx(exportOptions.entrySpacing)}px` : '7.56px' }}>
                {resumeData.summary}
              </p>
            </div>
          );
        }

      case 'workExperience':
        if (!resumeData.workExperience || resumeData.workExperience.length === 0) return null;
        return (
          <div style={{ marginBottom: exportOptions ? `${mmToPx(exportOptions.sectionSpacing * 0.5)}px` : '16px' }}>
            <h2 style={sectionTitleStyle}>
              {userType === 'fresher' ? 'WORK EXPERIENCE' : 'EXPERIENCE'}
            </h2>
            <div style={sectionUnderlineStyle}></div>

            {resumeData.workExperience.map((job, index) => (
              <div key={index} style={{ marginBottom: exportOptions ? `${mmToPx(exportOptions.entrySpacing * 2)}px` : '15.12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: exportOptions ? `${mmToPx(exportOptions.entrySpacing * 0.5)}px` : '3.78px' }}>
                  <div>
                    <div style={{
                      fontSize: exportOptions ? `${ptToPx(exportOptions.subHeaderSize)}px` : '12.67px',
                      fontWeight: 'bold',
                      fontFamily: exportOptions ? `${exportOptions.fontFamily}, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif` : 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
                    }}>
                      {job.role}
                    </div>
                    <div style={{
                      fontSize: exportOptions ? `${ptToPx(exportOptions.subHeaderSize)}px` : '12.67px',
                      fontFamily: exportOptions ? `${exportOptions.fontFamily}, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif` : 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
                    }}>
                      {job.company}{job.location ? `, ${job.location}` : ''} {/* Add location */}
                    </div>
                  </div>
                  <div style={{
                    fontSize: exportOptions ? `${ptToPx(exportOptions.subHeaderSize)}px` : '12.67px',
                    fontFamily: exportOptions ? `${exportOptions.fontFamily}, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif` : 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
                  }}>
                    {job.year}
                  </div>
                </div>
                {job.bullets && job.bullets.length > 0 && (
                  <ul style={{ marginLeft: exportOptions ? `${mmToPx(exportOptions.entrySpacing * 2)}px` : '15.12px', listStyleType: 'disc' }}>
                    {job.bullets.map((bullet, bulletIndex) => (
                      <li key={bulletIndex} style={{ ...bodyTextStyle, marginBottom: exportOptions ? `${mmToPx(exportOptions.entrySpacing * 0.25)}px` : '1.89px' }}>
                        {typeof bullet === 'string' ? bullet : (bullet as any).description || JSON.stringify(bullet)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        );

      case 'education':
        if (!resumeData.education || resumeData.education.length === 0) return null;
        return (
          <div style={{ marginBottom: exportOptions ? `${mmToPx(exportOptions.sectionSpacing * 0.5)}px` : '16px' }}>
            <h2 style={sectionTitleStyle}>
              EDUCATION
            </h2>
            <div style={sectionUnderlineStyle}></div>

            {resumeData.education.map((edu, index) => (
              <div key={index} style={{ marginBottom: exportOptions ? `${mmToPx(exportOptions.entrySpacing * 2)}px` : '15.12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{
                      fontSize: exportOptions ? `${ptToPx(exportOptions.subHeaderSize)}px` : '12.67px',
                      fontWeight: 'bold',
                      fontFamily: exportOptions ? `${exportOptions.fontFamily}, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif` : 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
                    }}>
                      {edu.degree}
                    </div>
                    <div style={{
                      fontSize: exportOptions ? `${ptToPx(exportOptions.subHeaderSize)}px` : '12.67px',
                      fontFamily: exportOptions ? `${exportOptions.fontFamily}, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif` : 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
                    }}>
                      {edu.school}{edu.location ? `, ${edu.location}` : ''}
                    </div>
                    {edu.cgpa && (
                      <div style={{
                        fontSize: exportOptions ? `${ptToPx(exportOptions.bodyTextSize)}px` : '12.67px',
                        fontFamily: exportOptions ? `${exportOptions.fontFamily}, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif` : 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
                        color: '#4B5563'
                      }}>
                        CGPA: {edu.cgpa}
                      </div>
                    )}
                    {edu.relevantCoursework && edu.relevantCoursework.length > 0 && (
                        <div style={{
                          fontSize: exportOptions ? `${ptToPx(exportOptions.bodyTextSize)}px` : '12.67px',
                          fontFamily: exportOptions ? `${exportOptions.fontFamily}, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif` : 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
                          color: '#4B5563'
                        }}>
                          Relevant Coursework: {edu.relevantCoursework.join(', ')}
                        </div>
                    )}
                  </div>
                  <div style={{
                    fontSize: exportOptions ? `${ptToPx(exportOptions.subHeaderSize)}px` : '12.67px',
                    fontFamily: exportOptions ? `${exportOptions.fontFamily}, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif` : 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
                  }}>
                    {edu.year}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'projects':
        if (!resumeData.projects || resumeData.projects.length === 0) return null;
        return (
          <div style={{ marginBottom: exportOptions ? `${mmToPx(exportOptions.sectionSpacing * 0.5)}px` : '16px' }}>
            <h2 style={sectionTitleStyle}>
              {userType === 'fresher' ? 'ACADEMIC PROJECTS' : 'PROJECTS'}
            </h2>
            <div style={sectionUnderlineStyle}></div>

            {resumeData.projects.map((project, index) => (
              <div key={index} style={{ marginBottom: exportOptions ? `${mmToPx(exportOptions.entrySpacing * 2)}px` : '15.12px' }}>
                <div style={{
                  fontSize: exportOptions ? `${ptToPx(exportOptions.subHeaderSize)}px` : '12.67px',
                  fontWeight: 'bold',
                  fontFamily: exportOptions ? `${exportOptions.fontFamily}, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif` : 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
                  marginBottom: exportOptions ? `${mmToPx(exportOptions.entrySpacing * 0.5)}px` : '3.78px'
                }}>
                  {project.title}
                </div>
                {project.bullets && project.bullets.length > 0 && (
                  <ul style={{ marginLeft: exportOptions ? `${mmToPx(exportOptions.entrySpacing * 2)}px` : '15.12px', listStyleType: 'disc' }}>
                    {project.bullets.map((bullet, bulletIndex) => (
                      <li key={bulletIndex} style={{ ...bodyTextStyle, marginBottom: exportOptions ? `${mmToPx(exportOptions.entrySpacing * 0.25)}px` : '1.89px' }}>
                        {typeof bullet === 'string' ? bullet : (bullet as any).description || JSON.stringify(bullet)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        );

      case 'skills':
        if (!resumeData.skills || resumeData.skills.length === 0) return null;
        return (
          <div style={{ marginBottom: exportOptions ? `${mmToPx(exportOptions.sectionSpacing * 0.5)}px` : '16px' }}>
            <h2 style={sectionTitleStyle}>
              {userType === 'student' ? 'SKILLS' : 'TECHNICAL SKILLS'}
            </h2>
            <div style={sectionUnderlineStyle}></div>

            {resumeData.skills.map((skill, index) => (
              <div key={index} style={{ marginBottom: exportOptions ? `${mmToPx(exportOptions.entrySpacing * 0.5)}px` : '3.78px' }}>
                <span style={{
                  fontSize: exportOptions ? `${ptToPx(exportOptions.bodyTextSize)}px` : '12.67px',
                  fontFamily: exportOptions ? `${exportOptions.fontFamily}, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif` : 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
                }}>
                  <strong style={{ fontWeight: 'bold' }}>• {skill.category}:</strong>{' '}
                  {skill.list && skill.list.join(', ')}
                </span>
              </div>
            ))}
          </div>
        );

      case 'certifications':
        if (!resumeData.certifications || resumeData.certifications.length === 0) return null;
        return (
          <div style={{ marginBottom: exportOptions ? `${mmToPx(exportOptions.sectionSpacing * 0.5)}px` : '16px' }}>
            <h2 style={sectionTitleStyle}>
              CERTIFICATIONS
            </h2>
            <div style={sectionUnderlineStyle}></div>

            <ul style={{ marginLeft: exportOptions ? `${mmToPx(exportOptions.entrySpacing * 2)}px` : '15.12px', listStyleType: 'disc' }}>
              {resumeData.certifications.map((cert, index) => {
                let certText = '';
                if (typeof cert === 'string') {
                  certText = cert;
                } else if (cert && typeof cert === 'object') {
                  if ('title' in cert && 'issuer' in cert) {
                    certText = `${String(cert.title)} - ${String(cert.issuer)}`;
                  } else if ('title' in cert && 'description' in cert) {
                    certText = `${String(cert.title)} - ${String(cert.description)}`;
                  } else if ('name' in cert) {
                    certText = String(cert.name);
                  } else if ('title' in cert) {
                    certText = String(cert.title);
                  } else if ('description' in cert) {
                    certText = (cert as any).description; // Cast to 'any' to access description
                  } else {
                    certText = Object.values(cert).filter(Boolean).join(' - ');
                  }
                } else {
                  certText = String(cert);
                }

                return (
                  <li key={index} style={{ ...bodyTextStyle, marginBottom: exportOptions ? `${mmToPx(exportOptions.entrySpacing * 0.25)}px` : '1.89px' }}>
                    {certText}
                  </li>
                );
              })}
            </ul>
          </div>
        );

      case 'achievementsAndExtras': // Combined section for freshers
        const hasAchievements = resumeData.achievements && resumeData.achievements.length > 0;
        const hasExtraCurricular = resumeData.extraCurricularActivities && resumeData.extraCurricularActivities.length > 0;
        const hasLanguages = resumeData.languagesKnown && resumeData.languagesKnown.length > 0;
        const hasPersonalDetails = resumeData.personalDetails && resumeData.personalDetails.trim() !== '';

        if (!hasAchievements && !hasExtraCurricular && !hasLanguages && !hasPersonalDetails) return null;

        return (
          <div style={{ marginBottom: exportOptions ? `${mmToPx(exportOptions.sectionSpacing * 0.5)}px` : '16px' }}>
            <h2 style={sectionTitleStyle}>
              ACHIEVEMENTS & EXTRAS
            </h2>
            <div style={sectionUnderlineStyle}></div>

            {hasAchievements && (
              <div style={{ marginBottom: exportOptions ? `${mmToPx(exportOptions.entrySpacing)}px` : '7.56px' }}>
                <p style={{ ...bodyTextStyle, fontWeight: 'bold', marginBottom: exportOptions ? `${mmToPx(exportOptions.entrySpacing * 0.5)}px` : '3.78px' }}>Achievements:</p>
                <ul style={{ marginLeft: exportOptions ? `${mmToPx(exportOptions.entrySpacing * 3)}px` : '22.68px', listStyleType: 'disc' }}>
                  {resumeData.achievements!.map((item, index) => (
                    <li key={index} style={{ ...bodyTextStyle, marginBottom: exportOptions ? `${mmToPx(exportOptions.entrySpacing * 0.25)}px` : '1.89px' }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {hasExtraCurricular && (
              <div style={{ marginBottom: exportOptions ? `${mmToPx(exportOptions.entrySpacing)}px` : '7.56px' }}>
                <p style={{ ...bodyTextStyle, fontWeight: 'bold', marginBottom: exportOptions ? `${mmToPx(exportOptions.entrySpacing * 0.5)}px` : '3.78px' }}>Extra-curricular Activities:</p>
                <ul style={{ marginLeft: exportOptions ? `${mmToPx(exportOptions.entrySpacing * 3)}px` : '22.68px', listStyleType: 'disc' }}>
                  {resumeData.extraCurricularActivities!.map((item, index) => (
                    <li key={index} style={{ ...bodyTextStyle, marginBottom: exportOptions ? `${mmToPx(exportOptions.entrySpacing * 0.25)}px` : '1.89px' }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {hasLanguages && (
              <div style={{ marginBottom: exportOptions ? `${mmToPx(exportOptions.entrySpacing)}px` : '7.56px' }}>
                <p style={{ ...bodyTextStyle, fontWeight: 'bold', marginBottom: exportOptions ? `${mmToPx(exportOptions.entrySpacing * 0.5)}px` : '3.78px' }}>Languages Known:</p>
                <ul style={{ marginLeft: exportOptions ? `${mmToPx(exportOptions.entrySpacing * 3)}px` : '22.68px', listStyleType: 'disc' }}>
                  {resumeData.languagesKnown!.map((item, index) => (
                    <li key={index} style={{ ...bodyTextStyle, marginBottom: exportOptions ? `${mmToPx(exportOptions.entrySpacing * 0.25)}px` : '1.89px' }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {hasPersonalDetails && (
              <div style={{ marginBottom: exportOptions ? `${mmToPx(exportOptions.entrySpacing)}px` : '7.56px' }}>
                <p style={{ ...bodyTextStyle, fontWeight: 'bold', marginBottom: exportOptions ? `${mmToPx(exportOptions.entrySpacing * 0.5)}px` : '3.78px' }}>Personal Details:</p>
                <p style={{ ...bodyTextStyle, marginLeft: exportOptions ? `${mmToPx(exportOptions.entrySpacing * 3)}px` : '22.68px' }}>{resumeData.personalDetails}</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="card">
      <div
        className="pt-4 px-4 pb-6 sm:pt-6 sm:px-6 sm:pb-8 lg:px-8 max-h-[70vh] sm:max-h-[80vh] lg:max-h-[800px] overflow-y-auto"
        style={{
          fontFamily: exportOptions ? `${exportOptions.fontFamily}, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif` : 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
          fontSize: exportOptions ? `${ptToPx(exportOptions.bodyTextSize)}px` : '12.67px',
          lineHeight: '1.25', /* PDF_CONFIG.spacing.lineHeight */
          color: '#000',
          padding: exportOptions?.template === 'compact' ? '8px' : '15px' /* Adjust padding based on template */
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '18pt' /* Spacing after contact line */ }}>
          <h1 style={{
            fontSize: exportOptions ? `${ptToPx(exportOptions.nameSize)}px` : '24px', /* Default 18pt converted to px */
            fontWeight: 'bold',
            letterSpacing: '1pt',
            marginBottom: exportOptions ? `${mmToPx(exportOptions.sectionSpacing * 0.4)}px` : '5.33px',
            fontFamily: exportOptions ? `${exportOptions.fontFamily}, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif` : 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
            textTransform: 'uppercase'
          }}>
            {resumeData.name}
          </h1>

          {/* Contact Information */}
          {contactElements.length > 0 && (
            <div style={{
              fontSize: exportOptions ? `${ptToPx(exportOptions.bodyTextSize - 0.5)}px` : '12px', /* Contact size is slightly smaller */
              fontFamily: exportOptions ? `${exportOptions.fontFamily}, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif` : 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
              marginBottom: exportOptions ? `${mmToPx(exportOptions.sectionSpacing * 0.6)}px` : '8px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              {contactElements}
            </div>
          )}

          {/* Horizontal line under contact info */}
          <div style={{
            borderBottomWidth: '0.5pt', /* PDF_CONFIG line width */
            borderColor: '#404040', /* PDF_CONFIG color */
            height: '1px', /* Ensure line is visible */
            margin: '0 auto', /* Center the line */
            width: 'calc(100% - 20mm)' /* Adjust width if needed to match PDF_CONFIG line start/end */
          }}></div>
        </div>

        {/* Dynamic sections based on user type */}
        {sectionOrder.map((sectionName) => renderSection(sectionName))}

        {/* The GitHub References Section has been removed as per requirement. */}
      </div>
    </div>
  );
};