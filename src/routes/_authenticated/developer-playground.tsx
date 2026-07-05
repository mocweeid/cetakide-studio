import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, useAppUser } from "@/components/app-shell";
import { Code2, Send, AlertTriangle, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/developer-playground")({
  head: () => ({
    meta: [
      { title: "API Playground — CetakIde Developer" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DeveloperPlaygroundPage,
});

const ENDPOINTS = [
  {
    method: "POST",
    path: "/v1/generate",
    desc: "Generate visual baru",
    defaultBody: JSON.stringify(
      { prompt: "Banner sneakers premium hitam", platform: "instagram", ratio: "1:1" },
      null,
      2,
    ),
    mockResponse: {
      success: true,
      data: {
        project_id: "proj_abc123",
        image_url: "https://cdn.cetakide.com/projects/abc123.jpg",
        credits_used: 1000,
      },
    },
  },
  {
    method: "GET",
    path: "/v1/projects",
    desc: "Daftar proyek user",
    defaultBody: "",
    mockResponse: {
      success: true,
      data: [{ id: "proj_abc123", status: "sukses", platform: "instagram" }],
      total: 1,
    },
  },
  {
    method: "GET",
    path: "/v1/profile",
    desc: "Profil & saldo user aktif",
    defaultBody: "",
    mockResponse: {
      success: true,
      data: { id: "usr_xyz", username: "wildan_dev", saldo: 150000, plan: "pro" },
    },
  },
  {
    method: "POST",
    path: "/v1/topup",
    desc: "Inisiasi top up saldo",
    defaultBody: JSON.stringify({ amount: 50000, method: "qris" }, null, 2),
    mockResponse: {
      success: true,
      data: {
        invoice_id: "INV-2026-0050",
        payment_url: "https://app.midtrans.com/snap/v2/vtweb/...",
      },
    },
  },
  {
    method: "DELETE",
    path: "/v1/projects/:id",
    desc: "Hapus proyek berdasarkan ID",
    defaultBody: "",
    mockResponse: { success: true, message: "Proyek berhasil dihapus" },
  },
  {
    method: "GET",
    path: "/v1/templates",
    desc: "Daftar template tersedia",
    defaultBody: "",
    mockResponse: {
      success: true,
      data: [{ id: "tmpl_001", name: "Sneaker Flash Sale", category: "instagram", premium: false }],
      total: 12,
    },
  },
];

function DeveloperPlaygroundPage() {
  const { user } = useAppUser();
  const [selectedEndpoint, setSelectedEndpoint] = useState(0);
  const [requestBody, setRequestBody] = useState(ENDPOINTS[0].defaultBody);
  const [apiKey, setApiKey] = useState("ck_live_YOUR_API_KEY");
  const [response, setResponse] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [execTime, setExecTime] = useState<number | null>(null);

  if (!user?.isDeveloper) {
    return (
      <AppShell title="API Playground" subtitle="Developer Only" user={user}>
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

  const ep = ENDPOINTS[selectedEndpoint];

  async function sendRequest() {
    setLoading(true);
    setResponse(null);
    const start = Date.now();
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 400));
    setResponse(ep.mockResponse);
    setStatusCode(200);
    setExecTime(Math.round(Date.now() - start));
    setLoading(false);
    toast.success("Request berhasil!");
  }

  function changeEndpoint(index: number) {
    setSelectedEndpoint(index);
    setRequestBody(ENDPOINTS[index].defaultBody);
    setResponse(null);
  }

  const METHOD_COLORS: Record<string, string> = {
    GET: "#10b981",
    POST: "#3b82f6",
    PUT: "#f59e0b",
    DELETE: "#ef4444",
    PATCH: "#8b5cf6",
  };

  return (
    <AppShell
      title="API Playground"
      subtitle="Uji coba semua endpoint API CetakIde secara interaktif (Developer Only)"
      user={user}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Endpoint List */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden backdrop-blur-md">
            <div className="border-b border-white/10 px-4 py-3">
              <h3 className="font-display text-sm font-semibold">Endpoints</h3>
            </div>
            <div className="divide-y divide-white/5">
              {ENDPOINTS.map((endpoint, i) => (
                <button
                  key={i}
                  onClick={() => changeEndpoint(i)}
                  className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition ${selectedEndpoint === i ? "bg-primary/10" : "hover:bg-white/[0.03]"}`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded px-1.5 py-0.5 text-[9px] font-bold"
                      style={{
                        background: (METHOD_COLORS[endpoint.method] ?? "#888") + "22",
                        color: METHOD_COLORS[endpoint.method],
                      }}
                    >
                      {endpoint.method}
                    </span>
                    <span className="font-mono text-xs text-white">{endpoint.path}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{endpoint.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Request & Response */}
        <div className="lg:col-span-2 space-y-4">
          {/* Request Config */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden backdrop-blur-md">
            {/* URL Bar */}
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
              <span
                className="rounded-lg px-2 py-1 text-xs font-bold"
                style={{
                  background: (METHOD_COLORS[ep.method] ?? "#888") + "22",
                  color: METHOD_COLORS[ep.method],
                }}
              >
                {ep.method}
              </span>
              <code className="flex-1 text-sm text-white/80">
                https://api.cetakide.com{ep.path}
              </code>
              <button
                onClick={sendRequest}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #EAB308, #CA8A04)" }}
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {loading ? "Mengirim..." : "Kirim"}
              </button>
            </div>

            {/* Headers */}
            <div className="border-b border-white/10 px-4 py-3">
              <p className="mb-2 text-[10px] font-semibold text-muted-foreground uppercase">
                Headers
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs font-mono">
                  <span className="text-muted-foreground">Authorization:</span>
                  <input
                    value={`Bearer ${apiKey}`}
                    onChange={(e) => setApiKey(e.target.value.replace("Bearer ", ""))}
                    className="flex-1 bg-transparent text-white focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs font-mono text-muted-foreground">
                  <span>Content-Type: application/json</span>
                </div>
              </div>
            </div>

            {/* Request Body */}
            {ep.defaultBody && (
              <div className="px-4 py-3">
                <p className="mb-2 text-[10px] font-semibold text-muted-foreground uppercase">
                  Request Body (JSON)
                </p>
                <textarea
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  rows={6}
                  className="w-full resize-none rounded-xl bg-black/50 p-3 font-mono text-xs text-green-400 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Response */}
          {(response || loading) && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-display text-sm font-semibold">Response</span>
                  {statusCode && (
                    <span className="flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-bold text-green-400">
                      <CheckCircle2 className="h-3 w-3" /> {statusCode} OK
                    </span>
                  )}
                </div>
                {execTime && (
                  <span className="text-[10px] text-muted-foreground">{execTime}ms</span>
                )}
              </div>
              <div className="p-4">
                {loading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Menunggu respons...
                  </div>
                ) : (
                  <pre className="overflow-x-auto font-mono text-xs text-green-400 whitespace-pre">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* cURL Example */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
            <h3 className="mb-3 font-display text-xs font-semibold flex items-center gap-2">
              <Code2 className="h-3.5 w-3.5 text-muted-foreground" /> Contoh cURL
            </h3>
            <div className="overflow-x-auto rounded-xl bg-black/50 p-3">
              <pre className="text-[11px] text-green-400 whitespace-pre">
                {`curl -X ${ep.method} https://api.cetakide.com${ep.path} \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json"${
    ep.defaultBody
      ? ` \\
  -d '${ep.defaultBody.replace(/\n/g, "")}'`
      : ""
  }`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
