import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, useAppUser } from "@/components/app-shell";
import { Search, Download, ExternalLink, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/stock-library")({
  head: () => ({
    meta: [{ title: "Stock Library — CetakIde" }, { name: "robots", content: "noindex" }],
  }),
  component: StockLibraryPage,
});

const CATEGORIES = [
  "Semua",
  "Bisnis",
  "Fashion",
  "Kuliner",
  "Teknologi",
  "Alam",
  "Arsitektur",
  "Orang",
];

const STOCK_IMAGES = [
  {
    id: "1",
    title: "Profil bisnis profesional",
    category: "Bisnis",
    author: "Unsplash",
    w: 400,
    h: 400,
    url: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=400&fit=crop",
  },
  {
    id: "2",
    title: "Laptop workspace minimal",
    category: "Bisnis",
    author: "Unsplash",
    w: 400,
    h: 300,
    url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=300&fit=crop",
  },
  {
    id: "3",
    title: "Fashion street style",
    category: "Fashion",
    author: "Unsplash",
    w: 300,
    h: 400,
    url: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=300&h=400&fit=crop",
  },
  {
    id: "4",
    title: "Makanan premium plating",
    category: "Kuliner",
    author: "Unsplash",
    w: 400,
    h: 400,
    url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop",
  },
  {
    id: "5",
    title: "Smartphone modern",
    category: "Teknologi",
    author: "Unsplash",
    w: 400,
    h: 500,
    url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=500&fit=crop",
  },
  {
    id: "6",
    title: "Hutan tropis hijau",
    category: "Alam",
    author: "Unsplash",
    w: 400,
    h: 300,
    url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&h=300&fit=crop",
  },
  {
    id: "7",
    title: "Gedung arsitektur modern",
    category: "Arsitektur",
    author: "Unsplash",
    w: 400,
    h: 600,
    url: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&h=600&fit=crop",
  },
  {
    id: "8",
    title: "Tim kerja meeting",
    category: "Bisnis",
    author: "Unsplash",
    w: 600,
    h: 400,
    url: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&h=400&fit=crop",
  },
  {
    id: "9",
    title: "Sepatu sneaker hitam",
    category: "Fashion",
    author: "Unsplash",
    w: 400,
    h: 400,
    url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
  },
  {
    id: "10",
    title: "Kopi dan laptop",
    category: "Bisnis",
    author: "Unsplash",
    w: 400,
    h: 300,
    url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop",
  },
  {
    id: "11",
    title: "Burger artisanal",
    category: "Kuliner",
    author: "Unsplash",
    w: 400,
    h: 400,
    url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop",
  },
  {
    id: "12",
    title: "Programmer coding",
    category: "Teknologi",
    author: "Unsplash",
    w: 500,
    h: 400,
    url: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=500&h=400&fit=crop",
  },
];

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
          <p className="text-xs text-muted-foreground">Sumber: Unsplash · Lisensi bebas royalti</p>
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
                      <a
                        href={`https://unsplash.com/s/photos/${encodeURIComponent(img.title)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center rounded-lg bg-white/20 p-1.5 text-white hover:bg-white/30"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
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
