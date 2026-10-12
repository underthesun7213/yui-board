import { execSync } from 'node:child_process';

/* A fresh database with the fixture seed for every run. */
export default function setup() {
  execSync('scripts/local-stack/start.sh --seed', { stdio: 'inherit' });
}
