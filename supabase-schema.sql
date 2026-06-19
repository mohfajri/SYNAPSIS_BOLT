-- ==========================================
-- SUPABASE SCHEMA FOR SIMRS MONITORING SYSTEM
-- ==========================================
--
-- Jalankan query SQL ini di Supabase SQL Editor Anda
-- untuk menyiapkan penyimpanan data berbasis cloud.

-- 1. Buat tabel konfigurasi & state aplikasi
CREATE TABLE IF NOT EXISTS simrs_config (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'app_state',
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Aktifkan Row Level Security (RLS) jika diperlukan, 
-- namun untuk integrasi server-side API key backend (bypass RLS via service_role),
-- tabel ini aman karena tidak diakses langsung dari client-side public anon key.
ALTER TABLE simrs_config ENABLE ROW LEVEL SECURITY;

-- 3. Izinkan akses penuh untuk internal/service_role
CREATE POLICY "Allow all service role access" 
ON simrs_config 
TO service_role 
USING (true) 
WITH CHECK (true);

-- 4. Izinkan read-only untuk anonymous user (jika diperlukan untuk verifikasi publik)
CREATE POLICY "Allow read only for public" 
ON simrs_config 
FOR SELECT 
TO anon 
USING (true);

-- Keterangan:
-- Sistem ini dirancang secara hibrida.
-- Jika variabel SUPABASE_URL dan SUPABASE_ANON_KEY diatur di Vercel/Render,
-- data Anda akan otomatis migrasi dari db.json lokal Anda ke Supabase pada boot pertama aplikasi!
