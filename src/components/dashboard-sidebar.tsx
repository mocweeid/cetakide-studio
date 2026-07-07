import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Wand2,
  FolderKanban,
  UploadCloud,
  Wallet,
  Image as ImageIcon,
  Plug,
  FileCode,
  Settings,
  LogOut,
  ShieldCheck,
  X,
  Users,
  BarChart3,
  Terminal,
  Calendar,
  Layers,
  Crop,
  Palette,
  FolderHeart,
  LayoutGrid,
  LayoutTemplate,
  Users2,
  Share2,
  MessageSquare,
  Languages,
  Receipt,
  BellRing,
  HelpCircle,
  ShieldAlert,
  Webhook,
  SlidersHorizontal,
  Activity,
  Database,
  KeyRound,
  Brush,
  ImagePlus,
  Type,
  Globe,
  Sliders,
  Split,
  UserCheck,
  CreditCard,
  FileJson,
  BookOpen,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

function buildGroups(isDeveloper: boolean): { title: string; items: NavItem[] }[] {
  const groups = [
    {
      title: "Main & AI Tools",
      items: [
        { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { to: "/workspace", label: "Workspace", icon: Wand2 },
        { to: "/prompt-library", label: "Perpustakaan Prompt", icon: BookOpen },
        { to: "/project", label: "Project", icon: FolderKanban },
        { to: "/auto-uploader", label: "Auto Uploader", icon: UploadCloud },
        { to: "/analytics", label: "Analitik Hub", icon: BarChart3 },
        { to: "/playground", label: "AI Playground", icon: Terminal },
        { to: "/scheduler", label: "Kalender Konten", icon: Calendar },
        { to: "/bulk-generator", label: "Generate Massal", icon: Layers },
        { to: "/editor-studio", label: "AI Editor Studio", icon: Crop },
        { to: "/inpainting", label: "AI Inpainting", icon: Brush },
      ],
    },
    {
      title: "Brand & Assets",
      items: [
        { to: "/brand-kits", label: "Brand Kit", icon: Palette },
        { to: "/assets", label: "Galeri Aset", icon: FolderHeart },
        { to: "/templates", label: "Koleksi Template", icon: LayoutGrid },
        { to: "/preset-theme", label: "Preset Theme", icon: LayoutTemplate },
        { to: "/fonts", label: "Font Manager", icon: Type },
        { to: "/stock-library", label: "Stock Library", icon: ImagePlus },
      ],
    },
    {
      title: "Marketing & Growth",
      items: [
        { to: "/team", label: "Kolaborasi Tim", icon: Users2 },
        { to: "/affiliate", label: "Program Afiliasi", icon: Share2 },
        { to: "/reviews", label: "Ulasan & Feedback", icon: MessageSquare },
        { to: "/seo-optimizer", label: "SEO Optimizer", icon: Languages },
        { to: "/personas", label: "Persona Pembeli", icon: UserCheck },
        { to: "/social-accounts", label: "Akun Sosial Media", icon: Globe },
        { to: "/style-tuner", label: "Visual Style Tuner", icon: Sliders },
        { to: "/ab-testing", label: "A/B Testing", icon: Split },
      ],
    },
    {
      title: "Finance & Security",
      items: [
        { to: "/top-up", label: "Top Up Saldo", icon: Wallet },
        { to: "/billing", label: "Riwayat Tagihan", icon: Receipt },
        { to: "/notifications", label: "Saluran Notifikasi", icon: BellRing },
        { to: "/security-logs", label: "Log Keamanan", icon: ShieldAlert },
      ],
    },
    {
      title: "Support & Config",
      items: [
        { to: "/references", label: "Manajemen Referensi", icon: ImageIcon },
        { to: "/integrations", label: "Integrasi API", icon: Plug },
        { to: "/api-doc", label: "API Doc", icon: FileCode },
        { to: "/support", label: "Pusat Bantuan", icon: HelpCircle },
        { to: "/api-keys", label: "API Keys Manager", icon: KeyRound },
        { to: "/webhooks", label: "Webhook API", icon: Webhook },
        { to: "/usage-limits", label: "Batas Penggunaan", icon: SlidersHorizontal },
      ],
    },
  ];

  if (isDeveloper) {
    groups.push({
      title: "Developer Control",
      items: [
        { to: "/manage-users", label: "Manajemen User", icon: Users },
        { to: "/system-logs", label: "Kesehatan Server", icon: Activity },
        { to: "/db-shell", label: "Admin DB Shell", icon: Database },
        { to: "/payment-gateways", label: "Payment Gateways", icon: CreditCard },
        { to: "/developer-playground", label: "Swagger API Shell", icon: FileJson },
      ],
    });
  }

  groups.push({
    title: "Account",
    items: [
      { to: "/", label: "Landing Page", icon: Globe },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  });

  return groups;
}

export function DashboardSidebar({
  isDeveloper,
  onNavigate,
  showClose,
}: {
  isDeveloper: boolean;
  onNavigate?: () => void;
  showClose?: () => void;
}) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeGroups = buildGroups(isDeveloper);

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Berhasil keluar.");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <aside className="flex h-full w-full flex-col overflow-y-auto rounded-2xl border border-white/15 bg-white/[0.04] p-4 backdrop-blur-xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]">
      <div className="mb-6 flex items-center justify-between px-2">
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/logo/ChatGPT Image 6 Jul 2026, 13.04.45.png"
            alt="Cetak Ide"
            className="h-12 w-auto object-contain"
          />
        </Link>
        {showClose && (
          <button
            onClick={showClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-white/10 md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-5">
        {activeGroups.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.items.map((n) => {
                const isActive = pathname === n.to || pathname.startsWith(n.to + "/");
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={onNavigate}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                      isActive
                        ? "gradient-gold text-black font-semibold"
                        : "text-muted-foreground hover:bg-white/10 hover:text-foreground"
                    }`}
                  >
                    <n.icon className="h-4 w-4" /> {n.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {isDeveloper && (
        <div className="mt-6 rounded-lg border border-primary/40 bg-primary/10 p-3 text-xs">
          <div className="flex items-center gap-2 font-semibold text-primary">
            <ShieldCheck className="h-3.5 w-3.5" /> God Mode Aktif
          </div>
          <p className="mt-1 text-muted-foreground">Generate unlimited tanpa potong saldo.</p>
        </div>
      )}

      <button
        onClick={signOut}
        className="mt-4 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-secondary/15 hover:text-secondary"
      >
        <LogOut className="h-4 w-4" /> Keluar
      </button>
    </aside>
  );
}
