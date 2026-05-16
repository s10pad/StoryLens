# StoryLens — Project Tracker

> Update this file every session. It is the single source of truth for what's done, what's broken, and what's next.

---

## Status — Last Updated: 2026-05-14

**Current phase:** Week 3 complete — full pipeline built, not yet deployed  
**Next session starts at:** Day 13 — Push to GitHub

---

## What's Done ✓

### Week 1 — The Brain
- [x] **Day 1** — Project setup: `npm init`, dependencies installed, `.env` created
- [x] **Day 2** — `POST /api/directions` — 3 story directions + 5 visual styles via Claude
- [x] **Day 3** — `POST /api/feedback` + `POST /api/refine` — director's notes + scene refinement

### Week 2 — The Interface
- [x] **Day 4** — Next.js 16 frontend scaffolded (`frontend/`)
- [x] **Day 5** — `/studio` — 7-stage creative studio (prompt → directions → styles → review → feedback → result → final-cut)
- [x] **Day 6** — `/` landing page (hero, rotating examples, how it works, features, pricing)
- [x] **Day 7** — API proxy route at `/api/proxy/[...path]` (used in production)

### Week 3 — The Pipeline
- [x] **Day 8** — `POST /api/scenes` — 6 scene scripts with detailed video prompts
- [x] **Day 9** — `b10-video.js` — Kling 2.5 via Fal.ai, parallel generation, polls every 8s
- [x] **Day 10** — `b11-narration.js` (ElevenLabs) + `b12-music.js` (local mood-matched tracks)
- [x] **Day 11** — `b13-assembler.js` — FFmpeg concat + audio mix + 2s fade out
- [x] **Day 12** — `POST /api/generate-trailer` — full orchestration route, 5-step pipeline

---

## Known Issues / Blockers

| Issue | Status | Notes |
|---|---|---|
| Anthropic API 529 overload errors | Intermittent | Retry logic in place (3 attempts, 15/30s backoff). Not a code bug — peak traffic. |
| ElevenLabs key missing `text_to_speech` permission | Needs fix | Regenerate key at elevenlabs.io with correct permission checked |
| Fal.ai video not tested end-to-end | Pending | Need to run a real generation once Claude API stabilizes |
| Suno replaced | Done | Using local royalty-free MP3s in `music/` — no API needed |

---

## What's Next

### Week 4 — Deploy
- [ ] **Day 13** — `.gitignore` + push to GitHub
- [ ] **Day 14** — Deploy frontend to Vercel
- [ ] **Day 15** — Deploy backend to Render + Cloudflare R2 storage

### Remaining Builds (Weeks 4–16)
- [ ] **B14** — Trailer player + scene timeline (click scene to re-generate)
- [ ] **B15** — AI feedback panel wired to live video trailer
- [ ] **B16** — Version history stack (drawer + side-by-side compare)
- [ ] **B17** — Final cut declaration
- [ ] **B18** — Export screen (1080p/4K, download, share link)
- [ ] **B19** — Project dashboard (grid of saved projects)
- [ ] **B20** — Auth — Clerk (Google OAuth + email)
- [ ] **B21** — Billing — Stripe (credit packs + subscription)
- [ ] **B22** — Onboarding flow (first-time user → wow moment in <2 min)

---

## Feature Backlog (add next session)

- [ ] **More genres in Studio** — currently only 8. Add: Animation, Cartoon, 2D Animation, 3D Animation, Anime, Documentary, Western, Musical, Comedy, Psychological Thriller, Crime, Superhero, Historical, Sports, Biographical, War, Disaster, Heist, Road Movie, Coming-of-Age
- [ ] **More tones** — add: Satirical, Surreal, Nostalgic, Gritty, Whimsical, Suspenseful, Bittersweet
- [ ] **Genre-aware video prompts** — animated genres should generate prompts styled for animation AI models, not live-action

---

## Architecture At a Glance

```
storylens/
├── server.js          ← Express API (port 3001) — all routes
├── b10-video.js       ← Kling video generation via Fal.ai
├── b11-narration.js   ← Claude script + ElevenLabs TTS
├── b12-music.js       ← Local mood-matched music picker
├── b13-assembler.js   ← FFmpeg trailer assembly
├── music/             ← 5 royalty-free MP3s (tense, dark, melancholic, epic, hopeful)
├── frontend/          ← Next.js 16 app
│   └── app/
│       ├── page.tsx           ← Landing page
│       ├── studio/page.jsx    ← 7-stage creative studio
│       └── api/proxy/[...path]/route.js  ← Backend proxy
├── .env               ← API keys (never commit)
└── README.md          ← Full project documentation
```

## Tech Stack

| Layer | Tech |
|---|---|
| Story AI | Claude `claude-sonnet-4-5` |
| Video | Kling 2.5 via Fal.ai |
| Voice | ElevenLabs Rachel voice |
| Music | Local royalty-free MP3s (Suno replaced) |
| Assembly | FFmpeg (system-installed) |
| Backend | Node.js + Express |
| Frontend | Next.js 16 (App Router) |
| Hosting (planned) | Vercel (frontend) + Render (backend) |
| Storage (planned) | Cloudflare R2 |

## API Keys (status)

| Key | Status |
|---|---|
| `ANTHROPIC_API_KEY` | ✓ Working (intermittent 529 overload) |
| `FAL_API_KEY` | ✓ Set (format: `key_id:key_secret`) — not tested live yet |
| `ELEVENLABS_API_KEY` | ⚠ Set but missing `text_to_speech` permission — regenerate |
