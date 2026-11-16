// 站点抓取基础库：CUPID JS Cookie 校验 + Cookie jar + keep-alive 连接池
const https = require('https');
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const HOST = 'cityenergylab.cafe24.com';
const ORIGIN = 'https://' + HOST;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const agent = new https.Agent({ keepAlive: true, maxSockets: 24, maxFreeSockets: 24, timeout: 60000 });

const jar = new Map();
let cupidJs = null;

function cookieHeader() {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}

function storeCookies(setCookie) {
  if (!setCookie) return;
  for (const c of [].concat(setCookie)) {
    const kv = c.split(';')[0];
    const i = kv.indexOf('=');
    if (i > 0) jar.set(kv.slice(0, i).trim(), kv.slice(i + 1).trim());
  }
}

function solveCupid(html) {
  if (!cupidJs) cupidJs = fs.readFileSync(path.join(__dirname, '..', 'cupid.js'), 'utf8');
  const grab = (n) => {
    const key = n + '=toNumbers("';
    const i = html.indexOf(key);
    if (i < 0) return null;
    return html.slice(i + key.length, html.indexOf('"', i + key.length));
  };
  const a = grab('a'), b = grab('b'), c = grab('c');
  if (!a || !b || !c) throw new Error('CUPID challenge 结构无法解析');
  const sandbox = { console, Math, Date, String, Array, Number, parseInt, JSON };
  vm.createContext(sandbox);
  vm.runInContext(cupidJs, sandbox, { timeout: 20000 });
  sandbox.__in = { a, b, c };
  vm.runInContext(`
    function toNumbers(d){var e=[];d.replace(/(..)/g,function(x){e.push(parseInt(x,16))});return e}
    __out = JSON.stringify(slowAES.decrypt(toNumbers(__in.c), 2, toNumbers(__in.a), toNumbers(__in.b)));
  `, sandbox, { timeout: 30000 });
  const bytes = JSON.parse(sandbox.__out);
  return bytes.map((x) => Number(x).toString(16).padStart(2, '0')).join('');
}

function request(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      host: u.hostname,
      path: u.pathname + u.search,
      method: 'GET',
      agent,
      headers: {
        'User-Agent': UA,
        'Accept': opts.accept || '*/*',
        'Accept-Language': 'en-US,en;q=0.9,ko;q=0.8,zh-CN;q=0.7',
        'Accept-Encoding': 'identity',
        ...(jar.size ? { Cookie: cookieHeader() } : {}),
      },
      timeout: opts.timeout || 20000,
      rejectUnauthorized: false,
    }, (res) => {
      storeCookies(res.headers['set-cookie']);
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, buffer: Buffer.concat(chunks) }));
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
    req.end();
  });
}

async function fetchUrl(url, opts = {}) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await request(url, opts);
    if (res.status >= 500) throw new Error('HTTP ' + res.status);
    const ct = res.headers['content-type'] || '';
    if (/text\/html|application\/xml|text\/xml/.test(ct)) {
      const text = res.buffer.toString('utf8');
      if (text.includes('slowAES.decrypt') && text.length < 4000) {
        jar.set('CUPID', solveCupid(text));
        continue;
      }
      return { ...res, text };
    }
    return { ...res, text: '' };
  }
  throw new Error('CUPID 挑战未通过: ' + url);
}

async function fetchWithRetry(url, opts = {}, tries = 3) {
  let last;
  for (let i = 1; i <= tries; i++) {
    try {
      return await fetchUrl(url, opts);
    } catch (e) {
      last = e;
      await new Promise((r) => setTimeout(r, 400 * i));
    }
  }
  throw last;
}

module.exports = { HOST, ORIGIN, fetchWithRetry, jar, agent };
