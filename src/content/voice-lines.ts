import type { Achievement, Ending, L3, Lesson, Route, VnRoute, VnSay, Who } from './types';

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
  /* the player: a woman with Yuki in Osaka, a man with Ayano in Kyoto */
  player: 'ja-JP-ShioriNeural',
  playerKyoto: 'ja-JP-DaichiNeural',
  /* shop staff in the game (the kushikatsu shop) */
  staff: 'ja-JP-KeitaNeural',
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
/** what someone says back to reply k of scene i, line j */
export const replyVoiceKey = (route: string, i: number, k: number, j: number) =>
  `vn/${route}/${nn(i)}-${k + 1}r${j + 1}`;
/** further lines of scene i before its choice */
export const moreVoiceKey = (route: string, i: number, j: number) =>
  `vn/${route}/${nn(i)}m${j + 1}`;
/** the friend's line after the smart-ball match */
export const ballVoiceKey = (route: string, i: number, result: 'win' | 'lose') =>
  `vn/${route}/${nn(i)}${result}`;
export const achievementVoiceKey = (id: string) => `achievements/${id}`;
export const yukiVoiceKey = (name: string) => `minigames/yuki/${name}`;
export const sbVoiceKey = (name: string) => `minigames/smartball/${name}`;

export function voiceLines(
  lessons: readonly Lesson[],
  vn: Record<Route, VnRoute>,
  endings: readonly Ending[],
  achievements: readonly Achievement[] = [],
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
      const by = (l: VnSay) => (l.who === 'staff' ? VOICES.staff : VOICES[route]);
      sc.more?.forEach((l, j) =>
        out.push({ key: moreVoiceKey(route, i, j), text: l.jp, voice: by(l) }),
      );
      sc.opts.forEach((o, k) => {
        out.push({
          key: optVoiceKey(route, i, k),
          text: o.jp,
          voice: route === 'kyoto' ? VOICES.playerKyoto : VOICES.player,
        });
        o.reply?.forEach((l, j) =>
          out.push({ key: replyVoiceKey(route, i, k, j), text: l.jp, voice: by(l) }),
        );
      });
      for (const result of ['win', 'lose'] as const) {
        const text = sc[result];
        if (text) out.push({ key: ballVoiceKey(route, i, result), text, voice: VOICES[route] });
      }
    });
  for (const a of achievements)
    out.push({ key: achievementVoiceKey(a.id), text: a.jp, voice: VOICES[a.route] });
  for (const e of endings)
    out.push({
      key: endingVoiceKey(e.id),
      text: e.jp,
      voice: e.route === 'both' ? VOICES.narrator : VOICES[e.route],
    });
  return out;
}

/* The two mini-games' lines. They are listed here for the generator; the
   app adds them to its voice map from the games' own chunks (addVoices). */
interface GameLine {
  jp: string;
  mean: L3;
}
interface GameTalk {
  who: 'yuki' | 'staff' | 'me' | null;
  line: GameLine | null;
  opts: { jp: string }[];
}
export function yukiVoiceLines(
  talk: Record<string, GameTalk>,
  lines: Record<string, GameLine>,
): VoiceLine[] {
  const out: VoiceLine[] = [];
  const speaker = { yuki: VOICES.osaka, staff: VOICES.staff, me: VOICES.player };
  for (const [name, t] of Object.entries(talk)) {
    if (t.who && t.line)
      out.push({ key: yukiVoiceKey(name), text: t.line.jp, voice: speaker[t.who] });
    t.opts.forEach((o, k) =>
      out.push({ key: yukiVoiceKey(`${name}-${k + 1}`), text: o.jp, voice: VOICES.player }),
    );
  }
  /* the shop's goodbye is the staff's; the rest are Yuki's */
  for (const [name, l] of Object.entries(lines))
    out.push({
      key: yukiVoiceKey(name),
      text: l.jp,
      voice: name === 'end' ? VOICES.staff : VOICES.osaka,
    });
  return out;
}
/* Kyoto's two mini-games: Ayano's lines (and the shop staff's) at the matcha
   table, and hers at the fireworks photo. */
export const mtVoiceKey = (name: string) => `minigames/matcha/${name}`;
export const phVoiceKey = (name: string) => `minigames/photo/${name}`;
export function mtVoiceLines(
  lines: Record<string, { who: 'ayano' | 'staff'; jp: string }>,
  opts: Record<string, { reply: string }[]>,
  fb: Record<string, { say?: string }>,
  tools: Record<string, { ja: string }>,
): VoiceLine[] {
  const out: VoiceLine[] = [];
  for (const [name, l] of Object.entries(lines))
    out.push({
      key: mtVoiceKey(name),
      text: l.jp,
      voice: l.who === 'staff' ? VOICES.staff : VOICES.kyoto,
    });
  for (const [k, list] of Object.entries(opts))
    list.forEach((o, i) =>
      out.push({ key: mtVoiceKey(`${k}-${i + 1}r`), text: o.reply, voice: VOICES.kyoto }),
    );
  for (const [k, f] of Object.entries(fb))
    if (f.say) out.push({ key: mtVoiceKey(`fb-${k}`), text: f.say, voice: VOICES.kyoto });
  /* a wrong tool tapped: she names the one that was */
  for (const [k, t] of Object.entries(tools))
    out.push({ key: mtWrongToolKey(k), text: mtWrongTool(t.ja), voice: VOICES.kyoto });
  return out;
}
export const mtWrongToolKey = (tool: string) => mtVoiceKey(`fb-toolWrong-${tool}`);
export const mtWrongTool = (ja: string) => `それは${ja}どすえ。`;
export function phVoiceLines(
  open: Record<string, { jp: string }>,
  last: { jp: string },
  fb: Record<string, { say: string }>,
): VoiceLine[] {
  return [
    ...Object.entries(open).map(([k, l]) => ({
      key: phVoiceKey(`open-${k}`),
      text: l.jp,
      voice: VOICES.kyoto,
    })),
    { key: phVoiceKey('last'), text: last.jp, voice: VOICES.kyoto },
    ...Object.entries(fb).map(([k, f]) => ({
      key: phVoiceKey(`fb-${k}`),
      text: f.say,
      voice: VOICES.kyoto,
    })),
  ];
}
export function sbVoiceLines(lines: Record<string, { jp: string }>): VoiceLine[] {
  return Object.entries(lines).map(([name, l]) => ({
    key: sbVoiceKey(name),
    text: l.jp,
    voice: VOICES.osaka,
  }));
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
