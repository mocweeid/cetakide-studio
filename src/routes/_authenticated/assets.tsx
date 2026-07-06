import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, useAppUser } from "@/components/app-shell";
import {
  FolderHeart,
  Download,
  Copy,
  Trash2,
  Search,
  Filter,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/assets")({
  head: () => ({
    meta: [{ title: "Galeri Aset — Cetak Ide" }, { name: "robots", content: "noindex" }],
  }),
  component: AssetsPage,
});

type Asset = {
  id: string;
  kebutuhan: string;
  image_url: string | null;
  platform: string;
  aspect_ratio: string;
  status: string;
  created_at: string;
};

const PLATFORM_FILTERS = ["Semua", "Instagram", "Facebook", "YouTube", "Marketplace"];

function AssetsPage() {
  const { user } = useAppUser();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Semua");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.userId)
      .eq("status", "sukses")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setAssets((data as Asset[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  const filtered = assets.filter((a) => {
    const matchPlatform = filter === "Semua" || a.platform.toLowerCase() === filter.toLowerCase();
    const matchSearch = !search || a.kebutuhan.toLowerCase().includes(search.toLowerCase());
    return matchPlatform && matchSearch;
  });

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    toast.success("URL berhasil disalin!");
  }

  async function deleteAsset(id: string) {
    await supabase.from("projects").delete().eq("id", id);
    setAssets((prev) => prev.filter((a) => a.id !== id));
    toast.success("Aset dihapus.");
  }

  // Mockup assets jika data kosong dari Supabase
  const MOCK_ASSETS: Asset[] = [
    {
      id: "m1",
      kebutuhan: "Banner sneakers premium hitam",
      image_url: "https://placehold.co/400x400/0a0a0a/EAB308?text=Sneaker+01",
      platform: "Instagram",
      aspect_ratio: "1:1",
      status: "sukses",
      created_at: "2026-07-03T10:00:00Z",
    },
    {
      id: "m2",
      kebutuhan: "Story flash sale fashion",
      image_url: "/assets/kategori/fashion/fashion-8.png",
      platform: "Instagram",
      aspect_ratio: "9:16",
      status: "sukses",
      created_at: "2026-07-02T14:00:00Z",
    },
    {
      id: "m3",
      kebutuhan: "Banner promo Facebook",
      image_url: "https://placehold.co/600x315/141414/EAB308?text=FB+Ads",
      platform: "Facebook",
      aspect_ratio: "1.91:1",
      status: "sukses",
      created_at: "2026-07-01T09:00:00Z",
    },
    {
      id: "m4",
      kebutuhan: "Thumbnail YouTube review",
      image_url: "https://placehold.co/640x360/181818/EAB308?text=YT+Thumb",
      platform: "YouTube",
      aspect_ratio: "16:9",
      status: "sukses",
      created_at: "2026-06-30T20:00:00Z",
    },
    {
      id: "m5",
      kebutuhan: "Banner marketplace Shopee",
      image_url: "https://placehold.co/400x400/0f0f0f/EAB308?text=Shopee",
      platform: "Marketplace",
      aspect_ratio: "1:1",
      status: "sukses",
      created_at: "2026-06-29T16:00:00Z",
    },
    {
      id: "m6",
      kebutuhan: "Konten feed kuliner",
      image_url: "/assets/kategori/kuliner/kuliner-1.png",
      platform: "Instagram",
      aspect_ratio: "4:5",
      status: "sukses",
      created_at: "2026-06-28T11:00:00Z",
    },
  ];

  const displayAssets =
    assets.length > 0
      ? filtered
      : MOCK_ASSETS.filter((a) => {
          const matchPlatform =
            filter === "Semua" || a.platform.toLowerCase() === filter.toLowerCase();
          const matchSearch = !search || a.kebutuhan.toLowerCase().includes(search.toLowerCase());
          return matchPlatform && matchSearch;
        });

  return (
    <AppShell
      title="Galeri Aset"
      subtitle="Semua visual yang berhasil Anda buat tersimpan di sini"
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
              placeholder="Cari berdasarkan deskripsi..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-9 pr-4 text-sm placeholder:text-white/30 focus:border-primary/50 focus:outline-none backdrop-blur-md"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
            {PLATFORM_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${filter === f ? "border-primary bg-primary/20 text-primary" : "border-white/10 text-white/60 hover:border-white/30 hover:text-white"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Aset", value: displayAssets.length.toString() },
            {
              label: "Platform",
              value: new Set(displayAssets.map((a) => a.platform)).size.toString(),
            },
            {
              label: "Bulan Ini",
              value: displayAssets
                .filter((a) => new Date(a.created_at).getMonth() === new Date().getMonth())
                .length.toString(),
            },
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

        {/* Asset Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : displayAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] py-16 text-center">
            <FolderHeart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-sm font-medium text-white/80 mb-1">Belum ada aset tersimpan</p>
            <p className="text-xs text-muted-foreground">
              Hasil generate visual Anda akan muncul di sini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {displayAssets.map((asset) => (
              <div
                key={asset.id}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]"
              >
                {asset.image_url ? (
                  <img
                    src={asset.image_url}
                    alt={asset.kebutuhan}
                    className="w-full object-cover aspect-square"
                  />
                ) : (
                  <div className="flex aspect-square items-center justify-center bg-white/5">
                    <ImageIcon className="h-8 w-8 text-white/20" />
                  </div>
                )}
                {/* Hover Overlay */}
                <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100 p-3">
                  <div className="flex justify-end gap-1">
                    {asset.image_url && (
                      <button
                        onClick={() => copyUrl(asset.image_url!)}
                        className="rounded-lg bg-white/20 p-1.5 text-white hover:bg-white/30"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {asset.image_url && (
                      <a
                        href={asset.image_url}
                        download
                        className="rounded-lg bg-white/20 p-1.5 text-white hover:bg-white/30"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => deleteAsset(asset.id)}
                      className="rounded-lg bg-red-500/30 p-1.5 text-red-300 hover:bg-red-500/50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-white/90 line-clamp-2">
                      {asset.kebutuhan}
                    </p>
                    <div className="mt-1 flex items-center gap-1">
                      <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] text-white/70">
                        {asset.platform}
                      </span>
                      <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] text-white/70">
                        {asset.aspect_ratio}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
