# Planner Menu Dashboard Cetak Ide

Daftar seluruh menu sidebar dan status implementasi. Prioritas: **Main & AI Tools** + **Finance** (paling sering dipakai user).

Legenda: ✅ fungsional · 🟡 UI ada, logic tipis / belum full backend · ⚪ stub / coming soon

## 1. Main & AI Tools
| Menu | Route | Status | Catatan |
|---|---|---|---|
| Dashboard | `/dashboard` | ✅ | Statistik personal + developer overview |
| Workspace | `/workspace` | ✅ | Generator + streaming + brand kit + logo + draft simpan/muat |
| Project | `/project` | 🟡 | List project user; filter & pagination masih dasar |
| Auto Uploader | `/auto-uploader` | 🟡 | UI scheduler ada, perlu integrasi API sosmed |
| Analitik Hub | `/analytics` | ⚪ | Perlu chart + query metrik project |
| AI Playground | `/playground` | ⚪ | Ruang eksperimen prompt |
| Kalender Konten | `/scheduler` | ⚪ | Kalender bulanan + drag jadwal |
| Generate Massal | `/bulk-generator` | ⚪ | Upload CSV → antrian batch |
| AI Editor Studio | `/editor-studio` | ⚪ | Crop / retouch pasca-generate |
| AI Inpainting | `/inpainting` | ⚪ | Mask + regenerate area gambar |

## 2. Brand & Assets
| Menu | Route | Status | Catatan |
|---|---|---|---|
| Brand Kit | `/brand-kits` | ⚪ | Simpan logo, warna, font per brand |
| Galeri Aset | `/assets` | ⚪ | Semua hasil generate user |
| Koleksi Template | `/templates` | ⚪ | Template siap edit |
| Preset Theme | `/preset-theme` | ⚪ | Preset warna & style |
| Font Manager | `/fonts` | ⚪ | Pilih & upload font |
| Stock Library | `/stock-library` | ⚪ | Bank gambar bebas royalti |

## 3. Marketing & Growth
| Menu | Route | Status | Catatan |
|---|---|---|---|
| Kolaborasi Tim | `/team` | ⚪ | Invite anggota + role |
| Program Afiliasi | `/affiliate` | ⚪ | Referral link + komisi |
| Ulasan & Feedback | `/reviews` | ⚪ | Kumpulkan review user |
| SEO Optimizer | `/seo-optimizer` | ⚪ | Saran meta & keyword |
| Persona Pembeli | `/personas` | ⚪ | Simpan target audience |
| Akun Sosial Media | `/social-accounts` | ⚪ | Connect IG, FB, YT, TikTok |
| Visual Style Tuner | `/style-tuner` | ⚪ | Slider gaya visual |
| A/B Testing | `/ab-testing` | ⚪ | Bandingkan performa varian |

## 4. Finance & Security
| Menu | Route | Status | Catatan |
|---|---|---|---|
| Top Up Saldo | `/top-up` | ✅ | Preset nominal + custom + history |
| Riwayat Tagihan | `/billing` | ⚪ | Invoice & subscription |
| Saluran Notifikasi | `/notifications` | ⚪ | Preferensi email / WA / push |
| Log Keamanan | `/security-logs` | ⚪ | Login history & device |

## 5. Support & Config
| Menu | Route | Status | Catatan |
|---|---|---|---|
| Manajemen Referensi | `/references` | ✅ | Katalog tema visual |
| Integrasi API | `/integrations` | ✅ | Kelola API AI provider |
| API Doc | `/api-doc` | ✅ | Dokumentasi REST |
| Pusat Bantuan | `/support` | ⚪ | FAQ + form kontak |
| API Keys Manager | `/api-keys` | ⚪ | Key user untuk external call |
| Webhook API | `/webhooks` | ⚪ | Endpoint callback event |
| Batas Penggunaan | `/usage-limits` | ⚪ | Kuota harian / bulanan |

## 6. Developer Control (khusus role developer)
| Menu | Route | Status | Catatan |
|---|---|---|---|
| Admin AI Keys | `/admin-ai-keys` | ✅ | Kelola API key AI provider (developer only, RLS) |
| Manajemen User | `/manage-users` | ⚪ | List semua user + edit role/saldo |
| Kesehatan Server | `/system-logs` | ⚪ | Uptime, error rate |
| Admin DB Shell | `/db-shell` | ⚪ | Query builder read-only |
| Payment Gateways | `/payment-gateways` | ⚪ | Konfigurasi Midtrans/Stripe |
| Swagger API Shell | `/developer-playground` | ⚪ | Live API tester |

## 7. Account
| Menu | Route | Status | Catatan |
|---|---|---|---|
| Landing Page | `/` | ✅ | Halaman marketing publik |
| Settings | `/settings` | ✅ | Profil, avatar, ganti bahasa |

## Checklist Menuju Production

**Wajib sebelum go-live** (blocker):
1. **Manajemen User (developer)** — adjust role & saldo via UI, wajib untuk operasional.
2. **Payment Gateway** — Midtrans/Stripe live, webhook verifikasi signature, tabel `transactions` update otomatis (bukan manual admin).
3. **Billing / Riwayat Tagihan** — user harus bisa lihat & download invoice untuk kebutuhan pajak.
4. **Batas Penggunaan (Usage Limits)** — rate limit per user (RPC + tabel counter) supaya tidak dijebol.
5. **Log Keamanan** — audit login, IP, device. Wajib untuk data pengguna Indonesia (UU PDP).
6. **Legal Pages** — Terms of Service, Privacy Policy, Kebijakan Refund. Landing perlu link ke sini.
7. **Email transaksional** — verifikasi email, reset password, invoice, notifikasi generate selesai (SendGrid/Resend).
8. **Backup DB otomatis** — pastikan snapshot harian aktif di Lovable Cloud.
9. **Monitoring & alerting** — Sentry (frontend + server function), uptime monitor.
10. **Security review** — jalankan security scanner, verifikasi RLS semua tabel, rate-limit auth endpoint.

**Sangat direkomendasi** (post-launch minggu 1-2):
- Project page: filter, hapus, duplikasi, pagination beneran
- Auto Uploader: OAuth IG & FB (Meta Graph API)
- Kolaborasi Tim + role invite
- Analytics Hub: pakai data `projects` + `transactions`
- SEO landing page (title/meta/OG image sudah, tambah blog)

**Bisa ditunda** (roadmap 1-3 bulan):
- AI Editor Studio, Inpainting, Bulk Generator, A/B Testing
- Program Afiliasi, Persona, Style Tuner
- Stock Library, Font Manager upload custom
- Developer Playground, DB Shell

**Catatan realistis:** menu ⚪ tersisa ±20 halaman. Menandai semua ✅ tanpa implementasi = misleading. Fokus 10 blocker di atas dulu; menu lain bisa ditambahkan bertahap setelah user real masuk dan menentukan prioritas nyata.