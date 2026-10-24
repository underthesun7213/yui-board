// Stands in for Supabase's API gateway on one port:
//   /auth/v1/*  → Supabase Auth      /rest/v1/*  → PostgREST
// Like the real gateway it appends the caller's address to X-Forwarded-For,
// so the IP rate limit can be tested (a client-sent value stays on the left).
import http from 'node:http';

const PORT = +(process.env.GATEWAY_PORT ?? 54321);
const ROUTES = [
  ['/auth/v1', +(process.env.AUTH_PORT ?? 54329)],
  ['/rest/v1', +(process.env.REST_PORT ?? 54330)],
];
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers':
    'authorization, apikey, content-type, prefer, range, x-client-info, accept-profile, content-profile, x-supabase-api-version',
  'access-control-allow-methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
  'access-control-expose-headers': 'content-range, x-total-count',
};

http
  .createServer((req, res) => {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, CORS).end();
      return;
    }
    const hit = ROUTES.find(
      ([p]) => req.url === p || req.url.startsWith(p + '/') || req.url.startsWith(p + '?'),
    );
    if (!hit) {
      res.writeHead(404, CORS).end('{"message":"no route"}');
      return;
    }
    const [prefix, port] = hit;
    const peer = (req.socket.remoteAddress ?? '').replace(/^::ffff:/, '');
    /* tests can play a different client address */
    const client =
      process.env.GATEWAY_TRUST_TEST_IP && req.headers['x-test-client-ip']
        ? String(req.headers['x-test-client-ip'])
        : peer;
    const xff = req.headers['x-forwarded-for']
      ? `${req.headers['x-forwarded-for']}, ${client}`
      : client;
    const headers = { ...req.headers, 'x-forwarded-for': xff, host: `127.0.0.1:${port}` };
    delete headers['x-test-client-ip'];
    const up = http.request(
      {
        host: '127.0.0.1',
        port,
        path: req.url.slice(prefix.length) || '/',
        method: req.method,
        headers,
      },
      (r) => {
        res.writeHead(r.statusCode ?? 502, { ...r.headers, ...CORS });
        r.pipe(res);
      },
    );
    up.on('error', () => res.writeHead(502, CORS).end('{"message":"upstream down"}'));
    req.pipe(up);
  })
  .listen(PORT, '127.0.0.1', () => console.log(`gateway on http://127.0.0.1:${PORT}`));
