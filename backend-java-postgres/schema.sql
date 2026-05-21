-- =========================================================================
-- TASKHUB ENTERPRISE DATABASE SCHEMA Blueprints (PostgreSQL 14+)
-- =========================================================================

-- Enable UUID extension for cryptographic keys if desired
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    password VARCHAR(255) NOT NULL, -- Stored as bcrypt hash in Java
    role VARCHAR(50) NOT NULL CHECK (role IN ('Administrator', 'Project Lead', 'Developer', 'Client')),
    email VARCHAR(150) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CREATE INDEX for query acceleration
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

-- 2. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(50) PRIMARY KEY,
    kode VARCHAR(50) UNIQUE NOT NULL,
    nama VARCHAR(255) NOT NULL,
    modul VARCHAR(100),
    pic VARCHAR(150),
    client VARCHAR(255),
    asal VARCHAR(100),
    status VARCHAR(50) DEFAULT 'On Track',
    start_date DATE,
    end_date DATE,
    completion_date DATE,
    prasyarat TEXT,
    notes TEXT,
    url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for searching projects quickly
CREATE INDEX idx_projects_kode ON projects(kode);
CREATE INDEX idx_projects_status ON projects(status);

-- 3. TASKS TABLE (Child of Projects)
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(50) PRIMARY KEY,
    project_code VARCHAR(50) NOT NULL REFERENCES projects(kode) ON DELETE CASCADE,
    modul VARCHAR(100),
    task VARCHAR(255) NOT NULL,
    task_type VARCHAR(100),
    category_progress VARCHAR(100),
    pic VARCHAR(150),
    priority VARCHAR(50) CHECK (priority IN ('Urgent', 'High', 'Medium', 'Low', 'Very Low')),
    status VARCHAR(50) CHECK (status IN ('Not Started', 'In Progress', 'Done', 'Pending', 'Cancelled', 'Backlog')),
    start_date DATE,
    due_date DATE,
    progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    notes TEXT,
    url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for sorting and filtering tasks
CREATE INDEX idx_tasks_project ON tasks(project_code);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_pic ON tasks(pic);

-- 4. SUBTASKS TABLE (Checklist)
CREATE TABLE IF NOT EXISTS subtasks (
    id VARCHAR(50) PRIMARY KEY,
    task_id VARCHAR(50) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    done BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subtasks_task ON subtasks(task_id);

-- 5. COMMUNICATION LOGS TABLE
CREATE TABLE IF NOT EXISTS comm_logs (
    id VARCHAR(50) PRIMARY KEY,
    project_code VARCHAR(50) NOT NULL REFERENCES projects(kode) ON DELETE CASCADE,
    type VARCHAR(50) CHECK (type IN ('Email', 'WhatsApp', 'Rapat', 'Telepon')),
    date DATE,
    participants VARCHAR(255),
    summary TEXT,
    detail TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_commlogs_project ON comm_logs(project_code);

-- 6. MEETING LOGS (Minutes of Meeting)
CREATE TABLE IF NOT EXISTS meeting_logs (
    id VARCHAR(50) PRIMARY KEY,
    project_code VARCHAR(50) NOT NULL REFERENCES projects(kode) ON DELETE CASCADE,
    date DATE,
    title VARCHAR(255) NOT NULL,
    attendees TEXT,
    agenda TEXT,
    decisions TEXT,
    actions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_meetings_project ON meeting_logs(project_code);

-- 7. DOCUMENTATION LINKS TABLE
CREATE TABLE IF NOT EXISTS documentation (
    id VARCHAR(50) PRIMARY KEY,
    project_code VARCHAR(50) NOT NULL REFERENCES projects(kode) ON DELETE CASCADE,
    category VARCHAR(100) CHECK (category IN ('API Specs', 'User Manual', 'Desain', 'Kontrak', 'Lainnya')),
    title VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_docs_project ON documentation(project_code);

-- 8. PROJECT DIAGNOSTIC LOGS (Kendala / Solusi / Fokus)
CREATE TABLE IF NOT EXISTS diagnostic_logs (
    id VARCHAR(50) PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    type VARCHAR(20) CHECK (type IN ('kendala', 'solusi', 'fokus')),
    date DATE,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_diaglogs_project ON diagnostic_logs(project_id);


-- =========================================================================
-- INITIAL SEEDING DATA
-- =========================================================================

-- Pre-seed core users (Bcrypt hashes can be configured during auth pipeline)
INSERT INTO users (id, username, name, password, role, email, created_at) VALUES 
('u-admin', 'admin', 'Administrator Utama', 'admin123', 'Administrator', 'admin@taskhub.com', NOW()),
('u-lead', 'fajar', 'Fajar Pratama', 'fajar123', 'Project Lead', 'fajar@taskhub.com', NOW());

INSERT INTO projects (id, kode, nama, modul, pic, client, asal, status, start_date, end_date, created_at) VALUES
('p-01', 'P01', 'Sistem Informasi Rumah Sakit', 'Front Office', 'Fajar Pratama', 'RS Mataram', 'Tender', 'On Track', '2026-04-01', '2026-08-31', NOW());

INSERT INTO tasks (id, project_code, modul, task, task_type, category_progress, pic, priority, status, start_date, due_date, progress, created_at) VALUES
('t-01', 'P01', 'Front Office', 'Setup Halaman Login & Autentikasi JWT', 'Setting', 'Aplikasi', 'Fajar Pratama', 'Urgent', 'In Progress', '2026-05-01', '2026-05-28', 50, NOW());

INSERT INTO subtasks (id, task_id, title, done) VALUES 
('sub-1-1', 't-01', 'Desain UI Form Login', TRUE),
('sub-1-2', 't-01', 'Integrasi API Autentikasi', FALSE);
