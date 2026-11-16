// 断点续传抓取器：扫描已保存 HTML，补齐所有缺失资源（高并发 + keep-alive）
const fs = require('fs');
const path = require('path');
const { HOST, ORIGIN, fetchWithRetry } = require('./lib/site');

const ROOT = path.resolve(__dirname, 'site');
const ASSET_EXT = /\.(css|js|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|eot|otf|pdf|zip|mp4|webm|docx?|pptx?|xlsx?)$/i;
const SKIP = /\/(wp-admin|wp-login\.php|wp-json|xmlrpc\.php|wp-cron\.php|feed|comments|cdn-cgi)(\/|$|\?)/i;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function pageUrlFromFile(file) {
  let rel = path.relative(ROOT, file).split(path.sep).join('/');
  rel = rel.replace(/index\.html$/, '');
  return ORIGIN + '/' + rel;
}

function localFor(urlStr) {
  const u = new URL(urlStr);
  let p = decodeURIComponent(u.pathname);
  if (p.endsWith('/')) p += 'index.html';
  return path.join(ROOT, p);
}

function refsFromHtml(html) {
  const out = [];
  let m;
  const attrRe = /<(?:link|script|img|source|video|audio|iframe|embed)\b[^>]*?(?:href|src|data-src|data-lazy-src|poster|data-bg)=["']([^"']+)["']/gi;
  while ((m = attrRe.exec(html))) out.push(m[1]);
  const srcsetRe = /(?:srcset|data-srcset)=["']([^"']+)["']/gi;
  while ((m = srcsetRe.exec(html))) m[1].split(',').forEach((p) => out.push(p.trim().split(/\s+/)[0]));
  const styleRe = /url\((['"]?)([^'")]+)\1\)/gi;
  while ((m = styleRe.exec(html))) out.push(m[2]);
  return out;
}

function refsFromCss(css) {
  const out = [];
  const re = /url\((['"]?)([^'")]+)\1\)/gi;
  let m;
  while ((m = re.exec(css))) out.push(m[2]);
  return out;
}

function resolve(ref, base) {
  if (!ref) return null;
  const v = ref.trim();
  if (!v || /^(data:|mailto:|tel:|javascript:|#)/i.test(v)) return null;
  let abs;
  try { abs = new URL(v, base); } catch { return null; }
  if (abs.hostname !== HOST) return null;
  abs.hash = '';
  return abs.toString();
}

function isSaved(urlStr) {
  try { return fs.statSync(localFor(urlStr)).size > 0; } catch { return false; }
}

const seenUrls = new Set();
const pending = [];
const failures = [];
let okCount = 0, skipped = 0;

function enqueue(urlStr) {
  if (seenUrls.has(urlStr)) return;
  seenUrls.add(urlStr);
  pending.push(urlStr);
}

async function download(urlStr) {
  if (isSaved(urlStr)) { skipped++; return; }
  const res = await fetchWithRetry(urlStr, { timeout: 20000 });
  if (res.status !== 200) throw new Error('HTTP ' + res.status);
  const local = localFor(urlStr);
  fs.mkdirSync(path.dirname(local), { recursive: true });
  const ext = path.extname(new URL(urlStr).pathname).toLowerCase();
  if (ext === '.css') {
    const css = res.buffer.toString('utf8').split(ORIGIN).join('').split('http://' + HOST).join('');
    fs.writeFileSync(local, css);
    for (const r of refsFromCss(css)) {
      const abs = resolve(r, urlStr);
      if (abs && ASSET_EXT.test(new URL(abs).pathname)) enqueue(abs);
    }
  } else {
    fs.writeFileSync(local, res.buffer);
  }
  okCount++;
}

async function runPool(concurrency) {
  let idx = 0, active = 0;
  const t0 = Date.now();
  const tick = setInterval(() => {
    const el = (Date.now() - t0) / 1000;
    const rate = (okCount + skipped) / Math.max(el, 1);
    console.log(`   进度: 完成 ${okCount} / 已存在 ${skipped} / 剩余 ${pending.length - idx} / 失败 ${failures.length} | ${rate.toFixed(1)} 个/秒`);
  }, 8000);

  await new Promise((resolve) => {
    const next = () => {
      while (active < concurrency && idx < pending.length) {
        const url = pending[idx++];
        active++;
        download(url)
          .catch((e) => failures.push([url, e.message]))
          .finally(() => { active--; next(); });
      }
      if (idx >= pending.length && active === 0) { clearInterval(tick); resolve(); }
    };
    next();
  });
  clearInterval(tick);
}

(async () => {
  const htmlFiles = walk(ROOT).filter((f) => f.endsWith('.html'));
  console.log('扫描已保存页面:', htmlFiles.length);
  for (const f of htmlFiles) {
    const html = fs.readFileSync(f, 'utf8');
    const base = pageUrlFromFile(f);
    for (const r of refsFromHtml(html)) {
      const abs = resolve(r, base);
      if (!abs) continue;
      const p = new URL(abs).pathname;
      if (SKIP.test(p)) continue;
      if (ASSET_EXT.test(p)) enqueue(abs);
    }
  }
  console.log('待处理资源:', pending.length);

  const t0 = Date.now();
  await runPool(16);
  console.log(`\n第一轮完成：新增 ${okCount}，已存在 ${skipped}，失败 ${failures.length}，用时 ${((Date.now() - t0) / 1000).toFixed(0)}s`);

  if (failures.length) {
    const retry = failures.splice(0, failures.length);
    console.log(`\n重试 ${retry.length} 个失败项...`);
    okCount = 0; skipped = 0;
    for (const [u] of retry) { seenUrls.delete(u); pending.push(u); }
    await runPool(6);
  }

  const all = walk(ROOT);
  const totalBytes = all.reduce((s, f) => s + fs.statSync(f).size, 0);
  console.log('\n=========== 资源补齐完成 ===========');
  console.log('站点文件总数:', all.length);
  console.log('总大小:', (totalBytes / 1024 / 1024).toFixed(1), 'MB');
  console.log('仍未成功:', failures.length);
  if (failures.length) console.log('失败样例:', failures.slice(0, 20));
  fs.writeFileSync(path.resolve(__dirname, 'asset-failures.json'), JSON.stringify(failures, null, 2));
})().catch((e) => { console.error('FAILED:', e); process.exitCode = 1; });
