import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AppShell, useAppUser } from "@/components/app-shell";
import {
  Crop,
  Upload,
  Wand2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Contrast,
  Sun,
  Droplets,
  Maximize2,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/editor-studio")({
  head: () => ({
    meta: [{ title: "AI Editor Studio — CetakIde" }, { name: "robots", content: "noindex" }],
  }),
  component: EditorStudioPage,
});

const TOOLS = [
  { id: "crop", label: "Crop", icon: Crop },
  { id: "resize", label: "Resize", icon: Maximize2 },
  { id: "brightness", label: "Brightness", icon: Sun },
  { id: "contrast", label: "Contrast", icon: Contrast },
  { id: "saturation", label: "Saturation", icon: Droplets },
  { id: "rotate", label: "Rotate", icon: RotateCw },
];

const AI_TOOLS = [
  { id: "remove-bg", label: "Hapus Background", badge: "AI", available: true },
  { id: "enhance", label: "AI Enhance", badge: "AI", available: true },
  { id: "upscale", label: "Upscale 4x", badge: "AI", available: false },
  { id: "style-transfer", label: "Style Transfer", badge: "AI", available: false },
];

function EditorStudioPage() {
  const { user } = useAppUser();
  const fileRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState("brightness");
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [processing, setProcessing] = useState(false);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImage(url);
    toast.success("Gambar berhasil diunggah!");
  }

  async function applyAiTool(id: string) {
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1800));
    setProcessing(false);
    toast.success(`${id} selesai diproses!`);
  }

  const imgStyle = {
    filter: `brightness(${brightness / 100}) contrast(${contrast / 100}) saturate(${saturation / 100})`,
    transform: `rotate(${rotation}deg)`,
    transition: "all 0.2s ease",
  };

  return (
    <AppShell
      title="AI Editor Studio"
      subtitle="Edit dan sempurnakan visual Anda dengan AI"
      user={user}
    >
      <div className="grid gap-4 lg:grid-cols-4">
        {/* Toolbar Kiri */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
            <h3 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Alat Edit
            </h3>
            <div className="space-y-1">
              {TOOLS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTool(t.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${activeTool === t.id ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-white/10 hover:text-white"}`}
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
            <h3 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              AI Tools
            </h3>
            <div className="space-y-2">
              {AI_TOOLS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => t.available && applyAiTool(t.id)}
                  disabled={!t.available || processing}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${t.available ? "text-white/80 hover:bg-white/10 hover:text-white" : "cursor-not-allowed opacity-40"}`}
                >
                  <span className="flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-primary" />
                    {t.label}
                  </span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${t.available ? "bg-primary/20 text-primary" : "bg-white/10 text-white/40"}`}
                  >
                    {t.available ? t.badge : "Segera"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Canvas */}
          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md overflow-hidden">
            {image ? (
              <div className="relative flex items-center justify-center p-4 min-h-[300px] sm:min-h-[400px]">
                {processing && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-2">
                      <Wand2 className="h-8 w-8 animate-pulse text-primary" />
                      <p className="text-sm font-medium">AI sedang memproses...</p>
                    </div>
                  </div>
                )}
                <img
                  src={image}
                  alt="Preview"
                  className="max-h-[400px] rounded-xl object-contain"
                  style={imgStyle}
                />
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="flex w-full min-h-[300px] sm:min-h-[400px] flex-col items-center justify-center gap-4 text-muted-foreground transition hover:bg-white/[0.02] hover:text-white"
              >
                <div className="rounded-2xl border-2 border-dashed border-white/20 p-8">
                  <Upload className="h-12 w-12" />
                </div>
                <p className="text-sm">Klik untuk unggah gambar</p>
                <p className="text-xs opacity-60">JPG, PNG, WebP — Maks 10MB</p>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFile}
            />
          </div>

          {/* Action Buttons */}
          {image && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white"
              >
                <Upload className="h-4 w-4" /> Ganti Gambar
              </button>
              <button className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white">
                <ZoomIn className="h-4 w-4" /> Zoom In
              </button>
              <button className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white">
                <ZoomOut className="h-4 w-4" /> Zoom Out
              </button>
              <button
                onClick={() => setRotation((r) => r + 90)}
                className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white"
              >
                <RotateCw className="h-4 w-4" /> Putar
              </button>
              <button
                onClick={() => toast.success("Gambar berhasil disimpan!")}
                className="ml-auto flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-black"
                style={{ background: "linear-gradient(135deg, #EAB308, #CA8A04)" }}
              >
                Simpan Hasil
              </button>
            </div>
          )}
        </div>

        {/* Adjustment Panel Kanan */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
            <h3 className="mb-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Penyesuaian
            </h3>
            <div className="space-y-5">
              {[
                { label: "Brightness", value: brightness, setter: setBrightness, icon: Sun },
                { label: "Contrast", value: contrast, setter: setContrast, icon: Contrast },
                { label: "Saturation", value: saturation, setter: setSaturation, icon: Droplets },
              ].map(({ label, value, setter, icon: Icon }) => (
                <div key={label}>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" /> {label}
                    </span>
                    <span className="text-muted-foreground">{value}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={200}
                    value={value}
                    onChange={(e) => setter(Number(e.target.value))}
                    className="w-full accent-primary"
                    disabled={!image}
                  />
                </div>
              ))}
              <button
                onClick={() => {
                  setBrightness(100);
                  setContrast(100);
                  setSaturation(100);
                  setRotation(0);
                }}
                className="w-full rounded-xl border border-white/10 py-2 text-xs text-muted-foreground transition hover:bg-white/10 hover:text-white"
              >
                Reset Semua
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
            <h3 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Export
            </h3>
            <div className="space-y-2">
              {["PNG Lossless", "JPEG 90%", "WebP (Recommended)"].map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => toast.success(`Mengunduh sebagai ${fmt}...`)}
                  disabled={!image}
                  className="flex w-full items-center justify-between rounded-xl border border-white/10 px-3 py-2.5 text-xs text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {fmt}
                  <span className="text-[10px] text-muted-foreground">Unduh</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
