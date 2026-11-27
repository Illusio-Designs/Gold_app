const { createCipheriv, createDecipheriv, randomBytes, scryptSync } = require("node:crypto");
const { db } = require("../config/db");
const { config } = require("../config/environment");

function encryptionKey() {
  const secret = process.env.RG_SETTINGS_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error("ERP settings encryption secret is not configured.");
  return scryptSync(secret, "amrut-erp-settings-v1", 32);
}

function encrypt(value) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]);
}

function decrypt(value) {
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), value.subarray(0, 12));
  decipher.setAuthTag(value.subarray(12, 28));
  return Buffer.concat([decipher.update(value.subarray(28)), decipher.final()]).toString("utf8");
}

async function readSettings() {
  try {
    const [[row]] = await db.promise().query(
      "SELECT api_url, api_key_encrypted, company_id, image_base_url FROM erp_connection_settings WHERE id = 1"
    );
    return row;
  } catch (error) {
    if (error.code !== "ER_NO_SUCH_TABLE") throw error;
  }
}

async function getErpSettings(includeKey = false) {
  const row = await readSettings();
  return {
    apiUrl: row?.api_url ?? config.ERP.STOCK_API_URL,
    companyId: row?.company_id ?? config.ERP.COMPANY_ID,
    imageBaseUrl: row?.image_base_url ?? config.ERP.IMAGE_BASE_URL,
    hasApiKey: Boolean(row?.api_key_encrypted || config.ERP.API_KEY),
    ...(includeKey && {
      apiKey: row?.api_key_encrypted ? decrypt(row.api_key_encrypted) : config.ERP.API_KEY,
    }),
  };
}

function settingsError(message) {
  return Object.assign(new Error(message), { status: 400 });
}

function validateUrl(value, defaultUrl, label) {
  try {
    const url = new URL(value);
    const configuredOrigins = [defaultUrl, ...(process.env.RG_ALLOWED_ORIGINS || "").split(",")]
      .filter((entry) => entry.trim())
      .map((entry) => new URL(entry.trim()).origin);
    if (["http:", "https:"].includes(url.protocol) && !url.username && !url.password &&
        !url.search && !url.hash && url.href.length <= 2048 &&
        configuredOrigins.includes(url.origin)) return url.href;
  } catch {
    // Report the field without echoing the submitted URL.
  }
  throw settingsError(`${label} must use an ERP origin configured on the server.`);
}

async function saveErpSettings({ apiUrl, apiKey = "", companyId, imageBaseUrl = "" }) {
  const url = validateUrl(apiUrl, config.ERP.STOCK_API_URL, "ERP API URL");
  const imageUrl = imageBaseUrl
    ? validateUrl(imageBaseUrl, config.ERP.IMAGE_BASE_URL || config.ERP.STOCK_API_URL, "Image URL")
    : "";
  if (!/^\d{1,10}$/.test(String(companyId)) || Number(companyId) < 1 || Number(companyId) > 2147483647) {
    throw settingsError("Enter a valid company ID.");
  }
  if (typeof apiKey !== "string" || apiKey.length > 1024) throw settingsError("Enter a valid API key.");
  if (!apiKey.trim() && !(await getErpSettings()).hasApiKey) throw settingsError("Enter an ERP API key.");

  const pool = db.promise();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS erp_connection_settings (
      id TINYINT PRIMARY KEY,
      api_url VARCHAR(2048) NOT NULL,
      api_key_encrypted BLOB,
      company_id INT NOT NULL,
      image_base_url VARCHAR(2048) NOT NULL
    ) ENGINE=InnoDB`);

  await pool.query(`
    INSERT INTO erp_connection_settings (id, api_url, api_key_encrypted, company_id, image_base_url)
    VALUES (1, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE api_url = VALUES(api_url), company_id = VALUES(company_id),
      image_base_url = VALUES(image_base_url),
      api_key_encrypted = COALESCE(VALUES(api_key_encrypted), api_key_encrypted)`,
    [url, apiKey.trim() ? encrypt(apiKey.trim()) : null, Number(companyId), imageUrl]
  );
  return getErpSettings();
}

module.exports = { getErpSettings, saveErpSettings };
