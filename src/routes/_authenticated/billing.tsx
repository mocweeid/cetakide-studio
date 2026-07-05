import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, useAppUser } from "@/components/app-shell";
import {
  Receipt,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Wallet,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/billing")({
  head: () => ({
    meta: [{ title: "Riwayat Tagihan — CetakIde" }, { name: "robots", content: "noindex" }],
  }),
  component: BillingPage,
});

const TRANSACTIONS = [
  {
    id: "INV-2026-0045",
    date: "2026-07-03",
    desc: "Paket Pro — Juli 2026",
    amount: 299000,
    type: "langganan",
    status: "lunas",
  },
  {
    id: "INV-2026-0044",
    date: "2026-07-01",
    desc: "Top Up Saldo 50.000 Koin",
    amount: 50000,
    type: "topup",
    status: "lunas",
  },
  {
    id: "INV-2026-0043",
    date: "2026-06-30",
    desc: "Generate Bulk — 20 Visual",
    amount: 20000,
    type: "penggunaan",
    status: "lunas",
  },
  {
    id: "INV-2026-0042",
    date: "2026-06-15",
    desc: "Top Up Saldo 25.000 Koin",
    amount: 25000,
    type: "topup",
    status: "lunas",
  },
  {
    id: "INV-2026-0041",
    date: "2026-06-03",
    desc: "Paket Pro — Juni 2026",
    amount: 299000,
    type: "langganan",
    status: "lunas",
  },
  {
    id: "INV-2026-0040",
    date: "2026-06-01",
    desc: "Generate Inpainting — 5x",
    amount: 5000,
    type: "penggunaan",
    status: "lunas",
  },
  {
    id: "INV-2026-0039",
    date: "2026-05-25",
    desc: "Top Up Saldo 100.000 Koin",
    amount: 100000,
    type: "topup",
    status: "lunas",
  },
  {
    id: "INV-2026-0038",
    date: "2026-05-03",
    desc: "Paket Pro — Mei 2026",
    amount: 299000,
    type: "langganan",
    status: "lunas",
  },
  {
    id: "INV-2026-0037",
    date: "2026-04-28",
    desc: "Generate Bulk — 10 Visual",
    amount: 10000,
    type: "penggunaan",
    status: "refund",
  },
  {
    id: "INV-PENDING",
    date: "2026-07-05",
    desc: "Perpanjangan Paket Pro — Agustus",
    amount: 299000,
    type: "langganan",
    status: "pending",
  },
];

const TYPE_COLORS: Record<string, string> = {
  langganan: "#8b5cf6",
  topup: "#10b981",
  penggunaan: "#EAB308",
  refund: "#f97316",
};

function StatusBadge({ status }: { status: string }) {
  if (status === "lunas")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-semibold text-green-400">
        <CheckCircle2 className="h-3 w-3" /> Lunas
      </span>
    );
  if (status === "pending")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-2 py-0.5 text-[10px] font-semibold text-yellow-400">
        <Clock className="h-3 w-3" /> Pending
      </span>
    );
  if (status === "refund")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-semibold text-orange-400">
        <XCircle className="h-3 w-3" /> Refund
      </span>
    );
  return null;
}

function BillingPage() {
  const { user } = useAppUser();
  const [filter, setFilter] = useState("Semua");
  const [filterMonth, setFilterMonth] = useState("Semua");

  const MONTHS = ["Semua", "Juli 2026", "Juni 2026", "Mei 2026", "April 2026"];
  const FILTERS = ["Semua", "Langganan", "Top Up", "Penggunaan"];

  const filtered = TRANSACTIONS.filter((t) => {
    const matchType = filter === "Semua" || t.type === filter.toLowerCase().replace(" ", "");
    return matchType;
  });

  const totalThisMonth = TRANSACTIONS.filter(
    (t) => t.date.startsWith("2026-07") && t.status === "lunas",
  ).reduce((s, t) => s + t.amount, 0);
  const totalAll = TRANSACTIONS.filter((t) => t.status === "lunas").reduce(
    (s, t) => s + t.amount,
    0,
  );

  return (
    <AppShell
      title="Riwayat Tagihan"
      subtitle="Rekap semua transaksi dan tagihan akun Anda"
      user={user}
    >
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "Total Bulan Ini",
              value: `Rp ${totalThisMonth.toLocaleString("id-ID")}`,
              icon: CreditCard,
              color: "#EAB308",
            },
            {
              label: "Total Semua Waktu",
              value: `Rp ${totalAll.toLocaleString("id-ID")}`,
              icon: Wallet,
              color: "#8b5cf6",
            },
            { label: "Paket Aktif", value: "Pro Plan", icon: TrendingUp, color: "#10b981" },
            { label: "Perpanjangan", value: "5 Agt 2026", icon: Receipt, color: "#f97316" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md"
            >
              <div
                className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ background: color + "22" }}
              >
                <Icon className="h-4 w-4" style={{ color }} />
              </div>
              <p className="font-display text-base sm:text-lg font-bold text-white truncate">
                {value}
              </p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Current Plan */}
        <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-5 sm:p-6 backdrop-blur-md">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Paket Aktif</p>
              <h3 className="font-display text-2xl font-bold text-primary">Pro Plan</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Rp 299.000/bulan · 500 generate/bulan · Semua fitur premium
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => toast.info("Mengalihkan ke halaman upgrade...")}
                className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/20"
              >
                Upgrade Plan
              </button>
              <button
                onClick={() => toast.info("Menampilkan pilihan perpanjangan...")}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white"
              >
                Perpanjang
              </button>
            </div>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-6 backdrop-blur-md">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-display text-sm font-semibold">Riwayat Transaksi</h3>
            <div className="flex flex-wrap gap-2">
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs focus:border-primary/50 focus:outline-none"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <div className="flex gap-1">
                {FILTERS.map((f) => (
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
            <table className="w-full min-w-[540px] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs text-muted-foreground">
                  <th className="pb-3 text-left font-medium">Invoice</th>
                  <th className="pb-3 text-left font-medium">Deskripsi</th>
                  <th className="pb-3 text-left font-medium">Tipe</th>
                  <th className="pb-3 text-left font-medium">Tanggal</th>
                  <th className="pb-3 text-left font-medium">Jumlah</th>
                  <th className="pb-3 text-left font-medium">Status</th>
                  <th className="pb-3 text-left font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((t) => (
                  <tr key={t.id} className="text-xs hover:bg-white/[0.02]">
                    <td className="py-3 pr-4 font-mono text-muted-foreground">{t.id}</td>
                    <td className="py-3 pr-4 font-medium text-white max-w-[160px] truncate">
                      {t.desc}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
                        style={{
                          background: (TYPE_COLORS[t.type] ?? "#888") + "22",
                          color: TYPE_COLORS[t.type] ?? "#888",
                        }}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">
                      {new Date(t.date).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td
                      className={`py-3 pr-4 font-bold ${t.type === "refund" ? "text-orange-400" : "text-white"}`}
                    >
                      {t.type === "refund" ? "-" : "+"}Rp {t.amount.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => toast.success(`Invoice ${t.id} diunduh!`)}
                        className="rounded-lg border border-white/10 p-1.5 text-muted-foreground hover:bg-white/10 hover:text-white"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
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
