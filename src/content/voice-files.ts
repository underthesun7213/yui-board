import { voices } from '../state/voices';
import type { VoiceLine } from './voice-lines';

/* Which lines have a recorded file (D35). Screens add their lines here:
   content/voice.ts the lessons' and episode 8's, each mini-game its own from
   its chunk. The files and their hashes are looked up in voice-map.ts, loaded
   on the first call, and the lines found go to the `voices` store, so a play
   button appears a moment after its screen. */
let waiting: VoiceLine[] = [];
let map: Promise<typeof import('./voice-map')> | null = null;

export function addVoices(lines: readonly VoiceLine[]) {
  waiting.push(...lines);
  map ??= import('./voice-map');
  void map.then(({ recorded }) => {
    if (!waiting.length) return;
    const found = recorded(waiting);
    waiting = [];
    voices.set(found);
  });
}
