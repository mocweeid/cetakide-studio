import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, useAppUser } from "@/components/app-shell";
import {
  Layers,
  Sparkles,
  Loader2,
  Download,
  CheckCircle2,
  Instagram,
  Facebook,
  Youtube,
  Plus,
  Trash2,
  Play,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/bulk-generator")({
  head: () => ({
    meta: [{ title: "Generate Massal — CetakIde" }, { name: "robots", content: "noindex" }],
  }),
  component: BulkGeneratorPage,
});

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: Instagram, ratios: ["1:1", "9:16", "4:5"] },
  { id: "facebook", label: "Facebook Ads", icon: Facebook, ratios: ["1.91:1", "1:1"] },
  { id: "youtube", label: "YouTube", icon: Youtube, ratios: ["16:9", "9:16"] },
];

type TaskConfig = {
  id: string;
  prompt: string;
  platform: string;
  ratio: string;
  count: number;
};

type TaskResult = {
  taskId: string;
  urls: string[];
};

function BulkGeneratorPage() {
  const { user } = useAppUser();

  // Current Form State
  const [prompt, setPrompt] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [ratio, setRatio] = useState("1:1");
  const [count, setCount] = useState(1);

  // Tasks Queue State
  const [tasks, setTasks] = useState<TaskConfig[]>([]);

  // Execution State
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<TaskResult[]>([]);
  const [done, setDone] = useState(false);

  const selectedPlatform = PLATFORMS.find((p) => p.id === platform)!;

  function handleAddTask() {
    if (!prompt.trim()) {
      toast.error("Masukkan prompt terlebih dahulu sebelum menambah task!");
      return;
    }
    const newTask: TaskConfig = {
      id: Math.random().toString(36).substr(2, 9),
      prompt,
      platform,
      ratio,
      count,
    };
    setTasks([...tasks, newTask]);
    toast.success("Task ditambahkan ke antrean!");
    setPrompt(""); // reset prompt for next task
  }

  function handleRemoveTask(id: string) {
    setTasks(tasks.filter((t) => t.id !== id));
  }

  async function handleGenerateAll() {
    if (tasks.length === 0) {
      toast.error("Antrean task kosong!");
      return;
    }

    setGenerating(true);
    setDone(false);
    setResults([]);
    setProgress(0);

    const totalImages = tasks.reduce((sum, t) => sum + t.count, 0);
    let imagesProcessed = 0;

    const taskResults: TaskResult[] = [];

    for (const task of tasks) {
      const urls: string[] = [];
      for (let i = 1; i <= task.count; i++) {
        await new Promise((r) => setTimeout(r, 600)); // Simulasi proses AI per gambar
        imagesProcessed++;
        setProgress(Math.round((imagesProcessed / totalImages) * 100));

        const colors = ["0a0a0a", "111111", "141414", "181818", "0f0f0f", "1a1a1a"];
        let url = `https://placehold.co/400x400/${colors[i % colors.length]}/EAB308?text=${task.platform}+${i}`;

        if (task.platform === "instagram" && task.ratio === "1:1") {
          const igIndex = ((i - 1) % 8) + 1; // loop 1 to 8
          url = `/assets/feed-ig/ig-${igIndex}.png`;
        }
        urls.push(url);
      }
      taskResults.push({ taskId: task.id, urls });
      // Update UI incrementally
      setResults([...taskResults]);
    }

    setGenerating(false);
    setDone(true);
    toast.success(`${totalImages} visual dari ${tasks.length} task berhasil digenerate!`);
  }

  const totalCost = tasks.reduce((sum, t) => sum + t.count * 1000, 0);

  return (
    <AppShell
      title="Generate Massal"
      subtitle="Buat banyak variasi visual sekaligus dengan sistem antrean task"
      user={user}
    >
      <div className="grid gap-4 lg:grid-cols-[400px_1fr]">
        {/* Config Panel */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-6 backdrop-blur-md">
            <h3 className="mb-4 font-display text-sm font-semibold">Buat Task Baru</h3>

            <div className="space-y-4">
              {/* Prompt */}
              <div>
                <label className="mb-2 block text-xs font-medium text-muted-foreground">
                  Prompt Utama
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Deskripsikan visual yang ingin dibuat..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm placeholder:text-white/30 focus:border-primary/50 focus:outline-none"
                />
              </div>

              {/* Platform */}
              <div>
                <label className="mb-2 block text-xs font-medium text-muted-foreground">
                  Platform
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setPlatform(p.id);
                        setRatio(p.ratios[0]);
                      }}
                      className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-[10px] font-medium transition ${platform === p.id ? "border-primary/60 bg-primary/10 text-primary" : "border-white/10 text-white/60 hover:border-white/30 hover:text-white"}`}
                    >
                      <p.icon className="h-4 w-4" />
                      {p.label.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                {/* Ratio */}
                <div className="flex-1">
                  <label className="mb-2 block text-xs font-medium text-muted-foreground">
                    Rasio Gambar
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlatform.ratios.map((r) => (
                      <button
                        key={r}
                        onClick={() => setRatio(r)}
                        className={`rounded-md border px-2 py-1 text-xs font-medium transition ${ratio === r ? "border-primary bg-primary/20 text-primary" : "border-white/10 text-white/60 hover:border-white/30 hover:text-white"}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Jumlah Generate Dropdown */}
                <div>
                  <label className="mb-2 block text-xs font-medium text-muted-foreground">
                    Jumlah Generate
                  </label>
                  <select
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm outline-none"
                  >
                    {[1, 2, 3, 4].map((n) => (
                      <option key={n} value={n} className="bg-background">
                        {n} Gambar
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleAddTask}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold text-black transition hover:brightness-110"
                style={{ background: "linear-gradient(135deg, #EAB308, #CA8A04, #FACC15)" }}
              >
                <Plus className="h-4 w-4" /> Tambah Task ke Antrean
              </button>
            </div>
          </div>
        </div>

        {/* Queue & Results Panel */}
        <div className="space-y-4">
          {/* Tasks Queue */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-sm font-semibold flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" /> Antrean Task ({tasks.length})
              </h3>
              {tasks.length > 0 && !generating && !done && (
                <button
                  onClick={handleGenerateAll}
                  className="flex items-center gap-2 rounded-lg gradient-gold px-4 py-2 text-sm font-bold text-black hover:brightness-110"
                >
                  <Play className="h-4 w-4" /> Mulai Generate Semua Task
                </button>
              )}
            </div>

            {tasks.length === 0 ? (
              <div className="py-8 text-center text-sm text-white/50 border border-dashed border-white/10 rounded-xl">
                Belum ada task di antrean. Buat task di panel kiri.
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((t, idx) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between bg-black/40 border border-white/10 p-3 rounded-xl"
                  >
                    <div>
                      <p className="text-xs font-bold text-primary mb-1">Task {idx + 1}</p>
                      <p className="text-sm font-medium line-clamp-1">{t.prompt}</p>
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-white/60">
                        <span className="uppercase">{t.platform}</span>
                        <span>&bull;</span>
                        <span>{t.ratio}</span>
                        <span>&bull;</span>
                        <span>{t.count} Gambar</span>
                      </div>
                    </div>
                    {!generating && !done && (
                      <button
                        onClick={() => handleRemoveTask(t.id)}
                        className="text-red-400 hover:text-red-300 p-2 rounded-md hover:bg-white/5"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}

                {!generating && !done && (
                  <div className="flex justify-end pt-2">
                    <div className="text-right">
                      <p className="text-xs text-white/50">Total biaya estimasi:</p>
                      <p className="text-lg font-bold text-primary">
                        Rp {totalCost.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Progress */}
          {(generating || done) && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">
                  {done ? "Semua Task Selesai!" : "Memproses Antrean…"}
                </span>
                <span className="text-primary font-bold">{progress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(90deg, #CA8A04, #EAB308)",
                  }}
                />
              </div>
            </div>
          )}

          {/* Image Grid per Task */}
          {results.length > 0 && (
            <div className="space-y-4">
              {results.map((r, idx) => {
                const taskInfo = tasks.find((t) => t.id === r.taskId);
                return (
                  <div
                    key={r.taskId}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5 backdrop-blur-md"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-display text-sm font-semibold flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" /> Hasil Task {idx + 1}
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                      {r.urls.map((src, i) => (
                        <div
                          key={i}
                          className="group relative overflow-hidden rounded-xl border border-white/10 aspect-square"
                        >
                          <img
                            src={src}
                            alt={`Visual ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                            <button className="rounded-lg bg-white/20 p-2 text-white hover:bg-white/30">
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {generating && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5 backdrop-blur-md opacity-50">
                  <h3 className="font-display text-sm font-semibold flex items-center gap-2 mb-3">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" /> Task selanjutnya...
                  </h3>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
