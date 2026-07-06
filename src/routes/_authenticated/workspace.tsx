import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AppShell, useAppUser } from "@/components/app-shell";
import {
  Wand2,
  Loader2,
  Download,
  Share2,
  Wallet,
  Upload,
  Image as ImageIcon,
  X,
  Sparkles,
  HelpCircle,
  Settings2,
  Type,
  Palette,
  LayoutTemplate,
  CloudUpload,
} from "lucide-react";
import { PRESET_THEMES, getThemeStyles, DEFAULT_IMG } from "./preset-theme";
import { generateImageServer } from "@/lib/generateImage.functions";
import { enhancePromptServer } from "@/lib/enhancePrompt.functions";
import { streamImage } from "@/lib/streamImage";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/_authenticated/workspace")({
  validateSearch: z.object({
    preset: z.string().optional(),
  }),
  head: () => ({
    meta: [{ title: "Workspace — Cetak Ide" }, { name: "robots", content: "noindex" }],
  }),
  component: Workspace,
});

const PLATFORMS = {
  instagram: {
    label: "Instagram",
    ratios: [
      { key: "1:1", w: 1, h: 1 },
      { key: "9:16", w: 9, h: 16 },
      { key: "4:5", w: 4, h: 5 },
    ],
  },
  facebook: {
    label: "Facebook Ads",
    ratios: [
      { key: "1.91:1", w: 1.91, h: 1 },
      { key: "1:1", w: 1, h: 1 },
      { key: "4:5", w: 4, h: 5 },
    ],
  },
  youtube: {
    label: "YouTube",
    ratios: [
      { key: "16:9", w: 16, h: 9 },
      { key: "9:16", w: 9, h: 16 },
    ],
  },
} as const;

const REFERENCE_CATALOG = [
  "/assets/feed-ig/ig-1.png",
  "/assets/feed-ig/ig-2.png",
  "/assets/feed-ig/ig-3.png",
  "/assets/feed-ig/ig-4.png",
  "/assets/feed-ig/ig-5.png",
  "/assets/feed-ig/ig-6.png",
  "/assets/feed-ig/ig-7.png",
  "/assets/feed-ig/ig-8.png",
];

const TEMPLATES = [
  "Promo Feed",
  "Minimalist Story",
  "Product Showcase",
  "Testimonial",
  "Event Poster",
];

function Workspace() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { user, refresh } = useAppUser();
  const [platform, setPlatform] = useState<keyof typeof PLATFORMS>("instagram");
  const [ratio, setRatio] = useState("1:1");
  const [generateCount, setGenerateCount] = useState(5);
  const [selectedPreset, setSelectedPreset] = useState<string>(search.preset || "");
  const [selectedFont, setSelectedFont] = useState("Inter (Default)");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  const [form, setForm] = useState({
    prompt: "",
    title: "",
    subtitle: "",
    whatsapp: "",
    facebook_url: "",
    instagram_url: "",
    twitter_url: "",
    social_url: "",
    body_content: "",
  });

  const [reference, setReference] = useState<string | null>(null);

  // Modal states
  const [refModalOpen, setRefModalOpen] = useState(false);
  const [panduanOpen, setPanduanOpen] = useState(false);
  const [editImageIndex, setEditImageIndex] = useState<number | null>(null);

  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [fontModalOpen, setFontModalOpen] = useState(false);
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [presetModalOpen, setPresetModalOpen] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  type Variant =
    | { status: "proses" }
    | { status: "streaming"; imageUrl: string }
    | { status: "sukses"; imageUrl: string }
    | { status: "gagal"; error: string };
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number | null>(null);
  const generateImage = useServerFn(generateImageServer);
  const enhancePrompt = useServerFn(enhancePromptServer);
  const [enhancing, setEnhancing] = useState(false);

  async function handleEnhance() {
    if (!form.prompt.trim()) {
      toast.error("Isi prompt dulu untuk disempurnakan.");
      return;
    }
    setEnhancing(true);
    try {
      const { enhanced } = await enhancePrompt({
        data: { prompt: form.prompt, platform, ratio },
      });
      setForm((f) => ({ ...f, prompt: enhanced }));
      toast.success("Prompt disempurnakan oleh AI.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyempurnakan prompt");
    } finally {
      setEnhancing(false);
    }
  }

  useEffect(() => {
    setRatio(PLATFORMS[platform].ratios[0].key);
  }, [platform]);

  const ratios = PLATFORMS[platform].ratios;
  const active = ratios.find((r) => r.key === ratio) ?? ratios[0];
  const canvasStyle = useMemo(() => ({ aspectRatio: `${active.w} / ${active.h}` }), [active]);

  const updateField =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleCustomUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setReference(url);
    toast.success("Referensi custom ditambahkan.");
  }

  async function handleGenerate() {
    if (!form.prompt.trim()) {
      toast.error("Isi prompt dulu.");
      return;
    }
    if (!user) return;
    setGenerating(true);
    setResults([]);
    setVariants(Array.from({ length: generateCount }, () => ({ status: "proses" as const })));
    try {
      // Potong saldo sesuai jumlah generate jika di backend diimplementasi
      for (let i = 0; i < generateCount; i++) {
        const { data: ok, error } = await supabase.rpc("potong_saldo_generate");
        if (error) throw error;
        if (!ok) {
          toast.error("Saldo tidak mencukupi untuk semua variasi!", {
            description: "Silakan top up.",
          });
          break;
        }
      }

      // Pilih ukuran OpenAI terdekat dari rasio
      const size =
        ratio === "9:16" || ratio === "4:5"
          ? "1024x1536"
          : ratio === "16:9"
          ? "1536x1024"
          : "1024x1024";

      const newResults = [];
      let totalFailovers = 0;
      const usedKeys = new Set<string>();
      let failedCount = 0;
      for (let i = 0; i < generateCount; i++) {
        // 1) Catat proyek dengan status "proses" dulu
        const { data: inserted, error: insertErr } = await supabase
          .from("projects")
          .insert({
            user_id: user.userId,
            kebutuhan: form.title || form.prompt.slice(0, 80),
            prompt: form.prompt,
            title: form.title || null,
            subtitle: form.subtitle || null,
            whatsapp: form.whatsapp || null,
            social_url: form.social_url || null,
            body_content: form.body_content || null,
            reference_url: reference,
            image_url: null,
            aspect_ratio: ratio,
            platform,
            status: "proses",
          })
          .select("id")
          .single();
        if (insertErr) throw insertErr;
        const projectId = inserted!.id;
        await refresh();

        // 2) Jalankan generate; update ke sukses / gagal sesuai hasil
        try {
          let finalUrl = "";
          await streamImage(form.prompt, size, (dataUrl, isFinal) => {
            setVariants((prev) => {
              const next = [...prev];
              next[i] = isFinal
                ? { status: "sukses", imageUrl: dataUrl }
                : { status: "streaming", imageUrl: dataUrl };
              return next;
            });
            if (isFinal) finalUrl = dataUrl;
          });
          if (!finalUrl) throw new Error("Tidak ada gambar final.");
          usedKeys.add("OpenAI gpt-image-2");
          newResults.push(finalUrl);
          await supabase
            .from("projects")
            .update({ image_url: finalUrl, status: "sukses" })
            .eq("id", projectId);
        } catch (genErr) {
          failedCount++;
          const msg = genErr instanceof Error ? genErr.message : "Generate gagal";
          setVariants((prev) => {
            const next = [...prev];
            next[i] = { status: "gagal", error: msg };
            return next;
          });
          await supabase
            .from("projects")
            .update({ status: "gagal" })
            .eq("id", projectId);
          toast.error(`Variasi ${i + 1} gagal`, { description: msg });
        }
        await refresh();
      }

      setResults(newResults);
      await refresh();
      const keyInfo =
        usedKeys.size > 0 ? ` · via ${Array.from(usedKeys).join(", ")}` : "";
      const failInfo = totalFailovers > 0 ? ` (${totalFailovers}× failover)` : "";
      if (newResults.length > 0) {
        toast.success(
          `${newResults.length} variasi sukses${failedCount > 0 ? `, ${failedCount} gagal` : ""}!${keyInfo}${failInfo}`,
        );
      } else if (failedCount > 0) {
        toast.error(`Semua ${failedCount} variasi gagal di-generate.`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generate gagal");
    } finally {
      setGenerating(false);
    }
  }

  function handleDownload(url: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = `cetakide-${Date.now()}.webp`;
    a.target = "_blank";
    a.click();
  }

  function handleAutoUpload(imageUrl: string) {
    toast.success("Tersimpan di Assets", {
      description: "Gambar berhasil di-upload ke Galeri Project Anda.",
    });
    console.log("Auto-uploaded image data:", imageUrl);
  }

  return (
    <AppShell
      title="Workspace"
      subtitle="Cetak visual iklan dalam hitungan detik"
      user={user}
      right={
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPanduanOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white transition"
          >
            <HelpCircle className="h-4 w-4" /> Panduan
          </button>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        {/* Canvas Area */}
        <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-5 backdrop-blur-md flex flex-col">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as keyof typeof PLATFORMS)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm outline-none"
              >
                {Object.entries(PLATFORMS).map(([k, v]) => (
                  <option key={k} value={k} className="bg-background">
                    {v.label}
                  </option>
                ))}
              </select>
              <div className="flex gap-1.5">
                {ratios.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => setRatio(r.key)}
                    className={`rounded-md px-2.5 py-1 text-xs transition ${
                      r.key === ratio
                        ? "bg-primary text-black font-semibold"
                        : "bg-white/5 text-muted-foreground hover:bg-white/10"
                    }`}
                  >
                    {r.key}
                  </button>
                ))}
              </div>
            </div>

            {/* Jumlah Generate Dropdown */}
            <div className="flex items-center gap-2 border-l border-white/10 pl-3">
              <span className="text-xs font-medium text-white/60">Jumlah Generate:</span>
              <select
                value={generateCount}
                onChange={(e) => setGenerateCount(Number(e.target.value))}
                className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm outline-none"
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n} className="bg-background">
                    {n} Gambar
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Grid */}
          <div className="flex-1 flex items-center justify-center min-h-[400px]">
            {variants.length > 0 ? (
              <div
                className={`grid gap-4 w-full ${variants.length === 1 ? "grid-cols-1 max-w-xl mx-auto" : "grid-cols-1 sm:grid-cols-2"}`}
              >
                {variants.map((v, i) => {
                  const successIdx =
                    v.status === "sukses"
                      ? variants.slice(0, i + 1).filter((x) => x.status === "sukses").length - 1
                      : -1;
                  return (
                    <div key={i} className="flex flex-col gap-3">
                      <div
                        className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-black/40 group"
                        style={canvasStyle}
                      >
                        {v.status === "proses" && (
                          <>
                            {/* Skeleton shimmer */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-white/[0.08] to-white/[0.03] animate-pulse" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10">
                              <Loader2 className="h-7 w-7 animate-spin text-primary" />
                              <p className="text-xs text-white/70">Variasi {i + 1} · sedang diproses…</p>
                              <span className="rounded-full bg-yellow-500/20 border border-yellow-500/40 px-2 py-0.5 text-[10px] font-semibold text-yellow-300">
                                proses
                              </span>
                            </div>
                          </>
                        )}
                        {v.status === "sukses" && (
                          <>
                            <img
                              src={v.imageUrl}
                              alt={`Hasil ${i + 1}`}
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute top-2 left-2">
                              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                                sukses
                              </span>
                            </div>
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                onClick={() => setEditImageIndex(successIdx)}
                                className="bg-primary text-black font-semibold rounded-full px-4 py-2 text-sm flex items-center gap-2"
                              >
                                <Settings2 className="h-4 w-4" /> Edit / Regenerate
                              </button>
                            </div>
                          </>
                        )}
                        {v.status === "gagal" && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 bg-red-950/30">
                            <span className="rounded-full bg-red-500/20 border border-red-500/40 px-2 py-0.5 text-[10px] font-semibold text-red-300">
                              gagal
                            </span>
                            <p className="text-xs text-red-200/80 text-center line-clamp-3">
                              {v.error}
                            </p>
                          </div>
                        )}
                      </div>

                      {v.status === "sukses" && (
                        <div className="flex flex-wrap gap-2 justify-center">
                          <button
                            onClick={() => handleDownload(v.imageUrl)}
                            className="flex-1 inline-flex justify-center items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20"
                          >
                            <Download className="h-3.5 w-3.5" /> Download
                          </button>
                          <button
                            onClick={() => handleAutoUpload(v.imageUrl)}
                            className="flex-1 inline-flex justify-center items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold hover:bg-white/10"
                          >
                            <CloudUpload className="h-3.5 w-3.5" /> Auto Upload
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                className="relative w-full max-w-xl overflow-hidden rounded-xl border border-white/10 bg-black/40 mx-auto"
                style={canvasStyle}
              >
                  <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                    <Sparkles className="mr-2 h-4 w-4" /> Canvas siap dicetak
                  </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-5 backdrop-blur-md overflow-y-auto max-h-[calc(100vh-100px)]">
          <div className="space-y-4">
            {/* Quick Assets Pickers */}
            <div className="grid grid-cols-3 gap-2 pb-2 border-b border-white/10">
              <button
                onClick={() => setPresetModalOpen(true)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/20 transition text-xs text-white/70"
              >
                <LayoutTemplate className="h-4 w-4 text-primary" /> Preset
              </button>
              <button
                onClick={() => setFontModalOpen(true)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/20 transition text-xs text-white/70"
              >
                <Type className="h-4 w-4 text-primary" /> Font
              </button>
              <button
                onClick={() => setBrandModalOpen(true)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/20 transition text-xs text-white/70"
              >
                <Palette className="h-4 w-4 text-primary" /> Brand Kit
              </button>
            </div>

            <Field label="Preset Theme">
              <div className="flex items-center gap-2">
                <select
                  value={selectedPreset}
                  onChange={(e) => setSelectedPreset(e.target.value)}
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-sm outline-none focus:border-primary/60"
                >
                  <option value="">Tidak ada preset (Custom)</option>
                  {PRESET_THEMES.map((theme) => (
                    <option key={theme} value={theme} className="bg-background">
                      {theme}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setPresetModalOpen(true)}
                  className="rounded-lg border border-white/10 bg-white/5 p-2 hover:bg-white/10 hover:border-primary/50 transition-colors"
                  title="Lihat Galeri Preset"
                >
                  <LayoutTemplate className="h-5 w-5 text-primary" />
                </button>
              </div>
            </Field>

            <Field label="Prompt">
              <textarea
                value={form.prompt}
                onChange={updateField("prompt")}
                rows={3}
                placeholder="Contoh: Banner promo kopi susu, warna coklat gold"
                className="w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-sm outline-none focus:border-primary/60"
              />
            </Field>
            <Field label="Judul">
              <input
                value={form.title}
                onChange={updateField("title")}
                className={inputCls}
                placeholder="Diskon 50%"
              />
            </Field>
            <Field label="Sub Judul">
              <input
                value={form.subtitle}
                onChange={updateField("subtitle")}
                className={inputCls}
                placeholder="Berlaku sampai 31 Des"
              />
            </Field>
            <Field label="Nomor WA">
              <input
                value={form.whatsapp}
                onChange={updateField("whatsapp")}
                className={inputCls}
                placeholder="0812..."
              />
            </Field>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Facebook">
                <input
                  value={form.facebook_url}
                  onChange={updateField("facebook_url")}
                  className={inputCls}
                  placeholder="fb.com/brand"
                />
              </Field>
              <Field label="Instagram">
                <input
                  value={form.instagram_url}
                  onChange={updateField("instagram_url")}
                  className={inputCls}
                  placeholder="@brand"
                />
              </Field>
              <Field label="Twitter">
                <input
                  value={form.twitter_url}
                  onChange={updateField("twitter_url")}
                  className={inputCls}
                  placeholder="@brand"
                />
              </Field>
            </div>
            <Field label="Isi Konten">
              <textarea
                value={form.body_content}
                onChange={updateField("body_content")}
                rows={2}
                className="w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-sm outline-none focus:border-primary/60"
                placeholder="Detail penawaran..."
              />
            </Field>

            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Referensi Tema
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRefModalOpen(true)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                >
                  <ImageIcon className="h-3.5 w-3.5" /> Pilih Katalog
                </button>
                <label className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10">
                  <Upload className="h-3.5 w-3.5" /> Custom Add
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCustomUpload}
                    className="hidden"
                  />
                </label>
              </div>
              {reference && (
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-2">
                  <img src={reference} alt="" className="h-12 w-12 rounded object-cover" />
                  <span className="flex-1 truncate text-xs text-muted-foreground">
                    Referensi aktif
                  </span>
                  <button
                    onClick={() => setReference(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="glow-gold flex w-full items-center justify-center gap-2 rounded-lg gradient-gold py-3 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-60 mt-4"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              Cetak Ide Sekarang
            </button>
            <p className="text-center text-[11px] text-muted-foreground">
              {user?.isDeveloper
                ? "God Mode — gratis"
                : `Potong Rp ${(1000 * generateCount).toLocaleString("id-ID")} · sisa Rp ${(user?.saldo ?? 0).toLocaleString("id-ID")}`}
            </p>
          </div>
        </div>
      </div>

      {/* Catalog Modal */}
      {refModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl rounded-2xl border border-white/15 bg-background p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">Katalog Referensi Tema</h3>
              <button
                onClick={() => setRefModalOpen(false)}
                className="rounded-md p-1.5 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid max-h-[70vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
              {REFERENCE_CATALOG.map((src) => (
                <button
                  key={src}
                  onClick={() => {
                    setReference(src);
                    setRefModalOpen(false);
                    toast.success("Referensi dipilih.");
                  }}
                  className="group relative overflow-hidden rounded-lg border border-white/10 hover:border-primary/60"
                >
                  <img
                    src={src}
                    alt=""
                    className="aspect-square w-full object-cover transition group-hover:scale-105"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Image Modal */}
      {editImageIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl rounded-2xl border border-white/15 bg-background p-6">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="font-display text-xl font-bold flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary" /> Edit & Regenerate Spesifik
              </h3>
              <button
                onClick={() => setEditImageIndex(null)}
                className="rounded-md p-1.5 hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div
                  className="relative rounded-xl border border-white/10 bg-black/40 overflow-hidden"
                  style={canvasStyle}
                >
                  <img
                    src={results[editImageIndex]}
                    alt="Edit target"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-white/70">
                  Sesuaikan properti visual khusus untuk variasi ini saja, lalu klik Regenerate.
                </p>

                <Field label="Ubah Font Spesifik">
                  <select className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none">
                    <option className="bg-background">Sesuai Brand Kit</option>
                    <option className="bg-background">Inter (Modern)</option>
                    <option className="bg-background">Playfair Display (Elegan)</option>
                    <option className="bg-background">Bebas Neue (Bold)</option>
                  </select>
                </Field>

                <Field label="Ubah Tipe Warna / Mood">
                  <select className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none">
                    <option className="bg-background">Sesuai Prompt Utama</option>
                    <option className="bg-background">Dark Mode Minimalis</option>
                    <option className="bg-background">Cerah & Pop (Vibrant)</option>
                    <option className="bg-background">Monokrom Elegan</option>
                  </select>
                </Field>

                <Field label="Prompt Tambahan Khusus">
                  <textarea
                    rows={3}
                    placeholder="Tambahkan instruksi spesifik untuk variasi ini..."
                    className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-sm outline-none"
                  />
                </Field>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      toast.success("Regenerate variasi spesifik sedang diproses!");
                      setEditImageIndex(null);
                    }}
                    className="w-full rounded-lg gradient-gold text-black font-bold py-3"
                  >
                    Regenerate Variasi Ini
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Panduan Modal */}
      {panduanOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl border border-white/15 bg-background p-6">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="font-display text-xl font-bold flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" /> Panduan Penggunaan Workspace
              </h3>
              <button
                onClick={() => setPanduanOpen(false)}
                className="rounded-md p-1.5 hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto text-sm text-white/80 pr-2">
              <p>
                Selamat datang di <strong>Workspace Cetak Ide</strong>! Berikut cara memaksimalkan
                fitur sidebar Anda:
              </p>

              <div className="rounded-lg bg-white/5 p-4 border border-white/10">
                <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                  <LayoutTemplate className="h-4 w-4" /> Koleksi Template
                </h4>
                <p className="text-xs">
                  Pilih template tata letak (layout) yang sudah Anda simpan atau beli dari menu
                  Templates di sidebar. Template menentukan struktur posisi gambar dan teks.
                </p>
              </div>

              <div className="rounded-lg bg-white/5 p-4 border border-white/10">
                <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                  <Type className="h-4 w-4" /> Manajemen Font
                </h4>
                <p className="text-xs">
                  Integrasikan Font khusus Anda dari menu Fonts di sidebar. Anda dapat mengunggah
                  custom font atau memilih Google Fonts agar AI menuliskannya di hasil desain Anda.
                </p>
              </div>

              <div className="rounded-lg bg-white/5 p-4 border border-white/10">
                <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                  <Palette className="h-4 w-4" /> Brand Kit
                </h4>
                <p className="text-xs">
                  Konsistensi adalah kunci. Set palet warna utama dan logo bisnis Anda di menu Brand
                  Kit. Workspace akan otomatis menerapkan warna brand Anda saat melakukan render
                  (kecuali ditimpa manual di form edit).
                </p>
              </div>

              <div className="rounded-lg bg-white/5 p-4 border border-white/10">
                <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                  <Wand2 className="h-4 w-4" /> Jumlah Generate
                </h4>
                <p className="text-xs">
                  Hemat waktu Anda dengan mencetak hingga 4 variasi visual (konsep berbeda namun
                  mempertahankan identitas) dalam sekali klik. Saldo akan dipotong sesuai jumlah
                  gambar yang dicetak.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setPanduanOpen(false)}
                className="rounded-lg bg-white/10 hover:bg-white/20 px-5 py-2 font-medium"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preset Theme Modal */}
      {presetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-5xl rounded-2xl border border-white/15 bg-background p-6 flex flex-col max-h-[90vh]">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
              <h3 className="font-display text-xl font-bold flex items-center gap-2">
                <LayoutTemplate className="h-5 w-5 text-primary" /> Galeri Preset Theme
              </h3>
              <button
                onClick={() => setPresetModalOpen(false)}
                className="rounded-md p-1.5 hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-2">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {PRESET_THEMES.map((theme) => {
                  const styles = getThemeStyles(theme);
                  return (
                    <button
                      key={theme}
                      onClick={() => {
                        setSelectedPreset(theme);
                        setPresetModalOpen(false);
                        toast.success(`Preset ${theme} dipilih.`);
                      }}
                      className={`group relative flex flex-col overflow-hidden text-left transition-transform hover:scale-[1.02] active:scale-95 ${styles.wrapper} ${selectedPreset === theme ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
                    >
                      <img
                        src={DEFAULT_IMG}
                        alt={theme}
                        className={`h-24 w-full object-cover ${styles.image}`}
                      />
                      <div className="flex flex-col p-3 flex-1">
                        <h2 className={`text-sm font-bold flex-1 ${styles.title}`}>{theme}</h2>
                        <div className="mt-3 flex items-center justify-between">
                          <span
                            className={`px-2 py-1 text-[10px] font-semibold inline-block ${styles.button}`}
                          >
                            {selectedPreset === theme ? "Terpilih" : "Pilih Preset"}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Asset Modals */}
      {templateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl border border-white/15 bg-background p-6">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="font-display text-xl font-bold flex items-center gap-2">
                <LayoutTemplate className="h-5 w-5 text-primary" /> Koleksi Template Saya
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate({ to: "/templates" })}
                  className="text-xs bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded hover:bg-primary/20 transition font-semibold"
                >
                  + Tambah Template Baru
                </button>
                <button
                  onClick={() => setTemplateModalOpen(false)}
                  className="rounded-md p-1.5 hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
              {Array.from({ length: 8 }).map((_, i) => {
                const isSelected = selectedTemplateIndex === i;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedTemplateIndex(i);
                      toast.success("Template dipilih!");
                      setTemplateModalOpen(false);
                    }}
                    className={`group relative overflow-hidden rounded-lg border transition ${isSelected ? "border-primary ring-2 ring-primary" : "border-white/10 hover:border-primary/60"}`}
                  >
                    <img
                      src={`/assets/feed-ig/ig-${i + 1}.png`}
                      alt={`Template ${i + 1}`}
                      className="aspect-square w-full object-cover transition group-hover:scale-105"
                    />
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-primary text-black text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10">
                        Terpilih
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 text-xs text-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      Gunakan Template
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {fontModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl border border-white/15 bg-background p-6">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="font-display text-xl font-bold flex items-center gap-2">
                <Type className="h-5 w-5 text-primary" /> Pilih Font Kustom
              </h3>
              <button
                onClick={() => setFontModalOpen(false)}
                className="rounded-md p-1.5 hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <style>{`
              @import url('https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Anton&family=Bebas+Neue&family=Dancing+Script&family=Inter:wght@400;500;600&family=Josefin+Sans:ital,wght@0,100..700;1,100..700&family=Lora:ital,wght@0,400;0,500;1,400&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@400;500;600;700&family=Nunito:wght@400;600;700&family=Outfit:wght@400;500;600;700&family=Oswald:wght@400;500;600;700&family=Pacifico&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Poppins:wght@400;500;600;700&family=Raleway:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=Ubuntu:wght@400;500;700&display=swap');
            `}</style>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
              {[
                { name: "Inter (Default)", family: "Inter" },
                { name: "Roboto", family: "Roboto" },
                { name: "Playfair Display", family: "'Playfair Display', serif" },
                { name: "Montserrat", family: "Montserrat" },
                { name: "Poppins", family: "Poppins" },
                { name: "Outfit", family: "Outfit" },
                { name: "Bebas Neue", family: "'Bebas Neue', cursive" },
                { name: "Lora", family: "'Lora', serif" },
                { name: "Merriweather", family: "'Merriweather', serif" },
                { name: "Oswald", family: "Oswald, sans-serif" },
                { name: "Raleway", family: "Raleway, sans-serif" },
                { name: "Nunito", family: "Nunito, sans-serif" },
                { name: "Ubuntu", family: "Ubuntu, sans-serif" },
                { name: "Pacifico", family: "Pacifico, cursive" },
                { name: "Dancing Script", family: "'Dancing Script', cursive" },
                { name: "Anton", family: "Anton, sans-serif" },
                { name: "Josefin Sans", family: "'Josefin Sans', sans-serif" },
                { name: "Abril Fatface", family: "'Abril Fatface', serif" },
              ].map((font) => {
                const isSelected = selectedFont === font.name;
                return (
                  <button
                    key={font.name}
                    onClick={() => {
                      setSelectedFont(font.name);
                      toast.success(`Font ${font.name} dipilih!`);
                      setFontModalOpen(false);
                    }}
                    className={`rounded-xl border bg-white/5 p-4 flex flex-col items-center justify-center transition group min-h-[100px] relative ${isSelected ? "border-primary ring-2 ring-primary bg-primary/10" : "border-white/10 hover:border-primary/60"}`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-primary text-black text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                        Terpilih
                      </div>
                    )}
                    <p
                      className={`text-3xl mb-2 ${isSelected ? "text-primary" : "text-white/90 group-hover:text-primary"}`}
                      style={{ fontFamily: font.family }}
                    >
                      Aa
                    </p>
                    <p
                      className={`text-xs font-medium text-center ${isSelected ? "text-white" : "text-white/80"}`}
                    >
                      {font.name}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {brandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl border border-white/15 bg-background p-6">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="font-display text-xl font-bold flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" /> Pilih Brand Kit
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate({ to: "/brand-kits" })}
                  className="text-xs bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded hover:bg-primary/20 transition font-semibold"
                >
                  + Tambah Brand Kit Baru
                </button>
                <button
                  onClick={() => setBrandModalOpen(false)}
                  className="rounded-md p-1.5 hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
              {[
                { name: "Cetak Ide Official", colors: ["#EAB308", "#0A0F1E", "#FFFFFF"] },
                { name: "Tech Startup", colors: ["#3B82F6", "#1E293B", "#F8FAFC"] },
                { name: "Eco Friendly", colors: ["#22C55E", "#14532D", "#F0FDF4"] },
                { name: "Luxury Brand", colors: ["#D4AF37", "#000000", "#1A1A1A"] },
              ].map((brand) => {
                const isSelected = selectedBrand === brand.name;
                return (
                  <button
                    key={brand.name}
                    onClick={() => {
                      setSelectedBrand(brand.name);
                      toast.success(`Brand Kit ${brand.name} dipilih!`);
                      setBrandModalOpen(false);
                    }}
                    className={`rounded-xl border bg-white/5 p-4 text-left transition group flex flex-col justify-between min-h-[100px] relative ${isSelected ? "border-primary ring-2 ring-primary bg-primary/10" : "border-white/10 hover:border-primary/60"}`}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 bg-primary text-black text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                        Terpilih
                      </div>
                    )}
                    <p
                      className={`text-sm font-semibold mb-3 pr-12 ${isSelected ? "text-primary" : "text-white/90 group-hover:text-primary"}`}
                    >
                      {brand.name}
                    </p>
                    <div className="flex gap-2">
                      {brand.colors.map((color) => (
                        <div
                          key={color}
                          className="h-6 w-6 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: color }}
                        ></div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

const inputCls =
  "w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-sm outline-none focus:border-primary/60";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
