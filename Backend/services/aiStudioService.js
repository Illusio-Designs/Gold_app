const fs = require("fs");
const path = require("path");
const axios = require("axios");
const sharp = require("sharp");

/**
 * AI studio pipeline using Gemini:
 * - background removal (optional, using Sharp)
 * - studio enhancement generation (using Gemini image generation or analysis)
 *
 * Required env vars:
 * - GOOGLE_AI_API_KEY           (Gemini API key)
 *
 * Optional env vars:
 * - GEMINI_STUDIO_MODEL         (default: "gemini-1.5-flash", for analysis-based enhancement)
 * - GEMINI_IMAGE_GEN_MODEL      (default: "gemini-2.5-flash-image", for direct image generation - Nano Banana)
 * - GEMINI_STUDIO_PROMPT         (custom prompt)
 * - GEMINI_USE_IMAGE_GEN        (default: "true", set to "false" to use analysis-based enhancement only)
 * - ENABLE_BG_REMOVAL           (default: "false", set to "true" to enable simple background removal)
 */
class AiStudioService {
  constructor() {
    this._geminiClient = null;
    this._geminiModulePromise = null;
  }

  isEnabled() {
    return !!process.env.GOOGLE_AI_API_KEY;
  }

  async _initGeminiClient() {
    if (this._geminiClient) return this._geminiClient;

    if (!process.env.GOOGLE_AI_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY is required for Gemini");
    }

    // The @google/generative-ai package is ESM; load it dynamically
    if (!this._geminiModulePromise) {
      this._geminiModulePromise = import("@google/generative-ai");
    }
    const { GoogleGenerativeAI } = await this._geminiModulePromise;

    this._geminiClient = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    return this._geminiClient;
  }

  /**
   * List available Gemini models for debugging
   */
  async listAvailableModels() {
    try {
      const genAI = await this._initGeminiClient();
      const response = await genAI.listModels();
      const models = response.models || [];
      const modelNames = models.map(m => {
        // Extract model name - could be "models/gemini-pro" or just "gemini-pro"
        const name = m.name || m.displayName || '';
        return name.replace(/^models\//, ''); // Remove "models/" prefix if present
      });
      :`, modelNames);
      return modelNames;
    } catch (error) {
      // Return empty array on error
      return [];
    }
  }

  /**
   * Get a working Gemini model, trying multiple approaches
   */
  async _getWorkingModel(genAI) {
    // First, try to list available models
    let availableModels = [];
    try {
      availableModels = await this.listAvailableModels();
      if (availableModels.length > 0) {
        // Extract just the model name (remove "models/" prefix if present)
        const modelName = availableModels[0].replace(/^models\//, '');
        const model = genAI.getGenerativeModel({ model: modelName });
        return { model, modelName };
      }
    } catch (listError) {
      }

    // If listing failed, try common model names (excluding gemini-pro which doesn't work in v1beta)
    // Remove duplicates and filter
    const modelNamesToTry = [
      process.env.GEMINI_STUDIO_MODEL,
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-1.5-pro-latest",
    ]
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates

    let lastError = null;
    
    for (const modelName of modelNamesToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        // Model initialization doesn't throw, so we'll test it with an actual call
        return { model, modelName };
      } catch (error) {
        lastError = error;
        continue;
      }
    }

    throw new Error(`No working Gemini model found. Tried: ${modelNamesToTry.join(", ")}. ${availableModels.length > 0 ? `Available models: ${availableModels.join(", ")}` : "Could not list available models."} Last error: ${lastError?.message || "unknown"}`);
  }

  _guessMimeTypeFromPath(filePath) {
    const ext = path.extname(filePath || "").toLowerCase();
    if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
    if (ext === ".png") return "image/png";
    if (ext === ".webp") return "image/webp";
    return "application/octet-stream";
  }

  async _readImageData(inputImageUrlOrPath) {
    let imageData;
    if (typeof inputImageUrlOrPath === "string" && /^https?:\/\//i.test(inputImageUrlOrPath)) {
      const response = await axios.get(inputImageUrlOrPath, { responseType: "arraybuffer" });
      imageData = Buffer.from(response.data);
    } else {
      imageData = await fs.promises.readFile(inputImageUrlOrPath);
    }
    return imageData;
  }

  /**
   * Simple background removal using Sharp (optional).
   * This is a basic approach - for better results, consider using a dedicated service.
   * Returns a local file path to the processed image.
   */
  async removeBackground(inputImageUrlOrPath, workDir) {
    const enableBgRemoval = process.env.ENABLE_BG_REMOVAL === "true";
    
    if (!enableBgRemoval) {
      // Return the original image path
      if (typeof inputImageUrlOrPath === "string" && !/^https?:\/\//i.test(inputImageUrlOrPath)) {
        return inputImageUrlOrPath;
      }
      // If it's a URL, download it first
      const imageData = await this._readImageData(inputImageUrlOrPath);
      const outPath = path.join(workDir, `bg-removed-${Date.now()}.png`);
      await fs.promises.writeFile(outPath, imageData);
      return outPath;
    }

    try {
      const imageData = await this._readImageData(inputImageUrlOrPath);
      
      // Simple approach: convert to white background
      // This is basic - for production, consider using a dedicated background removal service
      const processed = await sharp(imageData)
        .flatten({ background: { r: 255, g: 255, b: 255 } }) // White background
        .png()
        .toBuffer();

      const outPath = path.join(workDir, `bg-removed-${Date.now()}.png`);
      await fs.promises.writeFile(outPath, processed);
      return outPath;
    } catch (error) {
      // Fallback to original
      const imageData = await this._readImageData(inputImageUrlOrPath);
      const outPath = path.join(workDir, `bg-removed-${Date.now()}.png`);
      await fs.promises.writeFile(outPath, imageData);
      return outPath;
    }
  }

  /**
   * Use Gemini to analyze image and enhance the prompt for better image generation.
   * Returns an enhanced prompt string.
   */
  async enhancePromptWithGemini(inputImageUrlOrPath, basePrompt) {
    const genAI = await this._initGeminiClient();
    
    // Get a working model
    let model, modelName;
    try {
      const result = await this._getWorkingModel(genAI);
      model = result.model;
      modelName = result.modelName;
    } catch (error) {
      return basePrompt;
    }
    
    let lastError = null;
    try {

        const imageData = await this._readImageData(inputImageUrlOrPath);
        const base64Image = imageData.toString("base64");
        const mimeType = this._guessMimeTypeFromPath(inputImageUrlOrPath);

        const enhancementPrompt = `Analyze this jewelry product image and create an enhanced, detailed prompt for generating a professional studio product photoshoot. 

Base requirements: ${basePrompt}

Please analyze the image and create a highly detailed, specific prompt that:
1. Describes the jewelry item accurately (type, materials, colors, design details)
2. Specifies professional photography requirements (lighting, background, shadows)
3. Emphasizes quality and realism
4. Maintains the exact same item and framing

Return ONLY the enhanced prompt, nothing else.`;

        const result = await model.generateContent([
          enhancementPrompt,
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
        ]);

      const response = await result.response;
      const enhancedPrompt = response.text().trim();
      
      `);
      return enhancedPrompt || basePrompt; // Fallback to base prompt if empty
    } catch (error) {
      lastError = error;
    }
    
    // If failed, return base prompt
    if (lastError) {
      }
    return basePrompt;
  }

  /**
   * Generate a studio-enhanced image using Gemini's image generation.
   * Uses gemini-2.5-flash-image or similar models to generate images directly.
   * Returns a local file path to the generated image.
   */
  async generateStudioImage(inputImageUrlOrPath, workDir) {
    const basePrompt =
      process.env.GEMINI_STUDIO_PROMPT ||
      "High-end studio product photoshoot of the same jewelry item, centered, clean white background, softbox lighting, realistic soft shadow under the item, ultra sharp, photorealistic, no text, no watermark, no extra objects, keep exact shape and design. Enhance details, reduce noise, improve clarity and contrast, true-to-life colors, keep same framing (no zoom, no crop).";

    try {
      // Prioritize image generation (Nano Banana models)
      const useImageGen = process.env.GEMINI_USE_IMAGE_GEN !== "false";
      
      if (useImageGen) {
        try {
          return await this._generateImageWithGenAI(inputImageUrlOrPath, basePrompt, workDir);
        } catch (genAIError) {
          // Fall through to analysis-based approach
        }
      }

      // Fallback: Use analysis + Sharp enhancement (only if image generation disabled or failed)
      return await this._generateImageWithAnalysis(inputImageUrlOrPath, basePrompt, workDir);
    } catch (error) {
      if (error?.message?.includes("API_KEY")) {
        throw new Error("Gemini authentication failed. Please check your GOOGLE_AI_API_KEY");
      }
      if (error?.message?.includes("quota") || error?.message?.includes("429")) {
        throw new Error("Gemini API quota exceeded. Please check your usage limits.");
      }
      throw error;
    }
  }

  /**
   * Generate image using @google/genai with gemini-2.5-flash-image
   */
  async _generateImageWithGenAI(inputImageUrlOrPath, basePrompt, workDir) {
    // Dynamic import for @google/genai
    const { GoogleGenAI } = await import("@google/genai");
    
    if (!process.env.GOOGLE_AI_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY is required");
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GOOGLE_AI_API_KEY,
    });

    // Read the input image
    const imageData = await this._readImageData(inputImageUrlOrPath);
    const base64Image = imageData.toString("base64");
    const mimeType = this._guessMimeTypeFromPath(inputImageUrlOrPath);

    // Create prompt for image generation
    // For image generation, we need to describe what we want, not just transform
    const imageGenPrompt = `Create a professional studio product photoshoot image of this jewelry item: ${basePrompt}. Keep the exact same jewelry item, maintain its shape, design, and details. Only improve the photography quality, lighting, and background.`;

    // Try image generation models (Nano Banana models)
    const imageGenModels = [
      process.env.GEMINI_IMAGE_GEN_MODEL,
      "gemini-2.5-flash-image",  // Nano Banana - fast and efficient
      "gemini-3-pro-image-preview",  // Nano Banana Pro - high fidelity
      "gemini-2.0-flash-exp-image",
    ].filter(Boolean);

    let lastError = null;
    for (const modelName of imageGenModels) {
      try {
        // Try with image input first (for image-to-image generation)
        let response;
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                role: "user",
                parts: [
                  { text: imageGenPrompt },
                  {
                    inlineData: {
                      data: base64Image,
                      mimeType: mimeType,
                    },
                  },
                ],
              },
            ],
          });
        } catch (imgError) {
          // If image input fails, try text-only (some models may not support image input)
          response = await ai.models.generateContent({
            model: modelName,
            contents: imageGenPrompt,
          });
        }

        // Extract image from response
        if (response.candidates && response.candidates[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
              const buffer = Buffer.from(part.inlineData.data, "base64");
              const outPath = path.join(workDir, `studio-gemini-${Date.now()}.webp`);
              await fs.promises.writeFile(outPath, buffer);
              return outPath;
            }
          }
        }

        throw new Error("No image data in response");
      } catch (error) {
        lastError = error;
        continue;
      }
    }

    throw new Error(`All image generation models failed. Last error: ${lastError?.message || "unknown"}`);
  }

  /**
   * Generate image using analysis + Sharp enhancement (fallback)
   */
  async _generateImageWithAnalysis(inputImageUrlOrPath, basePrompt, workDir) {
    ...`);
    
    const genAI = await this._initGeminiClient();
    const imageData = await this._readImageData(inputImageUrlOrPath);
    const base64Image = imageData.toString("base64");
    const mimeType = this._guessMimeTypeFromPath(inputImageUrlOrPath);

    const analysisPrompt = `Analyze this jewelry product image and provide detailed instructions for enhancing it to look like a professional studio product photoshoot. 

Requirements:
${basePrompt}

Provide specific, actionable instructions for:
1. Color adjustments (brightness, contrast, saturation)
2. Sharpness and detail enhancement
3. Background processing
4. Lighting improvements
5. Noise reduction

Return ONLY a JSON object with these keys: brightness, contrast, saturation, sharpness, noiseReduction (all numbers 0-100), and backgroundStyle (string).`;

    // Get a working model
    let model, modelName;
    try {
      const result = await this._getWorkingModel(genAI);
      model = result.model;
      modelName = result.modelName;
    } catch (error) {
      throw new Error(`Could not get working Gemini model: ${error.message}`);
    }

    const result = await model.generateContent([
      analysisPrompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      },
    ]);

    const response = await result.response;
    let enhancementParams = {
      brightness: 10,
      contrast: 15,
      saturation: 5,
      sharpness: 20,
      noiseReduction: 10,
      backgroundStyle: "white"
    };

    try {
      const responseText = response.text().trim();
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || responseText.match(/```\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : responseText;
      const parsed = JSON.parse(jsonText);
      enhancementParams = { ...enhancementParams, ...parsed };
      } catch (parseError) {
      }

    // Apply enhancements using Sharp
    let processed = sharp(imageData);

    if (enhancementParams.brightness) {
      processed = processed.modulate({
        brightness: 1 + (enhancementParams.brightness / 100),
      });
    }

    if (enhancementParams.contrast) {
      processed = processed.linear(1 + (enhancementParams.contrast / 100), -(128 * enhancementParams.contrast / 100));
    }

    if (enhancementParams.saturation) {
      processed = processed.modulate({
        saturation: 1 + (enhancementParams.saturation / 100),
      });
    }

    if (enhancementParams.sharpness) {
      processed = processed.sharpen({
        sigma: 1 + (enhancementParams.sharpness / 50),
      });
    }

    if (enhancementParams.backgroundStyle === "white") {
      processed = processed.flatten({ background: { r: 255, g: 255, b: 255 } });
    }

    const enhancedImage = await processed.webp({ quality: 95 }).toBuffer();
    const outPath = path.join(workDir, `studio-gemini-${Date.now()}.webp`);
    await fs.promises.writeFile(outPath, enhancedImage);
    return outPath;
  }
}

module.exports = new AiStudioService();
