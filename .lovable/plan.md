## Workspace Canggih — Rencana 4 Fase

Semua fitur yang dipilih diimplementasikan bertahap. Tiap fase berdiri sendiri
(bisa dipakai walau fase berikutnya belum jalan) supaya bisa ditest & di-iterate.

---

### FASE 1 — Streaming Preview + Prompt Enhancer (fondasi AI)

**Yang berubah untuk user**
- Klik *Cetak Ide Sekarang* → gambar muncul **blur → semakin tajam** secara
  progresif (tidak perlu tunggu final).
- Muncul tombol ✨ **Sempurnakan Prompt** di kolom prompt: AI (GPT-4o-mini via
  Lovable Gateway) menulis ulang prompt jadi lebih detail sinematik, user bisa
  terima / tolak sebelum generate.

**Detail teknis**
- Server route baru `src/routes/api/generate-image-stream.ts` — memakai
  `openai/gpt-image-2` dengan `stream:true` + `partial_images:2`, mengalirkan
  SSE apa adanya. Fallback ke user OpenAI key bila terpasang.
- Client parser `src/lib/streamImage.ts` pakai `eventsource-parser` +
  `flushSync` → update tiap frame partial ke slot variant.
- `generateImageServer` lama tetap dipertahankan untuk mode tanpa streaming
  (misal batch background).
- Server fn baru `enhancePromptServer` — panggil `google/gemini-3-flash-preview`
  (murah & cepat) untuk expand prompt jadi ~2-3 kalimat detail.

---

### FASE 2 — Auto-brand & Multi-rasio 1-klik

**Yang berubah untuk user**
- Toggle **"Semua Rasio Platform"** — 1 klik generate paralel di semua rasio
  platform terpilih (mis. Instagram → 1:1, 4:5, 9:16 sekaligus).
- Panel **Brand Kit** di sidebar workspace: warna primer, warna aksen, logo
  URL, font display. Toggle **"Terapkan Brand Kit otomatis"** menyisipkan
  instruksi warna + logo ke prompt akhir.
- Brand Kit disimpan di tabel baru `brand_kits` per-user.

**Detail teknis**
- Migrasi: tabel `brand_kits` (id, user_id, name, primary_color, accent_color,
  logo_url, display_font, body_font, is_default) + RLS + GRANT.
- `handleGenerate` loops per rasio yang dipilih; setiap slot di grid diberi
  label rasio.
- Prompt komposer: kalau brand kit aktif, append
  `"Use brand colors #XXXX and #YYYY; leave 15% clear space for logo overlay in top-left"`.

---

### FASE 3 — Editor Kanvas Ala Canva Mini

**Yang berubah untuk user**
- Setelah gambar sukses, klik **Edit** → editor overlay:
  - Multi-layer: teks, logo, shape, gambar
  - Font kustom (dari brand kit)
  - Snap & align guides
  - Background remover 1-klik (via `openai/gpt-image-2` edit dengan mask)
  - Undo/redo
  - Export PNG / JPG / WebP

**Detail teknis**
- Library: `fabric.js` (v6, canvas engine matang, MIT-licensed, ada Worker
  build).
- Route baru `_authenticated.editor.$projectId.tsx` — layout full-screen.
- Persist layer state ke `projects.layers` (kolom JSONB baru).
- Background remover: server fn `removeBackground` → edit image endpoint.

---

### FASE 4 — Version History + Share Link

**Yang berubah untuk user**
- Tiap edit disimpan sebagai **revisi** — timeline di panel kanan editor,
  klik untuk rollback.
- Tombol **Bagikan** → link read-only `/share/:token` (tanpa login),
  klien bisa lihat + download tapi tidak edit.

**Detail teknis**
- Migrasi:
  - `project_revisions` (id, project_id, layers JSONB, image_url, note,
    created_at, created_by)
  - `project_shares` (id, project_id, token UUID, expires_at, allow_download,
    view_count)
- Route publik `src/routes/share.$token.tsx` — SSR, tanpa auth gate.
- Editor auto-snapshot ke `project_revisions` tiap 30 detik atau saat save.

---

### Urutan Eksekusi

Mulai dari **Fase 1** sekarang (paling langsung terasa & tidak butuh migrasi
DB). Setelah dites, lanjut ke Fase 2, dst.

**Konfirmasi**: mau saya mulai Fase 1 sekarang?