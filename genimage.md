# Setup API & AI Image Generation — Cetak Ide

Dokumen ini menjelaskan **cara setup API key**, **cara kerja pipeline image generation**, dan **cara testing** end-to-end sampai poster keluar di layar user.

## 1. Ringkasan Arsitektur

```
User klik "Generate"  ─▶  POST /api/generate-image-stream
                              │
                              ├─ 1. Coba Cloudflare Workers AI (FLUX.1-schnell)  ← GRATIS 10.000/hari
                              │      butuh: CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN
                              │
                              └─ 2. Fallback: Lovable AI Gateway (gpt-image-1-mini)
                                     butuh: LOVABLE_API_KEY (auto disediakan Lovable)

Response: SSE stream (partial_image → completed) → di-render progresif ke <img>.
```

File terkait:
- `src/routes/api/generate-image-stream.ts` — endpoint SSE image generation
- `src/lib/enhancePrompt.functions.ts` — server function optimasi prompt
- `src/routes/_authenticated/workspace.tsx` — UI consumer

## 2. Daftar API Key

| Nama Env | Wajib? | Sumber | Fungsi |
|---|---|---|---|
| `LOVABLE_API_KEY` | ✅ Wajib | Otomatis dari Lovable Cloud | Fallback image gen + optimasi prompt |
| `CLOUDFLARE_ACCOUNT_ID` | Opsional (recommended) | dash.cloudflare.com → Workers & Pages | Free tier image gen |
| `CLOUDFLARE_API_TOKEN` | Opsional (recommended) | Cloudflare → My Profile → API Tokens | Auth Cloudflare |
| `GROQ_API_KEY` | Opsional | console.groq.com | Optimasi prompt super cepat |

> Kalau `CLOUDFLARE_*` tidak diset, sistem otomatis pakai Lovable Gateway (berbayar per credit, tapi selalu ready).

## 3. Setup Cloudflare Workers AI (Gratis)

### 3.1 Ambil Account ID
1. Login ke https://dash.cloudflare.com
2. Sidebar kiri → **Workers & Pages**
3. Panel kanan → kotak **Account ID** → klik **Copy**
4. Simpan sebagai `CLOUDFLARE_ACCOUNT_ID`

### 3.2 Buat API Token
1. Klik foto profil kanan atas → **My Profile**
2. Tab **API Tokens** → **Create Token**
3. Pilih template **"Workers AI"** (atau Custom → Permission: `Account → Workers AI → Read`)
4. **Continue → Create Token → Copy**
5. Simpan sebagai `CLOUDFLARE_API_TOKEN`

### 3.3 Pasang di Hosting
- **GitHub Actions:** repo → Settings → Secrets and variables → Actions → New secret
- **Lovable Cloud:** pakai tool `add_secret` atau dashboard project → Settings → Secrets
- **Docker/VPS:** tambahkan ke `.env`:

```bash
CLOUDFLARE_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLOUDFLARE_API_TOKEN=yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
```

### 3.4 Verifikasi kuota
- Free tier: **10.000 request/hari** untuk `@cf/black-forest-labs/flux-1-schnell`
- Cek dashboard → Workers & Pages → AI → Usage

## 4. Setup Lovable AI Gateway (Fallback)

`LOVABLE_API_KEY` **sudah otomatis** disediakan Lovable Cloud — tidak perlu setup manual. Kalau hilang, jalankan tool `ai_gateway--create` untuk regenerate.

- Endpoint: `https://ai.gateway.lovable.dev/v1/images/generations`
- Model default: `openai/gpt-image-1-mini` (cepat & hemat)

## 5. Setup Groq (Opsional — Optimasi Prompt)

1. Buka https://console.groq.com → Sign up (gratis)
2. API Keys → **Create API Key** → copy
3. Simpan sebagai `GROQ_API_KEY`
4. Model default: `llama-3.3-70b-versatile` (super cepat, gratis)

Kalau tidak diset, `enhancePromptServer` fallback ke Lovable AI Gateway.

## 6. Testing End-to-End

### 6.1 Test Cloudflare API terpisah
```bash
curl -X POST \
  "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/black-forest-labs/flux-1-schnell" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"a modern coffee shop poster, professional photo"}' \
  --output /tmp/test.png

file /tmp/test.png   # harus keluar: PNG image data
```
Jika JSON error muncul → cek Account ID / permission token.

### 6.2 Test Lovable Gateway
```bash
curl -X POST https://ai.gateway.lovable.dev/v1/images/generations \
  -H "Authorization: Bearer $LOVABLE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"openai/gpt-image-1-mini","prompt":"minimalist logo","stream":false}'
```
Harus balik JSON dengan `data[0].b64_json`.

### 6.3 Test endpoint aplikasi
Setelah dev server jalan (`bun dev` di port 8080):
```bash
curl -N -X POST http://localhost:8080/api/generate-image-stream \
  -H "Content-Type: application/json" \
  -d '{"prompt":"modern minimalist coffee shop poster"}'
```
Output SSE:
```
event: image_generation.partial_image
data: {"type":"image_generation.partial_image","b64_json":"iVBORw0..."}

event: image_generation.completed
data: {"type":"image_generation.completed","b64_json":"iVBORw0..."}
```

### 6.4 Test dari UI
1. Login (`/auth`)
2. Buka `/workspace`
3. Pilih platform (misal "Instagram Feed")
4. Isi kolom "Ide Desain Kreatif" — contoh: *"Poster promo kopi susu gula aren 25rb"*
5. Pilih preset theme (opsional)
6. Klik **Generate**

**Expected:**
- Spinner muncul
- Poster keluar bertahap (blur → tajam) dalam 3-8 detik
- Muncul di grid "Hasil"

### 6.5 Cek log kalau gagal
- **Dashboard Lovable:** Backend → Logs → filter `generate-image-stream`
- **Dev terminal:** perhatikan output `bun dev`

| Error | Penyebab | Solusi |
|---|---|---|
| `401 Unauthorized` (CF) | Token salah/expired | Regenerate, cek permission Workers AI |
| `429 Too Many Requests` | Kuota Cloudflare habis | Tunggu reset 00:00 UTC / fallback Lovable |
| `402 Payment Required` | Credit Lovable habis | Top-up di workspace billing |
| `content_policy_violation` | Prompt mengandung IP/tokoh | Ganti kata (mis. "superhero merah-emas" bukan "Iron Man") |
| SSE stream kosong | Proxy / CDN buffering | Pastikan header `Cache-Control: no-cache` |
| `stream ended without completed` | Upstream putus | Retry; kalau berulang cek log Cloudflare |

## 7. Rate Limit Production

Tambahkan di `src/routes/api/generate-image-stream.ts` sebelum panggil provider:
```ts
const { count } = await supabase.from('generations')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId)
  .gte('created_at', new Date(Date.now() - 24*3600e3).toISOString());
if (count && count >= 20) return new Response('Daily limit reached', { status: 429 });
```

## 8. Monitoring Biaya

- **Cloudflare:** dash → Workers & Pages → AI → Analytics (gratis sampai 10rb/hari)
- **Lovable AI:** tool `credits--get_usage_breakdown` atau workspace billing
- **Groq:** console.groq.com → Usage (30 req/menit free)

## 9. Checklist Production

- [ ] `LOVABLE_API_KEY` tersedia (otomatis)
- [ ] `CLOUDFLARE_ACCOUNT_ID` & `CLOUDFLARE_API_TOKEN` diset
- [ ] Test 6.1 – 6.4 semua ✅
- [ ] Rate limit terpasang (poin 7)
- [ ] Monitoring aktif (poin 8)
- [ ] Error UX: pesan jelas kalau gagal, bukan spinner selamanya
