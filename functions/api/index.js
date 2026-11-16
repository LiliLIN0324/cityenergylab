export async function onRequestGet() {
  return new Response(JSON.stringify({
    service: 'CITY ENERGY LAB API',
    version: '1.0.0',
    endpoints: [
      'GET /api/lab-info',
      'GET /api/members',
      'GET /api/publications?year=2025&q=keyword&limit=50',
      'GET /api/news?limit=20',
      'GET /api/research',
      'GET /api/projects',
      'GET /api/courses',
      'GET /api/pages',
      'POST /api/contact  { name, email, subject, message }'
    ]
  }, null, 2), { headers: { 'content-type': 'application/json; charset=utf-8' } });
}
