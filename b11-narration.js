require("dotenv").config();
const Anthropic = require("@anthropic-ai/sdk");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const os = require("os");

const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });
const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Rachel — cinematic female

async function writeVoiceoverScript(direction, tone) {
  const msg = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 256,
    messages: [{
      role: "user",
      content: `Write a 35–45 word cinematic trailer voiceover for this story.
Direction: ${JSON.stringify(direction)}
Tone: ${tone || direction.tone || "dramatic"}

Rules: No character names. No plot spoilers. Pure atmosphere and stakes.
Start with a provocative statement. End on a question or incomplete thought.
Return the script text only — no quotes, no labels.`,
    }],
  });
  return msg.content[0].text.trim();
}

async function generateNarration(direction, tone, projectId) {
  const script = await writeVoiceoverScript(direction, tone);
  console.log(`Voiceover script (${script.split(" ").length} words):\n"${script}"`);

  const outDir = path.join(os.tmpdir(), projectId || "storylens");
  fs.mkdirSync(outDir, { recursive: true });

  // Save script as text regardless
  const scriptPath = path.join(outDir, "narration-script.txt");
  fs.writeFileSync(scriptPath, script);

  if (!ELEVENLABS_KEY || ELEVENLABS_KEY === "your-elevenlabs-key-here") {
    console.warn("ElevenLabs key not set — skipping audio, script saved to:", scriptPath);
    return { path: null, script, scriptPath, warning: "No ElevenLabs key — narration audio skipped" };
  }

  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        text: script,
        model_id: "eleven_turbo_v2_5",
        voice_settings: { stability: 0.4, similarity_boost: 0.75, style: 0.3 },
      },
      {
        headers: {
          "xi-api-key": ELEVENLABS_KEY,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        responseType: "arraybuffer",
      }
    );

    const outPath = path.join(outDir, "narration.mp3");
    fs.writeFileSync(outPath, Buffer.from(response.data));
    console.log(`Narration saved: ${outPath}`);
    return { path: outPath, script, scriptPath };
  } catch (err) {
    const detail = err.response?.data
      ? Buffer.from(err.response.data).toString()
      : err.message;
    console.warn("ElevenLabs TTS failed:", detail);
    console.warn("Continuing without narration audio. Script saved to:", scriptPath);
    return { path: null, script, scriptPath, warning: detail };
  }
}

module.exports = { generateNarration, writeVoiceoverScript };
