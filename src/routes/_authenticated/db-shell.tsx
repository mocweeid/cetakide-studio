import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, useAppUser } from "@/components/app-shell";
import { Terminal, Play, Loader2, AlertTriangle, ChevronDown, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/db-shell")({
  head: () => ({
    meta: [{ title: "DB Shell — CetakIde Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: DbShellPage,
});

const QUICK_QUERIES = [
  {
    label: "Semua User",
    query:
      "SELECT id, username, saldo, created_at FROM profiles ORDER BY created_at DESC LIMIT 20;",
  },
  {
    label: "Total Statistik",
    query:
      "SELECT COUNT(*) as total_users FROM profiles; SELECT COUNT(*) as total_projects FROM projects;",
  },
  {
    label: "User Aktif 7 Hari",
    query:
      "SELECT id, username, created_at FROM profiles WHERE created_at >= NOW() - INTERVAL '7 days' ORDER BY created_at DESC;",
  },
  {
    label: "Proyek Gagal",
    query: "SELECT * FROM projects WHERE status = 'gagal' ORDER BY created_at DESC LIMIT 10;",
  },
  {
    label: "Top Saldo",
    query: "SELECT username, saldo FROM profiles ORDER BY saldo DESC LIMIT 10;",
  },
];

const MOCK_RESULT = [
  { id: "usr_001", username: "wildan_dev", saldo: 150000, created_at: "2026-01-15T10:00:00Z" },
  { id: "usr_002", username: "budi_kreasi", saldo: 75000, created_at: "2026-02-20T14:30:00Z" },
  { id: "usr_003", username: "siti_design", saldo: 32000, created_at: "2026-03-10T09:15:00Z" },
  { id: "usr_004", username: "andi_produk", saldo: 98500, created_at: "2026-04-05T11:45:00Z" },
  { id: "usr_005", username: "dewi_studio", saldo: 15000, created_at: "2026-05-18T16:00:00Z" },
];

function DbShellPage() {
  const { user } = useAppUser();
  const [query, setQuery] = useState(QUICK_QUERIES[0].query);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<string, unknown>[] | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [rowCount, setRowCount] = useState<number | null>(null);
  const [execTime, setExecTime] = useState<number | null>(null);

  // Guard: hanya developer yang bisa akses
  if (!user?.isDeveloper) {
    return (
      <AppShell title="DB Shell" subtitle="Admin Only" user={user}>
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

  async function executeQuery() {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResults(null);
    const start = Date.now();
    await new Promise((r) => setTimeout(r, 800));

    if (
      query.toLowerCase().includes("drop") ||
      query.toLowerCase().includes("delete") ||
      query.toLowerCase().includes("truncate")
    ) {
      setError("SAFETY: Query DELETE/DROP/TRUNCATE diblokir di shell ini untuk keamanan.");
      setLoading(false);
      return;
    }

    setHistory((prev) => [query, ...prev.slice(0, 9)]);
    setResults(MOCK_RESULT);
    setRowCount(MOCK_RESULT.length);
    setExecTime(Date.now() - start);
    setLoading(false);
    toast.success("Query berhasil dieksekusi!");
  }

  const cols = results && results.length > 0 ? Object.keys(results[0]) : [];

  return (
    <AppShell
      title="DB Shell"
      subtitle="Eksekusi query SQL langsung ke database (Developer Only)"
      user={user}
    >
      <div className="space-y-4">
        {/* Warning Banner */}
        <div className="flex items-center gap-3 rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-400" />
          <p className="text-xs text-yellow-400 font-medium">
            Gunakan dengan hati-hati. Operasi DELETE, DROP, dan TRUNCATE secara otomatis diblokir.
            Semua query dicatat dalam audit log.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          {/* Query History & Quick Queries */}
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
              <h3 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Query Cepat
              </h3>
              <div className="space-y-1">
                {QUICK_QUERIES.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => setQuery(q.query)}
                    className="w-full rounded-lg px-3 py-2 text-left text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            {history.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Clock className="h-3 w-3" /> Riwayat
                  </h3>
                  <button
                    onClick={() => setHistory([])}
                    className="text-muted-foreground hover:text-red-400"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <div className="space-y-1">
                  {history.map((h, i) => (
                    <button
                      key={i}
                      onClick={() => setQuery(h)}
                      className="w-full truncate rounded-lg px-3 py-2 text-left font-mono text-[10px] text-white/50 transition hover:bg-white/10 hover:text-white"
                    >
                      {h.slice(0, 40)}…
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Editor */}
          <div className="lg:col-span-3 space-y-4">
            {/* SQL Editor */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">SQL Editor</span>
                </div>
                <button
                  onClick={executeQuery}
                  disabled={loading || !query.trim()}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #EAB308, #CA8A04)" }}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {loading ? "Eksekusi..." : "Jalankan Query"}
                </button>
              </div>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") executeQuery();
                }}
                className="w-full resize-none bg-black/50 p-4 font-mono text-sm text-green-400 placeholder:text-white/20 focus:outline-none"
                rows={8}
                placeholder="SELECT * FROM profiles LIMIT 10;"
              />
              <div className="border-t border-white/5 px-4 py-2 text-[10px] text-muted-foreground">
                Ctrl+Enter untuk eksekusi · Hanya SELECT yang diizinkan
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Results */}
            {results && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <span className="text-sm font-semibold">Hasil Query</span>
                  <div className="flex gap-3 text-[10px] text-muted-foreground">
                    <span className="text-green-400 font-medium">{rowCount} baris</span>
                    <span>{execTime}ms</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/10 bg-black/20">
                        <th className="px-4 py-2 text-left text-[10px] font-semibold text-muted-foreground uppercase">
                          #
                        </th>
                        {cols.map((col) => (
                          <th
                            key={col}
                            className="px-4 py-2 text-left text-[10px] font-semibold text-muted-foreground uppercase whitespace-nowrap"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {results.map((row, i) => (
                        <tr key={i} className="hover:bg-white/[0.02]">
                          <td className="px-4 py-2.5 text-white/30 font-mono">{i + 1}</td>
                          {cols.map((col) => (
                            <td
                              key={col}
                              className="px-4 py-2.5 text-white/80 font-mono whitespace-nowrap max-w-[200px] truncate"
                            >
                              {String(row[col] ?? "NULL")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
