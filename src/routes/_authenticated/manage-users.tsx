import { createFileRoute } from "@tanstack/react-router";
import { AppShell, useAppUser } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Edit2, Plus, X } from "lucide-react";
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
    const { data, error } = await supabase.from("profiles").select("*");
    if (error) {
      console.error("Gagal ambil data:", error);
      toast.error("Gagal memuat daftar user");
    } else {
      setProfiles(data || []);
    }
  }

  return (
    <AppShell title="Manajemen User" subtitle="Kontrol data pengguna" user={user}>
      <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-6 backdrop-blur-md">
        <button 
          onClick={() => setEditingUser({ isNew: true })} 
          className="mb-6 flex items-center gap-2 bg-primary px-4 py-2 rounded-lg text-sm font-bold text-black"
        >
          <Plus className="h-4 w-4" /> Tambah User
        </button>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-muted-foreground border-b border-white/10">
              <tr>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Saldo</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id} className="border-b border-white/5">
                  <td className="px-4 py-3">{p.username}</td>
                  <td className="px-4 py-3">Rp {p.saldo?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setEditingUser(p)} className="text-primary hover:text-white">
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingUser && (
        <EditModal 
          user={editingUser} 
          onClose={() => setEditingUser(null)} 
          onRefresh={loadProfiles} 
        />
      )}
    </AppShell>
  );
}

function EditModal({ user, onClose, onRefresh }: { user: any, onClose: () => void, onRefresh: () => void }) {
  const [username, setUsername] = useState(user.username || "");
  const [saldo, setSaldo] = useState(user.saldo || 0);

  const handleSave = async () => {
    if (user.isNew) {
        toast.info("Fitur tambah user memerlukan setup Auth API.");
        return;
    }
    const { error } = await supabase.from("profiles").update({ username, saldo }).eq("id", user.id);
    if (error) toast.error("Gagal simpan");
    else {
      toast.success("Berhasil diupdate");
      onRefresh();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-sm bg-black border border-white/20 p-6 rounded-2xl">
        <div className="flex justify-between mb-4">
            <h2 className="font-bold">Edit User</h2>
            <button onClick={onClose}><X className="h-5 w-5"/></button>
        </div>
        <input className="w-full p-2 mb-3 bg-white/5 rounded border border-white/10" value={username} onChange={e => setUsername(e.target.value)} />
        <input className="w-full p-2 mb-3 bg-white/5 rounded border border-white/10" type="number" value={saldo} onChange={e => setSaldo(Number(e.target.value))} />
        <button onClick={handleSave} className="w-full bg-primary text-black py-2 rounded font-bold">Simpan</button>
      </div>
    </div>
  );
}
