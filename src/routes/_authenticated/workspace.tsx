import { createFileRoute } from "@tanstack/react-router";
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
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/workspace")({
  head: () => ({
    meta: [
      { title: "Workspace — CetakIde" },
      { name: "robots", content: "noindex" },
    ],
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
  "https://placehold.co/600x600/0a0a0a/EAB308?text=Ref+1",
  "https://placehold.co/600x600/141414/EAB308?text=Ref+2",
  "https://placehold.co/600x600/1a1a1a/EAB308?text=Ref+3",
  "https://placehold.co/600x600/0a0a0a/EAB308?text=Ref+4",
  "https://placehold.co/600x600/141414/EAB308?text=Ref+5",
  "https://placehold.co/600x600/1a1a1a/EAB308?text=Ref+6",
  "https://placehold.co/600x600/0a0a0a/EAB308?text=Ref+7",
  "https://placehold.co/600x600/141414/EAB308?text=Ref+8",
];

function Workspace() {
  const { user, refresh } = useAppUser();
  const [platform, setPlatform] = useState<keyof typeof PLATFORMS>("instagram");
  const [ratio, setRatio] = useState("1:1");
  const [form, setForm] = useState({
    prompt: "",
    title: "",
    subtitle: "",
    whatsapp: "",
    social_url: "",
    body_content: "",
  });
  const [reference, setReference] = useState<string | null>(null);
  const [refModalOpen, setRefModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    setRatio(PLATFORMS[platform].ratios[0].key);
  }, [platform]);

  const ratios = PLATFORMS[platform].ratios;
  const active = ratios.find((r) => r.key === ratio) ?? ratios[0];
  const canvasStyle = useMemo(() => ({ aspectRatio: `${active.w} / ${active.h}` }), [active]);

  const updateField = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
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
    try {
      const { data: ok, error } = await supabase.rpc("potong_saldo_generate");
      if (error) throw error;
      if (!ok) {
        toast.error("Saldo tidak mencukupi!", { description: "Silakan top up." });
        setGenerating(false);
        return;
      }
      await new Promise((r) => setTimeout(r, 2000));

      const stockPool = [
        "https://pintardigital.b-cdn.net/Banner/banner-14.webp",
        "https://pintardigital.b-cdn.net/reel/reel-1.webp",
        "https://pintardigital.b-cdn.net/Banner/YT/YT-Thumb-5.webp",
      ];
      const image_url = stockPool[Math.floor(Math.random() * stockPool.length)];

      const { error: insErr } = await supabase.from("projects").insert({
        user_id: user.userId,
        kebutuhan: form.title || form.prompt.slice(0, 80),
        prompt: form.prompt,
        title: form.title || null,
        subtitle: form.subtitle || null,
        whatsapp: form.whatsapp || null,
        social_url: form.social_url || null,
        body_content: form.body_content || null,
        reference_url: reference,
        image_url,
        aspect_ratio: ratio,
        platform,
        status: "sukses",
      });
      if (insErr) throw insErr;
      setResult(image_url);
      await refresh();
      toast.success("Visual berhasil di-cetak!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generate gagal");
    } finally {
      setGenerating(false);
    }
  }

  function handleDownload() {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result;
    a.download = `cetakide-${Date.now()}.webp`;
    a.target = "_blank";
    a.click();
  }

  function handleShareToUploader() {
    if (!result) return;
    toast.success("Dikirim ke Auto Uploader.", { description: "Coming soon." });
  }

  const saldoBadge = (
    <div className="flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
      <Wallet className="h-3 w-3" />
      Rp {(user?.saldo ?? 0).toLocaleString("id-ID")}
    </div>
  );

  return (
    <AppShell title="Workspace" subtitle="Cetak visual iklan dalam hitungan detik" user={user} right={saldoBadge}>
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        {/* Canvas */}
        <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-5 backdrop-blur-md">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
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
          </div>

          <div className="mx-auto max-w-xl">
            <div className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-black/40" style={canvasStyle}>
              {result ? (
                <img src={result} alt="Hasil" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                  <Sparkles className="mr-2 h-4 w-4" /> Canvas siap dicetak
                </div>
              )}
              {generating && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/60 backdrop-blur-md">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm">Mencetak ide...</p>
                </div>
              )}
            </div>

            {result && !generating && (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 rounded-lg gradient-gold px-4 py-2 text-sm font-semibold text-black"
                >
                  <Download className="h-4 w-4" /> Download
                </button>
                <button
                  onClick={handleShareToUploader}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
                >
                  <Share2 className="h-4 w-4" /> Share to Auto Uploader
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-5 backdrop-blur-md">
          <div className="space-y-3">
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
              <input value={form.title} onChange={updateField("title")} className={inputCls} placeholder="Diskon 50%" />
            </Field>
            <Field label="Sub Judul">
              <input value={form.subtitle} onChange={updateField("subtitle")} className={inputCls} placeholder="Berlaku sampai 31 Des" />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Nomor WA">
                <input value={form.whatsapp} onChange={updateField("whatsapp")} className={inputCls} placeholder="0812..." />
              </Field>
              <Field label="URL Sosmed">
                <input value={form.social_url} onChange={updateField("social_url")} className={inputCls} placeholder="@brand" />
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
                  <input type="file" accept="image/*" onChange={handleCustomUpload} className="hidden" />
                </label>
              </div>
              {reference && (
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-2">
                  <img src={reference} alt="" className="h-12 w-12 rounded object-cover" />
                  <span className="flex-1 truncate text-xs text-muted-foreground">Referensi aktif</span>
                  <button onClick={() => setReference(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="glow-gold flex w-full items-center justify-center gap-2 rounded-lg gradient-gold py-3 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-60"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              Cetak Ide Sekarang
            </button>
            <p className="text-center text-[11px] text-muted-foreground">
              {user?.isDeveloper
                ? "God Mode — gratis"
                : `Potong Rp 1.000 · sisa Rp ${(user?.saldo ?? 0).toLocaleString("id-ID")}`}
            </p>
          </div>
        </div>
      </div>

      {refModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl rounded-2xl border border-white/15 bg-background p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">Katalog Referensi Tema</h3>
              <button onClick={() => setRefModalOpen(false)} className="rounded-md p-1.5 hover:bg-white/10">
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
                  <img src={src} alt="" className="aspect-square w-full object-cover transition group-hover:scale-105" />
                </button>
              ))}
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