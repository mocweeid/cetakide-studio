# Planner Menu Dashboard Cetak Ide

Daftar seluruh menu sidebar. Tandai status implementasi tiap halaman. Prioritaskan menu **MAIN & AI Tools** dan **Finance** karena paling sering digunakan.

Legenda status: ✅ selesai fungsional · 🟡 UI ada tapi belum terhubung Supabase / logic tipis · ⚪ masih stub / coming soon

## 1. Main & AI Tools
| Menu | Route | Status | Catatan |
|---|---|---|---|
| Dashboard | `/dashboard` | ✅ | Statistik personal + developer overview |
| Workspace | `/workspace` | 🟡 | Generator utama, perlu hook ke AI Gateway |
| Project | `/project` | 🟡 | List project user, perlu filter & pagination |
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

## Prioritas berikutnya
1. Selesaikan **Workspace** → hubungkan ke AI Gateway + potong saldo tiap generate.
2. **Project** → tampilkan grid hasil, filter by platform, hapus / duplikasi.
3. **Auto Uploader** → integrasi OAuth IG & FB via connector.
4. **Manajemen User** (developer) → adjust saldo & role via UI.
5. **Billing** → export invoice PDF dari tabel `transactions`.