import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import { useLanguage } from "@/contexts/LanguageContext";
import AutoScroll from "embla-carousel-auto-scroll";
import {
  Sparkles,
  ArrowRight,
  Zap,
  ShieldCheck,
  Rocket,
  Palette,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  Send,
  Loader2,
  Check,
  LayoutTemplate,
  Type,
  ImagePlus,
  Wallet,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Navbar } from "@/components/navbar";
import {
  BRAND,
  heroPrompt,
  carouselData,
  nicheTabs,
  bentoByNiche,
  logoShowcase,
  stats,
  whyUs,
  howItWorks,
  faqs,
  footerColumns,
  type Niche,
} from "@/config/site-assets";

export const Route = createFileRoute("/")({
  component: Index,
});

/* -------------------------------------------------------------------------- */
/*  HERO — auto-type prompt → "Generating..." → 3D scatter of 5 asset cards   */
/* -------------------------------------------------------------------------- */

function useTypewriter(text: string, speed = 35, startDelay = 500, resetKey = 0) {
  const [out, setOut] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setOut("");
    setDone(false);
    let i = 0;
    const start = setTimeout(() => {
      const id = setInterval(() => {
        i++;
        setOut(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(id);
          setDone(true);
        }
      }, speed);
    }, startDelay);
    return () => clearTimeout(start);
  }, [text, speed, startDelay, resetKey]);
  return { out, done };
}

function HeroMockup() {
  const { t } = useLanguage();
  const FORMAT_CONFIG = {
    feed: {
      label: "Feed IG (1:1)",
      icon: Instagram,
      aspect: "1/1",
      width: 170,
      images: [
        "/assets/feed-ig/ig-1.png",
        "/assets/feed-ig/ig-2.png",
        "/assets/feed-ig/ig-3.png",
        "/assets/feed-ig/ig-4.png",
        "/assets/feed-ig/ig-5.png",
      ]
    },
    story: {
      label: "Story IG (9:16)",
      icon: Instagram,
      aspect: "9/16",
      width: 140,
      images: [
        "/assets/story-ig/story-2.png",
        "/assets/story-ig/story-3.png",
        "/assets/story-ig/story-4.png",
        "/assets/story-ig/story-5.png",
        "/assets/story-ig/story-6.png",
      ]
    },
    fb: {
      label: "FB Ads (1:1)",
      icon: Facebook,
      aspect: "1/1",
      width: 170,
      images: [
        "/assets/fb-ads-standart/fb-1.png",
        "/assets/fb-ads-standart/fb-2.png",
        "/assets/fb-ads-standart/fb-3.png",
        "/assets/fb-ads-standart/fb-4.png",
        "/assets/fb-ads-standart/fb-5.png",
      ]
    },
    youtube: {
      label: "YouTube Banner",
      icon: Youtube,
      aspect: "16/9",
      width: 240,
      images: [
        "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1517816743773-6e0fd5ce2624?q=80&w=600&auto=format&fit=crop",
      ]
    }
  };

  const [activeFormat, setActiveFormat] = useState<keyof typeof FORMAT_CONFIG>("feed");
  const [runKey, setRunKey] = useState(0);
  const { out: typed, done: typedDone } = useTypewriter(t(heroPrompt), 32, 700, runKey);
  const [phase, setPhase] = useState<"typing" | "generating" | "done">("typing");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!typedDone) return;
    setPhase("generating");
    const t = setTimeout(() => setPhase("done"), 1800);
    return () => clearTimeout(t);
  }, [typedDone]);

  // Loop demo every ~14s
  useEffect(() => {
    if (phase !== "done") return;
    const t = setTimeout(() => {
      setPhase("typing");
      setRunKey((k) => k + 1);
    }, 9000);
    return () => clearTimeout(t);
  }, [phase]);

  // Manual regenerate function
  const handleRegenerate = () => {
    setPhase("typing");
    setRunKey((k) => k + 1);
  };

  const handleFormatClick = (fmt: keyof typeof FORMAT_CONFIG) => {
    if (fmt === activeFormat) return;
    setActiveFormat(fmt);
    handleRegenerate();
  };

  // Mobile: 3 cards with tight spread — Desktop: 5 cards with full spread
  const scatterPositions = isMobile
    ? [
        { x: -88, y: 10, r: -8, z: 1 },
        { x: 0,   y: -12, r: 0, z: 4 },
        { x: 88,  y: 10, r: 8,  z: 2 },
      ]
    : [
        { x: -200, y: -20, r: -15, z: 1 },
        { x: -100, y: 30,  r: -5,  z: 2 },
        { x: 0,    y: -10, r: 0,   z: 4 },
        { x: 100,  y: -30, r: 5,   z: 3 },
        { x: 200,  y: 20,  r: 15,  z: 2 },
      ];

  // Pick which images to show: 3 center images on mobile, all 5 on desktop
  const visibleImages = isMobile
    ? FORMAT_CONFIG[activeFormat].images.slice(1, 4)
    : FORMAT_CONFIG[activeFormat].images;

  return (
    <div
      className="relative mx-auto w-full max-w-5xl [perspective:1600px]"
    >
      <div className="rounded-2xl border border-white/10 bg-[#0a0a0a]/90 shadow-[0_30px_80px_-30px_rgba(234,179,8,0.35)] backdrop-blur">
        {/* browser bar */}
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
          <div className="ml-3 flex-1">
            <div className="mx-auto max-w-sm truncate rounded-md bg-white/5 px-3 py-1 text-center text-[11px] text-white/50">
              cetakide.app / workspace
            </div>
          </div>
        </div>

        {/* prompt row */}
        <div className="border-b border-white/10 p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <span className="text-xs font-medium text-white/50 shrink-0">Auto-Generate:</span>
            <div className="flex gap-2 shrink-0">
              {Object.entries(FORMAT_CONFIG).map(([key, config]) => {
                const isActive = activeFormat === key;
                const Icon = config.icon;
                return (
                  <button
                    key={key}
                    onClick={() => handleFormatClick(key as keyof typeof FORMAT_CONFIG)}
                    className={`rounded-md border px-2 py-1 text-[10px] font-semibold flex items-center gap-1.5 transition-colors ${
                      isActive 
                        ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30" 
                        : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white/80"
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    {config.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3">
            <Sparkles
              className="h-4 w-4 shrink-0 text-[color:var(--gold)]"
              style={{ color: BRAND.gold }}
            />
            <p
              key={runKey}
              className="min-h-[1.25rem] flex-1 text-left text-sm text-white/85 sm:text-base"
            >
              {typed}
              <span
                className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-[color:var(--gold)]"
                style={{ background: BRAND.gold }}
              />
            </p>
            <button
              className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-black transition disabled:opacity-70"
              style={{ background: BRAND.gold }}
              disabled
            >
              {phase === "generating" ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" /> Generating
                </span>
              ) : phase === "done" ? (
                <span className="flex items-center gap-1.5">
                  <Check className="h-3 w-3" /> Selesai
                </span>
              ) : (
                "Generate"
              )}
            </button>
            <button
              onClick={handleRegenerate}
              className="shrink-0 rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
              title="Generate ulang animasi"
            >
              ↻
            </button>
          </div>
        </div>

        {/* canvas */}
        <div className="relative h-[300px] overflow-hidden sm:h-[400px] md:h-[440px]">
          {/* soft grid backdrop */}
          <div
            className="absolute inset-0 opacity-[0.15]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
              backgroundSize: "36px 36px",
            }}
          />
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
            style={{ background: `${BRAND.gold}30` }}
          />

          {/* Generating shimmer */}
          <AnimatePresence>
            {phase === "generating" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin" style={{ color: BRAND.gold }} />
                  <p className="text-sm text-white/70">{t(isMobile ? "Menyusun 3 visual..." : "Menyusun 5 visual...")}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scatter cards */}
          <div className="absolute inset-0 flex items-center justify-center [transform-style:preserve-3d]">
            <AnimatePresence>
              {phase === "done" &&
                visibleImages.map((src, i) => {
                  const p = scatterPositions[i];
                  const f = FORMAT_CONFIG[activeFormat];
                  const cardWidth = isMobile
                    ? `clamp(90px, 28vw, 130px)`
                    : `clamp(120px, 25vw, ${f.width}px)`;
                  return (
                    <motion.div
                      key={`${activeFormat}-${runKey}-${i}`}
                      initial={{ opacity: 0, scale: 0.4, y: 60, rotate: 0 }}
                      animate={{ opacity: 1, scale: 1, x: p.x, y: p.y, rotate: p.r }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      transition={{ delay: i * 0.12, type: "spring", stiffness: 140, damping: 16 }}
                      style={{ zIndex: p.z, aspectRatio: f.aspect, width: cardWidth }}
                      className="absolute overflow-hidden rounded-xl border border-white/15 bg-black shadow-2xl"
                    >
                      <img
                        src={src}
                        alt={`Hasil ${i + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent px-2.5 py-2 text-[10px] text-white/90">
                        <span className="font-medium drop-shadow-md">{f.label}</span>
                        <span
                          className="rounded px-1.5 py-0.5 font-bold"
                          style={{ background: BRAND.gold, color: "#000" }}
                        >
                          HD
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Auto-play infinite embla row                                              */
/* -------------------------------------------------------------------------- */

function AutoCarousel({
  images,
  size = 220,
  aspectClass = "aspect-square",
}: {
  images: string[];
  size?: number;
  aspectClass?: string;
}) {
  const [ref] = useEmblaCarousel({ loop: true, align: "start", dragFree: true }, [
    AutoScroll({ playOnInit: true, speed: 0.5, stopOnInteraction: false }),
  ]);
  const repeated = useMemo(() => [...images, ...images, ...images, ...images], [images]);
  return (
    <div className="overflow-hidden" ref={ref}>
      <div className="flex gap-4">
        {repeated.map((src, i) => (
          <div
            key={i}
            className={`relative shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] ${aspectClass}`}
            style={{ width: size }}
          >
            <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Logo carousel (circular)                                                  */
/* -------------------------------------------------------------------------- */

function LogoAuto({ images }: { images: string[] }) {
  const [ref] = useEmblaCarousel({ loop: true, align: "start", dragFree: true }, [
    AutoScroll({ playOnInit: true, speed: 0.4, stopOnInteraction: false }),
  ]);
  const repeated = useMemo(() => [...images, ...images, ...images, ...images], [images]);
  return (
    <div className="overflow-hidden" ref={ref}>
      <div className="flex gap-6">
        {repeated.map((src, i) => (
          <div
            key={i}
            className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-full border p-2 sm:h-40 sm:w-40"
            style={{ borderColor: `${BRAND.gold}55`, background: "#0a0a0a" }}
          >
            <img
              src={src}
              alt=""
              loading="lazy"
              className="h-full w-full rounded-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Bento grid with niche tabs                                                */
/* -------------------------------------------------------------------------- */

function Bento() {
  const [active, setActive] = useState<Niche>("Semua");

  const data = useMemo(() => {
    if (active === "Semua") {
      const all = Object.values(bentoByNiche);
      return {
        main: all[0].main,
        small: [
          all[1]?.main || "",
          all[2]?.main || "",
          all[3]?.main || "",
          all[0]?.small[0] || "",
        ].filter(Boolean),
      };
    }
    return bentoByNiche[active];
  }, [active]);

  return (
    <div>
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {nicheTabs.map((t) => {
          const isActive = t === active;
          return (
            <button
              key={t}
              onClick={() => setActive(t)}
              className="rounded-full border px-4 py-2 text-xs font-semibold transition sm:text-sm"
              style={{
                borderColor: isActive ? BRAND.gold : "rgba(255,255,255,0.12)",
                background: isActive ? BRAND.gold : "transparent",
                color: isActive ? "#000" : "rgba(255,255,255,0.75)",
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* main 4:5 */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          <div className="aspect-square w-full">
            <img
              src={data.main}
              alt={`Contoh visual ${active}`}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
          <div
            className="absolute left-4 top-4 rounded-full px-3 py-1 text-[11px] font-semibold"
            style={{ background: BRAND.gold, color: "#000" }}
          >
            {active === "Semua" ? "Featured" : active}
          </div>
        </div>

        {/* 4 small 1:1 */}
        <div className="grid grid-cols-2 gap-4">
          {data.small.map((src, i) => (
            <div
              key={i}
              className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
            >
              <img
                src={src}
                alt={`Contoh visual ${active} ${i + 1}`}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  PAGE                                                                      */
/* -------------------------------------------------------------------------- */

function Index() {
  const { t } = useLanguage();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden text-white" style={{ background: BRAND.bg }}>
      <Navbar />
      {/* HERO */}
      <section id="hero" className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28">
        {/* Background image — completely frozen, isolated from all child animations */}
        <div
          className="absolute inset-0"
          style={{
            contain: "strict",
            isolation: "isolate",
            transform: "translateZ(0)",
            willChange: "auto",
            backfaceVisibility: "hidden",
          }}
        >
          <img
            src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=50&w=1200&auto=format&fit=crop"
            alt="Background"
            className="h-full w-full object-cover"
            style={{ transform: "translateZ(0)", willChange: "auto" }}
            fetchPriority="high"
            decoding="async"
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F1E]/95 via-[#0A0F1E]/85 to-[#0A0F1E]/95" />
        </div>

        {/* Background layers — static decorative glows, also frozen */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ contain: "paint", transform: "translateZ(0)" }}
        >
          {/* Gradient glow */}
          <div
            className="absolute left-1/2 top-24 h-[520px] w-[520px] -translate-x-1/2 rounded-full blur-[160px]"
            style={{ background: `${BRAND.gold}22` }}
          />
          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
          {/* Floating decorative shapes */}
          <div
            className="absolute left-[10%] top-[20%] h-32 w-32 rounded-full blur-3xl opacity-20"
            style={{ background: BRAND.gold }}
          />
          <div
            className="absolute right-[15%] bottom-[30%] h-40 w-40 rounded-full blur-3xl opacity-15"
            style={{ background: "#8b5cf6" }}
          />
          <div
            className="absolute left-[20%] bottom-[20%] h-24 w-24 rounded-full blur-3xl opacity-10"
            style={{ background: "#06b6d4" }}
          />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 text-center sm:px-6">
          <span
            className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium"
            style={{
              borderColor: `${BRAND.gold}55`,
              color: BRAND.gold,
              background: `${BRAND.gold}0d`,
            }}
          >
            <Sparkles className="h-3.5 w-3.5" /> {t("hero.badge")}
          </span>

          <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.05] sm:text-5xl md:text-6xl lg:text-7xl">
            {t("hero.title1")} <br className="hidden sm:block" />
            <span style={{ color: BRAND.gold }}>{t("hero.title2")}</span>
          </h1>

          {/* Mini Instagram Feed Carousel — seamless infinite */}
          <div
            className="mt-8 flex w-full overflow-hidden py-4 gap-3"
            style={{ isolation: "isolate", contain: "layout style" }}
          >
            {[0, 1].map((set) => (
              <div
                key={set}
                className="flex shrink-0 animate-marquee gap-3 will-change-transform"
                style={{ backfaceVisibility: "hidden", transform: "translateZ(0)" }}
                aria-hidden={set === 1}
              >
                {Array.from({ length: 32 }).map((_, i) => (
                  <div
                    key={i}
                    className="relative aspect-square h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5 sm:h-20 sm:w-20 md:h-24 md:w-24"
                  >
                    <img
                      src={`/assets/feed-ig/ig-${(i % 8) + 1}.png`}
                      alt={`Instagram ${(i % 8) + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {session ? (
              <Link
                to="/dashboard"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full px-7 py-3.5 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                style={{
                  background: BRAND.goldGradient,
                  boxShadow: `0 12px 40px -10px ${BRAND.gold}`,
                }}
              >
                <span className="relative z-10">{t("hero.button.dashboard")}</span>
                <ArrowRight className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-1" />
                <div className="absolute inset-0 -translate-x-full bg-white/30 transition-transform duration-500 group-hover:translate-x-0" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full transition-transform duration-700 group-hover:translate-x-full" />
              </Link>
            ) : (
              <Link
                to="/auth"
                search={{ mode: "register" }}
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full px-7 py-3.5 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                style={{
                  background: BRAND.goldGradient,
                  boxShadow: `0 12px 40px -10px ${BRAND.gold}`,
                }}
              >
                <span className="relative z-10">{t("hero.button.free")}</span>
                <ArrowRight className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-1" />
                <div className="absolute inset-0 -translate-x-full bg-white/30 transition-transform duration-500 group-hover:translate-x-0" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full transition-transform duration-700 group-hover:translate-x-full" />
              </Link>
            )}
            <a
              href="#showcase"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-white/15 px-6 py-3.5 text-sm font-medium text-white/85 transition-all duration-300 hover:scale-105 hover:border-white/30"
              style={{
                background: "linear-gradient(135deg, rgba(234,179,8,0.1), rgba(234,179,8,0.05))",
              }}
            >
              <span className="relative z-10">{t("hero.button.showcase")}</span>
              <div className="absolute inset-0 -translate-x-full bg-white/10 transition-transform duration-500 group-hover:translate-x-0" />
            </a>
          </div>

          <p className="mx-auto mt-5 max-w-2xl text-base text-white/70 sm:text-lg">
            {t("hero.subtitle")}
          </p>
        </div>
      </section>

      {/* AI VISUAL BUILDER MOCKUP — separate section, fully isolated from hero background */}
      <section
        id="ai-visual-builder"
        className="relative py-10 sm:py-14"
        style={{ background: BRAND.bg }}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <HeroMockup />
        </div>
      </section>

      {/* CATEGORY CAROUSELS */}
      <section id="showcase" className="relative py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: BRAND.gold }}
            >
              {t("Semua Format Iklan")}
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              {t("1 tool untuk semua channel pemasaran")}
            </h2>
          </div>

          <div className="space-y-12">
            {carouselData.map((c) => (
              <div key={c.title} className="group">
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold transition-colors group-hover:text-white/90 sm:text-xl">
                      {t(c.title)}
                    </h3>
                    <p className="text-xs text-white/50 sm:text-sm">{t(c.subtitle)}</p>
                  </div>
                  <span
                    className="hidden rounded-full border px-3 py-1 text-[11px] transition-all group-hover:scale-110 sm:inline-flex"
                    style={{ borderColor: `${BRAND.gold}55`, color: BRAND.gold }}
                  >
                    {t("Auto-generated")}
                  </span>
                </div>
                <AutoCarousel images={c.images} aspectClass={c.aspectClass} size={c.width} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MULTI-NICHE BENTO */}
      <section id="bento" className="relative py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <span
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: BRAND.gold }}
            >
              {t("Contoh Hasil Visual")}
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">{t("Cocok untuk semua niche bisnis")}</h2>
          </div>
          <Bento />
        </div>
      </section>

      {/* LOGO BRANDING */}
      <section id="logo" className="relative py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <span
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: BRAND.gold }}
            >
              {t("Logo & Brand Identity")}
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              {t("Cetak logo brand dalam hitungan detik")}
            </h2>
          </div>
          <LogoAuto images={logoShowcase} />
        </div>
      </section>

      {/* STATS */}
      <section id="stats" className="relative py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center backdrop-blur transition-all duration-300 hover:scale-105 hover:border-white/20 hover:bg-white/[0.06]"
              >
                <div
                  className="text-2xl font-extrabold transition-colors sm:text-3xl"
                  style={{ color: BRAND.gold }}
                >
                  {s.value}
                </div>
                <div className="mt-1 text-xs text-white/60 transition-colors group-hover:text-white/80 sm:text-sm">
                  {t(s.label)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section id="keunggulan" className="relative py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: BRAND.gold }}
            >
              {t("Kenapa Cetak Ide").replace("Cetak Ide", BRAND.name)}
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">{t("Dibangun untuk performa iklan")}</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {whyUs.map((w, i) => {
              const Icon =
                [Sparkles, Palette, LayoutTemplate, Type, ImagePlus, Wallet][i] ?? Rocket;
              return (
                <div
                  key={w.title}
                  className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:scale-105 hover:border-white/20 hover:bg-white/[0.06] hover:shadow-xl"
                >
                  <div
                    className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                    style={{ background: `${BRAND.gold}1a`, color: BRAND.gold }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold transition-colors group-hover:text-white/90">
                    {t(w.title)}
                  </h3>
                  <p className="mt-2 text-sm text-white/60 transition-colors group-hover:text-white/80">
                    {t(w.desc)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* DASHBOARD PREVIEW SECTION */}
      <section
        id="fitur-preview"
        className="relative py-16 sm:py-20 border-y border-white/5 bg-[#0a0a0a]/50"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <span
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: BRAND.gold }}
            >
              {t("Fitur Lengkap Dashboard")}
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">{t("Semua yang Anda Butuhkan")}</h2>
            <p className="mt-4 text-white/60">
              {t("Tidak sekadar meng-generate gambar, kami memberikan kontrol penuh atas identitas brand Anda di dalam satu Workspace.")}
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* BRAND KIT MOCKUP */}
            <div className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="mb-4 flex items-center gap-2">
                <Palette className="h-5 w-5 text-yellow-500" />
                <h3 className="font-semibold">{t("Manajemen Brand Kit")}</h3>
              </div>
              <p className="text-sm text-white/50 mb-6">
                {t("Terapkan warna perusahaan Anda secara otomatis ke setiap desain.")}
              </p>

              <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Tech Startup</span>
                  <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded">
                    {t("Aktif")}
                  </span>
                </div>
                <div className="flex gap-2">
                  {["#3B82F6", "#1E293B", "#F8FAFC"].map((color) => (
                    <div
                      key={color}
                      className="group/color relative h-8 w-8 rounded-md shadow-sm border border-white/20"
                      style={{ backgroundColor: color }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/color:opacity-100 transition-opacity bg-black text-[10px] px-2 py-1 rounded">
                        {color}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-3 space-y-3 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm opacity-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Eco Friendly</span>
                </div>
                <div className="flex gap-2">
                  {["#22C55E", "#14532D", "#F0FDF4"].map((color) => (
                    <div
                      key={color}
                      className="h-8 w-8 rounded-md border border-white/20"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* CUSTOM FONT MOCKUP */}
            <div className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="mb-4 flex items-center gap-2">
                <Type className="h-5 w-5 text-blue-400" />
                <h3 className="font-semibold">{t("Kustomisasi Tipografi")}</h3>
              </div>
              <p className="text-sm text-white/50 mb-6">
                {t("Ubah tipografi sesuka hati dari pilihan font premium populer.")}
              </p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: "Inter", fam: "sans-serif" },
                  { name: "Playfair", fam: "serif" },
                  { name: "Montserrat", fam: "sans-serif" },
                  { name: "Pacifico", fam: "cursive" },
                ].map((f, i) => (
                  <div
                    key={f.name}
                    className={`rounded-xl border ${i === 0 ? "border-blue-400/50 bg-blue-400/10" : "border-white/10 bg-white/5"} p-3 flex flex-col items-center justify-center min-h-[80px]`}
                  >
                    <p
                      className={`text-2xl mb-1 ${i === 0 ? "text-blue-400" : "text-white"}`}
                      style={{ fontFamily: f.fam }}
                    >
                      Aa
                    </p>
                    <p className="text-[10px] text-white/60">{f.name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* AUTO UPLOADER MOCKUP */}
            <div className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="mb-4 flex items-center gap-2">
                <ImagePlus className="h-5 w-5 text-green-400" />
                <h3 className="font-semibold">{t("Auto Uploader Media")}</h3>
              </div>
              <p className="text-sm text-white/50 mb-6">
                {t("Unggah produk atau logo, AI akan menghapus background otomatis.")}
              </p>

              <div className="rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-4 text-center mb-4">
                <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20 mb-2">
                  <ArrowRight className="h-4 w-4 text-green-400 -rotate-90" />
                </div>
                <p className="text-[11px] text-white/60">{t("Klik untuk upload gambar")}</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="aspect-square rounded-lg bg-white/10 overflow-hidden border border-white/5 relative"
                  >
                    <img
                      src={`/assets/feed-ig/ig-${n}.png`}
                      alt=""
                      className="w-full h-full object-cover opacity-70"
                    />
                    {n === 1 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                        <Check className="h-4 w-4 text-green-400" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="cara-kerja" className="relative py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: BRAND.gold }}
            >
              {t("How It Works")}
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">{t("3 langkah, visual jadi")}</h2>
          </div>
          <div className="relative grid gap-6 md:grid-cols-3">
            <div
              aria-hidden
              className="absolute left-8 right-8 top-9 hidden h-px md:block"
              style={{
                background: `linear-gradient(90deg, transparent, ${BRAND.gold}55, transparent)`,
              }}
            />
            {howItWorks.map((s) => (
              <div
                key={s.step}
                className="group relative rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:scale-105 hover:border-white/20 hover:bg-white/[0.06] hover:shadow-xl"
              >
                <div
                  className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl text-lg font-extrabold transition-transform group-hover:scale-110"
                  style={{ background: BRAND.gold, color: "#000" }}
                >
                  {s.step}
                </div>
                <h3 className="text-base font-semibold transition-colors group-hover:text-white/90">
                  {t(s.title)}
                </h3>
                <p className="mt-2 text-sm text-white/60 transition-colors group-hover:text-white/80">
                  {t(s.desc)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <span
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: BRAND.gold }}
            >
              {t("FAQ")}
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">{t("Pertanyaan yang sering ditanya")}</h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="mb-3 rounded-xl border border-white/10 bg-white/[0.03] px-4"
              >
                <AccordionTrigger className="text-left text-sm font-semibold sm:text-base">
                  {t(f.q)}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-white/70">{t(f.a)}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* PRICING CTA */}
      <section id="harga" className="relative py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div
            className="relative overflow-hidden rounded-3xl border p-8 text-center sm:p-14"
            style={{
              borderColor: `${BRAND.gold}80`,
              background: `radial-gradient(circle at 50% 0%, ${BRAND.gold}22, transparent 60%), #0a0a0a`,
              boxShadow: `0 30px 80px -30px ${BRAND.gold}`,
            }}
          >
            <span
              className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold"
              style={{ borderColor: `${BRAND.gold}66`, color: BRAND.gold }}
            >
              <Zap className="h-3.5 w-3.5" /> {t("Promo Starter — Terbatas")}
            </span>
            <h2 className="mt-6 font-display text-3xl font-extrabold sm:text-5xl">
              {t("Mulai Cetak Ide hari ini").replace("Cetak Ide", BRAND.name)}
            </h2>
            <p className="mt-4 text-white/70">
              {t("Semua fitur, saldo awal Rp50.000, tanpa langganan bulanan.")}
            </p>
            <div className="mt-8 flex items-baseline justify-center gap-3">
              <span className="text-lg text-white/40 line-through">Rp 650.000</span>
              <span
                className="font-display text-5xl font-extrabold sm:text-6xl"
                style={{ color: BRAND.gold }}
              >
                Rp 65.000
              </span>
            </div>
            {session ? (
              <Link
                to="/dashboard"
                className="mt-8 inline-flex items-center gap-2 rounded-full px-8 py-4 font-semibold text-black transition hover:brightness-110"
                style={{ background: BRAND.gold, boxShadow: `0 12px 40px -10px ${BRAND.gold}` }}
              >
                {t("Ke Dashboard")} <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                to="/auth"
                search={{ mode: "register" }}
                className="mt-8 inline-flex items-center gap-2 rounded-full px-8 py-4 font-semibold text-black transition hover:brightness-110"
                style={{ background: BRAND.gold, boxShadow: `0 12px 40px -10px ${BRAND.gold}` }}
              >
                {t("Ambil Promo")} <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="footer" className="relative w-full pt-16" style={{ background: BRAND.bgFooter }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-10 pb-12 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <div className="flex items-center">
                <img
                  src="/sub-logo/ChatGPT Image 6 Jul 2026, 12.36.50.png"
                  alt={BRAND.name}
                  className="h-12 w-auto object-contain"
                />
              </div>
              <p className="mt-4 max-w-sm text-sm text-white/60">
                {t("Platform AI visual builder untuk brand, marketer, dan kreator. Cetak visual iklan dalam hitungan detik — tanpa desainer, tanpa langganan.")}
              </p>
              <div className="mt-6 flex items-center gap-3">
                {[Instagram, Facebook, Youtube, Twitter, Send].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/70 transition hover:border-[color:var(--gold)] hover:text-white"
                    style={{ ["--gold" as string]: BRAND.gold }}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {footerColumns.map((col) => (
              <div key={col.title}>
                <h4 className="mb-4 text-sm font-semibold" style={{ color: BRAND.gold }}>
                  {t(col.title)}
                </h4>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.href}
                        className="text-sm text-white/60 transition hover:text-white"
                      >
                        {t(l.label)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-6 sm:flex-row">
            <p className="text-xs text-white/50">
              © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
            </p>
            <p className="text-xs text-white/50">
              {t("Butuh bantuan?")}{" "}
              <a href={BRAND.whatsapp} className="hover:underline" style={{ color: BRAND.gold }}>
                WhatsApp +62 889-7595-8005
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
