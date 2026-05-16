require("dotenv").config();
const axios = require("axios");

const FAL_KEY = process.env.FAL_API_KEY;
const MODEL   = "fal-ai/kling-video/v1.6/standard/text-to-video";
const SUBMIT  = `https://queue.fal.run/${MODEL}`;
const STATUS  = (id) => `https://queue.fal.run/${MODEL}/requests/${id}/status`;
const RESULT  = (id) => `https://queue.fal.run/${MODEL}/requests/${id}`;
const POLL_MS = 10000;

function headers() {
  return { Authorization: `Key ${FAL_KEY}`, "Content-Type": "application/json" };
}

async function generateVideoScene(scene) {
  if (!FAL_KEY) throw new Error("FAL_API_KEY not set in .env");

  // Submit to queue
  let submitRes;
  try {
    submitRes = await axios.post(
      SUBMIT,
      {
        prompt:       scene.videoPrompt,
        duration:     Math.min(scene.duration || 5, 10),
        aspect_ratio: "16:9",
      },
      { headers: headers() }
    );
  } catch (err) {
    const status = err.response?.status;
    const detail = err.response?.data?.detail || err.message;
    throw new Error(`FAL submit ${status || "network"} error: ${detail}`);
  }

  const requestId = submitRes.data.request_id;
  if (!requestId) throw new Error(`No request_id for scene ${scene.id} — response: ${JSON.stringify(submitRes.data)}`);
  console.log(`Scene ${scene.id} queued — request_id: ${requestId}`);

  // Poll status
  while (true) {
    await new Promise(r => setTimeout(r, POLL_MS));

    const statusRes = await axios.get(STATUS(requestId), { headers: headers() });
    const status = statusRes.data.status;
    console.log(`Scene ${scene.id} — ${status}`);

    if (status === "COMPLETED") {
      const resultRes = await axios.get(RESULT(requestId), { headers: headers() });
      const out = resultRes.data;
      const videoUrl =
        out?.video?.url       ||
        out?.output?.video?.url ||
        out?.output?.video_url  ||
        out?.video_url;
      if (!videoUrl) throw new Error(`No video URL in result for scene ${scene.id}: ${JSON.stringify(out)}`);
      console.log(`Scene ${scene.id} done: ${videoUrl}`);
      return { ...scene, videoUrl };
    }

    if (status === "FAILED") {
      throw new Error(`Scene ${scene.id} failed: ${JSON.stringify(statusRes.data)}`);
    }
  }
}

async function generateAllScenes(scenes) {
  console.log(`Generating ${scenes.length} scenes via FAL queue...`);

  // Run scenes sequentially so a billing/auth failure aborts early rather than
  // spawning N parallel requests that all fail the same way.
  const results = [];
  for (const scene of scenes) {
    try {
      results.push(await generateVideoScene(scene));
    } catch (err) {
      // Surface billing / auth errors immediately — these affect all scenes.
      const msg = err.message || "";
      if (msg.includes("403") || msg.includes("locked") || msg.includes("balance") || msg.includes("Unauthorized")) {
        console.error(`FAL account error — aborting all scenes: ${msg}`);
        // Fill remaining scenes with null and stop.
        results.push({ ...scene, videoUrl: null });
        for (const remaining of scenes.slice(results.length)) {
          results.push({ ...remaining, videoUrl: null });
        }
        break;
      }
      console.warn(`Scene ${scene.id} failed (${msg}) — skipping`);
      results.push({ ...scene, videoUrl: null });
    }
  }

  const ready = results.filter(s => s.videoUrl).length;
  console.log(`${ready}/${results.length} scenes ready.`);
  return results;
}

module.exports = { generateVideoScene, generateAllScenes };
