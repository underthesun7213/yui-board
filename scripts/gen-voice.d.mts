import type { VoiceLine } from '../src/content/voice-lines';

/** Types for the unit test of the voice generator's SSML. */
export function toSsml(line: Pick<VoiceLine, 'text' | 'voice'>): string;
