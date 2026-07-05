import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell, useAppUser } from "@/components/app-shell";
import {
  Server,
  Wifi,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Zap,
  Database,
  Shield,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/system-logs")({
  head: () => ({
    meta: [{ title: "System Logs — CetakIde Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: SystemLogsPage,
});

const SYSTEM_LOGS = [
  {
    id: "1",
    level: "info",
    message: "API generate berhasil diproses untuk user wildan_dev",
    service: "ai-engine",
    ts: "2026-07-03T14:32:00Z",
  },
  {
    id: "2",
    level: "info",
    message: "Top up pembayaran dikonfirmasi: INV-2026-0044",
    service: "billing",
    ts: "2026-07-03T14:15:00Z",
  },
  {
    id: "3",
    level: "warn",
    message: "Response time AI engine > 5s untuk user budi_kreasi",
    service: "ai-engine",
    ts: "2026-07-03T13:45:00Z",
  },
  {
    id: "4",
    level: "error",
    message: "Gagal terhubung ke provider AI [timeout after 30s]",
    service: "ai-engine",
    ts: "2026-07-03T12:00:00Z",
  },
  {
    id: "5",
    level: "info",
    message: "Cache dibersihkan — Redis: 1.2GB freed",
    service: "cache",
    ts: "2026-07-03T10:00:00Z",
  },
  {
    id: "6",
    level: "info",
    message: "User baru mendaftar: siti_design@gmail.com",
    service: "auth",
    ts: "2026-07-03T09:30:00Z",
  },
  {
    id: "7",
    level: "warn",
    message: "Storage bucket mendekati 80% kapasitas",
    service: "storage",
    ts: "2026-07-02T22:00:00Z",
  },
  {
    id: "8",
    level: "error",
    message: "Webhook kirim gagal ke https://crm.example.com/webhook [HTTP 503]",
    service: "webhook",
    ts: "2026-07-02T20:10:00Z",
  },
  {
    id: "9",
    level: "info",
    message: "Batch generate 20 visual selesai untuk user andi_produk",
    service: "ai-engine",
    ts: "2026-07-02T18:00:00Z",
  },
  {
    id: "10",
    level: "info",
    message: "Backup database harian selesai — 2.4GB",
    service: "database",
    ts: "2026-07-02T03:00:00Z",
  },
];

function SystemLogsPage() {
  const { user } = useAppUser();
  const [filter, setFilter] = useState("Semua");
  const [isLive, setIsLive] = useState(false);
  const [pulse, setPulse] = useState(false);

  // Simulate live pulse
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => setPulse((p) => !p), 1000);
    return () => clearInterval(interval);
  }, [isLive]);

  if (!user?.isDeveloper) {
    return (
      <AppShell title="System Logs" subtitle="Admin Only" user={user}>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/5 py-16 text-center">
          <AlertTriangle className="mb-4 h-12 w-12 text-red-400" />
          <h3 className="font-display text-lg font-bold text-red-400">Akses Ditolak</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Halaman ini hanya dapat diakses oleh Developer.
          </p>
        </div>
      </AppShell>
    );
  }

  const filtered = SYSTEM_LOGS.filter(
    (l) => filter === "Semua" || l.level === filter.toLowerCase(),
  );
  const errorCount = SYSTEM_LOGS.filter((l) => l.level === "error").length;
  const warnCount = SYSTEM_LOGS.filter((l) => l.level === "warn").length;

  function getLevelBadge(level: string) {
    if (level === "error")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-400">
          ERROR
        </span>
      );
    if (level === "warn")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-2 py-0.5 text-[10px] font-bold text-yellow-400">
          WARN
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold text-blue-400">
        INFO
      </span>
    );
  }

  const SERVER_STATS = [
    { label: "Uptime", value: "99.97%", icon: Server, color: "#10b981" },
    { label: "Avg Latency", value: "142ms", icon: Zap, color: "#EAB308" },
    {
      label: "Error Rate",
      value: `${errorCount}/${SYSTEM_LOGS.length}`,
      icon: AlertTriangle,
      color: "#ef4444",
    },
    { label: "DB Status", value: "Healthy", icon: Database, color: "#10b981" },
    { label: "Cache Hit", value: "94%", icon: Shield, color: "#8b5cf6" },
    { label: "Req/menit", value: "38", icon: Wifi, color: "#3b82f6" },
  ];

  return (
    <AppShell
      title="System Logs"
      subtitle="Monitor kesehatan server dan log aktivitas sistem (Developer Only)"
      user={user}
    >
      <div className="space-y-4">
        {/* Server Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {SERVER_STATS.map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center backdrop-blur-md"
            >
              <div
                className="mx-auto mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ background: color + "22" }}
              >
                <Icon className="h-3.5 w-3.5" style={{ color }} />
              </div>
              <p className="font-display text-sm font-bold" style={{ color }}>
                {value}
              </p>
              <p className="text-[9px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Alerts */}
        {(errorCount > 0 || warnCount > 0) && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
              <div>
                <p className="text-sm font-semibold text-red-400">
                  Ada {errorCount} error dan {warnCount} warning hari ini
                </p>
                <p className="text-xs text-muted-foreground">
                  AI engine mengalami timeout. Periksa koneksi ke provider AI.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Log Table */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden backdrop-blur-md">
          <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-display text-sm font-semibold">System Logs</h3>
              <div className="flex items-center gap-1.5">
                <div
                  className={`h-2 w-2 rounded-full ${isLive ? (pulse ? "bg-green-400" : "bg-green-400/50") : "bg-white/20"}`}
                />
                <span className="text-[10px] text-muted-foreground">
                  {isLive ? "Live" : "Stopped"}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsLive(!isLive)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition ${isLive ? "border-green-500/40 bg-green-500/10 text-green-400" : "border-white/10 text-white/60 hover:bg-white/10 hover:text-white"}`}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLive ? "animate-spin" : ""}`} />
                {isLive ? "Live Mode On" : "Aktifkan Live"}
              </button>
              {["Semua", "Info", "Warn", "Error"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full border px-3 py-1.5 text-[10px] font-medium transition ${filter === f ? "border-primary bg-primary/20 text-primary" : "border-white/10 text-white/60 hover:border-white/30 hover:text-white"}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-black/20">
                  <th className="px-4 py-2 text-left text-[10px] font-semibold text-muted-foreground uppercase">
                    Level
                  </th>
                  <th className="px-4 py-2 text-left text-[10px] font-semibold text-muted-foreground uppercase">
                    Service
                  </th>
                  <th className="px-4 py-2 text-left text-[10px] font-semibold text-muted-foreground uppercase">
                    Pesan
                  </th>
                  <th className="px-4 py-2 text-left text-[10px] font-semibold text-muted-foreground uppercase">
                    Waktu
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((log) => (
                  <tr
                    key={log.id}
                    className={`hover:bg-white/[0.02] ${log.level === "error" ? "bg-red-500/[0.02]" : log.level === "warn" ? "bg-yellow-500/[0.02]" : ""}`}
                  >
                    <td className="px-4 py-3">{getLevelBadge(log.level)}</td>
                    <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                      {log.service}
                    </td>
                    <td className="px-4 py-3 text-white/80 max-w-[300px] truncate">
                      {log.message}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(log.ts).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
