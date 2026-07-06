import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, useAppUser } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { Key, Plus, Trash2, AlertTriangle, Loader2, Eye, EyeOff, Power, Zap, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { testAiKeyServer } from "@/lib/testAiKey.functions";

export const Route = createFileRoute("/_authenticated/admin-ai-keys")({
  head: () => ({
    meta: [
      { title: "Admin AI Keys — Cetak Ide" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminAiKeysPage,
});

type ProviderRow = {
  id: string;
  provider: string;
  model: string | null;
  api_key: string;
  label: string | null;
  is_active: boolean;
  priority: number | null;
  last_status: string | null;
  last_used_at: string | null;
  failure_count: number | null;
  created_at: string;
};

function mask(k: string) {
  if (!k) return "";
  if (k.length <= 10) return "•".repeat(k.length);
  return `${k.slice(0, 6)}${"•".repeat(Math.max(4, k.length - 10))}${k.slice(-4)}`;
}

function AdminAiKeysPage() {
  const { user } = useAppUser();
  const [rows, setRows] = useState<ProviderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showId, setShowId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [logs, setLogs] = useState<Array<{
    id: string; action: string; provider: string | null; model: string | null;
    label: string | null; api_key_masked: string | null; created_at: string; actor_id: string | null;
  }>>([]);
  const testKey = useServerFn(testAiKeyServer);
  const [form, setForm] = useState({
    provider: "gemini",
    model: "gemini-2.0-flash",
    api_key: "",
    label: "",
    priority: 10,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.isDeveloper) {
      void load();
      void loadLogs();
    }
  }, [user?.isDeveloper]);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("ai_providers")
      .select("*")
      .order("provider", { ascending: true })
      .order("priority", { ascending: true });
    if (error) toast.error(error.message);
    setRows((data ?? []) as ProviderRow[]);
    setLoading(false);
  }

  async function loadLogs() {
    const { data, error } = await supabase
      .from("ai_provider_audit_log")
      .select("id, action, provider, model, label, api_key_masked, created_at, actor_id")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return;
    setLogs((data ?? []) as typeof logs);
  }

  async function runTest(row: ProviderRow) {
    setTestingId(row.id);
    try {
      const res = await testKey({
        data: { provider: row.provider, model: row.model ?? undefined, api_key: row.api_key },
      });
      if (res.ok) toast.success(`✓ ${res.message}`);
      else toast.error(`✗ ${res.status}: ${res.message}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal test");
    } finally {
      setTestingId(null);
    }
  }

  async function addKey() {
    if (!form.api_key.trim()) {
      toast.error("API key wajib diisi");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("ai_providers").insert({
      user_id: user!.userId,
      provider: form.provider.trim().toLowerCase(),
      model: form.model.trim() || "default",
      api_key: form.api_key.trim(),
      label: form.label.trim() || null,
      priority: form.priority,
      is_active: true,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("API key ditambahkan");
    setForm({ ...form, api_key: "", label: "" });
    void load();
    void loadLogs();
  }

  async function toggleActive(row: ProviderRow) {
    const { error } = await supabase
      .from("ai_providers")
      .update({ is_active: !row.is_active })
      .eq("id", row.id);
    if (error) return toast.error(error.message);
    void load();
    void loadLogs();
  }

  async function removeKey(row: ProviderRow) {
    if (!confirm(`Hapus key ${row.label || row.provider}?`)) return;
    const { error } = await supabase.from("ai_providers").delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("Terhapus");
    void load();
    void loadLogs();
  }

  if (!user?.isDeveloper) {
    return (
      <AppShell title="Admin AI Keys" subtitle="Developer Only" user={user}>
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

  return (
    <AppShell
      title="Admin AI Keys"
      subtitle="Kelola API key Gemini & provider AI lain (global untuk semua user)"
      user={user}
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-6 backdrop-blur-md">
          <div className="mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-bold">Tambah API Key</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
            <select
              value={form.provider}
              onChange={(e) => setForm({ ...form, provider: e.target.value })}
              className="md:col-span-1 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
            >
              <option value="gemini">gemini</option>
              <option value="openai">openai</option>
              <option value="anthropic">anthropic</option>
              <option value="lovable">lovable</option>
            </select>
            <input
              placeholder="model (mis. gemini-2.0-flash)"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              className="md:col-span-2 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
            />
            <input
              placeholder="API key"
              value={form.api_key}
              onChange={(e) => setForm({ ...form, api_key: e.target.value })}
              className="md:col-span-2 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm font-mono"
            />
            <input
              type="number"
              placeholder="prio"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
              className="md:col-span-1 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
            />
            <input
              placeholder="label (opsional)"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="md:col-span-5 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
            />
            <button
              onClick={addKey}
              disabled={saving}
              className="md:col-span-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Simpan
            </button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Ambil key Gemini gratis di{" "}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline"
            >
              aistudio.google.com/apikey
            </a>
            . Prioritas lebih kecil = dipakai lebih dulu.
          </p>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-6 backdrop-blur-md">
          <div className="mb-4 flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-bold">Daftar API Key</h2>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Memuat…
            </div>
          ) : rows.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">Belum ada key. Tambahkan di atas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-white/10 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Provider</th>
                    <th className="px-3 py-2 text-left">Model</th>
                    <th className="px-3 py-2 text-left">Key</th>
                    <th className="px-3 py-2 text-left">Label</th>
                    <th className="px-3 py-2 text-center">Prio</th>
                    <th className="px-3 py-2 text-center">Status</th>
                    <th className="px-3 py-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-white/5">
                      <td className="px-3 py-2 font-mono">{r.provider}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.model || "-"}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <code className="rounded bg-black/40 px-2 py-1 text-xs">
                            {showId === r.id ? r.api_key : mask(r.api_key)}
                          </code>
                          <button
                            onClick={() => setShowId(showId === r.id ? null : r.id)}
                            className="text-muted-foreground hover:text-white"
                          >
                            {showId === r.id ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{r.label || "-"}</td>
                      <td className="px-3 py-2 text-center">{r.priority ?? "-"}</td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            r.is_active
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-white/10 text-muted-foreground"
                          }`}
                        >
                          {r.is_active ? "aktif" : "nonaktif"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => toggleActive(r)}
                            title={r.is_active ? "Nonaktifkan" : "Aktifkan"}
                            className="text-muted-foreground hover:text-primary"
                          >
                            <Power className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => removeKey(r)}
                            className="text-red-400 hover:text-red-300"
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
          )}
        </div>
      </div>
    </AppShell>
  );
}