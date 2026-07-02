import { createFileRoute } from "@tanstack/react-router";
import { AppShell, useAppUser } from "@/components/app-shell";
import { ComingSoon } from "./auto-uploader";
import { Plug } from "lucide-react";

export const Route = createFileRoute("/_authenticated/integrations")({
  head: () => ({ meta: [{ title: "Integrasi API — CetakIde" }, { name: "robots", content: "noindex" }] }),
  component: IntegrationsPage,
});

function IntegrationsPage() {
  const { user } = useAppUser();
  return (
    <AppShell title="Integrasi API" subtitle="Sambungkan CetakIde dengan tools lain" user={user}>
      <ComingSoon
        icon={<Plug className="h-8 w-8" />}
        title="Integrations"
        desc="Zapier, Make.com, webhook & connector premium akan tersedia di sini."
      />
    </AppShell>
  );
}