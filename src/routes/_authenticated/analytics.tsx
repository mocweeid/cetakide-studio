import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, useAppUser } from "@/components/app-shell";
import { BarChart3, Zap, Wallet, TrendingUp, CheckCircle2, XCircle, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [{ title: "Analitik Hub — Cetak Ide" }, { name: "robots", content: "noindex" }],
  }),
  component: AnalyticsPage,
});

const DAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const BAR_DATA = [12, 19, 8, 24, 15, 30, 22];

const RECENT = [
  { id: "1", platform: "Instagram", kebutuhan: "Banner sneakers hitam premium", status: "sukses" },
  { id: "2", platform: "Facebook", kebutuhan: "Iklan promo restoran padang", status: "sukses" },
  { id: "3", platform: "YouTube", kebutuhan: "Thumbnail review laptop gaming", status: "sukses" },
  { id: "4", platform: "Instagram", kebutuhan: "Story flash sale skincare", status: "gagal" },
  { id: "5", platform: "Facebook", kebutuhan: "Banner properti residensial", status: "sukses" },
];

const PLATFORMS = [
  { label: "Instagram", pct: 54, color: "#E1306C" },
  { label: "Facebook", pct: 28, color: "#1877F2" },
  { label: "YouTube", pct: 18, color: "#FF0000" },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "sukses")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-semibold text-green-400">
        <CheckCircle2 className="h-3 w-3" /> Sukses
      </span>
    );
  if (status === "gagal")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-400">
        <XCircle className="h-3 w-3" /> Gagal
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-2 py-0.5 text-[10px] font-semibold text-yellow-400">
      <Clock className="h-3 w-3" /> Proses
    </span>
  );
}

function AnalyticsPage() {
  const { user } = useAppUser();
  const [totalGenerate, setTotalGenerate] = useState(0);
  const maxBar = Math.max(...BAR_DATA);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.userId)
      .then(({ count }) => setTotalGenerate(count ?? 0));
  }, [user]);

  const STATS = [
    {
      label: "Total Generate",
      value: String(totalGenerate),
      sub: "Sepanjang waktu",
      icon: Zap,
      color: "#EAB308",
    },
    {
      label: "Saldo Terpakai",
      value: `Rp ${(totalGenerate * 1000).toLocaleString("id-ID")}`,
      sub: "Total kredit terpakai",
      icon: Wallet,
      color: "#8b5cf6",
    },
    {
      label: "Platform Favorit",
      value: "Instagram",
      sub: "54% dari semua generate",
      icon: TrendingUp,
      color: "#E1306C",
    },
    {
      label: "Tingkat Sukses",
      value: "94%",
      sub: "6% gagal / proses",
      icon: BarChart3,
      color: "#10b981",
    },
  ];

  return (
    <AppShell title="Analitik Hub" subtitle="Tren penggunaan dan statistik akun Anda" user={user}>
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {STATS.map(({ label, value, sub, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5 backdrop-blur-md"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="mt-1 font-display text-lg sm:text-2xl font-bold truncate">{value}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{sub}</p>
              </div>
              <div className="shrink-0 rounded-xl p-2.5" style={{ background: color + "22" }}>
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Bar Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-6 backdrop-blur-md">
          <h3 className="mb-4 font-display text-sm font-semibold">Generate 7 Hari Terakhir</h3>
          <div className="flex items-end gap-2 sm:gap-3 h-36 sm:h-44">
            {BAR_DATA.map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground">{v}</span>
                <div
                  className="w-full rounded-t-md"
                  style={{
                    height: `${(v / maxBar) * 100}%`,
                    background: "linear-gradient(to top, #CA8A04, #EAB308)",
                    minHeight: "4px",
                  }}
                />
                <span className="text-[9px] text-muted-foreground">{DAYS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Distribution */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-6 backdrop-blur-md">
          <h3 className="mb-4 font-display text-sm font-semibold">Distribusi Platform</h3>
          <div className="space-y-5">
            {PLATFORMS.map((p) => (
              <div key={p.label}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-medium">{p.label}</span>
                  <span className="text-muted-foreground">{p.pct}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${p.pct}%`, background: p.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Table */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-6 backdrop-blur-md">
        <h3 className="mb-4 font-display text-sm font-semibold">Riwayat Generate Terbaru</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[440px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs text-muted-foreground">
                <th className="pb-3 text-left font-medium">Deskripsi</th>
                <th className="pb-3 text-left font-medium">Platform</th>
                <th className="pb-3 text-left font-medium">Status</th>
                <th className="pb-3 text-left font-medium">Biaya</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {RECENT.map((p) => (
                <tr key={p.id} className="text-xs hover:bg-white/[0.02]">
                  <td className="py-3 pr-4 font-medium text-white/90 max-w-[160px] truncate">
                    {p.kebutuhan}
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">{p.platform}</td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {p.status === "sukses" ? "Rp 1.000" : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
