import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell, useAppUser } from "@/components/app-shell";
import { Search, Sparkles, Copy, ArrowRight, X, Check, Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { enhancePromptServer } from "@/lib/enhancePrompt.functions";
import { PROMPT_CATEGORIES, PROMPT_TEMPLATES, PromptTemplate } from "@/config/prompt-templates";
import { bentoByNiche } from "@/config/site-assets";

// Koleksi Template diterapkan ke Perpustakaan Prompt:
// setiap kategori memakai aset asli dari bentoByNiche (main + small)
// dengan fallback ke feed-ig untuk kategori yang belum punya niche.
function nicheAssets(...niches: (keyof typeof bentoByNiche)[]): string[] {
  const out: string[] = [];
  for (const n of niches) {
    const g = bentoByNiche[n];
    if (g) out.push(g.main, ...g.small);
  }
  return out;
}

const CATEGORY_PREVIEWS: Record<string, string[]> = {
  laundry: ["/assets/feed-ig/ig-1.png", "/assets/feed-ig/ig-4.png", "/assets/fb-ads-standart/fb-1.png"],
  kuliner: nicheAssets("Kuliner"),
  fashion: nicheAssets("Fashion"),
  jasa: nicheAssets("Properti", "Kesehatan"),
  ecommerce: nicheAssets("Gadget", "Kecantikan"),
  edukasi: nicheAssets("Kreatif" as keyof typeof bentoByNiche).length
    ? nicheAssets("Kreatif" as keyof typeof bentoByNiche)
    : ["/assets/feed-ig/ig-5.png", "/assets/feed-ig/ig-8.png"],
};

function previewFor(t: PromptTemplate): string {
  const pool = CATEGORY_PREVIEWS[t.category] ?? ["/assets/feed-ig/ig-1.png"];
  // Deterministic by id suffix
  const n = parseInt(t.id.split("-").pop() || "1", 10) || 1;
  return pool[(n - 1) % pool.length];
}

export const Route = createFileRoute("/_authenticated/prompt-library")({
  head: () => ({
    meta: [
      { title: "Perpustakaan Prompt — Cetak Ide" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PromptLibraryPage,
});

function PromptLibraryPage() {
  const { user } = useAppUser();
  const navigate = useNavigate();
  const enhancePrompt = useServerFn(enhancePromptServer);

  // States
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTemplate, setActiveTemplate] = useState<PromptTemplate | null>(null);
  
  // Modal & Optimization States
  const [currentPromptText, setCurrentPromptText] = useState("");
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedResult, setOptimizedResult] = useState("");
  const [copied, setCopied] = useState(false);

  // Filter templates based on category and search query
  const filteredTemplates = useMemo(() => {
    return PROMPT_TEMPLATES.filter((t) => {
      const matchCat = selectedCategory === "all" || t.category === selectedCategory;
      const matchSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.prompt.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Handle open template details
  const handleOpenTemplate = (template: PromptTemplate) => {
    setActiveTemplate(template);
    setCurrentPromptText(template.description); // Gunakan deskripsi Indonesia sebagai dasar prompt
    setOptimizedResult("");
  };

  // Run Groq Optimizer
  const handleOptimize = async () => {
    if (!currentPromptText.trim()) {
      toast.error("Teks ide prompt tidak boleh kosong.");
      return;
    }
    setOptimizing(true);
    try {
      const res = await enhancePrompt({
        data: {
          prompt: currentPromptText,
          platform: "social media",
          ratio: "1:1",
        },
      });
      setOptimizedResult(res.enhanced);
      toast.success("Prompt berhasil dioptimalkan oleh Groq!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mengoptimalkan prompt");
    } finally {
      setOptimizing(false);
    }
  };

  // Copy to clipboard
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Prompt berhasil disalin!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Go to Workspace with prompt
  const handleUseInWorkspace = (promptText: string) => {
    navigate({
      to: "/workspace",
      search: { prompt: promptText },
    });
    setActiveTemplate(null);
  };

  return (
    <AppShell
      title="Perpustakaan Prompt"
      subtitle="Kumpulan ratusan inspirasi ide prompt siap pakai yang dioptimalkan oleh Groq AI untuk bisnis Anda"
      user={user}
    >
      <div className="space-y-6">
        {/* Header Search & Category Filter */}
        <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-4 sm:p-6 backdrop-blur-md">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari ide prompt (laundry, kopi, kaos...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/30 py-2 pl-9 pr-4 text-sm outline-none focus:border-primary/50"
              />
            </div>
            
            {/* Info Badge */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground self-start sm:self-center">
              <BookOpen className="h-4 w-4 text-primary" />
              <span>Menampilkan {filteredTemplates.length} template ide</span>
            </div>
          </div>

          {/* Categories Tab list */}
          <div className="mt-4 flex flex-wrap gap-2 border-t border-white/5 pt-4">
            {PROMPT_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-300 ${
                  selectedCategory === cat.key
                    ? "bg-primary text-black shadow-md shadow-primary/20 scale-105"
                    : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid List */}
        {filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] py-16 text-center">
            <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="font-display text-lg font-bold text-muted-foreground">Tidak Ada Hasil</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              Coba cari dengan kata kunci lain atau pilih kategori yang berbeda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((t) => (
              <div
                key={t.id}
                onClick={() => handleOpenTemplate(t)}
                className="group relative flex flex-col justify-between rounded-xl border border-white/10 bg-white/[0.03] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-white/[0.05] hover:shadow-lg cursor-pointer"
              >
                <div className="space-y-3">
                  {/* Poster preview 1:1 */}
                  <div className="relative overflow-hidden rounded-lg border border-white/10 bg-black/40 aspect-square">
                    <img
                      src={previewFor(t)}
                      alt={t.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                    <span className="absolute bottom-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold text-primary border border-primary/30">
                      Referensi visual
                    </span>
                  </div>
                  {/* Category Badge */}
                  <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-primary uppercase">
                    {PROMPT_CATEGORIES.find((c) => c.key === t.category)?.label || t.category}
                  </span>
                  
                  {/* Title & Desc */}
                  <div>
                    <h3 className="font-display text-base font-bold text-white group-hover:text-primary transition-colors">
                      {t.title}
                    </h3>
                    <p className="mt-1.5 line-clamp-3 text-xs text-muted-foreground">
                      {t.description}
                    </p>
                  </div>
                </div>

                {/* Arrow Action */}
                <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-primary/80 group-hover:text-primary">
                  <span>Gunakan & Optimalkan</span>
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail & Optimization Modal */}
        {activeTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl rounded-2xl border border-white/15 bg-background p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
              
              {/* Modal Header */}
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-primary uppercase">
                    {PROMPT_CATEGORIES.find((c) => c.key === activeTemplate.category)?.label}
                  </span>
                  <h3 className="mt-1 font-display text-lg font-bold text-white">
                    {activeTemplate.title}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTemplate(null)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-white/10 hover:text-white transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="space-y-4">
                
                {/* Section 1: Raw / Indonesian Idea */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Ide Desain Poster (Bahasa Indonesia):
                  </label>
                  <textarea
                    rows={3}
                    value={currentPromptText}
                    onChange={(e) => setCurrentPromptText(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-black/40 p-3 text-sm outline-none focus:border-primary/50 font-sans resize-none"
                    placeholder="Tulis ide konsep desain Anda disini..."
                  />
                </div>

                {/* Optimize Action Button */}
                <button
                  onClick={handleOptimize}
                  disabled={optimizing}
                  className="glow-gold w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-bold text-black transition hover:brightness-110 disabled:opacity-50"
                >
                  {optimizing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sedang Mengoptimalkan dengan Groq AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Optimalkan dengan Groq AI
                    </>
                  )}
                </button>

                {/* Section 2: Groq Enhanced Result */}
                {optimizedResult ? (
                  <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-4 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-xs font-bold text-primary">
                        <Sparkles className="h-3.5 w-3.5" />
                        Hasil Penyempurnaan Groq (Visual Prompt English):
                      </span>
                      <button
                        onClick={() => handleCopy(optimizedResult)}
                        className="flex items-center gap-1 rounded bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/90 hover:bg-white/10 transition"
                      >
                        {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                        {copied ? "Tersalin" : "Salin"}
                      </button>
                    </div>
                    <p className="text-sm font-mono text-white/90 leading-relaxed bg-black/30 p-3 rounded-lg border border-white/5 max-h-[150px] overflow-y-auto select-all">
                      {optimizedResult}
                    </p>
                  </div>
                ) : (
                  /* Section 2: Standard Base Prompt Teaser (English) */
                  <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Template Dasar Prompt (Bahasa Inggris):
                      </span>
                      <button
                        onClick={() => handleCopy(activeTemplate.prompt)}
                        className="flex items-center gap-1 rounded bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/90 hover:bg-white/10 transition"
                      >
                        {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                        {copied ? "Tersalin" : "Salin"}
                      </button>
                    </div>
                    <p className="text-sm font-mono text-white/70 leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5">
                      {activeTemplate.prompt}
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="mt-6 flex items-center justify-end gap-3 border-t border-white/5 pt-4">
                <button
                  onClick={() => setActiveTemplate(null)}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
                >
                  Tutup
                </button>
                <button
                  onClick={() => handleUseInWorkspace(optimizedResult || activeTemplate.prompt)}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-black hover:brightness-110 transition"
                >
                  Gunakan di Workspace
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
