import { createFileRoute } from "@tanstack/react-router";
import { AppShell, useAppUser } from "@/components/app-shell";
import { ComingSoon } from "./auto-uploader";
import { FileCode } from "lucide-react";

export const Route = createFileRoute("/_authenticated/api-doc")({
  head: () => ({ meta: [{ title: "API Doc — CetakIde" }, { name: "robots", content: "noindex" }] }),
  component: ApiDocPage,
});

function ApiDocPage() {
  const { user } = useAppUser();
  return (
    <AppShell title="API Doc" subtitle="Dokumentasi REST API CetakIde" user={user}>
      <ComingSoon
        icon={<FileCode className="h-8 w-8" />}
        title="Developer API"
        desc="Endpoint publik untuk generate on-demand — dokumentasi lengkap segera hadir."
      />
    </AppShell>
  );
}