import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, useAppUser } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Image as ImageIcon, Plus, Trash2, X, Loader2, Pencil } from "lucide-react";

export const Route = createFileRoute("/_authenticated/references")({
  head: () => ({
    meta: [{ title: "Manajemen Referensi — Cetak Ide" }, { name: "robots", content: "noindex" }],
  }),
  component: ReferencesPage,
});

type RefRow = {
  id: string;
  title: string;
  category: string | null;
  image_url: string | null;
  notes: string | null;
  created_at: string;
};

const CATEGORIES = ["Kuliner", "Fashion", "Otomotif", "Properti", "Jasa", "Lainnya"];

function ReferencesPage() {
  const { user } = useAppUser();
  const [rows, setRows] = useState<RefRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    category: CATEGORIES[0],
    image_url: "",
    notes: "",
  });

  async function refresh() {
    if (!user?.userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("references_lib")
      .select("*")
      .eq("user_id", user.userId)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data ?? []) as RefRow[]);
    setLoading(false);
  }

  useEffect(() => {
    if (user?.userId) void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId]);

  function openAdd() {
    setEditingId(null);
    setForm({ title: "", category: CATEGORIES[0], image_url: "", notes: "" });
    setOpen(true);
  }

  function openEdit(r: RefRow) {
    setEditingId(r.id);
    setForm({
      title: r.title,
      category: r.category ?? CATEGORIES[0],
      image_url: r.image_url ?? "",
      notes: r.notes ?? "",
    });
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.userId) return;
    if (!form.title.trim()) return toast.error("Judul wajib diisi.");
    setSaving(true);
    const payload = {
      user_id: user.userId,
      title: form.title.trim(),
      category: form.category,
      image_url: form.image_url.trim() || null,
      notes: form.notes.trim() || null,
    };
    const { error } = editingId
      ? await supabase.from("references_lib").update(payload).eq("id", editingId)
      : await supabase.from("references_lib").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editingId ? "Referensi diperbarui." : "Referensi ditambahkan.");
    setOpen(false);
    void refresh();
  }

  async function remove(r: RefRow) {
    if (!confirm(`Hapus referensi "${r.title}"?`)) return;
    const { error } = await supabase.from("references_lib").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Referensi dihapus.");
    void refresh();
  }

  return (
    <AppShell title="Manajemen Referensi" subtitle="Koleksi referensi tema Anda" user={user}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ImageIcon className="h-4 w-4 text-primary" />
          <span>{rows.length} referensi</span>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 rounded-lg gradient-gold px-3 py-2 text-sm font-semibold text-black hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Tambah Referensi
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Preview</th>
                <th className="px-4 py-3 text-left">Judul</th>
                <th className="px-4 py-3 text-left">Kategori</th>
                <th className="px-4 py-3 text-left">Catatan</th>
                <th className="px-4 py-3 text-left">Ditambahkan</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    Belum ada referensi. Klik <span className="text-primary">Tambah Referensi</span>{" "}
                    untuk memulai.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="h-12 w-12 overflow-hidden rounded-lg border border-white/10 bg-black/40">
                      {r.image_url ? (
                        <img
                          src={r.image_url}
                          alt={r.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <ImageIcon className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{r.title}</td>
                  <td className="px-4 py-3">
                    {r.category ? (
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs">
                        {r.category}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="max-w-[240px] truncate px-4 py-3 text-muted-foreground">
                    {r.notes || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("id-ID", { dateStyle: "medium" })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <button
                        onClick={() => openEdit(r)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => remove(r)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary/15 hover:text-secondary"
                        title="Hapus"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0a0a0a] p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">
                {editingId ? "Edit Referensi" : "Tambah Referensi"}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-1 text-muted-foreground hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                  Judul
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                  Kategori
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                  URL Gambar
                </label>
                <input
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                  Catatan
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg gradient-gold py-2.5 text-sm font-semibold text-black disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingId ? "Simpan Perubahan" : "Simpan Referensi"}
            </button>
          </form>
        </div>
      )}
    </AppShell>
  );
}
