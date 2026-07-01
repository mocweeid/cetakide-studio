import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import {
  Sparkles, ArrowRight, Zap, ShieldCheck, Rocket, Palette,
  Instagram, Facebook, Youtube, Twitter, Send, Loader2, Check, Menu, X,
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
/*  UTILITY FUNCTIONS                                                         */
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

/* -------------------------------------------------------------------------- */
/*  COMPONENTS                                                                */
/* -------------------------------------------------------------------------- */

function HeroMockup() {
  const { out: typed, done: typedDone } = useTypewriter(heroPrompt, 32, 700);
  const [phase, setPhase] = useState<"typing" | "generating" | "done">("typing");

  useEffect(() => {
    if (!typedDone) return;
    setPhase("generating");
    const t = setTimeout(() => setPhase("done"), 1800);
    return () => clearTimeout(t);
  }, [typedDone]);

  return (
    <div className="relative mx-auto mt-14 w-full max-w-5xl [perspective:1600px]">
      <div className="rounded-2xl border border-white/10 bg-[#0a0a0a]/90 shadow-[0_30px_80px_-30px_rgba(234,179,8,0.35)] backdrop-blur">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
        </div>
        <div className="border-b border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3">
            <Sparkles className="h-4 w-4 text-[color:var(--gold)]" style={{ color: BRAND.gold }} />
            <p className="flex-1 text-sm text-white/85 truncate">{typed}</p>
          </div>
        </div>
        <div className="h-[200px] flex items-center justify-center text-white/50">
            {phase === "generating" ? "Generating..." : "Ready"}
        </div>
      </div>
    </div>
  );
}

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const links = [
    { name: "Beranda", href: "#" },
    { name: "Contoh Visual", href: "#showcase" },
    { name: "Galeri", href: "#galeri" },
    { name: "Logo AI", href: "#logo" },
    { name: "Keunggulan", href: "#keunggulan" },
    { name: "Cara Kerja", href: "#cara-kerja" },
    { name: "FAQ", href: "#faq" },
    { name: "Harga", href: "#harga" },
  ];

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#050505]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <div className="text-xl font-bold tracking-tight">CetakIde</div>
        <div className="hidden lg:flex items-center gap-6">
          {links.map((l) => <a key={l.name} href={l.href} className="text-sm text-white/70 hover:text-white transition">{l.name}</a>)}
        </div>
        <div className="hidden lg:flex items-center gap-4">
          <Link to="/auth" search={{ mode: "register" }} className="px-5 py-2 text-sm font-semibold text-black rounded-full" style={{ background: BRAND.gold }}>Mulai Gratis</Link>
        </div>
        <button className="lg:hidden" onClick={() => setIsOpen(!isOpen)}>{isOpen ? <X /> : <Menu />}</button>
      </div>
      {isOpen && (
        <div className="absolute top-full w-full bg-[#050505] p-6 lg:hidden flex flex-col gap-4 border-b border-white/10">
          {links.map((l) => <a key={l.name} href={l.href} onClick={() => setIsOpen(false)}>{l.name}</a>)}
        </div>
      )}
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/*  MAIN PAGE                                                                 */
/* -------------------------------------------------------------------------- */

function Index() {
  return (
    <div className="min-h-screen text-white" style={{ background: BRAND.bg }}>
      <Navbar />
      <section className="pt-32 pb-20 px-4 text-center">
        <h1 className="text-5xl font-extrabold mb-6">Visual iklan siap tayang</h1>
        <HeroMockup />
      </section>

      <section id="showcase" className="py-20 max-w-7xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-10">Contoh Visual</h2>
      </section>
      
      <section id="galeri" className="py-20 text-center"><h2>Galeri</h2></section>
      <section id="logo" className="py-20 text-center"><h2>Logo AI</h2></section>
      <section id="keunggulan" className="py-20 text-center"><h2>Keunggulan</h2></section>
      <section id="cara-kerja" className="py-20 text-center"><h2>Cara Kerja</h2></section>
      <section id="faq" className="py-20 text-center"><h2>FAQ</h2></section>
      <section id="harga" className="py-20 text-center"><h2>Harga</h2></section>
      
      <footer className="py-10 border-t border-white/10 text-center">© {new Date().getFullYear()} CetakIde</footer>
    </div>
  );
}
