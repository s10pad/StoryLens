Object.assign(process.env, require("dotenv").config()?.parsed ?? {});
const { GoogleGenAI } = require("@google/genai");

function getClient() {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

async function generateNarration(direction, tone) {
  const ai = getClient();

  const prompt = `Write a 35–45 word cinematic trailer voiceover for this story.
Direction: ${JSON.stringify(direction)}
Tone: ${tone || direction.tone || "dramatic"}

Rules: No character names. No plot spoilers. Pure atmosphere and stakes.
Start with a provocative statement. End on a question or incomplete thought.
Return the script text only — no quotes, no labels.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
  });

  const script = response.text.trim();
  console.log(`Voiceover script (${script.split(" ").length} words):\n"${script}"`);
  return { path: null, script, warning: "Veo native audio mode — voiceover text only" };
}

module.exports = { generateNarration };
