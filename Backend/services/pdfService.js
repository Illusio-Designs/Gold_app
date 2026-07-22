const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const BRAND = "#5d0829";
const GOLD = "#c09e83";
const CREAM = "#fce2bf";
const INK = "#2b2b2b";
const MUTED = "#7a6a5d";

const formatOrderId = (id) => `ORD-${String(id ?? "").padStart(6, "0")}`;

const formatCurrency = (amount) => {
  const n = Number(amount);
  if (!isFinite(n)) return String(amount ?? "-");
  return "Rs. " + n.toLocaleString("en-IN");
};

/**
 * Stream a branded order form PDF to a writable stream (e.g. the HTTP
 * response). `order` is the flat, joined row from orderModel.getOrderById.
 * The caller sets Content-Type / Content-Disposition before calling this.
 */
function generateOrderPDF(order, stream) {
  const doc = new PDFDocument({ margin: 0, size: "A4" });
  doc.on("error", () => {
    try {
      stream.end();
    } catch (e) {
      /* noop */
    }
  });
  doc.pipe(stream);

  const pageW = doc.page.width;
  const M = 48; // content margin
  const contentW = pageW - M * 2;

  // ---- Header band ---------------------------------------------------------
  doc.rect(0, 0, pageW, 92).fill(BRAND);
  doc.rect(0, 92, pageW, 4).fill(GOLD);
  doc
    .fillColor(CREAM)
    .font("Helvetica-Bold")
    .fontSize(24)
    .text("AMRUT JEWELS", M, 26);
  doc
    .fillColor(GOLD)
    .font("Helvetica")
    .fontSize(11)
    .text("Amrutkumar Govinddas LLP  •  Order Form", M, 58);

  // Order id + date, right-aligned in the band.
  doc
    .fillColor(CREAM)
    .font("Helvetica-Bold")
    .fontSize(13)
    .text(formatOrderId(order.id), pageW - M - 200, 30, {
      width: 200,
      align: "right",
    });
  doc
    .fillColor(GOLD)
    .font("Helvetica")
    .fontSize(10)
    .text(
      order.created_at ? new Date(order.created_at).toLocaleString("en-IN") : "",
      pageW - M - 220,
      50,
      { width: 220, align: "right" }
    );

  let y = 128;

  // ---- Section helpers -----------------------------------------------------
  const sectionTitle = (text) => {
    doc.fillColor(BRAND).font("Helvetica-Bold").fontSize(12).text(text, M, y);
    y += 18;
    doc
      .moveTo(M, y)
      .lineTo(M + contentW, y)
      .lineWidth(1)
      .strokeColor(GOLD)
      .stroke();
    y += 12;
  };

  const row = (label, value) => {
    if (value === undefined || value === null || value === "") return;
    doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(10).text(label, M, y, {
      width: 150,
    });
    doc
      .fillColor(INK)
      .font("Helvetica")
      .fontSize(11)
      .text(String(value), M + 150, y - 1, { width: contentW - 150 });
    y += 20;
  };

  // ---- Business user -------------------------------------------------------
  sectionTitle("Business User");
  row("Name", order.user_name);
  row("Business", order.business_name);
  row("Email", order.email);
  row("Phone", order.user_phone);
  if (order.user_status) row("Status", String(order.user_status).toUpperCase());
  y += 8;

  // ---- Product -------------------------------------------------------------
  sectionTitle("Product");
  const productTop = y;

  // Optional image on the right.
  let imageDrawn = false;
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
        doc.image(imgPath, M + contentW - 130, productTop, {
          fit: [130, 130],
          align: "right",
        });
        imageDrawn = true;
      } catch (e) {
        /* skip unreadable image */
      }
    }
  }

  const savedRight = contentW;
  if (imageDrawn) {
    // Narrow the text column so it doesn't overlap the image.
    row("Name", order.product_name);
    row("SKU", order.product_sku);
    y = Math.max(y, productTop + 130 + 6);
  } else {
    row("Name", order.product_name);
    row("SKU", order.product_sku);
  }
  y += 8;

  // ---- Order details -------------------------------------------------------
  sectionTitle("Order Details");
  row("Order Status", order.status ? String(order.status).toUpperCase() : "");
  row("Quantity", order.quantity ?? order.total_qty);
  row("Courier Company", order.courier_company);
  row("Remark", order.remark);
  y += 6;

  // ---- Total highlight -----------------------------------------------------
  const amount = order.total_amount ?? order.total_mark_amount;
  if (amount !== undefined && amount !== null && amount !== "") {
    doc.rect(M, y, contentW, 38).fill(CREAM);
    doc.rect(M, y, 4, 38).fill(BRAND);
    doc
      .fillColor(BRAND)
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("TOTAL AMOUNT", M + 16, y + 12);
    doc
      .fillColor(BRAND)
      .font("Helvetica-Bold")
      .fontSize(15)
      .text(formatCurrency(amount), M, y + 10, {
        width: contentW - 16,
        align: "right",
      });
    y += 54;
  }

  // ---- Footer --------------------------------------------------------------
  const footerY = doc.page.height - 54;
  doc
    .moveTo(M, footerY)
    .lineTo(M + contentW, footerY)
    .lineWidth(1)
    .strokeColor(GOLD)
    .stroke();
  doc
    .fillColor(MUTED)
    .font("Helvetica")
    .fontSize(9)
    .text(
      "This is a system-generated order form from Amrutkumar Govinddas LLP.",
      M,
      footerY + 10,
      { width: contentW, align: "center" }
    );

  doc.end();
}

module.exports = { generateOrderPDF };
