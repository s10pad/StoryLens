# StoryLens

**AI story trailer generator.** Type an idea, get a cinematic trailer — story directions, visual styles, scene scripts, narration, music, and AI-generated video footage.

---

## What's Built

### Backend — `server.js` (Express, port 3001)

| Route | What it does |
|---|---|
| `GET /` | Health check — confirms server is up |
| `POST /api/directions` | Takes a story prompt → returns 3 story directions + 5 visual styles |
| `POST /api/feedback` | Takes scenes + direction → returns 5 sharp director's notes as questions |
| `POST /api/refine` | Takes a scene + director answer → returns a rewritten scene |
| `POST /api/scenes` | Takes prompt + direction + style → returns 6 detailed scene scripts |
| `POST /api/generate-trailer` | Full pipeline: prompt → scenes → video → narration → music → trailer.mp4 |

### Pipeline Modules

| File | Purpose |
|---|---|
| `b10-video.js` | Generates video clips via Kling 2.5 on Fal.ai — runs all 6 scenes in parallel |
| `b11-narration.js` | Writes a 40-word voiceover script via Claude, converts to MP3 via ElevenLabs |
| `b12-music.js` | Picks a mood-matched royalty-free music track from `music/` — no API needed |
| `b13-assembler.js` | FFmpeg pipeline: concatenates clips, mixes narration (100%) + music (25%), fades out |

### Frontend — `frontend/` (Next.js 16, port 3000)

| Page | What it does |
|---|---|
| `/` | Landing page — hero, rotating examples, how it works, features, pricing |
| `/studio` | 7-stage creative studio: prompt → directions → styles → review → feedback → result → final cut |
| `/api/proxy/[...path]` | Proxy route — forwards frontend requests to backend (used in production) |

### Music Library — `music/`

5 royalty-free tracks mapped by mood. Drop any MP3 here and add it to `b12-music.js` to expand.

| File | Mood |
|---|---|
| `tense.mp3` | Tense, urgent, survival |
| `dark.mp3` | Dark, revenge, menacing |
| `melancholic.mp3` | Melancholic, dreamlike, sad |
| `epic.mp3` | Epic, triumphant, action |
| `hopeful.mp3` | Hopeful, romantic, redemption |

---

## How to Run

### Prerequisites
- Node.js 18+
- FFmpeg installed and on PATH (`ffmpeg --version` to confirm)

### Start the backend
```bash
cd storylens
node server.js
# → Server running on port 3001
```

### Start the frontend (separate terminal)
```bash
cd frontend
npm run dev
# → http://localhost:3000
```

### Open the app
- **App:** http://localhost:3000
- **Studio:** http://localhost:3000/studio
- **API health:** http://localhost:3001

---

## Environment Variables (`.env`)

```
ANTHROPIC_API_KEY=     # Required — Claude story AI
PORT=3001              # Backend port

FAL_API_KEY=           # Kling video generation via Fal.ai (key_id:key_secret format)
ELEVENLABS_API_KEY=    # Voiceover generation — needs text_to_speech permission
```

> **ElevenLabs key:** Must be generated with **text_to_speech** permission checked. Regenerate at elevenlabs.io → Profile → API Keys if it's missing.
> **Fal.ai key format:** `ACCESS_KEY:SECRET_KEY` — not two separate values.

---

## Full Pipeline Flow (`/api/generate-trailer`)

```
User brief (prompt + genre + tone + characters + direction + style)
    │
    ├─ [1] generateScenes()      → 6 scene scripts with video prompts
    ├─ [2] generateAllScenes()   → 6 MP4 clips via Kling (skipped if no FAL key)
    ├─ [3] generateNarration()   → voiceover script + MP3 via ElevenLabs
    ├─ [4] generateScore()       → mood-matched local music track
    └─ [5] assembleTrailer()     → final trailer.mp4 via FFmpeg
              ├─ concat 6 clips
              ├─ mix narration (100%) + music (25%)
              └─ 2-second fade out
```

Pipeline is fault-tolerant: missing ElevenLabs key → skips narration audio but keeps script. Missing Fal key → returns scene scripts only, skips assembly.

---

## AI Models Used

| Task | Model |
|---|---|
| Story directions, feedback, refinement, narration script | `claude-sonnet-4-5` |
| Video generation | Kling 2.5 via `fal-ai/kling-video/v2-5/standard/text-to-video` |
| Voice synthesis | ElevenLabs Rachel (`EXAVITQu4vr4xnSDxMaL`) |

---

## What's Left to Build (Weeks 4+)

- **Day 13** — Push to GitHub
- **Day 14** — Deploy frontend to Vercel
- **Day 15** — Deploy backend to Render + Cloudflare R2 file storage
- **B14** — Trailer player with scene timeline (click to re-generate individual scenes)
- **B15** — AI feedback panel wired to live trailer
- **B16** — Version history stack
- **B17** — Final cut declaration screen
- **B18** — Export screen (resolution picker, download, share link)
- **B19** — Project dashboard
- **B20** — Auth (Clerk — Google OAuth + email)
- **B21** — Credit billing (Stripe)
- **B22** — Onboarding flow
