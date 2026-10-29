import { VOICE } from '../content/voice-files';
import { playAudio } from '../platform/audio';

/** Plays a recorded line (D35) if it has one. */
export function sayLine(key: string) {
  const url = VOICE[key];
  if (url) playAudio(url);
}
