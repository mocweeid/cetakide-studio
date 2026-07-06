import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, useAppUser } from "@/components/app-shell";
import { Terminal, Sparkles, Send, Clock, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/playground")({
  head: () => ({
    meta: [{ title: "AI Playground — Cetak Ide" }, { name: "robots", content: "noindex" }],
  }),
  component: PlaygroundPage,
});

const STYLE_OPTIONS = [
  "Minimalist",
  "Bold & Vibrant",
  "Luxury Dark",
  "Natural Warm",
  "Neon Cyber",
  "Retro Vintage",
];
const MOOD_OPTIONS = ["Profesional", "Fun & Playful", "Elegan", "Dramatic", "Cozy", "Epic"];
const PRESET_PROMPTS = [
  "Iklan sneakers premium dengan latar hitam, efek cahaya kuning dramatic, gaya luxury",
  "Banner promo makanan dengan warna warm orange, terlihat lezat dan fresh",
  "Thumbnail YouTube konten tech review, gaya bold dengan teks highlight",
  "Story Instagram flash sale fashion, warna neon pink dengan countdown timer",
];

function PlaygroundPage() {
  const { user } = useAppUser();
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Minimalist");
  const [mood, setMood] = useState("Profesional");
  const [quality, setQuality] = useState(80);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 2000));
    const mockUrl = `https://placehold.co/600x600/0a0a0a/EAB308?text=${encodeURIComponent(prompt.slice(0, 20))}`;
    setResult(mockUrl);
    setHistory((prev) => [prompt, ...prev.slice(0, 7)]);
    setLoading(false);
    toast.success("Prompt berhasil diproses!");
  }

  function copyPrompt(p: string) {
    navigator.clipboard.writeText(p);
    toast.success("Prompt disalin!");
  }

  return (
    <AppShell
      title="AI Playground"
      subtitle="Eksplorasi dan uji coba prompt AI secara bebas"
      user={user}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left: Input Panel */}
        <div className="space-y-4 lg:col-span-2">
          {/* Prompt Input */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-6 backdrop-blur-md">
            <label className="mb-2 block text-sm font-semibold">Prompt Anda</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Deskripsikan visual yang ingin Anda buat... Semakin detail semakin baik hasilnya."
              rows={5}
              className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm placeholder:text-white/30 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />

            {/* Preset Prompts */}
            <div className="mt-3">
              <p className="mb-2 text-xs text-muted-foreground">Contoh prompt:</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPrompt(p)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] text-white/70 transition hover:border-primary/40 hover:text-white"
                  >
                    {p.slice(0, 40)}…
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Parameters */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-6 backdrop-blur-md">
            <h3 className="mb-4 font-display text-sm font-semibold">Parameter Generate</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-medium text-muted-foreground">
                  Gaya Visual
                </label>
                <div className="flex flex-wrap gap-2">
                  {STYLE_OPTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStyle(s)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${style === s ? "border-primary bg-primary/20 text-primary" : "border-white/10 text-white/60 hover:border-white/30 hover:text-white"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-muted-foreground">
                  Mood / Atmosfer
                </label>
                <div className="flex flex-wrap gap-2">
                  {MOOD_OPTIONS.map((m) => (
                    <button
                      key={m}
                      onClick={() => setMood(m)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${mood === m ? "border-primary bg-primary/20 text-primary" : "border-white/10 text-white/60 hover:border-white/30 hover:text-white"}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-xs font-medium text-muted-foreground">
                  Kualitas Output: {quality}%
                </label>
                <input
                  type="range"
                  min={40}
                  max={100}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                  <span>Draft (Cepat)</span>
                  <span>HD (Lambat)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #EAB308, #CA8A04, #FACC15)" }}
          >
            {loading ? (
              <>
                <Terminal className="h-4 w-4 animate-pulse" /> Memproses prompt...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" /> Generate Visual
              </>
            )}
          </button>
        </div>

        {/* Right: Output + History */}
        <div className="space-y-4">
          {/* Output Preview */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
            <h3 className="mb-3 font-display text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Hasil Output
            </h3>
            {loading ? (
              <div className="flex aspect-square items-center justify-center rounded-xl border border-white/10 bg-black/20">
                <div className="flex flex-col items-center gap-3">
                  <Terminal className="h-8 w-8 animate-pulse text-primary" />
                  <p className="text-xs text-muted-foreground">Memproses prompt AI…</p>
                </div>
              </div>
            ) : result ? (
              <img src={result} alt="Hasil generate" className="w-full rounded-xl object-cover" />
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/10">
                <p className="text-center text-xs text-muted-foreground px-4">
                  Output akan muncul di sini setelah Anda menekan Generate
                </p>
              </div>
            )}
          </div>

          {/* Prompt History */}
          {history.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
              <h3 className="mb-3 font-display text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" /> Riwayat Prompt
              </h3>
              <div className="space-y-2">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-white/5 p-2">
                    <p className="flex-1 truncate text-[10px] text-white/70">{h}</p>
                    <button
                      onClick={() => copyPrompt(h)}
                      className="shrink-0 rounded p-1 text-muted-foreground hover:text-white"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => setPrompt(h)}
                      className="shrink-0 rounded p-1 text-muted-foreground hover:text-primary"
                    >
                      <Send className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setHistory([])}
                  className="flex w-full items-center justify-center gap-1 rounded-lg py-1 text-[10px] text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="h-3 w-3" /> Bersihkan riwayat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
