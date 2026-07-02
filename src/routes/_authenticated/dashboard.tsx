import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, useAppUser } from "@/components/app-shell";
import {
  Wallet,
  Check,
  X,
  AlertTriangle,
  MessageCircle,
  Sparkles,
  Wand2,
  TrendingUp,
  Crown,
  PlusCircle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — CetakIde" },
      {
        name: "description",
        content: "Workspace CetakIde untuk generate banner, thumbnail, dan logo.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

const ASPECT_MAP: Record<
  Exclude<Platform, "history">,
  { label: string; ratios: { key: string; w: number; h: number }[] }
> = {
  instagram: {
    label: "Instagram",
    ratios: [
      { key: "1:1", w: 1, h: 1 },
      { key: "9:16", w: 9, h: 16 },
    ],
  },
  facebook: {
    label: "Facebook Ads",
    ratios: [
      { key: "4:5", w: 4, h: 5 },
      { key: "1:1", w: 1, h: 1 },
    ],
  },
  youtube: {
    label: "YouTube",
    ratios: [
      { key: "16:9", w: 16, h: 9 },
      { key: "9:16", w: 9, h: 16 },
    ],
  },
};

type Project = {
  id: string;
  kebutuhan: string;
  image_url: string | null;
  aspect_ratio: string;
  platform: string;
  status: "sukses" | "error" | "partial";
  created_at: string;
};

function Dashboard() {
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [ratio, setRatio] = useState("1:1");
  const [prompt, setPrompt] = useState("");
  const [saldo, setSaldo] = useState<number>(0);
  const [username, setUsername] = useState<string>("");
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [toggles, setToggles] = useState({
    autoLayout: true,
    shadow: true,
    reflection: false,
    hd: true,
  });

  // Load profile + role + history
  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return;

      const [{ data: profile }, { data: roles }, { data: proj }] = await Promise.all([
        supabase.from("profiles").select("saldo, username").eq("id", uid).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", uid),
        supabase
          .from("projects")
          .select("*")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(30),
      ]);

      if (profile) {
        setSaldo(profile.saldo ?? 0);
        setUsername(profile.username ?? "");
      }
      setIsDeveloper(!!roles?.some((r: { role: string }) => r.role === "developer"));
      setProjects((proj ?? []) as Project[]);
    })();
  }, []);

  useEffect(() => {
    if (platform === "history") return;
    setRatio(ASPECT_MAP[platform].ratios[0].key);
  }, [platform]);

  const currentRatios = platform !== "history" ? ASPECT_MAP[platform].ratios : [];
  const activeRatio = currentRatios.find((r) => r.key === ratio) ?? currentRatios[0];

  const canvasStyle = useMemo(() => {
    if (!activeRatio) return {};
    return { aspectRatio: `${activeRatio.w} / ${activeRatio.h}` };
  }, [activeRatio]);

  async function handleGenerate() {
    if (!prompt.trim()) {
      toast.error("Isi dulu deskripsi visualnya.");
      return;
    }
    setGenerating(true);
    try {
      const { data: ok, error } = await supabase.rpc("potong_saldo_generate");
      if (error) throw error;
      if (!ok) {
        toast.error("Saldo tidak mencukupi!", { description: "Isi ulang untuk melanjutkan." });
        setGenerating(false);
        return;
      }

      // 2s glassmorphic loader simulation
      await new Promise((r) => setTimeout(r, 2000));

      const stockPool = [
        "https://pintardigital.b-cdn.net/Banner/banner-14.webp",
        "https://pintardigital.b-cdn.net/reel/reel-1.webp",
        "https://pintardigital.b-cdn.net/Banner/YT/YT-Thumb-5.webp",
        "https://ptrdigital.web.id/storage/uploads/1780651645_logo-7.webp",
      ];
      const image_url = stockPool[Math.floor(Math.random() * stockPool.length)];

      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user!.id;

      const insertPayload = {
        user_id: uid,
        kebutuhan: prompt.slice(0, 120),
        prompt,
        image_url,
        aspect_ratio: ratio,
        platform: platform === "history" ? "instagram" : platform,
        status: "sukses" as const,
      };
      const { data: inserted, error: insErr } = await supabase
        .from("projects")
        .insert(insertPayload)
        .select()
        .single();
      if (insErr) throw insErr;

      setProjects((p) => [inserted as Project, ...p]);
      if (!isDeveloper) setSaldo((s) => Math.max(0, s - 1000));
      toast.success("Visual berhasil di-cetak!");
      setPrompt("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generate gagal");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 md:flex-row">
        <DashboardSidebar active={platform} onSelect={setPlatform} isDeveloper={isDeveloper} />

        <main className="flex-1 space-y-4">
          {/* Top bar */}
          <div className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3">
            <div>
              <p className="text-xs text-muted-foreground">Halo,</p>
              <p className="font-semibold">{username || "user"}</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              <Wallet className="h-4 w-4" />
              💳 Saldo: Rp {saldo.toLocaleString("id-ID")}
              {isDeveloper && (
                <span className="ml-2 rounded-full bg-primary/30 px-2 py-0.5 text-[10px] uppercase">
                  ∞ Dev
                </span>
              )}
            </div>
          </div>

          {platform !== "history" ? (
            <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
              {/* Canvas */}
              <div className="glass-panel-strong rounded-2xl p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-display text-lg font-semibold">
                    Canvas {ASPECT_MAP[platform].label} • {ratio}
                  </h2>
                  <div className="flex gap-1.5">
                    {currentRatios.map((r) => (
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

                <div className="relative mx-auto flex max-w-lg items-center justify-center">
                  <div
                    className="glass-panel relative w-full overflow-hidden rounded-xl"
                    style={canvasStyle}
                  >
                    {projects[0]?.image_url ? (
                      <img
                        src={projects[0].image_url}
                        alt="Latest"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                        <Sparkles className="mr-2 h-4 w-4" /> Canvas siap dicetak
                      </div>
                    )}

                    {generating && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/60 backdrop-blur-md">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm font-medium">Mencetak ide...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="glass-panel-strong space-y-4 rounded-2xl p-5">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Deskripsi Visual
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    placeholder="Contoh: Banner promo kopi susu, warna coklat gold, teks 'Diskon 50%'"
                    className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-sm outline-none focus:border-primary/60"
                  />
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Enhancer
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {(
                      [
                        ["autoLayout", "Auto Layout"],
                        ["shadow", "Shadow Depth"],
                        ["reflection", "Reflection"],
                        ["hd", "HD Output"],
                      ] as const
                    ).map(([key, label]) => (
                      <label
                        key={key}
                        className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 transition ${
                          toggles[key]
                            ? "border-primary/50 bg-primary/10 text-primary"
                            : "border-white/10 bg-white/5 text-muted-foreground"
                        }`}
                      >
                        {label}
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={toggles[key]}
                          onChange={(e) => setToggles((t) => ({ ...t, [key]: e.target.checked }))}
                        />
                        <span
                          className={`ml-2 inline-block h-2 w-2 rounded-full ${toggles[key] ? "bg-primary" : "bg-muted-foreground/40"}`}
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="glow-gold flex w-full items-center justify-center gap-2 rounded-lg gradient-gold py-3 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-60"
                >
                  {generating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  Cetak Ide Sekarang
                </button>
                <p className="text-center text-[11px] text-muted-foreground">
                  {isDeveloper ? "God Mode — gratis" : "Setiap generate potong Rp 1.000"}
                </p>
              </div>
            </div>
          ) : (
            <HistoryTable items={projects} />
          )}
        </main>
      </div>
    </div>
  );
}

function HistoryTable({ items }: { items: Project[] }) {
  return (
    <div className="glass-panel-strong overflow-hidden rounded-2xl">
      <div className="border-b border-white/10 p-5">
        <h2 className="font-display text-lg font-semibold">Riwayat Proses</h2>
        <p className="text-xs text-muted-foreground">Semua generate visualmu.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Tanggal</th>
              <th className="px-4 py-3 text-left">Kebutuhan</th>
              <th className="px-4 py-3 text-left">Platform</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  Belum ada riwayat. Mulai cetak ide pertamamu!
                </td>
              </tr>
            )}
            {items.map((p) => (
              <tr key={p.id} className="border-t border-white/5 hover:bg-white/5">
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(p.created_at).toLocaleString("id-ID", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </td>
                <td className="px-4 py-3">{p.kebutuhan}</td>
                <td className="px-4 py-3 capitalize text-muted-foreground">
                  {p.platform} • {p.aspect_ratio}
                </td>
                <td className="px-4 py-3">
                  {p.status === "sukses" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs text-green-400">
                      <Check className="h-3 w-3" /> Sukses
                    </span>
                  )}
                  {p.status === "error" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary/15 px-2.5 py-0.5 text-xs text-secondary">
                      <X className="h-3 w-3" /> Error
                    </span>
                  )}
                  {p.status === "partial" && (
                    <span className="inline-flex items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-2.5 py-0.5 text-yellow-400">
                        <AlertTriangle className="h-3 w-3" /> Partial
                      </span>
                      <a
                        href="https://wa.me/6288975958005"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-primary hover:bg-primary/25"
                      >
                        <MessageCircle className="h-3 w-3" /> Kontak Admin
                      </a>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
