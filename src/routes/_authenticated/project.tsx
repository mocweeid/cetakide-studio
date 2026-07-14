import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, useAppUser } from "@/components/app-shell";
import {
  FolderKanban,
  Plus,
  Download,
  Trash2,
  Search,
  Filter,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/project")({
  head: () => ({
    meta: [{ title: "Project — Cetak Ide" }, { name: "robots", content: "noindex" }],
  }),
  component: ProjectPage,
});

type Project = {
  id: string;
  kebutuhan: string;
  image_url: string | null;
  platform: string;
  aspect_ratio: string;
  status: string;
  created_at: string;
  provider?: string | null;
  primary_provider?: string | null;
  fallback_used?: boolean | null;
  request_id?: string | null;
};

const MOCK_PROJECTS: Project[] = [
  {
    id: "m1",
    kebutuhan: "Banner sneakers premium hitam gold luxury edition",
    image_url: "https://placehold.co/400x400/0a0a0a/EAB308?text=Sneaker+01",
    platform: "Instagram",
    aspect_ratio: "1:1",
    status: "sukses",
    created_at: "2026-07-03T10:00:00Z",
  },
  {
    id: "m2",
    kebutuhan: "Story flash sale fashion wanita summer collection",
    image_url: "/assets/kategori/fashion/fashion-8.webp",
    platform: "Instagram",
    aspect_ratio: "9:16",
    status: "sukses",
    created_at: "2026-07-02T14:00:00Z",
  },
  {
    id: "m3",
    kebutuhan: "Banner promo weekend restoran padang",
    image_url: "https://placehold.co/600x315/141414/EAB308?text=FB+Ads",
    platform: "Facebook",
    aspect_ratio: "1.91:1",
    status: "sukses",
    created_at: "2026-07-01T09:00:00Z",
  },
  {
    id: "m4",
    kebutuhan: "Thumbnail YouTube review laptop gaming terbaru",
    image_url: "https://placehold.co/640x360/181818/EAB308?text=YT+Thumb",
    platform: "YouTube",
    aspect_ratio: "16:9",
    status: "sukses",
    created_at: "2026-06-30T20:00:00Z",
  },
  {
    id: "m5",
    kebutuhan: "Banner marketplace Shopee campaign 7.7",
    image_url: "https://placehold.co/400x400/0f0f0f/EAB308?text=Shopee",
    platform: "Marketplace",
    aspect_ratio: "1:1",
    status: "gagal",
    created_at: "2026-06-29T16:00:00Z",
  },
  {
    id: "m6",
    kebutuhan: "Konten feed kuliner artisanal coffee shop",
    image_url: "/assets/kategori/kuliner/kuliner-1.webp",
    platform: "Instagram",
    aspect_ratio: "4:5",
    status: "sukses",
    created_at: "2026-06-28T11:00:00Z",
  },
  {
    id: "m7",
    kebutuhan: "Iklan properti residensial premium BSD City",
    image_url: null,
    platform: "Facebook",
    aspect_ratio: "1.91:1",
    status: "proses",
    created_at: "2026-06-27T08:00:00Z",
  },
  {
    id: "m8",
    kebutuhan: "Banner promo skincare natural glowing",
    image_url: "https://placehold.co/400x400/141414/EAB308?text=Skincare",
    platform: "Instagram",
    aspect_ratio: "1:1",
    status: "sukses",
    created_at: "2026-06-26T15:00:00Z",
  },
];

type StatusKey = "sukses" | "gagal" | "partial" | "proses";

const STATUS_META: Record<
  StatusKey,
  {
    label: string;
    icon: typeof CheckCircle2;
    text: string;
    bg: string;
    ring: string;
    dot: string;
    accent: string;
  }
> = {
  sukses: {
    label: "Sukses",
    icon: CheckCircle2,
    text: "text-emerald-300",
    bg: "bg-emerald-500/15",
    ring: "ring-emerald-400/30",
    dot: "bg-emerald-400",
    accent: "bg-emerald-400",
  },
  gagal: {
    label: "Gagal",
    icon: XCircle,
    text: "text-rose-300",
    bg: "bg-rose-500/15",
    ring: "ring-rose-400/30",
    dot: "bg-rose-400",
    accent: "bg-rose-400",
  },
  partial: {
    label: "Partial",
    icon: AlertTriangle,
    text: "text-amber-300",
    bg: "bg-amber-500/15",
    ring: "ring-amber-400/30",
    dot: "bg-amber-400",
    accent: "bg-amber-400",
  },
  proses: {
    label: "Proses",
    icon: Loader2,
    text: "text-sky-300",
    bg: "bg-sky-500/15",
    ring: "ring-sky-400/30",
    dot: "bg-sky-400",
    accent: "bg-sky-400",
  },
};

function normalizeStatus(status: string): StatusKey {
  const s = (status || "").toLowerCase();
  if (s === "sukses" || s === "success") return "sukses";
  if (s === "gagal" || s === "failed" || s === "error") return "gagal";
  if (s === "partial" || s === "sebagian") return "partial";
  return "proses";
}

function StatusBadge({ status, size = "sm" }: { status: string; size?: "sm" | "md" }) {
  const key = normalizeStatus(status);
  const meta = STATUS_META[key];
  const Icon = meta.icon;
  const pad = size === "md" ? "px-2.5 py-1 text-[11px]" : "px-2 py-0.5 text-[10px]";
  const iconSize = size === "md" ? "h-3.5 w-3.5" : "h-3 w-3";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 backdrop-blur-sm ${pad} ${meta.bg} ${meta.text} ${meta.ring}`}
    >
      <Icon className={`${iconSize} ${key === "proses" ? "animate-spin" : ""}`} />
      {meta.label}
    </span>
  );
}

function ProjectPage() {
  const { user } = useAppUser();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [lightbox, setLightbox] = useState<Project | null>(null);

  async function downloadPoster(project: Project) {
    if (!project.image_url) return;
    const safeName =
      (project.kebutuhan || "poster")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) || "poster";
    const ext = (project.image_url.split("?")[0].split(".").pop() || "jpg").slice(0, 5);
    const filename = `cetakide-${safeName}-${project.id.slice(0, 6)}.${ext}`;
    const tid = toast.loading("Mengunduh poster…");
    try {
      const res = await fetch(project.image_url, { mode: "cors" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("Poster berhasil diunduh.", { id: tid });
    } catch (err) {
      // Fallback: open in new tab so user can save manually
      window.open(project.image_url, "_blank", "noopener");
      toast.error("Unduhan langsung diblokir — file dibuka di tab baru.", { id: tid });
    }
  }

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [lightbox]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setProjects((data as Project[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  const displayProjects = projects.length > 0 ? projects : MOCK_PROJECTS;
  const filtered = displayProjects.filter((p) => {
    const matchStatus = filterStatus === "Semua" || p.status === filterStatus.toLowerCase();
    const matchSearch =
      !search ||
      p.kebutuhan.toLowerCase().includes(search.toLowerCase()) ||
      p.platform.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  async function deleteProject(id: string) {
    if (projects.length > 0) {
      await supabase.from("projects").delete().eq("id", id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } else {
      setProjects([]);
    }
    toast.success("Project berhasil dihapus.");
  }

  const statusCounts = {
    sukses: displayProjects.filter((p) => p.status === "sukses").length,
    gagal: displayProjects.filter((p) => p.status === "gagal").length,
    proses: displayProjects.filter((p) => p.status === "proses").length,
  };

  return (
    <AppShell title="Project" subtitle="Semua visual yang pernah Anda generate" user={user}>
      <div className="space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Project", value: displayProjects.length.toString() },
            { label: "Sukses", value: statusCounts.sukses.toString(), color: "#10b981" },
            { label: "Gagal", value: statusCounts.gagal.toString(), color: "#ef4444" },
            { label: "Proses", value: statusCounts.proses.toString(), color: "#f59e0b" },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 sm:p-4 text-center backdrop-blur-md"
            >
              <p
                className="font-display text-xl sm:text-2xl font-bold"
                style={color ? { color } : { color: "#EAB308" }}
              >
                {value}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari berdasarkan deskripsi atau platform..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-9 pr-4 text-sm placeholder:text-white/30 focus:border-primary/50 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            {(["Semua", "Sukses", "Partial", "Gagal", "Proses"] as const).map((s) => {
              const active = filterStatus === s;
              const key = s === "Semua" ? null : normalizeStatus(s);
              const dot = key ? STATUS_META[key].dot : "bg-white/40";
              return (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${active ? "border-primary bg-primary/20 text-primary" : "border-white/10 text-white/60 hover:border-white/30 hover:text-white"}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                  {s}
                </button>
              );
            })}
            <button
              onClick={() => navigate({ to: "/workspace" })}
              className="flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-black transition hover:brightness-110"
              style={{ background: "linear-gradient(135deg, #EAB308, #CA8A04)" }}
            >
              <Plus className="h-3.5 w-3.5" /> Baru
            </button>
          </div>
        </div>

        {/* Project Grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] py-16 text-center">
            <FolderKanban className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-sm font-medium text-white/80 mb-2">Belum ada project</p>
            <p className="text-xs text-muted-foreground mb-4">
              Mulai generate visual pertama Anda sekarang!
            </p>
            <button
              onClick={() => navigate({ to: "/workspace" })}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-black"
              style={{ background: "linear-gradient(135deg, #EAB308, #CA8A04)" }}
            >
              <Plus className="h-4 w-4" /> Generate Visual Baru
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filtered.map((project) => (
              <div
                key={project.id}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]"
              >
                {/* Accent stripe by status */}
                <div
                  className={`absolute left-0 top-0 z-10 h-full w-1 ${STATUS_META[normalizeStatus(project.status)].accent}`}
                />
                {/* Persistent status badge (always visible) */}
                <div className="absolute left-2 top-2 z-10">
                  <StatusBadge status={project.status} />
                </div>
                {/* Image */}
                <div className="relative aspect-square overflow-hidden">
                  {project.image_url ? (
                    <img
                      src={project.image_url}
                      alt={project.kebutuhan}
                      onClick={() => setLightbox(project)}
                      className="h-full w-full cursor-zoom-in object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-white/5">
                      <ImageIcon className="h-8 w-8 text-white/20" />
                    </div>
                  )}
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100 p-2.5">
                    <div className="flex justify-end gap-1">
                      {project.image_url && project.status === "sukses" && (
                        <button
                          onClick={() => downloadPoster(project)}
                          title="Unduh poster"
                          className="rounded-lg bg-white/20 p-1.5 text-white hover:bg-white/30"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteProject(project.id)}
                        className="rounded-lg bg-red-500/30 p-1.5 text-red-300 hover:bg-red-500/50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div />
                  </div>
                </div>
                {/* Info */}
                <div className="p-2.5">
                  <p className="truncate text-[11px] font-medium text-white/90">
                    {project.kebutuhan}
                  </p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[9px] text-muted-foreground">{project.platform}</span>
                    <span className="text-[9px] text-muted-foreground">{project.aspect_ratio}</span>
                  </div>
                  <p className="mt-0.5 text-[9px] text-muted-foreground">
                    {new Date(project.created_at).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {lightbox && lightbox.image_url && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightbox(null);
            }}
            aria-label="Tutup"
            className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20"
          >
            <X className="h-4 w-4" /> Tutup
          </button>
          <div
            className="relative flex max-h-full max-w-full flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightbox.image_url}
              alt={lightbox.kebutuhan}
              className="max-h-[85vh] max-w-[92vw] rounded-xl object-contain shadow-2xl"
            />
            <div className="flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-xs text-white/80 ring-1 ring-white/10">
              <span className="truncate max-w-[60vw]">{lightbox.kebutuhan}</span>
              <span className="text-white/40">·</span>
              <span>{lightbox.platform}</span>
              <span className="text-white/40">·</span>
              <span>{lightbox.aspect_ratio}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  downloadPoster(lightbox);
                }}
                className="ml-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 font-semibold text-white hover:bg-white/25"
              >
                <Download className="h-3 w-3" /> Unduh
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
