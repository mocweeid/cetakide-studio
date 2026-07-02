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
} from "lucide-react";

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

function DashboardPage() {
  const { user } = useAppUser();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.userId)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setProjects((data ?? []) as Project[]));
  }, [user]);

  return (
    <AppShell title="Dashboard" subtitle="Ringkasan akun & aktivitas" user={user}>
      {/* Stat cards */}
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

      {/* History table */}
      <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-md">
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