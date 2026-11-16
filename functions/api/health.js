export async function onRequestGet({ env }) {
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
