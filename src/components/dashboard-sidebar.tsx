import { Link, useNavigate } from "@tanstack/react-router";
import { Instagram, Facebook, Youtube, History, LogOut, Sparkles, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Platform = "instagram" | "facebook" | "youtube" | "history";

const NAV: { key: Platform; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "instagram", label: "Instagram", icon: Instagram },
  { key: "facebook", label: "Facebook Ads", icon: Facebook },
  { key: "youtube", label: "YouTube", icon: Youtube },
  { key: "history", label: "Riwayat Proses", icon: History },
];

export function DashboardSidebar({
  active,
  onSelect,
  isDeveloper,
}: {
  active: Platform;
  onSelect: (p: Platform) => void;
  isDeveloper: boolean;
}) {
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Berhasil keluar.");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <aside className="glass-panel-strong sticky top-4 flex h-[calc(100vh-2rem)] w-full flex-col rounded-2xl p-4 md:w-64">
      <Link to="/" className="mb-6 flex items-center gap-2 px-2 font-display font-bold">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg gradient-gold text-black">
          <Sparkles className="h-4 w-4" />
        </span>
        Cetak<span className="text-gradient-gold">Ide</span>
      </Link>

      <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Workspace
      </p>
      <nav className="space-y-1">
        {NAV.map((n) => {
          const isActive = active === n.key;
          return (
            <button
              key={n.key}
              onClick={() => onSelect(n.key)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                isActive
                  ? "gradient-gold text-black font-semibold"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
            >
              <n.icon className="h-4 w-4" /> {n.label}
            </button>
          );
        })}
      </nav>

      {isDeveloper && (
        <div className="mt-6 rounded-lg border border-primary/40 bg-primary/10 p-3 text-xs">
          <div className="flex items-center gap-2 font-semibold text-primary">
            <ShieldCheck className="h-3.5 w-3.5" /> God Mode Aktif
          </div>
          <p className="mt-1 text-muted-foreground">Generate unlimited tanpa potong saldo.</p>
        </div>
      )}

      <button
        onClick={signOut}
        className="mt-auto flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-secondary/15 hover:text-secondary"
      >
        <LogOut className="h-4 w-4" /> Keluar
      </button>
    </aside>
  );
}
