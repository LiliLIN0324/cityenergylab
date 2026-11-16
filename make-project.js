// 生成 Cloudflare Pages 项目文件：public/、functions/、wrangler.toml、package.json、README
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const SITE = path.join(ROOT, 'site');
const PUB = path.join(ROOT, 'public');

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

fs.rmSync(PUB, { recursive: true, force: true });
copyDir(SITE, PUB);
console.log('public/ 已生成');

const F = path.join(ROOT, 'functions');
fs.mkdirSync(path.join(F, 'api'), { recursive: true });

const json = (data, status = 200) => new Response(JSON.stringify(data, null, 2), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' },
});

const files = {};

files['functions/api/index.js'] = `export async function onRequestGet() {
  return new Response(JSON.stringify({
    service: 'CITY ENERGY LAB API',
    version: '1.0.0',
    endpoints: [
      'GET /api/lab-info',
      'GET /api/members',
      'GET /api/publications?year=2025&q=keyword&limit=50',
      'GET /api/news?limit=20',
      'GET /api/research',
      'GET /api/projects',
      'GET /api/courses',
      'GET /api/pages',
      'POST /api/contact  { name, email, subject, message }'
    ]
  }, null, 2), { headers: { 'content-type': 'application/json; charset=utf-8' } });
}
`;

files['functions/api/lab-info.js'] = `const json = (data, status = 200) => new Response(JSON.stringify(data, null, 2), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': 'max-age=300' },
});

export async function onRequestGet({ env }) {
  try {
    const profile = await env.DB.prepare('SELECT key, value FROM lab_profile').all();
    const counts = await env.DB.prepare(\`SELECT
        (SELECT COUNT(*) FROM members) AS members,
        (SELECT COUNT(*) FROM publications) AS publications,
        (SELECT COUNT(*) FROM news) AS news,
        (SELECT COUNT(*) FROM pages) AS pages\`).first();
    const info = Object.fromEntries((profile.results || []).map((r) => [r.key, r.value]));
    return json({ info, counts });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
}
`;

files['functions/api/members.js'] = `const json = (data, status = 200) => new Response(JSON.stringify(data, null, 2), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': 'max-age=300' },
});

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  try {
    const stmt = category
      ? env.DB.prepare('SELECT * FROM members WHERE category = ? ORDER BY sort_order').bind(category)
      : env.DB.prepare('SELECT * FROM members ORDER BY sort_order');
    const { results } = await stmt.all();
    return json({ count: results.length, items: results });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
}
`;

files['functions/api/publications.js'] = `const json = (data, status = 200) => new Response(JSON.stringify(data, null, 2), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': 'max-age=300' },
});

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const year = url.searchParams.get('year');
  const q = url.searchParams.get('q');
  const limit = Math.min(Number(url.searchParams.get('limit')) || 200, 500);
  const where = [];
  const binds = [];
  if (year) { where.push('year = ?'); binds.push(Number(year)); }
  if (q) { where.push('(citation LIKE ? OR journal LIKE ?)'); binds.push('%' + q + '%', '%' + q + '%'); }
  const sql = 'SELECT * FROM publications' + (where.length ? ' WHERE ' + where.join(' AND ') : '') + ' ORDER BY year DESC, id DESC LIMIT ?';
  binds.push(limit);
  try {
    const { results } = await env.DB.prepare(sql).bind(...binds).all();
    return json({ count: results.length, items: results });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
}
`;

files['functions/api/news.js'] = `const json = (data, status = 200) => new Response(JSON.stringify(data, null, 2), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': 'max-age=300' },
});

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get('limit')) || 30, 200);
  try {
    const { results } = await env.DB.prepare('SELECT * FROM news ORDER BY id DESC LIMIT ?').bind(limit).all();
    return json({ count: results.length, items: results });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
}
`;

for (const [route, table] of [['research', 'research_areas'], ['projects', 'projects'], ['courses', 'courses']]) {
  files[`functions/api/${route}.js`] = `const json = (data, status = 200) => new Response(JSON.stringify(data, null, 2), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': 'max-age=300' },
});

export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare('SELECT * FROM ${table} ORDER BY sort_order').all();
    return json({ count: results.length, items: results });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
}
`;
}

files['functions/api/pages.js'] = `const json = (data, status = 200) => new Response(JSON.stringify(data, null, 2), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': 'max-age=300' },
});

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');
  try {
    if (slug) {
      const row = await env.DB.prepare('SELECT slug, title, url, text FROM pages WHERE slug = ?').bind(slug).first();
      return row ? json(row) : json({ error: 'not found' }, 404);
    }
    const { results } = await env.DB.prepare('SELECT slug, title, url FROM pages ORDER BY slug').all();
    return json({ count: results.length, items: results });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
}
`;

files['functions/api/contact.js'] = `const json = (data, status = 200) => new Response(JSON.stringify(data, null, 2), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' },
});

export async function onRequestPost({ request, env }) {
  let body;
  try {
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) body = await request.json();
    else { const fd = await request.formData(); body = Object.fromEntries(fd.entries()); }
  } catch {
    return json({ ok: false, error: 'invalid body' }, 400);
  }
  const name = (body.name || body['your-name'] || '').toString().trim().slice(0, 120);
  const email = (body.email || body['your-email'] || '').toString().trim().slice(0, 200);
  const subject = (body.subject || body['your-subject'] || '').toString().trim().slice(0, 200);
  const message = (body.message || body['your-message'] || '').toString().trim().slice(0, 5000);
  if (!message) return json({ ok: false, error: 'message is required' }, 400);
  if (email && !/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email)) return json({ ok: false, error: 'invalid email' }, 400);
  try {
    const res = await env.DB.prepare(
      'INSERT INTO contact_messages (name, email, subject, message, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(name, email, subject, message, request.headers.get('cf-connecting-ip') || '', (request.headers.get('user-agent') || '').slice(0, 300)).run();
    return json({ ok: true, id: res.meta && res.meta.last_row_id });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type' } });
}
`;

// Contact Form 7 兼容端点：让页面里的原表单仍能提交，数据落 D1
files['functions/wp-json/contact-form-7/v1/contact-forms/[id]/feedback.js'] = `export async function onRequestPost({ request, env, params }) {
  const headers = { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' };
  let body;
  try {
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) body = await request.json();
    else { const fd = await request.formData(); body = Object.fromEntries(fd.entries()); }
  } catch {
    return new Response(JSON.stringify({ status: 'validation_failed', message: '无法解析提交内容' }), { status: 400, headers });
  }
  const pick = (...keys) => {
    for (const k of keys) {
      const v = body[k];
      if (v !== undefined && v !== null && String(v).trim()) return String(v).trim();
    }
    return '';
  };
  const name = pick('your-name', 'name');
  const email = pick('your-email', 'email');
  const subject = pick('your-subject', 'subject');
  const message = pick('your-message', 'message');
  if (!message) {
    return new Response(JSON.stringify({ status: 'validation_failed', message: '请填写留言内容', into: '#', invalid_fields: [] }), { status: 200, headers });
  }
  try {
    await env.DB.prepare(
      'INSERT INTO contact_messages (name, email, subject, message, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(name, email, subject, message, request.headers.get('cf-connecting-ip') || '', (request.headers.get('user-agent') || '').slice(0, 300)).run();
    return new Response(JSON.stringify({
      status: 'mail_sent',
      message: 'Thank you for your message. It has been sent.',
      into: '#',
      form_id: Number(params.id) || 0,
    }), { status: 200, headers });
  } catch (e) {
    return new Response(JSON.stringify({ status: 'mail_failed', message: 'Server error: ' + String(e) }), { status: 500, headers });
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type' } });
}
`;

files['functions/api/health.js'] = `export async function onRequestGet({ env }) {
  const out = { ok: true, db: 'unknown' };
  try {
    const r = await env.DB.prepare('SELECT COUNT(*) AS n FROM members').first();
    out.db = 'ok';
    out.members = r.n;
  } catch (e) {
    out.db = 'error: ' + String(e);
    out.ok = false;
  }
  return new Response(JSON.stringify(out, null, 2), { status: out.ok ? 200 : 500, headers: { 'content-type': 'application/json; charset=utf-8' } });
}
`;

for (const [file, content] of Object.entries(files)) {
  const p = path.join(ROOT, file);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}
console.log('functions/ 已生成:', Object.keys(files).length, '个文件');

const wrangler = `name = "city-energy-lab"
compatibility_date = "2025-06-01"
pages_build_output_dir = "public"

# D1 数据库绑定
[[d1_databases]]
binding = "DB"
database_name = "cityenergylab-db"
database_id = "61a1c384-b8f1-49ef-b5ca-4ee2615240e7"
`;
fs.writeFileSync(path.join(ROOT, 'wrangler.toml'), wrangler);

fs.writeFileSync(path.join(ROOT, 'package.json'), JSON.stringify({
  name: 'cityenergylab',
  version: '1.0.0',
  private: true,
  description: 'CITY ENERGY LAB website — static mirror on Cloudflare Pages + D1 lab database',
  scripts: {
    deploy: 'wrangler pages deploy public',
    dev: 'wrangler pages dev public',
    'db:schema': 'wrangler d1 execute cityenergylab-db --remote --file=migrations/0001_schema.sql',
    'db:seed': 'wrangler d1 execute cityenergylab-db --remote --file=migrations/0002_seed.sql',
  },
  devDependencies: { wrangler: '^4.0.0' },
}, null, 2) + '\n');

fs.writeFileSync(path.join(ROOT, '.gitignore'), `node_modules/
.wrangler/
.dev.vars
crawl-report.json
asset-failures.json
site/
*.log
`);

console.log('wrangler.toml / package.json / .gitignore 已生成');
