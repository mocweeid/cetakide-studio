import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, useAppUser } from "@/components/app-shell";
import { Webhook, Plus, Trash2, CheckCircle2, XCircle, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/webhooks")({
  head: () => ({
    meta: [{ title: "Webhook API — CetakIde" }, { name: "robots", content: "noindex" }],
  }),
  component: WebhooksPage,
});

const EVENTS = [
  {
    id: "generate.success",
    label: "Generate berhasil",
    desc: "Dipanggil ketika visual berhasil dibuat",
  },
  {
    id: "generate.failed",
    label: "Generate gagal",
    desc: "Dipanggil ketika generate mengalami error",
  },
  { id: "topup.success", label: "Top up berhasil", desc: "Saldo berhasil ditambahkan ke akun" },
  {
    id: "team.member_joined",
    label: "Anggota tim bergabung",
    desc: "Anggota baru menerima undangan",
  },
  { id: "project.deleted", label: "Proyek dihapus", desc: "Satu atau lebih proyek dihapus" },
  {
    id: "billing.payment_success",
    label: "Pembayaran berhasil",
    desc: "Invoice langganan terbayar",
  },
];

const INIT_WEBHOOKS = [
  {
    id: "1",
    name: "Notif ke Slack",
    url: "https://hooks.slack.com/services/T0xxx/Byyy/Zzzz",
    events: ["generate.success", "generate.failed"],
    status: "aktif",
    lastTriggered: "5 menit lalu",
    successRate: "98%",
  },
  {
    id: "2",
    name: "CRM Integration",
    url: "https://mycrm.example.com/webhooks/cetakide",
    events: ["topup.success", "billing.payment_success"],
    status: "nonaktif",
    lastTriggered: "2 hari lalu",
    successRate: "100%",
  },
];

function WebhooksPage() {
  const { user } = useAppUser();
  const [webhooks, setWebhooks] = useState(INIT_WEBHOOKS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", url: "", events: [] as string[] });

  function toggleEvent(eventId: string) {
    setForm((f) => ({
      ...f,
      events: f.events.includes(eventId)
        ? f.events.filter((e) => e !== eventId)
        : [...f.events, eventId],
    }));
  }

  function addWebhook() {
    if (!form.name || !form.url || form.events.length === 0) {
      toast.error("Lengkapi semua kolom dan pilih minimal 1 event!");
      return;
    }
    setWebhooks((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: form.name,
        url: form.url,
        events: form.events,
        status: "aktif",
        lastTriggered: "Belum pernah",
        successRate: "-",
      },
    ]);
    setForm({ name: "", url: "", events: [] });
    setShowForm(false);
    toast.success("Webhook berhasil ditambahkan!");
  }

  function deleteWebhook(id: string) {
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
    toast.success("Webhook dihapus.");
  }

  function testWebhook(id: string) {
    toast.success("Test payload dikirim ke webhook!");
  }

  function toggleStatus(id: string) {
    setWebhooks((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, status: w.status === "aktif" ? "nonaktif" : "aktif" } : w,
      ),
    );
    toast.success("Status webhook diperbarui.");
  }

  return (
    <AppShell
      title="Webhook API"
      subtitle="Integrasi real-time dengan aplikasi dan layanan eksternal"
      user={user}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{webhooks.length} webhook terkonfigurasi</p>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-black transition hover:brightness-110"
            style={{ background: "linear-gradient(135deg, #EAB308, #CA8A04)" }}
          >
            <Plus className="h-4 w-4" /> Tambah Webhook
          </button>
        </div>

        {/* Add Form */}
        {showForm && (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5 backdrop-blur-md">
            <h4 className="mb-4 text-sm font-semibold">Webhook Baru</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Nama Webhook
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Misal: Notif Slack, CRM Update..."
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm placeholder:text-white/30 focus:border-primary/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Endpoint URL
                </label>
                <input
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://yourapp.com/webhook"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm placeholder:text-white/30 focus:border-primary/50 focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="mb-2 block text-xs font-medium text-muted-foreground">
                Event yang Dipantau
              </label>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {EVENTS.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => toggleEvent(event.id)}
                    className={`flex items-start gap-2 rounded-xl border p-3 text-left transition ${form.events.includes(event.id) ? "border-primary/60 bg-primary/10" : "border-white/10 hover:border-white/30"}`}
                  >
                    <div
                      className={`mt-0.5 h-4 w-4 shrink-0 rounded border ${form.events.includes(event.id) ? "border-primary bg-primary" : "border-white/30"} flex items-center justify-center`}
                    >
                      {form.events.includes(event.id) && (
                        <CheckCircle2 className="h-2.5 w-2.5 text-black" />
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-white">{event.label}</p>
                      <p className="text-[10px] text-muted-foreground">{event.desc}</p>
                    </div>
                  </button>
                ))}
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
                onClick={addWebhook}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-black"
                style={{ background: "linear-gradient(135deg, #EAB308, #CA8A04)" }}
              >
                Simpan Webhook
              </button>
            </div>
          </div>
        )}

        {/* Webhook Cards */}
        <div className="space-y-3">
          {webhooks.map((wh) => (
            <div
              key={wh.id}
              className={`rounded-2xl border backdrop-blur-md p-4 sm:p-5 ${wh.status === "aktif" ? "border-white/10 bg-white/[0.04]" : "border-white/5 bg-white/[0.02] opacity-60"}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/20">
                      <Webhook className="h-4 w-4 text-primary" />
                    </div>
                    <p className="font-display text-sm font-bold text-white">{wh.name}</p>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${wh.status === "aktif" ? "bg-green-500/15 text-green-400" : "bg-white/10 text-white/40"}`}
                    >
                      {wh.status === "aktif" ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {wh.status === "aktif" ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                  <p className="mb-2 truncate font-mono text-xs text-muted-foreground">{wh.url}</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {wh.events.map((e) => (
                      <span
                        key={e}
                        className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] text-white/60"
                      >
                        {e}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-4 text-[10px] text-muted-foreground">
                    <span>Terakhir: {wh.lastTriggered}</span>
                    <span>Success rate: {wh.successRate}</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => testWebhook(wh.id)}
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs text-white/70 hover:bg-white/10 hover:text-white"
                  >
                    <Send className="h-3.5 w-3.5" /> Test
                  </button>
                  <button
                    onClick={() => toggleStatus(wh.id)}
                    className="rounded-xl border border-white/10 px-3 py-2 text-xs text-muted-foreground hover:bg-white/10 hover:text-white"
                  >
                    {wh.status === "aktif" ? "Pause" : "Aktifkan"}
                  </button>
                  <button
                    onClick={() => deleteWebhook(wh.id)}
                    className="rounded-xl border border-white/10 p-2 text-white/40 hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Webhook Payload Example */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5 backdrop-blur-md">
          <h3 className="mb-3 font-display text-sm font-semibold">Contoh Payload Webhook</h3>
          <div className="overflow-x-auto rounded-xl bg-black/50 p-4">
            <pre className="text-[11px] text-green-400 whitespace-pre">
              {`{
  "event": "generate.success",
  "timestamp": "2026-07-03T14:32:00Z",
  "data": {
    "project_id": "proj_abc123",
    "user_id": "user_xyz456",
    "platform": "instagram",
    "aspect_ratio": "1:1",
    "image_url": "https://cdn.cetakide.com/projects/...",
    "credits_used": 1000
  }
}`}
            </pre>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
