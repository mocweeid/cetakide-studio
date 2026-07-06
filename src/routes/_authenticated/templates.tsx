import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, useAppUser } from "@/components/app-shell";
import { LayoutGrid, Star, Lock, Wand2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/templates")({
  head: () => ({
    meta: [{ title: "Koleksi Template — Cetak Ide" }, { name: "robots", content: "noindex" }],
  }),
  component: TemplatesPage,
});

const CATEGORIES = ["Semua", "Instagram", "Facebook Ads", "YouTube", "Marketplace", "Logo"];

const TEMPLATES = [
  {
    id: "1",
    name: "Sneaker Flash Sale",
    category: "Instagram",
    ratio: "1:1",
    premium: false,
    img: "https://placehold.co/400x400/0a0a0a/EAB308?text=Sneaker+Sale",
  },
  {
    id: "2",
    name: "Food Promo Story",
    category: "Instagram",
    ratio: "9:16",
    premium: false,
    img: "https://placehold.co/300x530/111111/EAB308?text=Food+Story",
  },
  {
    id: "3",
    name: "Luxury Brand Banner",
    category: "Instagram",
    ratio: "4:5",
    premium: true,
    img: "https://placehold.co/400x500/141414/EAB308?text=Luxury+Brand",
  },
  {
    id: "4",
    name: "Facebook Retargeting Ad",
    category: "Facebook Ads",
    ratio: "1.91:1",
    premium: false,
    img: "https://placehold.co/600x315/181818/EAB308?text=FB+Retarget",
  },
  {
    id: "5",
    name: "eCommerce Product Ad",
    category: "Facebook Ads",
    ratio: "1:1",
    premium: true,
    img: "https://placehold.co/400x400/0f0f0f/EAB308?text=eCommerce",
  },
  {
    id: "6",
    name: "Tech Review Thumbnail",
    category: "YouTube",
    ratio: "16:9",
    premium: false,
    img: "https://placehold.co/640x360/1a1a1a/EAB308?text=Tech+Review",
  },
  {
    id: "7",
    name: "Gaming Thumbnail Bold",
    category: "YouTube",
    ratio: "16:9",
    premium: true,
    img: "https://placehold.co/640x360/0a0a0a/EAB308?text=Gaming+YT",
  },
  {
    id: "8",
    name: "Shopee Product Banner",
    category: "Marketplace",
    ratio: "1:1",
    premium: false,
    img: "https://placehold.co/400x400/141414/EAB308?text=Shopee",
  },
  {
    id: "9",
    name: "TikTok Shop Campaign",
    category: "Marketplace",
    ratio: "9:16",
    premium: false,
    img: "https://placehold.co/300x530/181818/EAB308?text=TikTok+Shop",
  },
  {
    id: "10",
    name: "Minimal Brand Logo",
    category: "Logo",
    ratio: "1:1",
    premium: false,
    img: "https://placehold.co/400x400/0a0a0a/EAB308?text=Logo+Minimal",
  },
  {
    id: "11",
    name: "Bold Corporate Logo",
    category: "Logo",
    ratio: "1:1",
    premium: true,
    img: "https://placehold.co/400x400/111111/EAB308?text=Corporate",
  },
  {
    id: "12",
    name: "Culinary Food Reel",
    category: "Instagram",
    ratio: "9:16",
    premium: false,
    img: "https://placehold.co/300x530/141414/EAB308?text=Food+Reel",
  },
];

function TemplatesPage() {
  const { user } = useAppUser();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [favorites, setFavorites] = useState<string[]>(["1", "6"]);

  const filtered = TEMPLATES.filter(
    (t) => activeCategory === "Semua" || t.category === activeCategory,
  );

  function toggleFav(id: string) {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  }

  function handleUseTemplate(t: (typeof TEMPLATES)[0]) {
    if (t.premium && !user?.isDeveloper) {
      toast.error("Template premium memerlukan upgrade akun!");
      return;
    }
    toast.success(`Template "${t.name}" digunakan!`);
    navigate({ to: "/workspace" });
  }

  return (
    <AppShell
      title="Koleksi Template"
      subtitle="Template siap pakai untuk semua kebutuhan visual Anda"
      user={user}
    >
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Template", value: TEMPLATES.length.toString() },
            {
              label: "Template Gratis",
              value: TEMPLATES.filter((t) => !t.premium).length.toString(),
            },
            { label: "Favorit Anda", value: favorites.length.toString() },
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

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 rounded-full border px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition ${activeCategory === cat ? "border-primary bg-primary/20 text-primary" : "border-white/10 text-white/60 hover:border-white/30 hover:text-white"}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((template) => (
            <div
              key={template.id}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md transition hover:border-white/20"
            >
              {/* Thumbnail */}
              <div className="relative overflow-hidden">
                <img
                  src={template.img}
                  alt={template.name}
                  className="w-full object-cover aspect-square transition-transform duration-300 group-hover:scale-105"
                />
                {/* Premium Badge */}
                {template.premium && (
                  <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-bold text-black">
                    <Lock className="h-2.5 w-2.5" /> Premium
                  </div>
                )}
                {/* Ratio Badge */}
                <div className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[9px] text-white/80">
                  {template.ratio}
                </div>
                {/* Favorite */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFav(template.id);
                  }}
                  className="absolute bottom-2 right-2 rounded-full bg-black/60 p-1.5"
                >
                  <Star
                    className={`h-3.5 w-3.5 transition ${favorites.includes(template.id) ? "fill-primary text-primary" : "text-white/60"}`}
                  />
                </button>
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-xs font-semibold text-white/90 truncate">{template.name}</p>
                <p className="text-[10px] text-muted-foreground">{template.category}</p>
                <button
                  onClick={() => handleUseTemplate(template)}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition"
                  style={
                    template.premium
                      ? { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }
                      : { background: "linear-gradient(135deg, #EAB308, #CA8A04)", color: "#000" }
                  }
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  {template.premium ? "Upgrade" : "Gunakan"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
