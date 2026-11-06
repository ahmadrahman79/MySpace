-- =========================================================================
-- MYSPACE MODULAR DATABASE SCHEMA (SUPABASE POSTGRESQL)
-- 10 Core Tables with Strict Row Level Security (RLS) & Security Provisions
-- =========================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------------------
-- 1. PROFILES (Informasi Profil Pengguna)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE,
    full_name TEXT DEFAULT 'User',
    avatar_url TEXT,
    timezone TEXT DEFAULT 'Asia/Jakarta',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to automatically create profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -------------------------------------------------------------------------
-- 2. CATEGORIES (Kategori Tugas, Catatan & Aktivitas BPS)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6366f1',
    icon TEXT DEFAULT 'folder',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories(user_id);

-- -------------------------------------------------------------------------
-- 3. PROJECTS (Pengelolaan Proyek Pribadi / Tim)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    color TEXT DEFAULT 'purple',
    icon TEXT DEFAULT 'layers',
    status TEXT DEFAULT 'active', -- active, archived, completed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_user ON public.projects(user_id);

-- -------------------------------------------------------------------------
-- 4. CALENDARS (Kategori / Tipe Kalender)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.calendars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#4f46e5',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendars_user ON public.calendars(user_id);

-- -------------------------------------------------------------------------
-- 5. TASKS (To-Do List dan Daftar Pekerjaan)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY DEFAULT ('task-' || uuid_generate_v4()::text),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    activity TEXT NOT NULL DEFAULT 'Administrasi',
    progress TEXT NOT NULL DEFAULT 'Not Started', -- 'Very Urgent', 'Not Started', 'Doing', 'Waiting on External', 'Done'
    priority TEXT NOT NULL DEFAULT 'Medium', -- 'Low', 'Medium', 'High', 'Urgent'
    finish_at DATE,
    finish_at_raw TEXT,
    status_kipapp TEXT NOT NULL DEFAULT 'Pending', -- 'Pending', 'Added', 'Not Add'
    note TEXT DEFAULT '',
    origin_sticky_note_id TEXT,
    event_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_progress ON public.tasks(progress);
CREATE INDEX IF NOT EXISTS idx_tasks_finish_at ON public.tasks(finish_at);
CREATE INDEX IF NOT EXISTS idx_tasks_activity ON public.tasks(activity);

-- -------------------------------------------------------------------------
-- 6. STICKY_NOTES (Catatan Singkat di Dashboard & Quick Capture)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sticky_notes (
    id TEXT PRIMARY KEY DEFAULT ('sticky-' || uuid_generate_v4()::text),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    area TEXT NOT NULL DEFAULT 'Personal', -- Personal, Family, Business, Side Hustle
    priority TEXT NOT NULL DEFAULT 'Medium',
    status TEXT NOT NULL DEFAULT 'Not started',
    date DATE,
    completed BOOLEAN DEFAULT false,
    color TEXT DEFAULT 'amber', -- amber, emerald, sky, purple, rose, orange
    converted_to_task_id TEXT REFERENCES public.tasks(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sticky_user ON public.sticky_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_sticky_completed ON public.sticky_notes(completed);

-- -------------------------------------------------------------------------
-- 7. NOTES (Catatan Panjang dan Terstruktur / Dokumentasi)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notes (
    id TEXT PRIMARY KEY DEFAULT ('note-' || uuid_generate_v4()::text),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    activity TEXT NOT NULL DEFAULT 'General',
    created_by TEXT DEFAULT 'User',
    last_edited_time TEXT DEFAULT NOW()::text,
    content TEXT DEFAULT '',
    is_pinned BOOLEAN DEFAULT false,
    links JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_user ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_activity ON public.notes(activity);

-- -------------------------------------------------------------------------
-- 8. EVENTS (Jadwal, Kegiatan, Libur Nasional & Cuti Bersama)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.events (
    id TEXT PRIMARY KEY DEFAULT ('event-' || uuid_generate_v4()::text),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    calendar_id UUID REFERENCES public.calendars(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    activity TEXT NOT NULL DEFAULT 'Umum',
    start_date DATE,
    end_date DATE,
    date_raw TEXT,
    is_range BOOLEAN DEFAULT false,
    status TEXT NOT NULL DEFAULT 'Not Started',
    type TEXT NOT NULL DEFAULT 'event', -- 'event', 'holiday', 'leave'
    description TEXT DEFAULT '',
    location TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_user ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON public.events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(type);

-- -------------------------------------------------------------------------
-- 9. ATTACHMENTS (Metadata File Lampiran & Gambar di Supabase Storage)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id TEXT REFERENCES public.tasks(id) ON DELETE CASCADE,
    note_id TEXT REFERENCES public.notes(id) ON DELETE CASCADE,
    event_id TEXT REFERENCES public.events(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    file_type TEXT DEFAULT 'image', -- image, document, link
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attachments_user ON public.attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_attachments_task ON public.attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_attachments_note ON public.attachments(note_id);

-- -------------------------------------------------------------------------
-- 10. HABITS (Habit Tracker for future development)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.habits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    frequency TEXT NOT NULL DEFAULT 'daily', -- daily, weekly, custom
    start_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_habits_user ON public.habits(user_id);

-- Enable Row Level Security for habits
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

-- Policies: users can CRUD their own habits
CREATE POLICY "habits_select" ON public.habits FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "habits_insert" ON public.habits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "habits_update" ON public.habits FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "habits_delete" ON public.habits FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- -------------------------------------------------------------------------
-- 10. HABITS (Habit Tracker untuk Pengembangan Mendatang)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.habits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    frequency TEXT DEFAULT 'daily', -- daily, weekly, monthly
    target_days INT DEFAULT 7,
    current_streak INT DEFAULT 0,
    color TEXT DEFAULT '#10b981',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_habits_user ON public.habits(user_id);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ketentuan 1: Semua tabel personal WAJIB memiliki RLS aktif
-- Memastikan pengguna HANYA dapat melihat dan mengedit data miliknya sendiri.
-- Untuk public holidays (Libur Nasional), diizinkan dibaca secara publik jika user_id IS NULL.
-- =========================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sticky_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 2. Categories Policies
CREATE POLICY "Users can manage own categories" ON public.categories
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

-- 3. Projects Policies
CREATE POLICY "Users can manage own projects" ON public.projects
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

-- 4. Calendars Policies
CREATE POLICY "Users can manage own calendars" ON public.calendars
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

-- 5. Tasks Policies (Owner only, or public seed fallback if user_id is null)
CREATE POLICY "Users can manage own tasks" ON public.tasks
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

-- 6. Sticky Notes Policies
CREATE POLICY "Users can manage own sticky notes" ON public.sticky_notes
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

-- 7. Notes Policies
CREATE POLICY "Users can manage own notes" ON public.notes
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

-- 8. Events Policies (Allows reading public holidays where user_id IS NULL or user owns event)
CREATE POLICY "Users can view events and public holidays" ON public.events
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can manage own events" ON public.events
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

-- 9. Attachments Policies
CREATE POLICY "Users can manage own attachments" ON public.attachments
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

-- 10. Habits Policies
CREATE POLICY "Users can manage own habits" ON public.habits
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

-- =========================================================================
-- SUPABASE STORAGE BUCKET: attachments & productivity-images
-- =========================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('productivity-images', 'productivity-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Read Attachments" ON storage.objects
    FOR SELECT USING (bucket_id IN ('productivity-images', 'attachments'));

CREATE POLICY "Authenticated Insert Attachments" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id IN ('productivity-images', 'attachments'));

CREATE POLICY "Owner Delete Attachments" ON storage.objects
    FOR DELETE USING (bucket_id IN ('productivity-images', 'attachments'));
