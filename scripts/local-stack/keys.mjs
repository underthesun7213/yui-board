// Local-only JWT secret and the anon / service keys derived from it (HS256),
// the way a self-hosted Supabase signs them. Never used outside this machine.
import { createHmac } from 'node:crypto';

export const JWT_SECRET = 'yunabi-local-only-jwt-secret-at-least-32-chars';
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
export function sign(payload, secret = JWT_SECRET) {
  const head = b64({ alg: 'HS256', typ: 'JWT' });
  const body = b64(payload);
  const sig = createHmac('sha256', secret).update(`${head}.${body}`).digest('base64url');
  return `${head}.${body}.${sig}`;
}
const exp = Math.floor(Date.UTC(2036, 0, 1) / 1000);
export const ANON_KEY = sign({ iss: 'supabase-local', role: 'anon', exp });
export const SERVICE_KEY = sign({ iss: 'supabase-local', role: 'service_role', exp });

if (process.argv[2] === 'print')
  console.log(JSON.stringify({ JWT_SECRET, ANON_KEY, SERVICE_KEY }, null, 2));
