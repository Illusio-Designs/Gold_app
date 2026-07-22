const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

/**
 * Stream an order form PDF directly to a writable stream (e.g. the HTTP
 * response). `order` is the flat, joined row returned by
 * orderModel.getOrderById (order + user_* + product_* fields).
 *
 * The caller is responsible for setting Content-Type / Content-Disposition
 * headers before calling this.
 */
function generateOrderPDF(order, stream) {
  const doc = new PDFDocument({ margin: 44, size: "A4" });

  // If PDF generation fails after headers are sent, just end the stream.
  doc.on("error", () => {
    try {
      stream.end();
    } catch (e) {
      /* noop */
    }
  });

  doc.pipe(stream);

  const brand = "#5d0829";
  const line = (label, value) => {
    if (value === undefined || value === null || value === "") return;
    doc
      .font("Helvetica-Bold")
      .fillColor("#333")
      .text(`${label}: `, { continued: true });
    doc.font("Helvetica").fillColor("#000").text(String(value));
  };
  const heading = (text) => {
    doc.moveDown(0.6);
    doc.font("Helvetica-Bold").fontSize(13).fillColor(brand).text(text);
    doc.fontSize(11);
  };

  // Header
  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .fillColor(brand)
    .text("Amrut Jewels", { align: "center" });
  doc
    .font("Helvetica")
    .fontSize(13)
    .fillColor("#333")
    .text("Order Form", { align: "center" });
  doc.moveDown(0.8);
  doc.fontSize(11);

  heading("Order");
  line("Order ID", `#${order.id}`);
  line("Status", order.status);
  line("Date", order.created_at ? new Date(order.created_at).toLocaleString() : "");

  heading("Business User");
  line("Name", order.user_name);
  line("Business", order.business_name);
  line("Email", order.email);
  line("Phone", order.user_phone);

  heading("Product");
  line("Name", order.product_name);
  line("SKU", order.product_sku);
  line("Description", order.description);

  heading("Order Details");
  line("Quantity", order.quantity);
  line("Total Amount", order.total_amount);
  line("Courier Company", order.courier_company);
  line("Remark", order.remark);

  if (order.product_image) {
    const imgPath = path.join(
      __dirname,
      "..",
      "uploads",
      "products",
      order.product_image
    );
    if (fs.existsSync(imgPath)) {
      try {
        doc.moveDown(0.6);
        doc.font("Helvetica-Bold").fontSize(13).fillColor(brand).text("Product Image");
        doc.moveDown(0.3);
        doc.image(imgPath, { fit: [160, 160] });
      } catch (e) {
        /* skip unreadable image */
      }
    }
  }

  doc.end();
}

module.exports = {
  generateOrderPDF,
};
