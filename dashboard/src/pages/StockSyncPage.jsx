import React, { useState } from "react";
import { fetchErpStockPreview, erpImageUrl } from "../services/adminApiService";

// Read-only test page for the RG jewelry ERP stock feed (API_RG_GetAllStock).
// Calls the ERP through our backend (which can reach the whitelisted host) and
// shows the items as PRODUCT CARDS (like the app), with a raw-JSON toggle.
// Nothing is written to the database — this previews the catalog before the
// live product/category endpoints are wired to the ERP.

const DEFAULT_URL = "http://183.83.240.52:17800/Ws/API_RG_GetAllStock";
const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><rect width='100%' height='100%' fill='#f3eadf'/><text x='50%' y='50%' font-size='15' fill='#b79a86' text-anchor='middle' dominant-baseline='middle' font-family='sans-serif'>No image</text></svg>`
  );

// --- helpers ---
const val = (item, key) =>
  key && item && item[key] != null && item[key] !== "" ? item[key] : null;
const firstVal = (item, keys) => {
  for (const k of keys) {
    const v = val(item, k);
    if (v != null) return v;
  }
  return null;
};
const inr = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? "₹" + n.toLocaleString("en-IN") : null;
};
// Derive karat (e.g. "22K") from the item/group name, else fall back to Touch.
const getPurity = (it) => {
  const src = [val(it, "ItemName"), val(it, "GroupName"), val(it, "ItemShortName")]
    .filter(Boolean)
    .join(" ");
  const m = src.match(/(\d{1,2})\s*(?:CT|KT|K)\b/i);
  if (m) return m[1] + "K";
  const touch = val(it, "Touch");
  return touch != null ? "Touch " + touch : null;
};

// RG ERP field mapping (with sensible fallbacks).
const mapItem = (it) => ({
  name: firstVal(it, ["ItemName", "SubItemName", "DesignName"]) || "Unnamed item",
  tag: firstVal(it, ["TagNo", "Barcode", "SKUID"]),
  gross: firstVal(it, ["GrossWt"]),
  net: firstVal(it, ["NetWt"]),
  fine: firstVal(it, ["FineWt"]),
  pcs: firstVal(it, ["Pcs", "Label"]),
  purity: getPurity(it),
  group: firstVal(it, ["GroupName", "CounterName"]),
  priceRaw: firstVal(it, ["NetAmt", "TagSalesAmount", "TagSalesAmt", "MRP"]),
  inStock: val(it, "IsStock"),
  // The ERP fills in `imageurl` even when there's no actual photo, so only use
  // it when HasTagImage is true (otherwise it's a guaranteed 404).
  imagePath:
    val(it, "HasTagImage") === true
      ? firstVal(it, ["imageurl", "ImageUrl", "Image"])
      : null,
});

const card = { background: "#fff", border: "1px solid rgba(93,8,41,0.12)", borderRadius: 14, padding: 20, marginBottom: 20 };
const label = { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#5D0829" };
const input = { width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid rgba(93,8,41,0.25)", borderRadius: 10, fontSize: 14, marginBottom: 14, background: "#fff" };
const btn = { background: "#5D0829", color: "#fff", border: "none", borderRadius: 10, padding: "11px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" };
const pre = { background: "#1e1e1e", color: "#e6e6e6", padding: 16, borderRadius: 10, overflow: "auto", maxHeight: 440, fontSize: 12.5, lineHeight: 1.5 };
const toggleBtn = (active) => ({ background: active ? "#5D0829" : "transparent", color: active ? "#fff" : "#5D0829", border: "1px solid #5D0829", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" });

const ProductCard = ({ item }) => {
  const [imgOk, setImgOk] = useState(true);
  const m = mapItem(item);
  const img = imgOk && m.imagePath ? erpImageUrl(m.imagePath) : PLACEHOLDER;
  const price = m.priceRaw != null ? inr(m.priceRaw) : null;

  const spec = (k, v, suffix) =>
    v != null && v !== "" ? (
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "2px 0" }}>
        <span style={{ color: "#8A7A80" }}>{k}</span>
        <span style={{ color: "#5D0829", fontWeight: 600 }}>{String(v)}{suffix || ""}</span>
      </div>
    ) : null;

  return (
    <div style={{ border: "1px solid rgba(93,8,41,0.12)", borderRadius: 14, overflow: "hidden", background: "#fff", boxShadow: "0 1px 4px rgba(93,8,41,0.06)" }}>
      <div style={{ position: "relative", width: "100%", aspectRatio: "1 / 1", background: "#faf5ef" }}>
        <img src={img || PLACEHOLDER} alt={m.name} onError={() => setImgOk(false)} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        {m.inStock != null ? (
          <span style={{ position: "absolute", top: 8, left: 8, fontSize: 10.5, fontWeight: 700, color: "#fff", background: Number(m.inStock) ? "#16a34a" : "#9ca3af", borderRadius: 999, padding: "2px 8px" }}>
            {Number(m.inStock) ? "In stock" : "Out"}
          </span>
        ) : null}
      </div>
      <div style={{ padding: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#5D0829", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={m.name}>
          {m.name}
        </div>
        <div style={{ fontSize: 11.5, color: "#A47C8C", marginBottom: 6 }}>{m.tag ? String(m.tag) : " "}</div>
        {spec("Gross wt", m.gross, " g")}
        {spec("Net wt", m.net, " g")}
        {spec("Fine wt", m.fine, " g")}
        {spec("Purity", m.purity)}
        {spec("Pieces", m.pcs)}
        {price ? (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #f0e7da", display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#8A7A80", fontSize: 12.5 }}>Amount</span>
            <span style={{ color: "#5D0829", fontWeight: 800, fontSize: 15 }}>{price}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const StockSyncPage = () => {
  const [apiUrl, setApiUrl] = useState(DEFAULT_URL);
  const [companyId, setCompanyId] = useState("1");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [view, setView] = useState("cards");

  const runTest = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await fetchErpStockPreview({
        apiUrl: apiUrl.trim() || undefined,
        apiKey: apiKey.trim() || undefined,
        companyId: companyId.trim() || undefined,
      });
      setResult(data);
      if (!data.success) setError(data.error || "Request failed.");
    } catch (e) {
      setError((e && e.response && e.response.data && e.response.data.error) || (e && e.message) || "Request failed.");
    } finally {
      setLoading(false);
    }
  };

  const items = result && Array.isArray(result.sample) ? result.sample : [];

  return (
    <div style={{ padding: "8px 4px 40px", maxWidth: 1100 }}>
      <h1 style={{ color: "#5D0829", fontSize: 24, marginBottom: 4 }}>ERP Stock — Catalog Preview</h1>
      <p style={{ color: "#8A7A80", fontSize: 14, marginBottom: 20 }}>
        Fetches the jewelry ERP stock feed (<code>API_RG_GetAllStock</code>) and shows the items as product cards.
        Read-only — nothing is saved. Paste your ERP API key to run it.
      </p>

      <div style={card}>
        <label style={label}>ERP API URL</label>
        <input style={input} value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} />
        <label style={label}>Company ID</label>
        <input style={input} value={companyId} onChange={(e) => setCompanyId(e.target.value)} />
        <label style={label}>API Key</label>
        <input style={input} type="password" placeholder="Paste your ERP API key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} autoComplete="off" />
        <button style={{ ...btn, opacity: loading ? 0.6 : 1 }} onClick={runTest} disabled={loading}>
          {loading ? "Fetching…" : "Fetch Stock"}
        </button>
      </div>

      {error ? (
        <div style={{ ...card, borderColor: "#dc2626", background: "#fef2f2" }}>
          <strong style={{ color: "#dc2626" }}>⚠ {error}</strong>
        </div>
      ) : null}

      {result && result.success ? (
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 12, color: "#8A7A80" }}>Items returned</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#5D0829" }}>{result.itemCount != null ? result.itemCount : "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#8A7A80" }}>Showing</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{items.length} sample</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#8A7A80" }}>Fields / item</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{(result.fields || []).length || "—"}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={toggleBtn(view === "cards")} onClick={() => setView("cards")}>Cards</button>
              <button style={toggleBtn(view === "json")} onClick={() => setView("json")}>Raw JSON</button>
            </div>
          </div>

          {result.imageCheck || result.withTagImage != null ? (
            <div
              style={{
                background: result.imageCheck && result.imageCheck.ok ? "#f0fdf4" : "#fff7ed",
                border: "1px solid " + (result.imageCheck && result.imageCheck.ok ? "#bbf7d0" : "#fed7aa"),
                borderRadius: 10,
                padding: "10px 14px",
                marginBottom: 16,
                fontSize: 13,
                color: "#5D0829",
              }}
            >
              <strong>Image check: </strong>
              {result.withTagImage != null ? (
                <span>
                  {result.withTagImage} of {result.itemCount} items have a photo in the ERP (<code>HasTagImage</code>).{" "}
                </span>
              ) : null}
              {result.imageCheck ? (
                result.imageCheck.ok ? (
                  <span>
                    Proxy reached an image ✓ ({result.imageCheck.bytes} bytes,{" "}
                    {result.imageCheck.contentType}).
                  </span>
                ) : (
                  <span>
                    Proxy could NOT load the test image (status {String(result.imageCheck.status)}
                    {result.imageCheck.error ? `, ${result.imageCheck.error}` : ""}). URL tried:{" "}
                    <code style={{ wordBreak: "break-all" }}>{result.imageCheck.url}</code>
                  </span>
                )
              ) : (
                <span>No item had an image path to test.</span>
              )}
            </div>
          ) : null}

          {view === "cards" ? (
            items.length ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))", gap: 16 }}>
                {items.map((it, i) => (
                  <ProductCard key={i} item={it} />
                ))}
              </div>
            ) : (
              <p style={{ color: "#8A7A80" }}>
                No item array detected. Switch to Raw JSON to inspect. Shape: <code>{JSON.stringify(result.responseShape)}</code>
              </p>
            )
          ) : (
            <pre style={pre}>{JSON.stringify(result.sample || result.rawPreview || result, null, 2)}</pre>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default StockSyncPage;
