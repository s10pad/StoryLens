Object.assign(process.env, require("dotenv").config()?.parsed ?? {});
const { GoogleGenAI } = require("@google/genai");
const fs = require("fs");
const path = require("path");
const os = require("os");

function getClient() {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

async function generateImageScene(scene, workDir) {
  const ai = getClient();
  console.log(`Scene ${scene.id} queued — generating image via Imagen 3...`);

  let response;
  let attempts = 0;
  while (attempts < 3) {
    try {
      response = await ai.models.generateImages({
        model: "imagen-3.0-generate-002",
        prompt: scene.videoPrompt || scene.imagePrompt,
        config: {
          numberOfImages: 1,
          aspectRatio: "16:9",
          outputMimeType: "image/png",
        },
      });
      break;
    } catch (e) {
      if (e.message && (e.message.includes("503") || e.message.includes("UNAVAILABLE")) && attempts < 2) {
        attempts++;
        console.log(`Imagen 503 error on scene ${scene.id}, retrying in ${attempts * 2}s...`);
        await new Promise(r => setTimeout(r, attempts * 2000));
      } else {
        throw e;
      }
    }
  }

  const base64Data = response.generatedImages[0].image.imageBytes;
  const buffer = Buffer.from(base64Data, "base64");
  const imgPath = path.join(workDir, `scene_${scene.id}.png`);
  fs.writeFileSync(imgPath, buffer);

  console.log(`✓ Scene ${scene.id} saved: ${imgPath}`);
  return imgPath;
}

async function generateAllImages(scenes) {
  const workDir = path.join(os.tmpdir(), `storylens-imagen-${Date.now()}`);
  fs.mkdirSync(workDir, { recursive: true });

  const results = [];
  // Run sequentially to respect rate limits, but could be parallelized if needed
  for (const scene of scenes) {
    try {
      const imgPath = await generateImageScene(scene, workDir);
      results.push({ ...scene, imageUrl: imgPath, videoUrl: null });
    } catch (err) {
      console.warn(`Scene ${scene.id} failed:`, err.message);
      results.push({ ...scene, imageUrl: null, videoUrl: null });
    }
  }
  return results;
}

module.exports = { generateAllImages };
