const json = (data, status = 200) => new Response(JSON.stringify(data, null, 2), {
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
