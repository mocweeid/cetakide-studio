import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, useAppUser } from "@/components/app-shell";
import { UserSquare2, Plus, Trash2, Edit2, Target, TrendingUp, DollarSign } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/personas")({
  head: () => ({
    meta: [{ title: "Persona Pembeli — Cetak Ide" }, { name: "robots", content: "noindex" }],
  }),
  component: PersonasPage,
});

const INIT_PERSONAS = [
  {
    id: "1",
    name: "Wanita Karir Muda",
    age: "22-30 tahun",
    occupation: "Karyawan / Freelancer",
    location: "Jakarta, Surabaya, Bandung",
    income: "Rp 5-15 Juta/bulan",
    interests: ["Fashion", "Skincare", "Coffee", "Travel"],
    painPoints: ["Waktu terbatas", "Ingin terlihat profesional", "Budget sadar"],
    goals: "Tampil percaya diri dengan budget efisien",
    platform: "Instagram, TikTok",
    emoji: "👩‍💼",
    color: "#E1306C",
  },
  {
    id: "2",
    name: "Pengusaha UMKM",
    age: "30-45 tahun",
    occupation: "Pemilik bisnis kecil",
    location: "Seluruh Indonesia",
    income: "Rp 10-50 Juta/bulan",
    interests: ["Bisnis", "Marketing", "Kuliner", "Networking"],
    painPoints: ["Butuh marketing efektif", "Keterbatasan desainer", "Persaingan tinggi"],
    goals: "Penjualan meningkat dengan konten visual profesional",
    platform: "Facebook, WhatsApp, Tokopedia",
    emoji: "🏪",
    color: "#EAB308",
  },
];

function PersonasPage() {
  const { user } = useAppUser();
  const [personas, setPersonas] = useState(INIT_PERSONAS);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<string | null>("1");
  const [form, setForm] = useState({
    name: "",
    age: "",
    occupation: "",
    location: "",
    income: "",
    goals: "",
    platform: "",
  });

  const selectedPersona = personas.find((p) => p.id === selected);

  function addPersona() {
    if (!form.name.trim()) {
      toast.error("Masukkan nama persona!");
      return;
    }
    const emojis = ["👤", "👩", "👨", "🧑‍💼", "👨‍💻", "👩‍🎨"];
    setPersonas((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        ...form,
        interests: [],
        painPoints: [],
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        color: ["#3b82f6", "#8b5cf6", "#10b981", "#f97316"][Math.floor(Math.random() * 4)],
      },
    ]);
    setShowForm(false);
    setForm({
      name: "",
      age: "",
      occupation: "",
      location: "",
      income: "",
      goals: "",
      platform: "",
    });
    toast.success("Persona berhasil ditambahkan!");
  }

  function deletePersona(id: string) {
    setPersonas((prev) => prev.filter((p) => p.id !== id));
    if (selected === id) setSelected(personas[0]?.id ?? null);
    toast.success("Persona dihapus.");
  }

  return (
    <AppShell
      title="Persona Pembeli"
      subtitle="Tentukan dan kelola profil target audiens pemasaran Anda"
      user={user}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Persona List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold">Daftar Persona</h3>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-black transition hover:brightness-110"
              style={{ background: "linear-gradient(135deg, #EAB308, #CA8A04)" }}
            >
              <Plus className="h-3.5 w-3.5" /> Tambah
            </button>
          </div>

          {/* Add Form */}
          {showForm && (
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 backdrop-blur-md">
              <h4 className="mb-3 text-sm font-semibold">Persona Baru</h4>
              <div className="space-y-2">
                {[
                  { key: "name", placeholder: "Nama persona (e.g., Wanita Karir)" },
                  { key: "age", placeholder: "Rentang usia (e.g., 22-30 tahun)" },
                  { key: "occupation", placeholder: "Pekerjaan" },
                  { key: "location", placeholder: "Lokasi" },
                  { key: "income", placeholder: "Penghasilan estimasi" },
                  { key: "platform", placeholder: "Platform media sosial" },
                  { key: "goals", placeholder: "Tujuan / goals utama" },
                ].map(({ key, placeholder }) => (
                  <input
                    key={key}
                    placeholder={placeholder}
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs placeholder:text-white/30 focus:border-primary/50 focus:outline-none"
                  />
                ))}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex-1 rounded-xl border border-white/10 py-2 text-xs text-white/60 hover:bg-white/10"
                  >
                    Batal
                  </button>
                  <button
                    onClick={addPersona}
                    className="flex-1 rounded-xl py-2 text-xs font-semibold text-black"
                    style={{ background: "linear-gradient(135deg, #EAB308, #CA8A04)" }}
                  >
                    Simpan
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Persona Cards */}
          {personas.map((persona) => (
            <button
              key={persona.id}
              onClick={() => setSelected(persona.id)}
              className={`w-full text-left rounded-2xl border p-4 backdrop-blur-md transition ${selected === persona.id ? "border-primary/60 bg-primary/5" : "border-white/10 bg-white/[0.04] hover:border-white/20"}`}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
                  style={{ background: persona.color + "22" }}
                >
                  {persona.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{persona.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {persona.age} · {persona.occupation}
                  </p>
                </div>
                {selected !== persona.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePersona(persona.id);
                    }}
                    className="text-muted-foreground hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Persona Detail */}
        {selectedPersona && (
          <div className="lg:col-span-2 space-y-4">
            {/* Header */}
            <div
              className="flex items-center gap-4 rounded-2xl border p-5 backdrop-blur-md"
              style={{
                borderColor: selectedPersona.color + "44",
                background: selectedPersona.color + "11",
              }}
            >
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl"
                style={{ background: selectedPersona.color + "22" }}
              >
                {selectedPersona.emoji}
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl font-bold">{selectedPersona.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedPersona.age} · {selectedPersona.occupation}
                </p>
                <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                  <Target className="h-3 w-3" /> {selectedPersona.platform}
                </p>
              </div>
              <button className="rounded-xl border border-white/10 p-2 text-muted-foreground hover:bg-white/10 hover:text-white">
                <Edit2 className="h-4 w-4" />
              </button>
            </div>

            {/* Details Grid */}
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Lokasi", value: selectedPersona.location, icon: Target },
                { label: "Penghasilan", value: selectedPersona.income, icon: DollarSign },
                { label: "Platform", value: selectedPersona.platform, icon: TrendingUp },
                { label: "Goals", value: selectedPersona.goals, icon: Target },
              ].map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md"
                >
                  <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </p>
                  <p className="text-sm font-medium text-white">{value}</p>
                </div>
              ))}
            </div>

            {/* Interests & Pain Points */}
            <div className="grid gap-3 sm:grid-cols-2">
              {selectedPersona.interests.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
                  <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Minat & Hobi
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedPersona.interests.map((interest) => (
                      <span
                        key={interest}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {selectedPersona.painPoints.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
                  <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Pain Points
                  </p>
                  <div className="space-y-2">
                    {selectedPersona.painPoints.map((pain) => (
                      <div key={pain} className="flex items-center gap-2 text-xs text-white/70">
                        <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                        {pain}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AI Insight */}
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5 backdrop-blur-md">
              <h4 className="mb-3 text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Insight Visual untuk Persona Ini
              </h4>
              <div className="grid gap-2 sm:grid-cols-2 text-xs text-muted-foreground">
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="font-medium text-white mb-1">Gaya Visual Disarankan</p>
                  <p>Minimalist dengan warna pastel, foto lifestyle, dan tipografi bersih.</p>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="font-medium text-white mb-1">Waktu Posting Optimal</p>
                  <p>Pagi (07:00-09:00) dan malam (19:00-21:00) di hari kerja.</p>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="font-medium text-white mb-1">Tone of Voice</p>
                  <p>Friendly, aspirasional, dan relatable. Hindari bahasa terlalu formal.</p>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="font-medium text-white mb-1">CTA yang Efektif</p>
                  <p>"Coba Sekarang", "Dapatkan Gratis", "Klaim Diskon" — pendek dan urgency.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
