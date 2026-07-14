import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, useAppUser } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { Key, Plus, Trash2, CheckCircle2, XCircle, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/api-keys")({
  head: () => ({
    meta: [{ title: "API Keys OpenAI — Cetak Ide" }, { name: "robots", content: "noindex" }],
  }),
  component: ApiKeysPage,
});

type Row = {
  id: string;
  label: string | null;
  provider: string;
  model: string;
  api_key: string;
  is_active: boolean;
  last_status: string | null;
  last_used_at: string | null;
  failure_count: number;
  created_at: string;
};

function mask(k: string) {
  if (!k) return "";
  if (k.length <= 12) return "•".repeat(k.length);
  return `${k.slice(0, 6)}${"•".repeat(Math.max(4, k.length - 10))}${k.slice(-4)}`;
}

function ApiKeysPage() {
  const { user } = useAppUser();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [label, setLabel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-image-1");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("ai_providers")
      .select("id,label,provider,model,api_key,is_active,last_status,last_used_at,failure_count,created_at")
      .ilike("provider", "openai")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as Row[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function addKey() {
    if (!apiKey.trim().startsWith("sk-")) {
      toast.error("API key OpenAI biasanya diawali sk-...");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("ai_providers").insert({
      user_id: user!.userId,
      provider: "openai",
      model: model || "gpt-image-1",
      api_key: apiKey.trim(),
      label: label.trim() || "OpenAI",
      is_active: true,
      priority: 10,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("API key OpenAI tersimpan. Sekarang bisa generate gambar!");
    setApiKey(""); setLabel("");
    void load();
  }

  async function toggle(row: Row) {
    const { error } = await supabase
      .from("ai_providers")
      .update({ is_active: !row.is_active })
      .eq("id", row.id);
    if (error) return toast.error(error.message);
    void load();
  }

  async function remove(row: Row) {
    if (!confirm(`Hapus key "${row.label ?? "OpenAI"}"?`)) return;
    const { error } = await supabase.from("ai_providers").delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("Key dihapus");
    void load();
  }

  return (
    <AppShell title="API Keys OpenAI" subtitle="Hubungkan API key OpenAI pribadi Anda untuk generate gambar" user={user}>
      <div className="space-y-4">
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm text-white/80">
          <p className="mb-2 font-semibold text-primary">Wajib: pasang API key OpenAI dulu</p>
          <p className="text-xs leading-relaxed">
            Semua request generate gambar di Workspace dikirim langsung ke OpenAI memakai key Anda —
            tidak ada biaya dari Cetak Ide. Dapatkan key gratis di{" "}
            <a
              className="inline-flex items-center gap-1 text-primary underline"
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noreferrer"
            >
              platform.openai.com/api-keys <ExternalLink className="h-3 w-3" />
            </a>
            . Aktifkan billing dan model <code>gpt-image-1</code> di akun OpenAI Anda.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Plus className="h-4 w-4" /> Tambah API Key OpenAI
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Label (mis. Akun Utama)"
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm placeholder:text-white/30 focus:border-primary/50 focus:outline-none"
            />
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Model (gpt-image-1)"
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm placeholder:text-white/30 focus:border-primary/50 focus:outline-none"
            />
            <input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              type="password"
              className="sm:col-span-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 font-mono text-sm placeholder:text-white/30 focus:border-primary/50 focus:outline-none"
            />
          </div>
          <button
            onClick={addKey}
            disabled={saving}
            className="mt-3 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #EAB308, #CA8A04)" }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Simpan Key
          </button>
        </div>

        <div className="space-y-3">
          <h3 className="font-display text-sm font-semibold">Key Aktif</h3>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div>
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/40">
              Belum ada API key. Tambahkan di atas untuk mulai generate gambar.
            </div>
          ) : rows.map((k) => (
            <div key={k.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <p className="font-display text-sm font-bold">{k.label || "OpenAI"}</p>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/60">{k.model}</span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        k.is_active ? "bg-green-500/15 text-green-400" : "bg-white/10 text-white/40"
                      }`}
                    >
                      {k.is_active ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {k.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                    {k.last_status && (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/60">
                        Status: {k.last_status}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-black/30 px-3 py-2 font-mono text-xs">
                    <Key className="h-3.5 w-3.5 text-primary" />
                    <span className="truncate text-white/70">{mask(k.api_key)}</span>
                  </div>
                  {k.last_used_at && (
                    <p className="mt-2 text-[10px] text-white/40">
                      Terakhir dipakai: {new Date(k.last_used_at).toLocaleString("id-ID")}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggle(k)}
                    className="rounded-xl border border-white/10 px-3 py-2 text-xs text-white/60 hover:bg-white/10 hover:text-white"
                  >
                    {k.is_active ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                  <button
                    onClick={() => remove(k)}
                    className="rounded-xl border border-white/10 p-2 text-white/40 hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}