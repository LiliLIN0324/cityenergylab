const json = (data, status = 200) => new Response(JSON.stringify(data, null, 2), {
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
