import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, useAppUser } from "@/components/app-shell";
import { Sliders, Sparkles, RefreshCw, Wand2, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/style-tuner")({
  head: () => ({
    meta: [{ title: "Visual Style Tuner — CetakIde" }, { name: "robots", content: "noindex" }],
  }),
  component: StyleTunerPage,
});

const PRESETS = [
  {
    id: "minimalist",
    name: "Minimalist",
    desc: "Bersih, sederhana, dan elegan",
    config: { brightness: 95, contrast: 105, saturation: 80, warmth: 55, sharpness: 60, grain: 5 },
    tag: "Popular",
  },
  {
    id: "bold",
    name: "Bold & Vibrant",
    desc: "Kontras tinggi, warna kuat",
    config: {
      brightness: 100,
      contrast: 130,
      saturation: 140,
      warmth: 55,
      sharpness: 80,
      grain: 0,
    },
    tag: null,
  },
  {
    id: "luxury",
    name: "Luxury Dark",
    desc: "Dramatis, gelap, dan premium",
    config: { brightness: 75, contrast: 120, saturation: 85, warmth: 45, sharpness: 70, grain: 15 },
    tag: "Trending",
  },
  {
    id: "natural",
    name: "Natural Warm",
    desc: "Hangat, organik, dan autentik",
    config: { brightness: 105, contrast: 95, saturation: 90, warmth: 70, sharpness: 55, grain: 10 },
    tag: null,
  },
  {
    id: "neon",
    name: "Neon Cyber",
    desc: "Futuristik, glowing, tech vibes",
    config: { brightness: 90, contrast: 140, saturation: 160, warmth: 40, sharpness: 90, grain: 5 },
    tag: null,
  },
  {
    id: "vintage",
    name: "Retro Vintage",
    desc: "Film grain, faded, nostalgik",
    config: { brightness: 90, contrast: 85, saturation: 70, warmth: 65, sharpness: 45, grain: 30 },
    tag: null,
  },
];

const PARAMS = [
  { key: "brightness", label: "Brightness", min: 50, max: 150 },
  { key: "contrast", label: "Contrast", min: 50, max: 180 },
  { key: "saturation", label: "Saturation", min: 0, max: 200 },
  { key: "warmth", label: "Warmth", min: 0, max: 100 },
  { key: "sharpness", label: "Sharpness", min: 0, max: 100 },
  { key: "grain", label: "Film Grain", min: 0, max: 50 },
];

type Config = Record<string, number>;

function StyleTunerPage() {
  const { user } = useAppUser();
  const [activePreset, setActivePreset] = useState<string | null>("minimalist");
  const [config, setConfig] = useState<Config>(PRESETS[0].config);
  const [saved, setSaved] = useState(false);

  function applyPreset(preset: (typeof PRESETS)[0]) {
    setActivePreset(preset.id);
    setConfig(preset.config);
    toast.success(`Preset "${preset.name}" diterapkan!`);
  }

  function saveConfig() {
    setSaved(true);
    toast.success("Konfigurasi gaya berhasil disimpan!");
    setTimeout(() => setSaved(false), 2000);
  }

  function resetConfig() {
    setConfig(PRESETS[0].config);
    setActivePreset("minimalist");
    toast.success("Konfigurasi direset ke default.");
  }

  // CSS filter preview
  const cssFilter = [
    `brightness(${config.brightness / 100})`,
    `contrast(${config.contrast / 100})`,
    `saturate(${config.saturation / 100})`,
    `sepia(${(config.warmth - 50) / 100 > 0 ? ((config.warmth - 50) / 100) * 0.3 : 0})`,
  ].join(" ");

  return (
    <AppShell
      title="Visual Style Tuner"
      subtitle="Sesuaikan gaya visual AI sesuai identitas brand Anda"
      user={user}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left: Preset & Sliders */}
        <div className="space-y-4">
          {/* Preset Selection */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
            <h3 className="mb-3 font-display text-sm font-semibold">Preset Style</h3>
            <div className="space-y-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${activePreset === preset.id ? "border border-primary/60 bg-primary/10" : "border border-transparent hover:bg-white/5"}`}
                >
                  {activePreset === preset.id ? (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-black">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  ) : (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                      <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p
                        className={`text-xs font-semibold ${activePreset === preset.id ? "text-primary" : "text-white"}`}
                      >
                        {preset.name}
                      </p>
                      {preset.tag && (
                        <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                          {preset.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">{preset.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Fine Tune Sliders */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
            <h3 className="mb-4 font-display text-sm font-semibold flex items-center gap-2">
              <Sliders className="h-4 w-4 text-muted-foreground" /> Fine Tune
            </h3>
            <div className="space-y-4">
              {PARAMS.map(({ key, label, min, max }) => (
                <div key={key}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">{label}</span>
                    <span className="font-bold text-white">{config[key]}</span>
                  </div>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    value={config[key]}
                    onChange={(e) => {
                      setConfig((c) => ({ ...c, [key]: Number(e.target.value) }));
                      setActivePreset(null);
                    }}
                    className="w-full accent-primary"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={resetConfig}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-sm text-white/70 hover:bg-white/10 hover:text-white"
            >
              <RefreshCw className="h-4 w-4" /> Reset
            </button>
            <button
              onClick={saveConfig}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-black transition hover:brightness-110 ${saved ? "bg-green-500" : ""}`}
              style={!saved ? { background: "linear-gradient(135deg, #EAB308, #CA8A04)" } : {}}
            >
              {saved ? <Check className="h-4 w-4 text-white" /> : <Wand2 className="h-4 w-4" />}
              {saved ? "Tersimpan!" : "Simpan Gaya"}
            </button>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="lg:col-span-2 space-y-4">
          {/* Side by side preview */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-6 backdrop-blur-md">
            <h3 className="mb-4 font-display text-sm font-semibold">Perbandingan Before / After</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-center text-xs text-muted-foreground">Original (Sebelum)</p>
                <img
                  src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop"
                  alt="Original"
                  className="w-full rounded-xl object-cover"
                  style={{ filter: "none" }}
                />
              </div>
              <div>
                <p className="mb-2 text-center text-xs font-medium text-primary">
                  {activePreset ? PRESETS.find((p) => p.id === activePreset)?.name : "Custom"}{" "}
                  (Sesudah)
                </p>
                <img
                  src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop"
                  alt="Filtered"
                  className="w-full rounded-xl object-cover"
                  style={{ filter: cssFilter }}
                />
              </div>
            </div>
          </div>

          {/* Multi-image preview */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5 backdrop-blur-md">
            <h3 className="mb-3 font-display text-sm font-semibold">Preview Grid</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                "https://images.unsplash.com/photo-1445205170230-053b83016050?w=300&h=300&fit=crop",
                "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&h=300&fit=crop",
                "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=300&h=300&fit=crop",
              ].map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`Preview ${i}`}
                  className="w-full rounded-xl object-cover aspect-square"
                  style={{ filter: cssFilter }}
                />
              ))}
            </div>
          </div>

          {/* Config Summary */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
            <h3 className="mb-3 font-display text-sm font-semibold">Konfigurasi Aktif</h3>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {PARAMS.map(({ key, label }) => (
                <div key={key} className="rounded-xl bg-white/5 p-2.5 text-center">
                  <p className="text-base font-bold text-primary">{config[key]}</p>
                  <p className="text-[9px] text-muted-foreground">{label.split(" ")[0]}</p>
                </div>
              ))}
            </div>
            {activePreset && (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Preset:{" "}
                <span className="font-medium text-white">
                  {PRESETS.find((p) => p.id === activePreset)?.name}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
