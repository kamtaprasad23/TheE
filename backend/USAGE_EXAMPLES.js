// USAGE EXAMPLES - PDF SKU Extraction
// ====================================

// ============================================================================
// Example 1: Direct Function Usage
// ============================================================================
import { extractSkuFromPdf } from './src/services/label.service.js';

// Extract SKUs from a Meesho PDF
async function example1() {
  try {
    const pdfPath = './uploads/meesho_shipping_labels.pdf';
    
    const skuGroups = await extractSkuFromPdf(pdfPath);
    
    console.log('Extracted SKU Groups:');
    skuGroups.forEach(group => {
      console.log(`  ${group.sku}: [${group.pages.join(', ')}] (${group.pages.length} pages)`);
    });
    
    // Output example:
    // Extracted SKU Groups:
    //   SKU-001: [0, 1] (2 pages)
    //   SKU-002: [2, 3, 4] (3 pages)
    //   UNKNOWN: [5] (1 page)
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// ============================================================================
// Example 2: Group pages by SKU for bulk operations
// ============================================================================
async function example2_groupBySkuForBulkOps() {
  try {
    const pdfPath = './uploads/labels.pdf';
    const skuGroups = await extractSkuFromPdf(pdfPath);
    
    // Create a map of SKU -> pages for quick lookup
    const skuMap = new Map(
      skuGroups.map(g => [g.sku, g.pages])
    );
    
    // Use for bulk operations
    for (const [sku, pages] of skuMap) {
      console.log(`Processing SKU ${sku} - Pages: ${pages.length}`);
      
      // Example: Create filtered PDF per SKU
      // await createFilteredPDF(pdfPath, sku, pages);
      
      // Example: Generate shipping label per SKU
      // await generateShippingLabel(sku, pages.length);
      
      // Example: Send to fulfillment system
      // await sendToFulfillment(sku, pages);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// ============================================================================
// Example 3: Filter and process only specific SKUs
// ============================================================================
async function example3_filterSpecificSkus() {
  try {
    const pdfPath = './uploads/labels.pdf';
    const targetSkus = ['SKU-001', 'SKU-003']; // Only process these
    
    const skuGroups = await extractSkuFromPdf(pdfPath);
    
    // Filter to target SKUs only
    const filteredGroups = skuGroups.filter(
      g => targetSkus.includes(g.sku)
    );
    
    console.log(`Found ${filteredGroups.length} target SKUs:`);
    filteredGroups.forEach(g => {
      console.log(`  ${g.sku}: ${g.pages.length} labels`);
    });
    
    // Example:
    // Found 2 target SKUs:
    //   SKU-001: 2 labels
    //   SKU-003: 1 label
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// ============================================================================
// Example 4: Generate statistics from extraction
// ============================================================================
async function example4_generateStats() {
  try {
    const pdfPath = './uploads/labels.pdf';
    const skuGroups = await extractSkuFromPdf(pdfPath);
    
    // Statistics
    const stats = {
      totalPages: skuGroups.reduce((sum, g) => sum + g.pages.length, 0),
      uniqueSkus: skuGroups.length,
      knownSkus: skuGroups.filter(g => g.sku !== 'UNKNOWN').length,
      unknownPages: skuGroups
        .find(g => g.sku === 'UNKNOWN')
        ?.pages.length || 0,
      averagePagesPerSku: 0
    };
    
    stats.averagePagesPerSku = 
      stats.uniqueSkus > 0 
        ? (stats.totalPages / stats.uniqueSkus).toFixed(2)
        : 0;
    
    console.log('PDF Statistics:');
    console.log(`  Total Pages: ${stats.totalPages}`);
    console.log(`  Unique SKUs: ${stats.uniqueSkus}`);
    console.log(`  Known SKUs: ${stats.knownSkus}`);
    console.log(`  Unknown Pages: ${stats.unknownPages}`);
    console.log(`  Avg Pages/SKU: ${stats.averagePagesPerSku}`);
    
    // Output example:
    // PDF Statistics:
    //   Total Pages: 10
    //   Unique SKUs: 3
    //   Known SKUs: 2
    //   Unknown Pages: 1
    //   Avg Pages/SKU: 3.33
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// ============================================================================
// Example 5: Batch process multiple PDFs
// ============================================================================
import fs from 'fs';
import path from 'path';

async function example5_batchProcess() {
  try {
    const uploadsDir = './uploads';
    const pdfFiles = fs.readdirSync(uploadsDir)
      .filter(f => f.endsWith('.pdf'));
    
    const allResults = {};
    
    for (const file of pdfFiles) {
      const pdfPath = path.join(uploadsDir, file);
      console.log(`\nProcessing: ${file}`);
      
      try {
        const skuGroups = await extractSkuFromPdf(pdfPath);
        allResults[file] = skuGroups;
        
        console.log(`  ✓ Found ${skuGroups.length} SKUs`);
      } catch (error) {
        console.error(`  ✗ Failed: ${error.message}`);
        allResults[file] = null;
      }
    }
    
    // Summary
    console.log('\n=== BATCH SUMMARY ===');
    let totalProcessed = 0;
    let totalSkus = 0;
    
    for (const [file, result] of Object.entries(allResults)) {
      if (result) {
        totalProcessed++;
        totalSkus += result.length;
        console.log(`${file}: ${result.length} SKUs`);
      } else {
        console.log(`${file}: FAILED`);
      }
    }
    
    console.log(`\nSuccessfully processed: ${totalProcessed}/${pdfFiles.length}`);
    console.log(`Total SKUs extracted: ${totalSkus}`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// ============================================================================
// Example 6: Integration with sortLabels (Current Implementation)
// ============================================================================
import { sortLabels } from './src/services/label.service.js';

async function example6_sortLabelsIntegration() {
  try {
    const pdfPath = './uploads/meesho_labels.pdf';
    
    // sortLabels now uses extractSkuFromPdf internally
    const result = await sortLabels(pdfPath, 'PRODUCT', 'YES');
    
    console.log('Sort Result:');
    console.log(`  PDF Path: ${result.pdfPath}`);
    console.log(`  Total Pages: ${result.totalPages}`);
    console.log(`  Items (sorted by SKU):`);
    
    result.sortedData.forEach(item => {
      console.log(`    - ${item.name}: ${item.labelCount} labels`);
      console.log(`      Pages: [${result.pageMapping[item.name].join(', ')}]`);
    });
    
    // Output example:
    // Sort Result:
    //   PDF Path: ./uploads/meesho_labels.pdf
    //   Total Pages: 10
    //   Items (sorted by SKU):
    //     - SKU-001: 2 labels
    //       Pages: [0, 1]
    //     - SKU-002: 3 labels
    //       Pages: [2, 3, 4]
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// ============================================================================
// Example 7: Track extraction progress for large PDFs
// ============================================================================
async function example7_trackProgress() {
  try {
    const pdfPath = './uploads/large_batch_labels.pdf';
    
    console.log('Starting extraction...');
    const startTime = Date.now();
    
    const skuGroups = await extractSkuFromPdf(pdfPath);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`✓ Extraction completed in ${duration}s`);
    console.log(`  Processed SKUs: ${skuGroups.length}`);
    
    // Performance metrics
    const totalPages = skuGroups.reduce((sum, g) => sum + g.pages.length, 0);
    const pagesPerSecond = (totalPages / parseFloat(duration)).toFixed(2);
    
    console.log(`  Total Pages: ${totalPages}`);
    console.log(`  Speed: ${pagesPerSecond} pages/second`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// ============================================================================
// Example 8: Create summary report
// ============================================================================
async function example8_summaryReport() {
  try {
    const pdfPath = './uploads/labels.pdf';
    const skuGroups = await extractSkuFromPdf(pdfPath);
    
    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      filename: path.basename(pdfPath),
      summary: {
        totalPages: skuGroups.reduce((sum, g) => sum + g.pages.length, 0),
        totalSkus: skuGroups.length,
        knownSkus: skuGroups.filter(g => g.sku !== 'UNKNOWN').length,
        unknownSkus: skuGroups.filter(g => g.sku === 'UNKNOWN').length
      },
      details: skuGroups.map(g => ({
        sku: g.sku,
        labelCount: g.pages.length,
        pageNumbers: g.pages
      }))
    };
    
    console.log('=== SKU EXTRACTION REPORT ===');
    console.log(`Date: ${report.timestamp}`);
    console.log(`File: ${report.filename}`);
    console.log('\nSummary:');
    console.log(`  Total Pages: ${report.summary.totalPages}`);
    console.log(`  Known SKUs: ${report.summary.knownSkus}`);
    console.log(`  Unknown SKUs: ${report.summary.unknownSkus}`);
    console.log('\nDetails:');
    report.details.forEach(d => {
      console.log(`  ${d.sku}: ${d.labelCount} labels [${d.pageNumbers.join(',')}]`);
    });
    
    // Could save report to file
    // fs.writeFileSync('sku-report.json', JSON.stringify(report, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// ============================================================================
// RUN EXAMPLES
// ============================================================================

console.log('Choose an example to run:');
console.log('1. example1() - Basic extraction');
console.log('2. example2_groupBySkuForBulkOps() - Group pages by SKU');
console.log('3. example3_filterSpecificSkus() - Filter specific SKUs');
console.log('4. example4_generateStats() - Generate statistics');
console.log('5. example5_batchProcess() - Batch process multiple PDFs');
console.log('6. example6_sortLabelsIntegration() - Use sortLabels');
console.log('7. example7_trackProgress() - Track progress');
console.log('8. example8_summaryReport() - Generate report');

// To run: uncomment the example you want
// await example1();
// await example2_groupBySkuForBulkOps();
// await example3_filterSpecificSkus();
// await example4_generateStats();
// await example5_batchProcess();
// await example6_sortLabelsIntegration();
// await example7_trackProgress();
// await example8_summaryReport();
