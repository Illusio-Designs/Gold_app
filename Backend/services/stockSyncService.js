// RG jewelry ERP stock feed client.
//
// The app's catalog (products, categories, images) is NOT stored in our DB — it
// comes live from the ERP's API_RG_GetAllStock endpoint, which this service
// calls. Dependency-free (Node's built-in http/https) so it works regardless of
// which HTTP client packages are installed. Server-side ONLY: the API key must
// never reach the mobile app.

const http = require("http");
const https = require("https");
const { URL } = require("url");
const { config } = require("../config/environment");

// Non-secret defaults (host + company). The API key is read from env
// (RG_API_KEY) or passed in by an admin from the dashboard test form — never
// hardcoded here.
const DEFAULT_URL =
  (config.ERP && config.ERP.STOCK_API_URL) ||
  "http://183.83.240.52:17800/Ws/API_RG_GetAllStock";
const DEFAULT_COMPANY_ID =
  (config.ERP && config.ERP.COMPANY_ID != null ? config.ERP.COMPANY_ID : 1);

// Minimal POST-JSON helper over Node's http/https. Resolves { status, data }.
function postJson(urlStr, headers, bodyObj, timeoutMs) {
  return new Promise((resolve, reject) => {
    let u;
    try {
      u = new URL(urlStr);
    } catch (e) {
      return reject(new Error("Invalid ERP URL"));
    }
    const lib = u.protocol === "https:" ? https : http;
    const payload = Buffer.from(JSON.stringify(bodyObj));
    const req = lib.request(
      {
        protocol: u.protocol,
        hostname: u.hostname,
        port: u.port || (u.protocol === "https:" ? 443 : 80),
        path: (u.pathname || "/") + (u.search || ""),
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": payload.length,
          ...headers,
        },
      },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          let parsed = null;
          try {
            parsed = data ? JSON.parse(data) : null;
          } catch (e) {
            parsed = data; // non-JSON body — hand back the raw string
          }
          resolve({ status: res.statusCode, data: parsed });
        });
      }
    );
    req.setTimeout(timeoutMs || 60000, () => {
      req.destroy(Object.assign(new Error("timeout"), { code: "ETIMEDOUT" }));
    });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

// Fetch the full stock list from the ERP. Returns { status, data } where data is
// the parsed response. Throws on network/timeout errors.
async function fetchAllStock({ apiUrl, apiKey, companyId } = {}) {
  const url = apiUrl || DEFAULT_URL;
  const key = apiKey || (config.ERP && config.ERP.API_KEY) || "";
  const company = companyId != null && companyId !== "" ? companyId : DEFAULT_COMPANY_ID;

  if (!key) {
    throw Object.assign(new Error("ERP API key is not configured"), {
      code: "NO_API_KEY",
    });
  }

  // The vendor expects the key both as a header and in the body.
  return postJson(
    url,
    { APIKey: key },
    { APIKey: key, CompanyID: company },
    60000
  );
}

module.exports = { fetchAllStock, DEFAULT_URL, DEFAULT_COMPANY_ID };
