import manifest from '../voice/manifest.json';
import { ENDINGS } from './endings';
import { LESSONS } from './lessons';
import { VN } from './vn';
import { voiceHash, voiceLines } from './voice-lines';

/* Recorded lines (D35) that exist at build time: src/voice/<key>.mp3, made by
   scripts/gen-voice.mjs. A file is used only while the hash it was made from
   (manifest.json) still matches its line, so an edited line loses its play
   button until it is recorded again rather than playing the old words. */
const files = import.meta.glob<string>('/src/voice/**/*.mp3', {
  eager: true,
  query: '?url',
  import: 'default',
});
const made: Record<string, string> = manifest;

export const VOICE: Record<string, string> = {};
for (const line of voiceLines(LESSONS, VN, ENDINGS)) {
  const url = files[`/src/voice/${line.key}.mp3`];
  if (url && made[line.key] === voiceHash(line)) VOICE[line.key] = url;
}
