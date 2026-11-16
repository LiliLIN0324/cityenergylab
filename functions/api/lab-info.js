const json = (data, status = 200) => new Response(JSON.stringify(data, null, 2), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': 'max-age=300' },
});

export async function onRequestGet({ env }) {
  try {
    const profile = await env.DB.prepare('SELECT key, value FROM lab_profile').all();
    const counts = await env.DB.prepare(`SELECT
        (SELECT COUNT(*) FROM members) AS members,
        (SELECT COUNT(*) FROM publications) AS publications,
        (SELECT COUNT(*) FROM news) AS news,
        (SELECT COUNT(*) FROM pages) AS pages`).first();
    const info = Object.fromEntries((profile.results || []).map((r) => [r.key, r.value]));
    return json({ info, counts });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
}
