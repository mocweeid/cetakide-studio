import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, useAppUser } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut, Upload, Loader2, User } from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [{ title: "Settings — Cetak Ide" }, { name: "robots", content: "noindex" }],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, refresh } = useAppUser();
  const navigate = useNavigate();

  // State untuk form edit
  const [username, setUsername] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Set nilai awal form ketika data user sudah ke-load
  useEffect(() => {
    if (user) {
      setUsername(user.username);
    }
  }, [user]);

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Berhasil keluar.");
    navigate({ to: "/auth", replace: true });
  }

  // Fungsi simpan Username
  async function saveProfile() {
    if (!user?.userId) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({ username }).eq("id", user.userId);

      if (error) throw error;
      toast.success("Profil berhasil diperbarui!");
      refresh(); // Perbarui header otomatis
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan profil");
    } finally {
      setIsSaving(false);
    }
  }

  // Fungsi unggah Foto Profil
  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setIsUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split(".").pop();
      const filePath = `${user?.userId}-${Math.random()}.${fileExt}`;

      // 1. Upload ke Supabase Storage (Bucket: avatars)
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Dapatkan URL publik dari foto yang di-upload
      const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(filePath);

      // 3. Simpan URL tersebut ke tabel profiles
      if (!user?.userId) throw new Error("User tidak ditemukan.");
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrlData.publicUrl })
        .eq("id", user.userId);

      if (updateError) throw updateError;

      toast.success("Foto profil berhasil diubah!");
      refresh(); // Langsung ganti foto di pojok kanan atas
    } catch (error: any) {
      toast.error(error.message || "Gagal mengunggah foto.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <AppShell title="Settings" subtitle="Preferensi dan Edit Akun Anda" user={user}>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* --- KARTU EDIT PROFIL --- */}
        <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-5 backdrop-blur-md sm:p-6">
          <h2 className="mb-5 font-display text-lg font-semibold text-white">Edit Profil</h2>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {/* Bagian Foto Profil */}
            <div className="relative flex shrink-0 flex-col items-center gap-3">
              <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-white/20 bg-black/50">
                {isUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-white/50" />
                )}
              </div>
              <label className="cursor-pointer rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-white/20">
                {isUploading ? "Mengunggah..." : "Ganti Foto"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={uploadAvatar}
                  disabled={isUploading}
                />
              </label>
            </div>

            {/* Bagian Input Form */}
            <div className="flex-1 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Username Anda
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
                  placeholder="Ketik username baru..."
                />
              </div>

              <button
                onClick={saveProfile}
                disabled={isSaving || username === user?.username}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>

        {/* --- KARTU INFO AKUN (Hanya Baca) --- */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-5 backdrop-blur-md">
            <h2 className="mb-4 font-display text-base font-semibold text-white">Status Akun</h2>
            <div className="space-y-3 text-sm">
              <Row label="Level Akses" value={user?.level ?? "—"} />
              <Row label="Total Saldo" value={`Rp ${(user?.saldo ?? 0).toLocaleString("id-ID")}`} />
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-5 backdrop-blur-md">
            <h2 className="mb-2 font-display text-base font-semibold text-red-400">Sesi Aktif</h2>
            <p className="mb-4 text-xs text-muted-foreground">
              Keluar dari akun ini di perangkat ini dengan aman.
            </p>
            <button
              onClick={signOut}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/20"
            >
              <LogOut className="h-4 w-4" /> Keluar dari Aplikasi
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}
