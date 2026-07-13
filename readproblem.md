# Laporan Generate Gambar Workspace — Diagnosis & Verifikasi

Tanggal update: 13 Juli 2026 (revisi)

## Ringkasan status

- Generate gambar sekarang **bisa jalan end-to-end** lewat Lovable AI Gateway
  (`openai/gpt-image-1-mini`). Sudah diuji langsung ke endpoint dan mengembalikan
  file PNG ~1.6 MB (b64_json valid, status 200).
- Provider `CUSTOM_AI_API_KEY` (endpoint 9Router/`ai.yogathedev.com`) **belum
  bisa dipakai untuk gambar** — endpoint membalas `400 No credentials for
  provider: openai` untuk semua model image (`openai/dall-e-3`,
  `openai/gpt-image-1`, `openai/dall-e-2`). Artinya key ada, tapi akun 9Router
  belum punya kredensial upstream OpenAI. Untuk sementara provider ini
  di-*fast-fail* di kode dan Gateway dijadikan urutan pertama.

## Perubahan yang sudah diterapkan

File: `src/routes/api/generate-image-stream.ts`

1. **Urutan provider dibalik**: Lovable AI Gateway dicoba **paling pertama**
   (paling stabil, tidak butuh setup user).
2. Custom provider dipindah ke posisi kedua & di-*fast-fail* (1 request saja).
3. Default `CUSTOM_AI_MODEL` diganti dari `vani` (tidak valid — bukan model
   image di 9Router) ke `openai/dall-e-3` (bentuk model yang benar).
4. Fallback berikutnya: OpenAI key user (dari `ai_providers`) → env
   `OPENAI_API_KEY` → Cloudflare Workers AI.
5. Semua kegagalan tetap dikumpulkan di array `attempts` dan dikirim ke
   client sebagai detail error di debug panel.

## Bukti verifikasi (dijalankan dari sandbox)

### 1. Cek Lovable Gateway (WORKING)

```
curl -X POST https://ai.gateway.lovable.dev/v1/images/generations \
  -H "Authorization: Bearer $LOVABLE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"openai/gpt-image-1-mini","prompt":"red apple on white background","quality":"low","size":"1024x1024"}'
```

Hasil: `HTTP 200`, response 1.641.106 byte, `data[0].b64_json` berisi PNG valid.

### 2. Cek Custom provider `vani` (FAIL — bukan model image)

```
curl -X POST https://ai.yogathedev.com/v1/images/generations \
  -H "Authorization: Bearer $CUSTOM_AI_API_KEY" \
  -d '{"model":"vani","prompt":"red apple","size":"1024x1024"}'
```

Hasil: `HTTP 400 {"error":{"message":"No credentials for provider: openai"}}`

`GET /v1/models` di provider tersebut hanya mengembalikan model chat
(gpt-5.5, claude-opus-4.7, dll) — tidak ada model image. `openapi.json`
mendokumentasikan `POST /images/generations` dengan contoh
`model: "openai/dall-e-3"`, tetapi upstream OpenAI belum dikonfigurasi di
akun 9Router → 400.

### 3. Cek dari Workspace (langkah manual user)

1. Login ke Workspace.
2. Isi minimal: **Nama Brand**, **Kategori Produk**, dan **Deskripsi Singkat**.
3. Pilih **Preset Theme** (mis. Brutalism) — mockup realtime akan menampilkan
   contoh nyata poster preset tersebut.
4. Tekan **Cetak Ide**.
5. Buka panel **Debug** di header Workspace. Log yang benar (path bahagia):
   - `job_id` tercetak
   - Event `image_generation.completed`
   - `provider: "Gateway openai/gpt-image-1-mini"`
6. Buka menu **Project** — row baru harus muncul dengan
   `status = sukses`, `provider = Gateway openai/gpt-image-1-mini`,
   dan preview gambar.

### 4. Cek log & database (langkah verifikasi teknis)

- Table `projects`: harus ada row baru per klik generate. Kalau kosong,
  masalah ada di frontend (auth / validasi) sebelum request keluar.
- Table `ai_providers`: opsional, hanya perlu ada row `openai` aktif kalau
  ingin fallback pakai key OpenAI user.
- Log endpoint `/api/generate-image-stream`: cari `[generate-image-stream]`.
  Kalau tidak ada log dalam beberapa menit setelah user klik generate,
  request tidak sampai — cek session token di header `Authorization`.

## Kesimpulan

- **Path produksi**: pakai Lovable AI Gateway sebagai default.
  `LOVABLE_API_KEY` sudah tersedia sebagai runtime secret dan sudah teruji.
- Custom provider hanya akan mulai berguna kalau akun 9Router-nya
  ditambahkan kredensial upstream OpenAI. Sementara itu, dia akan gagal
  dengan cepat lalu Gateway tetap menyelamatkan generate.
- Fallback OpenAI native tetap ada bila user menambahkan key mereka
  sendiri di halaman **Admin AI Keys**.

## Checklist siap production

- [x] Endpoint image generation membalas gambar valid dari Gateway (bukti #1).
- [x] Kode mem-prioritaskan provider yang teruji lebih dulu.
- [x] Kegagalan provider tidak menghentikan pipeline — jatuh ke fallback berikut.
- [x] Preset Theme punya contoh nyata per gaya (Brutalism/Kuliner,
      Glassmorphism/Interior, Neumorphism/Beauty, Minimalism/Fashion,
      Default/Tech) dan tampil di mockup realtime.
- [ ] Satu generate end-to-end dari Workspace user tercatat di tabel
      `projects` (butuh user login & klik generate — belum bisa saya
      lakukan otomatis).
- [ ] Audit saldo: pastikan saldo user tidak terpotong jika semua provider
      gagal.
- [ ] Tambah row provider `openai` aktif di Admin AI Keys jika ingin
      fallback OpenAI langsung dari user.