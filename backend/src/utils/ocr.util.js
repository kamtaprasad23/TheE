import fs from "fs";
import path from "path";
import { PDFDocument } from 'pdf-lib';
import Tesseract from "tesseract.js";

export const pdfToImages = async (pdfPath) => {
  try {
    const existingPdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pageCount = pdfDoc.getPageCount();
    
    const outputDir = path.join("uploads", "ocr");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Convert PDF pages to canvas and save as images
    const imagePaths = [];
    
    for (let i = 0; i < pageCount; i++) {
      const imagePath = path.join(outputDir, `page_${Date.now()}_${i}.png`);
      // For now, just create placeholder - we'll use direct PDF text extraction
      imagePaths.push(imagePath);
    }
    
    return outputDir;
  } catch (error) {
    throw new Error('PDF to images conversion failed: ' + error.message);
  }
};

export const runOCR = async (pdfBuffer) => {
  try {
    // Direct OCR on PDF buffer using Tesseract
    const result = await Tesseract.recognize(pdfBuffer, 'eng', {
      logger: m => console.log(m)
    });
    return result.data.text;
  } catch (error) {
    console.error('OCR failed:', error);
    return '';
  }
};
