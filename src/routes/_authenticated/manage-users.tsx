import { createFileRoute } from "@tanstack/react-router";
import { AppShell, useAppUser } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated/manage-users")({
  component: ManageUsersPage,
});

function ManageUsersPage() {
  const { user } = useAppUser();

  return (
    <AppShell title="Manajemen User" subtitle="Kontrol penuh data pengguna" user={user}>
      <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-6 backdrop-blur-md">
        <h2 className="font-display text-lg font-semibold text-white">Daftar Pengguna</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Fitur edit saldo, nama, dan manajemen user sedang dalam tahap konstruksi...
        </p>
        {/* Nanti di sini kita akan pasang tabel daftar user */}
      </div>
    </AppShell>
  );
}
