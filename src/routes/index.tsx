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
/*  NAVBAR COMPONENT                                                          */
/* -------------------------------------------------------------------------- */

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [lang, setLang] = useState("ID");

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
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="text-xl font-bold tracking-tight">Garata</div>
        
        {/* Desktop */}
        <div className="hidden lg:flex items-center gap-6">
          {links.map((l) => (
            <a key={l.name} href={l.href} className="text-sm text-white/70 hover:text-white transition">{l.name}</a>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-4">
          <button className="text-sm text-white/70 hover:text-white">Masuk</button>
          <button onClick={() => setLang(lang === "ID" ? "EN" : "ID")} className="px-2 py-1 text-xs font-bold border border-white/20 rounded hover:bg-white/10">
            {lang}
          </button>
          <Link to="/auth" search={{ mode: "register" }} className="px-5 py-2 text-sm font-semibold text-black rounded-full transition hover:brightness-110" style={{ background: BRAND.gold }}>
            Mulai Gratis
          </Link>
        </div>

        {/* Mobile Toggle */}
        <div className="flex items-center gap-4 lg:hidden">
          <button onClick={() => setLang(lang === "ID" ? "EN" : "ID")} className="text-xs font-bold">{lang}</button>
          <button onClick={() => setIsOpen(!isOpen)}>{isOpen ? <X /> : <Menu />}</button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute top-full w-full border-b border-white/10 bg-[#050505] p-6 lg:hidden flex flex-col gap-4">
          {links.map((l) => (
            <a key={l.name} href={l.href} onClick={() => setIsOpen(false)} className="text-lg font-medium">{l.name}</a>
          ))}
          <div className="pt-4 border-t border-white/10 flex flex-col gap-4">
             <button className="text-left">Masuk</button>
             <Link to="/auth" search={{ mode: "register" }} className="w-full py-3 text-center font-semibold text-black rounded-full" style={{ background: BRAND.gold }}>
               Mulai Gratis
             </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/*  HERO, CAROUSEL, BENTO, LOGO FUNCTIONS (Sama seperti kode asli)            */
/* -------------------------------------------------------------------------- */

// ... (Paste fungsi useTypewriter, HeroMockup, AutoCarousel, LogoAuto, Bento dari kode lama Anda di sini) ...

function Index() {
  return (
    <div className="min-h-screen text-white" style={{ background: BRAND.bg }}>
      <Navbar />

      <section className="relative overflow-hidden pt-28 pb-20 sm:pt-32 sm:pb-28">
        {/* ... Hero Section ... */}
      </section>

      <section id="showcase" className="relative py-16 sm:py-20">
        {/* ... Carousels ... */}
      </section>

      <section id="galeri" className="relative py-16 sm:py-20">
        <Bento />
      </section>

      <section id="logo" className="relative py-16 sm:py-20">
        <LogoAuto images={logoShowcase} />
      </section>

      <section id="keunggulan" className="relative py-16 sm:py-20">
        {/* ... Why Us ... */}
      </section>

      <section id="cara-kerja" className="relative py-16 sm:py-20">
        {/* ... How it works ... */}
      </section>

      <section id="faq" className="relative py-16 sm:py-20">
        {/* ... FAQ ... */}
      </section>

      <section id="harga" className="relative py-20">
        {/* ... CTA ... */}
      </section>

      <footer className="relative w-full pt-16" style={{ background: BRAND.bgFooter }}>
        {/* ... Footer ... */}
      </footer>
    </div>
  );
}
