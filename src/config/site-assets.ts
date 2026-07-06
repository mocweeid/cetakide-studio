// ============================================================================
// CENTRALIZED ASSET CONFIG — Cetak Ide Landing Page
// Replace these placeholder URLs with local paths (e.g. "/assets/hero/1.webp")
// once real files are added to /public or imported from src/assets.
// ============================================================================

export const BRAND = {
  name: "Cetak Ide",
  whatsapp: "https://wa.me/6288975958005",
  gold: "#EAB308",
  goldGradient: "linear-gradient(135deg, #EAB308, #CA8A04, #FACC15)",
  bg: "#0A0F1E",
  bgFooter: "#050810",
};

// ---------- HERO: 5 mockup cards that scatter after "Generating..." ----------
// Swap these paths to /assets/mockup-cards/1.webp ... 5.webp when ready.
export const heroMockupCards: string[] = [
  "/assets/feed-ig/ig-1.png",
  "/assets/story-ig/story-2.png",
  "/assets/feed-ig/ig-3.png",
  "/assets/story-ig/story-4.png",
  "/assets/fb-ads-standart/fb-1.png",
];

export const heroPrompt =
  "Buatkan poster iklan desain kekinian untuk bisnis saya...";

// ---------- ADS CATEGORY CAROUSELS (5 sequential) ----------
// Each category becomes its own auto-playing infinite carousel.
const ph = (label: string, tint = "111111") =>
  `https://placehold.co/800x800/${tint}/EAB308?text=${encodeURIComponent(label)}`;

export const carouselData: {
  title: string;
  subtitle: string;
  aspectClass?: string;
  width?: number;
  images: string[];
}[] = [
  {
    title: "Iklan Instagram Feed",
    subtitle: "1:1 · siap posting",
    aspectClass: "aspect-square",
    width: 220,
    images: [
      "/assets/feed-ig/ig-1.png",
      "/assets/feed-ig/ig-2.png",
      "/assets/feed-ig/ig-3.png",
      "/assets/feed-ig/ig-4.png",
      "/assets/feed-ig/ig-5.png",
      "/assets/feed-ig/ig-6.png",
      "/assets/feed-ig/ig-7.png",
      "/assets/feed-ig/ig-8.png",
    ],
  },
  {
    title: "Instagram Story & Reels",
    subtitle: "9:16 · vertical premium",
    aspectClass: "aspect-[9/16]",
    width: 160,
    images: [
      "/assets/story-ig/story-2.png",
      "/assets/story-ig/story-3.png",
      "/assets/story-ig/story-4.png",
      "/assets/story-ig/story-5.png",
      "/assets/story-ig/story-6.png",
      "/assets/story-ig/story-7.png",
      "/assets/story-ig/story-8.png",
      "/assets/story-ig/story-9.png",
    ],
  },
  {
    title: "Facebook Ads",
    subtitle: "1:1 · CTR tinggi",
    aspectClass: "aspect-square",
    width: 220,
    images: [
      "/assets/fb-ads-standart/fb-1.png",
      "/assets/fb-ads-standart/fb-2.png",
      "/assets/fb-ads-standart/fb-3.png",
      "/assets/fb-ads-standart/fb-4.png",
      "/assets/fb-ads-standart/fb-5.png",
      "/assets/fb-ads-standart/fb-6.png",
      "/assets/fb-ads-standart/fb-7.png",
      "/assets/fb-ads-standart/fb-8.png",
    ],
  },
];

// ---------- BENTO: multi-niche visual grid ----------
// Each niche = 1 main (4:5) + 4 small (1:1).
export type Niche = "Semua" | "Kuliner" | "Fashion" | "Otomotif" | "Properti";

export const nicheTabs: Niche[] = ["Semua", "Kuliner", "Fashion", "Otomotif", "Properti"];

export const bentoByNiche: Record<Exclude<Niche, "Semua">, { main: string; small: string[] }> = {
  Kuliner: {
    main: "/assets/kategori/kuliner/kuliner-1.png",
    small: [
      "/assets/kategori/kuliner/kuliner-2.png",
      "/assets/kategori/kuliner/kuliner-3.png",
      "/assets/kategori/kuliner/kuliner-4.png",
      "/assets/kategori/kuliner/kuliner-5.png",
    ],
  },
  Fashion: {
    main: "/assets/kategori/fashion/fashion-1.png",
    small: [
      "/assets/kategori/fashion/fashion-2.png",
      "/assets/kategori/fashion/fashion-3.png",
      "/assets/kategori/fashion/fashion-4.png",
      "/assets/kategori/fashion/fashion-5.png",
    ],
  },
  Otomotif: {
    main: "/assets/kategori/otomotif/otomotif-1.png",
    small: [
      "/assets/kategori/otomotif/otomotif-2.png",
      "/assets/kategori/otomotif/otomotif-3.png",
      "/assets/kategori/otomotif/otomotif-4.png",
      "/assets/kategori/otomotif/otomotif-5.png",
    ],
  },
  Properti: {
    main: "/assets/kategori/properti/properti-1.png",
    small: [
      "/assets/kategori/properti/properti-2.png",
      "/assets/kategori/properti/properti-3.png",
      "/assets/kategori/properti/properti-4.png",
      "/assets/kategori/properti/properti-5.png",
    ],
  },
};

// ---------- LOGO SHOWCASE (7-10 items) ----------
export const logoShowcase: string[] = [
  "/assets/logo-preset/logo-1.png",
  "/assets/logo-preset/logo-2.png",
  "/assets/logo-preset/logo-3.png",
  "/assets/logo-preset/logo-4.png",
  "/assets/logo-preset/logo-5.png",
  "/assets/logo-preset/logo-6.png",
  "/assets/logo-preset/logo-7.png",
  "/assets/logo-preset/logo-8.png",
  "/assets/logo-preset/logo-9.png",
  "/assets/logo-preset/logo-10.png",
];

// ---------- STATS ----------
export const stats = [
  { value: "12.400+", label: "Visual dicetak" },
  { value: "1.850+", label: "Brand aktif" },
  { value: "< 30 dtk", label: "Rata-rata generate" },
  { value: "4.9/5", label: "Rating pengguna" },
];

// ---------- WHY US ----------
export const whyUs = [
  {
    title: "AI Visual Builder",
    desc: "Hasilkan desain visual dari teks prompt langsung di atas kanvas dengan aspect ratio khusus sosmed.",
  },
  {
    title: "Manajemen Brand Kit",
    desc: "Simpan nama brand dan palet warna (Color Palette) Anda, lalu terapkan ke semua desain secara instan.",
  },
  {
    title: "Koleksi Template",
    desc: "Akses berbagai template layout dasar untuk mempercepat proses pembuatan konten iklan profesional.",
  },
  {
    title: "Kustomisasi Tipografi",
    desc: "Ubah jenis huruf sesuka hati dari belasan pilihan font premium populer langsung di dashboard.",
  },
  {
    title: "Auto Uploader Media",
    desc: "Pilih gambar dari galeri visual picker atau unggah aset logo tambahan dengan sangat mudah.",
  },
  {
    title: "Sistem Saldo (Tanpa Langganan)",
    desc: "Tidak perlu kartu kredit langganan bulanan. Cetak gambar dan fitur cukup potong saldo di dalam dashboard.",
  },
];

// ---------- HOW IT WORKS ----------
export const howItWorks = [
  { step: "01", title: "Tulis Prompt", desc: "Deskripsikan produk & suasana yang kamu mau." },
  { step: "02", title: "Pilih Format", desc: "Instagram, Facebook Ads, atau YouTube Thumbnail." },
  { step: "03", title: "Cetak & Unduh", desc: "1 klik. Visual siap tayang dalam hitungan detik." },
];

// ---------- FAQ ----------
export const faqs = [
  {
    q: "Apakah hasilnya bebas dipakai untuk iklan berbayar?",
    a: "Ya. Semua visual yang kamu generate bebas dipakai untuk iklan Meta Ads, TikTok Ads, Google Ads, maupun konten organik.",
  },
  {
    q: "Berapa biaya per generate?",
    a: "Cukup Rp1.000 per generate. Tidak ada biaya langganan bulanan.",
  },
  {
    q: "Apakah bisa untuk niche selain 4 kategori di atas?",
    a: "Bisa. 4 niche hanya contoh — sistem mendukung semua kategori bisnis: jasa, digital product, event, edukasi, dll.",
  },
  {
    q: "Bagaimana jika hasilnya kurang cocok?",
    a: "Ulangi generate atau perhalus prompt-nya. Kamu tetap punya kendali penuh atas hasil akhir.",
  },
];

// ---------- FOOTER LINKS ----------
export const footerColumns = [
  {
    title: "Produk",
    links: [
      { label: "Fitur", href: "#solusi" },
      { label: "Showcase", href: "#showcase" },
      { label: "Harga", href: "#harga" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Perusahaan",
    links: [
      { label: "Tentang Kami", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Karir", href: "#" },
      { label: "Kontak", href: "#" },
    ],
  },
  {
    title: "Sumber Daya",
    links: [
      { label: "Panduan", href: "#" },
      { label: "Tutorial", href: "#" },
      { label: "API Docs", href: "#" },
      { label: "Status", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Syarat & Ketentuan", href: "#" },
      { label: "Kebijakan Privasi", href: "#" },
      { label: "Refund Policy", href: "#" },
    ],
  },
];
