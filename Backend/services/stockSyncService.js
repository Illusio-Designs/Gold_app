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

// GET a binary resource (e.g. a product image) from the ERP. Resolves
// { status, buffer, contentType }. Throws on network/timeout errors.
function getBinary(urlStr, timeoutMs) {
  return new Promise((resolve, reject) => {
    let u;
    try {
      u = new URL(urlStr);
    } catch (e) {
      return reject(new Error("Invalid URL"));
    }
    const lib = u.protocol === "https:" ? https : http;
    const req = lib.request(
      {
        protocol: u.protocol,
        hostname: u.hostname,
        port: u.port || (u.protocol === "https:" ? 443 : 80),
        path: (u.pathname || "/") + (u.search || ""),
        method: "GET",
      },
      (res) => {
        if (res.statusCode >= 400) {
          res.resume();
          return reject(Object.assign(new Error("HTTP " + res.statusCode), { status: res.statusCode }));
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () =>
          resolve({
            status: res.statusCode,
            buffer: Buffer.concat(chunks),
            contentType: res.headers["content-type"] || "image/jpeg",
          })
        );
      }
    );
    req.setTimeout(timeoutMs || 30000, () => {
      req.destroy(Object.assign(new Error("timeout"), { code: "ETIMEDOUT" }));
    });
    req.on("error", reject);
    req.end();
  });
}

// Resolve a relative ERP image path to a full URL. Uses RG_IMAGE_BASE_URL when
// set (in case images are served from a different host/port than the API),
// otherwise the same host as the stock API.
function resolveImageUrl(imgPath) {
  const imgBase = config.ERP && config.ERP.IMAGE_BASE_URL;
  let origin;
  if (imgBase) {
    origin = String(imgBase).replace(/\/+$/, "");
  } else {
    const base = new URL((config.ERP && config.ERP.STOCK_API_URL) || DEFAULT_URL);
    origin = `${base.protocol}//${base.host}`;
  }
  // Product images live under /Images/SKUImage/<filename> on the ERP. The feed's
  // imageurl points at /Images/TagImage/, which 404s — so rebuild the path from
  // just the file name against the SKUImage folder.
  const fileName = String(imgPath || "").split("/").pop() || "";
  const clean = fileName ? `Images/SKUImage/${fileName}` : "";
  return `${origin}/${clean}`;
}

// Fetch a product image from the ERP by its relative path (e.g.
// "Images/TagImage/xxxx.Jpg").
async function fetchErpImage(imgPath) {
  return getBinary(resolveImageUrl(imgPath), 30000);
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

module.exports = {
  fetchAllStock,
  fetchErpImage,
  resolveImageUrl,
  DEFAULT_URL,
  DEFAULT_COMPANY_ID,
};
