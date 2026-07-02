import { createFileRoute } from "@tanstack/react-router";
import { AppShell, useAppUser } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useRef } from "react";
import { Edit2, Plus, X as XIcon, Save, Loader2, Upload, User } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/manage-users")({
  component: ManageUsersPage,
});

function ManageUsersPage() {
  const { user } = useAppUser();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  useEffect(() => { fetchProfiles(); }, []);

  async function fetchProfiles() {
    const { data } = await supabase.from("profiles").select("*");
    setProfiles(data ?? []);
  }

  return (
    <AppShell title="Manajemen User" subtitle="Kontrol penuh akun pengguna" user={user}>
      <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-6 backdrop-blur-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display text-lg font-semibold text-white">Daftar Pengguna</h2>
          <button 
            onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
            className="bg-primary px-4 py-2 rounded-xl text-sm font-semibold text-black hover:bg-primary/90"
          >
            <Plus className="inline h-4 w-4 mr-1" /> Tambah User
          </button>
        </div>

        <table className="w-full text-sm">
          <thead className="text-muted-foreground border-b border-white/10">
            <tr>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Level</th>
              <th className="px-4 py-3 text-left">Saldo</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id} className="border-b border-white/5">
                <td className="px-4 py-3 flex items-center gap-3">
                    <img src={p.avatar_url || ""} className="h-8 w-8 rounded-full bg-white/10 object-cover" />
                    {p.username}
                </td>
                <td className="px-4 py-3 capitalize">{p.role || 'user'}</td>
                <td className="px-4 py-3">Rp {p.saldo?.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => { setEditingUser(p); setIsModalOpen(true); }} className="text-primary hover:text-white">
                    <Edit2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <UserModal user={editingUser} onClose={() => setIsModalOpen(false)} onSuccess={() => { setIsModalOpen(false); fetchProfiles(); }} />
      )}
    </AppShell>
  );
}

function UserModal({ user, onClose, onSuccess }: { user: any, onClose: () => void, onSuccess: () => void }) {
  const [form, setForm] = useState(user || { username: "", saldo: 0, role: "user", avatar_url: "" });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setForm({ ...form, avatar_url: data.publicUrl });
    }
    setUploading(false);
  };

  const saveUser = async () => {
    if (user) {
      await supabase.from("profiles").update(form).eq("id", user.id);
      toast.success("Profil diupdate!");
    } else {
      toast.info("Fitur tambah user via Dashboard membutuhkan Edge Function.");
    }
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-black p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">{user ? "Edit User" : "Tambah User"}</h3>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded"><XIcon className="h-5 w-5"/></button>
        </div>
        
        {/* Drag & Drop Area */}
        <div 
            className="border-2 border-dashed border-white/20 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition"
            onClick={() => fileInputRef.current?.click()}
        >
            {uploading ? <Loader2 className="animate-spin"/> : form.avatar_url ? <img src={form.avatar_url} className="h-16 w-16 rounded-full object-cover"/> : <Upload className="h-8 w-8 text-muted-foreground" />}
            <span className="text-xs mt-2 text-muted-foreground">Klik untuk upload foto</span>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleUpload} />
        </div>

        <input className="w-full p-2 bg-white/5 rounded-lg border border-white/10" placeholder="Username" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
        <input className="w-full p-2 bg-white/5 rounded-lg border border-white/10" placeholder="Saldo" type="number" value={form.saldo} onChange={e => setForm({...form, saldo: Number(e.target.value)})} />
        
        <select className="w-full p-2 bg-white/5 rounded-lg border border-white/10" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
            <option value="user">User</option>
            <option value="developer">Developer</option>
        </select>
        
        <button onClick={saveUser} className="w-full bg-primary text-black py-2 rounded-lg font-bold">Simpan Perubahan</button>
      </div>
    </div>
  );
}
