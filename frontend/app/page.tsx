"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const EXAMPLE_STORIES = [
  { prompt: "A detective solving her own murder", genre: "Thriller", style: "Noir Ethereal", hook: "The hardest case I ever worked was the one where I was already dead." },
  { prompt: "The last library on a dying planet", genre: "Sci-Fi", style: "Fractured Reality", hook: "Every book ever written. One week left to save them." },
  { prompt: "Two strangers who share the same dream every night", genre: "Romance", style: "Intimate Haunting", hook: "She'd never met him. She knew everything about him." },
  { prompt: "A chef who can taste people's memories", genre: "Drama", style: "Urban Ghost", hook: "He cooked what they couldn't say out loud." },
  { prompt: "The soldier who survived by becoming someone else", genre: "Action", style: "Procedural Decay", hook: "He buried that man. The man kept coming back." },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Describe your story", desc: "Type any idea — a sentence, a feeling, a scenario. StoryLens does the rest." },
  { step: "02", title: "Choose your direction", desc: "Get 3 distinct story arcs. Pick the one that matches your vision." },
  { step: "03", title: "Select a visual style", desc: "5 cinematic styles with camera language, palette, and film references." },
  { step: "04", title: "Preview your trailer", desc: "See your story as a scene-by-scene trailer timeline, ready for generation." },
  { step: "05", title: "Get director's notes", desc: "Your AI co-director asks sharp questions to sharpen every scene." },
  { step: "06", title: "Lock your final cut", desc: "Refine, iterate, and export a trailer that feels like a real film." },
];

const FEATURES = [
  { icon: "◎", title: "AI Story Direction", desc: "Claude reads your idea and generates 3 cinematic story arcs — each with a distinct emotional core, pacing, and hook." },
  { icon: "▣", title: "Visual Style Engine", desc: "5 curated styles per story. Camera language, color palette, and real film references to lock the look and feel." },
  { icon: "⟳", title: "Iterative Refinement", desc: "The only trailer tool with a built-in co-director. It asks. You answer. Your trailer gets sharper." },
  { icon: "✦", title: "Scene-Level Control", desc: "Surgical control over every scene. Lock what works, regenerate what doesn't." },
];

const PRICING = [
  {
    tier: "Free",
    price: "$0",
    period: "",
    desc: "Try StoryLens and see what your story looks like.",
    features: ["3 story directions per prompt", "5 visual styles", "Scene timeline preview", "1 refinement round"],
    cta: "Start Free",
    highlight: false,
  },
  {
    tier: "Creator",
    price: "$12",
    period: "/month",
    desc: "For storytellers who are serious about their craft.",
    features: ["Unlimited story directions", "Full AI video generation", "Narration + music scoring", "Unlimited refinement rounds", "HD export (1080p)"],
    cta: "Start Creating",
    highlight: true,
  },
  {
    tier: "Studio",
    price: "$39",
    period: "/month",
    desc: "For professionals and production teams.",
    features: ["Everything in Creator", "4K export", "Version history stack", "Team collaboration", "Priority rendering", "Custom voice styles"],
    cta: "Go Studio",
    highlight: false,
  },
];

export default function Home() {
  const [storyIndex, setStoryIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setStoryIndex(i => (i + 1) % EXAMPLE_STORIES.length);
        setFading(false);
      }, 400);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const story = EXAMPLE_STORIES[storyIndex];

  return (
    <div style={s.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #1a1a28; border-radius: 2px; }
        .nav-link:hover { color: #fff !important; }
        .feature-card:hover { border-color: #e8c54733 !important; transform: translateY(-3px); }
        .step-card:hover { background: #0f0f1e !important; }
        .btn-gold:hover { background: #f0d060 !important; }
        .btn-outline:hover { border-color: #e8c547 !important; color: #e8c547 !important; }
        .story-dot:hover { background: #e8c547 !important; }
        .pricing-card { transition: transform 0.2s; }
        .pricing-card:hover { transform: translateY(-4px); }
      `}</style>

      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.navLogo}>Story<span style={{ color: "#e8c547" }}>Lens</span></div>
        <div style={s.navLinks}>
          <a href="#how-it-works" className="nav-link" style={s.navLink}>How it works</a>
          <a href="#features" className="nav-link" style={s.navLink}>Features</a>
          <a href="#pricing" className="nav-link" style={s.navLink}>Pricing</a>
        </div>
        <Link href="/studio">
          <button className="btn-gold" style={s.navCta}>Start Creating</button>
        </Link>
      </nav>

      {/* Hero */}
      <section style={s.hero}>
        <div style={s.heroInner}>
          <div style={s.heroEyebrow}>AI TRAILER GENERATOR</div>
          <h1 style={s.heroHeadline}>
            Your story.<br />
            <span style={{ color: "#e8c547" }}>On screen.</span>
          </h1>
          <p style={s.heroSub}>
            Type an idea. Get a cinematic trailer — complete with story direction,
            visual style, narration, music, and AI-generated footage.
          </p>
          <div style={s.heroCtas}>
            <Link href="/studio">
              <button className="btn-gold" style={s.btnGold}>Start Creating →</button>
            </Link>
            <a href="#how-it-works">
              <button className="btn-outline" style={s.btnOutline}>See how it works</button>
            </a>
          </div>

          {/* Rotating demo box */}
          <div style={s.demoBox}>
            <div style={s.demoHeader}>
              <span style={s.demoLabel}>LIVE EXAMPLE</span>
              <div style={s.dotRow}>
                {EXAMPLE_STORIES.map((_, i) => (
                  <button
                    key={i}
                    className="story-dot"
                    onClick={() => setStoryIndex(i)}
                    style={{ ...s.dot, background: i === storyIndex ? "#e8c547" : "#222" }}
                  />
                ))}
              </div>
            </div>
            <div style={{ opacity: fading ? 0 : 1, transition: "opacity 0.4s" }}>
              <div style={s.demoPrompt}>"{story.prompt}"</div>
              <div style={s.demoBadges}>
                <span style={s.demoBadge}>{story.genre}</span>
                <span style={{ ...s.demoBadge, color: "#888", borderColor: "#1a1a28" }}>{story.style}</span>
              </div>
              <div style={s.demoHookBox}>
                <span style={s.demoHookLabel}>GENERATED HOOK</span>
                <span style={s.demoHook}>"{story.hook}"</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={s.section}>
        <div style={s.sectionInner}>
          <div style={s.sectionEyebrow}>HOW IT WORKS</div>
          <h2 style={s.sectionHeadline}>From idea to trailer in six steps</h2>
          <div style={s.stepsGrid}>
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="step-card" style={s.stepCard}>
                <div style={s.stepNum}>{step.step}</div>
                <h3 style={s.stepTitle}>{step.title}</h3>
                <p style={s.stepDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ ...s.section, background: "#080810" }}>
        <div style={s.sectionInner}>
          <div style={s.sectionEyebrow}>FEATURES</div>
          <h2 style={s.sectionHeadline}>Built different</h2>
          <p style={s.sectionSub}>Every feature exists to close the gap between your imagination and the screen.</p>
          <div style={s.featuresGrid}>
            {FEATURES.map((f) => (
              <div key={f.icon} className="feature-card" style={s.featureCard}>
                <div style={s.featureIcon}>{f.icon}</div>
                <h3 style={s.featureTitle}>{f.title}</h3>
                <p style={s.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={s.section}>
        <div style={s.sectionInner}>
          <div style={s.sectionEyebrow}>PRICING</div>
          <h2 style={s.sectionHeadline}>Pay for what you create</h2>
          <p style={s.sectionSub}>Start free. Upgrade when your story demands it.</p>
          <div style={s.pricingGrid}>
            {PRICING.map((plan) => (
              <div key={plan.tier} className="pricing-card" style={{
                ...s.pricingCard,
                borderColor: plan.highlight ? "#e8c547" : "#1a1a28",
                background: plan.highlight ? "#0d0d1c" : "#0a0a14",
              }}>
                {plan.highlight && <div style={s.popularBadge}>MOST POPULAR</div>}
                <div style={s.pricingTier}>{plan.tier}</div>
                <div style={s.pricingPrice}>
                  <span style={s.pricingAmount}>{plan.price}</span>
                  <span style={s.pricingPeriod}>{plan.period}</span>
                </div>
                <p style={s.pricingDesc}>{plan.desc}</p>
                <div style={s.pricingDivider} />
                <ul style={s.pricingFeatures}>
                  {plan.features.map((f) => (
                    <li key={f} style={s.pricingFeature}>
                      <span style={{ color: "#e8c547", marginRight: 10 }}>✓</span>{f}
                    </li>
                  ))}
                </ul>
                <Link href="/studio" style={{ display: "block", marginTop: "auto", paddingTop: 20 }}>
                  <button
                    className={plan.highlight ? "btn-gold" : "btn-outline"}
                    style={plan.highlight ? { ...s.btnGold, width: "100%" } : { ...s.btnOutline, width: "100%" }}
                  >
                    {plan.cta}
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={s.ctaSection}>
        <div style={s.ctaInner}>
          <div style={s.ctaEyebrow}>YOUR STORY IS WAITING</div>
          <h2 style={s.ctaHeadline}>The trailer exists.<br />You just haven't made it yet.</h2>
          <p style={s.ctaSub}>Every great film started as an idea someone almost didn't share. Share yours.</p>
          <Link href="/studio">
            <button className="btn-gold" style={{ ...s.btnGold, fontSize: 14, padding: "16px 40px" }}>
              Start Creating — It's Free
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={s.footer}>
        <div style={s.footerLogo}>Story<span style={{ color: "#e8c547" }}>Lens</span></div>
        <div style={s.footerSub}>Your story. On screen.</div>
      </footer>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  root: { fontFamily: "'JetBrains Mono', monospace", background: "#06060a", color: "#ddd8cc", minHeight: "100vh" },
  nav: { padding: "20px 60px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #0f0f18", position: "sticky", top: 0, background: "#06060aee", backdropFilter: "blur(12px)", zIndex: 100 },
  navLogo: { fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" },
  navLinks: { display: "flex", gap: 32 },
  navLink: { fontSize: 11, color: "#666", textDecoration: "none", letterSpacing: "0.1em", transition: "color 0.15s" },
  navCta: { background: "#e8c547", color: "#000", border: "none", borderRadius: 6, padding: "9px 20px", cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.05em" },
  hero: { padding: "100px 60px 80px", borderBottom: "1px solid #0f0f18" },
  heroInner: { maxWidth: 860, margin: "0 auto" },
  heroEyebrow: { fontSize: 9, color: "#e8c547", letterSpacing: "0.3em", marginBottom: 24 },
  heroHeadline: { fontFamily: "'Playfair Display', serif", fontSize: 72, fontWeight: 900, color: "#fff", lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: 24 },
  heroSub: { fontSize: 16, color: "#666", lineHeight: 1.8, maxWidth: 520, marginBottom: 40 },
  heroCtas: { display: "flex", gap: 14, marginBottom: 56, flexWrap: "wrap" },
  btnGold: { background: "#e8c547", color: "#000", border: "none", borderRadius: 8, padding: "14px 32px", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.05em", transition: "background 0.15s" },
  btnOutline: { background: "transparent", color: "#666", border: "1px solid #222", borderRadius: 8, padding: "14px 28px", cursor: "pointer", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.05em", transition: "all 0.15s" },
  demoBox: { background: "#0a0a14", border: "1px solid #1a1a28", borderRadius: 12, padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 },
  demoHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  demoLabel: { fontSize: 9, color: "#444", letterSpacing: "0.25em" },
  dotRow: { display: "flex", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: "50%", border: "none", cursor: "pointer", padding: 0, transition: "background 0.3s" },
  demoPrompt: { fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#fff", lineHeight: 1.4, marginBottom: 12 },
  demoBadges: { display: "flex", gap: 8, marginBottom: 16 },
  demoBadge: { fontSize: 9, color: "#e8c547", border: "1px solid #e8c54733", padding: "3px 10px", borderRadius: 4, letterSpacing: "0.15em" },
  demoHookBox: { background: "#ffffff05", borderLeft: "2px solid #e8c54744", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6 },
  demoHookLabel: { fontSize: 8, color: "#e8c547", letterSpacing: "0.25em" },
  demoHook: { fontFamily: "'Playfair Display', serif", fontSize: 15, color: "#bbb", lineHeight: 1.6, fontStyle: "italic" },
  section: { padding: "100px 60px", borderBottom: "1px solid #0f0f18" },
  sectionInner: { maxWidth: 1000, margin: "0 auto" },
  sectionEyebrow: { fontSize: 9, color: "#e8c547", letterSpacing: "0.3em", marginBottom: 20 },
  sectionHeadline: { fontFamily: "'Playfair Display', serif", fontSize: 48, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", marginBottom: 16 },
  sectionSub: { fontSize: 14, color: "#666", lineHeight: 1.8, maxWidth: 500, marginBottom: 56 },
  stepsGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 },
  stepCard: { padding: "28px 24px", borderRadius: 8, display: "flex", flexDirection: "column", gap: 12, transition: "background 0.2s", cursor: "default" },
  stepNum: { fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 900, color: "#e8c54730", lineHeight: 1 },
  stepTitle: { fontFamily: "'Playfair Display', serif", fontSize: 18, color: "#ddd", fontWeight: 600 },
  stepDesc: { fontSize: 12, color: "#666", lineHeight: 1.7 },
  featuresGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 },
  featureCard: { background: "#0a0a14", border: "1px solid #111", borderRadius: 12, padding: "32px", display: "flex", flexDirection: "column", gap: 16, transition: "all 0.2s" },
  featureIcon: { fontSize: 24, color: "#e8c547" },
  featureTitle: { fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#fff", fontWeight: 700 },
  featureDesc: { fontSize: 13, color: "#666", lineHeight: 1.7 },
  pricingGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 },
  pricingCard: { border: "1px solid", borderRadius: 12, padding: "32px", display: "flex", flexDirection: "column", gap: 20, position: "relative" },
  popularBadge: { position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#e8c547", color: "#000", fontSize: 9, fontWeight: 700, padding: "4px 14px", borderRadius: 20, letterSpacing: "0.15em", whiteSpace: "nowrap" },
  pricingTier: { fontSize: 10, color: "#e8c547", letterSpacing: "0.2em" },
  pricingPrice: { display: "flex", alignItems: "baseline", gap: 4 },
  pricingAmount: { fontFamily: "'Playfair Display', serif", fontSize: 44, fontWeight: 900, color: "#fff" },
  pricingPeriod: { fontSize: 12, color: "#555" },
  pricingDesc: { fontSize: 12, color: "#666", lineHeight: 1.6 },
  pricingDivider: { height: 1, background: "#111" },
  pricingFeatures: { listStyle: "none", display: "flex", flexDirection: "column", gap: 10, flex: 1 },
  pricingFeature: { fontSize: 12, color: "#888", display: "flex", alignItems: "flex-start" },
  ctaSection: { padding: "120px 60px", textAlign: "center" },
  ctaInner: { maxWidth: 700, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 24 },
  ctaEyebrow: { fontSize: 9, color: "#e8c547", letterSpacing: "0.3em" },
  ctaHeadline: { fontFamily: "'Playfair Display', serif", fontSize: 52, fontWeight: 900, color: "#fff", lineHeight: 1.1, letterSpacing: "-0.02em" },
  ctaSub: { fontSize: 14, color: "#666", lineHeight: 1.8, maxWidth: 480 },
  footer: { padding: "40px 60px", borderTop: "1px solid #0f0f18", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 },
  footerLogo: { fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: "#fff" },
  footerSub: { fontSize: 10, color: "#333", letterSpacing: "0.1em" },
};
