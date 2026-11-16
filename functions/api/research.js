const json = (data, status = 200) => new Response(JSON.stringify(data, null, 2), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': 'max-age=300' },
});

export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare('SELECT * FROM research_areas ORDER BY sort_order').all();
    return json({ count: results.length, items: results });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
}
