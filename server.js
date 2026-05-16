require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Anthropic = require("@anthropic-ai/sdk");
const { generateAllScenes } = require("./b10-video");
const { generateNarration } = require("./b11-narration");
const { generateScore } = require("./b12-music");
const { assembleTrailer } = require("./b13-assembler");
const { v4: uuidv4 } = require("uuid");

const app = express();
const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Supported genres ─────────────────────────────────────────────────────────
const SUPPORTED_GENRES = [
  "Live Action",
  "Animation",
  "2D Animation",
  "3D Animation",
  "Anime",
  "Stop Motion",
  "Documentary",
  "Mockumentary",
  "Sci-Fi",
  "Horror",
  "Fantasy",
  "Dark Fantasy",
  "Action",
  "Thriller",
  "Mystery",
  "Crime",
  "Drama",
  "Romance",
  "Comedy",
  "Dark Comedy",
  "Western",
  "Historical",
  "Superhero",
  "Cyberpunk",
  "Post-Apocalyptic",
  "Noir",
  "Psychological",
  "Supernatural",
  "Adventure",
  "Musical",
];

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    app: "StoryLens API",
    version: "1.1",
    routes: ["GET /api/genres", "POST /api/directions", "POST /api/feedback", "POST /api/refine", "POST /api/scenes", "POST /api/generate-trailer"],
  });
});

// Return the list of supported genres for the frontend
app.get("/api/genres", (req, res) => {
  res.json({ genres: SUPPORTED_GENRES });
});

app.post("/api/directions", async (req, res) => {
  const { prompt, genre = "", tone = "", characters = "" } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "prompt is required" });
  }

  const systemPrompt = `You are a cinematic story director and creative producer.
When given a story idea, you generate compelling story directions and visual styles for a short film trailer.
Always respond with valid JSON only — no markdown, no explanation.`;

  // Genre-specific guidance injected into the prompt
  const genreKey = (genre || "").toLowerCase();
  const genreGuidance = {
    "animation":         "This is an ANIMATION project. Directions should suit animated storytelling — expressive characters, exaggerated emotion, vibrant worlds. Avoid gritty realism.",
    "2d animation":      "This is a 2D ANIMATION project (hand-drawn / cel-shaded style). Directions should lean into flat stylized visuals, expressive line-art aesthetics, and classic animated pacing.",
    "3d animation":      "This is a 3D CGI ANIMATION project (Pixar / DreamWorks style). Directions should emphasize sweeping rendered worlds, character-driven emotion, and grand cinematic scope.",
    "anime":             "This is an ANIME project. Directions should embrace expressive emotions, dramatic visual storytelling, and Japanese animation aesthetics. Characters should feel iconic and emotionally vivid.",
    "stop motion":       "This is a STOP MOTION project. Directions should celebrate handcrafted textures, deliberate movement, and tactile world-building. Embrace the unique charm of physical puppet animation.",
    "documentary":       "This is a DOCUMENTARY project. Directions should feel authentic and grounded — real-world stakes, observational tone, minimal artifice. Avoid over-dramatization.",
    "mockumentary":      "This is a MOCKUMENTARY project. Directions should blend absurd comedy with documentary realism — deadpan delivery, talking-head interviews, and found-footage aesthetic.",
    "sci-fi":            "This is a SCI-FI project. Directions should explore speculative futures, technology, and the unknown. Visual styles should feel vast, cold, and conceptually bold.",
    "horror":            "This is a HORROR project. Directions should build dread, not just shock. Lean into psychological tension, atmosphere, and the unknown. Avoid gratuitous descriptions.",
    "fantasy":           "This is a FANTASY project. Directions should embrace mythic scope, magic systems, and epic world-building. Visual styles should feel grand and otherworldly.",
    "dark fantasy":      "This is a DARK FANTASY project. Directions should blend epic fantasy with horror — dark magic, morally ambiguous heroes, gothic landscapes, and threatening supernatural forces.",
    "action":            "This is an ACTION project. Directions should emphasize kinetic set pieces, physical stakes, and relentless momentum. Keep tension high and pacing tight.",
    "thriller":          "This is a THRILLER project. Directions should build mounting tension and paranoia. Every scene should escalate the stakes with psychological pressure and uncertainty.",
    "mystery":           "This is a MYSTERY project. Directions should layer clues, misdirection, and revelation. Build curiosity and suspense through withheld information.",
    "crime":             "This is a CRIME project. Directions should explore morally complex characters in high-stakes criminal worlds. Gritty realism, street-level detail, and consequence.",
    "drama":             "This is a DRAMA project. Directions should focus on deep character relationships and emotional truth. Quiet moments carry as much weight as climaxes.",
    "romance":           "This is a ROMANCE project. Directions should center emotional connection, longing, and vulnerability. Visual style should feel intimate and tender.",
    "comedy":            "This is a COMEDY project. Directions should embrace timing, character-driven humor, and relatable situations. Keep tone light and energetic.",
    "dark comedy":       "This is a DARK COMEDY project. Directions should balance absurdist humor with uncomfortable truths. Tone should be dry, satirical, and unexpected.",
    "western":           "This is a WESTERN project. Directions should embrace frontier mythology — wide open landscapes, moral codes, and the tension between civilization and lawlessness.",
    "historical":        "This is a HISTORICAL project. Directions should ground the story in authentic period detail — costumes, language, and the human stakes of a specific era.",
    "superhero":         "This is a SUPERHERO project. Directions should balance epic spectacle with personal identity. Great power versus personal sacrifice and responsibility.",
    "cyberpunk":         "This is a CYBERPUNK project. Directions should explore the intersection of humanity and technology in dystopian urban futures. Neon noir, corporate power, and resistance.",
    "post-apocalyptic":  "This is a POST-APOCALYPTIC project. Directions should explore survival, hope, and what humanity preserves or loses after collapse. Desolate landscapes and scarce resources.",
    "noir":              "This is a NOIR project. Directions should embrace moral ambiguity, fatalism, and shadow. Crime, deception, and doomed protagonists in rain-soaked urban settings.",
    "psychological":     "This is a PSYCHOLOGICAL project. Directions should explore the interior of the mind — perception, obsession, and the unreliable nature of reality.",
    "supernatural":      "This is a SUPERNATURAL project. Directions should blend the ordinary world with unseen forces — ghosts, spirits, and the uncanny. Atmosphere over explanation.",
    "adventure":         "This is an ADVENTURE project. Directions should embrace discovery, journey, and physical stakes across exotic or fantastical landscapes.",
    "musical":           "This is a MUSICAL project. Directions should integrate music and emotion as narrative tools. Story should build naturally toward musical expression.",
  }[genreKey] || "";

  const userPrompt = `Story idea: "${prompt}"
${genre ? `Genre: ${genre}` : ""}
${tone ? `Tone: ${tone}` : ""}
${characters ? `Characters: ${characters}` : ""}
${genreGuidance ? `\nGenre guidance: ${genreGuidance}` : ""}

Generate exactly this JSON structure:
{
  "directions": [
    {
      "title": "short punchy direction title",
      "arc": "one-word arc type (e.g. Redemption, Revenge, Survival)",
      "synopsis": "2-sentence synopsis of this story direction",
      "hook": "one powerful opening line for the trailer",
      "tone": "emotional tone (e.g. tense, melancholic, triumphant, whimsical, eerie)",
      "pacing": "pacing style (e.g. slow-burn, kinetic, meditative, playful)"
    }
  ],
  "styles": [
    {
      "name": "visual style name",
      "mood": "emotional mood description",
      "camera": "camera style appropriate for the genre (e.g. handheld, wide cinematic, sweeping crane, close-ups)",
      "palette": "color palette description",
      "reference": "film or series reference appropriate for the genre (e.g. Spirited Away, Interstellar, Get Out, The Lord of the Rings)"
    }
  ]
}

Return exactly 3 directions and 5 styles. JSON only.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      messages: [{ role: "user", content: userPrompt }],
      system: systemPrompt,
    });

    const raw = message.content[0].text.trim();
    const text = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const data = JSON.parse(text);
    res.json(data);
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: "Generation failed", details: err.message });
  }
});

app.post("/api/feedback", async (req, res) => {
  const { scenes = [], direction = {}, style = {}, history = [] } = req.body;

  const userPrompt = `You are a sharp film director giving notes after watching a trailer cut.

Story direction: ${JSON.stringify(direction)}
Visual style: ${JSON.stringify(style)}
Scenes: ${JSON.stringify(scenes)}
Previous feedback history: ${JSON.stringify(history)}

Generate 5 director's notes as pointed questions that push the creator to make specific improvements.
Return only this JSON structure:
{
  "questions": [
    {
      "id": "q1",
      "category": "one of: Pacing, Character, Tension, Visual, Narrative",
      "question": "sharp specific director's question",
      "context": "1-sentence explanation of why this matters",
      "options": ["option A", "option B", "option C"],
      "affectedScenes": ["scene id or label"],
      "priority": "one of: high, medium, low"
    }
  ]
}

Return exactly 5 questions. JSON only.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      messages: [{ role: "user", content: userPrompt }],
    });

    const raw = message.content[0].text.trim();
    const text = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const data = JSON.parse(text);
    res.json(data);
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: "Feedback generation failed", details: err.message });
  }
});

app.post("/api/refine", async (req, res) => {
  const { scene = {}, question = {}, answer = "", style = {}, direction = {} } = req.body;

  const userPrompt = `You are a film director refining a single trailer scene based on feedback.

Original scene: ${JSON.stringify(scene)}
Director's question: ${JSON.stringify(question)}
Creator's answer: "${answer}"
Visual style: ${JSON.stringify(style)}
Story direction: ${JSON.stringify(direction)}

Rewrite the scene incorporating the creator's answer. Return only this JSON structure:
{
  "scene": {
    "id": "same id as original scene",
    "label": "short scene label",
    "time": "timecode e.g. 0:04–0:09",
    "desc": "revised cinematic scene description with camera, action, and mood",
    "changeNote": "1-sentence explaining what changed and why it's better"
  }
}

JSON only.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      messages: [{ role: "user", content: userPrompt }],
    });

    const raw = message.content[0].text.trim();
    const text = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const data = JSON.parse(text);
    res.json(data);
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: "Refinement failed", details: err.message });
  }
});

// Shared helper — retries once on 529 overload
async function callClaude(params, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await client.messages.create(params);
    } catch (err) {
      const is529 = err.message && err.message.includes("529");
      if (is529 && i < retries - 1) {
        const delay = 15000 * (i + 1); // 15s, 30s
        console.warn(`  Claude overloaded — retrying in ${delay / 1000}s... (attempt ${i + 2}/${retries})`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
}

// Genre-specific video prompt guidance for scene generation
function genreVideoGuidance(genre) {
  const key = (genre || "").toLowerCase();
  const map = {
    "animation":        "Describe scenes as animated visuals — expressive stylized characters, vibrant exaggerated environments. Do NOT describe live-action camera work.",
    "2d animation":     "Describe scenes as 2D hand-drawn animated visuals — flat stylized art, bold outlines, expressive character poses. Reference 2D animation aesthetics.",
    "3d animation":     "Describe scenes as 3D CGI animated visuals — richly rendered environments, expressive character animation, Pixar-quality lighting and textures.",
    "anime":            "Describe scenes as anime animation — bold expressive line art, vibrant saturated colors, dramatic emotional closeups, iconic character designs, and dynamic action composition.",
    "stop motion":      "Describe scenes as stop motion animation — handcrafted puppet textures, deliberate jerky movement, miniature sets, tactile materials, warm practical lighting.",
    "documentary":      "Describe scenes as real-world documentary footage — observational framing, natural lighting, handheld or static camera, authentic environments.",
    "mockumentary":     "Describe scenes as mockumentary footage — handheld documentary-style camera, talking-head interview setups, naturalistic lighting, fourth-wall-aware framing.",
    "sci-fi":           "Describe scenes with futuristic sci-fi visuals — advanced technology, alien or space environments, cool blue/teal lighting, vast scale.",
    "horror":           "Describe scenes with horror atmosphere — darkness, shadows, unsettling framing, tension-building imagery. Avoid explicit gore.",
    "fantasy":          "Describe scenes as epic fantasy visuals — mythic landscapes, magical elements, grand scale, rich costume and world-building detail.",
    "dark fantasy":     "Describe scenes as dark fantasy visuals — gothic architecture, dark magic effects, threatening supernatural creatures, desaturated palette with deep shadows and ember tones.",
    "action":           "Describe scenes as high-octane action footage — kinetic handheld camera, fast cutting, motion blur, practical stunt work, dynamic blocking and explosive set pieces.",
    "thriller":         "Describe scenes as tense thriller cinematography — tight close-ups, high-contrast shadows, paranoid over-shoulder framing, cold desaturated palette, oppressive environments.",
    "mystery":          "Describe scenes as mystery cinematography — muted palette, deliberate slow push-ins, obscured subjects, fog and shadow concealing details, curious observational framing.",
    "crime":            "Describe scenes as crime drama footage — gritty urban environments, harsh practical lighting, low angles, rain-slicked streets, documentary-influenced handheld work.",
    "drama":            "Describe scenes as intimate drama cinematography — natural lighting, medium close-ups, shallow depth of field, soft color grading, emotionally reactive camera movement.",
    "romance":          "Describe scenes as romantic cinematography — warm golden-hour light, soft bokeh, intimate two-shots, slow languid movement, rich saturated color palette.",
    "comedy":           "Describe scenes as bright comedy cinematography — even lighting, wide shots that capture full body performance, warm color grading, energetic and observational framing.",
    "dark comedy":      "Describe scenes as dark comedy cinematography — deadpan static framing, cold institutional lighting, absurdist staging, deliberate ironic visual juxtapositions.",
    "western":          "Describe scenes as classic western cinematography — sweeping landscape wide shots, golden dusty light, extreme close-ups on faces and hands, low horizon lines.",
    "historical":       "Describe scenes as period historical cinematography — natural and candle lighting, desaturated warm palette, authentic period costumes and environments, painterly composition.",
    "superhero":        "Describe scenes as superhero cinematography — dynamic Dutch angles, sweeping crane shots, bold primary color palette, high-contrast lighting, spectacular action staging.",
    "cyberpunk":        "Describe scenes as cyberpunk cinematography — neon-lit rain-soaked streets, harsh artificial lighting, tight urban spaces, blue/purple/magenta color palette, lens flares.",
    "post-apocalyptic": "Describe scenes as post-apocalyptic cinematography — washed-out desaturated color, harsh daylight or firelight, ruined environments, dust and debris, wide desolate landscapes.",
    "noir":             "Describe scenes as classic noir cinematography — stark high-contrast shadows, venetian blind light patterns, rain-slicked streets at night, smoke-filled rooms, expressionist lighting.",
    "psychological":    "Describe scenes as psychological thriller cinematography — unstable handheld movement, distorted angles, surreal visual effects, fractured mirrors, harsh clinical lighting.",
    "supernatural":     "Describe scenes as supernatural cinematography — cold blue atmosphere, practical shadow effects, glimpsed figures, flickering practical light, quiet dread in everyday spaces.",
    "adventure":        "Describe scenes as epic adventure cinematography — sweeping landscapes, dynamic tracking shots, warm natural light, bold compositions, physical environments with scale and grandeur.",
    "musical":          "Describe scenes as cinematic musical — theatrical lighting, stylized movement, vibrant saturated color, choreographed blocking, expressive emotional staging.",
  };
  return map[key] || "Describe scenes as cinematic live-action footage — realistic environments, professional camera work.";
}

// Shared scene generator — called by both /api/scenes and /api/generate-trailer
async function generateScenes({ prompt = "", direction = {}, style = {}, characters = "", genre = "" }) {
  const activeGenre = genre || direction?.genre || "Live Action";
  const videoGuide  = genreVideoGuidance(activeGenre);

  const userPrompt = `You are a cinematographer and screenwriter breaking a story into individual trailer scenes.

Story prompt: "${prompt}"
Story direction: ${JSON.stringify(direction)}
Visual style: ${JSON.stringify(style)}
Genre: ${activeGenre}
${characters ? `Characters: ${characters}` : ""}

VIDEO PROMPT STYLE GUIDE: ${videoGuide}

Break this into exactly 6 trailer scenes, each 5–8 seconds long.
Each scene needs a detailed video generation prompt — specific enough for an AI video model.
Include: character appearance, camera movement, lighting, action, atmosphere, and genre-appropriate visual style.

Return only this JSON:
{
  "scenes": [
    {
      "id": "s1",
      "time": "0:00–0:06",
      "label": "short scene label",
      "videoPrompt": "detailed description for AI video generation matching the genre style — camera angle, subject, action, lighting, color, mood. At least 40 words.",
      "mood": "single emotional word",
      "duration": 6
    }
  ]
}

Return exactly 6 scenes totaling ~50 seconds. JSON only.`;

  const message = await callClaude({
    model: "claude-sonnet-4-5",
    max_tokens: 2048,
    messages: [{ role: "user", content: userPrompt }],
  });

  const raw = message.content[0].text.trim();
  const text = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  return JSON.parse(text);
}

// Scene Script Generator
app.post("/api/scenes", async (req, res) => {
  try {
    const data = await generateScenes(req.body); // genre passed through req.body automatically
    res.json(data);
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: "Scene generation failed", details: err.message });
  }
});

// Day 12 — Full pipeline: brief → trailer.mp4
app.post("/api/generate-trailer", async (req, res) => {
  const { prompt, genre, tone, characters, direction, style } = req.body;

  if (!prompt && !direction) {
    return res.status(400).json({ error: "prompt or direction is required" });
  }

  const projectId = uuidv4();
  console.log(`\n${"=".repeat(60)}`);
  console.log(`TRAILER GENERATION STARTED — project: ${projectId}`);
  console.log(`Prompt: "${prompt}"`);
  console.log("=".repeat(60));

  try {
    // Step 1 — Scene scripts (B9)
    console.log("\n[1/5] Generating scene scripts...");
    const { scenes } = await generateScenes({ prompt, direction, style, characters, genre });
    console.log(`✓ ${scenes.length} scenes generated`);
    scenes.forEach(s => console.log(`  ${s.id} [${s.time}] ${s.label}`));

    // Step 2 — Video clips (B10)
    console.log("\n[2/5] Generating video clips via Kling/Fal.ai...");
    let scenesWithVideo;
    if (!process.env.FAL_API_KEY || process.env.FAL_API_KEY.includes("your-")) {
      console.warn("  FAL_API_KEY not set — skipping real video, using mock URLs");
      scenesWithVideo = scenes.map(s => ({ ...s, videoUrl: null }));
    } else {
      try {
        scenesWithVideo = await generateAllScenes(scenes);
      } catch (videoErr) {
        console.warn("  Video generation failed:", videoErr.message, "— continuing without clips");
        scenesWithVideo = scenes.map(s => ({ ...s, videoUrl: null }));
      }
    }
    const videoUrls = scenesWithVideo.map(s => s.videoUrl).filter(Boolean);
    console.log(`✓ ${videoUrls.length}/${scenes.length} video clips ready`);

    // Step 3 — Narration (B11)
    console.log("\n[3/5] Generating narration...");
    const activeDirection = direction || { title: prompt, tone: tone || "dramatic" };
    const narration = await generateNarration(activeDirection, tone, projectId);
    if (narration.warning) console.warn("  Warning:", narration.warning);
    else console.log(`✓ Narration saved: ${narration.path}`);

    // Step 4 — Music (B12)
    console.log("\n[4/5] Generating music score...");
    const score = await generateScore(activeDirection, tone, genre);
    console.log(`✓ Score: ${score.trackName} (mood: ${score.mood}, source: ${score.source})`);

    // Step 5 — Assemble (B13) — only if we have video clips
    let trailerPath = null;
    if (videoUrls.length > 0) {
      console.log("\n[5/5] Assembling trailer...");
      trailerPath = await assembleTrailer({
        sceneVideoUrls: videoUrls,
        narrationPath: narration.path,
        scorePath: score.path,
        projectId,
      });
      console.log(`✓ Trailer assembled: ${trailerPath}`);
    } else {
      console.log("\n[5/5] Skipped assembly — no video clips (add FAL_API_KEY to generate real footage)");
    }

    console.log(`\n${"=".repeat(60)}`);
    console.log("GENERATION COMPLETE");
    console.log("=".repeat(60));

    res.json({
      projectId,
      scenes: scenesWithVideo,
      narration: { script: narration.script, path: narration.path },
      music: { track: score.trackName, mood: score.mood, source: score.source },
      trailerPath,
      status: trailerPath ? "complete" : "scenes_only",
    });

  } catch (err) {
    console.error("\nPIPELINE ERROR:", err.message);
    res.status(500).json({ error: "Trailer generation failed", details: err.message, projectId });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
