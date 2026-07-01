# CetakIde — AI Visual Builder Instan

Platform SaaS untuk generate banner iklan, YouTube thumbnail, dan logo brand dalam 1 klik.

## Stack

- TanStack Start v1 (React 19 + file-based routing)
- Vite 7 + Tailwind CSS v4 (CSS-first, `@theme inline`, custom `@utility`)
- shadcn/ui + Radix + Lucide icons
- Embla Carousel
- Supabase (Auth, Postgres, RPC)

## Setup

### 1. Environment (`.env`)

```
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
bun install
bun run dev
```

### 5. Deploy Vercel

`vercel.json` sudah tersedia, cukup import repo.

## Data Login Demo

| Field | Value |
|---|---|
| Username | `developer` |
| Password | `hafnikucantik13` |
| Role | `developer` (unlimited generate) |

## Kontak

WhatsApp Admin: [+62 889-7595-8005](https://wa.me/6288975958005)