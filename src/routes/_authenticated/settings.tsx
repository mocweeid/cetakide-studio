import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, useAppUser } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — CetakIde" }, { name: "robots", content: "noindex" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAppUser();
  const navigate = useNavigate();
  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Berhasil keluar.");
    navigate({ to: "/auth", replace: true });
  }
  return (
    <AppShell title="Settings" subtitle="Preferensi akun Anda" user={user}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-5 backdrop-blur-md">
          <h2 className="mb-3 font-display text-base font-semibold">Profil</h2>
          <div className="space-y-2 text-sm">
            <Row label="Username" value={user?.username ?? "—"} />
            <Row label="Level" value={user?.level ?? "—"} />
            <Row label="Saldo" value={`Rp ${(user?.saldo ?? 0).toLocaleString("id-ID")}`} />
          </div>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-5 backdrop-blur-md">
          <h2 className="mb-3 font-display text-base font-semibold">Sesi</h2>
          <p className="mb-3 text-xs text-muted-foreground">Keluar dari akun ini di perangkat ini.</p>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-lg border border-secondary/40 bg-secondary/10 px-4 py-2 text-sm font-semibold text-secondary hover:bg-secondary/20"
          >
            <LogOut className="h-4 w-4" /> Keluar
          </button>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}