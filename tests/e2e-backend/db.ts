/* psql against the local stack for test setup and checks. The SQL goes on
   standard input and values only as psql variables (:'name'), so nothing is
   spliced into SQL text and no shell is involved. Variables are expanded only
   in input read from stdin or a file, never in -c, hence `input`. */
import { execFileSync } from 'node:child_process';

/** SQL on stdin; values only as psql variables (:'name'), never spliced into the SQL. */
export function psql(sql: string, vars: Record<string, string> = {}): string {
  const args = ['-X', '-q', '-t', '-A', '-v', 'ON_ERROR_STOP=1'];
  args.push('-h', '127.0.0.1', '-p', '54322', '-U', 'postgres', '-d', 'postgres');
  for (const [k, v] of Object.entries(vars)) args.push('-v', `${k}=${v}`);
  return execFileSync('psql', args, { input: sql }).toString().trim();
}
