# SECURITY AUDIT REPORT: MySpace Personal Productivity Workspace
**Tanggal Audit:** 07 November 2026  
**Auditor:** Senior Application Security Engineer & Full-Stack Architect  
**Aplikasi:** MySpace (Next.js 14, TypeScript, Supabase PostgreSQL, Supabase Auth & Storage, Vercel)  
**Target Repository:** [https://github.com/ahmadrahman79/MySpace](https://github.com/ahmadrahman79/MySpace)

---

## 1. RINGKASAN EKSEKUTIF (EXECUTIVE SUMMARY)

Audit keamanan komprehensif telah dilakukan terhadap seluruh arsitektur MySpace, mencakup rute API, manajemen Supabase Service Role Key, Row Level Security (RLS), Supabase Storage & Upload, sanitasi repository Git, dependensi npm, serta konsistensi database.

### Tingkat Risiko Keseluruhan: **TINGGI (HIGH)**
Meskipun aplikasi ditujukan untuk penggunaan personal, terdapat beberapa celah kritis yang dapat mengakibatkan:
1. Akses data tanpa autentikasi pada seluruh endpoint `/api/*`.
2. Penggunaan Service Role Key di server tanpa verifikasi sesi pengguna, mem-bypass RLS Supabase.
3. Kebijakan RLS yang masih memiliki klausul permisif `user_id IS NULL`.
4. Pelacakan file backup riil (`.zip`, `.json`) di repository publik Git.
5. Kerentanan CVE tingkat kritis pada framework Next.js 14.2.15 dan PostCSS.

---

## 2. MATRIKS TEMUAN KEAMANAN (VULNERABILITY FINDINGS)

| ID | Kategori | Tingkat Risiko | Komponen / Lokasi | Dampak | Status |
|---|---|---|---|---|---|
| **SEC-01** | API Auth & Authz | **CRITICAL** | `src/app/api/tasks/route.ts`, `notes`, `events`, `sticky-notes`, `resources`, `upload` | Bypassing Auth & IDOR: Siapapun dapat membaca, menambah, mengubah, dan menghapus seluruh data tanpa login. | Teridentifikasi |
| **SEC-02** | Secret Management | **CRITICAL** | `src/lib/db/supabase.ts:6-17` | Service Role Key digunakan sebagai client utama server-side, menonaktifkan seluruh mekanisme perlindungan RLS. | Teridentifikasi |
| **SEC-03** | Row Level Security (RLS) | **HIGH** | `supabase/schema.sql:270-305` | Kebijakan `FOR ALL USING (auth.uid() = user_id OR user_id IS NULL)` memungkinkan modifikasi data publik/unassigned oleh siapa saja. | Teridentifikasi |
| **SEC-04** | Storage & File Upload | **HIGH** | `src/app/api/upload/route.ts`, `src/lib/storage/index.ts` | Upload file tanpa autentikasi, bucket storage bersifat publik (`public: true`), fallback lokal menulis ke direktori ephemeral Vercel. | Teridentifikasi |
| **SEC-05** | Sensitive Data in Git | **HIGH** | Root repository (`DailyTaks.zip`, `Kalender.zip`, `Note.zip`, `data/runtime-data.json`) | Data catatan, jadwal, dan tugas riil tersimpan dalam commit history git. | Teridentifikasi |
| **SEC-06** | Dependency Security | **CRITICAL** | `package.json` (`next@14.2.15`, `postcss@8.4.47`) | Next.js Server Actions DoS, SSRF, Cache Poisoning (GHSA-7m27-7ghc-44w9, GHSA-4342-x723-ch2f) & PostCSS XSS. | Teridentifikasi |
| **SEC-07** | Database Consistency | **MEDIUM** | `src/lib/db/supabase.ts` & `src/lib/db/local.ts` | Silent fallback ke `localDb` saat Supabase gagal, menyebabkan desinkronisasi data antara client dan server. | Teridentifikasi |
| **SEC-08** | Security Headers & CSP | **MEDIUM** | `src/middleware.ts`, `next.config.js` | Tidak adanya Security Headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy). | Teridentifikasi |

---

## 3. DETAIL TEMUAN & SKENARIO EKSPLOITASI

### SEC-01: Tidak Ada Autentikasi pada Server API Routes
* **Lokasi:**
  * `src/app/api/tasks/route.ts:4, 39`
  * `src/app/api/notes/route.ts:4, 32`
  * `src/app/api/events/route.ts:4, 34`
  * `src/app/api/sticky-notes/route.ts:4, 32`
  * `src/app/api/upload/route.ts:4`
* **Analisis:** Seluruh API route langsung mengeksekusi operasi `db.*` tanpa memverifikasi session atau memanggil `supabase.auth.getUser()`.
* **Skenario Eksploitasi:** Penyerang yang mengetahui domain Vercel dapat mengirimkan request HTTP `GET /api/tasks` atau `DELETE /api/tasks/task-123` menggunakan `curl` dan mengambil atau menghapus seluruh database tanpa kredensial.
* **Rekomendasi:**
  1. Buat helper server-side Supabase client berbasis `@supabase/ssr` (`createClientServer`).
  2. Panggil `const { data: { user } } = await supabase.auth.getUser()` pada setiap handler.
  3. Kembalikan respons `401 Unauthorized` jika user tidak valid.

---

### SEC-02: Penggunaan Service Role Key Sebagai Database Client Utama
* **Lokasi:** `src/lib/db/supabase.ts:6-16`
```typescript
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey) : null;
```
* **Analisis:** Menggunakan `SUPABASE_SERVICE_ROLE_KEY` pada client singleton server-side menonaktifkan seluruh Row Level Security (RLS) PostgreSQL. Postgres memperlakukan seluruh query sebagai `postgres/superuser`.
* **Rekomendasi:**
  1. Hapus pembacaan `SUPABASE_SERVICE_ROLE_KEY` untuk operasi CRUD harian.
  2. Gunakan `createClientServer(cookies)` yang memanfaatkan JWT session token pengguna (`auth.uid()`).
  3. Simpan `SUPABASE_SERVICE_ROLE_KEY` murni untuk script seeding atau background worker terisolasi.

---

### SEC-03: Kebijakan RLS Permisif (`user_id IS NULL`)
* **Lokasi:** `supabase/schema.sql:271, 283, 287, 291, 297`
```sql
CREATE POLICY "Users can manage own tasks" ON public.tasks
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);
```
* **Analisis:** Klausa `OR user_id IS NULL` pada operasi `FOR ALL` memungkinkan pengguna terautentikasi (atau bahkan anon jika grant diizinkan) mengubah atau menghapus data milik sistem atau seed default.
* **Rekomendasi:**
  1. Pisahkan kebijakan:
     - Untuk `SELECT`: Izinkan `auth.uid() = user_id` (dan hanya untuk tabel publik seperti libur nasional di `events` boleh `user_id IS NULL`).
     - Untuk `INSERT`: Wajib `WITH CHECK (auth.uid() = user_id)`.
     - Untuk `UPDATE` & `DELETE`: Wajib `USING (auth.uid() = user_id)`.

---

### SEC-04: Upload File Tanpa Validasi MIME Nyata & Bucket Publik
* **Lokasi:** `src/app/api/upload/route.ts` & `src/lib/storage/index.ts`
* **Analisis:** File upload menerima MIME type langsung dari header client tanpa validasi magic bytes. Storage bucket `productivity-images` dan `attachments` disetel publik.
* **Rekomendasi:**
  1. Batasi ukuran file (maksimal 5MB untuk gambar).
  2. Validasi whitelist ekstensi (`.png`, `.jpg`, `.jpeg`, `.webp`).
  3. Buat nama file menggunakan UUID acak: `${user.id}/${crypto.randomUUID()}.${ext}`.
  4. Hapus fallback penyimpanan ke disk server lokal (`public/uploads`) yang tidak aman dan hilang di serverless.

---

### SEC-05: File Sensitif / Backup Terlacak di Git
* **Lokasi:**
  - `DailyTaks.zip`
  - `Kalender.zip`
  - `Note.zip`
  - `data/runtime-data.json`
  - `data/seed-data.json`
  - `public/uploads/1793698407767_test-image.png`
* **Analisis:** File arsip zip dan JSON berisi data catatan kerja dan tugas aktual pengguna terlacak di repository Git.
* **Rekomendasi:**
  1. Tambahkan `*.zip`, `data/*.json`, `public/uploads/*` ke `.gitignore`.
  2. Minta konfirmasi pengguna sebelum melakukan `git rm --cached` terhadap file-file data pribadi tersebut.

---

### SEC-06: Kerentanan Dependensi (CVE di Next.js & PostCSS)
* **Temuan npm audit:**
  - `next@14.2.15` memiliki 2 kerentanan berisiko tinggi/kritis (Server Actions DoS, SSRF, XSS pada CSP nonce).
  - `postcss@8.4.47` memiliki kerentanan XSS dan Arbitrary file read pada source map.
* **Rekomendasi:**
  - Update `next` ke patch versi stabil terbaru dari branch 14.x (`next@14.2.25` atau patch aman non-breaking).
  - Update `postcss` ke versi `>=8.4.49`.

---

## 4. DAFTAR PRIORITAS PERBAIKAN (ACTION PLAN)

### Prioritas 1 (Segera & Aman - Non Destruktif):
1. **Perbaikan Tampilan My Tasks:**
   - Rapikan tabel My Tasks dengan layout yang proporsional, responsive, dan auto-truncate.
   - Hilangkan horizontal scrollbar ("tanpa harus menggeser layar ke samping") baik saat Side Peek dibuka maupun saat tampilan penuh.
2. **Implementasi Writing Mode Standar Dokumen (ChatGPT / Notion / Google Docs):**
   - Bangun editor kaya fitur berbasis Tiptap (`RichTextEditor`) dengan floating contextual bubble menu, slash command (`/`), Google Sheet-style table, checklist, headings, formatting lengkap, auto-save status indicator, dan Focus Mode.
   - Integrasikan ke modul Notes dan Tasks.
3. **Hardening Security Headers & Middleware:**
   - Pasang HTTP Security Headers (CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy) di `next.config.js` dan `src/middleware.ts`.
4. **Validasi Input & Upload:**
   - Sanitasi input dan proteksi MIME whitelist pada `src/app/api/upload/route.ts`.
5. **Pembaruan Dependensi yang Aman:**
   - Update patch keamanan dependensi tanpa breaking changes.

### Prioritas 2 (Memerlukan Konfirmasi Pengguna):
1. **Sanitasi Repository Git:**
   - Melepaskan tracking file backup (`DailyTaks.zip`, `Kalender.zip`, `Note.zip`, `data/runtime-data.json`) dari repository GitHub (`git rm --cached`).
2. **Pengetatan RLS & Server Auth Enforcement:**
   - Mengganti RLS di Supabase SQL dengan skema strict `auth.uid() = user_id`.
   - Mengaktifkan pengecekan `supabase.auth.getUser()` pada setiap API route secara menyeluruh.

---

## 5. REKOMENDASI TINDAKAN MANUAL OLEH PENGGUNA
1. **Rotasi Kredensial:** Lakukan rotasi Service Role Key dan Database Password di dashboard Supabase.
2. **Konfigurasi Vercel:** Pastikan `SUPABASE_SERVICE_ROLE_KEY` tidak di-share ke environment Preview publik dan tidak memiliki prefix `NEXT_PUBLIC_`.
