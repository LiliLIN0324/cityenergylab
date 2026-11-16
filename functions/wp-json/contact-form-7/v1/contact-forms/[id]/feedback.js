export async function onRequestPost({ request, env, params }) {
  const headers = { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' };
  let body;
  try {
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) body = await request.json();
    else { const fd = await request.formData(); body = Object.fromEntries(fd.entries()); }
  } catch {
    return new Response(JSON.stringify({ status: 'validation_failed', message: '无法解析提交内容' }), { status: 400, headers });
  }
  const pick = (...keys) => {
    for (const k of keys) {
      const v = body[k];
      if (v !== undefined && v !== null && String(v).trim()) return String(v).trim();
    }
    return '';
  };
  const name = pick('your-name', 'name');
  const email = pick('your-email', 'email');
  const subject = pick('your-subject', 'subject');
  const message = pick('your-message', 'message');
  if (!message) {
    return new Response(JSON.stringify({ status: 'validation_failed', message: '请填写留言内容', into: '#', invalid_fields: [] }), { status: 200, headers });
  }
  try {
    await env.DB.prepare(
      'INSERT INTO contact_messages (name, email, subject, message, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(name, email, subject, message, request.headers.get('cf-connecting-ip') || '', (request.headers.get('user-agent') || '').slice(0, 300)).run();
    return new Response(JSON.stringify({
      status: 'mail_sent',
      message: 'Thank you for your message. It has been sent.',
      into: '#',
      form_id: Number(params.id) || 0,
    }), { status: 200, headers });
  } catch (e) {
    return new Response(JSON.stringify({ status: 'mail_failed', message: 'Server error: ' + String(e) }), { status: 500, headers });
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type' } });
}
