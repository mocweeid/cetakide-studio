import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, useAppUser } from "@/components/app-shell";
import { Shield, ShieldCheck, ShieldAlert, Smartphone, Monitor, Globe, Filter } from "lucide-react";

export const Route = createFileRoute("/_authenticated/security-logs")({
  head: () => ({
    meta: [{ title: "Log Keamanan — CetakIde" }, { name: "robots", content: "noindex" }],
  }),
  component: SecurityLogsPage,
});

const LOGS = [
  {
    id: "1",
    action: "Login berhasil",
    ip: "118.99.81.xxx",
    device: "Chrome / Windows",
    location: "Jakarta, ID",
    timestamp: "2026-07-03T14:32:00Z",
    status: "sukses",
  },
  {
    id: "2",
    action: "Ubah kata sandi",
    ip: "118.99.81.xxx",
    device: "Chrome / Windows",
    location: "Jakarta, ID",
    timestamp: "2026-07-02T10:15:00Z",
    status: "sukses",
  },
  {
    id: "3",
    action: "Top up saldo",
    ip: "118.99.81.xxx",
    device: "Chrome / Windows",
    location: "Jakarta, ID",
    timestamp: "2026-07-01T09:00:00Z",
    status: "sukses",
  },
  {
    id: "4",
    action: "Login gagal (salah password)",
    ip: "203.154.12.xxx",
    device: "Firefox / Linux",
    location: "Surabaya, ID",
    timestamp: "2026-06-30T22:10:00Z",
    status: "gagal",
  },
  {
    id: "5",
    action: "Generate Visual",
    ip: "118.99.81.xxx",
    device: "Chrome / Windows",
    location: "Jakarta, ID",
    timestamp: "2026-06-29T15:30:00Z",
    status: "sukses",
  },
  {
    id: "6",
    action: "Login berhasil",
    ip: "36.82.45.xxx",
    device: "Safari / iPhone",
    location: "Bandung, ID",
    timestamp: "2026-06-28T08:00:00Z",
    status: "sukses",
  },
  {
    id: "7",
    action: "Login gagal (akun diblokir sementara)",
    ip: "202.80.20.xxx",
    device: "Unknown / Unknown",
    location: "Medan, ID",
    timestamp: "2026-06-27T03:25:00Z",
    status: "gagal",
  },
  {
    id: "8",
    action: "Export data akun",
    ip: "118.99.81.xxx",
    device: "Chrome / Windows",
    location: "Jakarta, ID",
    timestamp: "2026-06-25T16:45:00Z",
    status: "sukses",
  },
  {
    id: "9",
    action: "Hapus proyek",
    ip: "118.99.81.xxx",
    device: "Chrome / Windows",
    location: "Jakarta, ID",
    timestamp: "2026-06-24T11:00:00Z",
    status: "sukses",
  },
  {
    id: "10",
    action: "Percobaan akses API tidak sah",
    ip: "45.155.205.xxx",
    device: "cURL / Bot",
    location: "Rusia",
    timestamp: "2026-06-23T00:10:00Z",
    status: "diblokir",
  },
];

function SecurityLogsPage() {
  const { user } = useAppUser();
  const [filter, setFilter] = useState("Semua");

  const filtered = LOGS.filter((l) => filter === "Semua" || l.status === filter.toLowerCase());

  const successCount = LOGS.filter((l) => l.status === "sukses").length;
  const failCount = LOGS.filter((l) => l.status === "gagal").length;
  const blockedCount = LOGS.filter((l) => l.status === "diblokir").length;

  function getStatusBadge(status: string) {
    if (status === "sukses")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-semibold text-green-400">
          <ShieldCheck className="h-3 w-3" /> Sukses
        </span>
      );
    if (status === "gagal")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-400">
          <ShieldAlert className="h-3 w-3" /> Gagal
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-semibold text-orange-400">
        <Shield className="h-3 w-3" /> Diblokir
      </span>
    );
  }

  function getDeviceIcon(device: string) {
    if (device.includes("iPhone") || device.includes("Android"))
      return <Smartphone className="h-3.5 w-3.5" />;
    if (device.includes("Unknown") || device.includes("Bot"))
      return <Globe className="h-3.5 w-3.5" />;
    return <Monitor className="h-3.5 w-3.5" />;
  }

  return (
    <AppShell
      title="Log Keamanan"
      subtitle="Pantau semua aktivitas login dan keamanan akun Anda"
      user={user}
    >
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Aktivitas Sukses", value: successCount.toString(), color: "#10b981" },
            { label: "Login Gagal", value: failCount.toString(), color: "#ef4444" },
            { label: "Diblokir", value: blockedCount.toString(), color: "#f97316" },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 sm:p-4 text-center backdrop-blur-md"
            >
              <p className="font-display text-xl sm:text-2xl font-bold" style={{ color }}>
                {value}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Security Alerts */}
        {(failCount > 0 || blockedCount > 0) && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 backdrop-blur-md">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
              <div>
                <p className="text-sm font-semibold text-red-400">
                  Terdeteksi Aktivitas Mencurigakan
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ada {failCount} login gagal dan {blockedCount} percobaan akses yang diblokir.
                  Pastikan Anda menggunakan kata sandi yang kuat dan aktifkan autentikasi dua
                  faktor.
                </p>
                <button className="mt-2 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10">
                  Aktifkan 2FA
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Log Table */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-6 backdrop-blur-md">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-display text-sm font-semibold">
              Log Aktivitas ({filtered.length})
            </h3>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <div className="flex gap-1">
                {["Semua", "Sukses", "Gagal", "Diblokir"].map((f) => (
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
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs text-muted-foreground">
                  <th className="pb-3 text-left font-medium">Aktivitas</th>
                  <th className="pb-3 text-left font-medium">IP Address</th>
                  <th className="pb-3 text-left font-medium">Perangkat</th>
                  <th className="pb-3 text-left font-medium">Lokasi</th>
                  <th className="pb-3 text-left font-medium">Waktu</th>
                  <th className="pb-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((log) => (
                  <tr
                    key={log.id}
                    className={`text-xs hover:bg-white/[0.02] ${log.status !== "sukses" ? "bg-red-500/[0.02]" : ""}`}
                  >
                    <td className="py-3 pr-4 font-medium text-white max-w-[180px] truncate">
                      {log.action}
                    </td>
                    <td className="py-3 pr-4 font-mono text-muted-foreground">{log.ip}</td>
                    <td className="py-3 pr-4">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        {getDeviceIcon(log.device)}
                        <span className="max-w-[100px] truncate">{log.device}</span>
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">
                      {log.location}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3">{getStatusBadge(log.status)}</td>
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
