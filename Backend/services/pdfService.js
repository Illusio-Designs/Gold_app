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

  y += rowH;
  y += 20;

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

/**
 * Branded PDF for a CUSTOM (bespoke) order. `order` is the joined row from
 * customOrderModel.getByIdWithUser. Same house style as the invoice, but laid
 * out for the bespoke fields (weight/purity/qty/delivery/remark).
 */
function generateCustomOrderPDF(order, stream) {
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
  const number = order.order_number || `CUS-${String(order.id ?? "").padStart(6, "0")}`;

  // ---- Header band ---------------------------------------------------------
  doc.rect(0, 0, pageW, 96).fill(BRAND);
  doc.rect(0, 96, pageW, 4).fill(GOLD);
  doc.fillColor(CREAM).font("Helvetica-Bold").fontSize(24).text("AMRUT JEWELS", M, 28);
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
    .text("CUSTOM ORDER", pageW - M - 260, 30, { width: 260, align: "right" });
  doc
    .fillColor(GOLD)
    .font("Helvetica")
    .fontSize(11)
    .text(number, pageW - M - 260, 60, { width: 260, align: "right" });

  // ---- Customer + meta -----------------------------------------------------
  let y = 130;
  const label = (t, x, yy) =>
    doc.fillColor(MUTED).font("Helvetica").fontSize(9).text(t, x, yy);
  const value = (t, x, yy, w) =>
    doc
      .fillColor(INK)
      .font("Helvetica-Bold")
      .fontSize(12)
      .text(String(t ?? "-"), x, yy, { width: w || contentW / 2 - 10 });

  label("CUSTOMER", M, y);
  label("STATUS", M + contentW / 2, y);
  value(order.business_name || order.user_name || "-", M, y + 12);
  value(String(order.status || "pending").toUpperCase(), M + contentW / 2, y + 12);

  y += 48;
  label("PHONE", M, y);
  label("DELIVERY DATE", M + contentW / 2, y);
  value(order.user_phone || "-", M, y + 12);
  value(
    order.delivery_date ? new Date(order.delivery_date).toLocaleDateString("en-IN") : "-",
    M + contentW / 2,
    y + 12
  );

  // ---- Spec table ----------------------------------------------------------
  y += 60;
  doc.rect(M, y, contentW, 30).fill(BRAND);
  doc
    .fillColor(CREAM)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text("SPECIFICATION", M + 14, y + 9)
    .text("VALUE", M + contentW - 200, y + 9, { width: 186, align: "right" });

  const rows = [
    ["Weight", order.weight || "-"],
    ["Purity", order.purity || "-"],
    ["Quantity", order.quantity || 1],
    ["Remark", order.remark || "-"],
  ];
  y += 30;
  rows.forEach((r, i) => {
    const rowY = y + i * 30;
    if (i % 2 === 0) doc.rect(M, rowY, contentW, 30).fill("#faf5ee");
    doc.fillColor(INK).font("Helvetica").fontSize(11).text(r[0], M + 14, rowY + 9);
    doc
      .fillColor(INK)
      .font("Helvetica-Bold")
      .fontSize(11)
      .text(String(r[1]), M + contentW - 260, rowY + 9, { width: 246, align: "right" });
    doc.moveTo(M, rowY + 30).lineTo(M + contentW, rowY + 30).strokeColor(LINE).stroke();
  });

  // ---- Footer --------------------------------------------------------------
  const footerY = y + rows.length * 30 + 40;
  doc.rect(0, footerY, pageW, 2).fill(GOLD);
  doc
    .fillColor(MUTED)
    .font("Helvetica")
    .fontSize(9)
    .text(
      "This is a bespoke order request. Final pricing is confirmed on approval.  •  Amrutkumar Govinddas LLP",
      M,
      footerY + 10,
      { width: contentW, align: "center" }
    );

  doc.end();
}

module.exports = { generateOrderPDF, generateCustomOrderPDF };
