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
                ? (m) => {} : () => {},
            cachePath,
            langPath: process.env.OCR_LANG_PATH, // optional override
          },
          {}
        );

        await worker.setParameters({
          // Only allow uppercase letters + digits
          tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
          preserve_interword_spaces: "1",
          // Use automatic page segmentation (better for multi-line tags)
          tessedit_pageseg_mode: "6", // Uniform block of text
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
    // Try multiple preprocessing strategies for better OCR accuracy
    // Strategy 1: High contrast grayscale with threshold (best for black text on white)
    try {
      return await sharp(inputPath)
        .rotate() // auto-orient
        .resize({ width: 2400, withoutEnlargement: false }) // Larger size for better recognition
        .greyscale() // Convert to grayscale
        .normalize() // Improve contrast
        .sharpen({ sigma: 1.5 }) // Enhance text edges
        .threshold(128) // Binary threshold for high contrast
        .toBuffer();
    } catch (e) {
      // Fallback to simpler preprocessing
      return sharp(inputPath)
        .rotate()
        .resize({ width: 2000, withoutEnlargement: false })
        .normalize()
        .sharpen()
        .toBuffer();
    }
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

    // Try OCR with current settings
    let {
      data: { text },
    } = await worker.recognize(preprocessed);

    // If no good results, try with different page segmentation mode
    if (!text || text.trim().length < 3) {
      await worker.setParameters({
        tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        preserve_interword_spaces: "1",
        tessedit_pageseg_mode: "11", // Sparse text (try to find as much text as possible)
      });
      const result2 = await worker.recognize(preprocessed);
      if (result2.data.text && result2.data.text.trim().length > text.trim().length) {
        text = result2.data.text;
      }
      // Reset to original mode
      await worker.setParameters({
        tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        preserve_interword_spaces: "1",
        tessedit_pageseg_mode: "6",
      });
    }

    const rawText = (text || "").toUpperCase().trim();
    
    // Clean + extract uppercase-alphanumeric tokens
    // First, try to extract product codes (like NZ625, MG916) which are alphanumeric
    const cleaned = rawText.replace(/[^A-Z0-9]+/g, " ").trim();
    const tokens = cleaned.length ? cleaned.split(/\s+/g) : [];

    // Also try to extract codes that might have been split (e.g., "NZ 625" -> "NZ625")
    const allTokens = [];
    
    // Add individual tokens that meet length requirements
    tokens.forEach(token => {
      if (token.length >= minLen && token.length <= maxLen) {
        allTokens.push(token);
      }
    });
    
    // Try combining adjacent short tokens (e.g., "NZ" + "625" = "NZ625")
    // Also try combining tokens that look like they could be part of a product code
    if (tokens.length > 1) {
      for (let i = 0; i < tokens.length - 1; i++) {
        const combined = tokens[i] + tokens[i + 1];
        if (combined.length >= minLen && combined.length <= maxLen) {
          allTokens.push(combined);
        }
        // Try combining 3 tokens if first two are short (e.g., "N" + "Z" + "625" = "NZ625")
        if (i < tokens.length - 2) {
          const combined3 = tokens[i] + tokens[i + 1] + tokens[i + 2];
          if (combined3.length >= minLen && combined3.length <= maxLen) {
            allTokens.push(combined3);
          }
        }
      }
    }
    
    // Also try to find patterns in the raw text directly (in case tokens are split weirdly)
    // Look for patterns like "NZ625" or "MG916" in the raw text
    const directPatterns = rawText.match(/[A-Z]{2,3}[0-9]{2,4}/g);
    if (directPatterns) {
      directPatterns.forEach(pattern => {
        if (pattern.length >= minLen && pattern.length <= maxLen) {
          allTokens.push(pattern);
        }
      });
    }

    const candidates = Array.from(new Set(allTokens));

    // Filter out noise candidates (common OCR errors)
    const noisePatterns = [
      /^[0-9]+$/, // Pure numbers (likely weights, not SKUs)
      /^[A-Z]{1,2}$/, // Very short letter-only codes
      /^[0-9]{1,2}$/, // Very short numbers
      /^[A-Z]{10,}$/, // Very long letter-only (likely OCR garbage)
      /^[0-9]{10,}$/, // Very long numbers (likely OCR garbage)
    ];
    
    const filteredCandidates = candidates.filter(c => {
      // Remove noise patterns
      if (noisePatterns.some(pattern => pattern.test(c))) {
        return false;
      }
      // Remove candidates that are too repetitive (like "AAAA", "1111")
      if (/^(.)\1{2,}$/.test(c)) {
        return false;
      }
      return true;
    });

    // Score candidates based on how likely they are to be product codes
    const scoredCandidates = filteredCandidates.map(c => {
      let score = 0;
      
      // High score for patterns like NZ625 (2-3 letters + 2-4 numbers)
      if (/^[A-Z]{2,3}[0-9]{2,4}$/.test(c)) {
        score += 100;
      }
      // Medium score for patterns like MG916 (2 letters + 3 numbers)
      else if (/^[A-Z]{1,3}[0-9]{2,7}$/.test(c)) {
        score += 50;
      }
      // Lower score for other alphanumeric patterns
      else if (/^[A-Z0-9]+$/.test(c) && c.length >= 4 && c.length <= 8) {
        score += 20;
      }
      
      // Bonus for length 5-6 (common SKU length)
      if (c.length >= 5 && c.length <= 6) {
        score += 10;
      }
      
      // Penalty for very short or very long
      if (c.length < 4 || c.length > 10) {
        score -= 20;
      }
      
      return { candidate: c, score };
    });

    // Sort by score (highest first), then by length
    scoredCandidates.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.candidate.length - a.candidate.length;
    });

    // Select the best candidate
    const tag = scoredCandidates.length > 0 
      ? scoredCandidates[0].candidate 
      : (filteredCandidates.length > 0 
          ? filteredCandidates.sort((a, b) => b.length - a.length)[0]
          : null);

    return { tag, rawText, candidates };
  }
}

module.exports = new OcrService();

