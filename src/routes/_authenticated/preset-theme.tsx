import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, useAppUser } from "@/components/app-shell";
import { toast } from "sonner";

export const PRESET_THEMES = ["Glassmorphism", "Neumorphism (Soft UI)", "Brutalism", "Minimalism"];

export const DEFAULT_IMG = "/assets/preset-default.jpg";

/**
 * Skeleton prototype mini-preview per preset — memberi feel visual
 * masing-masing gaya (Glassmorphism, Neumorphism, Brutalism, Minimalism)
 * tanpa perlu load gambar sungguhan.
 */
export function ThemeSkeletonPreview({ theme }: { theme: string }) {
  const t = theme.toLowerCase();

  if (t.includes("glass")) {
    return (
      <div className="relative h-40 w-full overflow-hidden rounded-t-2xl bg-gradient-to-br from-fuchsia-500/40 via-indigo-500/30 to-cyan-400/30">
        <div className="absolute -left-6 top-6 h-24 w-24 rounded-full bg-pink-400/60 blur-2xl" />
        <div className="absolute right-4 bottom-4 h-20 w-20 rounded-full bg-cyan-300/60 blur-2xl" />
        <div className="absolute inset-3 rounded-xl border border-white/40 bg-white/10 backdrop-blur-md p-3 flex flex-col gap-2">
          <div className="skeleton-shimmer h-2 w-1/2 rounded-full" />
          <div className="skeleton-shimmer h-2 w-3/4 rounded-full" />
          <div className="mt-auto flex gap-2">
            <div className="skeleton-shimmer h-6 w-16 rounded-full" />
            <div className="skeleton-shimmer h-6 w-6 rounded-full" />
          </div>
        </div>
      </div>
    );
  }
  if (t.includes("neu") || t.includes("soft")) {
    return (
      <div className="relative h-40 w-full overflow-hidden rounded-t-2xl bg-[#e0e5ec] p-4">
        <div className="h-full w-full rounded-2xl bg-[#e0e5ec] shadow-[8px_8px_16px_#a3b1c6,-8px_-8px_16px_#ffffff] p-3 flex flex-col gap-2">
          <div className="h-2 w-1/2 rounded-full bg-gray-300/60" />
          <div className="h-2 w-3/4 rounded-full bg-gray-300/60" />
          <div className="mt-auto flex gap-2">
            <div className="h-6 w-16 rounded-lg bg-[#e0e5ec] shadow-[3px_3px_6px_#a3b1c6,-3px_-3px_6px_#ffffff]" />
            <div className="h-6 w-6 rounded-lg bg-[#e0e5ec] shadow-[3px_3px_6px_#a3b1c6,-3px_-3px_6px_#ffffff]" />
          </div>
        </div>
      </div>
    );
  }
  if (t.includes("brutal")) {
    return (
      <div className="relative h-40 w-full overflow-hidden rounded-t-none border-b-4 border-black bg-yellow-400 p-4">
        <div className="h-full w-full border-4 border-black bg-white p-3 shadow-[6px_6px_0px_#000] flex flex-col gap-2">
          <div className="h-3 w-2/3 bg-black" />
          <div className="h-2 w-full bg-black/70" />
          <div className="h-2 w-4/5 bg-black/70" />
          <div className="mt-auto flex gap-2">
            <div className="h-6 w-16 border-2 border-black bg-black" />
            <div className="h-6 w-6 border-2 border-black bg-red-500" />
          </div>
        </div>
      </div>
    );
  }
  // Minimalism (default)
  return (
    <div className="relative h-40 w-full overflow-hidden rounded-t-sm bg-white p-6">
      <div className="flex h-full w-full flex-col gap-3">
        <div className="h-1 w-8 bg-black" />
        <div className="h-2 w-1/2 bg-gray-200" />
        <div className="h-2 w-3/4 bg-gray-200" />
        <div className="h-2 w-1/3 bg-gray-200" />
        <div className="mt-auto flex items-center gap-3">
          <div className="h-6 w-20 bg-black" />
          <div className="h-[1px] flex-1 bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

export const getThemeStyles = (theme: string) => {
  const t = theme.toLowerCase();

  // Default base
  let wrapper = "bg-[#0D1117] border-white/10 text-white rounded-xl border";
  let image = "rounded-t-lg";
  let title = "text-white";
  let button = "bg-primary text-black rounded";

  if (t.includes("glass")) {
    wrapper =
      "bg-white/5 border border-white/20 backdrop-blur-md rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)]";
    button = "bg-white/20 text-white border border-white/30 rounded-full";
  } else if (t.includes("neu") || t.includes("soft")) {
    wrapper =
      "bg-[#e0e5ec] border-transparent rounded-2xl shadow-[8px_8px_16px_#a3b1c6,-8px_-8px_16px_#ffffff] text-gray-800";
    title = "text-gray-800 font-medium";
    button =
      "bg-[#e0e5ec] text-gray-800 shadow-[4px_4px_8px_#a3b1c6,-4px_-4px_8px_#ffffff] rounded-lg";
  } else if (t.includes("clay")) {
    wrapper =
      "bg-[#f3f4f6] border-transparent rounded-[2rem] shadow-[inset_8px_8px_16px_#ffffff,inset_-8px_-8px_16px_#d1d5db,8px_8px_16px_#d1d5db] text-gray-800";
    title = "text-gray-800 font-bold";
    button =
      "bg-[#f3f4f6] text-gray-800 shadow-[inset_4px_4px_8px_#ffffff,inset_-4px_-4px_8px_#d1d5db] rounded-2xl";
  } else if (t.includes("brutal")) {
    wrapper =
      "bg-yellow-400 border-4 border-black rounded-none shadow-[8px_8px_0px_0px_#000000] text-black";
    title = "text-black font-black uppercase";
    image = "rounded-none border-b-4 border-black";
    button =
      "bg-black text-white font-bold uppercase rounded-none border-2 border-black hover:bg-gray-800";
  } else if (t.includes("minimal")) {
    wrapper = "bg-white border-gray-100 border rounded-sm shadow-sm text-black";
    title = "text-black font-light tracking-wide";
    image = "rounded-none grayscale opacity-80";
    button = "bg-black text-white rounded-none font-medium hover:bg-gray-800";
  } else if (t.includes("dark")) {
    wrapper = "bg-black border-gray-800 border rounded-lg shadow-2xl text-white";
    button = "bg-gray-800 text-white rounded hover:bg-gray-700";
  } else if (t.includes("cyber") || t.includes("neon")) {
    wrapper =
      "bg-black border-pink-500 border rounded-none shadow-[0_0_15px_#ec4899] text-pink-500";
    title = "text-pink-500 font-mono";
    button = "bg-transparent text-cyan-400 border border-cyan-400 font-mono hover:bg-cyan-900";
  } else if (t.includes("retro") || t.includes("memphis")) {
    wrapper =
      "bg-pink-300 border-4 border-black rounded-xl shadow-[6px_6px_0px_0px_#000000] text-black";
    title = "text-black font-black";
    button =
      "bg-cyan-400 text-black border-2 border-black rounded-full font-bold hover:bg-cyan-500";
  } else if (t.includes("bauhaus")) {
    wrapper = "bg-[#FDF4E3] border-4 border-[#232121] rounded-none text-[#232121]";
    title = "text-[#E63946] font-bold";
    image = "rounded-none border-b-4 border-[#232121]";
    button = "bg-[#1D3557] text-white rounded-none border-2 border-[#232121] hover:bg-[#457B9D]";
  } else if (t.includes("material")) {
    wrapper = "bg-white border-transparent rounded-xl shadow-md text-gray-900";
    title = "text-gray-900 font-medium";
    button =
      "bg-[#6200EE] text-white rounded-full uppercase text-xs font-bold shadow-sm hover:bg-[#3700B3]";
  } else if (t.includes("fluent") || t.includes("windows")) {
    wrapper =
      "bg-white/60 border-white/40 border backdrop-blur-xl rounded-lg shadow-sm text-gray-900";
    title = "text-gray-900";
    button = "bg-[#0078D4] text-white rounded shadow-sm hover:bg-[#106EBE]";
  } else if (t.includes("apple") || t.includes("ios")) {
    wrapper = "bg-[#F2F2F7] border-transparent rounded-2xl shadow-sm text-black";
    title = "text-black font-semibold tracking-tight";
    button = "bg-[#007AFF] text-white rounded-full font-semibold hover:bg-[#0056b3]";
  }

  return { wrapper, image, title, button };
};

export const Route = createFileRoute("/_authenticated/preset-theme")({
  head: () => ({
    meta: [{ title: "Preset Theme — Cetak Ide" }, { name: "robots", content: "noindex" }],
  }),
  component: PresetTheme,
});

function PresetTheme() {
  const navigate = useNavigate();
  const { user } = useAppUser();

  const handleSelect = (theme: string) => {
    navigate({
      to: "/workspace",
      search: { preset: theme },
    });
    toast.success(`Preset ${theme} dipilih.`);
  };

  return (
    <AppShell
      title="Preset Theme"
      subtitle="Pilih preset visual yang ingin Anda terapkan ke desain"
      user={user}
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {PRESET_THEMES.map((theme) => {
          const styles = getThemeStyles(theme);
          return (
            <button
              key={theme}
              onClick={() => handleSelect(theme)}
              className={`group relative flex flex-col overflow-hidden text-left transition-transform hover:scale-[1.02] active:scale-95 ${styles.wrapper}`}
            >
              <ThemeSkeletonPreview theme={theme} />
              <div className="flex flex-col p-4 flex-1">
                <h2 className={`text-base font-bold flex-1 ${styles.title}`}>{theme}</h2>
                <div className="mt-4 flex items-center justify-between">
                  <span
                    className={`px-3 py-1.5 text-xs font-semibold inline-block ${styles.button}`}
                  >
                    Gunakan Preset
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </AppShell>
  );
}
