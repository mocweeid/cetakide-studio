import { createFileRoute } from "@tanstack/react-router";
import { AppShell, useAppUser } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Search, User, Coins, Edit2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/manage-users")({
  component: ManageUsersPage,
});

type Profile = {
  id: string;
  username: string;
  saldo: number;
  avatar_url: string | null;
};

function ManageUsersPage() {
  const { user } = useAppUser();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    setLoading(true);
    const { data } = await supabase.from("profiles").select("id, username, saldo, avatar_url");
    setProfiles((data as Profile[]) ?? []);
    setLoading(false);
  }

  // Filter pencarian
  const filtered = profiles.filter(p => 
    p.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell title="Manajemen User" subtitle="Kontrol penuh data pengguna" user={user}>
      <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-6 backdrop-blur-md">
        
        {/* Header & Pencarian */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="font-display text-lg font-semibold text-white">Daftar Pengguna</h2>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari username..."
              className="rounded-xl border border-white/10 bg-black/40 pl-9 pr-4 py-2 text-sm focus:border-primary focus:outline-none"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Tabel */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Saldo</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5">
                    <td className="px-4 py-3 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-white/10 overflow-hidden">
                        {p.avatar_url ? <img src={p.avatar_url} className="h-full w-full object-cover" /> : <User className="h-full w-full p-1.5" />}
                      </div>
                      <span className="font-medium text-white">{p.username}</span>
                    </td>
                    <td className="px-4 py-3 text-emerald-400 font-mono">
                      Rp {p.saldo.toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="rounded-lg p-2 hover:bg-white/10 text-primary">
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
