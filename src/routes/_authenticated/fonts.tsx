import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, useAppUser } from "@/components/app-shell";
import { Type, Upload, Star, Search, Eye } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/fonts")({
  head: () => ({
    meta: [{ title: "Font Manager — CetakIde" }, { name: "robots", content: "noindex" }],
  }),
  component: FontsPage,
});

const SYSTEM_FONTS = [
  {
    id: "1",
    name: "Plus Jakarta Sans",
    category: "Sans Serif",
    weights: ["Regular", "Medium", "SemiBold", "Bold", "ExtraBold"],
    preview: "Visual Iklan Premium",
  },
  {
    id: "2",
    name: "Inter",
    category: "Sans Serif",
    weights: ["Regular", "Medium", "SemiBold", "Bold"],
    preview: "Desain Modern Bersih",
  },
  {
    id: "3",
    name: "Outfit",
    category: "Sans Serif",
    weights: ["Light", "Regular", "Medium", "Bold"],
    preview: "Brand Yang Stylish",
  },
  {
    id: "4",
    name: "Poppins",
    category: "Sans Serif",
    weights: ["Regular", "SemiBold", "Bold", "ExtraBold"],
    preview: "Konten Sosial Media",
  },
  {
    id: "5",
    name: "Montserrat",
    category: "Sans Serif",
    weights: ["Regular", "Medium", "Bold", "Black"],
    preview: "Iklan Premium Luxury",
  },
  {
    id: "6",
    name: "Roboto",
    category: "Sans Serif",
    weights: ["Regular", "Medium", "Bold"],
    preview: "Teks Profesional Bersih",
  },
  {
    id: "7",
    name: "Playfair Display",
    category: "Serif",
    weights: ["Regular", "Bold", "Black"],
    preview: "Konten Elegan Luxury",
  },
  {
    id: "8",
    name: "Merriweather",
    category: "Serif",
    weights: ["Regular", "Bold", "Black"],
    preview: "Editorial & Blog Post",
  },
  {
    id: "9",
    name: "Dancing Script",
    category: "Script",
    weights: ["Regular", "Medium", "Bold"],
    preview: "Sentuhan Personal",
  },
  {
    id: "10",
    name: "Pacifico",
    category: "Script",
    weights: ["Regular"],
    preview: "Fun & Playful Vibe",
  },
];

function FontsPage() {
  const { user } = useAppUser();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua");
  const [favorites, setFavorites] = useState<string[]>(["1", "2"]);
  const [previewText, setPreviewText] = useState("Visual Iklan Premium");
  const [previewSize, setPreviewSize] = useState(32);

  const categories = ["Semua", "Sans Serif", "Serif", "Script"];

  const filtered = SYSTEM_FONTS.filter((f) => {
    const matchCat = category === "Semua" || f.category === category;
    const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  function toggleFav(id: string) {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
    toast.success(favorites.includes(id) ? "Dihapus dari favorit" : "Ditambahkan ke favorit");
  }

  return (
    <AppShell
      title="Font Manager"
      subtitle="Kelola dan pratinjau font untuk visual brand Anda"
      user={user}
    >
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Font", value: SYSTEM_FONTS.length.toString() },
            { label: "Font Favorit", value: favorites.length.toString() },
            { label: "Kategori", value: "3" },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 sm:p-4 text-center backdrop-blur-md"
            >
              <p className="font-display text-xl sm:text-2xl font-bold text-primary">{value}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Left: Font List */}
          <div className="lg:col-span-2 space-y-3">
            {/* Search & Filter */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari font..."
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-9 pr-4 text-sm placeholder:text-white/30 focus:border-primary/50 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${category === cat ? "border-primary bg-primary/20 text-primary" : "border-white/10 text-white/60 hover:border-white/30 hover:text-white"}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Cards */}
            <div className="space-y-2">
              {filtered.map((font) => (
                <div
                  key={font.id}
                  className="group rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md transition hover:border-white/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-white">{font.name}</p>
                        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] text-muted-foreground">
                          {font.category}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mb-2">
                        {font.weights.join(" · ")}
                      </p>
                      {/* Font Preview */}
                      <p
                        className="text-white/90 transition-all"
                        style={{ fontFamily: font.name, fontSize: "20px", lineHeight: "1.3" }}
                      >
                        {previewText}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2">
                      <button
                        onClick={() => toggleFav(font.id)}
                        className="rounded-lg border border-white/10 p-2 transition hover:bg-white/10"
                      >
                        <Star
                          className={`h-3.5 w-3.5 transition ${favorites.includes(font.id) ? "fill-primary text-primary" : "text-white/40"}`}
                        />
                      </button>
                      <button
                        onClick={() => setPreviewText(font.preview)}
                        className="rounded-lg border border-white/10 p-2 transition hover:bg-white/10 text-muted-foreground hover:text-white"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Upload Custom Font */}
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center">
              <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium text-white/80 mb-1">Upload Font Custom</p>
              <p className="text-xs text-muted-foreground mb-3">Mendukung format TTF, OTF, WOFF</p>
              <button
                onClick={() => toast.info("Fitur upload font akan segera hadir!")}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/60 hover:bg-white/10 hover:text-white"
              >
                Pilih File Font
              </button>
            </div>
          </div>

          {/* Right: Preview Panel */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
              <h3 className="mb-4 text-sm font-semibold flex items-center gap-2">
                <Type className="h-4 w-4 text-muted-foreground" /> Preview Panel
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Teks Preview
                  </label>
                  <input
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm placeholder:text-white/30 focus:border-primary/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Ukuran: {previewSize}px
                  </label>
                  <input
                    type="range"
                    min={12}
                    max={72}
                    value={previewSize}
                    onChange={(e) => setPreviewSize(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>
              </div>
            </div>

            {/* Font Favorites */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
              <h3 className="mb-3 text-sm font-semibold flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" /> Font Favorit
              </h3>
              {favorites.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Belum ada font favorit
                </p>
              ) : (
                <div className="space-y-2">
                  {SYSTEM_FONTS.filter((f) => favorites.includes(f.id)).map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2"
                    >
                      <p className="text-sm font-medium" style={{ fontFamily: f.name }}>
                        {f.name}
                      </p>
                      <span className="text-[10px] text-muted-foreground">{f.category}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
