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
  goldGradient: "linear-gradient(135deg, #EAB308, #CA8A04, #FACC15)",
  bg: "#0A0F1E",
  bgFooter: "#050810",
};

// ---------- HERO: 5 mockup cards that scatter after "Generating..." ----------
// Swap these paths to /assets/mockup-cards/1.webp ... 5.webp when ready.
export const heroMockupCards: string[] = [
  "/assets/feed-ig/ig-1.png",
  "/assets/feed-ig/ig-2.png",
  "/assets/feed-ig/ig-3.png",
  "/assets/feed-ig/ig-4.png",
  "/assets/feed-ig/ig-5.png",
];

export const heroPrompt =
  "Sepatu sneakers premium hitam untuk iklan instagram, efek cahaya dramatis...";

// ---------- ADS CATEGORY CAROUSELS (5 sequential) ----------
// Each category becomes its own auto-playing infinite carousel.
const ph = (label: string, tint = "111111") =>
  `https://placehold.co/800x800/${tint}/EAB308?text=${encodeURIComponent(label)}`;

export const carouselData: { title: string; subtitle: string; aspectClass?: string; width?: number; images: string[] }[] = [
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
      "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=800&h=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1557821552-17105176677c?q=80&w=800&h=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=800&h=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&h=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=800&h=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?q=80&w=800&h=800&auto=format&fit=crop",
    ],
  },
];

// ---------- BENTO: multi-niche visual grid ----------
// Each niche = 1 main (4:5) + 4 small (1:1).
export type Niche = "Semua" | "Kuliner" | "Fashion" | "Otomotif" | "Properti";

export const nicheTabs: Niche[] = ["Semua", "Kuliner", "Fashion", "Otomotif", "Properti"];

export const bentoByNiche: Record<Exclude<Niche, "Semua">, { main: string; small: string[] }> = {
  Kuliner: {
    main: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&h=1000&auto=format&fit=crop",
    small: [
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=400&h=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=400&h=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&h=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1484723091791-00d312214432?q=80&w=400&h=400&auto=format&fit=crop",
    ],
  },
  Fashion: {
    main: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&h=1000&auto=format&fit=crop",
    small: [
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=400&h=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=400&h=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=400&h=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1434389678232-04ce6ac5b905?q=80&w=400&h=400&auto=format&fit=crop",
    ],
  },
  Otomotif: {
    main: "https://images.unsplash.com/photo-1503376710777-62b1a13fa09f?q=80&w=800&h=1000&auto=format&fit=crop",
    small: [
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=400&h=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=400&h=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=400&h=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1553440569-bcc63803a83d?q=80&w=400&h=400&auto=format&fit=crop",
    ],
  },
  Properti: {
    main: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800&h=1000&auto=format&fit=crop",
    small: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=400&h=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=400&h=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=400&h=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=400&h=400&auto=format&fit=crop",
    ],
  },
};

// ---------- LOGO SHOWCASE (7-10 items) ----------
export const logoShowcase: string[] = [
  "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?q=80&w=400&h=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1622676067757-0a4ff499ea8b?q=80&w=400&h=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1558000143-a6042db63212?q=80&w=400&h=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1616186835106-9be62dafb1ec?q=80&w=400&h=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?q=80&w=400&h=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1563694983011-6f4bb44ab124?q=80&w=400&h=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?q=80&w=400&h=400&auto=format&fit=crop",
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
