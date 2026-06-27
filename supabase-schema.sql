-- ===================================================
-- RELATIONAL SUPABASE SCHEMA FOR SIMRS MONITORING
-- ===================================================
--
-- Jalankan query SQL ini di Supabase SQL Editor Anda
-- untuk membuat tabel terstruktur berbasis kolom (relasional).
-- Aplikasi akan menyinkronkan data dari sistem secara real-time
-- ke tabel-tabel ini sehingga Anda bisa melakukan visualisasi, 
-- query SQL, dan filter seperti database profesional!

-- 1. Tabel Konfigurasi & State Hibrid Utama
CREATE TABLE IF NOT EXISTS simrs_config (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'app_state',
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabel Users
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  nickname VARCHAR(100),
  password VARCHAR(100),
  role VARCHAR(100),
  email VARCHAR(255),
  status_aktif BOOLEAN DEFAULT true,
  site_tugas VARCHAR(100),
  divisi VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Tabel Projects / Site Implementations
CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(50) PRIMARY KEY,
  kode VARCHAR(50),
  nama VARCHAR(255) NOT NULL,
  modul VARCHAR(100),
  pic VARCHAR(100),
  client VARCHAR(255),
  asal VARCHAR(100),
  status VARCHAR(100),
  start_date VARCHAR(50),
  end_date VARCHAR(50),
  completion_date VARCHAR(50),
  prasyarat TEXT,
  notes TEXT,
  url VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Tabel Clients
CREATE TABLE IF NOT EXISTS clients (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(50) UNIQUE,
  name VARCHAR(255) NOT NULL,
  pic VARCHAR(100),
  nip_direktur VARCHAR(100),
  status VARCHAR(100),
  tipe_medika VARCHAR(100),
  klasifikasi VARCHAR(100),
  no_kso VARCHAR(100),
  tanggal_awal_kso VARCHAR(50),
  tanggal_akhir_kso VARCHAR(50),
  persentase_kso NUMERIC,
  status_aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  kode_rs VARCHAR(5)
);

-- 4b. Tabel Client Rooms (client_rooms)
CREATE TABLE IF NOT EXISTS client_rooms (
  id VARCHAR(50) PRIMARY KEY,
  client_id VARCHAR(50) NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  building VARCHAR(255),
  code VARCHAR(50),
  floor VARCHAR(50),
  description TEXT,
  sub_room_name VARCHAR(255),
  status_aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4c. Tabel Client Directors (client_directors)
CREATE TABLE IF NOT EXISTS client_directors (
  id VARCHAR(50) PRIMARY KEY,
  client_id VARCHAR(50) NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  nip VARCHAR(100),
  start_date VARCHAR(50),
  end_date VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4d. Tabel Client KSO History (client_kso_history)
CREATE TABLE IF NOT EXISTS client_kso_history (
  id VARCHAR(50) PRIMARY KEY,
  client_id VARCHAR(50) NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  no_kso VARCHAR(100) NOT NULL,
  start_date VARCHAR(50),
  end_date VARCHAR(50),
  persentase_kso NUMERIC,
  status_aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Tabel Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(50) PRIMARY KEY,
  project VARCHAR(50),
  modul VARCHAR(100),
  task TEXT,
  task_type VARCHAR(100),
  category_progress VARCHAR(100),
  pic VARCHAR(100),
  priority VARCHAR(50),
  status VARCHAR(100),
  start_date VARCHAR(50),
  due_date VARCHAR(50),
  progress INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Tabel Tickets
CREATE TABLE IF NOT EXISTS tickets (
  id VARCHAR(50) PRIMARY KEY,
  ticket_no VARCHAR(100),
  client VARCHAR(255),
  modul VARCHAR(100),
  issue TEXT,
  reported_by VARCHAR(100),
  priority VARCHAR(50),
  status VARCHAR(100),
  assigned_to VARCHAR(100),
  solution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. Tabel Communication Logs (commlogs)
CREATE TABLE IF NOT EXISTS commlogs (
  id VARCHAR(50) PRIMARY KEY,
  project VARCHAR(50),
  client VARCHAR(255),
  speaker VARCHAR(100),
  media VARCHAR(100),
  topic TEXT,
  notes TEXT,
  date VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. Tabel Meeting Logs (meetinglogs)
CREATE TABLE IF NOT EXISTS meetinglogs (
  id VARCHAR(50) PRIMARY KEY,
  project VARCHAR(50),
  client VARCHAR(255),
  topic TEXT,
  host VARCHAR(100),
  notes TEXT,
  date VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 9. Tabel Checklists (checklist harian site)
CREATE TABLE IF NOT EXISTS checklists (
  id VARCHAR(50) PRIMARY KEY,
  site VARCHAR(255),
  verified_by VARCHAR(100),
  notes TEXT,
  score NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  items JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- 10. Tabel Assets
CREATE TABLE IF NOT EXISTS assets (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100),
  category VARCHAR(100),
  status VARCHAR(100),
  location VARCHAR(255),
  owner VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 11. Tabel Monev (Monitoring & Evaluasi)
CREATE TABLE IF NOT EXISTS monev (
  id VARCHAR(50) PRIMARY KEY,
  site VARCHAR(255),
  indicator VARCHAR(255),
  target NUMERIC,
  actual NUMERIC,
  status VARCHAR(100),
  notes TEXT,
  period VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 12. Tabel Billing / KSO Finance
CREATE TABLE IF NOT EXISTS billing (
  id VARCHAR(50) PRIMARY KEY,
  invoice_no VARCHAR(100),
  client VARCHAR(255),
  amount NUMERIC DEFAULT 0,
  due_date VARCHAR(50),
  status VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 13. Tabel ATK Items
CREATE TABLE IF NOT EXISTS atk_items (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  unit VARCHAR(50),
  price NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_by VARCHAR(100)
);

-- 14. Tabel ATK Orders
CREATE TABLE IF NOT EXISTS atk_orders (
  id VARCHAR(50) PRIMARY KEY,
  item_id VARCHAR(50),
  item_name VARCHAR(255),
  quantity INT DEFAULT 1,
  requested_by VARCHAR(100),
  status VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 15. Tabel Kas Site Transactions
CREATE TABLE IF NOT EXISTS kas_site_transactions (
  id VARCHAR(50) PRIMARY KEY,
  site VARCHAR(255),
  type VARCHAR(50), -- DEBIT / KREDIT
  amount NUMERIC DEFAULT 0,
  description TEXT,
  reported_by VARCHAR(100),
  date VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ========================================================
-- ELEVATED PERMISSIONS & DISABLE RLS UNTUK ADMIN SUITE
-- ========================================================
-- Mengizinkan modifikasi tabel penuh secara internal
ALTER TABLE simrs_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_directors DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_kso_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE commlogs DISABLE ROW LEVEL SECURITY;
ALTER TABLE meetinglogs DISABLE ROW LEVEL SECURITY;
ALTER TABLE checklists DISABLE ROW LEVEL SECURITY;
ALTER TABLE assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE monev DISABLE ROW LEVEL SECURITY;
ALTER TABLE billing DISABLE ROW LEVEL SECURITY;
ALTER TABLE atk_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE atk_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE kas_site_transactions DISABLE ROW LEVEL SECURITY;
