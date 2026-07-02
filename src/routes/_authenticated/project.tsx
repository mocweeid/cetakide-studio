import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, useAppUser } from "@/components/app-shell";
import { FolderKanban } from "lucide-react";

export const Route = createFileRoute("/_authenticated/project")({
  head: () => ({ meta: [{ title: "Project — CetakIde" }, { name: "robots", content: "noindex" }] }),
  component: ProjectPage,
});

type P = { id: string; kebutuhan: string; image_url: string | null; created_at: string };

function ProjectPage() {
  const { user } = useAppUser();
  const [items, setItems] = useState<P[]>([]);
  useEffect(() => {
    if (!user) return;
    supabase
      .from("projects")
      .select("id, kebutuhan, image_url, created_at")
      .eq("user_id", user.userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => setItems((data ?? []) as P[]));
  }, [user]);

  return (
    <AppShell title="Project" subtitle="Semua hasil generate Anda" user={user}>
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] p-12 text-center backdrop-blur-md">
          <FolderKanban className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Belum ada project.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-md">
              {p.image_url ? (
                <img src={p.image_url} alt="" className="aspect-square w-full object-cover" />
              ) : (
                <div className="aspect-square bg-white/5" />
              )}
              <div className="p-3">
                <p className="truncate text-xs font-medium">{p.kebutuhan}</p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(p.created_at).toLocaleDateString("id-ID")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}