import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, useAppUser } from "@/components/app-shell";
import { Users, UserPlus, Mail, Crown, Edit2, Trash2, Shield } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/team")({
  head: () => ({
    meta: [{ title: "Kolaborasi Tim — Cetak Ide" }, { name: "robots", content: "noindex" }],
  }),
  component: TeamPage,
});

const ROLES = {
  owner: { label: "Owner", color: "#EAB308", icon: Crown },
  editor: { label: "Editor", color: "#8b5cf6", icon: Edit2 },
  viewer: { label: "Viewer", color: "#6b7280", icon: Shield },
};

const INIT_MEMBERS = [
  {
    id: "1",
    name: "Anda (Owner)",
    email: "you@cetakide.com",
    role: "owner" as const,
    status: "aktif",
    joined: "2026-01-01",
  },
  {
    id: "2",
    name: "Budi Santoso",
    email: "budi@agencykreatif.com",
    role: "editor" as const,
    status: "aktif",
    joined: "2026-03-15",
  },
  {
    id: "3",
    name: "Siti Rahma",
    email: "siti@bisnisonline.id",
    role: "viewer" as const,
    status: "pending",
    joined: "2026-07-01",
  },
];

function TeamPage() {
  const { user } = useAppUser();
  const [members, setMembers] = useState(INIT_MEMBERS);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("editor");

  function sendInvite() {
    if (!inviteEmail.trim()) {
      toast.error("Masukkan email!");
      return;
    }
    setMembers((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: inviteEmail.split("@")[0],
        email: inviteEmail,
        role: inviteRole,
        status: "pending",
        joined: new Date().toISOString().split("T")[0],
      },
    ]);
    toast.success(`Undangan dikirim ke ${inviteEmail}!`);
    setInviteEmail("");
    setShowInvite(false);
  }

  function removeMember(id: string) {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    toast.success("Anggota dihapus dari tim.");
  }

  function changeRole(id: string, role: "editor" | "viewer") {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)));
    toast.success("Role berhasil diperbarui!");
  }

  return (
    <AppShell title="Kolaborasi Tim" subtitle="Kelola anggota tim dan hak akses mereka" user={user}>
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Anggota", value: members.length.toString() },
            {
              label: "Aktif",
              value: members.filter((m) => m.status === "aktif").length.toString(),
            },
            {
              label: "Pending",
              value: members.filter((m) => m.status === "pending").length.toString(),
            },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 sm:p-4 text-center backdrop-blur-md"
            >
              <p className="font-display text-xl sm:text-2xl font-bold text-primary">{value}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Member List */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold">Anggota Tim</h3>
              <button
                onClick={() => setShowInvite(!showInvite)}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110"
                style={{ background: "linear-gradient(135deg, #EAB308, #CA8A04)" }}
              >
                <UserPlus className="h-4 w-4" /> Undang Anggota
              </button>
            </div>

            {/* Invite Form */}
            {showInvite && (
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 backdrop-blur-md">
                <h4 className="mb-3 text-sm font-semibold">Undang Anggota Baru</h4>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="email@contoh.com"
                    type="email"
                    className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm placeholder:text-white/30 focus:border-primary/50 focus:outline-none"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as "editor" | "viewer")}
                    className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm focus:border-primary/50 focus:outline-none"
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowInvite(false)}
                      className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/60 hover:bg-white/10"
                    >
                      Batal
                    </button>
                    <button
                      onClick={sendInvite}
                      className="rounded-xl px-4 py-2.5 text-sm font-semibold text-black"
                      style={{ background: "linear-gradient(135deg, #EAB308, #CA8A04)" }}
                    >
                      <Mail className="inline h-4 w-4" /> Kirim
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Members */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md overflow-hidden">
              <div className="divide-y divide-white/5">
                {members.map((member) => {
                  const roleData = ROLES[member.role];
                  return (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-4 hover:bg-white/[0.02]"
                    >
                      {/* Avatar */}
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                        style={{ background: roleData.color + "33", color: roleData.color }}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-white truncate">{member.name}</p>
                          {member.status === "pending" && (
                            <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-[9px] font-semibold text-yellow-400">
                              Pending
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                      </div>

                      {/* Role & Actions */}
                      <div className="flex shrink-0 items-center gap-2">
                        {member.role !== "owner" ? (
                          <select
                            value={member.role}
                            onChange={(e) =>
                              changeRole(member.id, e.target.value as "editor" | "viewer")
                            }
                            className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-xs focus:border-primary/50 focus:outline-none"
                          >
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full bg-primary/20 px-2 py-1 text-[10px] font-bold text-primary">
                            <Crown className="h-3 w-3" /> Owner
                          </span>
                        )}
                        {member.role !== "owner" && (
                          <button
                            onClick={() => removeMember(member.id)}
                            className="rounded-lg border border-white/10 p-2 text-white/40 hover:bg-red-500/10 hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Permission Table */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
            <h3 className="mb-4 font-display text-sm font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" /> Matriks Izin
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="pb-2 text-left font-medium text-muted-foreground">Fitur</th>
                    <th
                      className="pb-2 text-center font-medium"
                      style={{ color: ROLES.editor.color }}
                    >
                      Editor
                    </th>
                    <th
                      className="pb-2 text-center font-medium"
                      style={{ color: ROLES.viewer.color }}
                    >
                      Viewer
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    ["Generate Visual", true, false],
                    ["Lihat Aset", true, true],
                    ["Unduh Aset", true, true],
                    ["Edit Brand Kit", true, false],
                    ["Kelola Template", true, false],
                    ["Lihat Analytics", true, true],
                    ["Kelola Tim", false, false],
                    ["Akses Billing", false, false],
                  ].map(([feat, editor, viewer]) => (
                    <tr key={String(feat)}>
                      <td className="py-2.5 text-white/70">{feat as string}</td>
                      <td className="py-2.5 text-center">{editor ? "✅" : "❌"}</td>
                      <td className="py-2.5 text-center">{viewer ? "✅" : "❌"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
