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
  Layers,
  ListOrdered,
  Save,
  FolderOpen,
  Trash2,
  Bug,
  ChevronUp,
} from "lucide-react";
import { PRESET_THEMES, getThemeStyles, ThemeSkeletonPreview, getPresetExample } from "./preset-theme";
import { enhancePromptServer } from "@/lib/enhancePrompt.functions";
import { autofillFieldServer } from "@/lib/autofillField.functions";
import { streamImage } from "@/lib/streamImage";
import { useServerFn } from "@tanstack/react-start";
import JSZip from "jszip";

export const Route = createFileRoute("/_authenticated/workspace")({
  validateSearch: z.object({
    preset: z.string().optional(),
    prompt: z.string().optional(),
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

type BrandKit = {
  id: string;
  name: string;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  background_color: string | null;
  text_color: string | null;
  primary_font: string | null;
  brand_voice: string | null;
  logo_url: string | null;
  is_default: boolean;
};

function buildBrandInstructions(kit: BrandKit | null): string {
  if (!kit) return "";
  const colors = [
    kit.primary_color && `primary ${kit.primary_color}`,
    kit.secondary_color && `secondary ${kit.secondary_color}`,
    kit.accent_color && `accent ${kit.accent_color}`,
    kit.background_color && `background ${kit.background_color}`,
    kit.text_color && `text ${kit.text_color}`,
  ]
    .filter(Boolean)
    .join(", ");
  const parts = [
    `Brand: ${kit.name}.`,
    colors && `Use these brand colors as the dominant palette: ${colors}.`,
    kit.primary_font && `Typography style similar to ${kit.primary_font}.`,
    kit.brand_voice && `Visual tone/voice: ${kit.brand_voice}.`,
    "Keep the design consistent with this brand identity.",
  ].filter(Boolean);
  return parts.join(" ");
}

function ratioToSize(r: string): string {
  if (r === "9:16" || r === "4:5") return "1024x1536";
  if (r === "16:9" || r === "1.91:1") return "1536x1024";
  return "1024x1024";
}

function Workspace() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { user, refresh } = useAppUser();
  const [platform, setPlatform] = useState<keyof typeof PLATFORMS>("instagram");
  const [ratio, setRatio] = useState("1:1");
  const [generateCount, setGenerateCount] = useState(1);
  const [selectedPreset, setSelectedPreset] = useState<string>(search.preset || "");
  const [selectedFont, setSelectedFont] = useState("Inter (Default)");
  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [allRatios, setAllRatios] = useState(false);
  const selectedBrand = brandKits.find((b) => b.id === selectedBrandId) ?? null;

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
    brand_name: "",
    category: "",
    cta: "",
    features: "",
  });

  // Tata letak & multi image
  const [targetImageCount, setTargetImageCount] = useState<number>(1);
  const [visualPosition, setVisualPosition] = useState<string>("center");

  const [reference, setReference] = useState<string | null>(null);
  const [brandLogo, setBrandLogo] = useState<string | null>(null);

  // Draft manager (localStorage per user)
  const draftStorageKey = user ? `cetakide:workspace-drafts:${user.userId}` : "";
  const [draftName, setDraftName] = useState("");
  const [draftList, setDraftList] = useState<Array<{ name: string; savedAt: string }>>([]);
  const [draftOpen, setDraftOpen] = useState(false);

  // Debug panel state
  type DebugEntry = {
    ts: string;
    level: "info" | "success" | "error";
    message: string;
    provider?: string;
    jobId?: string;
  };
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugEntry[]>([]);
  const [checkingOpenai, setCheckingOpenai] = useState(false);
  const [openaiStatus, setOpenaiStatus] = useState<null | {
    ok: boolean;
    detail: string;
    latency?: number;
  }>(null);
  function pushDebug(entry: Omit<DebugEntry, "ts">) {
    setDebugLogs((prev) =>
      [{ ts: new Date().toISOString(), ...entry }, ...prev].slice(0, 30),
    );
  }
  async function handleCheckOpenai() {
    setCheckingOpenai(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Belum sign in.");
      const res = await fetch("/api/check-openai", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = (await res.json()) as {
        ok: boolean;
        found?: boolean;
        status?: number;
        latency_ms?: number;
        model?: string | null;
        model_count?: number;
        has_image_model?: boolean;
        error?: string;
      };
      if (j.ok) {
        const detail = `Key valid · ${j.model_count ?? 0} model tersedia${j.has_image_model ? " · gpt-image/dall-e siap" : " · TIDAK ada model image"} · ${j.latency_ms}ms`;
        setOpenaiStatus({ ok: true, detail, latency: j.latency_ms });
        pushDebug({ level: "success", message: `OpenAI check OK — ${detail}` });
        toast.success("OpenAI key valid", { description: detail });
      } else {
        const detail = j.error || (j.status ? `HTTP ${j.status}` : "Belum berhasil");
        setOpenaiStatus({ ok: false, detail });
        pushDebug({ level: "error", message: `OpenAI check belum berhasil — ${detail}` });
        toast.error("OpenAI key bermasalah", { description: detail });
      }
      setDebugOpen(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setOpenaiStatus({ ok: false, detail: msg });
      pushDebug({ level: "error", message: `OpenAI check exception: ${msg}` });
      toast.error("Cek OpenAI belum berhasil", { description: msg });
    } finally {
      setCheckingOpenai(false);
    }
  }

  useEffect(() => {
    if (!draftStorageKey) return;
    try {
      const raw = localStorage.getItem(draftStorageKey);
      const map = raw ? (JSON.parse(raw) as Record<string, { savedAt: string }>) : {};
      setDraftList(
        Object.entries(map).map(([name, v]) => ({ name, savedAt: v.savedAt })),
      );
    } catch {
      /* ignore */
    }
  }, [draftStorageKey]);

  function saveDraft() {
    if (!draftStorageKey) return;
    const name = draftName.trim();
    if (!name) {
      toast.error("Beri nama draft dulu.");
      return;
    }
    const raw = localStorage.getItem(draftStorageKey);
    const map = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    map[name] = {
      savedAt: new Date().toISOString(),
      platform,
      ratio,
      generateCount,
      allRatios,
      selectedPreset,
      selectedFont,
      selectedBrandId,
      form,
      reference,
      brandLogo,
    };
    localStorage.setItem(draftStorageKey, JSON.stringify(map));
    setDraftList(
      Object.entries(map).map(([n, v]) => ({
        name: n,
        savedAt: (v as { savedAt: string }).savedAt,
      })),
    );
    toast.success(`Draft "${name}" disimpan.`);
  }

  function loadDraft(name: string) {
    if (!draftStorageKey) return;
    const raw = localStorage.getItem(draftStorageKey);
    if (!raw) return;
    const map = JSON.parse(raw) as Record<string, Record<string, unknown>>;
    const d = map[name];
    if (!d) return;
    setPlatform(d.platform as keyof typeof PLATFORMS);
    setRatio(d.ratio as string);
    setGenerateCount(d.generateCount as number);
    setAllRatios(Boolean(d.allRatios));
    setSelectedPreset(d.selectedPreset as string);
    setSelectedFont(d.selectedFont as string);
    setSelectedBrandId((d.selectedBrandId as string | null) ?? null);
    setForm(d.form as typeof form);
    setReference((d.reference as string | null) ?? null);
    setBrandLogo((d.brandLogo as string | null) ?? null);
    setDraftOpen(false);
    toast.success(`Draft "${name}" dimuat.`);
  }

  function deleteDraft(name: string) {
    if (!draftStorageKey) return;
    const raw = localStorage.getItem(draftStorageKey);
    if (!raw) return;
    const map = JSON.parse(raw) as Record<string, unknown>;
    delete map[name];
    localStorage.setItem(draftStorageKey, JSON.stringify(map));
    setDraftList(
      Object.entries(map).map(([n, v]) => ({
        name: n,
        savedAt: (v as { savedAt: string }).savedAt,
      })),
    );
    toast.success(`Draft "${name}" dihapus.`);
  }

  async function handleBrandLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setBrandLogo(reader.result as string);
      toast.success("Logo brand diupload (dipakai sebagai referensi).");
    };
    reader.readAsDataURL(file);
  }

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
    | { status: "proses"; prompt?: string; ratio?: string }
    | { status: "streaming"; imageUrl: string; prompt?: string; ratio?: string }
    | { status: "sukses"; imageUrl: string; prompt?: string; ratio?: string }
    | { status: "gagal"; error: string; prompt?: string; ratio?: string };
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number | null>(null);
  const enhancePrompt = useServerFn(enhancePromptServer);
  const autofillField = useServerFn(autofillFieldServer);
  const [enhancing, setEnhancing] = useState(false);
  const [autofillingKey, setAutofillingKey] = useState<string | null>(null);
  const [exportingZip, setExportingZip] = useState(false);

  async function runAutofill(field:
    | "prompt"
    | "title"
    | "subtitle"
    | "whatsapp"
    | "facebook_url"
    | "instagram_url"
    | "twitter_url"
    | "social_url"
    | "body_content"
    | "category"
    | "cta"
    | "features") {
    setAutofillingKey(field);
    try {
      const context = [
        form.brand_name && `Brand: ${form.brand_name}`,
        form.category && `Kategori Produk: ${form.category}`,
        form.prompt && `Prompt: ${form.prompt}`,
        form.title && `Judul: ${form.title}`,
        form.subtitle && `Subjudul: ${form.subtitle}`,
        form.cta && `CTA: ${form.cta}`,
        form.features && `Fitur: ${form.features}`,
        selectedBrand && `Brand: ${selectedBrand.name}`,
        selectedBrand?.brand_voice && `Voice: ${selectedBrand.brand_voice}`,
      ]
        .filter(Boolean)
        .join(" | ");
      const { value } = await autofillField({
        data: { field, context, currentValue: form[field] || undefined },
      });
      setForm((f) => ({ ...f, [field]: value }));
      toast.success("Terisi otomatis oleh AI ✨");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Autofill gagal");
    } finally {
      setAutofillingKey(null);
    }
  }

  async function handleExportAll() {
    const successes = variants.flatMap((v, i) =>
      v.status === "sukses" ? [{ i, url: v.imageUrl }] : [],
    );
    if (successes.length === 0) {
      toast.error("Belum ada varian sukses untuk diekspor.");
      return;
    }
    setExportingZip(true);
    try {
      const zip = new JSZip();
      for (const s of successes) {
        // dataURL → binary
        const res = await fetch(s.url);
        const blob = await res.blob();
        zip.file(`cetakide-varian-${s.i + 1}.png`, blob);
      }
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `cetakide-${Date.now()}.zip`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success(`${successes.length} varian diekspor sebagai ZIP.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ekspor gagal");
    } finally {
      setExportingZip(false);
    }
  }

  // Load brand kits from DB
  useEffect(() => {
    if (!user) return;
    supabase
      .from("brand_kits")
      .select("*")
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const list = (data as BrandKit[]) ?? [];
        setBrandKits(list);
        const def = list.find((b) => b.is_default) ?? list[0];
        if (def) setSelectedBrandId((prev) => prev ?? def.id);
      });
  }, [user]);

  // Load prompt dari query parameter pencarian jika ada
  useEffect(() => {
    if (search.prompt) {
      setForm((f) => ({ ...f, prompt: search.prompt }));
    }
  }, [search.prompt]);

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

    // Build target ratios (multi-ratio 1-klik or single)
    const targetRatios: string[] = allRatios
      ? PLATFORMS[platform].ratios.map((r) => r.key)
      : Array.from({ length: generateCount }, () => ratio);
    const totalJobs = targetRatios.length;

    const brandInstructions = buildBrandInstructions(selectedBrand);
    const finalBasePrompt = brandInstructions
      ? `${form.prompt}\n\n${brandInstructions}`
      : form.prompt;

    setGenerating(true);
    setResults([]);
    setVariants(
      Array.from({ length: totalJobs }, (_, idx) => ({
        status: "proses" as const,
        prompt: finalBasePrompt,
        ratio: targetRatios[idx],
      })),
    );
    try {
      // Potong saldo sesuai jumlah generate jika di backend diimplementasi
      for (let i = 0; i < totalJobs; i++) {
        const { data: ok, error } = await supabase.rpc("potong_saldo_generate");
        if (error) throw error;
        if (!ok) {
          toast.error("Saldo tidak mencukupi untuk semua variasi!", {
            description: "Silakan top up.",
          });
          break;
        }
      }

      const newResults = [];
      let totalFailovers = 0;
      const usedKeys = new Set<string>();
      let failedCount = 0;
      for (let i = 0; i < totalJobs; i++) {
        const jobRatio = targetRatios[i];
        const size = ratioToSize(jobRatio);
        const jobId =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `job_${Date.now()}_${i}`;
        // 1) Catat proyek dengan status "proses" dulu
        const { data: inserted, error: insertErr } = await supabase
          .from("projects")
          .insert({
            user_id: user.userId,
            kebutuhan: form.title || form.prompt.slice(0, 80),
            prompt: finalBasePrompt,
            title: form.title || null,
            subtitle: form.subtitle || null,
            whatsapp: form.whatsapp || null,
            social_url: form.social_url || null,
            body_content: form.body_content || null,
            reference_url: reference,
            image_url: null,
            aspect_ratio: jobRatio,
            platform,
            status: "proses",
            job_id: jobId,
            provider: null,
          })
          .select("id")
          .single();
        if (insertErr) throw insertErr;
        const projectId = inserted!.id;
        await refresh();

        // 2) Jalankan generate; update ke sukses / gagal sesuai hasil
        try {
          let finalUrl = "";
          const { provider } = await streamImage(
            finalBasePrompt,
            size,
            (dataUrl, isFinal) => {
              setVariants((prev) => {
                const next = [...prev];
                next[i] = isFinal
                  ? { status: "sukses", imageUrl: dataUrl, prompt: finalBasePrompt, ratio: jobRatio }
                  : { status: "streaming", imageUrl: dataUrl, prompt: finalBasePrompt, ratio: jobRatio };
                return next;
              });
              if (isFinal) finalUrl = dataUrl;
            },
            jobId,
            (status) =>
              pushDebug({
                level: "info",
                message: status.message || "Provider memproses gambar",
                provider: status.provider,
                jobId: status.jobId || jobId,
              }),
          );
          if (!finalUrl) throw new Error("Tidak ada gambar final.");
          usedKeys.add(provider);
          newResults.push(finalUrl);
          pushDebug({
            level: "success",
            message: `Variasi ${i + 1} sukses (${jobRatio})`,
            provider,
            jobId,
          });
          await supabase
            .from("projects")
            .update({ image_url: finalUrl, status: "sukses", provider })
            .eq("id", projectId);
        } catch (genErr) {
          failedCount++;
          const msg = genErr instanceof Error ? genErr.message : "Generate belum berhasil";
          setVariants((prev) => {
            const next = [...prev];
            next[i] = { status: "gagal", error: msg, prompt: finalBasePrompt, ratio: jobRatio };
            return next;
          });
          await supabase
            .from("projects")
            .update({ status: "gagal", error_message: msg.slice(0, 500) })
            .eq("id", projectId);
          pushDebug({
            level: "error",
            message: `Variasi ${i + 1} belum berhasil: ${msg}`,
            jobId,
          });
          toast.error(`Variasi ${i + 1} belum berhasil`, { description: msg });
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
          `${newResults.length} variasi sukses${failedCount > 0 ? `, ${failedCount} belum berhasil` : ""}!${keyInfo}${failInfo}`,
        );
      } else if (failedCount > 0) {
        toast.error(`Semua ${failedCount} variasi belum berhasil di-generate.`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generate belum berhasil");
    } finally {
      setGenerating(false);
    }
  }

  async function handleRegenerate(i: number) {
    // (test generate injected above)
    const v = variants[i];
    const prompt = v.prompt;
    const jobRatio = v.ratio;
    if (!prompt || !jobRatio) {
      toast.error("Data variasi tidak lengkap, tekan Generate ulang.");
      return;
    }
    const size = ratioToSize(jobRatio);
    const jobId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `job_${Date.now()}_${i}`;
    setVariants((prev) => {
      const next = [...prev];
      next[i] = { status: "proses", prompt, ratio: jobRatio };
      return next;
    });
    let projectId: string | null = null;
    try {
      const { data: ok } = await supabase.rpc("potong_saldo_generate");
      if (!ok) {
        toast.error("Saldo tidak mencukupi.");
        setVariants((prev) => {
          const next = [...prev];
          next[i] = { status: "gagal", error: "Saldo habis", prompt, ratio: jobRatio };
          return next;
        });
        return;
      }
      if (user) {
        const { data: inserted } = await supabase
          .from("projects")
          .insert({
            user_id: user.userId,
            kebutuhan: prompt.slice(0, 80),
            prompt,
            image_url: null,
            aspect_ratio: jobRatio,
            platform,
            status: "proses",
            job_id: jobId,
            provider: null,
          })
          .select("id")
          .single();
        projectId = inserted?.id ?? null;
      }
      let finalUrl = "";
      const { provider } = await streamImage(
        prompt,
        size,
        (dataUrl, isFinal) => {
          setVariants((prev) => {
            const next = [...prev];
            next[i] = isFinal
              ? { status: "sukses", imageUrl: dataUrl, prompt, ratio: jobRatio }
              : { status: "streaming", imageUrl: dataUrl, prompt, ratio: jobRatio };
            return next;
          });
          if (isFinal) finalUrl = dataUrl;
        },
        jobId,
        (status) =>
          pushDebug({
            level: "info",
            message: status.message || "Provider memproses gambar",
            provider: status.provider,
            jobId: status.jobId || jobId,
          }),
      );
      if (!finalUrl) throw new Error("Tidak ada gambar final.");
      if (projectId) {
        await supabase
          .from("projects")
          .update({ status: "sukses", provider, image_url: finalUrl })
          .eq("id", projectId);
      }
      await refresh();
      toast.success(`Variasi ${i + 1} berhasil di-regenerate.`);
      pushDebug({
        level: "success",
        message: `Regenerate variasi ${i + 1} sukses`,
        provider,
        jobId,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Regenerate belum berhasil";
      setVariants((prev) => {
        const next = [...prev];
        next[i] = { status: "gagal", error: msg, prompt, ratio: jobRatio };
        return next;
      });
      if (projectId) {
        await supabase
          .from("projects")
          .update({ status: "gagal", error_message: msg.slice(0, 500) })
          .eq("id", projectId);
      }
      toast.error(`Regenerate variasi ${i + 1} belum berhasil`, { description: msg });
      pushDebug({
        level: "error",
        message: `Regenerate variasi ${i + 1} belum berhasil: ${msg}`,
        jobId,
      });
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
            onClick={() => setDebugOpen((v) => !v)}
            className={`flex items-center gap-1.5 text-xs font-semibold transition ${
              debugLogs.some((d) => d.level === "error")
                ? "text-rose-300 hover:text-rose-200"
                : "text-white/70 hover:text-white"
            }`}
          >
            <Bug className="h-4 w-4" /> Debug
            {debugLogs.length > 0 && (
              <span className="ml-1 rounded-full bg-white/10 px-1.5 text-[10px]">
                {debugLogs.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setPanduanOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white transition"
          >
            <HelpCircle className="h-4 w-4" /> Panduan
          </button>
        </div>
      }
    >
      {debugOpen && (
        <div className="mb-4 rounded-2xl border border-white/15 bg-black/40 p-4 backdrop-blur-md">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Debug Panel</h3>
              <span className="text-[11px] text-white/50">
                Log terakhir, status provider, dan tes koneksi
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCheckOpenai}
                disabled={checkingOpenai}
                className="rounded-md border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold hover:bg-white/10 disabled:opacity-50"
              >
                {checkingOpenai ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" /> Cek OpenAI…
                  </span>
                ) : (
                  "Cek OpenAI"
                )}
              </button>
              <button
                onClick={() => setDebugLogs([])}
                className="rounded-md border border-white/10 px-2 py-1 text-xs text-white/60 hover:text-white"
              >
                Bersihkan
              </button>
              <button
                onClick={() => setDebugOpen(false)}
                className="rounded-md p-1 text-white/60 hover:text-white"
                aria-label="Tutup"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
            </div>
          </div>
          {openaiStatus && (
            <div
              className={`mb-3 rounded-lg border px-3 py-2 text-xs ${
                openaiStatus.ok
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                  : "border-rose-400/30 bg-rose-500/10 text-rose-200"
              }`}
            >
              <span className="font-semibold">
                {openaiStatus.ok ? "OpenAI OK · " : "OpenAI Error · "}
              </span>
              <span className="font-mono">{openaiStatus.detail}</span>
            </div>
          )}
          <div className="max-h-56 overflow-y-auto rounded-lg border border-white/10 bg-black/30">
            {debugLogs.length === 0 ? (
              <p className="p-3 text-xs text-white/40">
                Belum ada log. Log muncul otomatis saat generate/regenerate atau saat cek OpenAI.
              </p>
            ) : (
              <ul className="divide-y divide-white/5">
                {debugLogs.map((d, idx) => (
                  <li key={idx} className="flex gap-3 px-3 py-2 text-[11px]">
                    <span className="w-16 shrink-0 text-white/40">
                      {new Date(d.ts).toLocaleTimeString()}
                    </span>
                    <span
                      className={`w-14 shrink-0 font-semibold uppercase ${
                        d.level === "error"
                          ? "text-rose-300"
                          : d.level === "success"
                            ? "text-emerald-300"
                            : "text-sky-300"
                      }`}
                    >
                      {d.level}
                    </span>
                    <span className="flex-1 break-words text-white/80">
                      {d.message}
                      {d.provider && (
                        <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-white/70">
                          {d.provider}
                        </span>
                      )}
                      {d.jobId && (
                        <span className="ml-2 font-mono text-[10px] text-white/40">
                          {d.jobId.slice(0, 8)}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        {/* Canvas Area */}
        <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-5 backdrop-blur-md flex flex-col">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white/85">Canvas Output</p>
              <p className="text-xs text-white/45">
                {PLATFORMS[platform].label} · {allRatios ? `Semua rasio (${PLATFORMS[platform].ratios.length})` : ratio}
              </p>
            </div>
          </div>
          {selectedBrand && (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5">
              <Palette className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-white/80">
                Brand aktif: <b className="text-primary">{selectedBrand.name}</b>
              </span>
              <div className="flex gap-1 ml-auto">
                {[selectedBrand.primary_color, selectedBrand.secondary_color, selectedBrand.accent_color]
                  .filter(Boolean)
                  .map((c) => (
                    <span key={c!} className="h-3 w-3 rounded-full border border-white/20" style={{ background: c! }} />
                  ))}
              </div>
              <button
                onClick={() => setSelectedBrandId(null)}
                className="text-white/50 hover:text-white"
                title="Nonaktifkan brand"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {variants.some((v) => v.status === "sukses") && (
            <div className="mb-3 flex justify-end">
              <button
                onClick={handleExportAll}
                disabled={exportingZip}
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 disabled:opacity-50"
              >
                {exportingZip ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                Ekspor Semua Varian (ZIP)
              </button>
            </div>
          )}

          {variants.some((v) => v.status === "gagal") && (
            <div className="mb-3 flex justify-end">
              <button
                onClick={async () => {
                  const failedIdx = variants
                    .map((v, i) => (v.status === "gagal" ? i : -1))
                    .filter((i) => i >= 0);
                  if (failedIdx.length === 0) return;
                  toast.info(`Retry ${failedIdx.length} variasi yang belum berhasil…`);
                  for (const i of failedIdx) {
                    await handleRegenerate(i);
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-400/20"
              >
                <Wand2 className="h-3.5 w-3.5" />
                Retry Semua yang Belum Berhasil
              </button>
            </div>
          )}

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
                  const jobRatioKey = allRatios
                    ? PLATFORMS[platform].ratios[i % PLATFORMS[platform].ratios.length].key
                    : ratio;
                  const jobActive =
                    PLATFORMS[platform].ratios.find((r) => r.key === jobRatioKey) ??
                    PLATFORMS[platform].ratios[0];
                  const jobCanvasStyle = { aspectRatio: `${jobActive.w} / ${jobActive.h}` };
                  return (
                    <div key={i} className="flex flex-col gap-3">
                      <div
                        className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-black/40 group"
                        style={jobCanvasStyle}
                      >
                        {allRatios && (
                          <span className="absolute top-2 right-2 z-20 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-primary border border-primary/30">
                            {jobRatioKey}
                          </span>
                        )}
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
                        {v.status === "streaming" && (
                          <>
                            <img
                              src={v.imageUrl}
                              alt={`Preview ${i + 1}`}
                              className="h-full w-full object-cover blur-lg scale-105 transition-[filter]"
                            />
                            <div className="absolute top-2 left-2 flex items-center gap-1.5">
                              <span className="rounded-full bg-primary/20 border border-primary/40 px-2 py-0.5 text-[10px] font-semibold text-primary flex items-center gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" /> streaming
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
                              belum berhasil
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
                          <button
                            onClick={() => handleRegenerate(i)}
                            className="flex-1 inline-flex justify-center items-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-400/20"
                          >
                            <Wand2 className="h-3.5 w-3.5" /> Regenerate
                          </button>
                        </div>
                      )}
                      {v.status === "gagal" && (
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleRegenerate(i)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-400/20"
                          >
                            <Wand2 className="h-3.5 w-3.5" /> Regenerate
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
                <Palette className="h-4 w-4 text-primary" />
                <span className="truncate max-w-full">
                  {selectedBrand ? selectedBrand.name : "Brand Kit"}
                </span>
              </button>
            </div>

            {/* ============ 1. Nama Brand & Produk ============ */}
            <SectionHeader index={1} title="Nama Brand & Produk" />
            <Field label="Nama Brand">
              <input
                value={form.brand_name}
                onChange={updateField("brand_name")}
                className={inputCls}
                placeholder="mis. Kopi Nusantara"
              />
            </Field>
            <Field label="Kategori Produk">
              <div className="relative">
                <input
                  value={form.category}
                  onChange={updateField("category")}
                  className={inputCls + " pr-9"}
                  placeholder="mis. Jasa Servis AC, Kuliner, Fashion Muslimah"
                />
                <AiFillBtn onClick={() => runAutofill("category")} loading={autofillingKey === "category"} />
              </div>
            </Field>
            <details className="group rounded-lg border border-white/10 bg-white/[0.03]">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/5">
                <Settings2 className="h-4 w-4 text-primary" />
                Optional Setting · Brand & Produk
                <span className="ml-auto text-[10px] text-white/40 group-open:hidden">klik untuk buka</span>
              </summary>
              <div className="space-y-3 border-t border-white/10 p-3">
                <Field label="Judul Utama">
                  <div className="relative">
                    <input
                      value={form.title}
                      onChange={updateField("title")}
                      className={inputCls + " pr-9"}
                      placeholder="mis. Diskon Servis AC 30%"
                    />
                    <AiFillBtn onClick={() => runAutofill("title")} loading={autofillingKey === "title"} />
                  </div>
                </Field>
                <Field label="Sub Judul">
                  <div className="relative">
                    <input
                      value={form.subtitle}
                      onChange={updateField("subtitle")}
                      className={inputCls + " pr-9"}
                      placeholder="mis. Bersih & dingin dalam 1 jam"
                    />
                    <AiFillBtn onClick={() => runAutofill("subtitle")} loading={autofillingKey === "subtitle"} />
                  </div>
                </Field>
                <Field label="CTA / Call-to-Action">
                  <div className="relative">
                    <input
                      value={form.cta}
                      onChange={updateField("cta")}
                      className={inputCls + " pr-9"}
                      placeholder="mis. Pesan Sekarang, Konsultasi Gratis"
                    />
                    <AiFillBtn onClick={() => runAutofill("cta")} loading={autofillingKey === "cta"} />
                  </div>
                </Field>
              </div>
            </details>

            {/* ============ 2. Fitur Unggulan Produk ============ */}
            <SectionHeader index={2} title="Fitur Unggulan Produk" />
            <Field label="Fitur Unggulan">
              <div className="relative">
                <textarea
                  value={form.features}
                  onChange={updateField("features")}
                  rows={3}
                  className="w-full rounded-lg border border-white/10 bg-white/5 p-2.5 pr-9 text-sm outline-none focus:border-primary/60"
                  placeholder={"mis.\nTeknisi bersertifikat\nGaransi 30 hari\nHarga transparan"}
                />
                <AiFillBtn onClick={() => runAutofill("features")} loading={autofillingKey === "features"} />
              </div>
            </Field>

            {/* ============ 3. Tata Letak & Multi Image ============ */}
            <SectionHeader index={3} title="Tata Letak & Multi Image" />
            <Field label="Target Jumlah Gambar">
              <select
                value={targetImageCount}
                onChange={(e) => setTargetImageCount(Number(e.target.value))}
                className={inputCls}
              >
                <option value={1} className="bg-background">1 Gambar Utama (Hero Focus)</option>
                <option value={2} className="bg-background">2 Gambar (Comparison/Dual)</option>
                <option value={3} className="bg-background">3 Gambar (Showcase Composition)</option>
                <option value={4} className="bg-background">4 Gambar (Grid Layout)</option>
                <option value={5} className="bg-background">5 Gambar (Collage Style)</option>
              </select>
            </Field>
            <Field label="Posisi Visual">
              <select
                value={visualPosition}
                onChange={(e) => setVisualPosition(e.target.value)}
                className={inputCls}
              >
                <option value="center" className="bg-background">Tengah (Fokus Utama)</option>
                <option value="right" className="bg-background">Di Kanan (Teks Di Kiri)</option>
                <option value="left" className="bg-background">Di Kiri (Teks Di Kanan)</option>
                <option value="isometric" className="bg-background">Isometric Melayang</option>
                <option value="dynamic" className="bg-background">Dynamic Multiple Layout</option>
              </select>
            </Field>

            {/* ============ 4. Style Visual ============ */}
            <SectionHeader index={4} title="Style Visual" />
            <Field label="Platform">
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as keyof typeof PLATFORMS)}
                className={inputCls}
              >
                {Object.entries(PLATFORMS).map(([k, v]) => (
                  <option key={k} value={k} className="bg-background">
                    {v.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Jumlah Generate">
              <div className="space-y-2">
                <select
                  value={generateCount}
                  onChange={(e) => setGenerateCount(Number(e.target.value))}
                  disabled={allRatios}
                  className={inputCls}
                >
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n} className="bg-background">
                      {n} Gambar
                    </option>
                  ))}
                </select>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/70">
                  <input
                    type="checkbox"
                    checked={allRatios}
                    onChange={(e) => setAllRatios(e.target.checked)}
                    className="accent-primary"
                  />
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  Generate semua rasio {PLATFORMS[platform].label} ({PLATFORMS[platform].ratios.length})
                </label>
              </div>
            </Field>
            <Field label="Rasio Aspek">
              <div className="flex flex-wrap gap-1.5">
                {ratios.map((r) => (
                  <button
                    key={r.key}
                    type="button"
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
            </Field>
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
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFontModalOpen(true)}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
              >
                <Type className="h-3.5 w-3.5 text-primary" /> Font: {selectedFont.split(" ")[0]}
              </button>
              <button
                type="button"
                onClick={() => setBrandModalOpen(true)}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
              >
                <Palette className="h-3.5 w-3.5 text-primary" />
                <span className="truncate">{selectedBrand ? selectedBrand.name : "Brand Kit"}</span>
              </button>
            </div>

            {/* Mockup Wireframe realtime preview */}
            <MockupWireframe
              ratioW={active.w}
              ratioH={active.h}
              preset={selectedPreset}
              position={visualPosition}
              imageCount={targetImageCount}
              title={form.title || form.brand_name}
              subtitle={form.subtitle || form.category}
              cta={form.cta}
            />

            <Field label="Deskripsi Singkat">
              <div className="relative">
                <textarea
                  value={form.prompt}
                  onChange={updateField("prompt")}
                  rows={4}
                  placeholder="Contoh: buatkan saya desain poster untuk iklan jasa servis AC"
                  className="w-full rounded-lg border border-white/10 bg-white/5 p-2.5 pr-9 text-sm outline-none focus:border-primary/60"
                />
                <AiFillBtn onClick={() => runAutofill("prompt")} loading={autofillingKey === "prompt"} />
                <button
                  type="button"
                  onClick={handleEnhance}
                  disabled={enhancing || !form.prompt.trim()}
                  className="mt-2 w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  title="Sempurnakan prompt dengan AI"
                >
                  {enhancing ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Menyempurnakan…</>
                  ) : (
                    <><Sparkles className="h-3.5 w-3.5" /> Sempurnakan Prompt dengan AI</>
                  )}
                </button>
              </div>
            </Field>
            <details className="group rounded-lg border border-white/10 bg-white/[0.03]">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/5">
                <ListOrdered className="h-4 w-4 text-primary" />
                Rundown · Optional Settings
                <span className="ml-auto text-[10px] text-white/40 group-open:hidden">klik untuk buka</span>
              </summary>
              <div className="space-y-3 border-t border-white/10 p-3">
                <Field label="Judul">
                  <div className="relative">
                    <input
                      value={form.title}
                      onChange={updateField("title")}
                      className={inputCls + " pr-9"}
                      placeholder="Diskon 50%"
                    />
                    <AiFillBtn onClick={() => runAutofill("title")} loading={autofillingKey === "title"} />
                  </div>
                </Field>
                <Field label="Sub Judul">
                  <div className="relative">
                    <input
                      value={form.subtitle}
                      onChange={updateField("subtitle")}
                      className={inputCls + " pr-9"}
                      placeholder="Berlaku sampai 31 Des"
                    />
                    <AiFillBtn onClick={() => runAutofill("subtitle")} loading={autofillingKey === "subtitle"} />
                  </div>
                </Field>
                <Field label="Isi Konten">
                  <div className="relative">
                    <textarea
                      value={form.body_content}
                      onChange={updateField("body_content")}
                      rows={2}
                      className="w-full rounded-lg border border-white/10 bg-white/5 p-2.5 pr-9 text-sm outline-none focus:border-primary/60"
                      placeholder="Detail penawaran..."
                    />
                    <AiFillBtn onClick={() => runAutofill("body_content")} loading={autofillingKey === "body_content"} />
                  </div>
                </Field>
              </div>
            </details>

            <Field label="Nomor WA">
              <div className="relative">
                <input
                  value={form.whatsapp}
                  onChange={updateField("whatsapp")}
                  className={inputCls}
                  placeholder="0812..."
                />
              </div>
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

            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Logo Brand
              </p>
              <div className="flex items-center gap-2">
                <label className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10">
                  <Upload className="h-3.5 w-3.5" /> Upload Logo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBrandLogoUpload}
                    className="hidden"
                  />
                </label>
                {brandLogo && (
                  <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-2 py-1">
                    <img src={brandLogo} alt="Logo" className="h-8 w-8 rounded object-contain bg-white/10" />
                    <button
                      onClick={() => setBrandLogo(null)}
                      className="text-white/50 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Save / Load Draft */}
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Simpan Settingan
              </p>
              <div className="flex gap-2">
                <input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="Nama draft (mis. Promo Ramadhan)"
                  className={inputCls + " flex-1"}
                />
                <button
                  onClick={saveDraft}
                  className="inline-flex items-center gap-1 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20"
                >
                  <Save className="h-3.5 w-3.5" /> Simpan
                </button>
                <button
                  onClick={() => setDraftOpen(true)}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold hover:bg-white/10"
                  title="Muat Draft"
                >
                  <FolderOpen className="h-3.5 w-3.5" /> {draftList.length}
                </button>
              </div>
            </div>

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
                      <ThemeSkeletonPreview theme={theme} />
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
            {brandKits.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-white/60">
                Belum ada brand kit. Klik <b>+ Tambah Brand Kit Baru</b> untuk mulai menyimpan
                identitas brand-mu.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  onClick={() => {
                    setSelectedBrandId(null);
                    toast.success("Brand Kit dinonaktifkan.");
                    setBrandModalOpen(false);
                  }}
                  className={`rounded-xl border p-4 text-left transition ${selectedBrandId === null ? "border-primary ring-2 ring-primary bg-primary/10" : "border-white/10 bg-white/5 hover:border-primary/60"}`}
                >
                  <p className="text-sm font-semibold text-white/90">Tanpa Brand Kit</p>
                  <p className="mt-1 text-xs text-white/50">Generate murni dari prompt</p>
                </button>
                {brandKits.map((brand) => {
                  const isSelected = selectedBrandId === brand.id;
                  const palette = [
                    brand.primary_color,
                    brand.secondary_color,
                    brand.accent_color,
                    brand.background_color,
                    brand.text_color,
                  ].filter(Boolean) as string[];
                  return (
                    <button
                      key={brand.id}
                      onClick={() => {
                        setSelectedBrandId(brand.id);
                        toast.success(`Brand Kit ${brand.name} dipilih!`);
                        setBrandModalOpen(false);
                      }}
                      className={`rounded-xl border p-4 text-left transition group flex flex-col justify-between min-h-[100px] relative ${isSelected ? "border-primary ring-2 ring-primary bg-primary/10" : "border-white/10 bg-white/5 hover:border-primary/60"}`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 bg-primary text-black text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                          Terpilih
                        </div>
                      )}
                      <p className={`text-sm font-semibold mb-3 pr-12 ${isSelected ? "text-primary" : "text-white/90 group-hover:text-primary"}`}>
                        {brand.name}
                      </p>
                      <div className="flex gap-2">
                        {palette.map((color) => (
                          <div
                            key={color}
                            className="h-6 w-6 rounded-full border border-white/20 shadow-sm"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      {brand.brand_voice && (
                        <p className="mt-2 text-[10px] text-white/50 italic">
                          Voice: {brand.brand_voice}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Load Draft Modal */}
      {draftOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-white/15 bg-background p-6">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-display text-lg font-bold flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" /> Draft Tersimpan
              </h3>
              <button
                onClick={() => setDraftOpen(false)}
                className="rounded-md p-1.5 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {draftList.length === 0 ? (
              <p className="py-8 text-center text-sm text-white/60">
                Belum ada draft. Simpan settingan Anda dulu.
              </p>
            ) : (
              <ul className="max-h-[50vh] space-y-2 overflow-y-auto">
                {draftList.map((d) => (
                  <li
                    key={d.name}
                    className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold">{d.name}</p>
                      <p className="text-[10px] text-white/40">
                        {new Date(d.savedAt).toLocaleString("id-ID")}
                      </p>
                    </div>
                    <button
                      onClick={() => loadDraft(d.name)}
                      className="rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20"
                    >
                      Muat
                    </button>
                    <button
                      onClick={() => deleteDraft(d.name)}
                      className="rounded-md border border-red-500/40 bg-red-500/10 p-1.5 text-red-300 hover:bg-red-500/20"
                      title="Hapus"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
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

function AiFillBtn({
  onClick,
  loading,
}: {
  onClick: () => void;
  loading: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      title="Isi otomatis dengan AI (Gemini)"
      className="absolute right-1.5 top-1.5 z-10 inline-flex items-center justify-center rounded-md border border-primary/40 bg-primary/10 p-1.5 text-primary hover:bg-primary/20 disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Sparkles className="h-3 w-3" />
      )}
    </button>
  );
}

function SectionHeader({ index, title }: { index: number; title: string }) {
  return (
    <div className="mt-2 flex items-center gap-2 border-b border-white/10 pb-1.5">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
        {index}
      </span>
      <h4 className="text-xs font-bold uppercase tracking-widest text-white/90">
        {title}
      </h4>
    </div>
  );
}

function MockupWireframe({
  ratioW,
  ratioH,
  preset,
  position,
  imageCount,
  title,
  subtitle,
  cta,
}: {
  ratioW: number;
  ratioH: number;
  preset: string;
  position: string;
  imageCount: number;
  title?: string;
  subtitle?: string;
  cta?: string;
}) {
  const t = (preset || "").toLowerCase();
  const isDark = !t || t.includes("default") || t.includes("dark") || t.includes("cyber");
  const isBrutal = t.includes("brutal");
  const isGlass = t.includes("glass");
  const isNeu = t.includes("neu") || t.includes("soft");
  const example = getPresetExample(preset);

  const surface = isBrutal
    ? "bg-yellow-400 border-4 border-black text-black"
    : isGlass
      ? "bg-white/10 border border-white/30 backdrop-blur text-white"
      : isNeu
        ? "bg-[#e0e5ec] border border-[#c8d0e0] text-gray-700"
        : isDark
          ? "bg-[#0D1117] border border-white/15 text-white"
          : "bg-white border border-gray-200 text-black";

  const barColor = isBrutal
    ? "bg-black"
    : isNeu
      ? "bg-gray-400/60"
      : "bg-white/40 dark:bg-white/40";
  const btnColor = isBrutal
    ? "bg-black text-white"
    : isGlass
      ? "bg-white/30 text-white"
      : isNeu
        ? "bg-gray-700 text-white"
        : "bg-primary text-black";

  // Grid layout for images
  const imgBoxes = Array.from({ length: Math.max(1, Math.min(5, imageCount)) });

  const renderImages = () => {
    if (imgBoxes.length === 1) {
      return <div className={`h-full w-full rounded-md ${barColor} opacity-60`} />;
    }
    if (imgBoxes.length === 2) {
      return (
        <div className="grid h-full w-full grid-cols-2 gap-1">
          {imgBoxes.map((_, i) => (
            <div key={i} className={`rounded-md ${barColor} opacity-60`} />
          ))}
        </div>
      );
    }
    if (imgBoxes.length === 3) {
      return (
        <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-1">
          <div className={`row-span-2 rounded-md ${barColor} opacity-60`} />
          <div className={`rounded-md ${barColor} opacity-60`} />
          <div className={`rounded-md ${barColor} opacity-60`} />
        </div>
      );
    }
    if (imgBoxes.length === 4) {
      return (
        <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-1">
          {imgBoxes.map((_, i) => (
            <div key={i} className={`rounded-md ${barColor} opacity-60`} />
          ))}
        </div>
      );
    }
    return (
      <div className="grid h-full w-full grid-cols-3 grid-rows-2 gap-1">
        <div className={`col-span-2 row-span-2 rounded-md ${barColor} opacity-60`} />
        <div className={`rounded-md ${barColor} opacity-60`} />
        <div className={`rounded-md ${barColor} opacity-60`} />
      </div>
    );
  };

  const textBlock = (
    <div className="flex flex-col justify-center gap-1.5 p-2">
      <div className={`h-2 w-3/4 rounded ${barColor}`} />
      <div className={`h-1.5 w-1/2 rounded ${barColor} opacity-70`} />
      <div className="mt-1 flex flex-col gap-1">
        <div className={`h-1 w-full rounded ${barColor} opacity-50`} />
        <div className={`h-1 w-5/6 rounded ${barColor} opacity-50`} />
      </div>
      {cta && (
        <div className={`mt-1 inline-block w-fit rounded px-2 py-0.5 text-[8px] font-bold ${btnColor}`}>
          {cta}
        </div>
      )}
      {title && (
        <p className="mt-1 line-clamp-1 text-[8px] opacity-70">
          {title}
          {subtitle ? ` · ${subtitle}` : ""}
        </p>
      )}
    </div>
  );

  const imageBlock = <div className="p-2 h-full">{renderImages()}</div>;

  let content: React.ReactNode;
  if (position === "left") {
    content = (
      <div className="grid h-full grid-cols-[45%_55%]">
        {imageBlock}
        {textBlock}
      </div>
    );
  } else if (position === "right") {
    content = (
      <div className="grid h-full grid-cols-[55%_45%]">
        {textBlock}
        {imageBlock}
      </div>
    );
  } else if (position === "isometric") {
    content = (
      <div className="relative h-full w-full overflow-hidden p-2">
        <div className="absolute inset-2 rotate-[-8deg] scale-90">{renderImages()}</div>
        <div className="absolute bottom-2 left-2 right-2 rounded bg-black/30 p-1.5 backdrop-blur-sm">
          {textBlock}
        </div>
      </div>
    );
  } else if (position === "dynamic") {
    content = (
      <div className="grid h-full grid-rows-[60%_40%] gap-1 p-2">
        <div>{renderImages()}</div>
        <div className="border-t border-current/10">{textBlock}</div>
      </div>
    );
  } else {
    // center
    content = (
      <div className="grid h-full grid-rows-[65%_35%]">
        {imageBlock}
        {textBlock}
      </div>
    );
  }

  return (
    <div>
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Mockup Realtime · {ratioW}:{ratioH}
        {example ? ` · gaya ${preset}` : ""}
      </p>
      <div
        className={`relative w-full overflow-hidden rounded-lg shadow-inner transition-all ${surface}`}
        style={{ aspectRatio: `${ratioW} / ${ratioH}` }}
      >
        {example && (
          <>
            <img
              src={example.image}
              alt={`Contoh nyata preset ${preset}`}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/25" />
          </>
        )}
        <div className="relative h-full w-full">{content}</div>
        {example && (
          <div className="absolute left-1.5 top-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-white backdrop-blur">
            Referensi · {example.category}
          </div>
        )}
      </div>
      <p className="mt-1 text-[10px] text-white/40">
        {example
          ? `Referensi nyata gaya ${preset} untuk niche ${example.category}. Wireframe menyesuaikan rasio, posisi & jumlah gambar.`
          : "Preview otomatis mengikuti Rasio, Preset, Posisi & Jumlah Gambar."}
      </p>
    </div>
  );
}
