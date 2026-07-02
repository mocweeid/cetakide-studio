import { createFileRoute } from "@tanstack/react-router";
import { AppShell, useAppUser } from "@/components/app-shell";
import { UploadCloud } from "lucide-react";

export function ComingSoon({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.04] p-16 text-center backdrop-blur-md">
      <div className="text-primary">{icon}</div>
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <p className="max-w-md text-sm text-muted-foreground">{desc}</p>
      <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
        Coming Soon
      </span>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/auto-uploader")({
  head: () => ({ meta: [{ title: "Auto Uploader — CetakIde" }, { name: "robots", content: "noindex" }] }),
  component: AutoUploaderPage,
});

function AutoUploaderPage() {
  const { user } = useAppUser();
  return (
    <AppShell title="Auto Uploader" subtitle="Jadwalkan posting otomatis ke sosmed" user={user}>
      <ComingSoon
        icon={<UploadCloud className="h-8 w-8" />}
        title="Auto Uploader"
        desc="Publish langsung ke IG, FB, dan TikTok. Fitur ini sedang finalisasi."
      />
    </AppShell>
  );
}