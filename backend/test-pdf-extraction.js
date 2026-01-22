import { extractSkuFromPdf } from './src/services/label.service.js';
import fs from 'fs';
import path from 'path';

async function test() {
  try {
    // Check if there are any PDF files in uploads folder
    const uploadsDir = './uploads';
    if (!fs.existsSync(uploadsDir)) {
      console.log('❌ No uploads directory found. Please upload a Meesho PDF first.');
      return;
    }

    const files = fs.readdirSync(uploadsDir).filter(f => f.endsWith('.pdf'));
    
    if (files.length === 0) {
      console.log('❌ No PDF files found in uploads folder. Please upload a Meesho PDF first.');
      console.log('\nUsage:');
      console.log('1. Upload a PDF from the label-sorter frontend');
      console.log('2. Run this test: node test-pdf-extraction.js');
      return;
    }

    console.log(`\n📄 Found ${files.length} PDF file(s) to test:\n`);
    
    for (const file of files) {
      const pdfPath = path.join(uploadsDir, file);
      console.log(`\n=== Testing: ${file} ===`);
      
      try {
        const result = await extractSkuFromPdf(pdfPath);
        
        console.log('\n✅ Extraction successful!');
        console.log('\nResults:');
        result.forEach(group => {
          console.log(`  - SKU: "${group.sku}" → Pages: [${group.pages.join(', ')}]`);
        });
      } catch (error) {
        console.error(`❌ Extraction failed:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

test();
