import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, useAppUser } from "@/components/app-shell";
import {
  Bell,
  Mail,
  MessageCircle,
  Monitor,
  Smartphone,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [{ title: "Notifikasi — CetakIde" }, { name: "robots", content: "noindex" }],
  }),
  component: NotificationsPage,
});

const NOTIFICATION_TYPES = [
  {
    category: "Aktivitas Akun",
    items: [
      {
        id: "login",
        label: "Login baru dari perangkat berbeda",
        email: true,
        push: true,
        wa: false,
      },
      { id: "topup_success", label: "Top up saldo berhasil", email: true, push: true, wa: true },
      {
        id: "saldo_rendah",
        label: "Saldo hampir habis (< 5.000 koin)",
        email: true,
        push: true,
        wa: true,
      },
    ],
  },
  {
    category: "Generate & Proyek",
    items: [
      {
        id: "generate_done",
        label: "Visual selesai di-generate",
        email: false,
        push: true,
        wa: false,
      },
      { id: "bulk_done", label: "Generate massal selesai", email: true, push: true, wa: true },
      {
        id: "generate_gagal",
        label: "Generate gagal atau error",
        email: true,
        push: true,
        wa: false,
      },
    ],
  },
  {
    category: "Tim & Kolaborasi",
    items: [
      {
        id: "invite_team",
        label: "Undangan tim diterima/ditolak",
        email: true,
        push: true,
        wa: false,
      },
      { id: "member_join", label: "Anggota baru bergabung", email: true, push: false, wa: false },
    ],
  },
  {
    category: "Billing & Langganan",
    items: [
      { id: "invoice_ready", label: "Invoice baru tersedia", email: true, push: false, wa: false },
      {
        id: "plan_expire",
        label: "Paket akan segera habis (7 hari)",
        email: true,
        push: true,
        wa: true,
      },
      { id: "payment_fail", label: "Pembayaran gagal", email: true, push: true, wa: true },
    ],
  },
  {
    category: "Promosi & Update",
    items: [
      { id: "promo", label: "Promosi dan diskon eksklusif", email: false, push: false, wa: false },
      { id: "fitur_baru", label: "Fitur baru tersedia", email: true, push: true, wa: false },
    ],
  },
];

type Settings = Record<string, { email: boolean; push: boolean; wa: boolean }>;

function NotificationsPage() {
  const { user } = useAppUser();
  const [waNumber, setWaNumber] = useState("08xxxxxxxxxx");
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [waNotif, setWaNotif] = useState(false);
  const [settings, setSettings] = useState<Settings>(() => {
    const s: Settings = {};
    NOTIFICATION_TYPES.forEach((cat) =>
      cat.items.forEach((item) => {
        s[item.id] = { email: item.email, push: item.push, wa: item.wa };
      }),
    );
    return s;
  });

  function toggleSetting(id: string, channel: "email" | "push" | "wa") {
    setSettings((prev) => ({ ...prev, [id]: { ...prev[id], [channel]: !prev[id][channel] } }));
  }

  function saveSettings() {
    toast.success("Preferensi notifikasi berhasil disimpan!");
  }

  const Toggle = ({ active, onClick }: { active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${active ? "bg-primary" : "bg-white/20"}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${active ? "translate-x-4.5" : "translate-x-0.5"}`}
      />
    </button>
  );

  return (
    <AppShell
      title="Pengaturan Notifikasi"
      subtitle="Atur bagaimana dan kapan Anda menerima notifikasi"
      user={user}
    >
      <div className="space-y-4">
        {/* Channel Settings */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-6 backdrop-blur-md">
          <h3 className="mb-4 font-display text-sm font-semibold">Saluran Notifikasi</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                label: "Email",
                icon: Mail,
                active: emailNotif,
                setter: setEmailNotif,
                color: "#3b82f6",
                desc: user ? String(user.userId).slice(0, 8) + "…@mail.com" : "email@contoh.com",
              },
              {
                label: "Browser Push",
                icon: Monitor,
                active: pushNotif,
                setter: setPushNotif,
                color: "#8b5cf6",
                desc: "Notifikasi langsung di browser",
              },
              {
                label: "WhatsApp",
                icon: MessageCircle,
                active: waNotif,
                setter: setWaNotif,
                color: "#25D366",
                desc: waNumber,
              },
            ].map(({ label, icon: Icon, active, setter, color, desc }) => (
              <div
                key={label}
                className={`rounded-2xl border p-4 transition ${active ? "border-primary/30 bg-primary/5" : "border-white/10 bg-white/[0.02]"}`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-xl"
                      style={{ background: color + "22" }}
                    >
                      <Icon className="h-4 w-4" style={{ color }} />
                    </div>
                    <span className="text-sm font-semibold">{label}</span>
                  </div>
                  <Toggle active={active} onClick={() => setter(!active)} />
                </div>
                <p className="text-[10px] text-muted-foreground">{desc}</p>
                {label === "WhatsApp" && (
                  <input
                    value={waNumber}
                    onChange={(e) => setWaNumber(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-xs focus:border-primary/50 focus:outline-none"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Notification Settings Table */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-6 backdrop-blur-md">
          <h3 className="mb-4 font-display text-sm font-semibold">
            Preferensi per Tipe Notifikasi
          </h3>
          <div className="space-y-6">
            {NOTIFICATION_TYPES.map((cat) => (
              <div key={cat.category}>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {cat.category}
                </p>
                <div className="space-y-1">
                  {cat.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-white/[0.02] px-3 py-3 hover:bg-white/5"
                    >
                      <span className="text-xs font-medium text-white/80">{item.label}</span>
                      <div className="flex items-center gap-4 shrink-0">
                        {[
                          { channel: "email" as const, label: "Email", enabled: emailNotif },
                          { channel: "push" as const, label: "Push", enabled: pushNotif },
                          { channel: "wa" as const, label: "WA", enabled: waNotif },
                        ].map(({ channel, label, enabled }) => (
                          <div key={channel} className="flex flex-col items-center gap-1">
                            <span className="text-[9px] text-muted-foreground">{label}</span>
                            {enabled ? (
                              <Toggle
                                active={settings[item.id]?.[channel] ?? false}
                                onClick={() => toggleSetting(item.id, channel)}
                              />
                            ) : (
                              <span title="Saluran nonaktif">
                                <XCircle className="h-4 w-4 text-white/20" />
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-black transition hover:brightness-110"
            style={{ background: "linear-gradient(135deg, #EAB308, #CA8A04)" }}
          >
            <CheckCircle2 className="h-4 w-4" /> Simpan Preferensi
          </button>
        </div>
      </div>
    </AppShell>
  );
}
