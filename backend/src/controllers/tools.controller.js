import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import sharp from "sharp";
import * as labelService from "../services/label.service.js";
import * as pdfService from "../services/pdf.service.js";
import * as claimService from "../services/claim.service.js";


// export const labelMaker = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: "No file uploaded" });
//     }

//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', 'attachment; filename="amazon-labels.pdf"');
//     res.sendFile(req.file.path, { root: '.' });
//   } catch (error) {
//     res.status(500).json({ error: "Processing failed" });
//   }
// };

export const labelMaker = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const pdfPath = req.file.path;

    // temp folder
    const workDir = path.join("uploads", `label-${Date.now()}`);
    fs.mkdirSync(workDir, { recursive: true });

    // =============================
    // 1️⃣ PDF → IMAGE
    // =============================
    await pdfPoppler.convert(pdfPath, {
      format: "png",
      out_dir: workDir,
      out_prefix: "page",
      page: null
    });

    const images = fs
      .readdirSync(workDir)
      .filter(f => f.endsWith(".png"))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const finalPdf = await PDFDocument.create();

    // =============================
    // 2️⃣ AMAZON LABEL CROP
    // =============================
    for (let i = 0; i < images.length; i++) {

      // Amazon invoice PDFs:
      // odd pages = shipping labels
      if ((i + 1) % 2 === 0) continue;

      const imgPath = path.join(workDir, images[i]);

      const meta = await sharp(imgPath).metadata();

      const cropArea = {
        left: Math.floor(meta.width * 0.03),
        top: Math.floor(meta.height * 0.04),
        width: Math.floor(meta.width * 0.94),
        height: Math.floor(meta.height * 0.42)
      };

      const croppedBuffer = await sharp(imgPath)
        .extract(cropArea)
        .png()
        .toBuffer();

      const embedded = await finalPdf.embedPng(croppedBuffer);

      const page = finalPdf.addPage([
        embedded.width,
        embedded.height
      ]);

      page.drawImage(embedded, {
        x: 0,
        y: 0,
        width: embedded.width,
        height: embedded.height
      });
    }

    // =============================
    // 3️⃣ SAVE FINAL PDF
    // =============================
    const outputPath = `uploads/amazon-label-${Date.now()}.pdf`;
    const pdfBytes = await finalPdf.save();

    fs.writeFileSync(outputPath, pdfBytes);

    return res.json({
      success: true,
      pdfUrl: "/" + outputPath
    });

  } catch (error) {
    console.error("LABEL MAKER ERROR:", error);
    res.status(500).json({
      error: "Label generation failed"
    });
  }
};
export const fbaLabelMaker = async (req, res) => {
  try {
    const { productName, netQuantity, mrp, productCode, labelSize = 'A4', includeBarcode = 'true' } = req.body;
    
    if (!productName || !netQuantity || !mrp || !productCode) {
      return res.status(400).json({ error: "All product fields are required" });
    }

    console.log('FBA Label Maker - Product:', productName);

    const outputDir = path.join(process.cwd(), 'uploads', 'fba-labels');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = Date.now();
    const outputPath = path.join(outputDir, `fba-label-${timestamp}.pdf`);

    // Generate ASIN and FNSKU
    const asin = `B0${Math.floor(Math.random() * 9000000) + 1000000}`;
    const fnsku = `X00${Math.floor(Math.random() * 9000000) + 1000000}`;
    
    const labelDoc = await PDFDocument.create();
    const font = await labelDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await labelDoc.embedFont(StandardFonts.HelveticaBold);
    
    let pageWidth = 595;
    let pageHeight = 842;
    
    if (labelSize === 'A5') {
      pageWidth = 420;
      pageHeight = 595;
    } else if (labelSize === 'Letter') {
      pageWidth = 612;
      pageHeight = 792;
    }
    
    const page = labelDoc.addPage([pageWidth, pageHeight]);
    let yPosition = pageHeight - 60;
    
    // Amazon FBA Header
    page.drawRectangle({
      x: 30,
      y: yPosition - 40,
      width: pageWidth - 60,
      height: 35,
      color: rgb(1, 0.55, 0)
    });
    
    page.drawText('AMAZON FBA PRODUCT LABEL', {
      x: 40,
      y: yPosition - 25,
      size: 16,
      font: boldFont,
      color: rgb(1, 1, 1)
    });
    
    yPosition -= 70;
    
    // Product Name
    page.drawText('PRODUCT NAME:', {
      x: 40,
      y: yPosition,
      size: 10,
      font: boldFont
    });
    
    yPosition -= 18;
    
    const productLines = productName.match(/.{1,60}/g) || [productName];
    for (const line of productLines) {
      page.drawText(line, {
        x: 40,
        y: yPosition,
        size: 12,
        font: boldFont
      });
      yPosition -= 16;
    }
    
    yPosition -= 10;
    
    // Product Details Grid
    const details = [
      { label: 'ASIN:', value: asin },
      { label: 'FNSKU:', value: fnsku },
      { label: 'Net Quantity:', value: netQuantity },
      { label: 'MRP:', value: `₹${mrp}` },
      { label: 'Product Code:', value: productCode }
    ];
    
    for (const detail of details) {
      page.drawText(detail.label, {
        x: 40,
        y: yPosition,
        size: 10,
        font: boldFont
      });
      
      page.drawText(detail.value, {
        x: 150,
        y: yPosition,
        size: 10,
        font
      });
      
      yPosition -= 20;
    }
    
    yPosition -= 20;
    
    // Barcode
    if (includeBarcode === 'true') {
      page.drawText('FNSKU BARCODE:', {
        x: 40,
        y: yPosition,
        size: 10,
        font: boldFont
      });
      
      yPosition -= 25;
      
      page.drawText(`*${fnsku}*`, {
        x: 40,
        y: yPosition,
        size: 16,
        font: await labelDoc.embedFont(StandardFonts.Courier)
      });
      
      yPosition -= 30;
    }
    
    // Made in India
    page.drawText('Made in India', {
      x: 40,
      y: yPosition,
      size: 9,
      font,
      color: rgb(0.5, 0.5, 0.5)
    });
    
    // Border
    page.drawRectangle({
      x: 20,
      y: 20,
      width: pageWidth - 40,
      height: pageHeight - 40,
      borderColor: rgb(0, 0, 0),
      borderWidth: 2
    });
    
    const pdfBytes = await labelDoc.save();
    fs.writeFileSync(outputPath, pdfBytes);
    
    const relativePath = path.relative(process.cwd(), outputPath);
    const pdfUrl = `/tools/download-pdf?path=${encodeURIComponent(relativePath)}`;
    
    res.json({
      success: true,
      pdfUrl,
      product: {
        name: productName,
        asin,
        fnsku,
        netQuantity,
        mrp: `₹${mrp}`,
        productCode
      },
      message: `FBA label generated successfully for ${productName}`,
      options: { labelSize, includeBarcode: includeBarcode === 'true' }
    });
    
  } catch (error) {
    console.error('FBA label maker error:', error);
    res.status(500).json({ error: "FBA label generation failed: " + error.message });
  }
};

export const labelCrop = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Use labelService to crop the PDF
    const croppedPdfPath = await labelService.cropLabels(req.file.path);
    
    console.log("Original Path:", req.file.path);
    console.log("Cropped Path returned:", croppedPdfPath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="cropped-labels.pdf"');
    
    // Send the cropped PDF
    res.sendFile(croppedPdfPath, { root: '.' });
  } catch (error) {
    console.error('Label crop error:', error);
    res.status(500).json({ error: "Cropping failed" });
  }
};

export const labelSort = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Get sortBy and removeInvoice from FormData (req.body or as query params)
    let sortBy = req.body?.sortBy || 'PRODUCT';
    let removeInvoice = req.body?.removeInvoice || 'YES';
    
    console.log("Sort options - sortBy:", sortBy, "removeInvoice:", removeInvoice);

    // Use labelService to sort the PDF
    const sortResult = await labelService.sortLabels(req.file.path, sortBy, removeInvoice);
    
    console.log("Original Path:", req.file.path);
    console.log("Sort result:", sortResult);

    // Return JSON with both PDF path and extracted data
    res.json({
      success: true,
      pdfPath: sortResult.pdfPath,
      pdfUrl: `/tools/download-pdf?path=${encodeURIComponent(sortResult.pdfPath)}`,
      sortedData: sortResult.sortedData,
      pageMapping: sortResult.pageMapping,
      totalPages: sortResult.totalPages
    });
  } catch (error) {
    console.error('Label sort error:', error);
    res.status(500).json({ error: "Sorting failed: " + error.message });
  }
};

export const downloadPdf = async (req, res) => {
  try {
    const pdfPath = req.query.path;
    const mode = req.query.mode || 'attachment'; // 'attachment' for download, 'inline' for print
    
    if (!pdfPath) {
      return res.status(400).json({ error: "No PDF path provided" });
    }

    res.setHeader('Content-Type', 'application/pdf');
    
    if (mode === 'inline') {
      // For printing - display in browser
      res.setHeader('Content-Disposition', 'inline; filename="sorted-labels.pdf"');
    } else {
      // For downloading
      res.setHeader('Content-Disposition', 'attachment; filename="sorted-labels.pdf"');
    }
    
    if (path.isAbsolute(pdfPath)) {
      res.sendFile(pdfPath);
    } else {
      res.sendFile(pdfPath, { root: '.' });
    }
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: "Download failed" });
  }
};

export const filterAndDownloadPdf = async (req, res) => {
  try {
    const { pdfPath, itemName, pages } = req.body;
    
    if (!pdfPath || !itemName || !pages || pages.length === 0) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const filteredPath = await labelService.createFilteredPDF(pdfPath, itemName, pages);
    
    res.json({
      success: true,
      pdfUrl: `/tools/download-pdf?path=${encodeURIComponent(filteredPath)}`,
      message: `PDF for ${itemName} created successfully`
    });
  } catch (error) {
    console.error('Filter PDF error:', error);
    res.status(500).json({ error: "Filter failed: " + error.message });
  }
};

export const labelSplit = async (req, res) => {
  res.json({ success: true, message: "Label split done" });
};

export const multiLabelMaker = async (req, res) => {
  res.json({ success: true, message: "Multiple labels generated" });
};

export const pdfMerge = async (req, res) => {
  res.json({ success: true, message: "PDFs merged" });
};

export const captureMissingPayments = async (req, res) => {
  try {
    if (
      !req.files?.orderFile ||
      !req.files?.payment1File ||
      !req.files?.payment2File
    ) {
      return res.status(400).json({
        error: "Order file + both payment files are required"
      });
    }

    const readExcel = (path) => {
      const wb = XLSX.readFile(path);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      return XLSX.utils.sheet_to_json(sheet, { defval: "" });
    };

    const orders = readExcel(req.files.orderFile[0].path);
    const payment1 = readExcel(req.files.payment1File[0].path);
    const payment2 = readExcel(req.files.payment2File[0].path);

    // console.log('=== ORDER FILE ANALYSIS ===');
    if (orders.length > 0) {
      // console.log('Available columns:', Object.keys(orders[0]));
      // console.log('Sample row:', orders[0]);
    }

    /* ---------------- HELPERS ---------------- */

    const normalizeId = (id) =>
      String(id || "")
        .trim()
        .replace(/[_\s]/g, "-");

    const findKey = (row, keywords) =>
      Object.keys(row).find(k =>
        keywords.some(w =>
          k.toLowerCase().includes(w)
        )
      );

    /* ---------------- PAYMENT MAP ---------------- */

    const paymentMap = new Map();

    const addPayments = (rows) => {
      rows.forEach(row => {

        const orderKey = findKey(row, [
          "sub order",
          "suborder",
          "order id",
          "order no",
          "reference",
          "transaction",
          "awb"
        ]);

        if (!orderKey) return;

        const orderId = normalizeId(row[orderKey]);
        if (!orderId) return;

        const amountKey = findKey(row, [
          "settlement",
          "net payable",
          "net amount",
          "final settlement",
          "payable"
        ]);

        const amount = amountKey
          ? Number(row[amountKey]) || 0
          : 0;

        paymentMap.set(
          orderId,
          (paymentMap.get(orderId) || 0) + amount
        );
      });
    };

    addPayments(payment1);
    addPayments(payment2);

    /* ---------------- PROCESS ORDERS ---------------- */

    const details = [];
    let totalPaidAmount = 0;

    orders.forEach(row => {

      const orderKey = findKey(row, [
        "sub order",
        "suborder",
        "order id",
        "order no"
      ]);

      if (!orderKey) return;

      const subOrderNo = normalizeId(row[orderKey]);

      const skuKey = findKey(row, ["sku"]);
      const productKey = findKey(row, ["product"]);
      const qtyKey = findKey(row, ["qty", "quantity"]);
      const statusKey = findKey(row, ["reason for credit entry", "reason", "credit entry", "status"]);

      // console.log(`Row status detection: statusKey='${statusKey}', rawValue='${statusKey ? row[statusKey] : 'not found'}'`);

      const rawStatus = statusKey ? String(row[statusKey]) : "";

      let status = rawStatus || "Unknown";
      const s = rawStatus.toLowerCase();

      // Keep original status but normalize common ones
      if (s.includes("deliver")) status = "Delivered";
      else if (s.includes("return")) status = "Return";
      else if (s.includes("rto")) status = "RTO";
      else if (s.includes("cancel")) status = "Cancelled";
      else if (s.includes("shipped")) status = "Shipped";
      else if (s.includes("pending")) status = "Pending";
      else if (rawStatus) status = rawStatus; // Keep original if not matched
      
      // console.log(`Final status: '${status}'`);

      const payment = paymentMap.get(subOrderNo) || 0;
      totalPaidAmount += payment;

      details.push({
        subOrderNo,
        sku: skuKey ? row[skuKey] : "N/A",
        productName: productKey ? row[productKey] : "N/A",
        qty: qtyKey ? Number(row[qtyKey]) || 1 : 1,
        payment,
        status
      });
    });

    return res.json({
      success: true,
      totalOrders: details.length,
      missingPayments: details.filter(d => d.payment === 0).length,
      totalPaidAmount,
      processedDate: new Date().toISOString(),
      details
    });

  } catch (err) {
    console.error("FINAL ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

export const emptyBoxClaim = async (req, res) => {
  res.json({ success: true, message: "Empty box claim generated" });
};

export const meeshoProfitAnalysis = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log('File uploaded:', req.file.originalname, 'Size:', req.file.size);
    
    const filePath = req.file.path;
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    
    let data = [];
    
    try {
      if (fileExtension === 'csv') {
        // Read CSV file
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const lines = fileContent.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          return res.status(400).json({ error: "File must contain header and at least one data row" });
        }

        // Parse CSV headers
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        console.log('CSV Headers:', headers);
        
        // Parse data rows
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          if (values.length >= headers.length) {
            const row = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });
            data.push(row);
          }
        }
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Read Excel file
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(sheet);
      } else {
        return res.status(400).json({ error: "Unsupported file format. Please upload CSV or Excel file." });
      }
    } catch (readError) {
      console.error('Error reading file:', readError);
      return res.status(400).json({ error: "Could not read file content" });
    }

    console.log('Parsed data sample:', data.slice(0, 3));
    
    if (data.length === 0) {
      return res.status(400).json({ error: "No data found in file" });
    }

    // Extract products from parsed data
    const products = [];
    
    data.forEach((row, index) => {
      // Find relevant columns (case-insensitive)
      const keys = Object.keys(row);
      const skuKey = keys.find(k => k.toLowerCase().includes('sku') || k.toLowerCase().includes('product id'));
      const nameKey = keys.find(k => 
        k.toLowerCase().includes('product name') || 
        k.toLowerCase().includes('title') || 
        k.toLowerCase().includes('name')
      );
      const priceKey = keys.find(k => 
        k.toLowerCase().includes('selling price') || 
        k.toLowerCase().includes('price') || 
        k.toLowerCase().includes('amount')
      );
      const qtyKey = keys.find(k => 
        k.toLowerCase().includes('qty') || 
        k.toLowerCase().includes('quantity')
      );
      
      // Create product object
      const product = {
        sku: (skuKey ? row[skuKey] : '') || `SKU-${index + 1}`,
        productName: (nameKey ? row[nameKey] : '') || `Product ${index + 1}`,
        sellingPrice: parseFloat(priceKey ? row[priceKey] : 0) || 0,
        quantity: parseInt(qtyKey ? row[qtyKey] : 1) || 1
      };
      
      // Only add if we have meaningful data
      if (product.sku && product.productName && product.sku !== 'SKU' && product.productName !== 'Product Name') {
        products.push(product);
      }
    });
    
    console.log('Extracted products:', products.length);
    console.log('Sample products:', products.slice(0, 3));
    
    if (products.length === 0) {
      return res.status(400).json({ error: "No valid product data found in file" });
    }

    res.json({
      success: true,
      products: products,
      message: `Successfully extracted ${products.length} products`
    });
  } catch (error) {
    console.error('Meesho profit analysis error:', error);
    res.status(500).json({ error: "Analysis failed: " + error.message });
  }
};

export const amazonProfitCalculator = async (req, res) => {
  try {
    const { 
      sellingPrice, 
      costPrice, 
      weight = '0.5', 
      dimensions = {}, 
      category = 'Electronics', 
      fulfillmentMethod = 'FBA' 
    } = req.body;
    
    if (!sellingPrice || !costPrice) {
      return res.status(400).json({ error: "Selling price and cost price are required" });
    }

    const price = parseFloat(sellingPrice);
    const cost = parseFloat(costPrice);
    const productWeight = parseFloat(weight) || 0.5;
    
    // Amazon commission rates by category
    const commissionRates = {
      'Electronics': 0.08,
      'Fashion': 0.15,
      'Home & Kitchen': 0.12,
      'Books': 0.15,
      'Sports': 0.12,
      'Beauty & Personal Care': 0.10,
      'Toys & Games': 0.15,
      'Automotive': 0.12,
      'Health': 0.10,
      'Grocery & Gourmet Foods': 0.15,
      'Baby Products': 0.10,
      'Pet Supplies': 0.12
    };
    
    const commissionRate = commissionRates[category] || 0.12;
    
    // Calculate fees
    const amazonFee = price * commissionRate;
    const gst = amazonFee * 0.18; // 18% GST on commission
    const tcs = price * 0.01; // 1% TCS
    
    // Shipping fee calculation based on weight and fulfillment method
    let shippingFee = 0;
    if (fulfillmentMethod === 'FBA') {
      if (productWeight <= 0.5) {
        shippingFee = 25;
      } else if (productWeight <= 1) {
        shippingFee = 35;
      } else if (productWeight <= 2) {
        shippingFee = 45;
      } else {
        shippingFee = 45 + (productWeight - 2) * 15;
      }
    } else {
      // FBM shipping
      if (productWeight <= 0.5) {
        shippingFee = 40;
      } else if (productWeight <= 1) {
        shippingFee = 55;
      } else {
        shippingFee = 55 + (productWeight - 1) * 20;
      }
    }
    
    // Closing fee
    const closingFee = fulfillmentMethod === 'FBA' ? 25 : 15;
    
    // Calculate totals
    const totalFees = amazonFee + gst + tcs + shippingFee + closingFee;
    const netAmount = price - totalFees;
    const profit = netAmount - cost;
    const profitMargin = price > 0 ? (profit / price) * 100 : 0;
    
    const breakdown = {
      sellingPrice: price,
      amazonFee,
      gst,
      tcs,
      shippingFee,
      closingFee,
      totalFees,
      netAmount,
      costPrice: cost,
      profit,
      profitMargin
    };
    
    res.json({
      success: true,
      breakdown,
      message: `Profit calculated for ${category} product`,
      details: {
        category,
        fulfillmentMethod,
        weight: productWeight,
        commissionRate: (commissionRate * 100).toFixed(1) + '%'
      }
    });
    
  } catch (error) {
    console.error('Amazon profit calculator error:', error);
    res.status(500).json({ error: "Profit calculation failed: " + error.message });
  }
};