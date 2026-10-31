import { voices } from '../state/voices';
import { playAudio } from '../platform/audio';

/** Plays a recorded line (D35) if it has one. */
export function sayLine(key: string) {
  const url = voices.get()[key];
  if (url) playAudio(url);
}
