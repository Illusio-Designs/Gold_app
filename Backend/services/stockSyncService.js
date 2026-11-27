// Server-side client for the RG jewellery ERP.

const http = require("http");
const https = require("https");
const { URL } = require("url");
const { getErpSettings } = require("./erpSettingsService");

// Minimal POST-JSON helper over Node's http/https. Resolves { status, data }.
function postJson(urlStr, headers, bodyObj, timeoutMs) {
  return new Promise((resolve, reject) => {
    let u;
    try {
      u = new URL(urlStr);
    } catch (e) {
      return reject(new Error("Invalid ERP URL"));
    }
    if (!["http:", "https:"].includes(u.protocol)) {
      return reject(new Error("Unsupported ERP URL protocol"));
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
    if (!["http:", "https:"].includes(u.protocol)) {
      return reject(new Error("Unsupported ERP URL protocol"));
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
async function resolveImageUrl(imgPath) {
  const { apiUrl, imageBaseUrl: imgBase } = await getErpSettings();
  let origin;
  if (imgBase) {
    origin = String(imgBase).replace(/\/+$/, "");
  } else {
    const base = new URL(apiUrl);
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
  return getBinary(await resolveImageUrl(imgPath), 30000);
}

// Fetch the full stock list from the ERP. Returns { status, data } where data is
// the parsed response. Throws on network/timeout errors.
async function fetchAllStock() {
  const { apiUrl: url, apiKey: key, companyId: company } = await getErpSettings(true);
  if (!url || !key) {
    throw new Error("Configure the ERP connection before importing stock");
  }

  // The vendor expects the key both as a header and in the body.
  const response = await postJson(
    url,
    { APIKey: key },
    { APIKey: key, CompanyID: company },
    60000
  );
  return { ...response, companyId: Number(company) };
}

module.exports = {
  fetchAllStock,
  fetchErpImage,
};
