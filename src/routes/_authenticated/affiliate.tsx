import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, useAppUser } from "@/components/app-shell";
import { Link2, Copy, Users, Wallet, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/affiliate")({
  head: () => ({
    meta: [{ title: "Program Afiliasi — CetakIde" }, { name: "robots", content: "noindex" }],
  }),
  component: AffiliatePage,
});

const REFERRAL_CODE = "CETAK-WILDAN-2026";
const REFERRAL_LINK = `https://cetakide.com/daftar?ref=${REFERRAL_CODE}`;

const REFERRAL_HISTORY = [
  {
    id: "1",
    name: "Budi Santoso",
    email: "budi@example.com",
    joined: "2026-07-01",
    plan: "Pro",
    komisi: 25000,
    status: "pending",
  },
  {
    id: "2",
    name: "Siti Rahma",
    email: "siti@example.com",
    joined: "2026-06-20",
    plan: "Starter",
    komisi: 10000,
    status: "dibayar",
  },
  {
    id: "3",
    name: "Andi Wijaya",
    email: "andi@example.com",
    joined: "2026-06-10",
    plan: "Pro",
    komisi: 25000,
    status: "dibayar",
  },
  {
    id: "4",
    name: "Dewi Lestari",
    email: "dewi@example.com",
    joined: "2026-06-01",
    plan: "Starter",
    komisi: 10000,
    status: "dibayar",
  },
  {
    id: "5",
    name: "Reza Pratama",
    email: "reza@example.com",
    joined: "2026-07-03",
    plan: "Pro",
    komisi: 25000,
    status: "pending",
  },
];

function AffiliatePage() {
  const { user } = useAppUser();
  const [copied, setCopied] = useState(false);

  const totalReferral = REFERRAL_HISTORY.length;
  const komisiPending = REFERRAL_HISTORY.filter((r) => r.status === "pending").reduce(
    (s, r) => s + r.komisi,
    0,
  );
  const komisiDibayar = REFERRAL_HISTORY.filter((r) => r.status === "dibayar").reduce(
    (s, r) => s + r.komisi,
    0,
  );
  const totalKomisi = komisiPending + komisiDibayar;

  function copyLink() {
    navigator.clipboard.writeText(REFERRAL_LINK);
    setCopied(true);
    toast.success("Link afiliasi disalin!");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <AppShell
      title="Program Afiliasi"
      subtitle="Dapatkan komisi dengan mengajak pengguna baru ke CetakIde"
      user={user}
    >
      <div className="space-y-4">
        {/* Referral Link Card */}
        <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-5 sm:p-6 backdrop-blur-md">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-primary">Link Afiliasi Anda</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Bagikan link ini dan dapatkan komisi setiap ada pendaftaran baru!
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-black/30 px-4 py-3 sm:max-w-sm">
              <Link2 className="h-4 w-4 shrink-0 text-primary" />
              <span className="flex-1 truncate text-sm font-mono text-white/80">
                {REFERRAL_LINK}
              </span>
              <button
                onClick={copyLink}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-black transition ${copied ? "bg-green-500" : "bg-primary hover:brightness-110"}`}
              >
                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-black/20 px-4 py-3">
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Kode Referral:</span>{" "}
                <span className="font-mono font-bold text-primary">{REFERRAL_CODE}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Komisi per referral:</span>{" "}
                <span className="font-bold text-white">20% dari paket pertama</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "Total Referral",
              value: totalReferral.toString(),
              icon: Users,
              color: "#3b82f6",
            },
            {
              label: "Total Komisi",
              value: `Rp ${totalKomisi.toLocaleString("id-ID")}`,
              icon: Wallet,
              color: "#EAB308",
            },
            {
              label: "Komisi Pending",
              value: `Rp ${komisiPending.toLocaleString("id-ID")}`,
              icon: Clock,
              color: "#f97316",
            },
            {
              label: "Komisi Dibayar",
              value: `Rp ${komisiDibayar.toLocaleString("id-ID")}`,
              icon: TrendingUp,
              color: "#10b981",
            },
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
              <p className="font-display text-base sm:text-lg font-bold text-white">{value}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Referral History */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-6 backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold">Riwayat Referral</h3>
            <button
              onClick={() => toast.info("Permintaan penarikan komisi akan segera hadir!")}
              className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-medium text-primary hover:bg-primary/20"
            >
              Tarik Komisi
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs text-muted-foreground">
                  <th className="pb-3 text-left font-medium">Nama</th>
                  <th className="pb-3 text-left font-medium">Paket</th>
                  <th className="pb-3 text-left font-medium">Bergabung</th>
                  <th className="pb-3 text-left font-medium">Komisi</th>
                  <th className="pb-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {REFERRAL_HISTORY.map((r) => (
                  <tr key={r.id} className="text-xs hover:bg-white/[0.02]">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-white">{r.name}</p>
                      <p className="text-muted-foreground">{r.email}</p>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{r.plan}</td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {new Date(r.joined).toLocaleDateString("id-ID")}
                    </td>
                    <td className="py-3 pr-4 font-semibold text-primary">
                      Rp {r.komisi.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3">
                      {r.status === "dibayar" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-semibold text-green-400">
                          <CheckCircle2 className="h-3 w-3" /> Dibayar
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-2 py-0.5 text-[10px] font-semibold text-yellow-400">
                          <Clock className="h-3 w-3" /> Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* How it Works */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-6 backdrop-blur-md">
          <h3 className="mb-4 font-display text-sm font-semibold">Cara Kerja Program Afiliasi</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Bagikan Link",
                desc: "Salin dan bagikan link afiliasi Anda ke teman, komunitas, atau media sosial.",
              },
              {
                step: "2",
                title: "Mereka Mendaftar",
                desc: "Ketika seseorang mendaftar menggunakan link Anda, referral tercatat otomatis.",
              },
              {
                step: "3",
                title: "Komisi Masuk",
                desc: "Dapatkan 20% komisi dari pembayaran paket pertama mereka. Cair setiap bulan!",
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                  {step}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
