import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { Instagram, Facebook, Youtube, Twitter, Send } from "lucide-react";
import { BRAND, footerColumns } from "@/config/site-assets";

const search = z.object({
  mode: z.enum(["login", "register"]).optional().default("login"),
});

export const Route = createFileRoute("/auth")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Masuk / Daftar — CetakIde" },
      {
        name: "description",
        content: "Masuk ke dashboard CetakIde atau daftar akun baru dengan saldo gratis Rp50.000.",
      },
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
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Gagal login dengan Google");
    } finally {
      setLoading(false);
    }
  };

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
    <div className="flex min-h-screen flex-col lg:flex-row bg-[#0D1117] text-white">
      {/* LEFT COLUMN: FORM */}
      <div className="flex w-full flex-col justify-center px-4 py-12 sm:px-6 lg:w-[45%] lg:px-20 xl:px-24 bg-[#0D1117] relative z-10">
        <Link
          to="/"
          className="absolute left-6 top-6 inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/10 mb-4 text-white">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-white">
              {mode === "login" ? "Sign in to CetakIde" : "Create your account"}
            </h2>
            <p className="mt-2 text-sm text-white/60">
              {mode === "login"
                ? "Welcome back, creator."
                : "Claim your free Rp50.000 starting balance."}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#161B22] p-6 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/90">Username</label>
                  <input
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-md border border-white/10 bg-[#0D1117] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                    placeholder="brandkeren"
                  />
                </div>
              )}
              <div>
                <label className="mb-2 block text-sm font-medium text-white/90">
                  Email address
                </label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-[#0D1117] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                  placeholder="kamu@brand.com"
                />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-white/90">Password</label>
                  {mode === "login" && (
                    <a href="#" className="text-xs text-blue-400 hover:underline">
                      Forgot password?
                    </a>
                  )}
                </div>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-md border border-white/10 bg-[#0D1117] px-3 py-2 pr-10 text-sm text-white placeholder-white/30 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/90"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {mode === "login" && (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-black/50 text-blue-500 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm text-white/70 cursor-pointer select-none"
                  >
                    Ingat saya
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-[#238636] py-2 text-sm font-semibold text-white hover:bg-[#2EA043] transition disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "login" ? "Sign in" : "Sign up"}
              </button>

              <div className="my-5 flex items-center gap-3 before:h-px before:flex-1 before:bg-white/10 after:h-px after:flex-1 after:bg-white/10">
                <span className="text-xs text-white/40 uppercase tracking-widest">Atau</span>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-[#0D1117] py-2 text-sm font-semibold text-white hover:bg-white/5 transition disabled:opacity-60"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </button>
            </form>
          </div>

          <div className="mt-8 rounded-xl border border-white/10 bg-transparent p-4 text-center text-sm text-white/60">
            {mode === "login" ? "New to CetakIde?" : "Already have an account?"}{" "}
            <button
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="text-blue-400 hover:underline"
            >
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: ANIMATED MOCKUP */}
      <div className="hidden lg:flex w-[55%] flex-1 relative bg-black items-center justify-center overflow-hidden border-l border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0D1117] to-[#0D1117]" />

        <style>{`
          @keyframes scroll-up {
            0% { transform: translateY(0); }
            100% { transform: translateY(-50%); }
          }
          @keyframes scroll-down {
            0% { transform: translateY(-50%); }
            100% { transform: translateY(0); }
          }
          .animate-marquee-up {
            animation: scroll-up 25s linear infinite;
          }
          .animate-marquee-down {
            animation: scroll-down 30s linear infinite;
          }
          @keyframes typing {
            from { width: 0 }
            to { width: 100% }
          }
          @keyframes blink {
            50% { border-color: transparent }
          }
          .typing-effect {
            display: inline-block;
            overflow: hidden;
            white-space: nowrap;
            border-right: 2px solid #4ade80;
            width: 100%;
            animation: 
              typing 3.5s steps(35, end) infinite alternate,
              blink 0.75s step-end infinite;
          }
        `}</style>

        <div className="absolute inset-0 flex gap-6 px-12 opacity-60 rotate-12 scale-110">
          <div className="flex flex-col gap-6 animate-marquee-up mt-20">
            {[1, 2, 3, 4, 1, 2, 3, 4].map((n, i) => (
              <img
                key={i}
                src={`/assets/feed-ig/ig-${n}.png`}
                alt="mock"
                className="w-64 rounded-2xl border border-white/10 shadow-2xl"
              />
            ))}
          </div>
          <div className="flex flex-col gap-6 animate-marquee-down -mt-40">
            {[5, 6, 7, 8, 5, 6, 7, 8].map((n, i) => (
              <img
                key={i}
                src={`/assets/feed-ig/ig-${n}.png`}
                alt="mock"
                className="w-64 rounded-2xl border border-white/10 shadow-2xl"
              />
            ))}
          </div>
          <div className="flex flex-col gap-6 animate-marquee-up mt-10">
            {[1, 3, 5, 7, 1, 3, 5, 7].map((n, i) => (
              <img
                key={i}
                src={`/assets/feed-ig/ig-${n}.png`}
                alt="mock"
                className="w-64 rounded-2xl border border-white/10 shadow-2xl"
              />
            ))}
          </div>
        </div>

        {/* Floating Overlay UI Mockup */}
        <div className="relative z-10 w-[80%] max-w-lg rounded-xl border border-white/15 bg-black/60 p-6 backdrop-blur-xl shadow-[0_0_50px_rgba(35,134,54,0.15)]">
          <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500/80" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
              <div className="h-3 w-3 rounded-full bg-green-500/80" />
            </div>
            <p className="text-xs text-white/40 font-mono">cetakide-workspace</p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center text-sm font-mono text-green-400 mb-2">
              <span className="mr-2 text-white/40">{">"}</span>
              <div className="typing-effect">Generating brand visual magic...</div>
            </div>
            <div className="h-4 w-3/4 rounded bg-white/5 animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-white/5 animate-pulse" />
            <div className="grid grid-cols-3 gap-3 pt-4">
              <div className="aspect-square rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-blue-400" />
              </div>
              <div className="aspect-square rounded-lg bg-[#238636]/10 border border-[#238636]/20 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-[#2EA043]" />
              </div>
              <div className="aspect-square rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
