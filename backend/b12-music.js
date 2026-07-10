// Veo 3.1 native audio handles ambient sound, music, and SFX per clip.
// No separate score generation needed in this mode.
async function generateScore(direction, tone, genre) {
  console.log("Music: Veo 3.1 native audio — no separate score generated");
  return { trackName: "Veo Native Audio", mood: tone || "cinematic", path: null, source: "veo-native" };
}

module.exports = { generateScore };
