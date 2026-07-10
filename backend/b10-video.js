Object.assign(process.env, require("dotenv").config()?.parsed ?? {});
const { GoogleGenAI } = require("@google/genai");
const fs = require("fs");
const path = require("path");
const os = require("os");

function getClient() {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

const POLL_MS = 10000;

async function generateVideoScene(scene, workDir) {
  const ai = getClient();

  let operation = await ai.models.generateVideos({
    model: "veo-3.1-generate-preview",
    prompt: scene.videoPrompt,
    config: {
      aspectRatio: "16:9",
      durationSeconds: Math.min(Math.max(scene.duration || 6, 5), 8),
    },
  });

  console.log(`Scene ${scene.id} queued — operation: ${operation.name}`);

  while (!operation.done) {
    await new Promise(r => setTimeout(r, POLL_MS));
    operation = await ai.operations.getVideosOperation({ operation });
    console.log(`  Scene ${scene.id}: ${operation.metadata?.state || "processing"}`);
  }

  if (operation.error) {
    throw new Error(`Veo error for scene ${scene.id}: ${JSON.stringify(operation.error)}`);
  }

  const video = operation.response.generatedVideos[0].video;
  const clipPath = path.join(workDir, `scene_${scene.id}.mp4`);
  await ai.files.download({ file: video, downloadPath: clipPath });
  console.log(`✓ Scene ${scene.id} saved: ${clipPath}`);
  return clipPath;
}

async function generateAllScenes(scenes) {
  const workDir = path.join(os.tmpdir(), `storylens-veo-${Date.now()}`);
  fs.mkdirSync(workDir, { recursive: true });

  const results = [];
  for (const scene of scenes) {
    try {
      const clipPath = await generateVideoScene(scene, workDir);
      results.push({ ...scene, videoUrl: clipPath });
    } catch (err) {
      console.warn(`Scene ${scene.id} failed:`, err.message);
      results.push({ ...scene, videoUrl: null });
    }
  }
  return results;
}

module.exports = { generateAllScenes };
