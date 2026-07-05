import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, useAppUser } from "@/components/app-shell";
import {
  CreditCard,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Settings,
  Eye,
  EyeOff,
  Save,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/payment-gateways")({
  head: () => ({
    meta: [{ title: "Payment Gateways — CetakIde Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: PaymentGatewaysPage,
});

const GATEWAYS = [
  {
    id: "midtrans",
    name: "Midtrans",
    logo: "🏦",
    desc: "Payment gateway lokal terpercaya — QRIS, VA, e-Wallet",
    enabled: true,
    methods: ["QRIS", "BCA VA", "Mandiri VA", "GoPay", "OVO"],
    color: "#0A5CB8",
    fields: [
      { key: "server_key", label: "Server Key", placeholder: "SB-Mid-server-xxxx", secret: true },
      { key: "client_key", label: "Client Key", placeholder: "SB-Mid-client-xxxx", secret: false },
      { key: "merchant_id", label: "Merchant ID", placeholder: "G123456789", secret: false },
    ],
  },
  {
    id: "xendit",
    name: "Xendit",
    logo: "⚡",
    desc: "Multi-currency payment untuk transaksi B2B & B2C",
    enabled: false,
    methods: ["Bank Transfer", "QRIS", "OVO", "DANA", "Credit Card"],
    color: "#5B50FF",
    fields: [
      { key: "secret_key", label: "Secret Key", placeholder: "xnd_development_xxxx", secret: true },
      { key: "public_key", label: "Public Key", placeholder: "xnd_public_xxxx", secret: false },
      { key: "webhook_token", label: "Webhook Token", placeholder: "xxx", secret: true },
    ],
  },
  {
    id: "stripe",
    name: "Stripe",
    logo: "💳",
    desc: "International credit/debit card payment",
    enabled: false,
    methods: ["Visa", "Mastercard", "Amex", "PayPal"],
    color: "#635BFF",
    fields: [
      { key: "secret_key", label: "Secret Key", placeholder: "sk_test_xxxx", secret: true },
      {
        key: "publishable_key",
        label: "Publishable Key",
        placeholder: "pk_test_xxxx",
        secret: false,
      },
      { key: "webhook_secret", label: "Webhook Secret", placeholder: "whsec_xxxx", secret: true },
    ],
  },
];

type GatewayConfig = Record<string, Record<string, string>>;
type ShowSecrets = Record<string, boolean>;

function PaymentGatewaysPage() {
  const { user } = useAppUser();
  const [gateways, setGateways] = useState(GATEWAYS);
  const [configs, setConfigs] = useState<GatewayConfig>({});
  const [showSecrets, setShowSecrets] = useState<ShowSecrets>({});

  if (!user?.isDeveloper) {
    return (
      <AppShell title="Payment Gateways" subtitle="Admin Only" user={user}>
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

  function toggleGateway(id: string) {
    setGateways((prev) => prev.map((g) => (g.id === id ? { ...g, enabled: !g.enabled } : g)));
    const gw = gateways.find((g) => g.id === id);
    toast.success(`${gw?.name} ${gw?.enabled ? "dinonaktifkan" : "diaktifkan"}!`);
  }

  function setConfig(gatewayId: string, field: string, value: string) {
    setConfigs((prev) => ({
      ...prev,
      [gatewayId]: { ...(prev[gatewayId] ?? {}), [field]: value },
    }));
  }

  function saveGateway(id: string) {
    toast.success(`Konfigurasi ${id} berhasil disimpan!`);
  }

  function toggleReveal(key: string) {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <AppShell
      title="Payment Gateways"
      subtitle="Kelola integrasi payment gateway untuk proses pembayaran (Developer Only)"
      user={user}
    >
      <div className="space-y-4">
        {/* Overview Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Gateway Aktif", value: gateways.filter((g) => g.enabled).length.toString() },
            { label: "Total Gateway", value: gateways.length.toString() },
            {
              label: "Metode Pembayaran",
              value: gateways
                .filter((g) => g.enabled)
                .flatMap((g) => g.methods)
                .length.toString(),
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

        {/* Gateway Cards */}
        {gateways.map((gw) => (
          <div
            key={gw.id}
            className={`rounded-2xl border backdrop-blur-md ${gw.enabled ? "border-white/10 bg-white/[0.04]" : "border-white/5 bg-white/[0.02] opacity-70"}`}
          >
            {/* Header */}
            <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
                  style={{ background: gw.color + "22" }}
                >
                  {gw.logo}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg font-bold text-white">{gw.name}</h3>
                    {gw.enabled ? (
                      <span className="flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-semibold text-green-400">
                        <CheckCircle2 className="h-3 w-3" /> Aktif
                      </span>
                    ) : (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/40">
                        Nonaktif
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{gw.desc}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleGateway(gw.id)}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${gw.enabled ? "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20" : "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"}`}
                >
                  {gw.enabled ? "Nonaktifkan" : "Aktifkan"}
                </button>
              </div>
            </div>

            {/* Methods & Config */}
            <div className="grid gap-6 p-4 sm:p-5 sm:grid-cols-2">
              {/* Payment Methods */}
              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground">
                  Metode Pembayaran
                </p>
                <div className="flex flex-wrap gap-2">
                  {gw.methods.map((method) => (
                    <span
                      key={method}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
                    >
                      {method}
                    </span>
                  ))}
                </div>
              </div>

              {/* API Keys */}
              <div>
                <p className="mb-3 text-xs font-semibold text-muted-foreground">Konfigurasi API</p>
                <div className="space-y-2">
                  {gw.fields.map((field) => {
                    const revealKey = `${gw.id}-${field.key}`;
                    const isRevealed = showSecrets[revealKey];
                    return (
                      <div key={field.key}>
                        <label className="mb-1 block text-[10px] font-medium text-muted-foreground">
                          {field.label}
                        </label>
                        <div className="flex gap-1">
                          <input
                            type={field.secret && !isRevealed ? "password" : "text"}
                            placeholder={field.placeholder}
                            value={configs[gw.id]?.[field.key] ?? ""}
                            onChange={(e) => setConfig(gw.id, field.key, e.target.value)}
                            className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs font-mono placeholder:text-white/20 focus:border-primary/50 focus:outline-none"
                          />
                          {field.secret && (
                            <button
                              onClick={() => toggleReveal(revealKey)}
                              className="rounded-xl border border-white/10 p-2 text-muted-foreground hover:bg-white/10 hover:text-white"
                            >
                              {isRevealed ? (
                                <EyeOff className="h-3.5 w-3.5" />
                              ) : (
                                <Eye className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <button
                    onClick={() => saveGateway(gw.name)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold text-black mt-2 transition hover:brightness-110"
                    style={{ background: "linear-gradient(135deg, #EAB308, #CA8A04)" }}
                  >
                    <Save className="h-3.5 w-3.5" /> Simpan Konfigurasi
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
