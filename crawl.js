// 整站镜像抓取：页面 + 资源，全部本地化并改写为相对链接
const fs = require('fs');
const path = require('path');
const { HOST, ORIGIN, fetchWithRetry } = require('./lib/site');

const OUT = path.resolve(__dirname, 'site');
const PAGE_SKIP = /\/(wp-admin|wp-login\.php|wp-json|xmlrpc\.php|wp-cron\.php|feed|comments|cdn-cgi)(\/|$|\?)/i;
const ASSET_EXT = /\.(css|js|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|eot|otf|pdf|zip|mp4|webm|docx?|pptx?|xlsx?|txt|xml|json)$/i;

const seen = new Set();
const assetQueue = new Set();
const pages = [];
const assets = [];
const failures = [];
let done = 0;

function localPathFor(url) {
  const u = new URL(url);
  let p = decodeURIComponent(u.pathname);
  if (p.endsWith('/')) p += 'index.html';
  else if (!path.extname(p)) p += '/index.html';
  return path.join(OUT, p);
}

function save(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, data);
}

function rewrite(text) {
  return text.split(ORIGIN).join('').split('http://' + HOST).join('');
}

function isInternal(url) {
  try {
    const u = new URL(url, ORIGIN);
    return u.hostname === HOST;
  } catch { return false; }
}

function normalize(url) {
  const u = new URL(url, ORIGIN);
  u.hash = '';
  return u.toString();
}

function collectFromHtml(html, baseUrl) {
  const found = new Set();
  const push = (raw) => {
    if (!raw) return;
    const v = raw.trim();
    if (!v || v.startsWith('data:') || v.startsWith('mailto:') || v.startsWith('tel:') || v.startsWith('#') || v.startsWith('javascript:')) return;
    let abs;
    try { abs = normalize(v); } catch { return; }
    if (!isInternal(abs)) return;
    found.add(abs);
  };

  let m;
  const attrRe = /<(?:link|script|img|source|video|audio|iframe)\b[^>]*?(?:href|src|data-src|data-lazy-src|poster)=["']([^"']+)["']/gi;
  while ((m = attrRe.exec(html))) push(m[1]);

  const srcsetRe = /(?:srcset|data-srcset)=["']([^"']+)["']/gi;
  while ((m = srcsetRe.exec(html))) {
    m[1].split(',').forEach((part) => push(part.trim().split(/\s+/)[0]));
  }

  const styleUrlRe = /url\((['"]?)([^'")]+)\1\)/gi;
  while ((m = styleUrlRe.exec(html))) push(m[2]);

  const aRe = /<a\b[^>]*href=["']([^"']+)["']/gi;
  while ((m = aRe.exec(html))) push(m[1]);

  return [...found];
}

function collectFromCss(css) {
  const out = [];
  const re = /url\((['"]?)([^'")]+)\1\)/gi;
  let m;
  while ((m = re.exec(css))) {
    const v = m[2].trim();
    if (!v || v.startsWith('data:')) continue;
    try {
      const abs = normalize(new URL(v, ORIGIN).toString());
      if (isInternal(abs)) out.push(abs);
    } catch { /* ignore */ }
  }
  return out;
}

async function fetchPage(url) {
  const res = await fetchWithRetry(url, { accept: 'text/html,application/xhtml+xml' });
  if (res.status !== 200) { failures.push([url, 'HTTP ' + res.status]); return; }
  const html = rewrite(res.text);
  const file = localPathFor(url);
  save(file, html);
  pages.push([url, path.relative(OUT, file)]);
  for (const link of collectFromHtml(html, url)) {
    if (PAGE_SKIP.test(new URL(link).pathname)) continue;
    if (ASSET_EXT.test(new URL(link).pathname)) assetQueue.add(link);
    else if (!seen.has(link)) seen.add(link), pageQueue.push(link);
  }
}

const pageQueue = [];

async function fetchAsset(url) {
  const res = await fetchWithRetry(url, { binary: true });
  if (res.status !== 200) { failures.push([url, 'HTTP ' + res.status]); return; }
  const u = new URL(url);
  const ext = path.extname(u.pathname).toLowerCase();
  let file = path.join(OUT, decodeURIComponent(u.pathname));
  if (ext === '.css') {
    const css = rewrite(res.buffer.toString('utf8'));
    save(file, css);
    for (const dep of collectFromCss(css)) assetQueue.add(dep);
  } else {
    save(file, res.buffer);
  }
  assets.push([url, path.relative(OUT, file), res.buffer.length]);
}

async function pool(items, worker, concurrency = 5, label = '') {
  const arr = [...items];
  let idx = 0, active = 0;
  return new Promise((resolve) => {
    const next = () => {
      if (idx >= arr.length && active === 0) return resolve();
      while (active < concurrency && idx < arr.length) {
        const item = arr[idx++];
        active++;
        worker(item)
          .catch((e) => failures.push([item, e.message]))
          .finally(() => {
            active--; done++;
            if (done % 20 === 0) console.log(`   ${label} 进度 ${done} (pages=${pages.length}, assets=${assets.length}, 失败=${failures.length})`);
            next();
          });
      }
    };
    next();
  });
}

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  console.log('1) 拿 sitemap 枚举页面...');
  let urls = [];
  for (const sm of ['/wp-sitemap.xml', '/sitemap_index.xml', '/sitemap.xml']) {
    try {
      const r = await fetchWithRetry(ORIGIN + sm);
      if (r.status === 200 && /<sitemapindex|<urlset/.test(r.text)) {
        const subs = [...r.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
        if (/<sitemapindex/.test(r.text)) {
          for (const s of subs) {
            if (/wp-sitemap-(users|taxonomies)/.test(s)) continue;
            try {
              const rr = await fetchWithRetry(s);
              urls.push(...[...rr.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()));
            } catch (e) { failures.push([s, e.message]); }
          }
        } else urls = subs;
        console.log(`   ${sm} 枚举到 ${urls.length} 个 URL`);
        break;
      }
    } catch (e) { /* 下一个 */ }
  }
  if (!urls.length) urls = [ORIGIN + '/'];

  urls = [...new Set(urls.map(normalize))].filter((u) => {
    const p = new URL(u).pathname;
    if (PAGE_SKIP.test(p)) return false;
    if (ASSET_EXT.test(p)) { assetQueue.add(u); return false; }
    return true;
  });

  console.log(`2) 抓页面，共 ${urls.length} 个候选...`);
  urls.forEach((u) => seen.add(u));
  pageQueue.push(...urls);

  let round = 0;
  while (pageQueue.length && round < 40) {
    round++;
    const batch = pageQueue.splice(0, pageQueue.length).filter((u) => !PAGE_SKIP.test(new URL(u).pathname));
    if (!batch.length) break;
    console.log(`   --- 第 ${round} 轮：${batch.length} 个页面 ---`);
    await pool(batch, fetchPage, 5, '页面');
  }

  console.log(`3) 下载资源，共 ${assetQueue.size} 个...`);
  let assetRound = 0;
  while (assetQueue.size && assetRound < 12) {
    assetRound++;
    const batch = [...assetQueue];
    assetQueue.clear();
    console.log(`   --- 资源第 ${assetRound} 轮：${batch.length} 个 ---`);
    await pool(batch, fetchAsset, 6, '资源');
  }

  const report = {
    页面数: pages.length,
    资源数: assets.length,
    页面清单: pages,
    失败: failures,
  };
  fs.writeFileSync(path.resolve(__dirname, 'crawl-report.json'), JSON.stringify(report, null, 2));

  console.log('\n================ 抓取完成 ================');
  console.log('页面:', pages.length, '资源:', assets.length, '失败:', failures.length);
  if (failures.length) console.log('失败样例:', failures.slice(0, 15));
  const bytes = assets.reduce((s, a) => s + a[2], 0);
  console.log('资源总大小:', (bytes / 1024 / 1024).toFixed(1), 'MB');
})().catch((e) => { console.error('CRAWL FAILED:', e); process.exitCode = 1; });
