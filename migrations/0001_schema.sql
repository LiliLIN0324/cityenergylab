-- Cloudflare D1 schema：CITY ENERGY LAB 站点数据
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS lab_profile (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT,
  program TEXT,
  academic_background TEXT,
  research_field TEXT,
  photo TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS alumni (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  detail TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS publications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section TEXT,
  citation TEXT NOT NULL,
  journal TEXT,
  year INTEGER
);

CREATE TABLE IF NOT EXISTS news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  date TEXT,
  excerpt TEXT,
  url TEXT
);

CREATE TABLE IF NOT EXISTS research_areas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  heading TEXT,
  content TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  heading TEXT,
  content TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  heading TEXT,
  content TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pages (
  slug TEXT PRIMARY KEY,
  title TEXT,
  url TEXT,
  text TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  ip TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_publications_year ON publications(year DESC);
CREATE INDEX IF NOT EXISTS idx_members_category ON members(category);
CREATE INDEX IF NOT EXISTS idx_news_date ON news(date DESC);
