"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const API = "http://localhost:3001";

type Direction = { title: string; arc: string; synopsis: string; hook: string; tone: string; pacing: string };
type Style     = { name: string; mood: string; camera: string; palette: string; reference: string };
type Scene     = { id: string; time: string; label: string; videoPrompt: string; mood: string; duration: number; videoUrl?: string };
type Question  = { id: string; category: string; question: string; context: string; options: string[]; priority: string; affectedScenes?: string[] };
type Step      = "brief" | "directions" | "scenes" | "pipeline";

export default function Studio() {
  // Inputs
  const [prompt,     setPrompt]     = useState("");
  const [genre,      setGenre]      = useState("Live Action");
  const [tone,       setTone]       = useState("Tense");
  const [characters, setCharacters] = useState("");
  const [genres,     setGenres]     = useState<string[]>([]);

  // Flow
  const [step,    setStep]    = useState<Step>("brief");
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState("");
  const [error,   setError]   = useState("");

  // Results
  const [directions,    setDirections]    = useState<Direction[]>([]);
  const [styles,        setStyles]        = useState<Style[]>([]);
  const [pickedDir,     setPickedDir]     = useState<Direction | null>(null);
  const [pickedStyle,   setPickedStyle]   = useState<Style | null>(null);
  const [scenes,        setScenes]        = useState<Scene[]>([]);
  const [questions,     setQuestions]     = useState<Question[]>([]);
  const [trailerResult, setTrailerResult] = useState<any>(null);
  const [pipelineLog,   setPipelineLog]   = useState<{ text: string; type: "ok" | "warn" | "info" | "dim" }[]>([]);

  useEffect(() => {
    fetch(`${API}/api/genres`)
      .then(r => r.json())
      .then(d => { if (d.genres?.length) setGenres(d.genres); })
      .catch(() => setGenres(["Live Action","Animation","2D Animation","3D Animation","Anime","Stop Motion","Documentary","Mockumentary","Sci-Fi","Horror","Fantasy","Dark Fantasy","Action","Thriller","Mystery","Crime","Drama","Romance","Comedy","Dark Comedy","Western","Historical","Superhero","Cyberpunk","Post-Apocalyptic","Noir","Psychological","Supernatural","Adventure","Musical"]));
  }, []);

  const post = async (path: string, body: object) => {
    const r = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      throw new Error(e.details || e.error || `HTTP ${r.status}`);
    }
    return r.json();
  };

  const run = async (msg: string, fn: () => Promise<void>) => {
    setLoading(true); setLoadMsg(msg); setError("");
    try { await fn(); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); setLoadMsg(""); }
  };

  const addLog = (text: string, type: "ok"|"warn"|"info"|"dim" = "dim") =>
    setPipelineLog(p => [...p, { text, type }]);

  // Actions
  const getDirections = () => run("Generating story directions…", async () => {
    const d = await post("/api/directions", { prompt, genre, tone, characters });
    setDirections(d.directions ?? []);
    setStyles(d.styles ?? []);
    setPickedDir(d.directions?.[0] ?? null);
    setPickedStyle(d.styles?.[0] ?? null);
    setStep("directions");
  });

  const getScenes = () => run("Writing scene scripts…", async () => {
    const d = await post("/api/scenes", { prompt, direction: pickedDir, style: pickedStyle, characters, genre });
    setScenes(d.scenes ?? []);
    setQuestions([]);
    setStep("scenes");
  });

  const getFeedback = () => run("Getting director's notes…", async () => {
    const d = await post("/api/feedback", { scenes, direction: pickedDir, style: pickedStyle });
    setQuestions(d.questions ?? []);
  });

  const generateTrailer = () => run("Running pipeline…", async () => {
    setPipelineLog([]);
    setStep("pipeline");
    addLog("Starting generation pipeline…", "info");
    addLog(`Genre: ${genre}  ·  Tone: ${tone || pickedDir?.tone || "—"}  ·  Direction: "${pickedDir?.title}"`, "dim");

    const t0 = Date.now();
    const d  = await post("/api/generate-trailer", { prompt, genre, tone, characters, direction: pickedDir, style: pickedStyle });
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

    addLog(`Pipeline complete — ${elapsed}s`, "ok");
    addLog(`Scenes: ${d.scenes?.length ?? 0}  ·  Clips: ${d.scenes?.filter((s: Scene) => s.videoUrl).length ?? 0}/${d.scenes?.length ?? 0}`, "dim");
    addLog(`Narration: ${d.narration?.script ? "script ready" : "skipped (no ElevenLabs key)"}`, d.narration?.script ? "ok" : "warn");
    addLog(`Music: ${d.music?.track ?? "—"}  (${d.music?.source ?? "—"})`, "ok");
    addLog(`Trailer: ${d.trailerPath ?? "assembly skipped — no video clips"}`, d.trailerPath ? "ok" : "warn");
    addLog(`Status: ${d.status}`, "dim");

    setTrailerResult(d);
    if (d.scenes?.length) setScenes(d.scenes);
  });

  const reset = () => {
    setStep("brief"); setDirections([]); setStyles([]); setPickedDir(null);
    setPickedStyle(null); setScenes([]); setQuestions([]); setTrailerResult(null);
    setPipelineLog([]); setError("");
  };

  const STEPS: Step[] = ["brief", "directions", "scenes", "pipeline"];

  return (
    <div style={css.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #06060a; }
        select, input, textarea { font-family: 'JetBrains Mono', monospace !important; }
        select option { background: #0a0a14; }
        .card-pick:hover { border-color: #e8c54766 !important; cursor: pointer; }
        .card-pick.active { border-color: #e8c547 !important; background: #0d0d1a !important; }
        .btn-primary:hover { background: #f0d060 !important; }
        .btn-secondary:hover { border-color: #e8c547 !important; color: #e8c547 !important; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #1a1a28; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>

      {/* Nav */}
      <nav style={css.nav}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <div style={css.navLogo}>Story<span style={{ color: "#e8c547" }}>Lens</span> <span style={css.navBadge}>Studio</span></div>
        </Link>
        <div style={css.stepBar}>
          {STEPS.map((s, i) => {
            const done    = STEPS.indexOf(step) > i;
            const active  = step === s;
            return (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ ...css.stepDot, background: active ? "#e8c547" : done ? "#2ecc71" : "#1a1a28", color: active || done ? "#000" : "#444" }}>
                  {done ? "✓" : i + 1}
                </div>
                <span style={{ fontSize: 10, color: active ? "#e8c547" : done ? "#2ecc71" : "#333", letterSpacing: "0.1em", textTransform: "uppercase" }}>{s}</span>
                {i < 3 && <div style={{ width: 28, height: 1, background: done ? "#2ecc7155" : "#1a1a28", marginLeft: 6 }} />}
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 10, color: "#333", letterSpacing: "0.05em" }}>{genre}</div>
      </nav>

      {/* Error */}
      {error && (
        <div style={css.errorBar}>
          <span>⚠ {error}</span>
          <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#e74c3c", cursor: "pointer", fontSize: 14 }}>✕</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={css.loadBar}>
          <span style={{ animation: "blink 1s infinite" }}>◉</span> {loadMsg}
        </div>
      )}

      <main style={css.main}>

        {/* ─── BRIEF ──────────────────────────────────────────────────────── */}
        {step === "brief" && (
          <div style={css.panel}>
            <Eyebrow>Step 01</Eyebrow>
            <h1 style={css.panelTitle}>What's your story?</h1>
            <p style={css.panelSub}>Give us a premise. StoryLens will generate directions, scenes, narration, and music.</p>

            <Field label="Story Premise *">
              <textarea
                style={{ ...css.input, minHeight: 80, resize: "vertical" }}
                placeholder="A disgraced detective returns to the town she fled 20 years ago to find it unchanged — except for the body."
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
              />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Genre">
                <select style={css.input} value={genre} onChange={e => setGenre(e.target.value)}>
                  {genres.map(g => <option key={g}>{g}</option>)}
                </select>
              </Field>
              <Field label="Tone">
                <select style={css.input} value={tone} onChange={e => setTone(e.target.value)}>
                  {["Tense","Dark","Hopeful","Melancholic","Epic","Intimate","Urgent","Dreamlike","Eerie","Haunting","Whimsical","Gritty","Suspenseful","Romantic","Humorous","Satirical","Lyrical","Brutal","Mysterious","Nostalgic"].map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Characters (optional)">
              <input style={css.input} placeholder="e.g. Maya — 30s detective, haunted by past" value={characters} onChange={e => setCharacters(e.target.value)} />
            </Field>

            <button className="btn-primary" style={{ ...css.btnPrimary, marginTop: 32, opacity: (!prompt.trim() || loading) ? 0.35 : 1 }}
              disabled={!prompt.trim() || loading} onClick={getDirections}>
              Generate Directions →
            </button>
          </div>
        )}

        {/* ─── DIRECTIONS ─────────────────────────────────────────────────── */}
        {step === "directions" && (
          <div style={css.panel}>
            <div style={css.panelNav}>
              <div><Eyebrow>Step 02</Eyebrow><h1 style={css.panelTitle}>Pick your direction</h1></div>
              <button style={css.backBtn} onClick={() => setStep("brief")}>← Back</button>
            </div>
            <p style={css.panelSub}>Three arcs and five visual styles for <em style={{ color: "#aaa" }}>{prompt.slice(0, 60)}{prompt.length > 60 ? "…" : ""}</em></p>

            <Label>Story Direction</Label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 10, marginBottom: 32 }}>
              {directions.map((d, i) => (
                <div key={i} className={`card-pick${pickedDir === d ? " active" : ""}`}
                  style={pickedDir === d ? { ...css.dirCard, ...css.dirCardActive } : css.dirCard}
                  onClick={() => setPickedDir(d)}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={css.arcBadge}>{d.arc}</span>
                    {pickedDir === d && <span style={{ fontSize: 9, color: "#2ecc71", letterSpacing: "0.1em" }}>SELECTED</span>}
                  </div>
                  <div style={css.dirTitle}>{d.title}</div>
                  <div style={css.dirSynopsis}>{d.synopsis}</div>
                  <div style={css.dirHook}>"{d.hook}"</div>
                  <div style={{ display: "flex", gap: 12, fontSize: 10, color: "#444", marginTop: 10 }}>
                    <span>🎭 {d.tone}</span>
                    <span>⏱ {d.pacing}</span>
                  </div>
                </div>
              ))}
            </div>

            <Label>Visual Style</Label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginTop: 10, marginBottom: 32 }}>
              {styles.map((st, i) => (
                <div key={i} className={`card-pick${pickedStyle === st ? " active" : ""}`}
                  style={pickedStyle === st ? { ...css.styleCard, ...css.dirCardActive } : css.styleCard}
                  onClick={() => setPickedStyle(st)}>
                  {pickedStyle === st && <div style={{ fontSize: 9, color: "#2ecc71", marginBottom: 6, letterSpacing: "0.1em" }}>SELECTED</div>}
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#ddd", marginBottom: 6 }}>{st.name}</div>
                  <div style={{ fontSize: 11, color: "#555", lineHeight: 1.5, marginBottom: 6 }}>{st.mood}</div>
                  <div style={{ fontSize: 10, color: "#444" }}>📽 {st.camera}</div>
                  <div style={{ fontSize: 10, color: "#e8c54799", marginTop: 6 }}>ref: {st.reference}</div>
                </div>
              ))}
            </div>

            <button className="btn-primary" style={{ ...css.btnPrimary, opacity: (!pickedDir || !pickedStyle || loading) ? 0.35 : 1 }}
              disabled={!pickedDir || !pickedStyle || loading} onClick={getScenes}>
              Write Scenes →
            </button>
          </div>
        )}

        {/* ─── SCENES ─────────────────────────────────────────────────────── */}
        {step === "scenes" && (
          <div style={css.panel}>
            <div style={css.panelNav}>
              <div><Eyebrow>Step 03</Eyebrow><h1 style={css.panelTitle}>Scene breakdown</h1></div>
              <button style={css.backBtn} onClick={() => setStep("directions")}>← Back</button>
            </div>
            <p style={css.panelSub}>{scenes.length} scenes · <em style={{ color: "#777" }}>{pickedDir?.title}</em> · <em style={{ color: "#777" }}>{pickedStyle?.name}</em></p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
              {scenes.map((sc, i) => (
                <div key={sc.id} style={css.sceneRow}>
                  <div style={css.sceneIndex}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                      <strong style={{ fontSize: 13, color: "#ddd" }}>{sc.label}</strong>
                      <span style={css.timeBadge}>{sc.time}</span>
                      <span style={css.moodBadge}>{sc.mood}</span>
                    </div>
                    <p style={{ fontSize: 12, color: "#555", lineHeight: 1.7 }}>{sc.videoPrompt}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Director's Notes */}
            {questions.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <Label>Director's Notes</Label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                  {questions.map(q => (
                    <div key={q.id} style={css.qCard}>
                      <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                        <span style={{ ...css.priorityBadge, ...priorityColor(q.priority) }}>{q.priority}</span>
                        <span style={css.catBadge}>{q.category}</span>
                      </div>
                      <div style={{ fontSize: 13, color: "#ccc", marginBottom: 4 }}>{q.question}</div>
                      <div style={{ fontSize: 11, color: "#555" }}>{q.context}</div>
                      {q.options?.length > 0 && (
                        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                          {q.options.map((opt, oi) => (
                            <span key={oi} style={css.optionChip}>{opt}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button className="btn-secondary" style={css.btnSecondary} disabled={loading} onClick={getFeedback}>
                {questions.length ? "Refresh Notes" : "Get Director's Notes"}
              </button>
              <button className="btn-primary" style={css.btnPrimary} disabled={loading} onClick={generateTrailer}>
                Generate Full Trailer →
              </button>
            </div>
          </div>
        )}

        {/* ─── PIPELINE ───────────────────────────────────────────────────── */}
        {step === "pipeline" && (
          <div style={css.panel}>
            <div style={css.panelNav}>
              <div><Eyebrow>Step 04</Eyebrow><h1 style={css.panelTitle}>Trailer pipeline</h1></div>
              <button style={css.backBtn} onClick={() => setStep("scenes")}>← Back</button>
            </div>

            {/* Live terminal */}
            <div style={css.terminal}>
              {pipelineLog.length === 0 && loading && <span style={{ color: "#333" }}>Initialising…</span>}
              {pipelineLog.map((l, i) => (
                <div key={i} style={{ color: logColor(l.type), lineHeight: 1.9 }}>
                  {l.type === "ok" ? "✓ " : l.type === "warn" ? "⚠ " : "  "}{l.text}
                </div>
              ))}
              {loading && <span style={{ color: "#e8c547", animation: "blink 1s infinite" }}>_</span>}
            </div>

            {/* Results */}
            {trailerResult && !loading && (
              <div style={{ marginTop: 28 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>

                  <ResultBlock title="🎙 Narration">
                    {trailerResult.narration?.script
                      ? <p style={{ fontSize: 13, color: "#aaa", fontStyle: "italic", lineHeight: 1.8 }}>"{trailerResult.narration.script}"</p>
                      : <p style={css.dimNote}>Script generated but audio skipped — add ELEVENLABS_API_KEY to render voiceover.</p>}
                  </ResultBlock>

                  <ResultBlock title="🎵 Music">
                    <Row label="Track" value={trailerResult.music?.track ?? "—"} />
                    <Row label="Mood"  value={trailerResult.music?.mood  ?? "—"} />
                    <Row label="Source" value={trailerResult.music?.source ?? "—"} accent={trailerResult.music?.source === "fal.ai"} />
                  </ResultBlock>

                  <ResultBlock title="🎞 Video Clips">
                    {trailerResult.scenes?.map((sc: Scene, i: number) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0", borderBottom: "1px solid #0f0f18" }}>
                        <span style={{ color: "#666" }}>{sc.label}</span>
                        <span style={{ color: sc.videoUrl ? "#2ecc71" : "#2a2a38" }}>{sc.videoUrl ? "✓ ready" : "pending FAL_API_KEY"}</span>
                      </div>
                    ))}
                  </ResultBlock>

                  <ResultBlock title="📽 Output">
                    {trailerResult.trailerPath
                      ? <>
                          <div style={{ color: "#2ecc71", fontWeight: 700, fontSize: 13, marginBottom: 8 }}>✓ Trailer assembled</div>
                          <div style={{ fontSize: 11, color: "#333", wordBreak: "break-all" }}>{trailerResult.trailerPath}</div>
                        </>
                      : <p style={css.dimNote}>Assembly requires video clips. Add FAL_API_KEY to generate footage — the rest of the pipeline (narration, music, scenes) is complete.</p>
                    }
                    <div style={{ fontSize: 10, color: "#2a2a38", marginTop: 10 }}>status: {trailerResult.status}</div>
                  </ResultBlock>
                </div>

                <button style={{ ...css.btnSecondary, fontSize: 11 }} onClick={reset}>← Start New Trailer</button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ── Tiny helpers ──────────────────────────────────────────────────────────────
function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 9, color: "#e8c547", letterSpacing: "0.3em", marginBottom: 10 }}>{children}</div>;
}
function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 9, color: "#444", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4 }}>{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 16 }}><Label>{label}</Label>{children}</div>;
}
function ResultBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#0a0a14", border: "1px solid #111", borderRadius: 10, padding: "18px 20px" }}>
      <div style={{ fontSize: 11, color: "#555", letterSpacing: "0.1em", marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}
function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid #0f0f18" }}>
      <span style={{ color: "#444" }}>{label}</span>
      <span style={{ color: accent ? "#e8c547" : "#888" }}>{value}</span>
    </div>
  );
}
const logColor = (t: string) => ({ ok: "#2ecc71", warn: "#f39c12", info: "#e8c547", dim: "#444" }[t] ?? "#444");
const priorityColor = (p: string): React.CSSProperties =>
  p === "high"   ? { background: "rgba(231,76,60,0.15)",  color: "#e74c3c" } :
  p === "medium" ? { background: "rgba(243,156,18,0.15)", color: "#f39c12" } :
                   { background: "rgba(255,255,255,0.04)", color: "#555" };

// ── Styles ────────────────────────────────────────────────────────────────────
const css: Record<string, React.CSSProperties> = {
  root:         { fontFamily: "'JetBrains Mono', monospace", background: "#06060a", color: "#ddd8cc", minHeight: "100vh" },
  nav:          { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 40px", borderBottom: "1px solid #0f0f18", position: "sticky", top: 0, background: "#06060aee", backdropFilter: "blur(12px)", zIndex: 10 },
  navLogo:      { fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 900, color: "#fff", textDecoration: "none" },
  navBadge:     { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, background: "#e8c54722", color: "#e8c547", padding: "2px 8px", borderRadius: 4, letterSpacing: "0.15em", marginLeft: 8 },
  stepBar:      { display: "flex", alignItems: "center", gap: 6 },
  stepDot:      { width: 22, height: 22, borderRadius: "50%", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" },
  errorBar:     { background: "rgba(231,76,60,0.12)", borderBottom: "1px solid rgba(231,76,60,0.2)", color: "#e74c3c", padding: "10px 40px", fontSize: 12, display: "flex", justifyContent: "space-between", alignItems: "center" },
  loadBar:      { background: "rgba(232,197,71,0.08)", borderBottom: "1px solid rgba(232,197,71,0.15)", color: "#e8c547", padding: "10px 40px", fontSize: 11, display: "flex", gap: 10, alignItems: "center", letterSpacing: "0.05em" },
  main:         { maxWidth: 960, margin: "0 auto", padding: "48px 40px 80px" },
  panel:        { width: "100%" },
  panelNav:     { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
  panelTitle:   { fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", marginBottom: 8 },
  panelSub:     { fontSize: 13, color: "#444", lineHeight: 1.8, marginBottom: 28 },
  input:        { width: "100%", background: "#0a0a14", border: "1px solid #1a1a28", borderRadius: 6, padding: "10px 14px", color: "#ddd", fontSize: 12, outline: "none", lineHeight: 1.6 },
  btnPrimary:   { background: "#e8c547", color: "#000", border: "none", borderRadius: 6, padding: "12px 28px", fontWeight: 700, fontSize: 11, cursor: "pointer", letterSpacing: "0.05em", fontFamily: "'JetBrains Mono', monospace", transition: "background 0.15s" },
  btnSecondary: { background: "transparent", color: "#666", border: "1px solid #222", borderRadius: 6, padding: "11px 24px", fontWeight: 700, fontSize: 11, cursor: "pointer", letterSpacing: "0.05em", fontFamily: "'JetBrains Mono', monospace", transition: "all 0.15s" },
  backBtn:      { background: "none", border: "none", color: "#333", cursor: "pointer", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.05em" },
  dirCard:      { background: "#0a0a14", borderWidth: 1, borderStyle: "solid", borderColor: "#1a1a28", borderRadius: 10, padding: "18px", transition: "border-color 0.15s" },
  dirCardActive:{ borderColor: "#e8c547", background: "#0d0d1a" },
  dirTitle:     { fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#fff", fontWeight: 700, marginBottom: 8 },
  dirSynopsis:  { fontSize: 11, color: "#555", lineHeight: 1.7, marginBottom: 10 },
  dirHook:      { fontSize: 12, color: "#888", fontStyle: "italic", borderLeft: "2px solid #e8c54744", paddingLeft: 10, lineHeight: 1.6 },
  arcBadge:     { fontSize: 9, fontWeight: 700, background: "rgba(232,197,71,0.1)", color: "#e8c547", padding: "2px 8px", borderRadius: 20, letterSpacing: "0.1em" },
  styleCard:    { background: "#0a0a14", borderWidth: 1, borderStyle: "solid", borderColor: "#1a1a28", borderRadius: 8, padding: "14px", transition: "border-color 0.15s" },
  sceneRow:     { display: "flex", gap: 14, background: "#0a0a14", border: "1px solid #111", borderRadius: 8, padding: "14px 16px" },
  sceneIndex:   { width: 26, height: 26, borderRadius: "50%", background: "#111", color: "#333", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 },
  timeBadge:    { fontSize: 10, background: "#0f0f18", color: "#444", padding: "2px 7px", borderRadius: 4 },
  moodBadge:    { fontSize: 10, background: "rgba(232,197,71,0.08)", color: "#e8c54799", padding: "2px 7px", borderRadius: 4 },
  qCard:        { background: "#0a0a14", border: "1px solid #111", borderRadius: 8, padding: "14px 16px" },
  priorityBadge:{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 20, letterSpacing: "0.1em" },
  catBadge:     { fontSize: 9, color: "#444", background: "rgba(255,255,255,0.03)", padding: "2px 8px", borderRadius: 20 },
  optionChip:   { fontSize: 10, color: "#555", border: "1px solid #1a1a28", borderRadius: 4, padding: "3px 8px" },
  terminal:     { background: "#040408", border: "1px solid #0f0f18", borderRadius: 8, padding: "18px 20px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, minHeight: 160, lineHeight: 1.8 },
  dimNote:      { fontSize: 12, color: "#333", lineHeight: 1.7 },
};
