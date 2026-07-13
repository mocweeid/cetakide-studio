# Laporan Masalah Generate Gambar Workspace

Tanggal cek: 13 Juli 2026

## Ringkasan

Generate gambar di Workspace belum berhasil karena ada **mismatch konfigurasi model custom provider** dan belum ada bukti request generate terbaru yang masuk dari Workspace. Provider custom yang dipakai (`ai.yogathedev.com`) mengikuti dokumentasi YG3/Vani untuk image generation, sedangkan kode sebelumnya masih mengirim default model `gpt-image-1`.

## Bukti yang ditemukan

1. **Secret runtime yang tersedia**
   - `CUSTOM_AI_API_KEY` tersedia.
   - `GEMINI_API_KEY` tersedia.
   - `LOVABLE_API_KEY` tersedia.
   - `OPENAI_API_KEY` tidak tersedia sebagai runtime secret.

2. **Data provider AI di dashboard aplikasi**
   - Tabel `ai_providers` hanya berisi provider `gemini` dengan model `gemini-2.0-flash`.
   - Belum ada provider `openai` aktif yang tersimpan di tabel tersebut.
   - Dampaknya: fallback OpenAI dari database tidak akan jalan karena key OpenAI belum ditemukan oleh backend.

3. **Riwayat project/generate**
   - Tabel `projects` ada, tetapi jumlah data saat dicek: `0`.
   - Karena kode Workspace menyimpan row `projects` sebelum memanggil image API, kondisi ini berarti proses generate belum sampai tahap pencatatan job.

4. **Log backend**
   - Tidak ada log terbaru untuk `/api/generate-image-stream` dalam 1 jam terakhir.
   - Tidak ada log error custom provider/gateway dalam 1 jam terakhir.
   - Tidak ada request Lovable AI Gateway untuk image generation dalam 24 jam terakhir.

5. **Endpoint custom provider**
   - Endpoint `https://ai.yogathedev.com/v1/images/generations` bisa dijangkau.
   - Tanpa API key, endpoint membalas `401` dengan pesan `API key required`.
   - Dokumentasi provider YG3 menyebut image generation memakai model `vani` pada endpoint `/images/generations` dengan payload `model`, `prompt`, `size`, dan `response_format: "b64_json"`.
   - Kode sebelumnya default ke `CUSTOM_AI_MODEL ?? "gpt-image-1"`, sehingga jika `CUSTOM_AI_MODEL` tidak diset, provider menerima model yang tidak sesuai.

6. **Status backend**
   - Backend sempat dalam kondisi masih menyiapkan perubahan, lalu kembali normal.
   - Saat dicek ulang, backend sudah merespons normal dan tabel `projects` serta fungsi saldo tersedia.

## Kesimpulan sementara

Penyebab paling kuat saat ini:

1. **Default model custom provider salah.**
   - Sebelumnya: `gpt-image-1`.
   - Seharusnya untuk provider ini: `vani`.

2. **Format payload custom provider belum diprioritaskan sesuai dokumentasi Vani.**
   - Sebelumnya memakai variasi payload OpenAI image lebih dulu.
   - Sekarang diprioritaskan payload sederhana: `{ model: "vani", prompt, size, response_format: "b64_json" }`.

3. **Generate belum terlihat mencapai endpoint `/api/generate-image-stream` dari sesi user terakhir.**
   - Indikator: tidak ada log endpoint, tidak ada request gateway, dan `projects` masih kosong.

4. **Fallback OpenAI belum siap dari konfigurasi aplikasi.**
   - Indikator: tidak ada `OPENAI_API_KEY` runtime secret dan tidak ada provider `openai` di `ai_providers`.

5. **Custom provider sudah dikonfigurasi lewat `CUSTOM_AI_API_KEY`, tetapi valid/tidaknya key belum bisa dibuktikan dari logs.**
   - Jadi masalahnya belum bisa dipastikan pada key custom, karena request generate belum terlihat sampai ke backend.

## Perbaikan yang sudah diterapkan

File yang diperbaiki: `src/routes/api/generate-image-stream.ts`

- Default `CUSTOM_AI_MODEL` diganti dari `gpt-image-1` menjadi `vani`.
- Request body custom provider sekarang memprioritaskan format Vani:
  - `model: "vani"`
  - `prompt`
  - `size`
  - `response_format: "b64_json"`
- Fallback variasi payload OpenAI-compatible tetap dipertahankan setelah format Vani, agar provider custom yang kompatibel dengan OpenAI masih tetap bisa dicoba.

## Dampak ke user

- User melihat status “belum berhasil”, tetapi detail penyebab belum muncul dari provider karena request generate tidak tercatat masuk ke endpoint gambar.
- Riwayat project tidak muncul karena job belum sempat tersimpan ke tabel `projects`.

## Tindakan yang disarankan sebelum production

1. **Coba generate ulang dari Workspace setelah perbaikan ini.**
   - Jika berhasil, row baru akan muncul di `projects` dengan status `sukses` dan provider `Custom vani`.
   - Jika gagal, detail error provider harus masuk ke debug panel dan `projects.error_message`.

2. **Pastikan user sedang login saat generate.**
   - Jika session auth kosong, `streamImage` akan berhenti dengan pesan `Belum sign in.` sebelum endpoint dipanggil.

3. **Tambahkan OpenAI provider aktif di Admin AI Keys jika ingin fallback OpenAI berjalan.**
   - Provider: `openai`
   - Model awal aman: `gpt-image-1` atau `dall-e-3`
   - Status: aktif

4. **Jalankan satu generate dari Workspace setelah backend normal.**
   - Setelah tombol ditekan, harus muncul minimal 1 row baru di `projects` dengan `job_id`, `prompt`, `aspect_ratio`, dan `status`.

5. **Jika `projects` tetap kosong, fokus debug di frontend Workspace sebelum pemanggilan endpoint.**
   - Area yang perlu dicek: session login, validasi prompt, pemotongan saldo, dan insert awal ke `projects`.

6. **Jika `projects` terisi tetapi status gagal, fokus debug di endpoint `/api/generate-image-stream`.**
   - Detail error provider akan muncul di `error_message` dan debug panel.

## Catatan production

Sebelum aplikasi diproduction-kan, minimal perlu dipastikan:

- Satu generate gambar berhasil end-to-end dari Workspace.
- Riwayat generate tersimpan di `projects`.
- Fallback provider aktif dan teruji.
- Debug panel menampilkan error provider dengan jelas.
- Saldo user tidak terpotong jika generate gagal sebelum request image benar-benar dikirim.