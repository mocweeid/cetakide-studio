import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

const links = [
  { to: "#showcase", label: "Showcase" },
  { to: "#bento", label: "Contoh Hasil" },
  { to: "#logo", label: "Logo" },
  { to: "#stats", label: "Statistik" },
  { to: "#keunggulan", label: "Keunggulan" },
  { to: "#cara-kerja", label: "Cara Kerja" },
  { to: "#faq", label: "FAQ" },
  { to: "#harga", label: "Harga" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
        scrolled ? "glass-panel-strong py-2" : "py-4"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg gradient-gold text-black">
            <Sparkles className="h-4 w-4" />
          </span>
          <span>
            Cetak<span className="text-gradient-gold">Ide</span>
          </span>
        </Link>

        <nav className="flex items-center gap-4 overflow-x-auto md:gap-7">
          {links.map((l) => (
            <a
              key={l.to}
              href={l.to}
              className="whitespace-nowrap text-sm text-muted-foreground transition hover:text-primary"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/auth"
            className="hidden rounded-full px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground sm:inline-block"
          >
            Masuk
          </Link>
          <Link
            to="/auth"
            search={{ mode: "register" }}
            className="glow-gold rounded-full gradient-gold px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110"
          >
            Coba Gratis
          </Link>
        </div>
      </div>
    </header>
  );
}
