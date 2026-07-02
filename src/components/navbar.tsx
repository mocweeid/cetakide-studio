import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Menu, X } from "lucide-react";
import { BRAND } from "@/config/site-assets";

const navLinks = [
  { to: "#", label: "Beranda" },
  { to: "#showcase", label: "Contoh Visual" },
  { to: "#bento", label: "Galeri" },
  { to: "#logo", label: "Logo AI" },
  { to: "#keunggulan", label: "Keunggulan" },
  { to: "#cara-kerja", label: "Cara Kerja" },
  { to: "#faq", label: "FAQ" },
  { to: "#harga", label: "Harga" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/20 bg-white/[0.06] backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 font-display text-lg font-bold text-white">
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-black"
              style={{ background: BRAND.gold }}
            >
              <Sparkles className="h-4 w-4" />
            </span>
            <span>{BRAND.name}</span>
          </a>

          {/* Desktop Menu */}
          <div className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.to}
                href={link.to}
                className="group relative text-sm text-white/70 transition-all duration-300 hover:text-white"
                onClick={closeMenu}
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-gradient-to-r from-transparent via-yellow-400 to-transparent transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
            <Link
              to="/auth"
              search={{ mode: "register" }}
              className="group relative overflow-hidden rounded-full px-5 py-2 text-sm font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-lg"
              style={{ background: BRAND.gold }}
            >
              <span className="relative z-10">Mulai Gratis</span>
              <div className="absolute inset-0 -translate-x-full bg-white/30 transition-transform duration-500 group-hover:translate-x-0" />
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={toggleMenu}
            className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white md:hidden"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="border-t border-white/10 py-4 md:hidden">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.to}
                  href={link.to}
                  className="group relative text-sm text-white/70 transition-all duration-300 hover:text-white"
                  onClick={closeMenu}
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-gradient-to-r from-transparent via-yellow-400 to-transparent transition-all duration-300 group-hover:w-full" />
                </a>
              ))}
              <Link
                to="/auth"
                search={{ mode: "register" }}
                className="group relative overflow-hidden rounded-full px-5 py-2 text-center text-sm font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-lg"
                style={{ background: BRAND.gold }}
                onClick={closeMenu}
              >
                <span className="relative z-10">Mulai Gratis</span>
                <div className="absolute inset-0 -translate-x-full bg-white/30 transition-transform duration-500 group-hover:translate-x-0" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
