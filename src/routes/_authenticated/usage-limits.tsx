import { createFileRoute } from "@tanstack/react-router";
import { AppShell, useAppUser } from "@/components/app-shell";
import { Gauge, Zap, Image, Users, AlertTriangle, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/usage-limits")({
  head: () => ({
    meta: [{ title: "Batas Penggunaan — CetakIde" }, { name: "robots", content: "noindex" }],
  }),
  component: UsageLimitsPage,
});

const PLANS = [
  {
    name: "Free",
    price: "Gratis",
    generate: 10,
    storage: "100 MB",
    api: 0,
    team: 1,
    color: "#6b7280",
  },
  {
    name: "Starter",
    price: "Rp 99.000/bln",
    generate: 100,
    storage: "1 GB",
    api: 100,
    team: 1,
    color: "#3b82f6",
  },
  {
    name: "Pro",
    price: "Rp 299.000/bln",
    generate: 500,
    storage: "10 GB",
    api: 1000,
    team: 5,
    color: "#EAB308",
    current: true,
  },
  {
    name: "Business",
    price: "Rp 799.000/bln",
    generate: -1,
    storage: "100 GB",
    api: -1,
    team: 20,
    color: "#8b5cf6",
  },
];

function UsageLimitsPage() {
  const { user } = useAppUser();

  const USAGE = [
    {
      label: "Generate Visual / Bulan",
      icon: Zap,
      used: 247,
      limit: 500,
      unit: "generate",
      color: "#EAB308",
    },
    { label: "Storage Aset", icon: Image, used: 3.2, limit: 10, unit: "GB", color: "#8b5cf6" },
    {
      label: "API Calls / Bulan",
      icon: TrendingUp,
      used: 342,
      limit: 1000,
      unit: "calls",
      color: "#3b82f6",
    },
    { label: "Anggota Tim", icon: Users, used: 2, limit: 5, unit: "anggota", color: "#10b981" },
  ];

  return (
    <AppShell
      title="Batas Penggunaan"
      subtitle="Pantau penggunaan sumber daya akun Anda"
      user={user}
    >
      <div className="space-y-4">
        {/* Current Plan Banner */}
        <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-5 sm:p-6 backdrop-blur-md">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Paket Aktif Anda</p>
              <h3 className="font-display text-2xl font-bold text-primary mt-1">Pro Plan</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Rp 299.000/bulan · Perpanjang 5 Agustus 2026
              </p>
            </div>
            <div className="flex gap-2">
              <button className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/20">
                Upgrade ke Business
              </button>
            </div>
          </div>
        </div>

        {/* Usage Progress Bars */}
        <div className="grid gap-3 sm:grid-cols-2">
          {USAGE.map(({ label, icon: Icon, used, limit, unit, color }) => {
            const pct = Math.round((used / limit) * 100);
            const isWarning = pct >= 80;
            const isCritical = pct >= 95;
            return (
              <div
                key={label}
                className={`rounded-2xl border backdrop-blur-md p-4 sm:p-5 ${isCritical ? "border-red-500/30 bg-red-500/5" : isWarning ? "border-yellow-500/30 bg-yellow-500/5" : "border-white/10 bg-white/[0.04]"}`}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: color + "22" }}
                    >
                      <Icon className="h-4 w-4" style={{ color }} />
                    </div>
                    <p className="text-sm font-medium text-white">{label}</p>
                  </div>
                  {isWarning && !isCritical && (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-400" />
                  )}
                  {isCritical && <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />}
                </div>

                <div className="mb-2 flex items-end justify-between text-xs">
                  <span className="font-bold text-white text-lg">
                    {used} <span className="text-sm text-muted-foreground">{unit}</span>
                  </span>
                  <span className="text-muted-foreground">
                    dari {limit} {unit}
                  </span>
                </div>

                <div className="h-2 w-full rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      background: isCritical ? "#ef4444" : isWarning ? "#f59e0b" : color,
                    }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-[10px]">
                  <span
                    className={`font-medium ${isCritical ? "text-red-400" : isWarning ? "text-yellow-400" : "text-muted-foreground"}`}
                  >
                    {pct}% terpakai
                  </span>
                  <span className="text-muted-foreground">
                    {limit - used} {unit} tersisa
                  </span>
                </div>

                {isCritical && (
                  <p className="mt-2 text-[10px] font-medium text-red-400">
                    ⚠️ Hampir penuh! Pertimbangkan upgrade paket.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Plan Comparison */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-6 backdrop-blur-md">
          <h3 className="mb-4 font-display text-sm font-semibold">Perbandingan Paket</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="pb-3 text-left text-xs font-medium text-muted-foreground">
                    Fitur
                  </th>
                  {PLANS.map((plan) => (
                    <th key={plan.name} className="pb-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={`text-xs font-bold ${plan.current ? "text-primary" : "text-white"}`}
                        >
                          {plan.name}
                        </span>
                        {plan.current && (
                          <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[9px] font-bold text-primary">
                            Aktif
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground">{plan.price}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  {
                    label: "Generate/Bulan",
                    key: "generate",
                    format: (v: number) => (v === -1 ? "Tak Terbatas" : String(v)),
                  },
                  { label: "Storage", key: "storage", format: (v: string) => v },
                  {
                    label: "API Calls/Bulan",
                    key: "api",
                    format: (v: number) =>
                      v === -1 ? "Tak Terbatas" : v === 0 ? "Tidak ada" : String(v),
                  },
                  { label: "Anggota Tim", key: "team", format: (v: number) => String(v) },
                ].map(({ label, key, format }) => (
                  <tr key={label}>
                    <td className="py-3 text-xs text-muted-foreground">{label}</td>
                    {PLANS.map((plan) => (
                      <td
                        key={plan.name}
                        className={`py-3 text-center text-xs font-medium ${plan.current ? "text-primary font-bold" : "text-white/70"}`}
                      >
                        {format(plan[key as keyof typeof plan] as never)}
                      </td>
                    ))}
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
