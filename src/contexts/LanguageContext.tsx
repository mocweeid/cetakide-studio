import { createContext, useContext, useState, ReactNode } from "react";

type Language = "ID" | "EN";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const DICTIONARY: Record<Language, Record<string, string>> = {
  ID: {
    "nav.home": "Beranda",
    "nav.dashboardFeatures": "Fitur Dashboard",
    "nav.resources": "Sumber Daya",
    "nav.faq": "FAQ",
    "nav.pricing": "Harga",
    "nav.login": "Masuk",
    "nav.startFree": "Mulai Gratis",
    "nav.toDashboard": "Ke Dashboard",
    
    "hero.badge": "Cetak Ide · AI Visual Builder Instan",
    "hero.title1": "Visual iklan siap tayang,",
    "hero.title2": "dalam satu klik.",
    "hero.subtitle": "Ketik prompt, pilih format, cetak visual — Instagram, Facebook Ads, YouTube, dan marketplace, semua keluar dalam hitungan detik.",
    "hero.button.dashboard": "Ke Dashboard Saya",
    "hero.button.free": "Coba Gratis Sekarang",
    "hero.button.showcase": "Lihat Contoh Hasil",
    
    "dashboard.title": "Dashboard",
  },
  EN: {
    "nav.home": "Home",
    "nav.dashboardFeatures": "Dashboard Features",
    "nav.resources": "Resources",
    "nav.faq": "FAQ",
    "nav.pricing": "Pricing",
    "nav.login": "Log In",
    "nav.startFree": "Start Free",
    "nav.toDashboard": "To Dashboard",
    "nav.logout": "Log Out",
    
    "hero.badge": "Cetak Ide · Instant AI Visual Builder",
    "hero.title1": "Ready-to-publish ad visuals,",
    "hero.title2": "in one click.",
    "hero.subtitle": "Type a prompt, pick a format, print visuals — Instagram, Facebook Ads, YouTube, and marketplace, all ready in seconds.",
    "hero.button.dashboard": "To My Dashboard",
    "hero.button.free": "Try For Free Now",
    "hero.button.showcase": "View Showcase",
    
    "dashboard.title": "Dashboard",
    
    // --- hero.prompt ---
    "Buatkan poster iklan desain kekinian untuk bisnis saya...": "Create a modern design ad poster for my business...",
    
    // --- index.tsx Headers ---
    "Buat Konten Spesifik": "Create Specific Content",
    "Untuk Semua Platform": "For All Platforms",
    "Fitur Unggulan": "Key Features",
    "Dirancang untuk Kreator & Digital Marketer": "Designed for Creators & Digital Marketers",
    "Cara Kerja Cetak Ide": "How Cetak Ide Works",
    "3 Langkah Mudah": "3 Easy Steps",
    "Pertanyaan Umum": "Frequently Asked Questions",
    "Lihat Contoh Hasil": "View Showcase",
    "Coba Gratis Sekarang": "Try Free Now",
    "Ke Dashboard Saya": "Go to My Dashboard",
    "Mulai Gratis Sekarang": "Start Free Now",
    "Harga Transparan, Hasil Maksimal": "Transparent Pricing, Maximum Results",
    "Harga": "Pricing",
    
    // --- site-assets.ts ---
    "Iklan Instagram Feed": "Instagram Feed Ads",
    "1:1 · siap posting": "1:1 · ready to post",
    "Instagram Story & Reels": "Instagram Story & Reels",
    "9:16 · vertical premium": "9:16 · premium vertical",
    "Facebook Ads": "Facebook Ads",
    "1:1 · CTR tinggi": "1:1 · high CTR",
    "Semua": "All",
    "Kuliner": "Culinary",
    "Fashion": "Fashion",
    "Otomotif": "Automotive",
    "Properti": "Property",
    "Visual dicetak": "Visuals generated",
    "Brand aktif": "Active brands",
    "Rata-rata generate": "Avg generation time",
    "Rating pengguna": "User rating",
    "Menyusun 5 visual...": "Generating 5 visuals...",
    
    "AI Visual Builder": "AI Visual Builder",
    "Hasilkan desain visual dari teks prompt langsung di atas kanvas dengan aspect ratio khusus sosmed.": "Generate visual designs from text prompts directly on canvas with social media aspect ratios.",
    "Manajemen Brand Kit": "Brand Kit Management",
    "Simpan nama brand dan palet warna (Color Palette) Anda, lalu terapkan ke semua desain secara instan.": "Save your brand name and color palette, then apply them to all designs instantly.",
    "Koleksi Template": "Template Collection",
    "Akses berbagai template layout dasar untuk mempercepat proses pembuatan konten iklan profesional.": "Access various basic layout templates to speed up the process of creating professional ad content.",
    "Kustomisasi Tipografi": "Typography Customization",
    "Ubah jenis huruf sesuka hati dari belasan pilihan font premium populer langsung di dashboard.": "Change fonts freely from dozens of popular premium font choices directly in the dashboard.",
    "Auto Uploader Media": "Auto Media Uploader",
    "Pilih gambar dari galeri visual picker atau unggah aset logo tambahan dengan sangat mudah.": "Select images from the visual picker gallery or upload additional logo assets very easily.",
    "Sistem Saldo (Tanpa Langganan)": "Balance System (No Subscription)",
    "Tidak perlu kartu kredit langganan bulanan. Cetak gambar dan fitur cukup potong saldo di dalam dashboard.": "No monthly subscription credit card needed. Generate images and use features simply by deducting your dashboard balance.",
    
    "Tulis Prompt": "Write a Prompt",
    "Deskripsikan produk & suasana yang kamu mau.": "Describe the product & vibe you want.",
    "Pilih Format": "Select Format",
    "Instagram, Facebook Ads, atau YouTube Thumbnail.": "Instagram, Facebook Ads, or YouTube Thumbnail.",
    "Cetak & Unduh": "Generate & Download",
    "1 klik. Visual siap tayang dalam hitungan detik.": "1 click. Ready-to-publish visuals in seconds.",
    
    "Apakah hasilnya bebas dipakai untuk iklan berbayar?": "Are the results free to use for paid ads?",
    "Ya. Semua visual yang kamu generate bebas dipakai untuk iklan Meta Ads, TikTok Ads, Google Ads, maupun konten organik.": "Yes. All visuals you generate are free to use for Meta Ads, TikTok Ads, Google Ads, as well as organic content.",
    "Berapa biaya per generate?": "How much does it cost per generation?",
    "Cukup Rp1.000 per generate. Tidak ada biaya langganan bulanan.": "Only Rp1,000 per generation. No monthly subscription fees.",
    "Apakah bisa untuk niche selain 4 kategori di atas?": "Can it be used for niches other than the 4 categories above?",
    "Bisa. 4 niche hanya contoh — sistem mendukung semua kategori bisnis: jasa, digital product, event, edukasi, dll.": "Yes. The 4 niches are just examples — the system supports all business categories: services, digital products, events, education, etc.",
    "Bagaimana jika hasilnya kurang cocok?": "What if the result isn't suitable?",
    "Ulangi generate atau perhalus prompt-nya. Kamu tetap punya kendali penuh atas hasil akhir.": "Regenerate or refine the prompt. You always have full control over the final result.",
    
    "Produk": "Products",
    "Perusahaan": "Company",
    "Sumber Daya": "Resources",
    "Legal": "Legal",
    "Fitur": "Features",
    "Showcase": "Showcase",
    "Tentang Kami": "About Us",
    "Blog": "Blog",
    "Karir": "Careers",
    "Kontak": "Contact",
    "Panduan": "Guides",
    "Tutorial": "Tutorials",
    "API Docs": "API Docs",
    "Status": "Status",
    "Syarat & Ketentuan": "Terms & Conditions",
    "Kebijakan Privasi": "Privacy Policy",
    "Refund Policy": "Refund Policy",
    
    // --- new index.tsx strings ---
    "Semua Format Iklan": "All Ad Formats",
    "1 tool untuk semua channel pemasaran": "1 tool for all marketing channels",
    "Auto-generated": "Auto-generated",
    "Contoh Hasil Visual": "Visual Result Examples",
    "Cocok untuk semua niche bisnis": "Suitable for all business niches",
    "Logo & Brand Identity": "Logo & Brand Identity",
    "Cetak logo brand dalam hitungan detik": "Generate brand logos in seconds",
    "Kenapa Cetak Ide": "Why Cetak Ide",
    "Dibangun untuk performa iklan": "Built for ad performance",
    "Fitur Lengkap Dashboard": "Complete Dashboard Features",
    "Semua yang Anda Butuhkan": "Everything You Need",
    "Tidak sekadar meng-generate gambar, kami memberikan kontrol penuh atas identitas brand Anda di dalam satu Workspace.": "More than just generating images, we give you full control over your brand identity in a single Workspace.",
    "Terapkan warna perusahaan Anda secara otomatis ke setiap desain.": "Apply your company colors automatically to every design.",
    "Aktif": "Active",
    "Ubah tipografi sesuka hati dari pilihan font premium populer.": "Change typography freely from popular premium font choices.",
    "Unggah produk atau logo, AI akan menghapus background otomatis.": "Upload products or logos, AI will remove the background automatically.",
    "Klik untuk upload gambar": "Click to upload image",
    "How It Works": "How It Works",
    "3 langkah, visual jadi": "3 steps, visuals done",
    "Pertanyaan yang sering ditanya": "Frequently asked questions",
    "Promo Starter — Terbatas": "Starter Promo — Limited",
    "Mulai Cetak Ide hari ini": "Start Cetak Ide today",
    "Semua fitur, saldo awal Rp50.000, tanpa langganan bulanan.": "All features, initial balance Rp50,000, no monthly subscription.",
    "Ke Dashboard": "To Dashboard",
    "Ambil Promo": "Claim Promo",
    "Platform AI visual builder untuk brand, marketer, dan kreator. Cetak visual iklan dalam hitungan detik — tanpa desainer, tanpa langganan.": "AI visual builder platform for brands, marketers, and creators. Generate ad visuals in seconds — without designers, without subscriptions.",
    "Butuh bantuan?": "Need help?"
  }
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>("ID");

  const toggleLang = () => {
    setLang((prev) => (prev === "ID" ? "EN" : "ID"));
  };

  const t = (key: string) => {
    return DICTIONARY[lang][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
