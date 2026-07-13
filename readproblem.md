# Laporan Masalah Generate Gambar Workspace

Tanggal cek: 13 Juli 2026

## Ringkasan

Generate gambar di Workspace belum bisa dipastikan berjalan karena dari hasil pengecekan saat ini **tidak ada request generate terbaru yang masuk ke endpoint gambar**, dan tabel riwayat `projects` masih kosong. Artinya proses kemungkinan besar berhenti **sebelum job generate tersimpan** atau tombol generate belum mengirim request sampai ke backend.

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
   - Ini membuktikan service custom aktif dan memang wajib menerima API key, tetapi valid/tidaknya key yang tersimpan belum bisa dibuktikan karena belum ada request generate yang tercatat masuk dari Workspace.

6. **Status backend**
   - Backend sempat dalam kondisi masih menyiapkan perubahan, lalu kembali normal.
   - Saat dicek ulang, backend sudah merespons normal dan tabel `projects` serta fungsi saldo tersedia.

## Kesimpulan sementara

Penyebab paling kuat saat ini:

1. **Generate belum benar-benar mencapai endpoint `/api/generate-image-stream`.**
   - Indikator: tidak ada log endpoint, tidak ada request gateway, dan `projects` masih kosong.

2. **Fallback OpenAI belum siap dari konfigurasi aplikasi.**
   - Indikator: tidak ada `OPENAI_API_KEY` runtime secret dan tidak ada provider `openai` di `ai_providers`.

3. **Custom provider sudah dikonfigurasi lewat `CUSTOM_AI_API_KEY`, tetapi belum ada bukti request sukses/gagal dari Workspace.**
   - Jadi masalahnya belum bisa dipastikan pada key custom, karena request generate belum terlihat sampai ke backend.

## Dampak ke user

- User melihat status “belum berhasil”, tetapi detail penyebab belum muncul dari provider karena request generate tidak tercatat masuk ke endpoint gambar.
- Riwayat project tidak muncul karena job belum sempat tersimpan ke tabel `projects`.

## Tindakan yang disarankan sebelum production

1. **Pastikan user sedang login saat generate.**
   - Jika session auth kosong, `streamImage` akan berhenti dengan pesan `Belum sign in.` sebelum endpoint dipanggil.

2. **Tambahkan OpenAI provider aktif di Admin AI Keys jika ingin fallback OpenAI berjalan.**
   - Provider: `openai`
   - Model awal aman: `gpt-image-1` atau `dall-e-3`
   - Status: aktif

3. **Jalankan satu generate dari Workspace setelah backend normal.**
   - Setelah tombol ditekan, harus muncul minimal 1 row baru di `projects` dengan `job_id`, `prompt`, `aspect_ratio`, dan `status`.

4. **Jika `projects` tetap kosong, fokus debug di frontend Workspace sebelum pemanggilan endpoint.**
   - Area yang perlu dicek: session login, validasi prompt, pemotongan saldo, dan insert awal ke `projects`.

5. **Jika `projects` terisi tetapi status gagal, fokus debug di endpoint `/api/generate-image-stream`.**
   - Detail error provider akan muncul di `error_message` dan debug panel.

## Catatan production

Sebelum aplikasi diproduction-kan, minimal perlu dipastikan:

- Satu generate gambar berhasil end-to-end dari Workspace.
- Riwayat generate tersimpan di `projects`.
- Fallback provider aktif dan teruji.
- Debug panel menampilkan error provider dengan jelas.
- Saldo user tidak terpotong jika generate gagal sebelum request image benar-benar dikirim.