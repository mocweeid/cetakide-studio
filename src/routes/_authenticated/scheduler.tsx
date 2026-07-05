import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, useAppUser } from "@/components/app-shell";
import {
  Calendar,
  Plus,
  Instagram,
  Facebook,
  Youtube,
  X,
  Clock,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/scheduler")({
  head: () => ({
    meta: [{ title: "Kalender Konten — CetakIde" }, { name: "robots", content: "noindex" }],
  }),
  component: SchedulerPage,
});

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
const DAYS_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: Instagram, color: "#E1306C" },
  { id: "facebook", label: "Facebook", icon: Facebook, color: "#1877F2" },
  { id: "youtube", label: "YouTube", icon: Youtube, color: "#FF0000" },
];

const INIT_SCHEDULES = [
  { id: "1", date: 5, platform: "instagram", title: "Flash sale Ramadan", time: "08:00" },
  { id: "2", date: 10, platform: "facebook", title: "Promo weekend restoran", time: "12:00" },
  { id: "3", date: 15, platform: "youtube", title: "Thumbnail review Q3", time: "10:00" },
  { id: "4", date: 20, platform: "instagram", title: "Story koleksi baru", time: "19:00" },
  { id: "5", date: 25, platform: "facebook", title: "Iklan akhir bulan", time: "07:00" },
];

function getPlatformMeta(id: string) {
  return PLATFORMS.find((p) => p.id === id) ?? PLATFORMS[0];
}

function SchedulerPage() {
  const { user } = useAppUser();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [schedules, setSchedules] = useState(INIT_SCHEDULES);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", platform: "instagram", time: "08:00" });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  }

  function addSchedule() {
    if (!form.title || !selectedDate) return;
    setSchedules((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        date: selectedDate,
        platform: form.platform,
        title: form.title,
        time: form.time,
      },
    ]);
    toast.success("Jadwal berhasil ditambahkan!");
    setShowForm(false);
    setForm({ title: "", platform: "instagram", time: "08:00" });
  }

  function removeSchedule(id: string) {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    toast.success("Jadwal dihapus.");
  }

  const upcomingSchedules = schedules
    .filter((s) => s.date >= now.getDate())
    .sort((a, b) => a.date - b.date);

  return (
    <AppShell
      title="Kalender Konten"
      subtitle="Jadwalkan dan kelola postingan visual Anda"
      user={user}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-6 backdrop-blur-md">
          {/* Month Navigation */}
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={prevMonth}
              className="rounded-lg p-2 text-muted-foreground hover:bg-white/10 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h3 className="font-display text-sm font-semibold">
              {MONTHS[month]} {year}
            </h3>
            <button
              onClick={nextMonth}
              className="rounded-lg p-2 text-muted-foreground hover:bg-white/10 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="mb-2 grid grid-cols-7 gap-1">
            {DAYS_SHORT.map((d) => (
              <div
                key={d}
                className="text-center text-[10px] font-semibold text-muted-foreground py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day Cells */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const daySchedules = schedules.filter((s) => s.date === day);
              const isToday =
                day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
              const isSelected = selectedDate === day;
              return (
                <button
                  key={day}
                  onClick={() => {
                    setSelectedDate(day);
                    setShowForm(true);
                  }}
                  className={`relative flex min-h-[44px] flex-col items-center rounded-lg p-1 text-xs transition hover:bg-white/10 ${isToday ? "border border-primary/60 bg-primary/10" : ""} ${isSelected ? "bg-white/10" : ""}`}
                >
                  <span className={`font-medium ${isToday ? "text-primary" : "text-white/80"}`}>
                    {day}
                  </span>
                  {daySchedules.length > 0 && (
                    <div className="mt-0.5 flex gap-0.5">
                      {daySchedules.slice(0, 3).map((s) => {
                        const pm = getPlatformMeta(s.platform);
                        return (
                          <div
                            key={s.id}
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ background: pm.color }}
                          />
                        );
                      })}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Add Schedule Form */}
          {showForm && selectedDate && (
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 backdrop-blur-md">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold">
                  Tambah Jadwal — {selectedDate} {MONTHS[month]}
                </h4>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-muted-foreground hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3">
                <input
                  placeholder="Judul konten"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm placeholder:text-white/30 focus:border-primary/50 focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={form.platform}
                    onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
                    className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm focus:border-primary/50 focus:outline-none"
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                    className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm focus:border-primary/50 focus:outline-none"
                  />
                </div>
                <button
                  onClick={addSchedule}
                  className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-black transition hover:brightness-110"
                  style={{ background: "linear-gradient(135deg, #EAB308, #CA8A04)" }}
                >
                  <Plus className="h-4 w-4" /> Tambah Jadwal
                </button>
              </div>
            </div>
          )}

          {/* Upcoming Schedules */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
            <h3 className="mb-3 font-display text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" /> Jadwal Mendatang
            </h3>
            {upcomingSchedules.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-4">
                Belum ada jadwal bulan ini
              </p>
            ) : (
              <div className="space-y-2">
                {upcomingSchedules.map((s) => {
                  const pm = getPlatformMeta(s.platform);
                  return (
                    <div key={s.id} className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: pm.color + "22" }}
                      >
                        <pm.icon className="h-4 w-4" style={{ color: pm.color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-white/90">{s.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {s.date} {MONTHS[month]} · {s.time}
                        </p>
                      </div>
                      <button
                        onClick={() => removeSchedule(s.id)}
                        className="shrink-0 text-muted-foreground hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            <button
              onClick={() => {
                setSelectedDate(now.getDate());
                setShowForm(true);
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-xs font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <Calendar className="h-3.5 w-3.5" /> Tambah Jadwal Baru
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
