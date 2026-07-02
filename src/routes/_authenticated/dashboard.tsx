import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, useAppUser } from "@/components/app-shell";
import {
  Wallet,
  Check,
  X,
  AlertTriangle,
  MessageCircle,
  Wand2,
  Crown,
  PlusCircle,
  History as HistoryIcon,
  Sparkles,
  Users,
  Coins,
  Megaphone,
  Loader2,
  Save
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — CetakIde" },
      { name: "description", content: "Ringkasan akun & aktivitas CetakIde." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

type Project = {
  id: string;
  kebutuhan: string;
  image_url: string | null;
  aspect_ratio: string;
  platform: string;
  status: string;
  created_at: string;
};

// Tipe data untuk statistik khusus developer
type DevStats = {
  totalDeposit: number;
  totalGenerateAll: number;
  totalUsers: number;
};

function DashboardPage() {
  const { user } = useAppUser();
  const [projects, setProjects] = useState<Project[]>([]);
  
  // State data pengumuman
  const [announcement, setAnnouncement] = useState("");
  const [isEditingAnnounce, setIsEditingAnnounce] = useState(false);
  const [isSavingAnnounce, setIsSavingAnnounce] = useState(false);

  // State data statistik developer
  const [devStats, setDevStats] = useState<DevStats>({
    totalDeposit: 0,
    totalGenerateAll: 0,
    totalUsers: 0
  });
  const [loadingDevStats, setLoadingDevStats] = useState(false);

  useEffect(() => {
    if (!user) return;

    // 1. Ambil data project milik user aktif
    supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.userId)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setProjects((data ?? []) as Project[]));

    // 2. Ambil data pengumuman global
    supabase
      .from("announcements")
      .select("message")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setAnnouncement(data.message);
      });

    // 3. Jika yang login Developer, bongkar data statistik seluruh user
    if (user.isDeveloper) {
      setLoadingDevStats(true);
      Promise.all([
        supabase.from("profiles").select("saldo"), // Ambil semua saldo untuk di-SUM
        supabase.from("projects").select("id", { count: "exact", head: true }), // Hitung total baris projects
        supabase.from("profiles").select("id", { count: "exact", head: true }) // Hitung total baris users
      ]).then(([profilesRes, projectsCountRes, usersCountRes]) => {
        const totalDep = (profilesRes.data ?? []).reduce((sum, p) => sum + (p.saldo || 0), 0);
        setDevStats({
          totalDeposit: totalDep,
          totalGenerateAll: projectsCountRes.count ?? 0,
          totalUsers: usersCountRes.count ?? 0
        });
        setLoadingDevStats(false);
      }).catch(() => setLoadingDevStats(false));
    }
  }, [user]);

  // Fungsi khusus Developer untuk update teks pengumuman
  const handleUpdateAnnouncement = async () => {
    setIsSavingAnnounce(true);
    try {
      // Update data pengumuman di baris pertama atau buat baru jika kosong
      const { error } = await supabase
        .from("announcements")
        .insert([{ message: announcement }]) // Menyuntikkan versi terbaru ke baris atas
        
      if (error) throw error;
      toast.success("Pengumuman berhasil diperbarui ke seluruh user!");
      setIsEditingAnnounce(false);
    } catch (err: any) {
      toast.error(err.message || "Gagal memperbarui pengumuman");
    } finally {
      setIsSavingAnnounce(false);
    }
  };

  return (
    <AppShell title="Dashboard" subtitle="Ringkasan akun & aktivitas" user={user}>
      
      {/* === BANNER PENGUMUMAN DYNAMIC === */}
      <div className="mb-6 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 to-transparent p-4 backdrop-blur-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Megaphone className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="space-y-1 flex-1">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">Info & Pengumuman</h4>
              {isEditingAnnounce ? (
                <textarea
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 p-2.5 text-sm text-white focus:border-primary focus:outline-none"
                  rows={2}
                />
              ) : (
                <p className="text-sm text-gray-200">{announcement || "Belum ada pengumuman terbaru."}</p>
              )}
            </div>
          </div>
          
          {/* Akses Kontrol Pengumuman: Hanya muncul di akun Developer */}
          {user?.isDeveloper && (
            <div className="shrink-0 self-end sm:self-center">
              {isEditingAnnounce ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateAnnouncement}
                    disabled={isSavingAnnounce}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-black hover:bg-primary/90"
                  >
                    {isSavingAnnounce ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Simpan
                  </button>
                  <button
                    onClick={() => setIsEditingAnnounce(false)}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingAnnounce(true)}
                  className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
                >
                  Edit Pengumuman
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* === DASHBOARD KHUSUS DEVELOPER (Hanya tampil jika level Developer) === */}
      {user?.isDeveloper && (
        <div className="mb-6 space-y-3">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-gradient-gold flex items-center gap-2">
            <Crown className="h-4 w-4" /> Developer Control Overview
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Total Deposit Seluruh User */}
            <div className="rounded-2xl border border-white/15 bg-yellow-500/[0.03] p-5 backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs text-amber-400">
                <Coins className="h-3.5 w-3.5" /> Total Deposit User (Global)
              </div>
              {loadingDevStats ? (
                <Loader2 className="mt-2 h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <p className="mt-2 font-display text-2xl font-semibold text-amber-300">
                  Rp {devStats.totalDeposit.toLocaleString("id-ID")}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">Akumulasi seluruh nominal dompet user</p>
            </div>

            {/* Total Klik Generate Seluruh User */}
            <div className="rounded-2xl border border-white/15 bg-purple-500/[0.03] p-5 backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs text-purple-400">
                <Wand2 className="h-3.5 w-3.5" /> Total Generate User (Global)
              </div>
              {loadingDevStats ? (
                <Loader2 className="mt-2 h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <p className="mt-2 font-display text-2xl font-semibold text-purple-300">
                  {devStats.totalGenerateAll.toLocaleString("id-ID")} Kali
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">Total klik dari seluruh riwayat project</p>
            </div>

            {/* Total Terdaftar */}
            <div className="rounded-2xl border border-white/15 bg-blue-500/[0.03] p-5 backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs text-blue-400">
                <Users className="h-3.5 w-3.5" /> Total User Terdaftar
              </div>
              {loadingDevStats ? (
                <Loader2 className="mt-2 h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <p className="mt-2 font-display text-2xl font-semibold text-blue-300">
                  {devStats.totalUsers.toLocaleString("id-ID")} Akun
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">Total basis data user aktif di aplikasi</p>
            </div>
          </div>
        </div>
      )}

      {/* === KARTU STATISTIK PERSONAL (TETAP SAMA) === */}
      <div className="space-y-3">
        {user?.isDeveloper && (
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Personal Overview
          </h3>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Level */}
          <div className="rounded-2xl border border-white/15 bg-white/[0.05] p-5 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Crown className="h-3.5 w-3.5" /> Level User
            </div>
            <p className="mt-2 font-display text-2xl font-semibold text-gradient-gold">
              {user?.level ?? "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {user?.isDeveloper ? "Akses tak terbatas" : "Upgrade tersedia"}
            </p>
          </div>

          {/* Saldo */}
          <div className="rounded-2xl border border-primary/30 bg-primary/10 p-5 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs text-primary/80">
              <Wallet className="h-3.5 w-3.5" /> Saldo
            </div>
            <p className="mt-2 font-display text-2xl font-semibold text-primary">
              Rp {(user?.saldo ?? 0).toLocaleString("id-ID")}
            </p>
            <Link
              to="/top-up"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg gradient-gold px-3 py-1.5 text-xs font-semibold text-black"
            >
              <PlusCircle className="h-3.5 w-3.5" /> Top Up
            </Link>
          </div>

          {/* Generate count */}
          <div className="rounded-2xl border border-white/15 bg-white/[0.05] p-5 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" /> Total Generate
            </div>
            <p className="mt-2 font-display text-2xl font-semibold">{projects.length}</p>
            <Link
              to="/workspace"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold hover:bg-white/10"
            >
              <Wand2 className="h-3.5 w-3.5" /> Buka Workspace
            </Link>
          </div>
        </div>
      </div>

      {/* --- TABEL RIWAYAT GENERATE USER (TETAP SAMA) --- */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <div>
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <HistoryIcon className="h-4 w-4" /> Riwayat Generate
            </h2>
            <p className="text-xs text-muted-foreground">20 hasil terbaru</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Tanggal</th>
                <th className="px-4 py-3 text-left">Kebutuhan</th>
                <th className="px-4 py-3 text-left">Platform</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    Belum ada riwayat.{" "}
                    <Link to="/workspace" className="text-primary hover:underline">
                      Mulai generate →
                    </Link>
                  </td>
                </tr>
              )}
              {projects.map((p) => (
                <tr key={p.id} className="border-t border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(p.created_at).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-4 py-3">{p.kebutuhan}</td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">
                    {p.platform} • {p.aspect_ratio}
                  </td>
                  <td className="px-4 py-3">
                    {p.status === "sukses" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs text-green-400">
                        <Check className="h-3 w-3" /> Sukses
                      </span>
                    )}
                    {p.status === "error" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary/15 px-2.5 py-0.5 text-xs text-secondary">
                        <X className="h-3 w-3" /> Error
                      </span>
                    )}
                    {p.status === "partial" && (
                      <span className="inline-flex items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-2.5 py-0.5 text-yellow-400">
                          <AlertTriangle className="h-3 w-3" /> Partial
                        </span>
                        <a
                          href="https://wa.me/6288975958005"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-primary hover:bg-primary/25"
                        >
                          <MessageCircle className="h-3 w-3" /> Admin
                        </a>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
