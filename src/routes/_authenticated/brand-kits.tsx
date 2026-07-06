import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, useAppUser } from "@/components/app-shell";
import { Palette, Plus, Trash2, CheckCircle2, Edit2, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/brand-kits")({
  head: () => ({
    meta: [{ title: "Brand Kit — Cetak Ide" }, { name: "robots", content: "noindex" }],
  }),
  component: BrandKitsPage,
});

const INIT_BRANDS = [
  {
    id: "1",
    name: "Sneaker Studio",
    colors: ["#EAB308", "#0A0F1E", "#FFFFFF", "#CA8A04", "#F5F5F5"],
    font: "Plus Jakarta Sans",
    active: true,
    logo: "/assets/logo-preset/logo-11.png",
  },
  {
    id: "2",
    name: "Kuliner Nusantara",
    colors: ["#DC2626", "#F97316", "#FBBF24", "#78350F", "#FEF3C7"],
    font: "Inter",
    active: false,
    logo: "/assets/logo-preset/logo-12.png",
  },
  {
    id: "3",
    name: "Properti Prima",
    colors: ["#1E40AF", "#3B82F6", "#BFDBFE", "#0F172A", "#F8FAFC"],
    font: "Outfit",
    active: false,
    logo: "/assets/logo-preset/logo-13.png",
  },
];

function BrandKitsPage() {
  const { user } = useAppUser();
  const [brands, setBrands] = useState(INIT_BRANDS);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", font: "Inter" });
  const [colors, setColors] = useState(["#EAB308", "#FFFFFF", "#0A0F1E", "#CA8A04", "#F5F5F5"]);

  function saveBrand() {
    if (!form.name.trim()) {
      toast.error("Masukkan nama brand!");
      return;
    }

    if (editingId) {
      setBrands((prev) =>
        prev.map((b) =>
          b.id === editingId
            ? {
                ...b,
                name: form.name,
                font: form.font,
                colors,
                logo: form.name.charAt(0).toUpperCase(),
              }
            : b,
        ),
      );
      toast.success("Brand Kit diperbarui!");
    } else {
      setBrands((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          name: form.name,
          colors,
          font: form.font,
          active: false,
          logo: form.name.charAt(0).toUpperCase(),
        },
      ]);
      toast.success("Brand Kit berhasil ditambahkan!");
    }
    closeForm();
  }

  function closeForm() {
    setShowForm(false);
    setForm({ name: "", font: "Inter" });
    setColors(["#EAB308", "#FFFFFF", "#0A0F1E", "#CA8A04", "#F5F5F5"]);
    setEditingId(null);
  }

  function openEdit(brand: (typeof INIT_BRANDS)[0]) {
    setForm({ name: brand.name, font: brand.font });
    setColors(brand.colors);
    setEditingId(brand.id);
    setShowForm(true);
  }

  function duplicateBrand(brand: (typeof INIT_BRANDS)[0]) {
    setBrands((prev) => [
      ...prev,
      {
        ...brand,
        id: String(Date.now()),
        name: `${brand.name} (Copy)`,
        active: false,
      },
    ]);
    toast.success("Brand Kit diduplikasi!");
  }

  function setActive(id: string) {
    setBrands((prev) => prev.map((b) => ({ ...b, active: b.id === id })));
    toast.success("Brand Kit diaktifkan!");
  }

  function deleteBrand(id: string) {
    setBrands((prev) => prev.filter((b) => b.id !== id));
    toast.success("Brand Kit dihapus.");
  }

  return (
    <AppShell
      title="Brand Kit"
      subtitle="Simpan dan kelola identitas visual brand Anda"
      user={user}
    >
      <div className="space-y-4">
        {/* Header Action */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {brands.length} Brand Kit tersimpan · {brands.filter((b) => b.active).length} aktif
            </p>
          </div>
          <button
            onClick={() => {
              setForm({ name: "", font: "Inter" });
              setColors(["#EAB308", "#FFFFFF", "#0A0F1E", "#CA8A04", "#F5F5F5"]);
              setEditingId(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-black transition hover:brightness-110"
            style={{ background: "linear-gradient(135deg, #EAB308, #CA8A04)" }}
          >
            <Plus className="h-4 w-4" /> Tambah Brand Kit
          </button>
        </div>

        {/* Brand Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <div
              key={brand.id}
              className={`rounded-2xl border p-5 backdrop-blur-md transition ${brand.active ? "border-primary/60 bg-primary/5" : "border-white/10 bg-white/[0.04]"}`}
            >
              {/* Brand Header */}
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl text-xl font-bold text-black"
                    style={{ background: brand.colors[0] }}
                  >
                    {brand.logo.startsWith("/") ? (
                      <img src={brand.logo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      brand.logo
                    )}
                  </div>
                  <div>
                    <p className="font-display font-semibold text-white">{brand.name}</p>
                    <p className="text-xs text-muted-foreground">{brand.font}</p>
                  </div>
                </div>
                {brand.active && (
                  <span className="flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    <CheckCircle2 className="h-3 w-3" /> Aktif
                  </span>
                )}
              </div>

              {/* Color Palette */}
              <div className="mb-4">
                <p className="mb-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Palet Warna
                </p>
                <div className="flex gap-2">
                  {brand.colors.map((color, i) => (
                    <div key={i} className="group relative">
                      <div
                        className="h-8 w-8 rounded-lg border border-white/10 shadow-sm transition group-hover:scale-110"
                        style={{ background: color }}
                      />
                      <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] text-muted-foreground opacity-0 group-hover:opacity-100">
                        {color}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Font Preview */}
              <div className="mb-4 rounded-xl bg-white/5 px-3 py-2">
                <p className="text-[10px] text-muted-foreground">Font Preview:</p>
                <p className="text-base font-bold" style={{ fontFamily: brand.font }}>
                  {brand.name}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {!brand.active && (
                  <button
                    onClick={() => setActive(brand.id)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 py-2 text-xs font-medium text-primary hover:bg-primary/20"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Aktifkan
                  </button>
                )}
                <button
                  onClick={() => openEdit(brand)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs text-white/60 hover:bg-white/10 hover:text-white"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => duplicateBrand(brand)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs text-white/60 hover:bg-white/10 hover:text-white"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => deleteBrand(brand.id)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs text-white/60 hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Add New Card */}
          <button
            onClick={() => {
              setForm({ name: "", font: "Inter" });
              setColors(["#EAB308", "#FFFFFF", "#0A0F1E", "#CA8A04", "#F5F5F5"]);
              setEditingId(null);
              setShowForm(true);
            }}
            className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] text-muted-foreground transition hover:border-primary/30 hover:text-white"
          >
            <Plus className="h-8 w-8" />
            <span className="text-sm">Tambah Brand Kit Baru</span>
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#111] p-6">
              <h3 className="mb-5 font-display text-lg font-bold">
                {editingId ? "Edit Brand Kit" : "Tambah Brand Kit Baru"}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Nama Brand
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Masukkan nama brand Anda..."
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm placeholder:text-white/30 focus:border-primary/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Font Utama
                  </label>
                  <select
                    value={form.font}
                    onChange={(e) => setForm((f) => ({ ...f, font: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm focus:border-primary/50 focus:outline-none"
                  >
                    {[
                      "Inter",
                      "Plus Jakarta Sans",
                      "Outfit",
                      "Roboto",
                      "Poppins",
                      "Montserrat",
                    ].map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium text-muted-foreground">
                    Palet Warna (5 warna)
                  </label>
                  <div className="flex gap-2">
                    {colors.map((c, i) => (
                      <div key={i} className="flex flex-1 flex-col items-center gap-1">
                        <input
                          type="color"
                          value={c}
                          onChange={(e) =>
                            setColors((prev) =>
                              prev.map((col, idx) => (idx === i ? e.target.value : col)),
                            )
                          }
                          className="h-10 w-full cursor-pointer rounded-lg border border-white/10 bg-transparent"
                        />
                        <span className="text-[9px] text-muted-foreground">{i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={closeForm}
                    className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-white/70 hover:bg-white/10"
                  >
                    Batal
                  </button>
                  <button
                    onClick={saveBrand}
                    className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-black"
                    style={{ background: "linear-gradient(135deg, #EAB308, #CA8A04)" }}
                  >
                    {editingId ? "Perbarui" : "Simpan Brand Kit"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
