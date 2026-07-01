import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import {
  Sparkles, ArrowRight, Zap, ShieldCheck, Rocket, Palette,
  Instagram, Facebook, Youtube, Twitter, Send, Loader2, Check,
} from "lucide-react";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  BRAND, heroMockupCards, heroPrompt, carouselData, nicheTabs,
  bentoByNiche, logoShowcase, stats, whyUs, howItWorks, faqs,
  footerColumns, type Niche,
} from "@/config/site-assets";

export const Route = createFileRoute("/")({
  component: Index,
});

/* -------------------------------------------------------------------------- */
/*  HERO — auto-type prompt → "Generating..." → 3D scatter of 5 asset cards   */
/* -------------------------------------------------------------------------- */

function useTypewriter(text: string, speed = 35, startDelay = 500) {
  const [out, setOut] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setOut(""); setDone(false);
    let i = 0;
    const start = setTimeout(() => {
      const id = setInterval(() => {
        i++;
        setOut(text.slice(0, i));
        if (i >= text.length) { clearInterval(id); setDone(true); }
      }, speed);
    }, startDelay);
    return () => clearTimeout(start);
  }, [text, speed, startDelay]);
  return { out, done };
}

function HeroMockup() {
  const { out: typed, done: typedDone } = useTypewriter(heroPrompt, 32, 700);
  const [phase, setPhase] = useState<"typing" | "generating" | "done">("typing");

  useEffect(() => {
    if (!typedDone) return;
    setPhase("generating");
    const t = setTimeout(() => setPhase("done"), 1800);
    return () => clearTimeout(t);
  }, [typedDone]);

  // Loop demo every ~14s
  useEffect(() => {
    if (phase !== "done") return;
    const t = setTimeout(() => setPhase("typing"), 9000);
    return () => clearTimeout(t);
  }, [phase]);

  // Re-run typewriter when we return to typing
  const [runKey, setRunKey] = useState(0);
  useEffect(() => { if (phase === "typing") setRunKey((k) => k + 1); }, [phase]);

  const scatterPositions = [
    { x: -180, y: -20, r: -14, z: 1 },
    { x: -90,  y:  30, r:  -6, z: 2 },
    { x:   0,  y: -30, r:   0, z: 5 },
    { x:  90,  y:  30, r:   6, z: 2 },
    { x: 180,  y: -20, r:  14, z: 1 },
  ];

  return (
    <div className="relative mx-auto mt-14 w-full max-w-5xl [perspective:1600px]">
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
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3">
            <Sparkles className="h-4 w-4 shrink-0 text-[color:var(--gold)]" style={{ color: BRAND.gold }} />
            <p key={runKey} className="min-h-[1.25rem] flex-1 text-left text-sm text-white/85 sm:text-base">
              {typed}
              <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-[color:var(--gold)]" style={{ background: BRAND.gold }} />
            </p>
            <button
              className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-black transition disabled:opacity-70"
              style={{ background: BRAND.gold }}
              disabled
            >
              {phase === "generating" ? (
                <span className="flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> Generating</span>
              ) : phase === "done" ? (
                <span className="flex items-center gap-1.5"><Check className="h-3 w-3" /> Selesai</span>
              ) : "Generate"}
            </button>
          </div>
        </div>

        {/* canvas */}
        <div className="relative h-[320px] overflow-hidden sm:h-[400px] md:h-[440px]">
          {/* soft grid backdrop */}
          <div className="absolute inset-0 opacity-[0.15]" style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }} />
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
            style={{ background: `${BRAND.gold}30` }}
          />

          {/* Generating shimmer */}
          <AnimatePresence>
            {phase === "generating" && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin" style={{ color: BRAND.gold }} />
                  <p className="text-sm text-white/70">Menyusun 5 visual...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scatter cards */}
          <div className="absolute inset-0 flex items-center justify-center [transform-style:preserve-3d]">
            <AnimatePresence>
              {phase === "done" && heroMockupCards.slice(0, 5).map((src, i) => {
                const p = scatterPositions[i];
                return (
                  <motion.div
                    key={`${runKey}-${i}`}
                    initial={{ opacity: 0, scale: 0.4, y: 60, rotate: 0 }}
                    animate={{ opacity: 1, scale: 1, x: p.x, y: p.y, rotate: p.r }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ delay: i * 0.12, type: "spring", stiffness: 140, damping: 16 }}
                    style={{ zIndex: p.z }}
                    className="absolute h-[200px] w-[160px] overflow-hidden rounded-xl border border-white/15 bg-black shadow-2xl sm:h-[240px] sm:w-[190px]"
                  >
                    <img src={src} alt={`Hasil ${i + 1}`} className="h-full w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5 text-[10px] text-white/80">
                      <span>#{String(i + 1).padStart(2, "0")}</span>
                      <span className="rounded px-1.5 py-0.5" style={{ background: BRAND.gold, color: "#000" }}>HD</span>
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

function AutoCarousel({ images, size = 220 }: { images: string[]; size?: number }) {
  const [ref, api] = useEmblaCarousel({ loop: true, align: "start", dragFree: true });
  useEffect(() => {
    if (!api) return;
    const id = setInterval(() => api.scrollNext(), 2400);
    return () => clearInterval(id);
  }, [api]);
  const doubled = useMemo(() => [...images, ...images], [images]);
  return (
    <div className="overflow-hidden" ref={ref}>
      <div className="flex gap-4">
        {doubled.map((src, i) => (
          <div
            key={i}
            className="relative aspect-square shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]"
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
  const [ref, api] = useEmblaCarousel({ loop: true, align: "start", dragFree: true });
  useEffect(() => {
    if (!api) return;
    const id = setInterval(() => api.scrollNext(), 2000);
    return () => clearInterval(id);
  }, [api]);
  const doubled = useMemo(() => [...images, ...images], [images]);
  return (
    <div className="overflow-hidden" ref={ref}>
      <div className="flex gap-6">
        {doubled.map((src, i) => (
          <div
            key={i}
            className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-full border p-2 sm:h-40 sm:w-40"
            style={{ borderColor: `${BRAND.gold}55`, background: "#0a0a0a" }}
          >
            <img src={src} alt="" loading="lazy" className="h-full w-full rounded-full object-cover" />
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
        small: all.slice(1).map((n) => n.main).slice(0, 4),
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
          <div className="aspect-[4/5] w-full">
            <img src={data.main} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="absolute left-4 top-4 rounded-full px-3 py-1 text-[11px] font-semibold" style={{ background: BRAND.gold, color: "#000" }}>
            {active === "Semua" ? "Featured" : active}
          </div>
        </div>

        {/* 4 small 1:1 */}
        <div className="grid grid-cols-2 gap-4">
          {data.small.map((src, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
              <img src={src} alt="" className="h-full w-full object-cover" />
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
  return (
    <div className="min-h-screen text-white" style={{ background: BRAND.bg }}>
      {/* HERO */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute left-1/2 top-24 h-[520px] w-[520px] -translate-x-1/2 rounded-full blur-[160px]"
            style={{ background: `${BRAND.gold}22` }}
          />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 text-center sm:px-6">
          <span
            className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium"
            style={{ borderColor: `${BRAND.gold}55`, color: BRAND.gold, background: `${BRAND.gold}0d` }}
          >
            <Sparkles className="h-3.5 w-3.5" /> {BRAND.name} · AI Visual Builder Instan
          </span>

          <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.05] sm:text-5xl md:text-6xl lg:text-7xl">
            Visual iklan siap tayang, <br className="hidden sm:block" />
            <span style={{ color: BRAND.gold }}>dalam satu klik.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-white/70 sm:text-lg">
            Ketik prompt, pilih format, cetak visual — Instagram, Facebook Ads, YouTube, dan marketplace,
            semua keluar dalam hitungan detik.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/auth"
              search={{ mode: "register" }}
              className="group inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-semibold text-black transition hover:brightness-110"
              style={{ background: BRAND.gold, boxShadow: `0 12px 40px -10px ${BRAND.gold}` }}
            >
              Coba Gratis Sekarang
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
            <a
              href="#showcase"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3.5 text-sm font-medium text-white/85 transition hover:bg-white/5"
            >
              Lihat Contoh Hasil
            </a>
          </div>

          <HeroMockup />
        </div>
      </section>

      {/* CATEGORY CAROUSELS */}
      <section id="showcase" className="relative py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: BRAND.gold }}>
              Semua Format Iklan
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              1 tool untuk semua channel pemasaran
            </h2>
          </div>

          <div className="space-y-12">
            {carouselData.map((c) => (
              <div key={c.title}>
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold sm:text-xl">{c.title}</h3>
                    <p className="text-xs text-white/50 sm:text-sm">{c.subtitle}</p>
                  </div>
                  <span
                    className="hidden rounded-full border px-3 py-1 text-[11px] sm:inline-flex"
                    style={{ borderColor: `${BRAND.gold}55`, color: BRAND.gold }}
                  >
                    Auto-generated
                  </span>
                </div>
                <AutoCarousel images={c.images} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MULTI-NICHE BENTO */}
      <section className="relative py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: BRAND.gold }}>
              Contoh Hasil Visual
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Cocok untuk semua niche bisnis
            </h2>
          </div>
          <Bento />
        </div>
      </section>

      {/* LOGO BRANDING */}
      <section className="relative py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: BRAND.gold }}>
              Logo & Brand Identity
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Cetak logo brand dalam hitungan detik
            </h2>
          </div>
          <LogoAuto images={logoShowcase} />
        </div>
      </section>

      {/* STATS */}
      <section className="relative py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center backdrop-blur"
              >
                <div className="text-2xl font-extrabold sm:text-3xl" style={{ color: BRAND.gold }}>
                  {s.value}
                </div>
                <div className="mt-1 text-xs text-white/60 sm:text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section className="relative py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: BRAND.gold }}>
              Kenapa {BRAND.name}
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Dibangun untuk performa iklan
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {whyUs.map((w, i) => {
              const Icon = [Rocket, ShieldCheck, Palette][i] ?? Rocket;
              return (
                <div key={w.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                  <div
                    className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ background: `${BRAND.gold}1a`, color: BRAND.gold }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold">{w.title}</h3>
                  <p className="mt-2 text-sm text-white/60">{w.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: BRAND.gold }}>
              How It Works
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">3 langkah, visual jadi</h2>
          </div>
          <div className="relative grid gap-6 md:grid-cols-3">
            <div
              aria-hidden
              className="absolute left-8 right-8 top-9 hidden h-px md:block"
              style={{ background: `linear-gradient(90deg, transparent, ${BRAND.gold}55, transparent)` }}
            />
            {howItWorks.map((s) => (
              <div key={s.step} className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <div
                  className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl text-lg font-extrabold"
                  style={{ background: BRAND.gold, color: "#000" }}
                >
                  {s.step}
                </div>
                <h3 className="text-base font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-white/60">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: BRAND.gold }}>
              FAQ
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Pertanyaan yang sering ditanya</h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="mb-3 rounded-xl border border-white/10 bg-white/[0.03] px-4"
              >
                <AccordionTrigger className="text-left text-sm font-semibold sm:text-base">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-white/70">{f.a}</AccordionContent>
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
              <Zap className="h-3.5 w-3.5" /> Promo Starter — Terbatas
            </span>
            <h2 className="mt-6 font-display text-3xl font-extrabold sm:text-5xl">
              Mulai <span style={{ color: BRAND.gold }}>{BRAND.name}</span> hari ini
            </h2>
            <p className="mt-4 text-white/70">
              Semua fitur, saldo awal Rp50.000, tanpa langganan bulanan.
            </p>
            <div className="mt-8 flex items-baseline justify-center gap-3">
              <span className="text-lg text-white/40 line-through">Rp 650.000</span>
              <span className="font-display text-5xl font-extrabold sm:text-6xl" style={{ color: BRAND.gold }}>
                Rp 65.000
              </span>
            </div>
            <Link
              to="/auth"
              search={{ mode: "register" }}
              className="mt-8 inline-flex items-center gap-2 rounded-full px-8 py-4 font-semibold text-black transition hover:brightness-110"
              style={{ background: BRAND.gold, boxShadow: `0 12px 40px -10px ${BRAND.gold}` }}
            >
              Ambil Promo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative w-full pt-16" style={{ background: BRAND.bgFooter }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-10 pb-12 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2">
                <div
                  className="grid h-10 w-10 place-items-center rounded-xl text-lg font-black"
                  style={{ background: BRAND.gold, color: "#000" }}
                >
                  G
                </div>
                <span className="font-display text-2xl font-extrabold tracking-tight">
                  {BRAND.footerBrand}
                </span>
              </div>
              <p className="mt-4 max-w-sm text-sm text-white/60">
                Platform AI visual builder untuk brand, marketer, dan kreator. Cetak visual iklan
                dalam hitungan detik — tanpa desainer, tanpa langganan.
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
                  {col.title}
                </h4>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <a href={l.href} className="text-sm text-white/60 transition hover:text-white">
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-6 sm:flex-row">
            <p className="text-xs text-white/50">
              © {new Date().getFullYear()} {BRAND.footerBrand}. All rights reserved.
            </p>
            <p className="text-xs text-white/50">
              Butuh bantuan?{" "}
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

const HERO_IMAGES = [
  "https://pintardigital.b-cdn.net/Banner/banner-14.webp",
  "https://pintardigital.b-cdn.net/reel/reel-1.webp",
  "https://pintardigital.b-cdn.net/Banner/YT/YT-Thumb-5.webp",
  "https://ptrdigital.web.id/storage/uploads/1780651645_logo-7.webp",
];

const PAIN_POINTS = [
  { icon: AlertTriangle, title: "Desainer Molor", desc: "Deadline mepet, revisi tak berujung, kerja jadi tertunda." },
  { icon: CreditCard, title: "Tagihan Bulanan", desc: "Tools desain berlangganan menguras kantong tiap bulan." },
  { icon: Bot, title: "AI Kaku", desc: "Hasil AI generik, warna acakadut, tidak sesuai brand." },
  { icon: MessageSquareWarning, title: "Jargon Ribit", desc: "Software profesional penuh istilah teknis yang bikin pusing." },
];

const AUDIENCE = [
  { icon: Building2, label: "Owner Brand" },
  { icon: Megaphone, label: "Digital Marketer" },
  { icon: Store, label: "Dropshipper" },
  { icon: Users, label: "Agensi" },
  { icon: Youtube, label: "Content Creator" },
  { icon: Palette, label: "UMKM & Freelancer" },
];

function Index() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
        {/* Backdrop glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/3 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[140px]" />
          <div className="absolute right-0 top-10 h-[300px] w-[300px] rounded-full bg-secondary/25 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 text-center sm:px-6">
          <span className="glass-panel inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" /> AI Visual Builder Instan
          </span>
          <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.05] sm:text-5xl md:text-6xl lg:text-7xl">
            Banner Iklan, Thumbnail, & Logo <br className="hidden sm:block" />
            <span className="text-gradient-gold">jadi dalam 1 klik.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Berhenti bergantung ke desainer & tools mahal. CetakIde bikin visual
            iklan siap tayang untuk Instagram, Facebook Ads, dan YouTube — dalam hitungan detik.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/auth"
              search={{ mode: "register" }}
              className="glow-gold group inline-flex items-center gap-2 rounded-full gradient-gold px-7 py-3.5 font-semibold text-black transition hover:brightness-110"
            >
              Ambil Promo Rp65.000
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
            <a
              href="#showcase"
              className="glass-panel inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium text-foreground/90 transition hover:bg-white/10"
            >
              Lihat Hasil
            </a>
          </div>

          {/* Browser mockup 3D */}
          <div className="relative mx-auto mt-16 max-w-5xl [perspective:1400px]">
            <div className="glass-panel-strong glow-gold float-y rounded-2xl p-3 sm:p-5 [transform:rotateX(6deg)]">
              <div className="mb-3 flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                <span className="ml-3 rounded bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">
                  cetakide.app/dashboard
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {HERO_IMAGES.map((src, i) => (
                  <div
                    key={i}
                    className="aspect-square overflow-hidden rounded-xl border border-white/10 bg-white/5"
                  >
                    <img src={src} alt={`Preview ${i + 1}`} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PAIN POINTS */}
      <section className="relative py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-secondary">
              Masalahnya
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Kenapa iklanmu jalan di tempat?
            </h2>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PAIN_POINTS.map((p) => (
              <div key={p.title} className="glass-panel rounded-2xl p-6 transition hover:-translate-y-1">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUSI — before/after */}
      <section id="solusi" className="relative py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Solusinya</span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Sebelum vs Sesudah CetakIde</h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="glow-red rounded-2xl border border-secondary/40 bg-secondary/10 p-8">
              <h3 className="mb-6 text-xl font-semibold text-secondary">❌ Sebelum</h3>
              <ul className="space-y-3 text-sm">
                {[
                  "Nunggu desainer 3–7 hari",
                  "Bayar Rp500.000+/bulan tools",
                  "Revisi bolak-balik tanpa akhir",
                  "Hasil AI tidak konsisten",
                  "Ukuran salah untuk Ads",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-foreground/80">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-secondary" /> {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="glow-gold rounded-2xl border-2 border-primary/60 bg-primary/5 p-8">
              <h3 className="mb-6 text-xl font-semibold text-primary">✨ Sesudah</h3>
              <ul className="space-y-3 text-sm">
                {[
                  "Cetak visual < 30 detik",
                  "Cukup potong saldo Rp1.000/generate",
                  "1 klik, hasil siap tayang",
                  "Aspect ratio otomatis (IG, FB, YT)",
                  "Toggle HD, Shadow, Reflection",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SHOWCASE BANNER */}
      <section id="showcase" className="relative py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Showcase Banner</span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Hasil generate 1 klik</h2>
          </div>
          <BannerCarousel images={[
            "https://pintardigital.b-cdn.net/Banner/banner-14.webp",
            "https://pintardigital.b-cdn.net/reel/reel-1.webp",
            "https://pintardigital.b-cdn.net/Banner/YT/YT-Thumb-5.webp",
            "https://pintardigital.b-cdn.net/Banner/banner-14.webp",
            "https://pintardigital.b-cdn.net/reel/reel-1.webp",
            "https://pintardigital.b-cdn.net/Banner/YT/YT-Thumb-5.webp",
          ]} />
        </div>
      </section>

      {/* AUDIENCE */}
      <section id="audiens" className="relative py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Untuk Siapa</span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Dibuat untuk yang ingin cepat naik kelas</h2>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {AUDIENCE.map((a) => (
              <div key={a.label} className="glass-panel flex items-center gap-4 rounded-2xl p-5 transition hover:-translate-y-1">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl gradient-gold text-black">
                  <a.icon className="h-6 w-6" />
                </div>
                <p className="font-semibold">{a.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SHOWCASE LOGO */}
      <section className="relative py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Showcase Logo</span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Logo brand keluar dalam hitungan detik</h2>
          </div>
          <LogoCarousel images={[
            "https://ptrdigital.web.id/storage/uploads/1780651645_logo-7.webp",
            "https://ptrdigital.web.id/storage/uploads/1780651645_logo-7.webp",
            "https://ptrdigital.web.id/storage/uploads/1780651645_logo-7.webp",
            "https://ptrdigital.web.id/storage/uploads/1780651645_logo-7.webp",
            "https://ptrdigital.web.id/storage/uploads/1780651645_logo-7.webp",
          ]} />
        </div>
      </section>

      {/* PRICING CTA */}
      <section id="harga" className="relative py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="glow-gold relative overflow-hidden rounded-3xl border-2 border-primary/60 bg-gradient-to-br from-primary/15 via-background to-background p-8 text-center sm:p-14">
            <div className="absolute inset-x-0 -top-40 mx-auto h-72 w-72 rounded-full bg-primary/30 blur-[120px]" />
            <div className="relative">
              <span className="glass-panel inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-primary">
                <Zap className="h-3.5 w-3.5" /> Promo Starter — Terbatas
              </span>
              <h2 className="mt-6 font-display text-3xl font-extrabold sm:text-5xl">
                Mulai <span className="text-gradient-gold">CetakIde</span> hari ini
              </h2>
              <p className="mt-4 text-muted-foreground">
                Semua fitur, saldo awal Rp50.000, tanpa langganan bulanan.
              </p>
              <div className="mt-8 flex items-baseline justify-center gap-3">
                <span className="text-lg text-secondary line-through">Rp 650.000</span>
                <span className="font-display text-5xl font-extrabold text-primary sm:text-6xl">Rp 65.000</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">One-time — akses seumur hidup akun starter</p>
              <Link
                to="/auth"
                search={{ mode: "register" }}
                className="glow-gold mt-8 inline-flex items-center gap-2 rounded-full gradient-gold px-8 py-4 font-semibold text-black transition hover:brightness-110"
              >
                Ambil Promo <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <p className="mt-10 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} CetakIde. Butuh bantuan? WhatsApp{" "}
            <a href="https://wa.me/6288975958005" className="text-primary underline-offset-2 hover:underline">
              +62 889-7595-8005
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
