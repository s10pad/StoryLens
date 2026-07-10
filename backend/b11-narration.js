Object.assign(process.env, require("dotenv").config()?.parsed ?? {});
const { GoogleGenAI } = require("@google/genai");
const fs = require("fs");
const path = require("path");
const os = require("os");

function getClient() {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

// Convert raw PCM (24kHz, 16-bit mono) returned by Gemini TTS to a WAV buffer
function pcmToWav(pcmBase64) {
  const pcm = Buffer.from(pcmBase64, "base64");
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

async function generateNarration(direction, tone, projectId) {
  const ai = getClient();

  // Step 1 — script
  const scriptPrompt = `Write a 35–45 word cinematic trailer voiceover for this story.
Direction: ${JSON.stringify(direction)}
Tone: ${tone || direction.tone || "dramatic"}

Rules: No character names. No plot spoilers. Pure atmosphere and stakes.
Start with a provocative statement. End on a question or incomplete thought.
Return the script text only — no quotes, no labels.`;

  const scriptRes = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: scriptPrompt,
  });
  const script = scriptRes.text.trim();
  console.log(`Voiceover script (${script.split(" ").length} words):\n"${script}"`);

  // Step 2 — TTS
  const outDir = path.join(os.tmpdir(), projectId || "storylens");
  fs.mkdirSync(outDir, { recursive: true });

  try {
    const ttsRes = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: script,
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" }, // deep cinematic voice
          },
        },
      },
    });

    const inlineData = ttsRes.candidates[0].content.parts[0].inlineData;
    const wav = pcmToWav(inlineData.data);
    const outPath = path.join(outDir, "narration.wav");
    fs.writeFileSync(outPath, wav);
    console.log(`Narration audio saved: ${outPath}`);
    return { path: outPath, script };
  } catch (err) {
    console.warn("Gemini TTS failed:", err.message, "— script only");
    return { path: null, script, warning: err.message };
  }
}

module.exports = { generateNarration };
