# DocAPIGuide — Menyambungkan AI untuk Generate Visual

Dokumen ini punya **dua bagian**:

1. **Bagian A — Panduan Non-Teknis (via Dashboard)** — Anda tidak perlu ngoding.
   Cukup buka menu di dashboard, tempel API key, selesai.
2. **Bagian B — Panduan Teknis (untuk developer)** — arsitektur, server route,
   streaming SSE. Lewati kalau Anda tidak butuh.

---

## BAGIAN A — Cara Sambungin OpenAI Tanpa Ngoding

### Ringkasan singkat

Sistem ini sudah punya **AI bawaan (Lovable AI Gateway)** yang aktif otomatis —
jadi tombol *Cetak Ide Sekarang* di menu **Workspace** sudah bisa dipakai tanpa
setup apa pun. Anda **baru perlu masuk ke pengaturan** kalau ingin:

- Pakai akun **OpenAI pribadi** (billing masuk ke akun OpenAI Anda sendiri), atau
- Pakai model spesifik OpenAI (mis. `gpt-image-1`, `dall-e-3`) yang tidak ada di AI bawaan.

### Langkah demi langkah (5 menit)

**1. Ambil API key dari OpenAI**

- Buka https://platform.openai.com/api-keys (login akun OpenAI Anda).
- Klik **Create new secret key** → beri nama bebas (mis. `CetakIde`) → **Create**.
- **Copy** kunci yang muncul (formatnya `sk-...`). Simpan sementara di Notepad —
  OpenAI **tidak akan menampilkan lagi** kunci ini setelah ditutup.
- Pastikan akun OpenAI Anda punya **saldo/billing aktif** di
  https://platform.openai.com/account/billing — tanpa saldo, request akan ditolak.

**2. Masukkan ke Dashboard Cetak Ide**

- Login ke dashboard Cetak Ide.
- Di sidebar kiri, klik menu **Integrations** (ikon plug/steker).
- Klik tombol **+ Tambah Provider**.
- Isi form:
  - **Provider**: pilih `OpenAI`
  - **Model**: ketik `gpt-image-1` (atau `dall-e-3`)
  - **API Key**: tempel kunci `sk-...` dari langkah 1
  - **Label**: bebas (mis. "OpenAI Utama")
- Klik **Simpan**. Kunci akan tersimpan aman di database (tidak pernah tampil ke
  publik).

**3. Aktifkan sebagai default (opsional)**

- Di baris provider yang baru dibuat, geser toggle **Aktif** ke ON.
- Semua provider lain akan otomatis nonaktif (hanya satu yang aktif dalam satu
  waktu).

**4. Coba di Workspace**

- Masuk menu **Workspace** → tulis prompt → klik **Cetak Ide Sekarang**.
- Kalau muncul gambar → sudah tersambung ✅.
- Kalau muncul error → lihat tabel **Troubleshooting** di bawah.

### Troubleshooting (baca kalau ada masalah)

| Pesan error di dashboard | Artinya | Solusi (tanpa coding) |
|---|---|---|
| `Invalid API key` / `401` | Key salah ketik / sudah dihapus di OpenAI. | Buat key baru di OpenAI, edit provider di menu Integrations, tempel ulang. |
| `Insufficient quota` / `402` | Saldo OpenAI habis. | Top up di https://platform.openai.com/account/billing. |
| `Rate limit` / `429` | Terlalu banyak request dalam waktu singkat. | Tunggu 30 detik, coba lagi. Atau upgrade limit di dashboard OpenAI. |
| `Model not found` | Nama model salah ketik. | Edit provider, pastikan model persis `gpt-image-1` atau `dall-e-3`. |
| Tombol *Cetak* diam saja | Belum ada provider aktif. | Buka Integrations, pastikan toggle **Aktif** menyala di salah satu baris. |

### Yang **tidak perlu** Anda lakukan

- ❌ Tidak perlu edit file `.env` di server.
- ❌ Tidak perlu deploy ulang aplikasi.
- ❌ Tidak perlu install package apa pun.
- ❌ Tidak perlu paham istilah *server route*, *SSE*, atau *TanStack*.
- ❌ Tidak perlu hubungi developer — semua bisa dari menu **Integrations**.

### Kapan panggil developer?

Panggil developer / kirim link Bagian B di bawah **hanya jika**:

- Anda ingin **streaming preview progresif** (gambar muncul buram → tajam bertahap).
- Anda ingin **model image di luar OpenAI** (mis. Stability AI, Midjourney API).
- Anda ingin **kustom prompt enhancer** otomatis.

Untuk pemakaian standar (prompt → gambar jadi), Bagian A sudah cukup.

### Multi-API Key & Auto-Fallback (baru)

Anda **boleh tambah banyak key sekaligus** di menu Integrations — dari akun
OpenAI yang berbeda, atau campur beberapa provider. Sistem otomatis:

1. **Coba key dengan angka prioritas paling kecil** (kolom `#`). Naikkan/turunkan
   prioritas dengan panah ↑↓ di sebelah angka.
2. **Kalau key gagal** karena saldo habis (402) atau rate-limit (429), sistem
   otomatis pindah ke key berikutnya — user tidak melihat error, gambar tetap
   jadi.
3. **Key yang saldonya habis** ditandai `❌ Saldo habis` dan **di-recheck otomatis
   24 jam kemudian** (siapa tahu Anda sudah top up).
4. **Key yang kena rate-limit** ditandai `⚠️ Rate-limit · retry Nm` dan dicoba
   lagi setelah cooldown 10 menit.
5. **Key dengan format invalid** langsung dinonaktifkan; klik ikon 🔄 untuk
   mengaktifkan ulang setelah Anda perbaiki di modal edit.

Panel di atas tabel menampilkan `X / Y Key Aktif`, `Request Berhasil Hari Ini`,
dan `Failover Hari Ini` — pantau supaya tahu key mana perlu di-top-up.

Contoh kasus: Anda punya 3 akun OpenAI (A, B, C) masing-masing $5. User generate
50 gambar sekaligus. Kalau A habis di gambar ke-17, sistem otomatis lanjut ke B;
kalau B habis di ke-34, lanjut ke C. User tetap dapat 50 gambar, tidak ada error
di layar mereka. Semua tercatat di kolom "Failover Hari Ini".

---

## BAGIAN B — Panduan Teknis (untuk developer)

Bagian di bawah ini menjelaskan cara developer menyambungkan API AI ke dashboard
**Cetak Ide** agar tombol *Cetak Ide Sekarang* di `/workspace` benar-benar
menghasilkan gambar (bukan mock). Stack: **TanStack Start + Lovable Cloud (Supabase)**.

Kita punya dua opsi:

| Opsi | Model | Env Var | Endpoint | Rekomendasi |
|------|-------|---------|----------|-------------|
| **A. Lovable AI Gateway** (default) | `openai/gpt-image-2`, `google/gemini-3-pro-image`, dll. | `LOVABLE_API_KEY` (sudah ada) | `https://ai.gateway.lovable.dev/v1/images/generations` | ✅ **Pakai ini** — tanpa setup, credit otomatis. |
| **B. OpenAI langsung** | `gpt-image-1`, `dall-e-3` | `OPENAI_API_KEY` (harus di-set via `add_secret`) | `https://api.openai.com/v1/images/generations` | Hanya jika butuh billing OpenAI Anda sendiri. |

> **Aturan emas:** endpoint image generation **HARUS dipanggil dari server**, tidak
> pernah dari browser. Kunci API tidak boleh bocor ke client.

---

## 1. Arsitektur di project ini

```
┌────────────────────────────┐    POST /api/generate-image      ┌──────────────────────┐
│ /workspace (React client)  │ ───────────────────────────────▶ │  Server Route        │
│  - Prompt + preset         │  (JSON: prompt, preset, ratio)   │  src/routes/api/     │
│  - Tombol "Cetak Ide"      │                                   │  generate-image.ts   │
│  - Render <img> streaming  │ ◀──────── SSE (base64 frame) ──── │  createFileRoute()   │
└────────────────────────────┘                                   └──────────┬───────────┘
                                                                            │ fetch (Bearer LOVABLE_API_KEY)
                                                                            ▼
                                                                ┌──────────────────────┐
                                                                │ Lovable AI Gateway   │
                                                                │ /v1/images/generations│
                                                                └──────────────────────┘
```

**Kenapa server route bukan `createServerFn`?** Karena kita butuh **streaming SSE**
agar preview gambar muncul progresif (ala Lovable) — `createServerFn` menserialisasi
return value dan tidak bisa mengalirkan `Response`.

---

## 2. Setup env

Cek dulu apakah `LOVABLE_API_KEY` sudah ada (harusnya sudah — Lovable Cloud
menyediakannya otomatis):

```bash
# di Lovable dashboard: Settings > Secrets
# Nama: LOVABLE_API_KEY
# Nilai: (dikelola Lovable — tidak perlu di-copy manual)
```

Jika mau pakai OpenAI langsung, tambahkan:

```bash
# via tool add_secret di chat: "add OPENAI_API_KEY"
OPENAI_API_KEY=sk-...
```

---

## 3. Server route (streaming, Opsi A — direkomendasikan)

Buat file berikut:

```ts
// src/routes/api/generate-image.ts
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/generate-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { prompt, ratio = "1:1", preset } = (await request.json()) as {
          prompt: string;
          ratio?: "1:1" | "9:16" | "16:9";
          preset?: string;
        };

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const size =
          ratio === "9:16" ? "1024x1792" :
          ratio === "16:9" ? "1792x1024" :
          "1024x1024";

        // Prompt engineering — inject preset & niche context Cetak Ide
        const fullPrompt = [
          preset ? `Style preset: ${preset}.` : "",
          "Poster iklan Indonesia kekinian, tipografi bold, warna kontras tinggi, dense layout.",
          prompt,
        ].filter(Boolean).join(" ");

        const upstream = await fetch(
          "https://ai.gateway.lovable.dev/v1/images/generations",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "openai/gpt-image-2",
              prompt: fullPrompt,
              size,
              quality: "low",         // ganti "medium"/"high" untuk kualitas
              n: 1,
              stream: true,           // WAJIB agar preview progresif
              partial_images: 1,      // hanya untuk openai/*, hapus untuk gemini
            }),
          },
        );

        if (!upstream.ok || !upstream.body) {
          return new Response(await upstream.text(), { status: upstream.status });
        }

        // Forward SSE apa adanya — JANGAN dibungkus ReadableStream sendiri
        return new Response(upstream.body, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
          },
        });
      },
    },
  },
});
```

### Kenapa fields ini

- `stream: true` + `partial_images: 1` → tampilan gambar muncul bertahap (partial → final), efek "ala Lovable".
- `size` → hitung dari `ratio` supaya sesuai Instagram/Facebook/YouTube.
- `quality: "low"` → murah & cepat; naikkan untuk final print.

---

## 4. Helper client (parse SSE + render progresif)

```ts
// src/lib/streamImage.ts
import { createParser } from "eventsource-parser";
import { flushSync } from "react-dom";

export async function streamImage(
  endpoint: string,
  body: Record<string, unknown>,
  onFrame: (dataUrl: string, isFinal: boolean) => void,
) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) throw new Error(`Generate gagal: ${res.status}`);

  let ok = false;
  const parser = createParser({
    onEvent(event) {
      let payload: any;
      try { payload = JSON.parse(event.data); } catch { return; }
      if (event.event === "error" || payload?.type === "error") {
        throw new Error(payload?.error?.message ?? "Generate gagal");
      }
      if (event.event !== "image_generation.partial_image" &&
          event.event !== "image_generation.completed") return;
      const isFinal = event.event === "image_generation.completed";
      // WAJIB flushSync — tanpa ini React 18 batch semua partial jadi satu render
      flushSync(() => onFrame(`data:image/png;base64,${payload.b64_json}`, isFinal));
      if (isFinal) ok = true;
    },
  });
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    parser.feed(value);
  }
  if (!ok) throw new Error("Stream selesai tanpa image completed");
}
```

Install parser:

```bash
bun add eventsource-parser
```

---

## 5. Sambungkan ke tombol *Cetak Ide Sekarang*

Di `src/routes/_authenticated/workspace.tsx` — cari `handleGenerate`:

```tsx
import { streamImage } from "@/lib/streamImage";
import { toast } from "sonner";

const [previewSrc, setPreviewSrc] = useState<string | null>(null);
const [isFinal, setIsFinal] = useState(false);

async function handleGenerate() {
  setGenerating(true);
  setPreviewSrc(null);
  setIsFinal(false);

  // 1. Potong saldo lewat RPC — sudah ada di db (potong_saldo_generate())
  const { data: ok, error: rpcErr } = await supabase.rpc("potong_saldo_generate");
  if (rpcErr || !ok) {
    toast.error("Saldo tidak cukup atau gagal potong saldo.");
    setGenerating(false);
    return;
  }

  // 2. Stream generate image
  try {
    await streamImage(
      "/api/generate-image",
      { prompt, ratio: selectedRatio, preset: selectedPreset },
      (dataUrl, final) => {
        setPreviewSrc(dataUrl);
        if (final) setIsFinal(true);
      },
    );
    toast.success("Visual berhasil dicetak!");

    // 3. Simpan ke tabel projects
    await supabase.from("projects").insert({
      user_id: user.userId,
      kebutuhan: prompt,
      image_url: previewSrc, // base64 — sebaiknya upload ke storage bucket dulu
      platform: selectedPlatform,
      aspect_ratio: selectedRatio,
      status: "sukses",
    });
  } catch (e: any) {
    toast.error(e.message ?? "Generate gagal");
  } finally {
    setGenerating(false);
  }
}
```

Render preview:

```tsx
{previewSrc && (
  <img
    src={previewSrc}
    className={`w-full transition-[filter] duration-300 ${
      isFinal ? "blur-0" : "blur-xl"
    }`}
  />
)}
```

> `blur` pada partial frame **penting** — tanpa itu preview akan flicker antar
> iterasi dan terlihat seperti bug. Ini pola visual persis yang dipakai Lovable.

---

## 6. Simpan hasil final ke Storage (opsional tapi disarankan)

Base64 di kolom `image_url` cepat tapi berat untuk DB. Idealnya upload ke
Lovable Cloud Storage:

```ts
import { decode } from "base64-arraybuffer";

const bytes = decode(previewSrc.split(",")[1]);
const path = `${user.userId}/${Date.now()}.png`;
const { data, error } = await supabase.storage
  .from("generated-images")
  .upload(path, bytes, { contentType: "image/png" });

// Simpan public URL ke projects.image_url
const { data: pub } = supabase.storage.from("generated-images").getPublicUrl(path);
await supabase.from("projects").insert({ ..., image_url: pub.publicUrl });
```

Sebelum ini bekerja, buat bucket `generated-images` (public) dulu.

---

## 7. Menu dashboard yang sudah siap menerima integrasi

| Menu | File | Yang tinggal disambung |
|------|------|-----------------------|
| **Workspace** (`/workspace`) | `src/routes/_authenticated/workspace.tsx` | `handleGenerate` → panggil `streamImage()` (lihat §5) |
| **Bulk Generator** (`/bulk-generator`) | `src/routes/_authenticated/bulk-generator.tsx` | Loop `streamImage()` per baris prompt, throttle 1 detik |
| **Editor Studio** (`/editor-studio`) | `src/routes/_authenticated/editor-studio.tsx` | Panggil endpoint `/v1/images/edits` (Nano Banana) untuk edit |
| **Inpainting** (`/inpainting`) | `src/routes/_authenticated/inpainting.tsx` | Sama dgn editor tapi kirim mask base64 |
| **Playground** (`/playground`) | `src/routes/_authenticated/playground.tsx` | Free-form model picker (openai vs gemini) |
| **API Keys** (`/api-keys`) | `src/routes/_authenticated/api-keys.tsx` | UI user untuk BYO OpenAI key (opsional, override server default) |
| **API Doc** (`/api-doc`) | `src/routes/_authenticated/api-doc.tsx` | Publish dokumentasi dari file ini ke pengguna akhir |

---

## 8. Model yang tersedia (Lovable AI Gateway)

| Model | Use case | Support `partial_images` |
|-------|----------|--------------------------|
| `openai/gpt-image-2` | **Default** — kualitas seimbang | ✅ |
| `openai/gpt-image-1-mini` | Lebih murah, cocok bulk | ✅ |
| `google/gemini-2.5-flash-image` | Cepat, gaya Nano Banana | ❌ (native) |
| `google/gemini-3.1-flash-image` | Nano Banana 2 — cepat + kualitas pro | ❌ (native) |
| `google/gemini-3-pro-image` | Kualitas tertinggi | ❌ (native) |

**Ganti model:** ubah field `model` di body request. Untuk Gemini, **jangan** kirim
`prompt` — pakai `messages: [{role: "user", content: "..."}]` + `modalities: ["image","text"]`.

---

## 9. Error handling wajib

| Kode | Arti | Aksi |
|------|------|------|
| `429` | Rate limit | Backoff eksponensial, retry sekali |
| `402` | Credit habis | Toast: "Isi ulang saldo Lovable Cloud" |
| `400` + `content_policy_violation` | Prompt kena moderasi | Toast: minta user rephrase, jangan auto-retry |
| Stream selesai tanpa `completed` | Timeout / dropped | Retry sekali, kalau gagal → error |

---

## 10. Checklist go-live

- [ ] `LOVABLE_API_KEY` tersedia di env server
- [ ] Route `/api/generate-image` dibuat & di-test dgn `curl`
- [ ] `eventsource-parser` di-install
- [ ] `streamImage()` helper di `src/lib/`
- [ ] Tombol *Cetak Ide Sekarang* di workspace memanggil helper
- [ ] Skeleton + progress indicator saat generating (sudah ada di Bento landing — copy pola yg sama)
- [ ] Blur partial frame saat streaming
- [ ] RPC `potong_saldo_generate()` dipanggil **sebelum** generate
- [ ] Insert ke tabel `projects` setelah `image_url` tersimpan (idealnya URL storage)
- [ ] Handle 429/402/moderation dgn toast yang jelas

Selamat menyambungkan 🎨