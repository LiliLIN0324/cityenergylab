const json = (data, status = 200) => new Response(JSON.stringify(data, null, 2), {
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
