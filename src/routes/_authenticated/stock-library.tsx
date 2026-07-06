import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, useAppUser } from "@/components/app-shell";
import { Search, Download, ExternalLink, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { bentoByNiche, carouselData, logoShowcase } from "@/config/site-assets";

export const Route = createFileRoute("/_authenticated/stock-library")({
  head: () => ({
    meta: [{ title: "Stock Library — Cetak Ide" }, { name: "robots", content: "noindex" }],
  }),
  component: StockLibraryPage,
});

// Semua stock library kini dibangun dari asset yang sudah ada di web
// (bentoByNiche + carouselData + logoShowcase) — tidak lagi memakai Unsplash.
type Stock = { id: string; title: string; category: string; author: string; url: string };
const STOCK_IMAGES: Stock[] = (() => {
  const list: Stock[] = [];
  Object.entries(bentoByNiche).forEach(([niche, group]) => {
    [group.main, ...group.small].forEach((url, i) =>
      list.push({
        id: `${niche}-${i}`,
        title: `Referensi ${niche} #${i + 1}`,
        category: niche,
        author: "Cetak Ide",
        url,
      }),
    );
  });
  carouselData.forEach((c) =>
    c.images.forEach((url, i) =>
      list.push({
        id: `${c.title}-${i}`,
        title: `${c.title} #${i + 1}`,
        category: c.title,
        author: "Cetak Ide",
        url,
      }),
    ),
  );
  logoShowcase.forEach((url, i) =>
    list.push({
      id: `logo-${i}`,
      title: `Logo Preset #${i + 1}`,
      category: "Logo",
      author: "Cetak Ide",
      url,
    }),
  );
  return list;
})();

const CATEGORIES = ["Semua", ...Array.from(new Set(STOCK_IMAGES.map((s) => s.category)))];

function StockLibraryPage() {
  const { user } = useAppUser();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua");

  const filtered = STOCK_IMAGES.filter((img) => {
    const matchCat = category === "Semua" || img.category === category;
    const matchSearch =
      !search ||
      img.title.toLowerCase().includes(search.toLowerCase()) ||
      img.category.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  function handleUseAsReference(img: (typeof STOCK_IMAGES)[0]) {
    toast.success(`"${img.title}" digunakan sebagai referensi!`);
    navigate({ to: "/workspace" });
  }

  return (
    <AppShell
      title="Stock Library"
      subtitle="Ribuan gambar stok gratis untuk referensi visual Anda"
      user={user}
    >
      <div className="space-y-4">
        {/* Search & Filter */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari gambar stok..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-9 pr-4 text-sm placeholder:text-white/30 focus:border-primary/50 focus:outline-none backdrop-blur-md"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
            {CATEGORIES.map((cat) => (
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

        {/* Stats */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Menampilkan <span className="text-white font-medium">{filtered.length}</span> gambar
          </p>
          <p className="text-xs text-muted-foreground">Sumber: Koleksi Cetak Ide · Bebas dipakai</p>
        </div>

        {/* Masonry Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] py-16 text-center">
            <ImageIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Tidak ada gambar ditemukan</p>
          </div>
        ) : (
          <div className="columns-2 gap-3 sm:columns-3 md:columns-4">
            {filtered.map((img) => (
              <div
                key={img.id}
                className="group mb-3 break-inside-avoid overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={img.url}
                    alt={img.title}
                    className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100 p-3">
                    <p className="text-[10px] font-medium text-white/90 mb-2 line-clamp-2">
                      {img.title}
                    </p>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleUseAsReference(img)}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[10px] font-semibold text-black"
                        style={{ background: "linear-gradient(135deg, #EAB308, #CA8A04)" }}
                      >
                        Gunakan
                      </button>
                      <a
                        href={img.url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center rounded-lg bg-white/20 p-1.5 text-white hover:bg-white/30"
                        onClick={(e) => {
                          e.preventDefault();
                          toast.success("Mengunduh gambar...");
                        }}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                      <button
                        onClick={() => toast.info("Membuka detail asset...")}
                        className="flex items-center justify-center rounded-lg bg-white/20 p-1.5 text-white hover:bg-white/30"
                        aria-label="Detail"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="px-3 py-2">
                  <p className="text-[10px] font-medium text-white/80 truncate">{img.title}</p>
                  <p className="text-[9px] text-muted-foreground">
                    {img.category} · {img.author}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        <div className="flex justify-center pt-2">
          <button
            onClick={() => toast.info("Memuat lebih banyak gambar...")}
            className="rounded-xl border border-white/10 px-6 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white"
          >
            Muat Lebih Banyak
          </button>
        </div>
      </div>
    </AppShell>
  );
}
