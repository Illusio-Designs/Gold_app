const {
  fetchAllStock,
  fetchErpImage,
  resolveImageUrl,
} = require("../services/stockSyncService");

const imgPathOf = (it) =>
  it && (it.imageurl || it.ImageUrl || it.Image || it.ImagePath) ? (it.imageurl || it.ImageUrl || it.Image || it.ImagePath) : null;

// The ERP may wrap the list in an envelope — pull the array out wherever it is.
function extractItems(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return null;
  const keys = ["lstresult", "lstResult", "LstResult", "Data", "data", "Result", "result", "ResultList", "Stock", "stock", "items", "Items", "StockList", "Table"];
  for (const k of keys) {
    if (Array.isArray(data[k])) return data[k];
  }
  // Some ERPs return { d: "...json string..." } or { d: [...] }
  if (data.d) {
    if (Array.isArray(data.d)) return data.d;
    if (typeof data.d === "string") {
      try {
        const parsed = JSON.parse(data.d);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
  }
  return null;
}

// Admin-only. Calls the ERP GetAllStock and returns a PREVIEW of the response
// (reachability, item count, the field names, and a few sample rows) plus the
// top-level shape. Does NOT write anything to the database — it's a read-only
// tool so the dashboard can show exactly what the API returns.
async function previewStock(req, res) {
  const { apiUrl, apiKey, companyId } = req.body || {};
  try {
    const { status, data } = await fetchAllStock({ apiUrl, apiKey, companyId });

    const items = extractItems(data);
    const sample = Array.isArray(items) ? items.slice(0, 10) : null;
    const fields =
      sample && sample.length && sample[0] && typeof sample[0] === "object"
        ? Object.keys(sample[0])
        : [];

    const responseShape = Array.isArray(data)
      ? "array"
      : data && typeof data === "object"
      ? Object.keys(data)
      : typeof data;

    // --- image diagnostics -------------------------------------------------
    // How many items actually have a photo in the ERP, and does the image proxy
    // reach one? This tells us whether "No image" is missing ERP photos vs a
    // wrong image host/path.
    let withTagImage = null;
    let anyImagePath = null;
    if (Array.isArray(items)) {
      withTagImage = items.filter((i) => i && i.HasTagImage === true).length;
      const firstWithPath = items.find((i) => imgPathOf(i));
      anyImagePath = firstWithPath ? imgPathOf(firstWithPath) : null;
    }

    let imageCheck = null;
    if (anyImagePath) {
      const url = resolveImageUrl(anyImagePath);
      try {
        const img = await fetchErpImage(anyImagePath);
        imageCheck = {
          ok: true,
          status: img.status,
          bytes: img.buffer ? img.buffer.length : 0,
          contentType: img.contentType,
          url,
          path: anyImagePath,
        };
      } catch (e) {
        imageCheck = {
          ok: false,
          status: e.status || null,
          error: e.message,
          url,
          path: anyImagePath,
        };
      }
    }

    return res.json({
      success: true,
      reachable: true,
      httpStatus: status,
      itemCount: Array.isArray(items) ? items.length : null,
      fields,
      sample,
      responseShape,
      withTagImage,
      imageCheck,
      // When we couldn't find an array, hand back the raw body so the page can
      // still show what came back (helps us spot the right envelope key).
      rawPreview: Array.isArray(items) ? undefined : data,
    });
  } catch (err) {
    const httpStatus = err.response ? err.response.status : null;
    const timedOut =
      err.code === "ETIMEDOUT" ||
      err.code === "ECONNABORTED" ||
      /timeout/i.test(err.message || "");
    const unreachable =
      timedOut ||
      err.code === "ECONNREFUSED" ||
      err.code === "EHOSTUNREACH" ||
      err.code === "ENOTFOUND";

    let error;
    if (err.code === "NO_API_KEY") {
      error = "No API key provided. Paste your ERP API key to test.";
    } else if (timedOut) {
      error =
        "Timed out reaching the ERP. Make sure the server running this backend can reach the ERP host (same network / whitelisted IP).";
    } else if (unreachable) {
      error = `Could not reach the ERP (${err.code}). Check the host/port and network access.`;
    } else {
      error = `ERP request failed: ${err.message}`;
    }

    // 200 with success:false so the dashboard renders the error cleanly.
    return res.json({
      success: false,
      reachable: !unreachable,
      httpStatus,
      error,
    });
  }
}

// Public image proxy: fetches a product image from the ERP (relative path) and
// streams it back, so the browser/app can display ERP images without reaching
// the whitelisted ERP host directly. Only relative paths are allowed (no SSRF).
async function proxyImage(req, res) {
  const p = req.query.path;
  if (!p || typeof p !== "string") {
    return res.status(400).send("missing path");
  }
  // Safety: only relative ERP paths — reject absolute URLs and traversal.
  if (/^[a-z]+:\/\//i.test(p) || p.includes("..")) {
    return res.status(400).send("bad path");
  }
  try {
    const { buffer, contentType } = await fetchErpImage(p);
    res.set("Content-Type", contentType);
    res.set("Cache-Control", "public, max-age=3600");
    return res.send(buffer);
  } catch (e) {
    // Image missing/unreachable — 404 so the <img> falls back to a placeholder.
    return res.status(404).end();
  }
}

module.exports = { previewStock, proxyImage };
