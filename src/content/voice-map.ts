import manifest from '../voice/manifest.json';
import { voiceHash, type VoiceLine } from './voice-lines';

/* Recorded lines (D35) that exist at build time: src/voice/<key>.mp3, made by
   scripts/gen-voice.mjs, and the hash each was made from (manifest.json). A
   chunk of its own, loaded the first time a screen asks for its lines
   (voice-files.ts): one entry per recorded line, so it grows with the content
   and stays out of the screens' budgets. */
const files = import.meta.glob<string>('/src/voice/**/*.mp3', {
  eager: true,
  query: '?url',
  import: 'default',
});
const made: Record<string, string> = manifest;

/** the file of each of these lines, for those recorded and unchanged since:
    an edited line has none until it is recorded again, rather than playing
    the old words */
export function recorded(lines: readonly VoiceLine[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of lines) {
    const url = files[`/src/voice/${line.key}.mp3`];
    if (url && made[line.key] === voiceHash(line)) out[line.key] = url;
  }
  return out;
}
