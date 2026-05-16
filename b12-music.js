Object.assign(process.env, require("dotenv").config()?.parsed ?? {});
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const os = require("os");

const FAL_KEY = process.env.FAL_API_KEY;
const FAL_MUSIC_MODEL = "fal-ai/stable-audio";
const FAL_SUBMIT = `https://queue.fal.run/${FAL_MUSIC_MODEL}`;
const POLL_INTERVAL_MS = 5000;

// ─── Genre → music style descriptor ──────────────────────────────────────────
const GENRE_STYLE = {
  "live action":       "cinematic orchestral score, realistic and dramatic",
  "animation":         "playful orchestral, warm, whimsical and expressive",
  "2d animation":      "light orchestral, hand-drawn animated feel, charming and lively",
  "3d animation":      "sweeping CGI orchestral, adventurous and grand, Pixar-inspired",
  "anime":             "anime cinematic orchestral with electric guitar accents, soaring and emotional",
  "stop motion":       "quirky chamber orchestral, plucked strings and woodwinds, tactile and whimsical",
  "documentary":       "ambient acoustic, understated piano, honest and grounded",
  "mockumentary":      "deadpan acoustic, light piano and strings, ironic and understated",
  "sci-fi":            "electronic synthesizer pads, futuristic ambient, cold and vast",
  "horror":            "dark ambient, dissonant strings, unsettling and dread-filled",
  "fantasy":           "epic fantasy orchestral with choir, magical and sweeping",
  "dark fantasy":      "brooding gothic orchestral with choir, ominous strings, cursed and mythic",
  "action":            "high-energy orchestral hybrid, driving percussion and brass, kinetic and relentless",
  "thriller":          "tense pulsing underscore, low strings and synth bass, escalating dread",
  "mystery":           "investigative ambient, plucked strings and piano, curious and contemplative",
  "crime":             "gritty urban underscore, smoky saxophone and low strings, morally weighted",
  "drama":             "emotional piano and strings, intimate and restrained, character-driven",
  "romance":           "tender romantic strings and piano, warm and intimate",
  "comedy":            "bouncy playful orchestral, light brass and woodwinds, snappy and charming",
  "dark comedy":       "off-kilter chamber music, plucked strings and piano, wry and absurd",
  "western":           "western frontier orchestral, acoustic guitar and harmonica, sweeping and stoic",
  "historical":        "period orchestral with strings and woodwinds, dignified and era-appropriate",
  "superhero":         "epic heroic orchestral, soaring brass and percussion, larger-than-life",
  "cyberpunk":         "neon synthwave with industrial percussion, retro-futuristic and rebellious",
  "post-apocalyptic":  "sparse desolate ambient, distant piano and drone, ruined and contemplative",
  "noir":              "moody jazz noir, smoky saxophone and upright bass, shadowy and cynical",
  "psychological":     "unsettling minimalist underscore, dissonant piano and distorted strings, interior dread",
  "supernatural":      "ethereal ambient with ghostly choir, uncanny and otherworldly",
  "adventure":         "adventurous bold orchestral, sweeping strings and brass, exciting and forward-moving",
  "musical":           "lush theatrical orchestral with vocal-style melodic lines, performative and uplifting",
};

// ─── Mood → music descriptor ──────────────────────────────────────────────────
const MOOD_STYLE = {
  tense:       "tense suspenseful underscore, building tension, tight percussion",
  dark:        "dark brooding orchestral, low strings and brass, ominous",
  melancholic: "melancholic piano and strings, emotional and reflective",
  epic:        "epic cinematic orchestral, powerful brass and percussion, soaring",
  hopeful:     "hopeful uplifting strings and piano, warm and optimistic",
  triumphant:  "triumphant heroic brass, soaring and victorious",
  urgent:      "urgent fast-paced percussion and strings, kinetic driving energy",
  dreamlike:   "dreamy ambient pads, ethereal and floating, soft textures",
  romantic:    "romantic strings and piano, tender and intimate",
  revenge:     "dark intense orchestral, driving percussion, menacing and relentless",
  survival:    "tense minimal survival underscore, sparse and desperate",
  redemption:  "emotional redemptive strings, building toward hopeful resolution",
  whimsical:   "light whimsical woodwinds, playful and charming, staccato strings",
  adventure:   "adventurous bold orchestral, exciting and forward-moving",
  mysterious:  "mysterious ambient, subtle tension, curious and intriguing",
  comedic:     "light comedic brass and woodwinds, bouncy and playful",
  eerie:       "eerie high strings and silence, unsettling and otherworldly",
  action:      "high-energy action orchestral, percussion-heavy and relentless",
};

// ─── Local MP3 fallback map (mood → filename in music/ folder) ────────────────
const LOCAL_FALLBACK = {
  tense:       "tense.mp3",
  dark:        "dark.mp3",
  melancholic: "melancholic.mp3",
  epic:        "epic.mp3",
  hopeful:     "hopeful.mp3",
  triumphant:  "epic.mp3",
  urgent:      "tense.mp3",
  dreamlike:   "melancholic.mp3",
  romantic:    "hopeful.mp3",
  revenge:     "dark.mp3",
  survival:    "tense.mp3",
  redemption:  "hopeful.mp3",
  whimsical:   "hopeful.mp3",
  adventure:   "epic.mp3",
  mysterious:  "dark.mp3",
  comedic:     "hopeful.mp3",
  eerie:       "dark.mp3",
  action:      "epic.mp3",
};

const MUSIC_DIR = path.join(__dirname, "music");

// ─── Build the AI music prompt ────────────────────────────────────────────────
function buildMusicPrompt(mood, genre, duration) {
  const moodKey = (mood || "epic").toLowerCase();
  const genreKey = (genre || "live action").toLowerCase();
  const moodDesc  = MOOD_STYLE[moodKey]  || `${mood} cinematic music`;
  const genreDesc = GENRE_STYLE[genreKey] || "cinematic orchestral score";
  return `${genreDesc}, ${moodDesc}, trailer background music, no vocals, instrumental only, ${duration} seconds`;
}

// ─── Generate via fal.ai stable-audio ────────────────────────────────────────
async function generateMusicViaFal(mood, genre, duration = 47) {
  if (!FAL_KEY || FAL_KEY.startsWith("your-")) return null;

  const prompt = buildMusicPrompt(mood, genre, duration);
  console.log(`Music (fal.ai): "${prompt}"`);

  const headers = { Authorization: `Key ${FAL_KEY}`, "Content-Type": "application/json" };

  // Submit to queue
  let submitRes;
  try {
    submitRes = await axios.post(
      FAL_SUBMIT,
      {
        prompt,
        seconds_total: Math.min(duration, 47), // stable-audio max ~47s
        steps: 100,
      },
      { headers }
    );
  } catch (err) {
    const status = err.response?.status;
    const detail = err.response?.data?.detail || err.message;
    throw new Error(`fal.ai music submit ${status || "network"} error: ${detail}`);
  }

  const requestId = submitRes.data.request_id;
  if (!requestId) throw new Error(`fal.ai returned no request_id for music job — response: ${JSON.stringify(submitRes.data)}`);
  // Prefer server-provided URLs (queue.fal.run hands back exact paths).
  const statusUrl   = submitRes.data.status_url   || `${FAL_SUBMIT}/requests/${requestId}/status`;
  const responseUrl = submitRes.data.response_url || `${FAL_SUBMIT}/requests/${requestId}`;
  console.log(`Music job submitted — request_id: ${requestId}`);

  // Poll
  while (true) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));

    const poll = await axios.get(statusUrl, { headers: { Authorization: `Key ${FAL_KEY}` } });
    const status = poll.data.status;
    console.log(`Music status: ${status}`);

    if (status === "COMPLETED") {
      const result = await axios.get(responseUrl, { headers: { Authorization: `Key ${FAL_KEY}` } });
      const out = result.data;
      const audioUrl =
        out?.audio_file?.url ||
        out?.audio?.url      ||
        out?.audio_url       ||
        out?.url             ||
        out?.output?.audio_file?.url ||
        out?.output?.audio?.url;

      if (!audioUrl) throw new Error(`fal.ai music completed but no audio URL found: ${JSON.stringify(out)}`);

      // Download to temp file
      const tmpDir  = path.join(os.tmpdir(), "storylens-music");
      fs.mkdirSync(tmpDir, { recursive: true });
      const outPath = path.join(tmpDir, `score-${Date.now()}.wav`);

      const dl = await axios.get(audioUrl, { responseType: "arraybuffer", timeout: 60000 });
      fs.writeFileSync(outPath, Buffer.from(dl.data));
      console.log(`Music saved: ${outPath}`);
      return outPath;
    }

    if (status === "FAILED") {
      throw new Error(`fal.ai music failed: ${JSON.stringify(poll.data)}`);
    }
  }
}

// ─── Local MP3 fallback ───────────────────────────────────────────────────────
function localFallback(mood) {
  const key = (mood || "").toLowerCase();

  // Exact key
  if (LOCAL_FALLBACK[key]) {
    const p = path.join(MUSIC_DIR, LOCAL_FALLBACK[key]);
    if (fs.existsSync(p)) return p;
  }

  // Partial key match
  for (const [m, file] of Object.entries(LOCAL_FALLBACK)) {
    if (key.includes(m)) {
      const p = path.join(MUSIC_DIR, file);
      if (fs.existsSync(p)) return p;
    }
  }

  // Any available MP3
  if (fs.existsSync(MUSIC_DIR)) {
    const files = fs.readdirSync(MUSIC_DIR).filter(f => f.endsWith(".mp3"));
    if (files.length > 0) return path.join(MUSIC_DIR, files[0]);
  }

  throw new Error(
    "No music tracks found. Add MP3 files to the music/ folder, or set FAL_API_KEY to generate music automatically."
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
async function generateScore(direction, tone, genre) {
  const mood       = tone || direction?.tone  || "epic";
  const trackGenre = genre || direction?.genre || "live action";
  const duration   = 47;

  // Try fal.ai first
  try {
    const falPath = await generateMusicViaFal(mood, trackGenre, duration);
    if (falPath) {
      return {
        path:      falPath,
        mood,
        genre:     trackGenre,
        trackName: path.basename(falPath),
        source:    "fal.ai",
      };
    }
  } catch (err) {
    console.warn(`fal.ai music error — falling back to local: ${err.message}`);
  }

  // Local fallback
  const localPath = localFallback(mood);
  console.log(`Music (local): mood "${mood}" → ${path.basename(localPath)}`);
  return {
    path:      localPath,
    mood,
    genre:     trackGenre,
    trackName: path.basename(localPath),
    source:    "local",
  };
}

module.exports = { generateScore };
