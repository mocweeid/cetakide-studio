# Multi-API Key + Auto-Fallback

Sistem akan menyimpan **banyak API key** (bisa banyak akun OpenAI, atau campur OpenAI + Lovable AI + provider lain). Saat user klik *Cetak Ide*, sistem coba key **prioritas #1** dulu — kalau gagal karena **saldo habis (402)** atau **rate-limit (429)**, otomatis pindah ke key #2, #3, dst. sampai berhasil atau semua habis.

## Bagian A — Perubahan Dashboard (yang Anda pakai)

Di menu **Integrations** yang sudah ada:

1. **Kolom baru "Prioritas"** — angka 1, 2, 3, ... (drag & drop untuk mengurutkan). Key dengan angka lebih kecil dicoba lebih dulu.
2. **Bisa aktifkan banyak key sekaligus** — bukan cuma satu (`is_active` sekarang exclusive; jadi non-exclusive).
3. **Kolom "Status Terakhir"** — badge otomatis: `✅ Sehat`, `⚠️ Rate-limit`, `❌ Saldo habis`, `🔒 Invalid`. Diupdate setiap kali key dipakai.
4. **Kolom "Sisa quota"** (opsional, kalau provider menyediakan) — cek saldo OpenAI otomatis 1x per jam.
5. **Tombol "Test Sekarang"** per baris — kirim 1 request test kecil untuk verifikasi key masih hidup.
6. **Panel ringkasan di atas** — "3 dari 5 key aktif, total request hari ini: 128, failover: 4x".

## Bagian B — Perubahan di balik layar (developer)

1. **Skema DB** (`ai_providers`): tambah kolom `priority INT`, `last_status TEXT`, `last_used_at TIMESTAMPTZ`, `failure_count INT`, `disabled_until TIMESTAMPTZ`. Hapus batasan "hanya satu aktif".
2. **Server route** `src/routes/api/generate-image.ts`:
   - Ambil semua key aktif user, urutkan `priority ASC`, skip yang `disabled_until > now()`.
   - Loop: coba key #1 → kalau `402/429/401`, catat `last_status`, set `disabled_until = now() + 10 menit` (untuk 429) atau permanent-disable (untuk 402/401), lanjut key berikutnya.
   - Kalau berhasil, update `last_status='ok'`, `last_used_at=now()`, reset `failure_count`.
   - Kalau semua habis: return error jelas ke UI ("Semua API key habis/limit — top up atau tambah key baru").
3. **Cron/manual "reset harian"** — key yang di-disable karena 402 di-recheck tiap 24 jam (siapa tahu user sudah top up di sisi OpenAI).

## Bagian C — Alur user (contoh)

```
User klik Cetak Ide (butuh 5 gambar)
   │
   ▼
Key #1 (OpenAI akun A) → generate 3 gambar OK
   → gambar ke-4: response 402 (saldo habis)
   → sistem tandai key #1 = ❌, lanjut ke #2
Key #2 (OpenAI akun B) → generate gambar ke-4 & ke-5 OK
   │
   ▼
Selesai. User dapat 5 gambar. Di riwayat tercatat:
   - 3 gambar via key A
   - 2 gambar via key B
   - 1 failover event (saldo A habis, auto-pindah ke B)
```

User **tidak perlu tahu** proses ini — buat mereka mulus.

## Estimasi & catatan

- **1 migration DB** (tambah 5 kolom + index prioritas).
- **1 server route baru** untuk generate + failover.
- **Refactor** `integrations.tsx` untuk kolom prioritas, badge status, tombol test.
- **Refactor** `workspace.tsx` `handleGenerate` untuk memanggil server route baru (bukan mock stock image).
- **Tidak menghapus** yang sudah ada — key lama tetap jalan, cuma dapat kolom baru default (`priority=999`, `last_status=null`).

## Yang perlu Anda konfirmasi sebelum saya build

1. **Scope generate:** ganti mock `handleGenerate` di Workspace jadi panggil OpenAI/Lovable AI beneran sekalian? Atau failover-nya dulu saja (masih mock) dan panggilan API menyusul di iterasi berikut?
2. **Reset otomatis key yang habis saldo:** re-check tiap 24 jam OK, atau Anda mau manual saja (klik tombol "Aktifkan lagi" di dashboard)?
3. **Batas key per user:** ada batas (mis. maks 10 key/user)? Atau tanpa batas?

Jawab 3 poin di atas, saya langsung eksekusi.