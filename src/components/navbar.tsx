import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Menu, X, ChevronDown, Globe } from "lucide-react";
import { BRAND } from "@/config/site-assets";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { useLanguage } from "@/contexts/LanguageContext";

type NavItem = {
  label: string;
  to?: string;
  children?: { label: string; to: string }[];
};

export function Navbar() {
  const { lang, toggleLang, t } = useLanguage();

  const navLinks: NavItem[] = [
    { label: t("nav.home"), to: "#" },
    {
      label: t("nav.dashboardFeatures"),
      children: [
        { label: "AI Visual Builder", to: "#ai-visual-builder" },
        { label: "Manajemen Brand Kit", to: "#fitur-preview" },
        { label: "Font Kustom", to: "#fitur-preview" },
        { label: "Auto Uploader Media", to: "#fitur-preview" },
      ],
    },
    {
      label: t("nav.resources"),
      children: [
        { label: "Galeri Contoh", to: "#bento" },
        { label: "Logo AI", to: "#logo" },
        { label: "Cara Kerja", to: "#cara-kerja" },
      ],
    },
    { label: t("nav.faq"), to: "#faq" },
    { label: t("nav.pricing"), to: "#harga" },
  ];

  const [isOpen, setIsOpen] = useState(false);
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

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/20 bg-white/[0.06] backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2">
            <img
              src="/logo/ChatGPT Image 6 Jul 2026, 13.04.45.png"
              alt={BRAND.name}
              className="h-14 w-auto object-contain"
            />
            <span
              className="font-display text-lg font-bold tracking-tight"
              style={{ color: BRAND.gold }}
            >
              {BRAND.name}
            </span>
          </a>

          {/* Desktop Menu */}
          <div className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) =>
              link.children ? (
                <div key={link.label} className="group relative">
                  <button className="flex items-center gap-1 text-sm text-white/70 transition-all duration-300 hover:text-white">
                    {link.label}
                    <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
                  </button>
                  <div className="absolute left-0 top-full hidden pt-4 group-hover:block">
                    <div className="rounded-xl border border-white/10 bg-[#0a0a0a]/95 backdrop-blur-md shadow-xl p-2 w-56 flex flex-col gap-1">
                      {link.children.map((child) => (
                        <a
                          key={child.label}
                          href={child.to}
                          className="rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white transition"
                          onClick={closeMenu}
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <a
                  key={link.to}
                  href={link.to}
                  className="group relative text-sm text-white/70 transition-all duration-300 hover:text-white"
                  onClick={closeMenu}
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-gradient-to-r from-transparent via-yellow-400 to-transparent transition-all duration-300 group-hover:w-full" />
                </a>
              ),
            )}
            {session ? (
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleLang}
                  className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {lang}
                </button>
                <Link
                  to="/dashboard"
                  className="group relative overflow-hidden rounded-full px-5 py-2 text-sm font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  style={{ background: BRAND.gold }}
                >
                  <span className="relative z-10">{t("nav.toDashboard")}</span>
                  <div className="absolute inset-0 -translate-x-full bg-white/30 transition-transform duration-500 group-hover:translate-x-0" />
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleLang}
                  className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {lang}
                </button>
                <Link
                  to="/auth"
                  search={{ mode: "login" }}
                  className="px-4 py-2 text-sm font-semibold text-white/80 transition-colors hover:text-white"
                >
                  {t("nav.login")}
                </Link>
                <Link
                  to="/auth"
                  search={{ mode: "register" }}
                  className="group relative overflow-hidden rounded-full px-5 py-2 text-sm font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  style={{ background: BRAND.gold }}
                >
                  <span className="relative z-10">{t("nav.startFree")}</span>
                  <div className="absolute inset-0 -translate-x-full bg-white/30 transition-transform duration-500 group-hover:translate-x-0" />
                </Link>
              </div>
            )}
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
          <div className="border-t border-white/20 bg-[#0a0f1e]/95 backdrop-blur-xl py-5 md:hidden">
            <div className="flex flex-col gap-5 px-2">
              {navLinks.map((link) =>
                link.children ? (
                  <div key={link.label} className="flex flex-col gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-white/50 px-1">{link.label}</span>
                    <div className="flex flex-col gap-1 rounded-xl bg-white/5 p-2">
                      {link.children.map((child) => (
                        <a
                          key={child.label}
                          href={child.to}
                          onClick={closeMenu}
                          className="rounded-lg px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : (
                  <a
                    key={link.to}
                    href={link.to}
                    className="rounded-xl bg-white/5 px-4 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/10 hover:text-white"
                    onClick={closeMenu}
                  >
                    {link.label}
                  </a>
                ),
              )}
              {session ? (
                <div className="flex flex-col gap-3">
                  <button
                    onClick={toggleLang}
                    className="flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <Globe className="h-4 w-4" />
                    Bahasa: {lang}
                  </button>
                  <Link
                    to="/dashboard"
                    className="group relative overflow-hidden rounded-full px-5 py-2 text-center text-sm font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    style={{ background: BRAND.gold }}
                    onClick={closeMenu}
                  >
                    <span className="relative z-10">{t("nav.toDashboard")}</span>
                    <div className="absolute inset-0 -translate-x-full bg-white/30 transition-transform duration-500 group-hover:translate-x-0" />
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <button
                    onClick={toggleLang}
                    className="flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <Globe className="h-4 w-4" />
                    Bahasa: {lang}
                  </button>
                  <Link
                    to="/auth"
                    search={{ mode: "login" }}
                    className="rounded-full border border-white/20 px-5 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-white/10"
                    onClick={closeMenu}
                  >
                    {t("nav.login")}
                  </Link>
                  <Link
                    to="/auth"
                    search={{ mode: "register" }}
                    className="group relative overflow-hidden rounded-full px-5 py-2 text-center text-sm font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    style={{ background: BRAND.gold }}
                    onClick={closeMenu}
                  >
                    <span className="relative z-10">{t("nav.startFree")}</span>
                    <div className="absolute inset-0 -translate-x-full bg-white/30 transition-transform duration-500 group-hover:translate-x-0" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
