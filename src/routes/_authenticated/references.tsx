import { createFileRoute } from "@tanstack/react-router";
import { AppShell, useAppUser } from "@/components/app-shell";
import { ComingSoon } from "./auto-uploader";
import { Image as ImageIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/references")({
  head: () => ({ meta: [{ title: "Manajemen Referensi — CetakIde" }, { name: "robots", content: "noindex" }] }),
  component: ReferencesPage,
});

function ReferencesPage() {
  const { user } = useAppUser();
  return (
    <AppShell title="Manajemen Referensi" subtitle="Kelola koleksi referensi tema Anda" user={user}>
      <ComingSoon
        icon={<ImageIcon className="h-8 w-8" />}
        title="Referensi Library"
        desc="Upload dan atur koleksi referensi yang bisa dipakai ulang di Workspace."
      />
    </AppShell>
  );
}