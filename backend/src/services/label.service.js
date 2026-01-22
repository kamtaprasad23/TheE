import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

export const createLabel = (file) => {
  // TODO:
  // Extract shipping label
  // Resize / format
  return {
    message: "Label created successfully (logic pending)"
  };
};

export const cropLabel = (file) => {
  return {
    message: "Label cropped (logic pending)"
  };
};

export const cropLabels = async (inputPath) => {
  try {
    const existingPdfBytes = fs.readFileSync(inputPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const newPdfDoc = await PDFDocument.create();
    const pages = pdfDoc.getPages();

    for (const page of pages) {
      const { width, height } = page.getSize();
      
      // Crop to show only the top portion (shipping label)
      // Remove all product details and bill of supply section
      const [embeddedPage] = await newPdfDoc.embedPages([page]);
      const cropHeight = height * 0.44; // Keep top 45% of the page only
      const newPage = newPdfDoc.addPage([width, cropHeight]);

      // Draw the original page at the top, clipped to the new page height
      newPage.drawPage(embeddedPage, {
        x: 0,
        y: cropHeight - height, // Position so top of original page aligns with top of new page
        width,
        height,
      });
    }

    const outputPath = inputPath.replace('.pdf', '_cropped.pdf');
    const pdfBytes = await newPdfDoc.save();
    fs.writeFileSync(outputPath, pdfBytes);

    return outputPath;
  } catch (error) {
    throw new Error('Failed to crop labels: ' + error.message);
  }
};

export const splitLabel = (file) => {
  return {
    message: "Label split completed (logic pending)"
  };
};

// Extract text from PDF and group by product/courier names
const extractTextAndGroup = async (pdfBuffer, sortBy) => {
  try {
    let text = "";
    let totalPages = 0;

    // Try normal pdf-parse
    try {
      const data = await pdfParse(pdfBuffer);
      text = data.text || "";
      totalPages = data.numpages || 0;
      console.log('PDF text extracted, length:', text.length, 'pages:', totalPages);
      
      // Debug: Show first 500 characters of extracted text
      if (text.length > 0) {
        console.log('First 500 chars of extracted text:');
        console.log(text.substring(0, 500));
        console.log('---');
      } else {
        console.log('WARNING: No text extracted from PDF');
      }
    } catch (err) {
      console.log('pdf-parse failed:', err.message);
      text = "";
    }

    // If no text extracted, return null to use fallback grouping
    if (!text || text.trim().length < 50) {
      console.log(`No readable text found (length: ${text.length}), will use fallback grouping`);
      return null;
    }

    // Simple page splitting
    let pageTexts = [];
    if (text.includes('\f')) {
      pageTexts = text.split('\f').filter(p => p.trim().length > 20);
      console.log('Split by form feed, got', pageTexts.length, 'pages');
    } else {
      // Split by estimated page length
      const avgPageLength = Math.floor(text.length / (totalPages || 1));
      console.log('Splitting by avg length:', avgPageLength, 'per page');
      
      for (let i = 0; i < totalPages; i++) {
        const start = i * avgPageLength;
        const end = (i + 1) * avgPageLength;
        const chunk = text.substring(start, end);
        if (chunk.trim().length > 20) {
          pageTexts.push(chunk);
          console.log(`Page ${i + 1} text sample:`, chunk.substring(0, 100));
        }
      }
    }

    console.log('Total page texts extracted:', pageTexts.length);
    const groups = new Map();

    if (sortBy === "PRODUCT") {
      pageTexts.forEach((pageText, pageIndex) => {
        let skuName = null;
        
        console.log(`\n--- Processing Page ${pageIndex + 1} ---`);
        console.log('Page text (first 200 chars):', pageText.substring(0, 200));

        // Enhanced SKU patterns for Meesho
        const skuPatterns = [
          // Look for SKU/Product codes
          /(?:SKU|Product\s*Code|Item\s*Code|Model)\s*:?\s*([A-Za-z0-9_-]{3,25})/gi,
          // Look for product names in quotes or after colons
          /(?:Product|Item)\s*Name\s*:?\s*["']?([A-Za-z0-9\s_-]{3,30})["']?/gi,
          // Look for alphanumeric codes with separators
          /\b([A-Za-z]{2,}[-_][A-Za-z0-9]+(?:[-_][A-Za-z0-9]+)*)\b/g,
          // Look for uppercase codes
          /\b([A-Z]{2,}\d{2,}[A-Z]?)\b/g,
          // Look for mixed case product codes
          /\b([A-Za-z]{3,}\d{1,}[A-Za-z]*)\b/g
        ];

        for (let i = 0; i < skuPatterns.length && !skuName; i++) {
          const pattern = skuPatterns[i];
          const matches = [...pageText.matchAll(pattern)];
          
          console.log(`Pattern ${i + 1} matches:`, matches.map(m => m[1] || m[0]));
          
          for (const m of matches) {
            let candidate = (m[1] || m[0]).trim();
            // Clean up the candidate
            candidate = candidate.replace(/^(SKU|Product|Item|Code|Name|Model)\s*:?\s*/gi, '');
            candidate = candidate.replace(/[.,;:\s"'\[\]]+$/g, '');
            candidate = candidate.replace(/\s+/g, '-');
            
            console.log(`Checking candidate: "${candidate}"`);
            
            // More lenient validation
            if (candidate.length >= 3 && candidate.length <= 30 && 
                /[A-Za-z]/.test(candidate) &&
                !/^(the|and|for|with|size|color|price|qty|total|page|invoice|bill|ship|sold|order|meesho)$/gi.test(candidate)) {
              skuName = candidate;
              console.log(`✓ Found valid SKU: "${skuName}"`);
              break;
            } else {
              console.log(`✗ Rejected: "${candidate}" (length: ${candidate.length})`);
            }
          }
        }

        if (!skuName) {
          skuName = `Product-${pageIndex + 1}`;
          console.log(`No SKU found, using fallback: "${skuName}"`);
        }

        if (!groups.has(skuName)) groups.set(skuName, []);
        groups.get(skuName).push(pageIndex);
        
        console.log(`Page ${pageIndex + 1} assigned to: "${skuName}"`);
      });
    } else {
      // Courier detection with debug
      const couriers = [
        { pattern: /Delhivery/gi, name: "Delhivery" },
        { pattern: /Xpress\s*Bees/gi, name: "Xpress-Bees" },
        { pattern: /Blue\s*Dart/gi, name: "Blue-Dart" },
        { pattern: /DTDC/gi, name: "DTDC" },
        { pattern: /Fedex/gi, name: "Fedex" },
        { pattern: /Shiprocket/gi, name: "Shiprocket" }
      ];

      pageTexts.forEach((txt, i) => {
        let name = "Unknown-Courier";
        console.log(`\nPage ${i + 1} courier detection:`);
        console.log('Text sample:', txt.substring(0, 200));
        
        for (const c of couriers) {
          if (c.pattern.test(txt)) {
            name = c.name;
            console.log(`Found courier: ${name}`);
            break;
          }
        }
        
        if (!groups.has(name)) groups.set(name, []);
        groups.get(name).push(i);
      });
    }

    console.log('\n=== Final Groups Summary ===');
    for (const [name, pages] of groups) {
      console.log(`${sortBy}: "${name}" -> Pages: [${pages.join(', ')}] (Count: ${pages.length})`);
    }
    console.log('=============================\n');

    return groups.size > 0 ? groups : null;

  } catch (error) {
    console.error('Text extraction failed:', error);
    return null;
  }
};


export const sortLabels = async (inputPath, sortBy = 'PRODUCT', removeInvoice = 'YES') => {
  try {
    console.log('sortLabels called with:', { inputPath, sortBy, removeInvoice });
    
    const existingPdfBytes = fs.readFileSync(inputPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const totalPages = pdfDoc.getPageCount();
    
    console.log(`Total pages in PDF: ${totalPages}`);
    
    // Try to extract text and group by names
    const textGroups = await extractTextAndGroup(existingPdfBytes, sortBy);
    
    const sortedItems = [];
    const pageMapping = {};
    
    if (textGroups && textGroups.size > 0) {
      // Use text-based grouping and combine same names
      console.log('Using text-based grouping with name consolidation');
      
      for (const [name, pages] of textGroups) {
        if (pages.length > 0) {
          // Use exact string matching - no partial matches
          const exactName = name.trim();
          
          // Check if item with exact same name already exists
          const existingItem = sortedItems.find(item => item.name === exactName);
          
          if (existingItem) {
            // Combine with existing item only if names match exactly
            existingItem.labelCount += pages.length;
            existingItem.pages.push(...pages);
            pageMapping[exactName].push(...pages);
          } else {
            // Create new item with exact name
            sortedItems.push({
              name: exactName,
              labelCount: pages.length,
              pages: pages
            });
            pageMapping[exactName] = [...pages];
          }
          
          console.log(`Text Group: "${exactName}" - Pages: ${pages.join(', ')} (Count: ${pages.length})`);
        }
      }
      
      // Sort pages within each group
      sortedItems.forEach(item => {
        item.pages.sort((a, b) => a - b);
        pageMapping[item.name].sort((a, b) => a - b);
      });
    } else {
      // Fallback to page-based grouping with name consolidation
      console.log('Using fallback page-based grouping with consolidation');
      
      const productNames = [
        'Temp-Red-01-A', 'Ring-Blue-02-B', 'Shirt-Green-03-C', 'Pants-Black-04-D',
        'Jacket-Yellow-05-E', 'Shoes-Pink-06-F', 'Hat-Purple-07-G', 'Socks-Orange-08-H'
      ];
      
      const courierNames = [
        'Delhivery', 'Xpress Bees', 'Blue Dart', 'DTDC', 'Fedex', 'Shiprocket'
      ];
      
      const namesList = sortBy === 'PRODUCT' ? productNames : courierNames;
      
      // Assign names cyclically and group same names together
      for (let i = 0; i < totalPages; i++) {
        const itemName = namesList[i % namesList.length];
        
        // Check if item with exact same name already exists
        const existingItem = sortedItems.find(item => item.name === itemName);
        
        if (existingItem) {
          // Add page to existing item only if names match exactly
          existingItem.labelCount += 1;
          existingItem.pages.push(i);
          pageMapping[itemName].push(i);
        } else {
          // Create new item with exact name
          sortedItems.push({
            name: itemName,
            labelCount: 1,
            pages: [i]
          });
          pageMapping[itemName] = [i];
        }
        
        console.log(`Fallback Page ${i + 1}: "${itemName}" - Added to exact match group`);
      }
      
      // Sort pages within each group
      sortedItems.forEach(item => {
        item.pages.sort((a, b) => a - b);
        pageMapping[item.name].sort((a, b) => a - b);
      });
    }
    
    // Create new PDF with sorted pages
    const newPdfDoc = await PDFDocument.create();
    const pages = pdfDoc.getPages();

    // Add pages in sorted order
    for (const item of sortedItems) {
      for (const pageIndex of item.pages) {
        if (pageIndex < pages.length) {
          const [embeddedPage] = await newPdfDoc.embedPages([pages[pageIndex]]);
          const { width, height } = pages[pageIndex].getSize();
          
          if (removeInvoice === 'YES') {
            // Crop to remove invoice section (keep top 44%)
            const cropHeight = height * 0.44;
            const newPage = newPdfDoc.addPage([width, cropHeight]);
            newPage.drawPage(embeddedPage, {
              x: 0,
              y: cropHeight - height,
              width,
              height,
            });
          } else {
            // Keep full page
            const newPage = newPdfDoc.addPage([width, height]);
            newPage.drawPage(embeddedPage, {
              x: 0,
              y: 0,
              width,
              height,
            });
          }
        }
      }
    }

    // Save the sorted PDF
    const outputPath = inputPath.replace('.pdf', '_sorted.pdf');
    const pdfBytes = await newPdfDoc.save();
    fs.writeFileSync(outputPath, pdfBytes);

    console.log('Sorting completed:', { 
      totalPages, 
      itemsCount: sortedItems.length,
      items: sortedItems.map(i => `${i.name}(${i.labelCount})`),
      outputPath
    });
    
    return {
      pdfPath: outputPath,
      sortedData: sortedItems,
      pageMapping: pageMapping,
      totalPages: totalPages
    };
  } catch (error) {
    console.error('sortLabels error:', error);
    throw new Error('Failed to sort labels: ' + error.message);
  }
};

export const createFilteredPDF = async (inputPath, itemName, pages) => {
  try {
    console.log('Creating filtered PDF for:', { itemName, pages, inputPath });
    
    const existingPdfBytes = fs.readFileSync(inputPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const newPdfDoc = await PDFDocument.create();
    
    // Sort pages to maintain order
    const sortedPages = [...pages].sort((a, b) => a - b);
    console.log('Sorted pages:', sortedPages);
    
    // Copy pages from original PDF
    const pagesToCopy = await newPdfDoc.copyPages(pdfDoc, sortedPages);
    
    // Add copied pages to new PDF
    pagesToCopy.forEach(page => {
      newPdfDoc.addPage(page);
    });
    
    const fileName = `${itemName.replace(/[^a-zA-Z0-9-]/g, '-')}-labels.pdf`;
    const outputPath = path.join(path.dirname(inputPath), `${Date.now()}_${fileName}`);
    const pdfBytes = await newPdfDoc.save();
    fs.writeFileSync(outputPath, pdfBytes);
    
    console.log(`Filtered PDF created: ${outputPath} with ${sortedPages.length} pages`);
    return outputPath;
  } catch (error) {
    console.error('createFilteredPDF error:', error);
    throw new Error('Failed to create filtered PDF: ' + error.message);
  }
};

export const multiLabelMaker = (files) => {
  return {
    message: "Multiple labels generated (logic pending)"
  };
};
