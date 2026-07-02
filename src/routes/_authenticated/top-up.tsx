import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AppShell, useAppUser } from "@/components/app-shell";
import { Wallet, Check, Clock, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/top-up")({
  head: () => ({ meta: [{ title: "Top Up Saldo — CetakIde" }, { name: "robots", content: "noindex" }] }),
  component: TopUpPage,
});

const PACKAGES = [10000, 20000, 30000, 50000, 100000];

type Transaction = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
};

function TopUpPage() {
  const { user, refresh } = useAppUser();
  const [selected, setSelected] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [txs, setTxs] = useState<Transaction[]>([]);

  const loadTx = () => {
    if (!user) return;
    supabase
      .from("transactions")
      .select("id, amount, status, created_at")
      .eq("user_id", user.userId)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setTxs((data ?? []) as Transaction[]));
  };

  useEffect(loadTx, [user]);

  const amount = custom ? Number(custom) : selected ?? 0;

  function validate(n: number) {
    if (!n || n < 10000 || n % 10000 !== 0) {
      setErr("Minimal top up adalah Rp 10.000 dan harus dalam kelipatan Rp 10.000.");
      return false;
    }
    setErr("");
    return true;
  }

  async function handleSubmit() {
    if (!user) return;
    if (!validate(amount)) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("transactions").insert({
        user_id: user.userId,
        amount,
        status: "pending",
      });
      if (error) throw error;
      toast.success("Permintaan top up dibuat.", { description: "Cek riwayat untuk instruksi pembayaran." });
      setSelected(null);
      setCustom("");
      loadTx();
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal membuat transaksi");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell title="Top Up Saldo" subtitle="Isi ulang balance untuk generate lebih banyak" user={user}>
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-5 backdrop-blur-md">
            <h2 className="mb-3 font-display text-base font-semibold">Pilih Paket</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {PACKAGES.map((p) => {
                const active = selected === p && !custom;
                return (
                  <button
                    key={p}
                    onClick={() => {
                      setSelected(p);
                      setCustom("");
                      setErr("");
                    }}
                    className={`rounded-xl border p-4 text-left transition ${
                      active
                        ? "border-primary bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary)/0.6)]"
                        : "border-white/10 bg-white/[0.03] hover:border-white/30"
                    }`}
                  >
                    <p className="text-xs text-muted-foreground">Paket</p>
                    <p className="mt-1 font-display text-lg font-bold text-gradient-gold">
                      Rp {p.toLocaleString("id-ID")}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-5 backdrop-blur-md">
            <h2 className="mb-3 font-display text-base font-semibold">Nominal Lainnya</h2>
            <input
              type="number"
              inputMode="numeric"
              value={custom}
              onChange={(e) => {
                setCustom(e.target.value);
                setSelected(null);
                if (e.target.value) validate(Number(e.target.value));
                else setErr("");
              }}
              placeholder="Contoh: 40000"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-primary/60"
            />
            {err && <p className="mt-2 text-xs text-secondary">{err}</p>}
            <button
              onClick={handleSubmit}
              disabled={submitting || !amount}
              className="mt-4 w-full rounded-lg gradient-gold py-2.5 text-sm font-semibold text-black disabled:opacity-60"
            >
              Lanjutkan Pembayaran{amount ? ` — Rp ${amount.toLocaleString("id-ID")}` : ""}
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-md">
            <div className="border-b border-white/10 p-5">
              <h2 className="font-display text-base font-semibold">Riwayat Top Up</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/5 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Tanggal</th>
                    <th className="px-4 py-3 text-left">ID Transaksi</th>
                    <th className="px-4 py-3 text-left">Nominal</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {txs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        Belum ada transaksi.
                      </td>
                    </tr>
                  )}
                  {txs.map((t) => (
                    <tr key={t.id} className="border-t border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(t.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {t.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3 font-semibold">Rp {t.amount.toLocaleString("id-ID")}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={t.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-primary/30 bg-primary/10 p-5 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs text-primary/80">
              <Wallet className="h-3.5 w-3.5" /> Saldo Saat Ini
            </div>
            <p className="mt-2 font-display text-2xl font-semibold text-primary">
              Rp {(user?.saldo ?? 0).toLocaleString("id-ID")}
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-5 backdrop-blur-md">
            <h3 className="mb-2 text-sm font-semibold">Info Pembayaran</h3>
            <p className="text-xs text-muted-foreground">
              Setelah membuat transaksi, admin akan memverifikasi & mengaktifkan saldo maksimal 15 menit di jam kerja.
            </p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "success")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs text-green-400">
        <Check className="h-3 w-3" /> Sukses
      </span>
    );
  if (status === "failed")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-secondary/15 px-2.5 py-0.5 text-xs text-secondary">
        <X className="h-3 w-3" /> Gagal
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-2.5 py-0.5 text-xs text-yellow-400">
      <Clock className="h-3 w-3" /> Pending
    </span>
  );
}