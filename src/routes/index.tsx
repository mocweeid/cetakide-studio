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

        <div className="flex items-center gap-4 lg:hidden">
          <button onClick={() => setLang(lang === "ID" ? "EN" : "ID")} className="text-xs font-bold">{lang}</button>
          <button onClick={() => setIsOpen(!isOpen)}>{isOpen ? <X /> : <Menu />}</button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full w-full border-b border-white/10 bg-[#050505] p-6 lg:hidden flex flex-col gap-4">
          {links.map((l) => (
            <a key={l.name} href={l.href} onClick={() => setIsOpen(false)} className="text-lg font-medium">{l.name}</a>
          ))}
          <hr className="border-white/10" />
          <button className="text-left">Masuk</button>
          <Link to="/auth" search={{ mode: "register" }} className="w-full py-3 text-center font-semibold text-black rounded-full" style={{ background: BRAND.gold }}>
            Mulai Gratis
          </Link>
        </div>
      )}
    </nav>
  );
}

/* --- (Fungsi HeroMockup, AutoCarousel, LogoAuto, Bento tetap sama) --- */
// [Paste fungsi-fungsi HeroMockup, AutoCarousel, LogoAuto, Bento dari kode asal Anda di sini]

function Index() {
  return (
    <div className="min-h-screen text-white" style={{ background: BRAND.bg }}>
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden pt-28 pb-20 sm:pt-32 sm:pb-28">
        {/* (Isi Hero Anda tetap sama) */}
      </section>

      {/* CATEGORY CAROUSELS */}
      <section id="showcase" className="relative py-16 sm:py-20">
        {/* (Isi Carousel) */}
      </section>

      {/* GALERI (Tambahkan ID ini agar navigasi 'Galeri' berfungsi) */}
      <section id="galeri" className="relative py-16 sm:py-20">
        <Bento />
      </section>

      {/* LOGO AI */}
      <section id="logo" className="relative py-16 sm:py-20">
        <LogoAuto images={logoShowcase} />
      </section>

      {/* KEUNGGULAN (Why Us) */}
      <section id="keunggulan" className="relative py-16 sm:py-20">
        {/* (Isi Why Us) */}
      </section>

      {/* CARA KERJA */}
      <section id="cara-kerja" className="relative py-16 sm:py-20">
        {/* (Isi How it Works) */}
      </section>

      {/* FAQ */}
      <section id="faq" className="relative py-16 sm:py-20">
        {/* (Isi FAQ) */}
      </section>

      {/* HARGA */}
      <section id="harga" className="relative py-20">
        {/* (Isi Pricing) */}
      </section>

      {/* FOOTER */}
      <footer className="relative w-full pt-16" style={{ background: BRAND.bgFooter }}>
        {/* (Isi Footer) */}
      </footer>
    </div>
  );
}
