const json = (data, status = 200) => new Response(JSON.stringify(data, null, 2), {
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
