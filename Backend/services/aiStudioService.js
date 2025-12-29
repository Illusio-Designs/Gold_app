const fs = require("fs");
const path = require("path");
const axios = require("axios");

/**
 * AI studio pipeline (optional):
 * - background removal
 * - studio enhancement generation
 *
 * This is controlled by env vars. If not configured, callers should skip AI.
 *
 * Required env vars:
 * - REPLICATE_API_TOKEN
 * - REPLICATE_BG_REMOVE_MODEL   (e.g. "bria/remove-background")
 * - REPLICATE_STUDIO_MODEL      (e.g. "stability-ai/stable-diffusion-3.5-large")
 *
 * Optional env vars:
 * - REPLICATE_STUDIO_PROMPT
 * - REPLICATE_STUDIO_CFG        (number, default 4.5)
 */
class AiStudioService {
  constructor() {
    this._client = null;
    this._replicateModulePromise = null;
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
      throw new Error("Replicate client not initialized. Call _initClient() first.");
    }
    return this._client;
  }

  async _initClient() {
    if (this._client) return this._client;

    // The `replicate` package is ESM; load it dynamically for this CommonJS backend.
    if (!this._replicateModulePromise) {
      this._replicateModulePromise = import("replicate");
    }
    const mod = await this._replicateModulePromise;
    const Replicate = mod.default || mod;

    this._client = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });
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

  _guessMimeTypeFromPath(filePath) {
    const ext = path.extname(filePath || "").toLowerCase();
    if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
    if (ext === ".png") return "image/png";
    if (ext === ".webp") return "image/webp";
    return "application/octet-stream";
  }

  async _toReplicateImageInput(inputImageUrlOrPath) {
    if (!inputImageUrlOrPath) {
      throw new Error("Missing input image");
    }

    // Replicate accepts public URLs or base64 data URIs for many models.
    if (typeof inputImageUrlOrPath === "string" && /^https?:\/\//i.test(inputImageUrlOrPath)) {
      return inputImageUrlOrPath;
    }

    // Treat as local file path
    const localPath = inputImageUrlOrPath;
    if (!fs.existsSync(localPath)) {
      throw new Error(`Input image path not found: ${localPath}`);
    }

    const bytes = await fs.promises.readFile(localPath);
    const mime = this._guessMimeTypeFromPath(localPath);
    const b64 = bytes.toString("base64");
    return `data:${mime};base64,${b64}`;
  }

  async _writeBytesToFile(bytes, outputPath) {
    // bytes may be Buffer or Uint8Array
    await fs.promises.writeFile(outputPath, bytes);
    return outputPath;
  }

  async _normalizeOutputToFile(output, outputPath) {
    const first = Array.isArray(output) ? output[0] : output;

    if (!first) {
      throw new Error("Replicate did not return an output");
    }

    // Replicate Node examples show output.url() and also writing output directly.
    if (typeof first === "string") {
      return this._downloadToFile(first, outputPath);
    }

    if (first && typeof first.url === "function") {
      const url = first.url();
      if (typeof url !== "string") {
        throw new Error("Replicate output.url() did not return a string URL");
      }
      return this._downloadToFile(url, outputPath);
    }

    // Some outputs may be { url: "https://..." }
    if (first && typeof first.url === "string") {
      return this._downloadToFile(first.url, outputPath);
    }

    if (Buffer.isBuffer(first) || first instanceof Uint8Array) {
      return this._writeBytesToFile(first, outputPath);
    }

    throw new Error("Unsupported Replicate output type");
  }

  /**
   * Run background removal model on Replicate.
   * Returns a local file path to the PNG cutout.
   */
  async removeBackground(inputImageUrlOrPath, workDir) {
    const replicate = await this._initClient();
    const model = process.env.REPLICATE_BG_REMOVE_MODEL || "bria/remove-background";

    const image = await this._toReplicateImageInput(inputImageUrlOrPath);
    const output = await replicate.run(model, {
      input: {
        image,
      },
    });

    const outPath = path.join(workDir, `bg-removed-${Date.now()}.png`);
    return this._normalizeOutputToFile(output, outPath);
  }

  /**
   * Generate a studio-enhanced image with white background.
   * Returns a local file path to the generated image (PNG/JPG depending on model).
   */
  async generateStudioImage(inputImageUrlOrPath, workDir) {
    const replicate = await this._initClient();
    const model =
      process.env.REPLICATE_STUDIO_MODEL || "stability-ai/stable-diffusion-3.5-large";

    const prompt =
      process.env.REPLICATE_STUDIO_PROMPT ||
      "High-end studio product photoshoot of the same jewelry item, centered, clean white background, softbox lighting, realistic soft shadow under the item, ultra sharp, photorealistic, no text, no watermark, no extra objects, keep exact shape and design. Enhance details, reduce noise, improve clarity and contrast, true-to-life colors, keep same framing (no zoom, no crop).";

    const cfgRaw = process.env.REPLICATE_STUDIO_CFG;
    const cfg = cfgRaw ? Number(cfgRaw) : 4.5;

    // NOTE:
    // Some models (including SD 3.5 large) may be text-to-image only (no `image` input).
    // We try with `image` first; if the schema rejects it, we retry without `image`.
    let output;
    try {
      const image = await this._toReplicateImageInput(inputImageUrlOrPath);
      output = await replicate.run(model, {
        input: {
          image,
          prompt,
          cfg,
        },
      });
    } catch (e) {
      console.warn(
        "⚠️ [AI STUDIO] Model rejected image input; retrying prompt-only:",
        e.message
      );
      output = await replicate.run(model, {
        input: {
          prompt,
          cfg,
        },
      });
    }

    const outPath = path.join(workDir, `studio-${Date.now()}.webp`);
    return this._normalizeOutputToFile(output, outPath);
  }
}

module.exports = new AiStudioService();

