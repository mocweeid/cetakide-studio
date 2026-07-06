import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, useAppUser } from "@/components/app-shell";
import {
  Link2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/social-accounts")({
  head: () => ({
    meta: [{ title: "Akun Sosial Media — Cetak Ide" }, { name: "robots", content: "noindex" }],
  }),
  component: SocialAccountsPage,
});

const PLATFORMS = [
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    color: "#E1306C",
    bg: "#E1306C11",
    connected: true,
    username: "@toko.sneaker.id",
    followers: "12.4K",
    lastSync: "2 menit lalu",
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: Facebook,
    color: "#1877F2",
    bg: "#1877F211",
    connected: true,
    username: "Sneaker Studio Indonesia",
    followers: "8.2K",
    lastSync: "1 jam lalu",
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: Youtube,
    color: "#FF0000",
    bg: "#FF000011",
    connected: false,
    username: null,
    followers: null,
    lastSync: null,
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: ShoppingBag,
    color: "#010101",
    bg: "#66666611",
    connected: false,
    username: null,
    followers: null,
    lastSync: null,
  },
  {
    id: "twitter",
    name: "X (Twitter)",
    icon: Twitter,
    color: "#1DA1F2",
    bg: "#1DA1F211",
    connected: false,
    username: null,
    followers: null,
    lastSync: null,
  },
];

const PUBLISH_QUEUE = [
  {
    id: "1",
    title: "Flash sale sneakers",
    platform: "Instagram",
    scheduled: "Hari ini, 19:00",
    status: "scheduled",
  },
  {
    id: "2",
    title: "Promo akhir pekan",
    platform: "Facebook",
    scheduled: "Besok, 08:00",
    status: "scheduled",
  },
  {
    id: "3",
    title: "Behind the scenes",
    platform: "Instagram",
    scheduled: "Rabu, 12:00",
    status: "draft",
  },
];

function SocialAccountsPage() {
  const { user } = useAppUser();
  const [platforms, setPlatforms] = useState(PLATFORMS);

  function handleConnect(id: string) {
    toast.info(`Mengarahkan ke halaman otorisasi ${id}...`);
    setTimeout(() => {
      setPlatforms((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                connected: true,
                username: "@akun.baru",
                followers: "0",
                lastSync: "Baru saja",
              }
            : p,
        ),
      );
      toast.success(`${id} berhasil terhubung!`);
    }, 1500);
  }

  function handleDisconnect(id: string) {
    setPlatforms((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, connected: false, username: null, followers: null, lastSync: null }
          : p,
      ),
    );
    toast.success("Akun berhasil diputus.");
  }

  function handleSync(id: string) {
    toast.success(`Sinkronisasi ${id} dimulai...`);
  }

  const connectedCount = platforms.filter((p) => p.connected).length;

  return (
    <AppShell
      title="Akun Sosial Media"
      subtitle="Hubungkan dan kelola akun media sosial Anda"
      user={user}
    >
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Platform Terhubung", value: `${connectedCount}/${platforms.length}` },
            { label: "Total Pengikut", value: "20.6K" },
            { label: "Antrian Publish", value: PUBLISH_QUEUE.length.toString() },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 sm:p-4 text-center backdrop-blur-md"
            >
              <p className="font-display text-xl sm:text-2xl font-bold text-primary">{value}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Platform Cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {platforms.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border backdrop-blur-md p-5 transition"
              style={{
                borderColor: p.connected ? p.color + "44" : "rgba(255,255,255,0.1)",
                background: p.connected ? p.bg : "rgba(255,255,255,0.04)",
              }}
            >
              {/* Platform Header */}
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: p.color + "22" }}
                  >
                    <p.icon className="h-5 w-5" style={{ color: p.color }} />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.connected ? p.username : "Belum terhubung"}
                    </p>
                  </div>
                </div>
                {p.connected ? (
                  <span className="flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-semibold text-green-400">
                    <CheckCircle2 className="h-3 w-3" /> Aktif
                  </span>
                ) : (
                  <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/50">
                    <XCircle className="h-3 w-3" /> Tidak Aktif
                  </span>
                )}
              </div>

              {/* Stats if connected */}
              {p.connected && p.followers && (
                <div className="mb-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-white/5 p-2.5 text-center">
                    <p className="text-sm font-bold text-white">{p.followers}</p>
                    <p className="text-[10px] text-muted-foreground">Pengikut</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-2.5 text-center">
                    <p className="text-xs font-medium text-white">{p.lastSync}</p>
                    <p className="text-[10px] text-muted-foreground">Sync terakhir</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {p.connected ? (
                  <>
                    <button
                      onClick={() => handleSync(p.id)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 py-2.5 text-xs text-white/70 hover:bg-white/10 hover:text-white"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Sinkronkan
                    </button>
                    <button
                      onClick={() => handleDisconnect(p.id)}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 px-3 py-2.5 text-xs text-red-400 hover:bg-red-500/10"
                    >
                      Putus
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleConnect(p.id)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold text-black transition hover:brightness-110"
                    style={{ background: `linear-gradient(135deg, ${p.color}, ${p.color}cc)` }}
                  >
                    <Link2 className="h-3.5 w-3.5" /> Hubungkan {p.name}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Publish Queue */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-6 backdrop-blur-md">
          <h3 className="mb-4 font-display text-sm font-semibold">Antrian Publikasi</h3>
          {PUBLISH_QUEUE.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Tidak ada konten dalam antrian
            </p>
          ) : (
            <div className="space-y-2">
              {PUBLISH_QUEUE.map((q) => (
                <div key={q.id} className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                    {q.platform === "Instagram" ? (
                      <Instagram className="h-4 w-4 text-[#E1306C]" />
                    ) : (
                      <Facebook className="h-4 w-4 text-[#1877F2]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{q.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {q.platform} · {q.scheduled}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${q.status === "scheduled" ? "bg-primary/20 text-primary" : "bg-white/10 text-white/50"}`}
                  >
                    {q.status === "scheduled" ? "Terjadwal" : "Draft"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
