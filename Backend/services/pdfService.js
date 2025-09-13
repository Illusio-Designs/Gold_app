const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a PDF print order form for an order.
 * @param {Object} order - Order details
 * @param {Object} product - Product details
 * @param {Object} user - User (business) details
 * @param {Array} images - Array of product image filenames
 * @param {string} outputPath - Path to save the generated PDF
 */
function generateOrderPDF(order, product, user, images, outputPath) {
  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(fs.createWriteStream(outputPath));

  // Header
  doc.fontSize(20).text('Order Form', { align: 'center' });
  doc.moveDown();

  // Order Info
  doc.fontSize(12).text(`Order ID: ${order.id || ''}`);
  doc.text(`Status: ${order.status || ''}`);
  doc.text(`Date: ${order.created_at || ''}`);
  doc.moveDown();

  // User Info
  doc.fontSize(14).text('Business User:', { underline: true });
  doc.fontSize(12).text(`Name: ${user.name || ''}`);
  doc.text(`Email: ${user.email || ''}`);
  doc.text(`Phone: ${user.phone_number || ''}`);
  doc.moveDown();

  // Product Info
  doc.fontSize(14).text('Product:', { underline: true });
  doc.fontSize(12).text(`Name: ${product.name || ''}`);
  doc.text(`SKU: ${product.sku || ''}`);
  doc.text(`Purity: ${product.purity || ''}`);
  doc.text(`Net Weight: ${product.net_weight || ''}`);
  doc.text(`Gross Weight: ${product.gross_weight || ''}`);
  doc.text(`Less Weight: ${product.less_weight || ''}`);
  doc.text(`Size: ${product.size || ''}`);
  doc.text(`Attributes: ${product.attributes || ''}`);
  doc.text(`Length: ${product.length || ''}`);
  doc.text(`Mark: ${product.mark || ''}`);
  doc.text(`Mark Amount: ${product.mark_amount || ''}`);
  doc.moveDown();

  // Order Details
  doc.fontSize(14).text('Order Details:', { underline: true });
  doc.fontSize(12).text(`Total Qty: ${order.total_qty || ''}`);
  doc.text(`Total Mark Amount: ${order.total_mark_amount || ''}`);
  doc.text(`Total Net Weight: ${order.total_net_weight || ''}`);
  doc.text(`Total Less Weight: ${order.total_less_weight || ''}`);
  doc.text(`Total Gross Weight: ${order.total_gross_weight || ''}`);
  if (order.courier_company) doc.text(`Courier Company: ${order.courier_company}`);
  if (order.remark) doc.text(`Remark: ${order.remark}`);
  doc.moveDown();

  // Product Images
  if (images && images.length > 0) {
    doc.fontSize(14).text('Product Images:', { underline: true });
    images.forEach((img, idx) => {
      const imgPath = path.join('uploads/products', img.image || img);
      if (fs.existsSync(imgPath)) {
        doc.image(imgPath, { width: 120, height: 120, align: 'left' });
        doc.moveDown(0.5);
      }
    });
  }

  doc.end();
}

module.exports = {
  generateOrderPDF
}; 