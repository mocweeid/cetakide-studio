import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, useAppUser } from "@/components/app-shell";
import {
  HelpCircle,
  MessageCircle,
  Send,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/support")({
  head: () => ({
    meta: [{ title: "Pusat Bantuan — CetakIde" }, { name: "robots", content: "noindex" }],
  }),
  component: SupportPage,
});

const FAQS = [
  {
    category: "Saldo & Top Up",
    items: [
      {
        q: "Bagaimana cara top up saldo CetakIde?",
        a: "Kunjungi menu 'Top Up' di dashboard Anda. Kami menerima pembayaran via transfer bank (BCA, Mandiri, BNI), QRIS, GoPay, dan OVO.",
      },
      {
        q: "Berapa lama saldo masuk setelah transfer?",
        a: "Saldo biasanya masuk dalam 1-5 menit setelah konfirmasi pembayaran. Jika lebih dari 15 menit, hubungi support kami.",
      },
      {
        q: "Apakah saldo bisa dikembalikan (refund)?",
        a: "Saldo yang sudah masuk tidak dapat di-refund, namun akan terus tersimpan di akun Anda tanpa kadaluarsa.",
      },
    ],
  },
  {
    category: "Generate Visual",
    items: [
      {
        q: "Berapa biaya per satu generate visual?",
        a: "Satu generate visual membutuhkan Rp 1.000 (1 koin). Generate ulang 50% lebih murah.",
      },
      {
        q: "Kenapa hasil generate tidak sesuai prompt saya?",
        a: "Coba buat prompt lebih spesifik dan detail. Sertakan: objek utama, latar belakang, warna, suasana, dan gaya visual yang diinginkan.",
      },
      {
        q: "Apakah visual yang dihasilkan bebas royalti?",
        a: "Ya, semua visual yang dibuat dengan CetakIde adalah milik Anda dan dapat digunakan untuk keperluan komersial.",
      },
    ],
  },
  {
    category: "Akun & Langganan",
    items: [
      {
        q: "Bagaimana cara upgrade ke paket Pro?",
        a: "Kunjungi menu Billing dan klik tombol Upgrade Plan. Pilih paket yang sesuai dan lakukan pembayaran.",
      },
      {
        q: "Apakah ada uji coba gratis?",
        a: "Ya! Akun baru mendapatkan 10 generate gratis untuk mencoba layanan CetakIde.",
      },
      {
        q: "Bisakah saya membatalkan langganan kapan saja?",
        a: "Ya, Anda bisa membatalkan kapan saja. Langganan akan tetap aktif hingga akhir periode yang sudah dibayar.",
      },
    ],
  },
];

const TICKETS = [
  {
    id: "TKT-001",
    subject: "Generate visual gagal terus",
    status: "selesai",
    updated: "2026-07-01",
  },
  {
    id: "TKT-002",
    subject: "Saldo belum masuk setelah transfer",
    status: "proses",
    updated: "2026-07-03",
  },
];

function SupportPage() {
  const { user } = useAppUser();
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [form, setForm] = useState({ subject: "", category: "general", message: "" });
  const [submitting, setSubmitting] = useState(false);

  async function submitTicket() {
    if (!form.subject || !form.message) {
      toast.error("Lengkapi semua kolom!");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSubmitting(false);
    toast.success("Tiket berhasil dikirim! Kami akan merespons dalam 24 jam.");
    setForm({ subject: "", category: "general", message: "" });
  }

  return (
    <AppShell
      title="Pusat Bantuan"
      subtitle="Temukan jawaban atau hubungi tim support kami"
      user={user}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left: FAQ */}
        <div className="lg:col-span-2 space-y-4">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              {
                label: "Chat WhatsApp",
                icon: MessageCircle,
                color: "#25D366",
                href: "https://wa.me/6281234567890?text=Halo+CetakIde+Support",
              },
              { label: "Panduan Lengkap", icon: HelpCircle, color: "#3b82f6", href: "#" },
              { label: "Status Sistem", icon: CheckCircle2, color: "#10b981", href: "#" },
            ].map(({ label, icon: Icon, color, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-white/20 hover:bg-white/[0.07]"
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: color + "22" }}
                >
                  <Icon className="h-4 w-4" style={{ color }} />
                </div>
                <span className="text-sm font-medium">{label}</span>
              </a>
            ))}
          </div>

          {/* FAQ Accordion */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden backdrop-blur-md">
            <div className="border-b border-white/10 px-5 py-4">
              <h3 className="font-display text-sm font-semibold">Pertanyaan Umum (FAQ)</h3>
            </div>
            {FAQS.map((cat) => (
              <div key={cat.category} className="border-b border-white/5 last:border-b-0">
                <div className="px-5 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {cat.category}
                  </p>
                </div>
                {cat.items.map((faq, i) => {
                  const key = `${cat.category}-${i}`;
                  const isOpen = openFaq === key;
                  return (
                    <div key={key} className="border-t border-white/5">
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : key)}
                        className="flex w-full items-center justify-between px-5 py-3.5 text-left transition hover:bg-white/[0.02]"
                      >
                        <span className="text-sm font-medium text-white/90 pr-4">{faq.q}</span>
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 shrink-0 text-primary" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-4">
                          <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* My Tickets */}
          {TICKETS.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5 backdrop-blur-md">
              <h3 className="mb-4 font-display text-sm font-semibold">Tiket Saya</h3>
              <div className="space-y-2">
                {TICKETS.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${t.status === "selesai" ? "bg-green-500/20" : "bg-yellow-500/20"}`}
                    >
                      {t.status === "selesai" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{t.subject}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {t.id} · {new Date(t.updated).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${t.status === "selesai" ? "bg-green-500/15 text-green-400" : "bg-yellow-500/15 text-yellow-400"}`}
                    >
                      {t.status === "selesai" ? "Selesai" : "Proses"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Submit Ticket */}
        <div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5 backdrop-blur-md">
            <h3 className="mb-4 font-display text-sm font-semibold flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" /> Kirim Tiket Bantuan
            </h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Kategori
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm focus:border-primary/50 focus:outline-none"
                >
                  <option value="general">Pertanyaan Umum</option>
                  <option value="billing">Billing & Saldo</option>
                  <option value="generate">Masalah Generate</option>
                  <option value="account">Masalah Akun</option>
                  <option value="bug">Laporkan Bug</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Subjek
                </label>
                <input
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  placeholder="Deskripsikan masalah secara singkat..."
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm placeholder:text-white/30 focus:border-primary/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Detail Masalah
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="Jelaskan masalah Anda secara detail. Sertakan screenshot jika memungkinkan..."
                  rows={5}
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm placeholder:text-white/30 focus:border-primary/50 focus:outline-none"
                />
              </div>
              <button
                onClick={submitTicket}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #EAB308, #CA8A04)" }}
              >
                {submitting ? (
                  <Clock className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {submitting ? "Mengirim..." : "Kirim Tiket"}
              </button>
              <p className="text-center text-[10px] text-muted-foreground">
                Rata-rata respons dalam 2-4 jam kerja
              </p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
            <p className="text-xs font-semibold text-muted-foreground mb-3">Kontak Langsung</p>
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl bg-green-500/10 border border-green-500/20 p-3 transition hover:bg-green-500/15"
            >
              <MessageCircle className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-xs font-semibold text-green-400">WhatsApp Support</p>
                <p className="text-[10px] text-muted-foreground">
                  +62 812-3456-7890 · Sen-Jum 09:00-18:00
                </p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
