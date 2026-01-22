import fs from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export const generateReport = async (reportData) => {
  try {
    const doc = await PDFDocument.create();
    const page = doc.addPage();
    const { width, height } = page.getSize();
    const font = await doc.embedFont(StandardFonts.Helvetica);

    let y = height - 50;
    const fontSize = 12;

    page.drawText(reportData.title || 'Report', { x: 50, y, size: 20, font });
    y -= 40;

    if (Array.isArray(reportData.data)) {
      for (const line of reportData.data) {
        // Replace Rupee symbol with 'Rs.' as StandardFonts don't support unicode characters like ₹
        const safeLine = String(line).replace(/₹/g, 'Rs. ');
        page.drawText(safeLine, { x: 50, y, size: fontSize, font });
        y -= 20;
      }
    }

    const fileName = `report_${Date.now()}.pdf`;
    // Use path.resolve for safer absolute path handling
    const outputDir = path.resolve(process.cwd(), 'uploads');
    
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    
    const outputPath = path.join(outputDir, fileName);
    console.log('Saving PDF to:', outputPath);
    
    const pdfBytes = await doc.save();
    fs.writeFileSync(outputPath, pdfBytes);

    return outputPath;
  } catch (error) {
    throw new Error('PDF generation failed: ' + error.message);
  }
};

export const mergePDF = (files) => {
  return {
    message: "PDFs merged successfully (logic pending)"
  };
};

export const splitPDF = (file) => {
  return {
    message: "PDF split completed (logic pending)"
  };
};
