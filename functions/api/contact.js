const json = (data, status = 200) => new Response(JSON.stringify(data, null, 2), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' },
});

export async function onRequestPost({ request, env }) {
  let body;
  try {
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) body = await request.json();
    else { const fd = await request.formData(); body = Object.fromEntries(fd.entries()); }
  } catch {
    return json({ ok: false, error: 'invalid body' }, 400);
  }
  const name = (body.name || body['your-name'] || '').toString().trim().slice(0, 120);
  const email = (body.email || body['your-email'] || '').toString().trim().slice(0, 200);
  const subject = (body.subject || body['your-subject'] || '').toString().trim().slice(0, 200);
  const message = (body.message || body['your-message'] || '').toString().trim().slice(0, 5000);
  if (!message) return json({ ok: false, error: 'message is required' }, 400);
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ ok: false, error: 'invalid email' }, 400);
  try {
    const res = await env.DB.prepare(
      'INSERT INTO contact_messages (name, email, subject, message, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(name, email, subject, message, request.headers.get('cf-connecting-ip') || '', (request.headers.get('user-agent') || '').slice(0, 300)).run();
    return json({ ok: true, id: res.meta && res.meta.last_row_id });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type' } });
}
