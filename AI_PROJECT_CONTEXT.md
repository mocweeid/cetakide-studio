# AI_PROJECT_CONTEXT.md

Audit kondisi project untuk fitur **Generate Image** yang memakai `https://ai.yogathedev.com/v1/images/generations`. Aman dibagikan ke AI assistant lain — tidak berisi credential asli.

---

## 1. Tech Stack

| Layer | Tools |
|---|---|
| Framework | **TanStack Start v1** (React 19 + Vite 7, file-based routing) |
| Bahasa | **TypeScript** (strict) |
| Package manager | **bun** |
| Runtime deploy | **Cloudflare Workers** (nitro preset dari `@lovable.dev/vite-tanstack-config`) |
| Backend BaaS | **Supabase** (dihosting via Lovable Cloud) — auth, DB, storage |
| SSE parser (client) | `eventsource-parser` |
| UI | shadcn/ui, Tailwind v4, Radix, framer-motion |
| Lain | `jszip`, `@tanstack/react-query` |

Script `package.json`:
```
dev       : vite dev            (http://localhost:8080)
build     : vite build
build:dev : vite build --mode development
preview   : vite preview
lint      : eslint .
```

Server-side runtime = **Cloudflare workerd** (bukan Node.js penuh). Package Node-only (`child_process`, `sharp`, native addon) tidak dipakai.

---

## 2. Struktur Folder Penting

```
src/
├── routes/
│   ├── __root.tsx
│   ├── api/
│   │   ├── generate-image-stream.ts   ★ endpoint utama generate image (SSE)
│   │   └── check-openai.ts            verifikasi validitas OpenAI key
│   ├── _authenticated/
│   │   ├── workspace.tsx              UI utama pemanggil endpoint
│   │   ├── project.tsx                galeri hasil
│   │   └── admin-ai-keys.tsx          form developer isi API key
│   └── auth.tsx
├── lib/
│   ├── streamImage.ts                 ★ client helper parse SSE
│   ├── generateImage.functions.ts     createServerFn non-stream
│   ├── enhancePrompt.functions.ts
│   ├── autofillField.functions.ts     (Gemini — bukan image)
│   ├── testAiKey.functions.ts
│   └── keyRotation.ts
├── integrations/supabase/
│   ├── client.ts                      browser client
│   ├── client.server.ts               service-role client (server only)
│   ├── auth-middleware.ts             middleware createServerFn
│   └── auth-attacher.ts               client middleware attach bearer
├── start.ts                           registrasi middleware TanStack Start
├── server.ts                          entry SSR (error wrapper)
└── router.tsx                         QueryClient + createRouter

vite.config.ts                         thin wrapper @lovable.dev/vite-tanstack-config
.env                                   hanya VITE_SUPABASE_* + SUPABASE_* (publishable)
```

Secrets non-publik disimpan sebagai Cloudflare/Lovable Worker Secrets, diakses via `process.env.*` di dalam handler — tidak di `.env`.

---

## 3. File Terkait Fitur Generate Image

### 3.1 `src/routes/api/generate-image-stream.ts`  ★
- **Fungsi**: server route `createFileRoute("/api/generate-image-stream")`. Terima `POST { prompt, size, jobId }`, pilih provider, kirim SSE (`provider_status`, `image_generation.completed`, `error`).
- **Status**: kompilasi & deploy OK. Runtime: sering gagal di Provider #1 (YG) → fallback ke Lovable Gateway.
- **Alur handler**:
  1. Validasi Bearer token → resolve `userId` via Supabase.
  2. Buka `ReadableStream` — kirim `provider_status` keep-alive tiap 8 dtk.
  3. **Provider #1 — YG (`CUSTOM_AI_API_KEY`)**: `POST {CUSTOM_AI_BASE_URL}/images/generations`, model `cx/gpt-5.5-image`, retry 3x, non-stream (`Accept: application/json`).
  4. **Provider #2 — Lovable AI Gateway** (`openai/gpt-image-1-mini`).
  5. **Provider #3 — OpenAI user key** dari tabel `ai_providers` atau `OPENAI_API_KEY` env.
  6. **Provider #4 — Cloudflare Workers AI** (`flux-1-schnell`) bila `CLOUDFLARE_*` diset.
  7. Bila semua gagal → `event: error` berisi ringkasan `attempts[]`.
- **Catatan**: request ke YG saat ini **tidak** parse SSE — hanya `await res.text()` lalu `JSON.parse`. Ini gagal jika YG merespons `text/event-stream`.

### 3.2 `src/lib/streamImage.ts`
- **Fungsi**: client helper. Ambil session Supabase → `fetch("/api/generate-image-stream")` dengan bearer → parse SSE via `eventsource-parser` → callback `onFrame(dataUrl, isFinal)` dan `onStatus`.
- **Status**: OK.

### 3.3 `src/routes/_authenticated/workspace.tsx`
- **Fungsi**: UI form (brand kit, prompt, rasio, jumlah). Tombol **Generate** / **Test Generate** memanggil `streamImage(...)`. Simpan hasil ke tabel `projects` dengan `jobId`, `provider`, `error_message`.
- **Status**: OK.

### 3.4 `src/routes/api/check-openai.ts`
- Endpoint verifikasi OpenAI key valid.

### 3.5 `src/lib/enhancePrompt.functions.ts`
- `createServerFn` poles prompt via Lovable Gateway.

---

## 4. Environment Variables

`.env` (aman di repo, publishable):
| Variable | Status |
|---|---|
| `VITE_SUPABASE_URL` | SET |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | SET |
| `VITE_SUPABASE_PROJECT_ID` | SET |
| `SUPABASE_URL` | SET |
| `SUPABASE_PUBLISHABLE_KEY` | SET |
| `SUPABASE_PROJECT_ID` | SET |

Worker Secrets (server-only):
| Variable | Peran | Status |
|---|---|---|
| `CUSTOM_AI_API_KEY` | Bearer ke ai.yogathedev.com | SET (REDACTED) |
| `CUSTOM_AI_BASE_URL` | default `https://ai.yogathedev.com/v1` | optional |
| `CUSTOM_AI_MODEL` | default `cx/gpt-5.5-image` | optional |
| `LOVABLE_API_KEY` | Fallback Lovable Gateway | SET (managed) |
| `LOVABLE_IMAGE_MODEL` | default `openai/gpt-image-1-mini` | optional |
| `OPENAI_API_KEY` | Fallback OpenAI env | NOT SET |
| `OPENAI_BASE_URL` | default `https://api.openai.com/v1` | NOT SET |
| `OPENAI_MODEL` | default `dall-e-3` | NOT SET |
| `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_API_TOKEN` | Fallback CF Workers AI | NOT SET |
| `GEMINI_API_KEY` | Autofill (bukan image) | SET (REDACTED) |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin write | managed |

Tidak ada nilai asli yang ditampilkan.

---

## 5. Alur Fitur Saat Ini

```
[User /workspace]
  klik "Generate" / "Test Generate"
       │
       ▼
[Client — src/lib/streamImage.ts]
  supabase.auth.getSession() → access_token
  POST /api/generate-image-stream
    headers: Authorization: Bearer <JWT>
    body:    { prompt, size, jobId }
       │
       ▼
[Server route — src/routes/api/generate-image-stream.ts]
  1. verifikasi JWT via Supabase
  2. open ReadableStream (SSE ke browser)
  3. Provider #1 YG → POST ai.yogathedev.com/v1/images/generations
     body: { model:"cx/gpt-5.5-image", prompt, n:1,
             size:"auto", quality:"auto", background:"auto",
             image_detail:"high", output_format:"png" }
     baca res.text() → JSON.parse → cari b64_json / data[0].b64_json / url
  4. gagal → Provider #2 Lovable Gateway
  5. gagal → Provider #3 OpenAI
  6. gagal → Provider #4 Cloudflare flux-1-schnell
  7. sukses → event: image_generation.completed { b64_json, provider, jobId }
       │
       ▼
[Client streamImage.ts]
  onFrame(`data:image/png;base64,${b64}`, true)
       │
       ▼
[workspace.tsx]
  <img src=... /> ditampilkan
  supabase.from('projects').insert({ image_url, prompt, provider, job_id, ... })
       │
       ▼
[/project] galeri riwayat
```

---

## 6. Endpoint Internal

### `POST /api/generate-image-stream`
- **Auth**: `Authorization: Bearer <supabase-access-token>` (wajib).
- **Request**:
  ```json
  { "prompt": "string (<=3000)", "size": "1024x1024", "jobId": "uuid-optional" }
  ```
- **Response**: `Content-Type: text/event-stream`.
  ```
  event: provider_status
  data: {"type":"provider_status","provider":"Custom cx/gpt-5.5-image","jobId":"...","message":"Mencoba YG 1/3"}

  event: image_generation.completed
  data: {"type":"image_generation.completed","b64_json":"iVBORw0K...","provider":"Custom cx/gpt-5.5-image","jobId":"...","created_at":1730000000000}
  ```
- **Error**:
  ```
  event: error
  data: {"type":"error","jobId":"...","error":{"message":"Semua provider gagal. Attempts: ..."}}
  ```
- **HTTP status**: 200 streaming, 401 no bearer, 400 no prompt.

### `POST /api/check-openai`
- Cek validitas OpenAI key. Return `{ ok: boolean, message?: string }`.

---

## 7. Audit Integrasi API Yoga

| Kriteria | Kode saat ini | Sesuai `curl` di soal? |
|---|---|---|
| URL | `${CUSTOM_AI_BASE_URL}/images/generations` → `https://ai.yogathedev.com/v1/images/generations` | ✅ |
| Method | POST | ✅ |
| `Authorization: Bearer …` | ✅ | ✅ |
| `Content-Type: application/json` | ✅ | ✅ |
| `Accept: text/event-stream` | ❌ mengirim `Accept: application/json` | ❌ berbeda |
| Body JSON | identik dengan contoh | ✅ |
| Handle SSE response | ❌ tidak — `res.text()` + `JSON.parse` | ❌ akan gagal bila server balikin SSE |
| Handle JSON response | ✅ (`imageResponseToB64` cari `b64_json` / `data[0].b64_json` / `url`) | ✅ |
| Timeout / AbortController | ❌ tidak ada | ⚠️ berpotensi hang |
| Retry | ✅ 3x kecuali 4xx non-retriable | — |
| Error handling | log console, push ke `attempts[]`, fallback provider | — |

**Dua ketidakcocokan utama** vs contoh `curl`:
1. Header `Accept` bukan `text/event-stream`.
2. Tidak ada SSE parser untuk respons YG — jika YG membalas SSE, `JSON.parse` gagal → dianggap "response tanpa gambar".

---

## 8. Error yang Terjadi

| # | Pesan | Muncul di | Kapan | Dugaan penyebab | Yang sudah dicoba |
|---|---|---|---|---|---|
| E1 | `Semua provider gagal. Attempts: Custom cx/gpt-5.5-image [try 1] → 400: No credentials for provider: openai` | SSE `error` → toast Workspace | tiap klik Generate | YG3 proxy butuh BYOK OpenAI upstream di dashboard YG | ganti model ke `cx/gpt-5.5-image` sesuai instruksi dev YG |
| E2 | `response tanpa gambar` | `attempts[]` log | ketika YG merespons `text/event-stream` | `JSON.parse` gagal — parser SSE belum ada | belum diperbaiki |
| E3 | Latency ~40 dtk lalu koneksi putus | frontend | intermittent saat YG lambat | tidak ada AbortController; edge timeout | tambah keep-alive `provider_status` tiap 8 dtk |
| E4 | `stream ended without completed` | browser console | jaringan / worker mati | koneksi SSE putus | tambah SSE keep-alive |
| E5 | Toast "Belum Berhasil" | UI | akumulasi E1+E2 | fallback semua gagal | tombol Retry manual & bulk retry |

Belum ada: dump raw response body YG saat 200 (untuk konfirmasi format SSE/JSON), dan Network tab dump payload real-time.

---

## 9. Dependency & Package

```
"@tanstack/react-router":  "^1.170.16"
"@tanstack/react-start":   "^1.168.26"
"@tanstack/router-plugin": "^1.168.18"
"@tanstack/react-query":   "^5.101.1"
"@supabase/supabase-js":   "^2.109.0"
"@tailwindcss/vite":       "^4.2.1"
"eventsource-parser":      "^3.1.0"     ← client SSE parser
"jszip":                   "^3.10.1"
"framer-motion":           "^12.42.0"
"react":                   "^19.2.0"
"vite":                    "^7.x"       (via @lovable.dev/vite-tanstack-config)
```

HTTP: `fetch` bawaan Web Standard (aman di Workers). Tidak pakai axios.
Storage: bucket Supabase `generated-posters` (private, RLS per user id). Saat ini hasil disimpan sebagai data URL, belum di-upload ke storage.
DB tabel utama: `projects`, `ai_providers`, `ai_provider_audit_log`, `brand_kits`, `user_roles`.

---

## 10. Deployment Environment

- **Lokal dev**: `bun dev` → `http://localhost:8080`.
- **Prod**: **Lovable Cloud** → publish ke **Cloudflare Workers** (nitro cloudflare preset). Preview URL: `https://id-preview--5cb95bef-…lovable.app`.
- **Env di deploy**: Worker Secrets dikelola via dashboard Lovable — `CUSTOM_AI_API_KEY`, `LOVABLE_API_KEY`, `GEMINI_API_KEY` sudah SET. `.env` tidak di-deploy sebagai secret runtime.
- **Konektivitas keluar**: Worker bisa HTTPS fetch keluar; sudah tervalidasi ke `ai.gateway.lovable.dev` dan `ai.yogathedev.com`.

---

## 11. CORS & Server/Client

- Panggilan ke `ai.yogathedev.com` dilakukan dari **backend** (server route TanStack) — bukan dari browser. ✅
  - `CUSTOM_AI_API_KEY` tidak pernah muncul di bundle client.
  - Tidak ada risiko CORS antara browser ↔ YG.
- Endpoint internal `/api/generate-image-stream` same-origin dengan frontend → tidak butuh header CORS khusus.
- Bila nanti dipanggil lintas origin (mobile / domain lain), tambahkan handler `OPTIONS` + `Access-Control-Allow-*`.

---

## Questions for AI Assistant

1. Endpoint `POST https://ai.yogathedev.com/v1/images/generations` dengan `Accept: text/event-stream` — apakah **wajib** SSE, atau server juga menerima permintaan JSON biasa dan merespons JSON?
2. Format persis respons sukses untuk model `cx/gpt-5.5-image`: `data[0].b64_json`, `data[0].url`, atau format SSE khusus (`event: image.completed / data: {...}`)? Adakah contoh raw response yang bisa dijadikan acuan parser?
3. Bagaimana cara menangani respons SSE dari YG di Cloudflare Worker (streaming via `res.body.getReader()` + `eventsource-parser` server-side) sambil me-relay frame ke browser via SSE saya sendiri? Contoh minimal?
4. Error `400 No credentials for provider: openai` — apakah artinya akun YG saya belum di-attach kredensial upstream (BYOK OpenAI)? Bagaimana memverifikasi via `/models` atau `/health` bahwa key saya sudah bisa akses `cx/gpt-5.5-image`?
5. Perlukah menambahkan `stream: true` di body agar YG memicu SSE, atau cukup dari header `Accept`?
6. Berapa timeout upstream YG untuk model image? Perlu pasang `AbortController` dengan timeout berapa detik di worker saya?
7. Cara paling ringkas mengubah `/api/generate-image-stream` supaya stabil: terima `{ prompt }` → kembalikan `{ imageUrl }` (data URL atau signed URL Supabase Storage), tanpa restruktur TanStack Start — bagaimana rekomendasinya?
8. Untuk penyimpanan hasil: `b64_json` langsung ke kolom `projects.image_url` (data URL) vs upload ke bucket Supabase `generated-posters` lalu simpan signed URL — mana lebih tepat untuk skala production? Trade-off?

---

## Rekomendasi Singkat (menunggu approval, belum dieksekusi)

1. Tambah `Accept: text/event-stream` + SSE parser server-side untuk request ke YG di `generate-image-stream.ts` (~line 211). Fallback tetap: bila `Content-Type` respons `application/json`, parse seperti sekarang.
2. Bungkus fetch YG dengan `AbortController` timeout 60 dtk agar worker tidak menggantung.
3. Log raw response body YG (dipotong 500 chars) ke `attempts[]` saat parsing gagal — supaya `event: error` membawa penyebab nyata.
4. Verifikasi kredensial upstream YG via `GET /v1/models` (cache 5 menit) sebelum coba generate.
5. Upload ke Supabase Storage (bucket `generated-posters`) alih-alih menyimpan data URL besar ke DB.
6. Rate-limit per user (mis. 20 generate/hari) — lihat `genimage.md` §7.

Semua rekomendasi hanya mengubah `src/routes/api/generate-image-stream.ts` dan sedikit `src/lib/streamImage.ts`. Tidak butuh perubahan arsitektur.
