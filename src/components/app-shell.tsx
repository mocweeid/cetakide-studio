import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import {
  Menu,
  Wallet,
  User,
  LayoutDashboard,
  Grip,
  FolderKanban,
  Settings,
  LogOut,
  Globe,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/contexts/LanguageContext";

export type AppUser = {
  userId: string;
  username: string;
  saldo: number;
  isDeveloper: boolean;
  level: string;
  avatar_url: string | null;
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
      supabase.from("profiles").select("saldo, username, avatar_url").eq("id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
    ]);
    const isDev = !!roles?.some((r) => r.role === "developer");
    setUser({
      userId: uid,
      username: profile?.username ?? "user",
      saldo: profile?.saldo ?? 0,
      isDeveloper: isDev,
      level: isDev ? "Developer" : "User Starter",
      avatar_url: profile?.avatar_url ?? null,
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
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { lang, toggleLang, t } = useLanguage();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-[1500px] gap-3 p-2 sm:gap-4 sm:p-4">
        <div className="hidden md:block md:w-64 shrink-0">
          <div className="sticky top-4 h-[calc(100vh-2rem)]">
            <DashboardSidebar isDeveloper={!!user?.isDeveloper} />
          </div>
        </div>

        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative z-10 h-full w-[280px] p-3 animate-in slide-in-from-left duration-300">
              <DashboardSidebar
                isDeveloper={!!user?.isDeveloper}
                onNavigate={() => setSidebarOpen(false)}
                showClose={() => setSidebarOpen(false)}
              />
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 space-y-4">
          <header className="relative z-40 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 backdrop-blur-md sm:flex sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-lg border border-white/10 bg-white/5 p-2 md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate font-display text-lg font-semibold sm:text-xl">
                  {title === "Dashboard" ? t("dashboard.title") : title}
                </h1>
                {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              {right}
              <Link
                to="/top-up"
                className="flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 sm:inline-flex"
              >
                <Wallet className="h-3.5 w-3.5" />
                Rp {(user?.saldo ?? 0).toLocaleString("id-ID")}
                {user?.isDeveloper && (
                  <span className="rounded-full bg-primary/30 px-1.5 py-0.5 text-[9px]">∞</span>
                )}
              </Link>

              <button
                onClick={toggleLang}
                className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 transition-colors hover:bg-white/20"
              >
                <Globe className="h-4 w-4" />
                {lang}
              </button>

              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10 transition-colors hover:border-primary/50 hover:bg-white/20"
                >
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4 text-white/80" />
                  )}
                </button>

                {profileMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)} />

                    <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-2xl border border-white/15 bg-black/80 p-2 shadow-2xl backdrop-blur-xl">
                      <div className="mb-2 border-b border-white/10 px-3 pb-3 pt-1">
                        <p className="truncate text-sm font-semibold text-white">
                          {user?.username}
                        </p>
                        <p className="text-[10px] text-primary">{user?.level}</p>
                      </div>

                      <div className="flex flex-col gap-1">
                        <Link
                          to="/dashboard"
                          onClick={() => setProfileMenuOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          <LayoutDashboard className="h-4 w-4" /> Dashboard
                        </Link>
                        <Link
                          to="/workspace"
                          onClick={() => setProfileMenuOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          <Grip className="h-4 w-4" /> Workspace
                        </Link>
                        <Link
                          to="/project"
                          onClick={() => setProfileMenuOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          <FolderKanban className="h-4 w-4" /> Project
                        </Link>
                        <Link
                          to="/"
                          onClick={() => setProfileMenuOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          <Globe className="h-4 w-4" /> Landing Page
                        </Link>
                        <Link
                          to="/settings"
                          onClick={() => setProfileMenuOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          <Settings className="h-4 w-4" /> Setting Profile
                        </Link>

                        <button
                          onClick={handleLogout}
                          className="mt-1 flex w-full items-center gap-3 rounded-lg border-t border-white/5 px-3 pt-3 pb-2 text-left text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                        >
                          <LogOut className="h-4 w-4" /> Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}
