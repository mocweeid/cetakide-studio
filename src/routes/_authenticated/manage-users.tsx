import { createFileRoute } from "@tanstack/react-router";
import { AppShell, useAppUser } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useRef } from "react";
import { Edit2, Plus, X, Upload, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/manage-users")({
  component: ManageUsersPage,
});

function ManageUsersPage() {
  const { user } = useAppUser();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<any>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  async function loadProfiles() {
    const { data } = await supabase.from("profiles").select("*");
    setProfiles(data || []);
  }

  return (
    <AppShell title="Manajemen User" subtitle="Kontrol penuh data pengguna" user={user}>
      <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-6 backdrop-blur-md">
        <button
          onClick={() => setEditingUser({ isNew: true })}
          className="mb-6 flex items-center gap-2 bg-primary px-4 py-2 rounded-lg text-sm font-bold text-black"
        >
          <Plus className="h-4 w-4" /> Tambah User
        </button>

        <table className="w-full text-sm">
          <thead className="text-muted-foreground border-b border-white/10">
            <tr>
              <th className="px-4 py-3 text-left">Username</th>
              <th className="px-4 py-3 text-left">Saldo</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id} className="border-b border-white/5">
                <td className="px-4 py-3 flex items-center gap-2">
                  <img
                    src={p.avatar_url || "/avatar-default.png"}
                    className="h-8 w-8 rounded-full bg-white/10"
                  />
                  {p.username}
                </td>
                <td className="px-4 py-3">Rp {p.saldo?.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setEditingUser(p)}
                    className="text-primary hover:text-white"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <UserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onRefresh={loadProfiles}
        />
      )}
    </AppShell>
  );
}

function UserModal({ user, onClose, onRefresh }: any) {
  const [form, setForm] = useState(user);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const { data } = await supabase.storage.from("avatars").upload(fileName, file);
    if (data) {
      const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(fileName);
      setForm({ ...form, avatar_url: publicUrl.publicUrl });
    }
    setUploading(false);
  };

  const save = async () => {
    await supabase
      .from("profiles")
      .update({
        username: form.username,
        saldo: form.saldo,
        avatar_url: form.avatar_url,
      })
      .eq("id", user.id);
    toast.success("Berhasil disimpan!");
    onRefresh();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-sm bg-black border border-white/20 p-6 rounded-2xl space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-bold">Edit Data</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {/* Upload Foto */}
        <div className="flex flex-col items-center gap-2">
          <img
            src={form.avatar_url || "/avatar-default.png"}
            className="h-20 w-20 rounded-full bg-white/5 object-cover"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-xs text-primary flex items-center gap-1"
          >
            {uploading ? (
              <Loader2 className="animate-spin h-3 w-3" />
            ) : (
              <Upload className="h-3 w-3" />
            )}{" "}
            Upload Foto
          </button>
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleUpload} />
        </div>

        <input
          className="w-full p-2 bg-white/5 rounded border border-white/10"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          placeholder="Username"
        />
        <input
          className="w-full p-2 bg-white/5 rounded border border-white/10"
          type="number"
          value={form.saldo}
          onChange={(e) => setForm({ ...form, saldo: Number(e.target.value) })}
          placeholder="Saldo"
        />

        {/* Email & Password (ReadOnly untuk UI ini) */}
        <div className="opacity-50 space-y-2">
          <input
            className="w-full p-2 bg-white/5 rounded border border-white/10"
            value={user.email || "Email tidak tersedia"}
            disabled
          />
          <input
            className="w-full p-2 bg-white/5 rounded border border-white/10"
            type="password"
            value="********"
            disabled
          />
        </div>

        <button
          onClick={save}
          className="w-full bg-primary text-black py-2 rounded font-bold flex justify-center items-center gap-2"
        >
          <Save className="h-4 w-4" /> Simpan Perubahan
        </button>
      </div>
    </div>
  );
}
