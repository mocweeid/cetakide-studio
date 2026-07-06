import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, useAppUser } from "@/components/app-shell";
import { Hash, Copy, Wand2, RefreshCw, Instagram, Facebook, Youtube, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/seo-optimizer")({
  head: () => ({
    meta: [{ title: "SEO Optimizer — Cetak Ide" }, { name: "robots", content: "noindex" }],
  }),
  component: SeoOptimizerPage,
});

const MOCK_OUTPUTS = {
  instagram:
    "#Skincare #CantikAlami #GlowUp #ProductOfTheDay #BeautyTips #SkincarerIndonesia #NaturalBeauty #BeautyInfluencer #SkinGoals #MorningRoutine #NightCare #HydrationBoost #ClearSkin #AntiAging #BeautyBlogger",
  caption_fb:
    "✨ Temukan rahasia kulit glowing dengan rangkaian skincare natural kami! Diformulasikan khusus untuk iklim tropis Indonesia, cocok untuk semua jenis kulit. Dapatkan diskon 30% untuk pembelian pertama Anda! Klik tautan di bawah untuk order sekarang. 💛",
  alt_text:
    "Produk skincare natural dengan kemasan minimalis putih bersih, ditata di atas meja marmer dengan bunga chamomile kering di sekitarnya, pencahayaan soft dan warm.",
  title_tag: "Skincare Natural Indonesia | Glowing & Halal | Brand Terpercaya",
  caption_yt:
    "Rahasia kulit glowing yang alami! Di video ini kami membahas rangkaian skincare terbaik untuk kulit tropis. Jangan lupa like, subscribe, dan klik notifikasi!",
};

function SeoOptimizerPage() {
  const { user } = useAppUser();
  const [input, setInput] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<null | typeof MOCK_OUTPUTS>(null);

  const PLATFORMS = [
    { id: "instagram", label: "Instagram", icon: Instagram },
    { id: "facebook", label: "Facebook", icon: Facebook },
    { id: "youtube", label: "YouTube", icon: Youtube },
  ];

  async function generateSeo() {
    if (!input.trim()) {
      toast.error("Deskripsikan konten atau visual Anda terlebih dahulu!");
      return;
    }
    setLoading(true);
    setResults(null);
    await new Promise((r) => setTimeout(r, 2000));
    setResults(MOCK_OUTPUTS);
    setLoading(false);
    toast.success("Optimasi SEO selesai!");
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Teks disalin!");
  }

  return (
    <AppShell
      title="SEO Optimizer"
      subtitle="Optimalkan caption, hashtag, dan metadata visual Anda dengan AI"
      user={user}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Input Panel */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5 backdrop-blur-md">
            <h3 className="mb-4 font-display text-sm font-semibold">Deskripsi Konten</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-muted-foreground">
                  Platform Target
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPlatform(p.id)}
                      className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-[10px] font-medium transition ${platform === p.id ? "border-primary/60 bg-primary/10 text-primary" : "border-white/10 text-white/60 hover:border-white/30 hover:text-white"}`}
                    >
                      <p.icon className="h-4 w-4" />
                      {p.label.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-muted-foreground">
                  Deskripsi Produk / Visual
                </label>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Contoh: Produk skincare natural untuk kulit tropis, ditujukan untuk perempuan 18-35 tahun yang ingin kulit glowing tanpa bahan kimia berbahaya..."
                  rows={6}
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm placeholder:text-white/30 focus:border-primary/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-muted-foreground">
                  Kata Kunci Tambahan (opsional)
                </label>
                <input
                  placeholder="skincare, natural, halal, Indonesia..."
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm placeholder:text-white/30 focus:border-primary/50 focus:outline-none"
                />
              </div>
              <button
                onClick={generateSeo}
                disabled={loading || !input.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #EAB308, #CA8A04)" }}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Mengoptimalkan...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" /> Generate SEO
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tips */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
            <h4 className="mb-3 text-xs font-semibold text-muted-foreground">Tips SEO Visual</h4>
            <div className="space-y-2">
              {[
                "Gunakan 15-30 hashtag untuk Instagram",
                "Caption Facebook idealnya 80-150 karakter",
                "Alt text harus deskriptif dan spesifik",
                "Title tag YouTube optimal 60 karakter",
                "Sertakan kata kunci lokal untuk jangkauan lebih luas",
              ].map((tip) => (
                <div key={tip} className="flex items-start gap-2 text-[11px] text-white/60">
                  <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  {tip}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-3">
          {loading && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] py-16 backdrop-blur-md">
              <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">AI sedang mengoptimalkan konten Anda...</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Menganalisis platform, audience, dan trending keywords
              </p>
            </div>
          )}

          {!loading && !results && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] py-20 text-center">
              <Hash className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Isi deskripsi konten dan klik Generate SEO
                <br />
                untuk mendapatkan hashtag & caption yang optimal.
              </p>
            </div>
          )}

          {results && (
            <>
              {/* Hashtag */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5 backdrop-blur-md">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-display text-sm font-semibold flex items-center gap-2">
                    <Hash className="h-4 w-4 text-primary" /> Hashtag Instagram
                    <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                      15 hashtag
                    </span>
                  </h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyText(results.instagram)}
                      className="rounded-lg border border-white/10 p-2 text-white/60 hover:bg-white/10 hover:text-white"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={generateSeo}
                      className="rounded-lg border border-white/10 p-2 text-white/60 hover:bg-white/10 hover:text-white"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {results.instagram.split(" ").map((tag) => (
                    <span
                      key={tag}
                      className="cursor-pointer rounded-full bg-white/5 border border-white/10 px-2 py-1 text-[11px] text-white/70 transition hover:border-primary/40 hover:text-primary"
                      onClick={() => copyText(tag)}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Other outputs */}
              {[
                { label: "Caption Facebook", key: "caption_fb" as const, icon: Facebook },
                { label: "Alt Text Gambar", key: "alt_text" as const, icon: null },
                { label: "Title Tag SEO", key: "title_tag" as const, icon: null },
                { label: "Deskripsi YouTube", key: "caption_yt" as const, icon: Youtube },
              ].map(({ label, key, icon: Icon }) => (
                <div
                  key={key}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5 backdrop-blur-md"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="font-display text-sm font-semibold">
                      {Icon ? (
                        <span className="inline-flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {label}
                        </span>
                      ) : (
                        label
                      )}
                    </h4>
                    <button
                      onClick={() => copyText(results[key])}
                      className="rounded-lg border border-white/10 p-2 text-white/60 hover:bg-white/10 hover:text-white"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="rounded-xl bg-white/5 p-3 text-sm text-white/80 leading-relaxed">
                    {results[key]}
                  </p>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
