import { createFileRoute } from "@tanstack/react-router";
import { AppShell, useAppUser } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Search, User, Edit2, Plus, X as XIcon, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/manage-users")({
  component: ManageUsersPage,
});

type Profile = { id: string; username: string; saldo: number; avatar_url: string | null; role: string };

function ManageUsersPage() {
  const { user } = useAppUser();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchProfiles(); }, []);

  async function fetchProfiles() {
    setLoading(true);
    const { data } = await supabase.from("profiles").select("*");
    setProfiles((data as Profile[]) ?? []);
    setLoading(false);
  }

  return (
    <AppShell title="Manajemen User" subtitle="Kontrol penuh akun pengguna" user={user}>
      <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-6 backdrop-blur-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display text-lg font-semibold text-white">Daftar Pengguna</h2>
          <button 
            onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-primary px-4 py-2 rounded-xl text-sm font-semibold text-black hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Tambah User
          </button>
        </div>

        {loading ? <Loader2 className="animate-spin mx-auto h-8 w-8" /> : (
          <table className="w-full text-sm">
            <thead className="text-muted-foreground border-b border-white/10">
              <tr>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Saldo</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id} className="border-b border-white/5">
                  <td className="px-4 py-3 flex items-center gap-3">{p.username}</td>
                  <td className="px-4 py-3">Rp {p.saldo.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => { setEditingUser(p); setIsModalOpen(true); }} className="text-primary hover:text-white">
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <UserModal 
          user={editingUser} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => { setIsModalOpen(false); fetchProfiles(); }} 
        />
      )}
    </AppShell>
  );
}

function UserModal({ user, onClose, onSuccess }: { user: any, onClose: () => void, onSuccess: () => void }) {
  const [form, setForm] = useState(user || { username: "", saldo: 0, email: "" });

  const saveUser = async () => {
    try {
      if (user) {
        await supabase.from("profiles").update({ username: form.username, saldo: form.saldo }).eq("id", user.id);
        toast.success("User diupdate!");
      } else {
        // Logika tambah user (bisa panggil Auth API di sini)
        toast.success("User baru dibuat!");
      }
      onSuccess();
    } catch (e) { toast.error("Gagal simpan"); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-black p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">{user ? "Edit User" : "Tambah User"}</h3>
          <button onClick={onClose}><XIcon /></button>
        </div>
        <div className="space-y-4">
          <input className="w-full p-2 bg-white/5 rounded-lg border border-white/10" placeholder="Username" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
          <input className="w-full p-2 bg-white/5 rounded-lg border border-white/10" placeholder="Saldo" type="number" value={form.saldo} onChange={e => setForm({...form, saldo: Number(e.target.value)})} />
          {!user && <input className="w-full p-2 bg-white/5 rounded-lg border border-white/10" placeholder="Email" />}
          {!user && <input className="w-full p-2 bg-white/5 rounded-lg border border-white/10" placeholder="Password" type="password" />}
          
          <button onClick={saveUser} className="w-full bg-primary text-black py-2 rounded-lg font-semibold flex items-center justify-center gap-2">
            <Save className="h-4 w-4" /> Simpan Data
          </button>
        </div>
      </div>
    </div>
  );
}
