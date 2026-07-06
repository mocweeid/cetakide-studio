import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, useAppUser } from "@/components/app-shell";
import { toast } from "sonner";
import {
  UploadCloud,
  Instagram,
  Facebook,
  Youtube,
  Music2,
  CalendarClock,
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  X,
  Image as ImageIcon,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/auto-uploader")({
  head: () => ({
    meta: [{ title: "Auto Uploader — CetakIde" }, { name: "robots", content: "noindex" }],
  }),
  component: AutoUploaderPage,
});

type Platform = "instagram" | "facebook" | "youtube" | "tiktok";
type Scheduled = {
  id: string;
  platform: Platform;
  caption: string;
  media_url: string;
  scheduled_at: string;
  status: "queued" | "posted" | "failed";
};

const PLATFORMS: {
  id: Platform;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "facebook", label: "Facebook", icon: Facebook },
  { id: "youtube", label: "YouTube", icon: Youtube },
  { id: "tiktok", label: "TikTok", icon: Music2 },
];

function AutoUploaderPage() {
  const { user } = useAppUser();
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [caption, setCaption] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [queue, setQueue] = useState<Scheduled[]>([]);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);

  function addSchedule(e: React.FormEvent) {
    e.preventDefault();
    if (!caption.trim() || !mediaUrl.trim() || !scheduledAt) {
      toast.error("Lengkapi caption, media, dan waktu jadwal.");
      return;
    }
    // TODO(supabase): INSERT ke tabel scheduled_posts (user_id, platform, caption, media_url, scheduled_at, status)
    setQueue((q) => [
      {
        id: crypto.randomUUID(),
        platform,
        caption: caption.trim(),
        media_url: mediaUrl.trim(),
        scheduled_at: scheduledAt,
        status: "queued",
      },
      ...q,
    ]);
    toast.success("Jadwal posting berhasil ditambahkan.");
    setCaption("");
    setMediaUrl("");
    setScheduledAt("");
  }

  function remove(id: string) {
    // TODO(supabase): DELETE FROM scheduled_posts WHERE id = $1
    setQueue((q) => q.filter((s) => s.id !== id));
    toast.success("Jadwal dihapus.");
  }

  return (
    <AppShell
      title="Auto Uploader"
      subtitle="Jadwalkan posting otomatis ke sosial media"
      user={user}
    >
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <form
          onSubmit={addSchedule}
          className="rounded-2xl border border-white/15 bg-white/[0.04] p-5 backdrop-blur-md"
        >
          <h2 className="mb-4 flex items-center gap-2 font-display text-base font-semibold">
            <CalendarClock className="h-4 w-4 text-primary" /> Jadwalkan Baru
          </h2>

          <div className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Platform
            </p>
            <div className="grid grid-cols-4 gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlatform(p.id)}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-2.5 text-xs transition ${
                    platform === p.id
                      ? "border-primary/60 bg-primary/10 text-primary"
                      : "border-white/10 bg-white/[0.03] text-muted-foreground hover:bg-white/10"
                  }`}
                >
                  <p.icon className="h-4 w-4" />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                Pilih Gambar dari Project
              </label>
              <button
                type="button"
                onClick={() => setMediaModalOpen(true)}
                className="flex w-full items-center justify-between rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm text-left hover:border-primary focus:border-primary focus:outline-none transition"
              >
                {mediaUrl ? (
                  <span className="text-white truncate">{mediaUrl.split("/").pop()}</span>
                ) : (
                  <span className="text-muted-foreground">
                    -- Klik untuk memilih dari Galeri --
                  </span>
                )}
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              </button>
              {mediaUrl && (
                <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/40 max-w-[200px]">
                  <img
                    src={mediaUrl}
                    alt="Preview"
                    className="w-full h-auto aspect-square object-cover"
                  />
                </div>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                Caption
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                placeholder="Tulis caption..."
                className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                Waktu Posting
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg gradient-gold py-2.5 text-sm font-semibold text-black"
          >
            <Plus className="h-4 w-4" /> Tambah Jadwal
          </button>
        </form>

        <div className="rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-white/10 p-5">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold">
              <UploadCloud className="h-4 w-4 text-primary" /> Antrian Jadwal
            </h2>
            <span className="text-xs text-muted-foreground">{queue.length} item</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Platform</th>
                  <th className="px-4 py-3 text-left">Caption</th>
                  <th className="px-4 py-3 text-left">Jadwal</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {queue.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                      Belum ada jadwal. Tambahkan pertama Anda di panel kiri.
                    </td>
                  </tr>
                )}
                {queue.map((s) => {
                  const P = PLATFORMS.find((p) => p.id === s.platform)!;
                  return (
                    <tr key={s.id} className="border-t border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs">
                          <P.icon className="h-3 w-3" /> {P.label}
                        </span>
                      </td>
                      <td className="max-w-[280px] truncate px-4 py-3">{s.caption}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(s.scheduled_at).toLocaleString("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        {s.status === "queued" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-2 py-0.5 text-xs text-yellow-400">
                            <Clock className="h-3 w-3" /> Queued
                          </span>
                        )}
                        {s.status === "posted" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-xs text-green-400">
                            <CheckCircle2 className="h-3 w-3" /> Posted
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => remove(s.id)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary/15 hover:text-secondary"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {mediaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl border border-white/15 bg-background p-6">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="font-display text-xl font-bold flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" /> Pilih Gambar dari Project
              </h3>
              <button
                onClick={() => setMediaModalOpen(false)}
                className="rounded-md p-1.5 hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
              {Array.from({ length: 8 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setMediaUrl(`/assets/feed-ig/ig-${i + 1}.png`);
                    setMediaModalOpen(false);
                  }}
                  className="shrink-0 w-[140px] sm:w-[160px] snap-start group relative overflow-hidden rounded-lg border border-white/10 hover:border-primary/60 transition"
                >
                  <img
                    src={`/assets/feed-ig/ig-${i + 1}.png`}
                    alt={`Template ${i + 1}`}
                    className="aspect-square w-full object-cover transition group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 text-xs text-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    Pilih Gambar
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
