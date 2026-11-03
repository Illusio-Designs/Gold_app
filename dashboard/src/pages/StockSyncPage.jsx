import React, { useState } from "react";
import { fetchErpStockPreview } from "../services/adminApiService";

// Read-only test page for the RG jewelry ERP stock feed (API_RG_GetAllStock).
// Calls the ERP through our backend (which can reach the whitelisted host) and
// shows what it returns as PRODUCT CARDS (like the app), with a raw-JSON toggle.
// Nothing is written to the database — this is to test the feed and preview the
// catalog before wiring the live product/category endpoints to it.

const DEFAULT_URL = "http://183.83.240.52:17800/Ws/API_RG_GetAllStock";
const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><rect width='100%' height='100%' fill='#f3eadf'/><text x='50%' y='50%' font-size='16' fill='#b79a86' text-anchor='middle' dominant-baseline='middle' font-family='sans-serif'>No image</text></svg>`
  );

// --- adaptive field detection (works regardless of the ERP's exact names) ---
const keysOf = (o) => (o && typeof o === "object" ? Object.keys(o) : []);
const findKey = (obj, patterns) => {
  const keys = keysOf(obj);
  for (const p of patterns) {
    const k = keys.find((key) => p.test(key));
    if (k != null) return k;
  }
  return null;
};
const isImageString = (v) =>
  typeof v === "string" &&
  (/^data:image\//i.test(v) ||
    /^https?:\/\//i.test(v) ||
    /\.(png|jpe?g|webp|gif|bmp)(\?|$)/i.test(v));

const pickImage = (item) => {
  const k = findKey(item, [/image.?url/i, /imageurl/i, /\bimage\b/i, /img/i, /photo/i, /picture/i, /thumb/i]);
  if (k && isImageString(item[k])) return item[k];
  // scan every value for something image-like
  for (const key of keysOf(item)) {
    if (isImageString(item[key])) return item[key];
  }
  return null;
};
const val = (item, key) => (key && item[key] != null && item[key] !== "" ? item[key] : null);

const card = {
  background: "#fff",
  border: "1px solid rgba(93,8,41,0.12)",
  borderRadius: 14,
  padding: 20,
  marginBottom: 20,
};
const label = { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#5D0829" };
const input = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  border: "1px solid rgba(93,8,41,0.25)",
  borderRadius: 10,
  fontSize: 14,
  marginBottom: 14,
  background: "#fff",
};
const btn = {
  background: "#5D0829",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "11px 20px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};
const pre = {
  background: "#1e1e1e",
  color: "#e6e6e6",
  padding: 16,
  borderRadius: 10,
  overflow: "auto",
  maxHeight: 440,
  fontSize: 12.5,
  lineHeight: 1.5,
};
const toggleBtn = (active) => ({
  background: active ? "#5D0829" : "transparent",
  color: active ? "#fff" : "#5D0829",
  border: "1px solid #5D0829",
  borderRadius: 8,
  padding: "6px 14px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
});

const ProductCard = ({ item }) => {
  const [imgOk, setImgOk] = useState(true);
  const img = pickImage(item);
  const name =
    val(item, findKey(item, [/item.?name/i, /product.?name/i, /^name$/i, /title/i, /design.?name/i, /desc/i, /name/i])) ||
    "Unnamed item";
  const sku = val(item, findKey(item, [/item.?code/i, /\bsku\b/i, /\bcode\b/i, /barcode/i, /rfid/i, /tag.?no/i]));
  const gross = val(item, findKey(item, [/gross.?w/i, /gr.?wt/i, /gwt/i]));
  const net = val(item, findKey(item, [/net.?w/i, /nt.?wt/i, /nwt/i]));
  const weight = gross || net ? null : val(item, findKey(item, [/weight/i, /\bwt\b/i]));
  const purity = val(item, findKey(item, [/purity/i, /karat|carat/i, /touch/i, /fine/i, /\bkt\b/i]));
  const pieces = val(item, findKey(item, [/pieces/i, /\bpcs\b/i, /\bqty\b/i, /quantity/i, /\bpc\b/i]));
  const price = val(item, findKey(item, [/\bprice\b/i, /amount/i, /\brate\b/i, /\bmrp\b/i, /value/i, /making/i]));

  const spec = (k, v) =>
    v != null ? (
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "2px 0" }}>
        <span style={{ color: "#8A7A80" }}>{k}</span>
        <span style={{ color: "#5D0829", fontWeight: 600 }}>{String(v)}</span>
      </div>
    ) : null;

  return (
    <div
      style={{
        border: "1px solid rgba(93,8,41,0.12)",
        borderRadius: 14,
        overflow: "hidden",
        background: "#fff",
        boxShadow: "0 1px 4px rgba(93,8,41,0.06)",
      }}
    >
      <div style={{ width: "100%", aspectRatio: "1 / 1", background: "#faf5ef" }}>
        <img
          src={imgOk && img ? img : PLACEHOLDER}
          alt={name}
          onError={() => setImgOk(false)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
      <div style={{ padding: 12 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#5D0829",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          title={name}
        >
          {name}
        </div>
        {sku ? <div style={{ fontSize: 11.5, color: "#A47C8C", marginBottom: 6 }}>{String(sku)}</div> : <div style={{ height: 6 }} />}
        {spec("Gross wt", gross)}
        {spec("Net wt", net)}
        {spec("Weight", weight)}
        {spec("Purity", purity)}
        {spec("Pieces", pieces)}
        {spec("Price", price)}
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
  const [view, setView] = useState("cards"); // 'cards' | 'json'

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
      setError(
        (e && e.response && e.response.data && e.response.data.error) ||
          (e && e.message) ||
          "Request failed."
      );
    } finally {
      setLoading(false);
    }
  };

  const items = result && Array.isArray(result.sample) ? result.sample : [];

  return (
    <div style={{ padding: "8px 4px 40px", maxWidth: 1100 }}>
      <h1 style={{ color: "#5D0829", fontSize: 24, marginBottom: 4 }}>ERP Stock — Catalog Preview</h1>
      <p style={{ color: "#8A7A80", fontSize: 14, marginBottom: 20 }}>
        Fetches the jewelry ERP stock feed (<code>API_RG_GetAllStock</code>) and
        shows the items as product cards. Read-only — nothing is saved. Paste
        your ERP API key to run it.
      </p>

      <div style={card}>
        <label style={label}>ERP API URL</label>
        <input style={input} value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} />

        <label style={label}>Company ID</label>
        <input style={input} value={companyId} onChange={(e) => setCompanyId(e.target.value)} />

        <label style={label}>API Key</label>
        <input
          style={input}
          type="password"
          placeholder="Paste your ERP API key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          autoComplete="off"
        />

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
                <div style={{ fontSize: 20, fontWeight: 700, color: "#5D0829" }}>
                  {result.itemCount != null ? result.itemCount : "—"}
                </div>
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

          {view === "cards" ? (
            items.length ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
                  gap: 16,
                }}
              >
                {items.map((it, i) => (
                  <ProductCard key={i} item={it} />
                ))}
              </div>
            ) : (
              <p style={{ color: "#8A7A80" }}>
                No item array detected in the response. Switch to Raw JSON to see
                what came back. Top-level shape: <code>{JSON.stringify(result.responseShape)}</code>
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
