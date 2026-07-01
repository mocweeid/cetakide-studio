import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle, CreditCard, Bot, MessageSquareWarning,
  Check, X, Sparkles, Users, Megaphone, Store,
  Youtube, Palette, Building2, ArrowRight, Zap,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { BannerCarousel, LogoCarousel } from "@/components/carousels";

export const Route = createFileRoute("/")({
  component: Index,
});

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
