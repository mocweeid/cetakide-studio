import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AppShell, useAppUser } from "@/components/app-shell";
import { Upload, Trophy, BarChart2, Eye, TrendingUp, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/ab-testing")({
  head: () => ({
    meta: [{ title: "A/B Testing — Cetak Ide" }, { name: "robots", content: "noindex" }],
  }),
  component: AbTestingPage,
});

const MOCK_RESULTS = {
  a: { impressi: 12400, klik: 1488, ctr: "12.0%", konversi: 148, platform: "Instagram" },
  b: { impressi: 11800, klik: 1769, ctr: "15.0%", konversi: 247, platform: "Instagram" },
};

function AbTestingPage() {
  const { user } = useAppUser();
  const refA = useRef<HTMLInputElement>(null);
  const refB = useRef<HTMLInputElement>(null);
  const [imgA, setImgA] = useState<string | null>(null);
  const [imgB, setImgB] = useState<string | null>(null);
  const [platform, setPlatform] = useState("instagram");
  const [duration, setDuration] = useState("7");
  const [showResults, setShowResults] = useState(false);
  const [running, setRunning] = useState(false);

  function handleUpload(variant: "a" | "b", e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (variant === "a") setImgA(url);
    else setImgB(url);
  }

  async function startTest() {
    if (!imgA || !imgB) {
      toast.error("Upload kedua visual terlebih dahulu!");
      return;
    }
    setRunning(true);
    await new Promise((r) => setTimeout(r, 2000));
    setRunning(false);
    setShowResults(true);
    toast.success("Simulasi A/B Test selesai!");
  }

  const winner = showResults ? (MOCK_RESULTS.b.ctr > MOCK_RESULTS.a.ctr ? "B" : "A") : null;

  return (
    <AppShell
      title="A/B Testing"
      subtitle="Bandingkan dua visual untuk temukan yang paling efektif"
      user={user}
    >
      <div className="space-y-4">
        {/* Visual Upload */}
        <div className="grid gap-4 sm:grid-cols-2">
          {(["a", "b"] as const).map((variant) => {
            const img = variant === "a" ? imgA : imgB;
            const ref = variant === "a" ? refA : refB;
            return (
              <div
                key={variant}
                className={`rounded-2xl border bg-white/[0.04] backdrop-blur-md overflow-hidden ${winner === variant.toUpperCase() ? "border-primary/60" : "border-white/10"}`}
              >
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold ${winner === variant.toUpperCase() ? "bg-primary text-black" : "border border-white/20 text-white/80"}`}
                    >
                      {variant.toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold">Varian {variant.toUpperCase()}</span>
                  </div>
                  {winner === variant.toUpperCase() && (
                    <span className="flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                      <Trophy className="h-3 w-3" /> WINNER
                    </span>
                  )}
                </div>
                <div className="p-4">
                  {img ? (
                    <div className="relative">
                      <img
                        src={img}
                        alt={`Varian ${variant.toUpperCase()}`}
                        className="w-full rounded-xl object-cover max-h-56"
                      />
                      <button
                        onClick={() => ref.current?.click()}
                        className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 opacity-0 transition hover:opacity-100"
                      >
                        <span className="text-xs font-medium">Ganti Gambar</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => ref.current?.click()}
                      className="flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed border-white/20 py-10 text-muted-foreground transition hover:border-white/40 hover:text-white"
                    >
                      <Upload className="h-8 w-8" />
                      <p className="text-sm">Upload Visual {variant.toUpperCase()}</p>
                    </button>
                  )}
                  <input
                    ref={ref}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleUpload(variant, e)}
                  />
                </div>

                {/* Stats for each variant */}
                {showResults && (
                  <div className="border-t border-white/10 px-4 pb-4">
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {Object.entries(MOCK_RESULTS[variant])
                        .filter(([k]) => k !== "platform")
                        .map(([key, val]) => (
                          <div key={key} className="rounded-xl bg-white/5 p-3 text-center">
                            <p className="font-bold text-base text-white">{val}</p>
                            <p className="text-[10px] capitalize text-muted-foreground">
                              {key === "ctr" ? "CTR" : key.charAt(0).toUpperCase() + key.slice(1)}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Config & Results */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Config */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5 backdrop-blur-md">
            <h3 className="mb-4 font-display text-sm font-semibold">Konfigurasi Test</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Platform
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm focus:border-primary/50 focus:outline-none"
                >
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook Ads</option>
                  <option value="youtube">YouTube</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Durasi Simulasi
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm focus:border-primary/50 focus:outline-none"
                >
                  <option value="3">3 hari</option>
                  <option value="7">7 hari</option>
                  <option value="14">14 hari</option>
                  <option value="30">30 hari</option>
                </select>
              </div>
              <button
                onClick={startTest}
                disabled={running || !imgA || !imgB}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #EAB308, #CA8A04)" }}
              >
                {running ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Mensimulasi...
                  </>
                ) : (
                  <>
                    <BarChart2 className="h-4 w-4" /> Mulai A/B Test
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Summary */}
          {showResults && (
            <div className="sm:col-span-1 lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5 backdrop-blur-md">
              <h3 className="mb-4 font-display text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Hasil Perbandingan
              </h3>
              <div className="space-y-3">
                {["impressi", "klik", "ctr", "konversi"].map((metric) => {
                  const labelMap: Record<string, string> = {
                    impressi: "Total Impressi",
                    klik: "Total Klik",
                    ctr: "Click-Through Rate (CTR)",
                    konversi: "Konversi",
                  };
                  const valA = MOCK_RESULTS.a[metric as keyof typeof MOCK_RESULTS.a];
                  const valB = MOCK_RESULTS.b[metric as keyof typeof MOCK_RESULTS.b];
                  const numA = parseFloat(String(valA).replace("%", ""));
                  const numB = parseFloat(String(valB).replace("%", ""));
                  const winnerMetric = numB > numA ? "B" : "A";
                  return (
                    <div key={metric} className="flex items-center gap-4 rounded-xl bg-white/5 p-3">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-muted-foreground">
                          {labelMap[metric]}
                        </p>
                        <div className="mt-1.5 flex items-center gap-3">
                          <span
                            className={`text-sm font-bold ${winnerMetric === "A" ? "text-primary" : "text-white/60"}`}
                          >
                            A: {valA}
                          </span>
                          <span className="text-muted-foreground">vs</span>
                          <span
                            className={`text-sm font-bold ${winnerMetric === "B" ? "text-primary" : "text-white/60"}`}
                          >
                            B: {valB}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${winnerMetric === winner ? "bg-primary text-black" : "border border-white/20 text-white/60"}`}
                      >
                        {winnerMetric}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4">
                <Trophy className="h-6 w-6 shrink-0 text-primary" />
                <div>
                  <p className="font-display text-sm font-bold text-primary">
                    Varian {winner} Menang!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Varian B memiliki CTR 25% lebih tinggi dari Varian A. Gunakan Varian B untuk
                    kampanye resmi.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!showResults && (
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center sm:col-span-1 lg:col-span-2">
              <div>
                <Eye className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Upload dua visual, atur konfigurasi,
                  <br />
                  dan mulai A/B Test untuk melihat hasilnya.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
