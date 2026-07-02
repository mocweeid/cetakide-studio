import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Menu, Wallet, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";

export type AppUser = {
  userId: string;
  username: string;
  saldo: number;
  isDeveloper: boolean;
  level: string;
};

export function useAppUser() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) {
      setLoading(false);
      return;
    }
    const [{ data: profile }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("saldo, username").eq("id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
    ]);
    const isDev = !!roles?.some((r) => r.role === "developer");
    setUser({
      userId: uid,
      username: profile?.username ?? "user",
      saldo: profile?.saldo ?? 0,
      isDeveloper: isDev,
      level: isDev ? "Developer" : "User Starter",
    });
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

  return { user, loading, refresh, setUser };
}

export function AppShell({
  children,
  title,
  subtitle,
  user,
  right,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  user: AppUser | null;
  right?: ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient gradient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-[1500px] gap-4 p-4">
        {/* Desktop sidebar */}
        <div className="hidden md:block md:w-64 shrink-0">
          <div className="sticky top-4 h-[calc(100vh-2rem)]">
            <DashboardSidebar isDeveloper={!!user?.isDeveloper} />
          </div>
        </div>

        {/* Mobile sidebar drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <div className="relative z-10 h-full w-72 p-3">
              <DashboardSidebar
                isDeveloper={!!user?.isDeveloper}
                onNavigate={() => setSidebarOpen(false)}
                showClose={() => setSidebarOpen(false)}
              />
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 space-y-4">
          {/* Glass header */}
          <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 backdrop-blur-md sm:flex sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-lg border border-white/10 bg-white/5 p-2 md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate font-display text-lg font-semibold sm:text-xl">{title}</h1>
                {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {right}
              <Link
                to="/top-up"
                className="hidden items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 sm:inline-flex"
              >
                <Wallet className="h-3.5 w-3.5" />
                Rp {(user?.saldo ?? 0).toLocaleString("id-ID")}
                {user?.isDeveloper && <span className="rounded-full bg-primary/30 px-1.5 py-0.5 text-[9px]">∞</span>}
              </Link>
              <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs sm:flex">
                <Sparkles className="h-3 w-3 text-primary" />
                <span className="truncate max-w-[120px]">{user?.username}</span>
              </div>
            </div>
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}