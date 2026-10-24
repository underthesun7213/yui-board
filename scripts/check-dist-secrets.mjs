// Fails when a build carries a secret: Supabase secret keys, a service_role
// JWT, or common private key markers (Y-S2). Publishable keys are fine.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIR = process.argv[2] ?? 'dist';
const bad = [];
const walk = (d) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(js|html|css|json|webmanifest|txt|map)$/.test(f)) check(p, readFileSync(p, 'utf8'));
  }
};
function check(p, s) {
  if (/sb_secret_[A-Za-z0-9_-]{10,}/.test(s)) bad.push(`${p}: Supabase secret key`);
  if (/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(s)) bad.push(`${p}: private key`);
  for (const jwt of s.match(/eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+/g) ??
    []) {
    try {
      const claims = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString());
      if (claims.role === 'service_role') bad.push(`${p}: service_role JWT`);
    } catch {
      /* not a JWT */
    }
  }
}
walk(DIR);
if (bad.length) {
  console.error('secrets in the build:\n' + bad.join('\n'));
  process.exit(1);
}
console.log(`✓ no secrets in ${DIR}/`);
