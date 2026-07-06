import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, useAppUser } from "@/components/app-shell";
import { Key, Plus, Copy, Eye, EyeOff, Trash2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/api-keys")({
  head: () => ({
    meta: [{ title: "API Keys — Cetak Ide" }, { name: "robots", content: "noindex" }],
  }),
  component: ApiKeysPage,
});

function generateKey() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "ck_live_";
  for (let i = 0; i < 48; i++) key += chars[Math.floor(Math.random() * chars.length)];
  return key;
}

const INIT_KEYS = [
  {
    id: "1",
    name: "Production Key",
    key: "ck_live_9sK2mXpQ4nRwVjTbLhD7eAuF3cGiYoZ8",
    created: "2026-01-15",
    lastUsed: "2 jam lalu",
    status: "aktif",
    permissions: ["generate", "read"],
  },
  {
    id: "2",
    name: "Test Key",
    key: "ck_test_7fRmPxNw2vQjYbKhD5eAuL4cGsZoX1Mk",
    created: "2026-03-10",
    lastUsed: "5 hari lalu",
    status: "aktif",
    permissions: ["generate", "read", "write"],
  },
  {
    id: "3",
    name: "Webhook Integration",
    key: "ck_live_3aZxMpKw8nRjVbThD2eAuF6cGsYoQ7Lm",
    created: "2026-05-20",
    lastUsed: "Tidak pernah",
    status: "nonaktif",
    permissions: ["read"],
  },
];

function ApiKeysPage() {
  const { user } = useAppUser();
  const [keys, setKeys] = useState(INIT_KEYS);
  const [showForm, setShowForm] = useState(false);
  const [revealId, setRevealId] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPerms, setNewKeyPerms] = useState<string[]>(["generate", "read"]);

  function togglePerm(perm: string) {
    setNewKeyPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  }

  function createKey() {
    if (!newKeyName.trim()) {
      toast.error("Masukkan nama API key!");
      return;
    }
    const newKey = {
      id: String(Date.now()),
      name: newKeyName,
      key: generateKey(),
      created: new Date().toISOString().split("T")[0],
      lastUsed: "Tidak pernah",
      status: "aktif",
      permissions: newKeyPerms,
    };
    setKeys((prev) => [newKey, ...prev]);
    setNewKeyName("");
    setShowForm(false);
    setRevealId(newKey.id);
    toast.success("API Key baru berhasil dibuat!");
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    toast.success("API Key disalin ke clipboard!");
  }

  function deleteKey(id: string) {
    setKeys((prev) => prev.filter((k) => k.id !== id));
    toast.success("API Key dihapus.");
  }

  function toggleStatus(id: string) {
    setKeys((prev) =>
      prev.map((k) =>
        k.id === id ? { ...k, status: k.status === "aktif" ? "nonaktif" : "aktif" } : k,
      ),
    );
    toast.success("Status API Key diperbarui.");
  }

  const PERMS = [
    { id: "generate", label: "Generate Visual", desc: "Buat visual baru via API" },
    { id: "read", label: "Read Data", desc: "Baca data project & aset" },
    { id: "write", label: "Write Data", desc: "Ubah data project & aset" },
    { id: "billing", label: "Billing Info", desc: "Akses info tagihan (hanya baca)" },
  ];

  return (
    <AppShell title="API Keys" subtitle="Kelola kunci API untuk integrasi eksternal" user={user}>
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total API Keys", value: keys.length.toString() },
            { label: "Aktif", value: keys.filter((k) => k.status === "aktif").length.toString() },
            {
              label: "Nonaktif",
              value: keys.filter((k) => k.status === "nonaktif").length.toString(),
            },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 sm:p-4 text-center backdrop-blur-md"
            >
              <p className="font-display text-xl sm:text-2xl font-bold text-primary">{value}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Header & Button */}
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold">Daftar API Keys</h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-black transition hover:brightness-110"
            style={{ background: "linear-gradient(135deg, #EAB308, #CA8A04)" }}
          >
            <Plus className="h-4 w-4" /> Buat API Key
          </button>
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5 backdrop-blur-md">
            <h4 className="mb-4 text-sm font-semibold">Buat API Key Baru</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-medium text-muted-foreground">
                  Nama Key
                </label>
                <input
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Misal: Mobile App Key, Webhook Key..."
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm placeholder:text-white/30 focus:border-primary/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-muted-foreground">
                  Izin (Permissions)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PERMS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => togglePerm(p.id)}
                      className={`rounded-xl border px-3 py-2 text-left text-[10px] transition ${newKeyPerms.includes(p.id) ? "border-primary/60 bg-primary/10" : "border-white/10 hover:border-white/30"}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`h-3 w-3 rounded border ${newKeyPerms.includes(p.id) ? "border-primary bg-primary" : "border-white/30"}`}
                        />
                        <span className="font-medium">{p.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-white/60 hover:bg-white/10"
              >
                Batal
              </button>
              <button
                onClick={createKey}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-black"
                style={{ background: "linear-gradient(135deg, #EAB308, #CA8A04)" }}
              >
                Buat API Key
              </button>
            </div>
          </div>
        )}

        {/* Keys List */}
        <div className="space-y-3">
          {keys.map((k) => (
            <div
              key={k.id}
              className={`rounded-2xl border backdrop-blur-md p-4 sm:p-5 ${k.status === "aktif" ? "border-white/10 bg-white/[0.04]" : "border-white/5 bg-white/[0.02]"}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <p className="font-display text-sm font-bold text-white">{k.name}</p>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${k.status === "aktif" ? "bg-green-500/15 text-green-400" : "bg-white/10 text-white/40"}`}
                    >
                      {k.status === "aktif" ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {k.status === "aktif" ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>

                  {/* Key Value */}
                  <div className="flex items-center gap-2 rounded-xl bg-black/30 px-3 py-2 font-mono text-xs">
                    <Key className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="flex-1 truncate text-white/70">
                      {revealId === k.id
                        ? k.key
                        : k.key.slice(0, 20) + "●●●●●●●●●●●●●●●●●●●●●●●●●●"}
                    </span>
                    <button
                      onClick={() => setRevealId(revealId === k.id ? null : k.id)}
                      className="shrink-0 text-muted-foreground hover:text-white"
                    >
                      {revealId === k.id ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => copyKey(k.key)}
                      className="shrink-0 text-muted-foreground hover:text-white"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Metadata */}
                  <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Dibuat:{" "}
                      {new Date(k.created).toLocaleDateString("id-ID")}
                    </span>
                    <span>Terakhir digunakan: {k.lastUsed}</span>
                    <span className="flex flex-wrap gap-1">
                      {k.permissions.map((p) => (
                        <span
                          key={p}
                          className="rounded-full bg-white/10 px-1.5 py-0.5 text-white/60"
                        >
                          {p}
                        </span>
                      ))}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => toggleStatus(k.id)}
                    className="rounded-xl border border-white/10 px-3 py-2 text-xs text-muted-foreground hover:bg-white/10 hover:text-white"
                  >
                    {k.status === "aktif" ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                  <button
                    onClick={() => deleteKey(k.id)}
                    className="rounded-xl border border-white/10 p-2 text-white/40 hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Usage Docs */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5 backdrop-blur-md">
          <h3 className="mb-3 font-display text-sm font-semibold">Contoh Penggunaan API</h3>
          <div className="overflow-x-auto rounded-xl bg-black/50 p-4">
            <pre className="text-[11px] text-green-400 whitespace-pre">
              {`curl -X POST https://api.cetakide.com/v1/generate \\
  -H "Authorization: Bearer ck_live_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "Banner sneakers premium hitam",
    "platform": "instagram",
    "ratio": "1:1"
  }'`}
            </pre>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
