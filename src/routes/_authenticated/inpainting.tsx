import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AppShell, useAppUser } from "@/components/app-shell";
import { Upload, Wand2, Loader2, Download, Eraser, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/inpainting")({
  head: () => ({
    meta: [{ title: "AI Inpainting — Cetak Ide" }, { name: "robots", content: "noindex" }],
  }),
  component: InpaintingPage,
});

function InpaintingPage() {
  const { user } = useAppUser();
  const fileRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [brushSize, setBrushSize] = useState(30);
  const [isDrawing, setIsDrawing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [step, setStep] = useState<"upload" | "mask" | "result">("upload");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImage(url);
    setResult(null);
    setStep("mask");
    toast.success("Gambar berhasil diunggah! Sekarang lukis area yang ingin diganti.");
  }

  async function handleProcess() {
    if (!prompt.trim()) {
      toast.error("Masukkan prompt pengganti objek!");
      return;
    }
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 2500));
    setResult(
      `https://placehold.co/600x400/111/EAB308?text=${encodeURIComponent("Hasil: " + prompt.slice(0, 15))}`,
    );
    setProcessing(false);
    setStep("result");
    toast.success("Inpainting selesai!");
  }

  const STEP_LABELS = [
    { key: "upload", label: "1. Upload" },
    { key: "mask", label: "2. Masking" },
    { key: "result", label: "3. Hasil" },
  ];

  return (
    <AppShell
      title="AI Inpainting"
      subtitle="Ganti atau hapus objek dalam gambar menggunakan AI"
      user={user}
    >
      {/* Step Indicator */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {STEP_LABELS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2 shrink-0">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${step === s.key ? "bg-primary text-black" : "border border-white/20 text-muted-foreground"}`}
            >
              {i + 1}
            </div>
            <span
              className={`text-xs font-medium ${step === s.key ? "text-white" : "text-muted-foreground"}`}
            >
              {s.label.slice(3)}
            </span>
            {i < STEP_LABELS.length - 1 && <div className="h-px w-8 bg-white/10" />}
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Canvas */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md overflow-hidden">
          {step === "upload" && (
            <button
              onClick={() => fileRef.current?.click()}
              className="flex w-full min-h-[350px] sm:min-h-[450px] flex-col items-center justify-center gap-4 text-muted-foreground transition hover:bg-white/[0.02] hover:text-white"
            >
              <div className="rounded-2xl border-2 border-dashed border-white/20 p-10">
                <Upload className="h-12 w-12" />
              </div>
              <p className="text-sm">Klik untuk unggah gambar yang ingin diedit</p>
              <p className="text-xs opacity-60">JPG, PNG — Maks 10MB</p>
            </button>
          )}

          {(step === "mask" || step === "result") && image && (
            <div className="relative min-h-[350px] sm:min-h-[450px]">
              {/* Original / Result display */}
              <div className="flex items-start justify-center gap-2 p-4">
                <div className="flex-1">
                  <p className="mb-2 text-center text-xs text-muted-foreground">Original</p>
                  <div className="relative">
                    <img
                      src={image}
                      alt="Original"
                      className="w-full rounded-xl object-contain max-h-[350px]"
                    />
                    {step === "mask" && (
                      <div
                        className={`absolute inset-0 rounded-xl ${isDrawing ? "cursor-crosshair" : "cursor-crosshair"}`}
                        style={{ background: "rgba(234,179,8,0.15)" }}
                        onMouseDown={() => setIsDrawing(true)}
                        onMouseUp={() => setIsDrawing(false)}
                        onMouseLeave={() => setIsDrawing(false)}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="rounded-xl border border-dashed border-primary/60 bg-primary/10 px-4 py-2 text-center">
                            <Eraser className="mx-auto mb-1 h-5 w-5 text-primary" />
                            <p className="text-[10px] text-primary font-medium">
                              Lukis area yang ingin diganti
                            </p>
                            <p className="text-[9px] text-white/50 mt-0.5">
                              (Simulasi — area akan dimasking)
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {result && (
                  <div className="flex-1">
                    <p className="mb-2 text-center text-xs text-muted-foreground">Hasil AI</p>
                    <img
                      src={result}
                      alt="Hasil Inpainting"
                      className="w-full rounded-xl object-contain max-h-[350px]"
                    />
                  </div>
                )}
              </div>

              {processing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-2xl">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm font-medium">AI sedang mengganti objek...</p>
                  </div>
                </div>
              )}
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
        </div>

        {/* Control Panel */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
            <h3 className="mb-4 text-sm font-semibold">Pengaturan Inpainting</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-muted-foreground">
                  Prompt Pengganti Objek
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Contoh: Ganti dengan gunung bersalju, langit biru cerah, pohon sakura..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm placeholder:text-white/30 focus:border-primary/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-muted-foreground">
                  Ukuran Brush: {brushSize}px
                </label>
                <input
                  type="range"
                  min={5}
                  max={100}
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/10 p-3">
                <span className="text-xs font-medium">Mode Masking</span>
                <div className="flex gap-2">
                  {["Hapus", "Perbaiki", "Perluas"].map((m) => (
                    <button
                      key={m}
                      className="rounded-lg border border-white/10 px-2 py-1 text-[10px] text-white/60 hover:border-primary/40 hover:text-primary first:border-primary/40 first:text-primary"
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setImage(null);
                    setResult(null);
                    setStep("upload");
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-xs text-white/70 hover:bg-white/10 hover:text-white"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Reset
                </button>
                <button
                  onClick={handleProcess}
                  disabled={!image || !prompt.trim() || processing}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #EAB308, #CA8A04)" }}
                >
                  {processing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Wand2 className="h-3.5 w-3.5" />
                  )}
                  {processing ? "Proses..." : "Proses AI"}
                </button>
              </div>

              {result && (
                <button
                  onClick={() => toast.success("Gambar sedang diunduh...")}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 py-2.5 text-xs font-medium text-primary hover:bg-primary/20"
                >
                  <Download className="h-3.5 w-3.5" /> Unduh Hasil
                </button>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
            <h3 className="mb-3 text-xs font-semibold text-muted-foreground">Contoh Penggunaan</h3>
            <div className="space-y-2">
              {[
                "Hapus objek tidak diinginkan",
                "Ganti latar belakang",
                "Tambahkan elemen baru",
                "Perbaiki bagian rusak",
              ].map((tip) => (
                <div key={tip} className="flex items-center gap-2 text-[11px] text-white/60">
                  <div className="h-1 w-1 rounded-full bg-primary shrink-0" />
                  {tip}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
