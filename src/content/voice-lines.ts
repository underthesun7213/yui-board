import type { Ending, Lesson, Route, VnRoute, Who } from './types';

/* Every Japanese line that has a voice (D35), with the Azure neural voice that
   reads it. scripts/gen-voice.mjs makes one file per line from this list, and
   the app plays a file only while its line is unchanged (voiceHash). Only type
   imports here, so the generator can load this file on its own. */

export interface VoiceLine {
  key: string;
  /** Furigana markup kept: the generator turns readings into SSML <sub>. */
  text: string;
  voice: string;
}

/** The student of each comic level (D36): a woman or a man. */
const STUDENT: Record<string, 'f' | 'm'> = {
  l1: 'f',
  l2: 'm',
  l3: 'f',
  l4: 'm',
  l5: 'f',
  l6: 'f',
  l7: 'm',
};
const VOICES = {
  meF: 'ja-JP-ShioriNeural',
  meM: 'ja-JP-DaichiNeural',
  f: 'ja-JP-NanamiNeural',
  m: 'ja-JP-KeitaNeural',
  m2: 'ja-JP-NaokiNeural',
  narrator: 'ja-JP-AoiNeural',
  osaka: 'ja-JP-NaokiNeural',
  kyoto: 'ja-JP-MayuNeural',
  player: 'ja-JP-ShioriNeural',
};
const panelVoice = (lid: string, who: Who) =>
  who === 'me' ? (STUDENT[lid] === 'm' ? VOICES.meM : VOICES.meF) : VOICES[who];

const nn = (i: number) => String(i + 1).padStart(2, '0');
export const panelVoiceKey = (lid: string, page: number, i: number) =>
  `lessons/${lid}/p${page}-${i + 1}`;
export const capVoiceKey = (lid: string, page: number, i: number) =>
  `lessons/${lid}/p${page}-${i + 1}c`;
export const exVoiceKey = (lid: string, i: number) => `lessons/${lid}/ex${i + 1}`;
export const sceneVoiceKey = (route: string, i: number) => `vn/${route}/${nn(i)}`;
export const optVoiceKey = (route: string, i: number, k: number) => `vn/${route}/${nn(i)}-${k + 1}`;
export const endingVoiceKey = (id: string) => `endings/${id}`;

export function voiceLines(
  lessons: readonly Lesson[],
  vn: Record<Route, VnRoute>,
  endings: readonly Ending[],
): VoiceLine[] {
  const out: VoiceLine[] = [];
  for (const l of lessons) {
    if (!l.vn)
      l.pages.forEach((page, pi) =>
        page.panels.forEach((p, i) => {
          if (p.cap)
            out.push({ key: capVoiceKey(l.id, pi + 1, i), text: p.cap, voice: VOICES.narrator });
          if (p.jp && p.who)
            out.push({
              key: panelVoiceKey(l.id, pi + 1, i),
              text: p.jp,
              voice: panelVoice(l.id, p.who),
            });
        }),
      );
    l.ex.forEach((e, i) =>
      out.push({ key: exVoiceKey(l.id, i), text: e.jp, voice: VOICES.narrator }),
    );
  }
  for (const [route, r] of Object.entries(vn) as [Route, VnRoute][])
    r.scenes.forEach((sc, i) => {
      /* scenes without a line (the mini-games) have nothing to record */
      if (sc.jp) out.push({ key: sceneVoiceKey(route, i), text: sc.jp, voice: VOICES[route] });
      sc.opts.forEach((o, k) =>
        out.push({ key: optVoiceKey(route, i, k), text: o.jp, voice: VOICES.player }),
      );
    });
  for (const e of endings)
    out.push({
      key: endingVoiceKey(e.id),
      text: e.jp,
      voice: e.route === 'both' ? VOICES.narrator : VOICES[e.route],
    });
  return out;
}

/** FNV-1a over voice and text: a recorded file is played only while this
    still matches the hash it was made from (src/voice/manifest.json). */
export function voiceHash(line: Pick<VoiceLine, 'text' | 'voice'>): string {
  let h = 0x811c9dc5;
  const s = line.voice + '\n' + line.text;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}
