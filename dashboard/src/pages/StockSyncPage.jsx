import React, { useState } from "react";
import { fetchErpStockPreview } from "../services/adminApiService";

// Read-only test page for the RG jewelry ERP stock feed (API_RG_GetAllStock).
// It calls the ERP through our backend (which can reach the whitelisted host)
// and shows exactly what the API returns — item count, the field names, and a
// sample of the rows. Nothing is written to the database here; this is purely
// to test the connection and inspect the response before wiring the live
// product/category catalog to it.

const DEFAULT_URL = "http://183.83.240.52:17800/Ws/API_RG_GetAllStock";

const card = {
  background: "var(--surface, #fff)",
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
const chip = {
  display: "inline-block",
  background: "rgba(93,8,41,0.08)",
  color: "#5D0829",
  borderRadius: 999,
  padding: "3px 10px",
  margin: "0 6px 6px 0",
  fontSize: 12,
  fontFamily: "monospace",
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

const StockSyncPage = () => {
  const [apiUrl, setApiUrl] = useState(DEFAULT_URL);
  const [companyId, setCompanyId] = useState("1");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

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

  return (
    <div style={{ padding: "8px 4px 40px", maxWidth: 1000 }}>
      <h1 style={{ color: "#5D0829", fontSize: 24, marginBottom: 4 }}>
        ERP Stock — API Response
      </h1>
      <p style={{ color: "#8A7A80", fontSize: 14, marginBottom: 20 }}>
        Test the jewelry ERP stock feed (<code>API_RG_GetAllStock</code>) and see
        exactly what it returns. Read-only — nothing is saved. Paste your ERP API
        key to run it.
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
          {loading ? "Fetching…" : "Fetch Stock (Test)"}
        </button>
      </div>

      {error ? (
        <div style={{ ...card, borderColor: "#dc2626", background: "#fef2f2" }}>
          <strong style={{ color: "#dc2626" }}>⚠ {error}</strong>
        </div>
      ) : null}

      {result && result.success ? (
        <div style={card}>
          <h2 style={{ color: "#5D0829", fontSize: 18, marginTop: 0 }}>Response</h2>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 12, color: "#8A7A80" }}>Reachable</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#16a34a" }}>Yes</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#8A7A80" }}>HTTP status</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{String(result.httpStatus)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#8A7A80" }}>Items returned</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#5D0829" }}>
                {result.itemCount != null ? result.itemCount : "—"}
              </div>
            </div>
          </div>

          {result.fields && result.fields.length ? (
            <>
              <div style={{ ...label, marginTop: 8 }}>
                Fields per item ({result.fields.length})
              </div>
              <div style={{ marginBottom: 14 }}>
                {result.fields.map((f) => (
                  <span key={f} style={chip}>
                    {f}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p style={{ color: "#8A7A80", fontSize: 13 }}>
              No item array was detected in the response — the raw body is shown
              below so we can find the right structure. Top-level shape:{" "}
              <code>{JSON.stringify(result.responseShape)}</code>
            </p>
          )}

          <div style={label}>
            {result.sample ? "Sample rows (first 10)" : "Raw response"}
          </div>
          <pre style={pre}>
            {JSON.stringify(result.sample || result.rawPreview || result, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
};

export default StockSyncPage;
