import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Wand2,
  FolderKanban,
  UploadCloud,
  Wallet,
  Image as ImageIcon,
  Plug,
  FileCode,
  Settings,
  LogOut,
  Sparkles,
  ShieldCheck,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Main",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/workspace", label: "Workspace", icon: Wand2 },
      { to: "/project", label: "Project", icon: FolderKanban },
      { to: "/auto-uploader", label: "Auto Uploader", icon: UploadCloud },
    ],
  },
  {
    title: "Finance",
    items: [{ to: "/top-up", label: "Top Up Saldo", icon: Wallet }],
  },
  {
    title: "System",
    items: [
      { to: "/references", label: "Manajemen Referensi", icon: ImageIcon },
      { to: "/integrations", label: "Integrasi API", icon: Plug },
      { to: "/api-doc", label: "API Doc", icon: FileCode },
    ],
  },
  {
    title: "Account",
    items: [{ to: "/settings", label: "Settings", icon: Settings }],
  },
];

export function DashboardSidebar({
  isDeveloper,
  onNavigate,
  showClose,
}: {
  isDeveloper: boolean;
  onNavigate?: () => void;
  showClose?: () => void;
}) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Berhasil keluar.");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <aside className="flex h-full w-full flex-col overflow-y-auto rounded-2xl border border-white/15 bg-white/[0.04] p-4 backdrop-blur-xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]">
      <div className="mb-6 flex items-center justify-between px-2">
        <Link to="/" className="flex items-center gap-2 font-display font-bold">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg gradient-gold text-black">
            <Sparkles className="h-4 w-4" />
          </span>
          Cetak<span className="text-gradient-gold">Ide</span>
        </Link>
        {showClose && (
          <button onClick={showClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-white/10 md:hidden">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-5">
        {GROUPS.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.items.map((n) => {
                const isActive = pathname === n.to || pathname.startsWith(n.to + "/");
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={onNavigate}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                      isActive
                        ? "gradient-gold text-black font-semibold"
                        : "text-muted-foreground hover:bg-white/10 hover:text-foreground"
                    }`}
                  >
                    <n.icon className="h-4 w-4" /> {n.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
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
        className="mt-4 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-secondary/15 hover:text-secondary"
      >
        <LogOut className="h-4 w-4" /> Keluar
      </button>
    </aside>
  );
}
