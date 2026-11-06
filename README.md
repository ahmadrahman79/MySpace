# MySpace
Aplikasi Berbasis Web untuk Management Pekerjaan

# Integrated Personal Productivity System (Web OS)

Aplikasi Web Produktivitas Terpadu yang mengintegrasikan **To-Do List**, **Sticky Notes**, **Kalender (termasuk Libur Nasional & Cuti Bersama 2026/2027)**, **Dokumentasi Panjang (Notes🤓)**, serta **Manajemen Link & Penyimpanan Gambar (Object Storage)**.

## Security & Deployment

### Security Measures
- **Row Level Security (RLS)** is enabled on all personal tables. Policies ensure users can only access their own data.
- **Authentication** uses Supabase Auth with email/password and magic link.
- **Secret Management**: `SUPABASE_SERVICE_ROLE_KEY` is never exposed to the client; only the anon key is used on the frontend.
- **HTTPS** is enforced by Vercel (all traffic is served over TLS).
- **Backup**: Export the Supabase database weekly via the Supabase dashboard or schedule a cron job.
- **Audit**: Run manual tests or use Supabase logs to verify that unauthorized users cannot access other users' data.

### Deploy to Vercel
1. Fork/clone this repository.
2. Add the following Vercel environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server‑only)
3. Connect the repo in the Vercel dashboard and deploy.

### Local Development
```bash
cd "C:\Users\hp\Documents\Coding\Web\Productivity System"
npm install
npm run dev
```

---

## 🌟 Fitur Utama & Kesesuaian Spesifikasi

(Deskripsi fitur utama tetap ada di dokumen lain.)
