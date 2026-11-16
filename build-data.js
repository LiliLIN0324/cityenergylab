// 从镜像站点提取实验室信息，并生成 Cloudflare Pages 项目（public/ + functions/ + migrations/）
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SITE = path.join(ROOT, 'site');
const PUB = path.join(ROOT, 'public');

const ENT = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#8217;': "'", '&#8216;': "'", '&#8220;': '"', '&#8221;': '"', '&#8211;': '-', '&#8212;': '-', '&#038;': '&', '&nbsp;': ' ', '&#8230;': '...', '&#039;': "'" };
function decode(s) {
  return s.replace(/&[#a-zA-Z0-9]+;/g, (m) => (ENT[m] !== undefined ? ENT[m] : m));
}
function strip(html) {
  return decode(html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ').trim();
}
function readPage(slug) {
  const f = path.join(SITE, slug, 'index.html');
  if (!fs.existsSync(f)) return null;
  return fs.readFileSync(f, 'utf8');
}
function contentOf(html) {
  const m = /<div class="main main-raised[\s\S]*?<\/div>\s*<footer/i.exec(html) || /<article[\s\S]*?<\/article>/i.exec(html);
  return m ? m[0] : html;
}
function sqlStr(v) {
  if (v === null || v === undefined) return 'NULL';
  return "'" + String(v).replace(/'/g, "''").replace(/\r?\n/g, ' ') + "'";
}

// ---------- 成员 ----------
function extractMembers() {
  const html = readPage('team-members');
  if (!html) return [];
  const out = [];
  const blockRe = /<div class="content-title">([\s\S]*?)<\/div>\s*(?:<div class="content-subtitle">([\s\S]*?)<\/div>)?\s*<div class="content-desc">([\s\S]*?)<\/div>/g;
  let m;
  while ((m = blockRe.exec(html))) {
    const name = strip(m[1]);
    const subtitle = strip(m[2] || '');
    const descHtml = m[3];
    const beforeBlock = html.slice(Math.max(0, m.index - 900), m.index);
    const photo = (/<img[^>]+src="([^"]+)"[^>]*>\s*<\/figure>/i.exec(beforeBlock) || /<img[^>]+src="([^"]+)"/i.exec(beforeBlock) || [, ''])[1];
    if (!name) continue;
    const before = html.slice(0, m.index);
    const catMatches = [...before.matchAll(/<h4 class="kc_title">([\s\S]*?)<\/h4>/g)];
    const category = catMatches.length ? strip(catMatches[catMatches.length - 1][1]) : '';
    const descText = descHtml.replace(/<br\s*\/?>/gi, ' | ');
    const parts = strip(descText).split('|').map((s) => s.trim()).filter(Boolean);
    out.push({
      name,
      category,
      photo,
      program: subtitle,
      academic_background: (parts.find((p) => /academic background/i.test(p)) || '').replace(/^Academic Background\s*[:：]\s*/i, ''),
      research_field: (parts.find((p) => /research (field|interest)/i.test(p)) || '').replace(/^Research (Field|Interests?)\s*[:：]\s*/i, ''),
      raw: strip(descHtml),
    });
  }
  return out;
}

// ---------- 论文 ----------
function extractPublications() {
  const html = readPage('publications');
  if (!html) return [];
  const body = contentOf(html);
  const out = [];
  let section = '';
  const tokens = body.split(/(<h4[\s\S]*?<\/h4>|<p[\s\S]*?<\/p>)/i);
  for (const t of tokens) {
    if (/^<h4/i.test(t)) { const s = strip(t); if (s) section = s; continue; }
    if (!/^<p/i.test(t)) continue;
    const text = strip(t);
    if (!text || text.length < 40) continue;
    if (/^\(\*?corresponding/i.test(text)) continue;
    const journal = (/<em>([\s\S]*?)<\/em>/.exec(t) || [, ''])[1];
    const yearMatch = [...text.matchAll(/\b(19|20)\d{2}\b/g)];
    out.push({
      section,
      citation: text,
      journal: strip(journal),
      year: yearMatch.length ? Number(yearMatch[yearMatch.length - 1][0]) : null,
    });
  }
  return out;
}

// ---------- 新闻 ----------
function extractNews() {
  const listHtml = readPage('news');
  if (!listHtml) return [];
  const slugs = new Set();
  for (const m of listHtml.matchAll(/<a[^>]+href="\/([a-z0-9][a-z0-9\-_\/]*)\/"[^>]*>/gi)) {
    const s = m[1];
    if (/^(wp-|about|news|team|previous|principal|publications?|courses|downloads|opportunity|research|projects|contact|author|category|page|feed|comments)/i.test(s)) continue;
    if (s.includes('/')) continue;
    slugs.add(s);
  }
  const out = [];
  for (const slug of slugs) {
    const html = readPage(slug);
    if (!html) continue;
    const title = strip((/<h1 class="hestia-title[^"]*">([\s\S]*?)<\/h1>/.exec(html) || (/<title>([\s\S]*?)<\/title>/.exec(html) || [, slug]))[1]).replace(/\s*[–-]\s*CITY ENERGY LAB\s*$/, '');
    const body = contentOf(html);
    const text = strip(body);
    const dateM = /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+20\d{2}/.exec(text)
      || /\b(20\d{2})[.\-/](\d{1,2})[.\-/](\d{1,2})\b/.exec(text)
      || /\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})\b/.exec(text);
    const excerpt = text.replace(/^CITY ENERGY LAB[\s\S]{0,200}?(?=News)/, '').slice(0, 300);
    out.push({ slug, title, date: dateM ? dateM[0] : '', excerpt, url: '/' + slug + '/' });
  }
  return out;
}

// ---------- 其它页面文本 ----------
function extractSections(slug) {
  const html = readPage(slug);
  if (!html) return [];
  const body = contentOf(html);
  const out = [];
  let heading = '';
  for (const t of body.split(/(<h[1-4][\s\S]*?<\/h[1-4]>|<p[\s\S]*?<\/p>|<li[\s\S]*?<\/li>)/i)) {
    if (/^<h[1-4]/i.test(t)) { const s = strip(t); if (s) heading = s; continue; }
    if (!/^<(p|li)/i.test(t)) continue;
    const text = strip(t);
    if (!text || text.length < 12) continue;
    out.push({ heading, text });
  }
  return out;
}

// ---------- 联系信息 ----------
function extractContact() {
  const html = readPage('contact');
  const text = html ? strip(contentOf(html)) : '';
  const email = (text.match(/[\w.+-]+@[\w-]+\.[\w.]+/) || [''])[0];
  const phone = (text.match(/\+?\d[\d\s\-()]{7,}\d/) || [''])[0];
  const address = (text.match(/(?:Address|Office|Location)[:：]?\s*([^|]{10,160})/i) || [, ''])[1];
  return { text, email, phone, address: address.trim() };
}

// ---------- 生成 SQL ----------
function build() {
  console.log('提取数据...');
  const members = extractMembers();
  const pubs = extractPublications();
  const news = extractNews();
  const contact = extractContact();
  const research = extractSections('research');
  const projects = extractSections('projects');
  const courses = extractSections('courses');
  const alumni = extractSections('previous-members');

  const home = readPage('.') || fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
  const labName = (/<title>([\s\S]*?)<\/title>/.exec(home) || [, 'CITY ENERGY LAB'])[1].trim();
  const homeText = strip(contentOf(home));
  const tagline = (homeText.match(/CITY ENERGY LAB[\s\S]{0,40}?([A-Z][^.]{20,180}\.)/) || [, ''])[1] || '';

  console.log(`  成员 ${members.length} / 论文 ${pubs.length} / 新闻 ${news.length} / 研究 ${research.length} / 项目 ${projects.length} / 课程 ${courses.length} / 校友 ${alumni.length}`);

  const extracted = { labName, tagline, contact, members, pubs, news, research, projects, courses, alumni };
  fs.writeFileSync(path.join(ROOT, 'data-extracted.json'), JSON.stringify(extracted, null, 2));

  const schema = `-- Cloudflare D1 schema：CITY ENERGY LAB 站点数据
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
`;

  const l = [];
  l.push('-- 初始数据（从原站抓取）');
  const profile = [
    ['lab_name', labName],
    ['lab_name_zh', '城市能源实验室'],
    ['tagline', tagline],
    ['email', contact.email],
    ['phone', contact.phone],
    ['address', contact.address],
    ['source_site', 'https://cityenergylab.cafe24.com/'],
    ['contact_text', contact.text.slice(0, 600)],
  ];
  for (const [k, v] of profile) l.push(`INSERT OR REPLACE INTO lab_profile (key, value) VALUES (${sqlStr(k)}, ${sqlStr(v)});`);

  members.forEach((m, i) => l.push(`INSERT INTO members (name, category, program, academic_background, research_field, photo, sort_order) VALUES (${sqlStr(m.name)}, ${sqlStr(m.category)}, ${sqlStr(m.program)}, ${sqlStr(m.academic_background)}, ${sqlStr(m.research_field)}, ${sqlStr(m.photo)}, ${i});`));

  pubs.forEach((p) => l.push(`INSERT INTO publications (section, citation, journal, year) VALUES (${sqlStr(p.section)}, ${sqlStr(p.citation)}, ${sqlStr(p.journal)}, ${p.year === null ? 'NULL' : p.year});`));

  news.forEach((n) => l.push(`INSERT OR REPLACE INTO news (slug, title, date, excerpt, url) VALUES (${sqlStr(n.slug)}, ${sqlStr(n.title)}, ${sqlStr(n.date)}, ${sqlStr(n.excerpt)}, ${sqlStr(n.url)});`));

  // 全站页面文本入库（保证所有页面信息都能从数据库读到）
  let pageCount = 0;
  for (const dir of fs.readdirSync(SITE, { withFileTypes: true })) {
    if (!dir.isDirectory() || dir.name.startsWith('wp-')) continue;
    const f = path.join(SITE, dir.name, 'index.html');
    if (!fs.existsSync(f)) continue;
    const html = fs.readFileSync(f, 'utf8');
    const title = strip((/<h1 class="hestia-title[^"]*">([\s\S]*?)<\/h1>/.exec(html) || /<title>([\s\S]*?)<\/title>/.exec(html) || [, dir.name])[1]);
    const body = strip(contentOf(html)).slice(0, 4000);
    l.push(`INSERT OR REPLACE INTO pages (slug, title, url, text) VALUES (${sqlStr(dir.name)}, ${sqlStr(title)}, ${sqlStr('/' + dir.name + '/')}, ${sqlStr(body)});`);
    pageCount++;
  }
  console.log('  页面文本入库:', pageCount);

  research.forEach((r, i) => l.push(`INSERT INTO research_areas (heading, content, sort_order) VALUES (${sqlStr(r.heading)}, ${sqlStr(r.text)}, ${i});`));
  projects.forEach((r, i) => l.push(`INSERT INTO projects (heading, content, sort_order) VALUES (${sqlStr(r.heading)}, ${sqlStr(r.text)}, ${i});`));
  courses.forEach((r, i) => l.push(`INSERT INTO courses (heading, content, sort_order) VALUES (${sqlStr(r.heading)}, ${sqlStr(r.text)}, ${i});`));

  fs.mkdirSync(path.join(ROOT, 'migrations'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'migrations', '0001_schema.sql'), schema);
  fs.writeFileSync(path.join(ROOT, 'migrations', '0002_seed.sql'), l.join('\n') + '\n');

  console.log('  migrations 已生成');
  return { members, pubs, news };
}

build();
