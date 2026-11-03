// Live product catalog sourced from the RG jewelry ERP (API_RG_GetAllStock).
//
// The app's products & categories come from here, NOT from our DB. The ERP feed
// is fetched and cached in memory (10 min TTL) so the app gets fast, repeated
// reads without hammering the ERP, and still works briefly if the ERP is down
// (serves the last cache). Images are returned as absolute URLs that point at
// our image proxy (/api/products/erp/image), so the app loads them directly.

const { fetchAllStock } = require("../services/stockSyncService");
const { config } = require("../config/environment");

const TTL_MS = 10 * 60 * 1000; // 10 minutes
let cache = { at: 0, items: [], byId: new Map(), categories: [] };
let inflight = null;

function imageBase() {
  return (
    (config.BASE_URLS && config.BASE_URLS.PRODUCTION) ||
    "https://api.amrutkumargovinddasllp.com"
  );
}

// Derive karat (e.g. "22K") from the item/group name, else fall back to Touch.
function karatOf(it) {
  const src = [it.ItemName, it.GroupName, it.ItemShortName]
    .filter(Boolean)
    .join(" ");
  const m = src.match(/(\d{1,2})\s*(?:CT|KT|K)\b/i);
  if (m) return m[1] + "K";
  return it.Touch != null ? String(it.Touch) : null;
}

// Map one RG ERP stock item to the product shape the app expects (same field
// names as the old DB products, so the screens need no changes).
function mapItem(it, base) {
  const image =
    it.HasTagImage === true && it.imageurl
      ? `${base}/api/products/erp/image?path=${encodeURIComponent(it.imageurl)}`
      : null;
  const id = it.TagID != null ? it.TagID : it.SKUID != null ? it.SKUID : it.Barcode;
  return {
    id,
    name: it.ItemName || it.SubItemName || "Item",
    sku: it.TagNo || it.Barcode || null,
    barcode: it.Barcode || null,
    image,
    net_weight: it.NetWt != null ? it.NetWt : null,
    gross_weight: it.GrossWt != null ? it.GrossWt : null,
    fine_weight: it.FineWt != null ? it.FineWt : null,
    purity: karatOf(it),
    pieces: it.Pcs != null ? it.Pcs : null,
    size: it.Size1 || null,
    price: it.NetAmt != null ? it.NetAmt : it.TagSalesAmount != null ? it.TagSalesAmount : null,
    mark_amount: it.LabourAmt != null ? it.LabourAmt : null,
    category: it.GroupName || null,
    category_id: it.ItemGroupID != null ? it.ItemGroupID : null,
    group_name: it.GroupName || null,
    status: "approved",
    stock_status: Number(it.IsStock) ? "in_stock" : "out_of_stock",
    in_stock: !!Number(it.IsStock),
  };
}

function extractItems(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  for (const k of ["lstresult", "lstResult", "Data", "data", "Result", "result"]) {
    if (Array.isArray(data[k])) return data[k];
  }
  return [];
}

async function loadCatalog() {
  const now = Date.now();
  if (cache.items.length && now - cache.at < TTL_MS) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const { data } = await fetchAllStock({});
      const raw = extractItems(data);
      const base = imageBase();
      const items = raw.map((it) => mapItem(it, base));
      const byId = new Map();
      items.forEach((p) => byId.set(String(p.id), p));
      const catMap = new Map();
      raw.forEach((it) => {
        const name = it.GroupName;
        if (name && !catMap.has(name)) {
          catMap.set(name, {
            id: it.ItemGroupID != null ? it.ItemGroupID : name,
            name,
          });
        }
      });
      cache = {
        at: Date.now(),
        items,
        byId,
        categories: Array.from(catMap.values()),
      };
      return cache;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

// GET /api/products/erp/catalog?category=&in_stock=
async function getCatalog(req, res) {
  try {
    const c = await loadCatalog();
    let items = c.items;
    const { category, in_stock } = req.query;
    if (category) {
      items = items.filter(
        (p) =>
          String(p.category_id) === String(category) ||
          String(p.category) === String(category)
      );
    }
    if (String(in_stock) === "true") items = items.filter((p) => p.in_stock);
    return res.json({ success: true, data: items, count: items.length });
  } catch (e) {
    return res.status(502).json({ success: false, error: "Catalog unavailable", data: [] });
  }
}

// GET /api/products/erp/catalog/:id
async function getCatalogItem(req, res) {
  try {
    const c = await loadCatalog();
    const item = c.byId.get(String(req.params.id));
    if (!item) return res.status(404).json({ success: false, error: "Not found" });
    return res.json({ success: true, data: item });
  } catch (e) {
    return res.status(502).json({ success: false, error: "Catalog unavailable" });
  }
}

// GET /api/products/erp/categories
async function getCatalogCategories(req, res) {
  try {
    const c = await loadCatalog();
    return res.json({ success: true, data: c.categories });
  } catch (e) {
    return res.status(502).json({ success: false, error: "Catalog unavailable", data: [] });
  }
}

module.exports = { getCatalog, getCatalogItem, getCatalogCategories };
