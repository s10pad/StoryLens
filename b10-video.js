require("dotenv").config();
const axios = require("axios");

const FAL_KEY = process.env.FAL_API_KEY;
const MODEL   = "fal-ai/kling-video/v1.6/standard/text-to-video";
const SUBMIT  = `https://queue.fal.run/${MODEL}`;
const POLL_MS = 10000;

function headers() {
  return { Authorization: `Key ${FAL_KEY}`, "Content-Type": "application/json" };
}

async function generateVideoScene(scene) {
  if (!FAL_KEY) throw new Error("FAL_API_KEY not set in .env");

  // Submit to queue — response includes status_url and response_url
  let submitData;
  try {
    const res = await axios.post(
      SUBMIT,
      {
        prompt:       scene.videoPrompt,
        duration:     Math.min(scene.duration || 5, 10),
        aspect_ratio: "16:9",
      },
      { headers: headers() }
    );
    submitData = res.data;
  } catch (err) {
    const status = err.response?.status;
    const detail = err.response?.data?.detail || err.message;
    throw new Error(`FAL submit ${status || "network"} error: ${detail}`);
  }

  const { request_id: requestId, status_url: statusUrl, response_url: responseUrl } = submitData;
  if (!requestId) throw new Error(`No request_id for scene ${scene.id}: ${JSON.stringify(submitData)}`);
  console.log(`Scene ${scene.id} queued — request_id: ${requestId}`);

  // Poll using the URLs returned by FAL (they omit the version/variant path)
  while (true) {
    await new Promise(r => setTimeout(r, POLL_MS));

    let statusData;
    try {
      const res = await axios.get(statusUrl, { headers: headers() });
      statusData = res.data;
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail || err.message;
      throw new Error(`FAL status poll ${status || "network"} error for scene ${scene.id}: ${detail}`);
    }

    const status = statusData.status;
    console.log(`Scene ${scene.id} — ${status}`);

    if (status === "COMPLETED") {
      let out;
      try {
        const res = await axios.get(responseUrl, { headers: headers() });
        out = res.data;
      } catch (err) {
        const status = err.response?.status;
        const detail = err.response?.data?.detail || err.message;
        throw new Error(`FAL result fetch ${status || "network"} error for scene ${scene.id}: ${detail}`);
      }

      const videoUrl =
        out?.video?.url         ||
        out?.output?.video?.url ||
        out?.output?.video_url  ||
        out?.video_url;

      if (!videoUrl) throw new Error(`No video URL in result for scene ${scene.id}: ${JSON.stringify(out)}`);
      console.log(`Scene ${scene.id} done: ${videoUrl}`);
      return { ...scene, videoUrl };
    }

    if (status === "FAILED") {
      throw new Error(`Scene ${scene.id} FAILED: ${JSON.stringify(statusData)}`);
    }
  }
}

async function generateAllScenes(scenes) {
  console.log(`Generating ${scenes.length} scenes via FAL queue...`);

  // Sequential to stay within FAL concurrency limits
  const results = [];
  for (const scene of scenes) {
    try {
      results.push(await generateVideoScene(scene));
    } catch (err) {
      const msg = err.message || "";
      // Billing/auth errors affect all scenes — abort early
      if (msg.includes("403") || msg.includes("locked") || msg.includes("balance") || msg.includes("Unauthorized")) {
        console.error(`FAL account error — aborting remaining scenes: ${msg}`);
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
