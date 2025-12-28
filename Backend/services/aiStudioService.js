const fs = require("fs");
const path = require("path");
const axios = require("axios");
const Replicate = require("replicate");

/**
 * AI studio pipeline (optional):
 * - background removal
 * - studio enhancement generation
 *
 * This is controlled by env vars. If not configured, callers should skip AI.
 *
 * Required env vars:
 * - REPLICATE_API_TOKEN
 * - REPLICATE_BG_REMOVE_MODEL   (e.g. "owner/model:version" or "owner/model")
 * - REPLICATE_STUDIO_MODEL      (e.g. "owner/model:version" or "owner/model")
 *
 * Optional env vars:
 * - REPLICATE_STUDIO_PROMPT
 */
class AiStudioService {
  constructor() {
    this._client = null;
  }

  isEnabled() {
    return (
      !!process.env.REPLICATE_API_TOKEN &&
      !!process.env.REPLICATE_BG_REMOVE_MODEL &&
      !!process.env.REPLICATE_STUDIO_MODEL
    );
  }

  _getClient() {
    if (!this._client) {
      this._client = new Replicate({
        auth: process.env.REPLICATE_API_TOKEN,
      });
    }
    return this._client;
  }

  async _downloadToFile(url, outputPath) {
    const writer = fs.createWriteStream(outputPath);
    const resp = await axios.get(url, { responseType: "stream" });
    await new Promise((resolve, reject) => {
      resp.data.pipe(writer);
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
    return outputPath;
  }

  /**
   * Run background removal model on Replicate.
   * Returns a local file path to the PNG cutout.
   */
  async removeBackground(inputImageUrl, workDir) {
    const replicate = this._getClient();
    const model = process.env.REPLICATE_BG_REMOVE_MODEL;

    const output = await replicate.run(model, {
      input: {
        image: inputImageUrl,
      },
    });

    // Replicate outputs vary: string URL or array of URLs.
    const url = Array.isArray(output) ? output[0] : output;
    if (!url || typeof url !== "string") {
      throw new Error("Background removal did not return an output URL");
    }

    const outPath = path.join(workDir, `bg-removed-${Date.now()}.png`);
    return this._downloadToFile(url, outPath);
  }

  /**
   * Generate a studio-enhanced image with white background.
   * Returns a local file path to the generated image (PNG/JPG depending on model).
   */
  async generateStudioImage(inputImageUrl, workDir) {
    const replicate = this._getClient();
    const model = process.env.REPLICATE_STUDIO_MODEL;

    const prompt =
      process.env.REPLICATE_STUDIO_PROMPT ||
      "High-end studio product photoshoot of the same jewelry item, centered, clean white background, softbox lighting, realistic soft shadow under the item, ultra sharp, photorealistic, no text, no watermark, no extra objects, keep exact shape and design. Enhance details, reduce noise, improve clarity and contrast, true-to-life colors, keep same framing (no zoom, no crop).";

    const output = await replicate.run(model, {
      input: {
        image: inputImageUrl,
        prompt,
        num_outputs: 1,
      },
    });

    const url = Array.isArray(output) ? output[0] : output;
    if (!url || typeof url !== "string") {
      throw new Error("Studio generation did not return an output URL");
    }

    const outPath = path.join(workDir, `studio-${Date.now()}.png`);
    return this._downloadToFile(url, outPath);
  }
}

module.exports = new AiStudioService();

