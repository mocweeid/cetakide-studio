import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import { Sparkles, Loader2, Menu, X } from "lucide-react";
import { BRAND, carouselData, logoShowcase } from "@/config/site-assets";

export const Route = createFileRoute("/")({ component: Index });

/* -------------------------------------------------------------------------- */
/*  NAVBAR & LOGIC                                                            */
/* -------------------------------------------------------------------------- */

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
        <div className="text-xl font-bold">CetakIde</div>
        <div className="hidden lg:flex items-center gap-6">
          {links.map((l) => <a key={l.name} href={l.href} className="text-sm text-white/70 hover:text-white transition">{l.name}</a>)}
        </div>
        <Link to="/auth" search={{ mode: "register" }} className="hidden lg:block px-5 py-2 text-sm font-semibold text-black rounded-full" style={{ background: BRAND.gold }}>Mulai Gratis</Link>
        <button className="lg:hidden" onClick={() => setIsOpen(!isOpen)}>{isOpen ? <X /> : <Menu />}</button>
      </div>
      {isOpen && (
        <div className="absolute top-full w-full bg-[#050505] p-6 lg:hidden flex flex-col gap-4 border-b border-white/10">
          {links.map((l) => <a key={l.name} href={l.href} onClick={() => setIsOpen(false)} className="text-sm">{l.name}</a>)}
        </div>
      )}
    </nav>
  );
}

function Index() {
  return (
    <div className="min-h-screen text-white" style={{ background: BRAND.bg }}>
      {/* INJECTED SMOOTH SCROLL CSS */}
      <style>{`html { scroll-behavior: smooth; }`}</style>
      
      <Navbar />
      
      <section className="pt-32 pb-20 px-4 text-center">
        <h1 className="text-5xl font-extrabold mb-6">Visual iklan siap tayang</h1>
        <p className="text-white/60">Dalam satu klik, hasilkan visual profesional.</p>
      </section>

      <section id="showcase" className="py-20 max-w-7xl mx-auto px-4"><h2 className="text-3xl font-bold text-center mb-10">Contoh Visual</h2></section>
      <section id="galeri" className="py-20 text-center"><h2 className="text-3xl font-bold">Galeri</h2></section>
      <section id="logo" className="py-20 text-center"><h2 className="text-3xl font-bold">Logo AI</h2></section>
      <section id="keunggulan" className="py-20 text-center"><h2 className="text-3xl font-bold">Keunggulan</h2></section>
      <section id="cara-kerja" className="py-20 text-center"><h2 className="text-3xl font-bold">Cara Kerja</h2></section>
      <section id="faq" className="py-20 text-center"><h2 className="text-3xl font-bold">FAQ</h2></section>
      <section id="harga" className="py-20 text-center"><h2 className="text-3xl font-bold">Harga</h2></section>
      
      <footer className="py-10 border-t border-white/10 text-center">© {new Date().getFullYear()} CetakIde</footer>
    </div>
  );
}
