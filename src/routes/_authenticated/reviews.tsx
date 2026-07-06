import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, useAppUser } from "@/components/app-shell";
import { MessageSquare, Star, Send, ThumbsUp, TrendingUp, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/reviews")({
  head: () => ({
    meta: [{ title: "Ulasan & Feedback — Cetak Ide" }, { name: "robots", content: "noindex" }],
  }),
  component: ReviewsPage,
});

const MOCK_REVIEWS = [
  {
    id: "1",
    name: "Budi Santoso",
    avatar: "B",
    rating: 5,
    text: "Cetak Ide luar biasa! Desain iklan saya jadi 10x lebih cepat dan hasilnya jauh lebih profesional dari sebelumnya.",
    date: "2026-07-01",
    platform: "Instagram",
    helpful: 12,
  },
  {
    id: "2",
    name: "Siti Rahayu",
    avatar: "S",
    rating: 5,
    text: "Hasil generate untuk keperluan Facebook Ads sangat memuaskan. CTR iklan saya naik 35% setelah pakai Cetak Ide!",
    date: "2026-06-25",
    platform: "Facebook Ads",
    helpful: 8,
  },
  {
    id: "3",
    name: "Andi Pratama",
    avatar: "A",
    rating: 4,
    text: "Platform yang sangat membantu untuk bisnis kecil seperti saya. Harga terjangkau, hasil profesional.",
    date: "2026-06-20",
    platform: "Marketplace",
    helpful: 5,
  },
  {
    id: "4",
    name: "Dewi Lestari",
    avatar: "D",
    rating: 5,
    text: "Fitur bulk generator sangat menghemat waktu! Bisa buat 20 variasi iklan dalam hitungan menit.",
    date: "2026-06-15",
    platform: "Instagram",
    helpful: 15,
  },
  {
    id: "5",
    name: "Reza Kurniawan",
    avatar: "R",
    rating: 4,
    text: "Recommended banget buat yang jualan online. Visual jadi lebih menarik, penjualan naik signifikan.",
    date: "2026-06-10",
    platform: "TikTok Shop",
    helpful: 9,
  },
];

function ReviewsPage() {
  const { user } = useAppUser();
  const [myRating, setMyRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [myReview, setMyReview] = useState("");
  const [myPlatform, setMyPlatform] = useState("Instagram");
  const [submitted, setSubmitted] = useState(false);
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, boolean>>({});

  const avgRating = MOCK_REVIEWS.reduce((s, r) => s + r.rating, 0) / MOCK_REVIEWS.length;
  const ratingDist = [5, 4, 3, 2, 1].map((r) => ({
    stars: r,
    count: MOCK_REVIEWS.filter((rv) => rv.rating === r).length,
    pct: (MOCK_REVIEWS.filter((rv) => rv.rating === r).length / MOCK_REVIEWS.length) * 100,
  }));

  function submitReview() {
    if (!myRating) {
      toast.error("Pilih rating terlebih dahulu!");
      return;
    }
    if (!myReview.trim()) {
      toast.error("Tulis ulasan Anda!");
      return;
    }
    setSubmitted(true);
    toast.success("Ulasan berhasil dikirim! Terima kasih atas feedback Anda.");
  }

  function voteHelpful(id: string) {
    setHelpfulVotes((prev) => ({ ...prev, [id]: !prev[id] }));
    toast.success(helpfulVotes[id] ? "Suara dibatalkan" : "Ulasan ini ditandai sebagai membantu!");
  }

  return (
    <AppShell
      title="Ulasan & Feedback"
      subtitle="Lihat pengalaman pengguna dan bagikan ulasan Anda"
      user={user}
    >
      <div className="space-y-4">
        {/* Rating Overview */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Score */}
          <div className="flex items-center gap-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md">
            <div className="text-center">
              <p className="font-display text-5xl font-black text-primary">
                {avgRating.toFixed(1)}
              </p>
              <div className="my-2 flex justify-center">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-4 w-4 ${s <= Math.round(avgRating) ? "fill-primary text-primary" : "text-white/20"}`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{MOCK_REVIEWS.length} ulasan</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {ratingDist.map(({ stars, count, pct }) => (
                <div key={stars} className="flex items-center gap-2 text-xs">
                  <span className="w-4 text-right text-muted-foreground">{stars}</span>
                  <Star className="h-3 w-3 fill-primary text-primary shrink-0" />
                  <div className="flex-1 h-1.5 rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-3 text-muted-foreground">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Pengguna Puas", value: "94%", icon: ThumbsUp, color: "#10b981" },
              {
                label: "Ulasan Terverifikasi",
                value: MOCK_REVIEWS.length.toString(),
                icon: MessageSquare,
                color: "#3b82f6",
              },
              {
                label: "Platform Terpopuler",
                value: "Instagram",
                icon: TrendingUp,
                color: "#E1306C",
              },
              { label: "Fitur Terfavorit", value: "Bulk Gen", icon: Sparkles, color: "#EAB308" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-md"
              >
                <div
                  className="mb-1.5 flex h-7 w-7 items-center justify-center rounded-xl"
                  style={{ background: color + "22" }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color }} />
                </div>
                <p className="font-display text-base font-bold text-white">{value}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Review List */}
          <div className="lg:col-span-2 space-y-3">
            {MOCK_REVIEWS.map((review) => (
              <div
                key={review.id}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5 backdrop-blur-md"
              >
                <div className="mb-3 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 font-bold text-primary">
                    {review.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-white">{review.name}</p>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] text-white/60">
                        {review.platform}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3 w-3 ${s <= review.rating ? "fill-primary text-primary" : "text-white/20"}`}
                        />
                      ))}
                      <span className="ml-1 text-[10px] text-muted-foreground">
                        {new Date(review.date).toLocaleDateString("id-ID")}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-white/80 leading-relaxed">{review.text}</p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => voteHelpful(review.id)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-medium transition ${helpfulVotes[review.id] ? "border-primary/40 bg-primary/10 text-primary" : "border-white/10 text-white/50 hover:border-white/30 hover:text-white"}`}
                  >
                    <ThumbsUp className="h-3 w-3" />
                    Membantu ({review.helpful + (helpfulVotes[review.id] ? 1 : 0)})
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Submit Review */}
          <div>
            {!submitted ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5 backdrop-blur-md sticky top-4">
                <h3 className="mb-4 font-display text-sm font-semibold flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary" /> Tulis Ulasan Anda
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-muted-foreground">
                      Rating Anda
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          onMouseEnter={() => setHoverRating(s)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setMyRating(s)}
                          className="transition hover:scale-110"
                        >
                          <Star
                            className={`h-7 w-7 transition ${s <= (hoverRating || myRating) ? "fill-primary text-primary" : "text-white/20"}`}
                          />
                        </button>
                      ))}
                    </div>
                    {myRating > 0 && (
                      <p className="mt-1 text-xs text-primary">
                        {["", "Buruk", "Kurang", "Cukup", "Bagus", "Luar Biasa!"][myRating]}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Platform yang Anda Gunakan
                    </label>
                    <select
                      value={myPlatform}
                      onChange={(e) => setMyPlatform(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm focus:border-primary/50 focus:outline-none"
                    >
                      {["Instagram", "Facebook Ads", "YouTube", "Marketplace", "TikTok Shop"].map(
                        (p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Ulasan
                    </label>
                    <textarea
                      value={myReview}
                      onChange={(e) => setMyReview(e.target.value)}
                      placeholder="Bagikan pengalaman Anda menggunakan Cetak Ide..."
                      rows={4}
                      className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm placeholder:text-white/30 focus:border-primary/50 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={submitReview}
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-black transition hover:brightness-110"
                    style={{ background: "linear-gradient(135deg, #EAB308, #CA8A04)" }}
                  >
                    <Send className="h-4 w-4" /> Kirim Ulasan
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center backdrop-blur-md">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                  <Star className="h-6 w-6 fill-primary text-primary" />
                </div>
                <h3 className="font-display text-base font-bold text-primary mb-2">
                  Terima kasih!
                </h3>
                <p className="text-sm text-muted-foreground">
                  Ulasan Anda sangat berarti bagi pengembangan Cetak Ide.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
