import React, { useState } from 'react';
import { Download, FileText, Loader2, CheckCircle, AlertCircle, Share2, ArrowDown } from 'lucide-react';
import { ResumeData, UserType } from '../types/resume'; // Ensure UserType is imported if used
import { exportToPDF, exportToWord } from '../utils/exportUtils';
import { ExportOptionsModal } from './ExportOptionsModal';
import { ExportOptions, defaultExportOptions } from '../types/export';

interface ExportButtonsProps {
  resumeData: ResumeData;
  userType?: UserType;
  targetRole?: string;
  // Assuming these props might be passed from ResumeOptimizer if needed for Subscription check
  // onShowProfile?: (mode?: 'profile' | 'wallet') => void;
  // walletRefreshKey?: number;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({ resumeData, userType = 'experienced', targetRole }) => {
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showExportOptionsModal, setShowExportOptionsModal] = useState(false);
  const [exportStatus, setExportStatus] = useState<{
    type: 'pdf' | 'word' | null;
    status: 'success' | 'error' | null;
    message: string;
  }>({ type: null, status: null, message: '' });

  const handleExportPDF = async () => {
    // Prevent double clicks if an export is already in progress
    if (isExportingPDF || isExportingWord) return;
    
    // Open the modal for PDF export options
    setShowExportOptionsModal(true);
    
    // Debugging: Log the state change immediately after setting it
    console.log('showExportOptionsModal state after click:', true); 
  };

  const handleExportWithCustomOptions = async (options: ExportOptions) => {
    // Close the options modal
    setShowExportOptionsModal(false);
    // Set PDF exporting status to true
    setIsExportingPDF(true);
    // Clear any previous export status messages
    setExportStatus({ type: null, status: null, message: '' }); 
    
    try {
      // Call the utility function to export the resume to PDF with custom options
      await exportToPDF(resumeData, userType, options);
      // Set success status
      setExportStatus({
        type: 'pdf',
        status: 'success',
        message: 'PDF exported successfully!'
      });
      
      // Clear success message after 3 seconds for user feedback
      setTimeout(() => {
        setExportStatus({ type: null, status: null, message: '' });
      }, 3000);
    } catch (error) {
      // Log and set error status if PDF export fails
      console.error('PDF export failed:', error);
      setExportStatus({
        type: 'pdf',
        status: 'error',
        message: 'PDF export failed. Please try again.'
      });
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setExportStatus({ type: null, status: null, message: '' });
      }, 5000);
    } finally {
      // Reset PDF exporting status
      setIsExportingPDF(false);
    }
  };

  const handleExportWord = async () => {
    // Prevent double clicks if an export is already in progress
    if (isExportingWord || isExportingPDF) return; 
    
    // Set Word exporting status to true
    setIsExportingWord(true);
    // Clear any previous export status messages
    setExportStatus({ type: null, status: null, message: '' }); 
    
    try {
      // Call the utility function to export the resume to Word (does not take options)
      exportToWord(resumeData, userType); 
      // Set success status
      setExportStatus({
        type: 'word',
        status: 'success',
        message: 'Word document exported successfully!'
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setExportStatus({ type: null, status: null, message: '' });
      }, 3000);
    } catch (error) {
      // Log and set error status if Word export fails
      console.error('Word export failed:', error);
      setExportStatus({
        type: 'word',
        status: 'error',
        message: 'Word export failed. Please try again.'
      });
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setExportStatus({ type: null, status: null, message: '' });
      }, 5000);
    } finally {
      // Reset Word exporting status
      setIsExportingWord(false);
    }
  };

  const toggleShareOptions = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevents click from bubbling to parent elements
    setShowShareOptions(!showShareOptions);
  };

  const shareFile = async (type: 'pdf' | 'word') => {
    try {
      // In a real implementation, you'd generate the blob/file content first
      // and then use navigator.share. This currently triggers an export for demonstration.
      if (type === 'pdf') {
        // If sharing PDF, you might generate it first without downloading, then share.
        // For simplicity, reusing exportToPDF which initiates a download.
        await exportToPDF(resumeData, userType, defaultExportOptions); // Using default options for share
      } else {
        // For Word, also reusing exportToWord
        await handleExportWord(); // This function already handles the word export and its state
      }
      
      // This part depends on actual file handling and Web Share API capabilities
      if (navigator.share) {
        // Ideally, you'd get the actual file blob/URL here and pass it to share
        // Example: const file = new File([blob], 'resume.pdf', { type: 'application/pdf' });
        // navigator.share({
        //    files: [file],
        //    title: 'My Resume',
        //    text: 'Check out my optimized resume!'
        // });
        setExportStatus({
          type,
          status: 'success',
          message: `${type.toUpperCase()} shared successfully! (Simulated)` // Added simulated for clarity
        });
      } else {
        setExportStatus({
          type,
          status: 'error',
          message: 'Web Share API not supported on this device. File downloaded instead.' // Better message
        });
      }
    } catch (error) {
      console.error('Sharing failed:', error);
      setExportStatus({
        type,
        status: 'error',
        message: 'Sharing failed. Please try again.'
      });
    }
  };

  // Expose state variables globally for debugging purposes
  // This allows checking their values directly in the browser's developer console
  (window as any).isExportingPDF = isExportingPDF;
  (window as any).isExportingWord = isExportingWord;

  return (
    <div className="card p-4 sm:p-6">
      {/* Mobile Export Header with Prominent Button */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-fluid-lg font-semibold text-secondary-900 flex items-center">
            <Download className="w-5 h-5 mr-2 text-primary-600" />
            Export Resume
          </h3>
          
          <button
            onClick={toggleShareOptions}
            className="btn-primary p-2 rounded-full shadow-md min-w-touch min-h-touch"
            aria-label="Show export options"
            // Ensure no accidental double taps/clicks
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation'
            }}
          >
            <ArrowDown className={`w-5 h-5 transition-transform duration-300 ${showShareOptions ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        {/* Primary Export Button for Mobile (always present for quick PDF export) */}
        <button
          onClick={handleExportPDF} // This directly opens the modal for PDF export
          disabled={isExportingPDF || isExportingWord}
          className={`w-full flex items-center justify-center space-x-2 font-semibold py-4 px-4 rounded-xl transition-all duration-200 text-fluid-base focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-touch mb-4 ${
            isExportingPDF || isExportingWord
              ? 'bg-secondary-400 text-white cursor-not-allowed'
              : 'btn-primary shadow-lg hover:shadow-xl active:scale-[0.98]'
          }`}
          style={{ 
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation'
          }}
        >
          {isExportingPDF ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Exporting PDF...</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              <span>Export Resume (PDF)</span> {/* Clarified to PDF */}
            </>
          )}
        </button>
        
        {/* Expandable Export Options for Mobile */}
        {showShareOptions && (
          <div className="space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="text-fluid-sm font-medium text-secondary-700">More Options:</div> {/* Changed text */}
            </div>
            
            <div className="grid-responsive-2 gap-3">
              {/* PDF button in expanded options (if distinct from main button, otherwise remove) */}
              {/* Keeping for clarity if user wants both "quick" PDF and "options" PDF */}
              <button
                onClick={handleExportPDF} // Still triggers modal
                disabled={isExportingPDF || isExportingWord}
                className={`flex items-center justify-center space-x-2 font-medium py-3 px-3 rounded-xl transition-all duration-200 text-fluid-sm focus:outline-none min-h-touch ${
                  isExportingPDF || isExportingWord
                    ? 'bg-secondary-400 text-white cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-md'
                }`}
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation'
                }}
              >
                {isExportingPDF ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                <span>PDF</span>
              </button>
              
              <button
                onClick={handleExportWord}
                disabled={isExportingWord || isExportingPDF} // Corrected typo here
                className={`flex items-center justify-center space-x-2 font-medium py-3 px-3 rounded-xl transition-all duration-200 text-fluid-sm focus:outline-none min-h-touch ${
                  isExportingWord || isExportingPDF
                    ? 'bg-secondary-400 text-white cursor-not-allowed'
                    : 'btn-primary shadow-md'
                }`}
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation'
                }}
              >
                {isExportingWord ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                <span>Word</span>
              </button>
            </div>
            
            {/* Share Button - Only on supported devices */}
            {navigator.share && (
              <button
                onClick={() => shareFile('pdf')} // Default to sharing PDF for simplicity
                disabled={isExportingPDF || isExportingWord}
                className={`w-full flex items-center justify-center space-x-2 font-medium py-3 px-4 rounded-xl transition-all duration-200 text-fluid-sm focus:outline-none min-h-touch ${
                  isExportingPDF || isExportingWord
                    ? 'bg-secondary-400 text-white cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-md'
                }`}
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation'
                }}
              >
                <Share2 className="w-4 h-4" />
                <span>Share Resume</span>
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Desktop Export Buttons */}
      <div className="hidden lg:block">
        <h3 className="text-fluid-xl font-semibold text-secondary-900 mb-4 flex items-center">
          <Download className="w-5 h-5 mr-2 text-primary-600" />
          Export Resume
        </h3>
        
        <div className="grid-responsive-2 gap-4">
          {/* PDF Export Button */}
          <button
            onClick={handleExportPDF} // This directly opens the modal for PDF export
            disabled={isExportingPDF || isExportingWord}
            className={`flex items-center justify-center space-x-2 font-semibold py-4 px-6 rounded-xl transition-all duration-200 text-fluid-base focus:outline-none focus:ring-2 focus:ring-red-500 min-h-touch ${
              isExportingPDF || isExportingWord
                ? 'bg-secondary-400 text-white cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-lg hover:shadow-xl active:scale-[0.98]'
            }`}
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation'
            }}
          >
            {isExportingPDF ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Exporting PDF...</span>
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                <span>Export as PDF</span>
              </>
            )}
          </button>

          {/* Word Export Button */}
          <button
            onClick={handleExportWord}
            disabled={isExportingWord || isExportingPDF} // Corrected typo here
            className={`flex items-center justify-center space-x-2 font-semibold py-4 px-6 rounded-xl transition-all duration-200 text-fluid-base focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-touch ${
              isExportingWord || isExportingPDF
                ? 'bg-secondary-400 text-white cursor-not-allowed'
                : 'btn-primary shadow-lg hover:shadow-xl active:scale-[0.98]'
            }`}
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation'
            }}
          >
            {isExportingWord ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Exporting Word...</span>
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                <span>Export as Word</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Export Status Message */}
      {exportStatus.status && (
        <div className={`mt-4 p-3 rounded-lg border transition-all ${
          exportStatus.status === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            {exportStatus.status === 'success' ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="text-fluid-sm font-medium">{exportStatus.message}</span>
          </div>
        </div>
      )}
      
      {/* Mobile-specific instructions */}
      <div className="mt-4 lg:hidden">
        <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
            <div className="text-fluid-sm text-primary-800">
              <p className="font-medium mb-1">📱 Mobile Export Tips</p>
              <p className="text-fluid-xs text-primary-700">
                After export, check your Downloads folder or browser's download notification.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* PDF Quality Notice */}
      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
          <div className="text-fluid-sm text-green-800">
            <p className="font-medium mb-1">✨ Enhanced Export Quality</p>
            <p className="text-fluid-xs text-green-700">
              Professional formatting with searchable text and optimized file size for both PDF and Word formats.
            </p>
          </div>
        </div>
      </div>

      {/* Export Options Modal */}
      <ExportOptionsModal
        isOpen={showExportOptionsModal}
        onClose={() => setShowExportOptionsModal(false)}
        onExport={handleExportWithCustomOptions}
        resumeData={resumeData}
        userType={userType}
      />
    </div>
  );
};
