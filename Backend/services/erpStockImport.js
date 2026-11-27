const { db } = require("../config/db");
const { config } = require("../config/environment");
const { fetchAllStock } = require("./stockSyncService");

const LOCK_NAME = "amrut_erp_inventory_import";
const RESULT_KEYS = ["lstresult", "lstResult", "LstResult", "Data", "data", "Result", "result"];

function mapStockResponse({ status, data }) {
  const rows = Array.isArray(data)
    ? data
    : RESULT_KEYS.map((key) => data?.[key]).find(Array.isArray);

  if (status < 200 || status >= 300 || !rows?.length) {
    throw new Error("ERP did not return a non-empty stock list. Inventory was not changed.");
  }

  const byTag = new Map();
  for (const [index, row] of rows.entries()) {
    const sku = String(row?.TagNo || row?.Barcode || "").trim();
    const category = String(row?.GroupName || "").trim();
    const name = String(row?.ItemName || row?.SubItemName || "").trim();
    const stock = row?.IsStock;
    const tag = String(row?.TagID ?? row?.SKUID ?? sku).trim();
    const group = String(row?.ItemGroupID ?? category).trim();
    if (!sku || sku.length > 100 || !tag || tag.length > 100 ||
        !group || group.length > 255 || !category || !name ||
        ![true, false, 1, 0, "1", "0"].includes(stock)) {
      throw new Error(`ERP row ${index + 1} is missing a valid SKU, category, name or stock status.`);
    }

    const purity = [row.ItemName, row.GroupName, row.ItemShortName]
      .filter(Boolean).join(" ").match(/(\d{1,2})\s*(?:CT|KT|K)\b/i);
    const imageFile = String(row.imageurl || "").split("/").pop();
    const proxyBase = config.BASE_URLS.PRODUCTION.replace(/\/+$/, "");
    const image = row.HasTagImage === true && imageFile
      ? `${proxyBase}/api/products/erp/image?path=${encodeURIComponent(imageFile)}`
      : null;

    const available = stock === true || stock === 1 || stock === "1";
    const vendorDate = String(row.lastupdatedate || row.lastsyncdate || "");
    const timestamp = Number(vendorDate.match(/^\/Date\((\d+)/)?.[1]) ||
      Date.parse(vendorDate.replace(" ", "T") + "Z") || 0;
    const label = Number(row.Label) || 0;
    const previous = byTag.get(tag);
    // Prefer the latest record. At equal timestamps prefer a stock-out over
    // availability, then prefer the positive stock line over its reversal.
    if (previous && (previous.timestamp > timestamp ||
        (previous.timestamp === timestamp && Number(previous.available) < Number(available)) ||
        (previous.timestamp === timestamp && previous.available === available && previous.label >= label))) {
      continue;
    }

    byTag.set(tag, {
      tag,
      sku,
      category,
      group,
      name,
      image,
      netWeight: row.NetWt ?? null,
      grossWeight: row.GrossWt ?? null,
      size: row.Size1 || null,
      purity: purity ? `${purity[1]}K` : (row.Touch ?? null),
      pieces: row.Pcs ?? 1,
      markAmount: row.LabourAmt ?? 0,
      available,
      timestamp,
      label,
    });
  }

  const products = [...byTag.values()];
  const skus = new Set(products.map(({ sku }) => sku.toLowerCase()));
  if (skus.size !== products.length) {
    throw new Error("ERP returned the same SKU for different stock tags.");
  }
  return products;
}

async function syncStock() {
  const connection = await db.promise().getConnection();
  let locked = false;
  try {
    const [[lock]] = await connection.query("SELECT GET_LOCK(?, 0) AS acquired", [LOCK_NAME]);
    locked = lock.acquired === 1;
    if (!locked) throw new Error("Another ERP stock import is running.");

    const response = await fetchAllStock();
    const products = mapStockResponse(response);
    const companyId = response.companyId;
    await connection.query(`
      CREATE TABLE IF NOT EXISTS erp_imported_products (
        product_id INT PRIMARY KEY,
        company_id INT NOT NULL,
        erp_tag VARCHAR(100) NOT NULL,
        withdrawn_by_erp BOOLEAN NOT NULL DEFAULT FALSE,
        UNIQUE (company_id, erp_tag),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      ) ENGINE=InnoDB`);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS erp_imported_categories (
        company_id INT NOT NULL,
        erp_group VARCHAR(255) NOT NULL,
        category_id INT NOT NULL,
        PRIMARY KEY (company_id, erp_group),
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      ) ENGINE=InnoDB`);

    await connection.beginTransaction();
    try {
      const categoryIds = new Map();
      const seen = new Set();
      const stats = { received: products.length, inserted: 0, updated: 0, manualSkuConflicts: 0, removedFromFeed: 0 };

      for (const product of products) {
        const [[existing]] = await connection.query(`
          SELECT p.id, p.stock_status, ep.withdrawn_by_erp
          FROM erp_imported_products ep JOIN products p ON p.id = ep.product_id
          WHERE ep.company_id = ? AND ep.erp_tag = ? FOR UPDATE`, [companyId, product.tag]);
        const [[skuOwner]] = await connection.query(
          "SELECT id FROM products WHERE sku = ? FOR UPDATE", [product.sku]
        );
        if (skuOwner && skuOwner.id !== existing?.id) {
          stats.manualSkuConflicts++;
          if (existing) seen.add(existing.id);
          continue;
        }

        if (!categoryIds.has(product.group)) {
          const [[mapping]] = await connection.query(
            "SELECT category_id FROM erp_imported_categories WHERE company_id = ? AND erp_group = ?",
            [companyId, product.group]
          );
          if (mapping) {
            await connection.query("UPDATE categories SET name = ? WHERE id = ?",
              [product.category, mapping.category_id]);
            categoryIds.set(product.group, mapping.category_id);
          } else {
            const [created] = await connection.query(
              "INSERT INTO categories (name, status) VALUES (?, 'active')",
              [product.category]
            );
            await connection.query(`
              INSERT INTO erp_imported_categories (company_id, erp_group, category_id)
              VALUES (?, ?, ?)`, [companyId, product.group, created.insertId]);
            categoryIds.set(product.group, created.insertId);
          }
        }

        const values = [categoryIds.get(product.group), product.name, product.image,
          product.netWeight, product.grossWeight, product.size, product.purity,
          product.pieces, product.markAmount];

        if (existing) {
          // Only restore a piece this import previously withdrew. Local orders
          // and reservations can also mark pieces unavailable.
          const withdrawn = !product.available &&
            (existing.stock_status === "available" || existing.withdrawn_by_erp);
          let stock = existing.stock_status;
          if (withdrawn && stock === "available") stock = "out_of_stock";
          if (product.available && existing.withdrawn_by_erp && stock === "out_of_stock") {
            stock = "available";
          }
          await connection.query(`
            UPDATE products SET category_id = ?, name = ?, image = ?, net_weight = ?,
              gross_weight = ?, size = ?, purity = ?, pieces = ?, mark_amount = ?,
              sku = ?, stock_status = ?
            WHERE id = ?`, [...values, product.sku, stock, existing.id]);
          await connection.query(
            "UPDATE erp_imported_products SET withdrawn_by_erp = ? WHERE product_id = ?",
            [Boolean(withdrawn), existing.id]
          );
          seen.add(existing.id);
          stats.updated++;
        } else {
          const [created] = await connection.query(`
            INSERT INTO products (category_id, name, image, net_weight, gross_weight,
              size, purity, pieces, mark_amount, sku, status, stock_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
          [...values, product.sku, product.available ? "available" : "out_of_stock"]);
          await connection.query(`
            INSERT INTO erp_imported_products (product_id, company_id, erp_tag, withdrawn_by_erp)
            VALUES (?, ?, ?, ?)`, [created.insertId, companyId, product.tag, !product.available]);
          seen.add(created.insertId);
          stats.inserted++;
        }
      }

      const [availableImports] = await connection.query(`
        SELECT p.id FROM products p
        INNER JOIN erp_imported_products ep ON ep.product_id = p.id
        WHERE ep.company_id = ? AND p.stock_status = 'available' FOR UPDATE`, [companyId]);
      for (const { id } of availableImports) {
        if (seen.has(id)) continue;
        await connection.query(`
          UPDATE products p JOIN erp_imported_products ep ON ep.product_id = p.id
          SET p.stock_status = 'out_of_stock', ep.withdrawn_by_erp = TRUE WHERE p.id = ?`, [id]);
        stats.removedFromFeed++;
      }

      await connection.commit();
      return stats;
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } finally {
    try {
      if (locked) await connection.query("SELECT RELEASE_LOCK(?)", [LOCK_NAME]);
    } finally {
      connection.release();
    }
  }
}

module.exports = { syncStock };
