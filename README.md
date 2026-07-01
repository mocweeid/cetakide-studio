# CetakIde — AI Visual Builder Instan

Platform SaaS untuk generate banner iklan, YouTube thumbnail, dan logo brand dalam 1 klik.

## Stack

- TanStack Start v1 (React 19 + file-based routing)
- Vite 7 + Tailwind CSS v4 (CSS-first, `@theme inline`, custom `@utility`)
- shadcn/ui + Radix + Lucide icons
- Embla Carousel
- Supabase (Auth, Postgres, RPC)
- Framer Motion (animations)

## Project Structure

```
cetakide-studio/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── site-header.tsx # Navigation header
│   │   ├── dashboard-sidebar.tsx
│   │   ├── carousels.tsx
│   │   └── floating-wa.tsx
│   ├── config/             # Configuration files
│   │   └── site-assets.ts  # Brand assets, mockup data, content
│   ├── hooks/              # Custom React hooks
│   ├── integrations/       # Third-party integrations
│   ├── lib/                # Utility functions
│   ├── routes/             # File-based routing
│   │   ├── index.tsx       # Landing page
│   │   ├── auth.tsx        # Authentication page
│   │   └── _authenticated/ # Protected routes
│   ├── router.tsx          # Router configuration
│   ├── routeTree.gen.ts    # Auto-generated route tree
│   ├── server.ts           # Server-side code
│   ├── start.ts            # Entry point
│   └── styles.css          # Global styles
├── public/                 # Static assets
├── supabase/               # Supabase configuration
├── .env                    # Environment variables
├── package.json            # Dependencies
└── supabase-setup.sql      # Database schema
```

## Setup

### 1. Environment (`.env`)

```env
VITE_SUPABASE_URL="https://<project-ref>.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<anon key>"
SUPABASE_URL="https://<project-ref>.supabase.co"
SUPABASE_PUBLISHABLE_KEY="<anon key>"
```

Di Lovable Cloud `.env` sudah otomatis terisi.

### 2. Skema Database

Buka SQL Editor Supabase → tempel isi **`supabase-setup.sql`** → Run.

Script membuat:

- Enum `app_role` + tabel `profiles`, `user_roles`, `projects`, `blogs`
- Trigger `handle_new_user()` — auto profile + role `user_starter` + saldo Rp 50.000
- RPC **`potong_saldo_generate()`** — potong Rp 1.000, God Mode untuk developer
- RLS lengkap + GRANT

### 3. Buat Akun Developer (God Mode)

Daftar akun via `/auth`, lalu:

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'developer' FROM auth.users WHERE email = 'developer@cetakide.local';
```

### 4. Development

```bash
# Install dependencies
npm install
# atau
bun install

# Start development server
npm run dev
# atau
bun run dev

# Build for production
npm run build
# atau
bun run build

# Preview production build
npm run preview
# atau
bun run preview
```

### 5. Deploy Vercel

`vercel.json` sudah tersedia, cukup import repo.

## Features

### Landing Page Components

Landing page (`src/routes/index.tsx`) terdiri dari beberapa section:

1. **Hero** - Mockup animasi dengan typewriter effect dan 3D scatter cards
2. **Showcase** - Carousel otomatis untuk berbagai format iklan
3. **Bento Grid** - Multi-niche showcase dengan tab filter
4. **Logo Branding** - Carousel logo circular
5. **Stats** - Statistik platform
6. **Keunggulan** - Fitur utama platform
7. **Cara Kerja** - 3 langkah penggunaan
8. **FAQ** - Pertanyaan yang sering ditanya
9. **Pricing CTA** - Section harga dengan promo
10. **Footer** - Informasi kontak dan navigasi

### Navigation

Header navigation (`src/components/site-header.tsx`) menyediakan link ke semua section:

- Showcase
- Contoh Hasil
- Logo
- Statistik
- Keunggulan
- Cara Kerja
- FAQ
- Harga

### Hero Mockup Animation

Hero mockup memiliki animasi simulasi yang:

- Mengetik prompt secara otomatis
- Menampilkan loading state
- Menampilkan hasil visual dalam 3D scatter
- Loop otomatis setiap ~14 detik
- Tombol manual regenerate (↻) untuk mengulang animasi

## Data Login Demo

| Field    | Value                            |
| -------- | -------------------------------- |
| Username | `developer`                      |
| Password | `hafnikucantik13`                |
| Role     | `developer` (unlimited generate) |

## Development Guidelines

### Adding New Components

1. Buat komponen baru di `src/components/` atau `src/components/ui/`
2. Import dan gunakan di route yang sesuai di `src/routes/`
3. Pastikan styling konsisten menggunakan Tailwind CSS
4. Gunakan komponen shadcn/ui untuk UI elements standar

### Updating Content

Content landing page (text, images, data) tersedia di `src/config/site-assets.ts`:

- `BRAND` - Brand colors, names, social links
- `heroPrompt` - Text untuk typewriter effect
- `heroMockupCards` - Images untuk hero mockup
- `carouselData` - Data untuk showcase carousel
- `nicheTabs` - Tab filter untuk bento grid
- `bentoByNiche` - Images untuk setiap niche
- `logoShowcase` - Images untuk logo carousel
- `stats` - Data statistik
- `whyUs` - Data keunggulan
- `howItWorks` - Data cara kerja
- `faqs` - Data FAQ
- `footerColumns` - Data footer links

### Styling

- Gunakan Tailwind CSS v4 dengan `@theme inline`
- Brand colors tersedia di `BRAND` object
- Utility classes custom tersedia di `src/styles.css`
- Gunakan `style={{ color: BRAND.gold }}` untuk brand colors

## Troubleshooting

### Build Errors

Jika mengalami error saat build:

1. Pastikan semua dependencies terinstall: `npm install`
2. Cek TypeScript errors: `npm run lint`
3. Clear cache: `rm -rf node_modules .vite` lalu install ulang

### Supabase Connection

Jika koneksi Supabase gagal:

1. Pastikan `.env` file sudah terisi dengan benar
2. Cek Supabase project status di dashboard
3. Pastikan database schema sudah di-setup via `supabase-setup.sql`

## Future Improvements

- [ ] Add unit tests untuk komponen critical
- [ ] Implement E2E tests dengan Playwright
- [ ] Add error boundary untuk better error handling
- [ ] Optimize images dengan next-gen formats
- [ ] Add loading skeletons untuk better UX
- [ ] Implement analytics tracking
- [ ] Add A/B testing framework
- [ ] Improve SEO dengan meta tags dan structured data

## Kontak

WhatsApp Admin: [+62 889-7595-8005](https://wa.me/6288975958005)
