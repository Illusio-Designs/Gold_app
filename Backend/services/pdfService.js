const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const BRAND = "#5d0829";
const GOLD = "#c09e83";
const CREAM = "#fce2bf";
const INK = "#2b2b2b";
const MUTED = "#7a6a5d";
const LINE = "#e6d8c8";

const formatOrderId = (id) => `ORD-${String(id ?? "").padStart(6, "0")}`;

const formatCurrency = (amount) => {
  const n = Number(amount);
  if (!isFinite(n)) return String(amount ?? "-");
  return "Rs. " + n.toLocaleString("en-IN");
};

/**
 * Stream a branded invoice-style order PDF to a writable stream.
 * `order` is the flat, joined row from orderModel.getOrderById.
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
  const M = 48;
  const contentW = pageW - M * 2;

  // ---- Header band ---------------------------------------------------------
  doc.rect(0, 0, pageW, 96).fill(BRAND);
  doc.rect(0, 96, pageW, 4).fill(GOLD);
  doc
    .fillColor(CREAM)
    .font("Helvetica-Bold")
    .fontSize(24)
    .text("AMRUT JEWELS", M, 28);
  doc
    .fillColor(GOLD)
    .font("Helvetica")
    .fontSize(10)
    .text("Amrutkumar Govinddas LLP", M, 60)
    .text("Soni Bazar, Main Road, Rajkot - 360001", M, 73);

  doc
    .fillColor(CREAM)
    .font("Helvetica-Bold")
    .fontSize(20)
    .text("INVOICE", pageW - M - 220, 30, { width: 220, align: "right" });
  doc
    .fillColor(GOLD)
    .font("Helvetica")
    .fontSize(10)
    .text(formatOrderId(order.id), pageW - M - 220, 58, {
      width: 220,
      align: "right",
    })
    .text(
      order.created_at
        ? new Date(order.created_at).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "",
      pageW - M - 220,
      72,
      { width: 220, align: "right" }
    );

  // ---- Bill to / Status ----------------------------------------------------
  let y = 128;
  doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(9).text("BILL TO", M, y);
  doc
    .fillColor(MUTED)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text("ORDER STATUS", pageW - M - 200, y, { width: 200, align: "right" });
  y += 15;

  doc
    .fillColor(BRAND)
    .font("Helvetica-Bold")
    .fontSize(12)
    .text(order.business_name || order.user_name || "N/A", M, y, { width: 300 });
  doc
    .fillColor(BRAND)
    .font("Helvetica-Bold")
    .fontSize(12)
    .text(String(order.status || "-").toUpperCase(), pageW - M - 200, y, {
      width: 200,
      align: "right",
    });
  y += 16;

  const billLine = (t) => {
    if (!t) return;
    doc.fillColor(INK).font("Helvetica").fontSize(10).text(t, M, y, { width: 320 });
    y += 14;
  };
  billLine(order.user_name && order.business_name ? order.user_name : null);
  billLine(order.user_phone);
  billLine(order.email);
  const addrLine = [order.address_line1, order.address_line2, order.landmark]
    .filter(Boolean)
    .join(", ");
  const cityLine = [order.city, order.state, order.country]
    .filter(Boolean)
    .join(", ");
  billLine(addrLine);
  billLine(cityLine);

  // ---- Items table ---------------------------------------------------------
  y += 18;
  const cImg = M;
  const cName = M + 58; // text after a 46px thumb
  const cSku = M + 260;
  const cQty = M + 380;
  // Right-aligned QTY column, kept 12px clear of the table's right edge so it
  // never clips against the border.
  const qtyW = contentW - (cQty - M) - 12;

  // Header row
  doc.rect(M, y, contentW, 26).fill(BRAND);
  doc.fillColor(CREAM).font("Helvetica-Bold").fontSize(10);
  doc.text("PRODUCT", cName, y + 8, { width: cSku - cName - 8 });
  doc.text("SKU", cSku, y + 8, { width: cQty - cSku - 8 });
  doc.text("QTY", cQty, y + 8, { width: qtyW, align: "right" });
  y += 26;

  // Item row (single product per order in this schema)
  const rowTop = y;
  const rowH = 58;
  doc.rect(M, y, contentW, rowH).fill("#fbf6ee");
  doc.rect(M, y, contentW, rowH).strokeColor(LINE).lineWidth(1).stroke();

  // Product thumbnail
  let thumbOk = false;
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
        doc.image(imgPath, cImg + 4, rowTop + 6, { fit: [46, 46] });
        thumbOk = true;
      } catch (e) {
        /* skip */
      }
    }
  }
  if (!thumbOk) {
    doc.rect(cImg + 4, rowTop + 6, 46, 46).fill(CREAM);
    doc
      .fillColor(GOLD)
      .font("Helvetica-Bold")
      .fontSize(8)
      .text("IMG", cImg + 4, rowTop + 26, { width: 46, align: "center" });
  }

  doc
    .fillColor(BRAND)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(order.product_name || "N/A", cName, rowTop + 12, {
      width: cSku - cName - 8,
    });
  if (order.net_weight) {
    doc
      .fillColor(MUTED)
      .font("Helvetica")
      .fontSize(8)
      .text(`Weight: ${order.net_weight} g`, cName, rowTop + 30, {
        width: cSku - cName - 8,
      });
  }
  doc
    .fillColor(INK)
    .font("Helvetica")
    .fontSize(10)
    .text(order.product_sku || "-", cSku, rowTop + 22, {
      width: cQty - cSku - 8,
    });
  doc.text(String(order.quantity ?? order.total_qty ?? 1), cQty, rowTop + 22, {
    width: qtyW,
    align: "right",
  });

  const amount = order.total_amount ?? order.total_mark_amount;
  y += rowH;

  // ---- Totals --------------------------------------------------------------
  y += 14;
  const totalsX = M + contentW - 220;
  doc.rect(totalsX, y, 220, 40).fill(CREAM);
  doc.rect(totalsX, y, 4, 40).fill(BRAND);
  doc
    .fillColor(BRAND)
    .font("Helvetica-Bold")
    .fontSize(12)
    .text("TOTAL", totalsX + 16, y + 13);
  doc
    .fillColor(BRAND)
    .font("Helvetica-Bold")
    .fontSize(14)
    .text(formatCurrency(amount), totalsX, y + 12, {
      width: 204,
      align: "right",
    });
  y += 56;

  // Optional courier / remark notes
  if (order.courier_company || order.remark) {
    doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(9).text("NOTES", M, y);
    y += 14;
    if (order.courier_company) {
      doc
        .fillColor(INK)
        .font("Helvetica")
        .fontSize(10)
        .text(`Courier: ${order.courier_company}`, M, y);
      y += 14;
    }
    if (order.remark) {
      doc
        .fillColor(INK)
        .font("Helvetica")
        .fontSize(10)
        .text(`Remark: ${order.remark}`, M, y, { width: contentW });
    }
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
      "Thank you for your business.  •  Amrutkumar Govinddas LLP",
      M,
      footerY + 10,
      { width: contentW, align: "center" }
    );

  doc.end();
}

module.exports = { generateOrderPDF };
