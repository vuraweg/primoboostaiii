import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';

// Set the worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const parseFile = async (file: File): Promise<string> => {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.pdf')) {
    return await parsePDF(file);
  } else if (fileName.endsWith('.docx')) {
    return await parseDocx(file);
  } else if (fileName.endsWith('.txt')) {
    return await parseText(file);
  } else {
    throw new Error('Unsupported file format. Please use PDF, DOCX, or TXT files.');
  }
};

const parsePDF = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = '';

  // Step 1: Try to extract text directly from the PDF (for searchable PDFs)
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => item.str);
    text += strings.join(' ') + ' ';
  }

  const initialTextContent = text.trim();

  // Step 2: If direct text extraction yields minimal content, attempt OCR
  const MIN_TEXT_LENGTH_THRESHOLD = 50; // Define a constant for clarity

  if (initialTextContent.length < MIN_TEXT_LENGTH_THRESHOLD) {
    console.log('Detected potentially image-based PDF or sparse text. Attempting OCR...');
    let ocrWorker: Tesseract.Worker | null = null;
    try {
      ocrWorker = await createWorker('eng'); // 'eng' for English language
      let ocrText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // Scale up for better OCR accuracy
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Could not get 2D context for canvas');

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        await page.render(renderContext).promise;

        // Perform OCR on the canvas
        const { data: { text: pageOcrText } } = await ocrWorker.recognize(canvas);
        ocrText += pageOcrText + ' ';
        canvas.remove(); // Clean up canvas
      }

      // Step 3: After OCR, if ocrText is still minimal, throw specific error
      if (ocrText.trim().length < MIN_TEXT_LENGTH_THRESHOLD) {
        throw new Error("Failed to recognize text from image-based PDF. Please upload a searchable PDF or a DOCX/TXT file.");
      }

      return ocrText.trim();

    } catch (ocrError: any) {
      console.error('OCR attempt failed or yielded minimal text:', ocrError);
      // If OCR failed or the text from OCR was minimal, and the initial text was also minimal,
      // then we throw the specific error. Otherwise, fall back to initial text.
      if (initialTextContent.length < MIN_TEXT_LENGTH_THRESHOLD) {
        // Check if the thrown error is already our specific message to avoid wrapping
        if (ocrError.message === "Failed to recognize text from image-based PDF. Please upload a searchable PDF or a DOCX/TXT file.") {
          throw ocrError; // Re-throw the specific error
        } else {
          // It's a different OCR error, but still effectively means we couldn't get text from image-based PDF
          throw new Error("Failed to recognize text from image-based PDF. Please upload a searchable PDF or a DOCX/TXT file.");
        }
      }
      // If initial text had content (was >= 50 chars), but OCR failed, we can still return initial text.
      return initialTextContent;

    } finally {
      if (ocrWorker) {
        await ocrWorker.terminate(); // Ensure worker is always terminated to free up resources
      }
    }
  }

  return initialTextContent; // Return initial text if it was sufficient
};

const parseDocx = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

const parseText = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read text file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};