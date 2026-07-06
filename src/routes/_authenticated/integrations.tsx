import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, useAppUser } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Plug,
  Plus,
  Trash2,
  KeyRound,
  Loader2,
  X,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Zap,
  RefreshCcw,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { resetKey, markKeyResult, type ProviderKey } from "@/lib/keyRotation";

export const Route = createFileRoute("/_authenticated/integrations")({
  head: () => ({
    meta: [{ title: "Integrasi API — Cetak Ide" }, { name: "robots", content: "noindex" }],
  }),
  component: IntegrationsPage,
});

type ApiProvider = ProviderKey & { created_at: string };

const PROVIDER_OPTIONS = [
  "OpenAI",
  "Anthropic",
  "Google Gemini",
  "Groq",
  "Replicate",
  "Stability AI",
  "Fal.ai",
  "Custom",
];

function maskKey(k: string) {
  if (!k) return "";
  if (k.length <= 8) return "•".repeat(k.length);
  return k.slice(0, 4) + "•".repeat(Math.max(4, k.length - 8)) + k.slice(-4);
}

function IntegrationsPage() {
  const { user } = useAppUser();
  const [rows, setRows] = useState<ApiProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const [failoverToday, setFailoverToday] = useState(0);
  const [usedToday, setUsedToday] = useState(0);
  const [form, setForm] = useState({
    provider: PROVIDER_OPTIONS[0],
    model: "",
    api_key: "",
    label: "",
  });

  async function refresh() {
    if (!user?.userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("ai_providers")
      .select("*")
      .eq("user_id", user.userId)
      .order("priority", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) toast.error(error.message);
    setRows((data ?? []) as ApiProvider[]);

    // Failover / usage counters for today
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const { data: ev } = await supabase
      .from("ai_key_events")
      .select("event")
      .eq("user_id", user.userId)
      .gte("created_at", since.toISOString());
    setFailoverToday((ev ?? []).filter((e) => e.event === "failover").length);
    setUsedToday((ev ?? []).filter((e) => e.event === "used").length);

    setLoading(false);
  }

  useEffect(() => {
    if (user?.userId) void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.userId) return;
    if (!form.model.trim() || !form.api_key.trim()) {
      toast.error("Model dan API Key wajib diisi.");
      return;
    }
    setSaving(true);
    const nextPriority = rows.length > 0 ? Math.max(...rows.map((r) => r.priority)) + 1 : 1;
    const { error } = await supabase.from("ai_providers").insert({
      user_id: user.userId,
      provider: form.provider,
      model: form.model.trim(),
      api_key: form.api_key.trim(),
      label: form.label.trim() || null,
      priority: nextPriority,
      is_active: true,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("API berhasil ditambahkan.");
    setForm({ provider: PROVIDER_OPTIONS[0], model: "", api_key: "", label: "" });
    setModalOpen(false);
    void refresh();
  }

  async function toggleActive(row: ApiProvider) {
    const { error } = await supabase
      .from("ai_providers")
      .update({ is_active: !row.is_active })
      .eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("Status diperbarui.");
    void refresh();
  }

  async function movePriority(row: ApiProvider, direction: -1 | 1) {
    const sorted = [...rows].sort((a, b) => a.priority - b.priority);
    const idx = sorted.findIndex((r) => r.id === row.id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const other = sorted[swapIdx];
    // swap priorities
    await supabase
      .from("ai_providers")
      .update({ priority: other.priority })
      .eq("id", row.id);
    await supabase
      .from("ai_providers")
      .update({ priority: row.priority })
      .eq("id", other.id);
    void refresh();
  }

  async function testKey(row: ApiProvider) {
    if (!user?.userId) return;
    // Lightweight local validation of the key format. A full network test would
    // hit each provider; this catches obvious typos and rotates state so the
    // dashboard reflects a fresh "ok" badge.
    const looksValid =
      (row.provider === "OpenAI" && /^sk-[A-Za-z0-9_-]{16,}$/.test(row.api_key)) ||
      (row.provider !== "OpenAI" && row.api_key.length >= 12);
    await markKeyResult(user.userId, row, looksValid ? { kind: "ok" } : { kind: "invalid" });
    toast[looksValid ? "success" : "error"](
      looksValid ? "Format key valid — status di-reset." : "Format key tidak dikenali.",
    );
    void refresh();
  }

  async function handleReset(row: ApiProvider) {
    await resetKey(row.id);
    toast.success("Key diaktifkan lagi.");
    void refresh();
  }

  async function remove(row: ApiProvider) {
    if (!confirm(`Hapus API "${row.label || row.model}"?`)) return;
    const { error } = await supabase.from("ai_providers").delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("API dihapus.");
    void refresh();
  }

  return (
    <AppShell
      title="Integrasi API"
      subtitle="Kelola banyak API Key dengan auto-fallback saat billing habis"
      user={user}
    >
      {/* Summary panel */}
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-4">
          <div className="text-xs text-muted-foreground">Key Aktif Tersedia</div>
          <div className="mt-1 font-display text-2xl font-bold">
            {
              rows.filter(
                (r) =>
                  r.is_active &&
                  (!r.disabled_until || new Date(r.disabled_until) < new Date()),
              ).length
            }{" "}
            / {rows.length}
          </div>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-4">
          <div className="text-xs text-muted-foreground">Request Berhasil Hari Ini</div>
          <div className="mt-1 font-display text-2xl font-bold">{usedToday}</div>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-4">
          <div className="text-xs text-muted-foreground">Failover Hari Ini</div>
          <div className="mt-1 font-display text-2xl font-bold text-amber-400">
            {failoverToday}×
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Plug className="h-4 w-4 text-primary" />
          <span>Diurut berdasarkan prioritas (angka kecil dicoba lebih dulu)</span>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg gradient-gold px-3 py-2 text-sm font-semibold text-black hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Tambah API
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Label</th>
                <th className="px-4 py-3 text-left">Provider</th>
                <th className="px-4 py-3 text-left">Model</th>
                <th className="px-4 py-3 text-left">API Key</th>
                <th className="px-4 py-3 text-left">Status Terakhir</th>
                <th className="px-4 py-3 text-left">Aktif</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    Belum ada API. Klik <span className="text-primary">Tambah API</span> untuk
                    memulai.
                  </td>
                </tr>
              )}
              {rows.map((r, idx) => (
                <tr key={r.id} className="border-t border-white/5 hover:bg-white/5">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs text-muted-foreground">
                        {r.priority}
                      </span>
                      <div className="flex flex-col">
                        <button
                          onClick={() => movePriority(r, -1)}
                          disabled={idx === 0}
                          className="text-muted-foreground hover:text-primary disabled:opacity-20"
                          title="Naikkan prioritas"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => movePriority(r, 1)}
                          disabled={idx === rows.length - 1}
                          className="text-muted-foreground hover:text-primary disabled:opacity-20"
                          title="Turunkan prioritas"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{r.label || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs">
                      {r.provider}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.model}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-black/40 px-2 py-0.5 text-xs">
                        {reveal[r.id] ? r.api_key : maskKey(r.api_key)}
                      </code>
                      <button
                        onClick={() => setReveal((s) => ({ ...s, [r.id]: !s[r.id] }))}
                        className="text-muted-foreground hover:text-foreground"
                        title={reveal[r.id] ? "Sembunyikan" : "Tampilkan"}
                      >
                        {reveal[r.id] ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge row={r} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(r)}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                        r.is_active
                          ? "bg-green-500/15 text-green-400"
                          : "bg-white/10 text-muted-foreground"
                      }`}
                    >
                      {r.is_active ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {r.is_active ? "Aktif" : "Nonaktif"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => testKey(r)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/15 hover:text-primary"
                        title="Test key"
                      >
                        <Zap className="h-4 w-4" />
                      </button>
                      {(r.disabled_until || r.last_status === "invalid") && (
                        <button
                          onClick={() => handleReset(r)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-amber-500/15 hover:text-amber-400"
                          title="Aktifkan lagi"
                        >
                          <RefreshCcw className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => remove(r)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary/15 hover:text-secondary"
                        title="Hapus"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0a0a0a] p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <KeyRound className="h-4 w-4 text-primary" /> Tambah API Key
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded p-1 text-muted-foreground hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                  Provider
                </label>
                <select
                  value={form.provider}
                  onChange={(e) => setForm({ ...form, provider: e.target.value })}
                  className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                >
                  {PROVIDER_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                  Model
                </label>
                <input
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  placeholder="mis. gpt-4o-mini"
                  className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                  API Key
                </label>
                <input
                  value={form.api_key}
                  onChange={(e) => setForm({ ...form, api_key: e.target.value })}
                  placeholder="sk-..."
                  className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                  Label (opsional)
                </label>
                <input
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="mis. Produksi Utama"
                  className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg gradient-gold py-2.5 text-sm font-semibold text-black disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan API
            </button>
          </form>
        </div>
      )}
    </AppShell>
  );
}
