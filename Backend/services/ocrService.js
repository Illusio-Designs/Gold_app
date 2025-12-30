const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { createWorker } = require("tesseract.js");

/**
 * OCR service for extracting SKU/tag numbers from images.
 *
 * Notes:
 * - Runs OCR on the ORIGINAL upload (before watermark/webp) for best accuracy.
 * - Restricts recognition to uppercase A–Z and digits 0–9.
 */
class OcrService {
  constructor() {
    this._workerPromise = null;
  }

  async _getWorker() {
    if (!this._workerPromise) {
      this._workerPromise = (async () => {
        // tesseract.js createWorker signature (v2–v7):
        // createWorker(langs = 'eng', oem, options, config)
        // IMPORTANT: first arg must be a string/array of langs, not an options object.
        const cachePath =
          process.env.OCR_CACHE_PATH ||
          path.join(__dirname, "../uploads/ocr-cache");
        try {
          fs.mkdirSync(cachePath, { recursive: true });
          } catch (e) {
          }

        const worker = await createWorker(
          "eng",
          undefined,
          {
            // tesseract.js expects logger to be a function (it calls logger(...) on progress)
            logger:
              process.env.OCR_DEBUG === "true"
                ? (m) => : () => {},
            cachePath,
            langPath: process.env.OCR_LANG_PATH, // optional override
          },
          {}
        );

        await worker.setParameters({
          // Only allow uppercase letters + digits
          tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
          preserve_interword_spaces: "1",
          // Treat image as a single line (good for SKU/tag codes)
          tessedit_pageseg_mode: "7",
        });
        return worker;
      })();
    }
    return this._workerPromise;
  }

  /**
   * Preprocess an image for OCR to improve recognition.
   * @param {string} inputPath
   * @returns {Promise<Buffer>}
   */
  async preprocessForOcr(inputPath) {
    // OCR generally improves with larger, high-contrast text.
    return sharp(inputPath)
      .rotate() // auto-orient
      .grayscale()
      .normalize()
      .resize({ width: 1600, withoutEnlargement: false })
      .sharpen()
      .threshold(170)
      .toBuffer();
  }

  /**
   * Extract a likely tag/SKU from an image.
   * @param {string} inputPath
   * @param {object} options
   * @param {number} [options.minLen=4]
   * @param {number} [options.maxLen=30]
   * @returns {Promise<{ tag: string|null, rawText: string, candidates: string[] }>}
   */
  async extractTagNo(inputPath, options = {}) {
    const { minLen = 4, maxLen = 30 } = options;

    if (!inputPath || !fs.existsSync(inputPath)) {
      throw new Error(`OCR input file not found: ${inputPath}`);
    }

    const worker = await this._getWorker();
    const preprocessed = await this.preprocessForOcr(inputPath);

    const {
      data: { text },
    } = await worker.recognize(preprocessed);

    const rawText = (text || "").toUpperCase();
    
    : "${rawText.substring(0, 200)}"`);

    // Clean + extract uppercase-alphanumeric tokens
    const cleaned = rawText.replace(/[^A-Z0-9]+/g, " ").trim();
    const tokens = cleaned.length ? cleaned.split(/\s+/g) : [];

    : "none"}`);

    const candidates = Array.from(
      new Set(
        tokens
          .map((t) => t.trim())
          .filter(Boolean)
          .filter((t) => t.length >= minLen && t.length <= maxLen)
      )
    );

    : ${candidates.length > 0 ? candidates.join(", ") : "none"}`);

    // Prefer the longest candidate (often the full tag)
    const tag = candidates.length
      ? [...candidates].sort((a, b) => b.length - a.length)[0]
      : null;

    if (tag) {
      `);
    } else {
      }

    return { tag, rawText, candidates };
  }
}

module.exports = new OcrService();

