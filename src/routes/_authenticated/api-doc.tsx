import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, useAppUser } from "@/components/app-shell";
import { toast } from "sonner";
import { FileCode, Copy, KeyRound, Terminal } from "lucide-react";

export const Route = createFileRoute("/_authenticated/api-doc")({
  head: () => ({ meta: [{ title: "API Doc — CetakIde" }, { name: "robots", content: "noindex" }] }),
  component: ApiDocPage,
});

type Endpoint = {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  title: string;
  desc: string;
  body?: string;
  response?: string;
};

const BASE_URL = "https://api.cetakide.com/v1";

const ENDPOINTS: Endpoint[] = [
  {
    method: "POST",
    path: "/generate",
    title: "Generate Konten",
    desc: "Menghasilkan gambar iklan berdasarkan prompt dan konfigurasi platform.",
    body: `{
  "prompt": "Sepatu sneakers premium hitam...",
  "platform": "instagram",
  "aspect_ratio": "1:1",
  "hd": true
}`,
    response: `{
  "id": "prj_9f2a...",
  "status": "queued",
  "image_url": null
}`,
  },
  {
    method: "GET",
    path: "/projects",
    title: "List Riwayat Project",
    desc: "Mengambil daftar project yang pernah dibuat user.",
    response: `{ "data": [ { "id": "prj_...", "status": "sukses", "image_url": "https://..." } ] }`,
  },
  {
    method: "GET",
    path: "/balance",
    title: "Cek Saldo",
    desc: "Mengambil saldo aktif user yang berautentikasi.",
    response: `{ "saldo": 65000 }`,
  },
  {
    method: "POST",
    path: "/topup",
    title: "Buat Transaksi Top Up",
    desc: "Membuat invoice top up saldo. Nominal harus kelipatan Rp 10.000.",
    body: `{ "nominal": 50000 }`,
    response: `{ "invoice_id": "TX-...", "checkout_url": "https://..." }`,
  },
];

const METHOD_COLOR: Record<Endpoint["method"], string> = {
  GET: "bg-green-500/15 text-green-400",
  POST: "bg-primary/20 text-primary",
  PATCH: "bg-yellow-500/15 text-yellow-400",
  DELETE: "bg-secondary/15 text-secondary",
};

function ApiDocPage() {
  const { user } = useAppUser();
  const [active, setActive] = useState(0);
  const ep = ENDPOINTS[active];

  async function copy(v: string) {
    await navigator.clipboard.writeText(v);
    toast.success("Disalin ke clipboard.");
  }

  const curl = `curl -X ${ep.method} '${BASE_URL}${ep.path}' \\
  -H 'Authorization: Bearer YOUR_API_KEY' \\
  -H 'Content-Type: application/json'${ep.body ? ` \\\n  -d '${ep.body.replace(/\n\s*/g, " ")}'` : ""}`;

  return (
    <AppShell title="API Doc" subtitle="Dokumentasi REST API CetakIde" user={user}>
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.04] p-4 backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Terminal className="h-4 w-4 text-primary" /> Base URL
        </div>
        <code className="flex-1 rounded-lg bg-black/50 px-3 py-1.5 font-mono text-sm">
          {BASE_URL}
        </code>
        <button
          onClick={() => copy(BASE_URL)}
          className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs hover:bg-white/10"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs text-primary">
          <KeyRound className="h-3.5 w-3.5" /> Bearer {"{API_KEY}"}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-2xl border border-white/15 bg-white/[0.04] p-3 backdrop-blur-md">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Endpoints
          </p>
          <div className="space-y-1">
            {ENDPOINTS.map((e, i) => (
              <button
                key={e.path}
                onClick={() => setActive(i)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                  i === active
                    ? "bg-white/10 text-foreground"
                    : "text-muted-foreground hover:bg-white/5"
                }`}
              >
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${METHOD_COLOR[e.method]}`}
                >
                  {e.method}
                </span>
                <span className="truncate font-mono text-xs">{e.path}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className={`rounded px-2 py-0.5 text-xs font-bold ${METHOD_COLOR[ep.method]}`}>
              {ep.method}
            </span>
            <code className="font-mono text-sm">{ep.path}</code>
          </div>
          <h2 className="mt-3 flex items-center gap-2 font-display text-lg font-semibold">
            <FileCode className="h-4 w-4 text-primary" /> {ep.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{ep.desc}</p>

          {ep.body && (
            <div className="mt-5">
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Request Body
                </p>
                <button
                  onClick={() => copy(ep.body!)}
                  className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] hover:bg-white/10"
                >
                  <Copy className="mr-1 inline h-3 w-3" /> Copy
                </button>
              </div>
              <pre className="overflow-x-auto rounded-lg border border-white/10 bg-black/50 p-3 font-mono text-xs">
                {ep.body}
              </pre>
            </div>
          )}

          {ep.response && (
            <div className="mt-5">
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Response
                </p>
                <button
                  onClick={() => copy(ep.response!)}
                  className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] hover:bg-white/10"
                >
                  <Copy className="mr-1 inline h-3 w-3" /> Copy
                </button>
              </div>
              <pre className="overflow-x-auto rounded-lg border border-white/10 bg-black/50 p-3 font-mono text-xs">
                {ep.response}
              </pre>
            </div>
          )}

          <div className="mt-5">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              cURL
            </p>
            <pre className="overflow-x-auto rounded-lg border border-white/10 bg-black/50 p-3 font-mono text-xs">
              {curl}
            </pre>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
