// ============================================================================
// CENTRALIZED ASSET CONFIG — CetakIDe Landing Page
// Replace these placeholder URLs with local paths (e.g. "/assets/hero/1.webp")
// once real files are added to /public or imported from src/assets.
// ============================================================================

export const BRAND = {
  name: "CetakIDe",
  footerBrand: "Garata",
  whatsapp: "https://wa.me/6288975958005",
  gold: "#EAB308",
  bg: "#050505",
  bgFooter: "#030303",
};

// ---------- HERO: 5 mockup cards that scatter after "Generating..." ----------
// Swap these paths to /assets/mockup-cards/1.webp ... 5.webp when ready.
export const heroMockupCards: string[] = [
  "https://placehold.co/600x750/0a0a0a/EAB308?text=Sneaker+01",
  "https://placehold.co/600x750/111111/EAB308?text=Sneaker+02",
  "https://placehold.co/600x750/0a0a0a/EAB308?text=Sneaker+03",
  "https://placehold.co/600x750/141414/EAB308?text=Sneaker+04",
  "https://placehold.co/600x750/0a0a0a/EAB308?text=Sneaker+05",
];

export const heroPrompt =
  "Sepatu sneakers premium hitam untuk iklan instagram, efek cahaya dramatis...";

// ---------- ADS CATEGORY CAROUSELS (5 sequential) ----------
// Each category becomes its own auto-playing infinite carousel.
const ph = (label: string, tint = "111111") =>
  `https://placehold.co/800x800/${tint}/EAB308?text=${encodeURIComponent(label)}`;

export const carouselData: { title: string; subtitle: string; images: string[] }[] = [
  {
    title: "Iklan Instagram Feed",
    subtitle: "1:1 · siap posting",
    images: Array.from({ length: 8 }, (_, i) => ph(`IG Feed ${i + 1}`, "0a0a0a")),
  },
  {
    title: "Instagram Story & Reels",
    subtitle: "9:16 · vertical premium",
    images: Array.from({ length: 8 }, (_, i) => ph(`Story ${i + 1}`, "141414")),
  },
  {
    title: "Facebook Ads",
    subtitle: "1.91:1 · CTR tinggi",
    images: Array.from({ length: 8 }, (_, i) => ph(`FB Ads ${i + 1}`, "0f0f0f")),
  },
  {
    title: "YouTube Thumbnail",
    subtitle: "16:9 · click magnet",
    images: Array.from({ length: 8 }, (_, i) => ph(`YT Thumb ${i + 1}`, "181818")),
  },
  {
    title: "Marketplace Banner",
    subtitle: "Shopee · Tokopedia · TikTok",
    images: Array.from({ length: 8 }, (_, i) => ph(`Marketplace ${i + 1}`, "0a0a0a")),
  },
];

// ---------- BENTO: multi-niche visual grid ----------
// Each niche = 1 main (4:5) + 4 small (1:1).
export type Niche = "Semua" | "Kuliner" | "Fashion" | "Otomotif" | "Properti";

export const nicheTabs: Niche[] = ["Semua", "Kuliner", "Fashion", "Otomotif", "Properti"];

export const bentoByNiche: Record<Exclude<Niche, "Semua">, { main: string; small: string[] }> = {
  Kuliner: {
    main: ph("Kuliner Hero 4:5", "0a0a0a"),
    small: [ph("Kuliner 1"), ph("Kuliner 2"), ph("Kuliner 3"), ph("Kuliner 4")],
  },
  Fashion: {
    main: ph("Fashion Hero 4:5", "111111"),
    small: [ph("Fashion 1"), ph("Fashion 2"), ph("Fashion 3"), ph("Fashion 4")],
  },
  Otomotif: {
    main: ph("Otomotif Hero 4:5", "0f0f0f"),
    small: [ph("Otomotif 1"), ph("Otomotif 2"), ph("Otomotif 3"), ph("Otomotif 4")],
  },
  Properti: {
    main: ph("Properti Hero 4:5", "141414"),
    small: [ph("Properti 1"), ph("Properti 2"), ph("Properti 3"), ph("Properti 4")],
  },
};

// ---------- LOGO SHOWCASE (7-10 items) ----------
export const logoShowcase: string[] = Array.from({ length: 10 }, (_, i) =>
  `https://placehold.co/400x400/0a0a0a/EAB308?text=LOGO+${i + 1}`,
);

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
    title: "Hasil Siap Tayang",
    desc: "Resolusi HD, aspect ratio otomatis untuk IG, FB, dan YouTube — tanpa perlu edit ulang.",
  },
  {
    title: "Tanpa Langganan",
    desc: "Bayar sekali, pakai sesuai kebutuhan. Cukup potong saldo Rp1.000 per generate.",
  },
  {
    title: "Konsisten dengan Brand",
    desc: "Warna, mood, dan gaya visual dijaga presisi supaya identitas brand tidak berantakan.",
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