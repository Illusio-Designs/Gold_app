const { fetchErpImage } = require("../services/stockSyncService");

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

module.exports = { proxyImage };
