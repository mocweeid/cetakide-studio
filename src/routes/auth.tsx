import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, ArrowLeft, Loader2 } from "lucide-react";

const search = z.object({
  mode: z.enum(["login", "register"]).optional().default("login"),
});

export const Route = createFileRoute("/auth")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Masuk / Daftar — CetakIde" },
      { name: "description", content: "Masuk ke dashboard CetakIde atau daftar akun baru dengan saldo gratis Rp50.000." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode: initialMode } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { username },
          },
        });
        if (error) throw error;
        toast.success("Akun berhasil dibuat! Saldo Rp50.000 sudah masuk.");
        navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Selamat datang kembali!");
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[140px]" />
      </div>

      <Link to="/" className="absolute left-4 top-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Link>

      <div className="glass-panel-strong relative w-full max-w-md rounded-3xl p-8">
        <div className="mb-6 text-center">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl gradient-gold text-black">
            <Sparkles className="h-5 w-5" />
          </span>
          <h1 className="mt-3 font-display text-2xl font-bold">
            {mode === "login" ? "Masuk ke CetakIde" : "Daftar Akun Baru"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login" ? "Lanjutkan bikin visual iklanmu." : "Dapat saldo awal Rp50.000 gratis."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Username</label>
              <input
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-primary/60"
                placeholder="brandkeren"
              />
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-primary/60"
              placeholder="kamu@brand.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Password</label>
            <input
              required
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-primary/60"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="glow-gold flex w-full items-center justify-center gap-2 rounded-lg gradient-gold py-3 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "login" ? "Masuk" : "Daftar & Klaim Saldo"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="font-semibold text-primary hover:underline"
          >
            {mode === "login" ? "Daftar" : "Masuk"}
          </button>
        </p>
      </div>
    </div>
  );
}