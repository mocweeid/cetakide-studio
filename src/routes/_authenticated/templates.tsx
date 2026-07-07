import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, useAppUser } from "@/components/app-shell";
import { Star, Lock, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { bentoByNiche, logoShowcase, carouselData, nicheExtras } from "@/config/site-assets";

export const Route = createFileRoute("/_authenticated/templates")({
  head: () => ({
    meta: [{ title: "Koleksi Template — Cetak Ide" }, { name: "robots", content: "noindex" }],
  }),
  component: TemplatesPage,
});

type TemplateItem = {
  id: string;
  name: string;
  category: string;
  ratio: string;
  premium: boolean;
  img: string;
};

// Auto-build template library from every asset already shipped in the app.
const TEMPLATES: TemplateItem[] = (() => {
  const list: TemplateItem[] = [];

  // 1. All niche posters (1:1) -> "Niche Poster" category, split by niche
  Object.entries(bentoByNiche).forEach(([niche, group]) => {
    const extras = nicheExtras[niche as keyof typeof nicheExtras] ?? [];
    [group.main, ...group.small, ...extras].forEach((img, i) => {
      list.push({
        id: `niche-${niche}-${i}`,
        name: `Poster ${niche} #${i + 1}`,
        category: niche,
        ratio: "1:1",
        premium: i >= 8, // 5+ jadi premium untuk memberi ruang free tier lebih banyak
        img,
      });
    });
  });

  // 2. Instagram Feed
  carouselData[0]?.images.forEach((img, i) => {
    list.push({
      id: `ig-${i}`,
      name: `Instagram Feed #${i + 1}`,
      category: "Instagram Feed",
      ratio: "1:1",
      premium: i >= 6,
      img,
    });
  });

  // 3. Instagram Story
  carouselData[1]?.images.forEach((img, i) => {
    list.push({
      id: `story-${i}`,
      name: `Story & Reels #${i + 1}`,
      category: "Story & Reels",
      ratio: "9:16",
      premium: i >= 6,
      img,
    });
  });

  // 4. Facebook Ads
  carouselData[2]?.images.forEach((img, i) => {
    list.push({
      id: `fb-${i}`,
      name: `Facebook Ads #${i + 1}`,
      category: "Facebook Ads",
      ratio: "1:1",
      premium: i >= 6,
      img,
    });
  });

  // 5. Logo library
  logoShowcase.forEach((img, i) => {
    list.push({
      id: `logo-${i}`,
      name: `Logo Preset #${i + 1}`,
      category: "Logo",
      ratio: "1:1",
      premium: i >= 7,
      img,
    });
  });

  return list;
})();

const CATEGORIES = ["Semua", ...Array.from(new Set(TEMPLATES.map((t) => t.category)))];

function TemplatesPage() {
  const { user } = useAppUser();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [favorites, setFavorites] = useState<string[]>(["1", "6"]);

  const filtered = useMemo(() => TEMPLATES.filter(
    (t) => activeCategory === "Semua" || t.category === activeCategory,
  ), [activeCategory]);

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
