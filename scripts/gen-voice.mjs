// Records every Japanese line of the comics, the expressions and the game
// (D35) with Azure AI Speech neural voices into src/voice/<key>.mp3, and keeps
// src/voice/manifest.json: the hash each file was made from. Lines already
// recorded and unchanged are skipped, so a run after an edit records only the
// edited lines; files for lines that no longer exist are removed.
//
//   $env:AZURE_SPEECH_KEY = Read-Host 'Speech key'      # never in the repo
//   $env:AZURE_SPEECH_REGION = 'japaneast'
//   node scripts/gen-voice.mjs --dry-run                 # what would be recorded
//   node scripts/gen-voice.mjs
//
// Readings come from the furigana markup ({漢字|かんじ} → <sub alias>), so a
// kanji is read the way the app shows it.
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { load } from './gen-comic-scripts.mjs';

const root = (p) => fileURLToPath(new URL(`../${p}`, import.meta.url));
const DIR = root('src/voice');
const MANIFEST = join(DIR, 'manifest.json');

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** SSML for one line: furigana become <sub alias>, a little slower than
    conversation speed for learners. */
export function toSsml(line) {
  const body = line.text
    .split(/(\{[^|{}]+\|[^|{}]+\})/)
    .map((part) => {
      const m = part.match(/^\{([^|{}]+)\|([^|{}]+)\}$/);
      return m ? `<sub alias="${esc(m[2])}">${esc(m[1])}</sub>` : esc(part);
    })
    .join('');
  return (
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ja-JP">` +
    `<voice name="${line.voice}"><prosody rate="-10%">${body}</prosody></voice></speak>`
  );
}

async function speak(ssml, key, region) {
  for (let attempt = 1; ; attempt++) {
    const r = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'yunabi-gen-voice',
      },
      body: ssml,
    });
    if (r.ok) return Buffer.from(await r.arrayBuffer());
    if (r.status === 429 && attempt < 6) {
      await new Promise((ok) => setTimeout(ok, 2000 * attempt));
      continue;
    }
    throw new Error(`Azure Speech answered ${r.status} ${r.statusText}`);
  }
}

const mp3s = (dir) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
        d.isDirectory()
          ? mp3s(join(dir, d.name))
          : d.name.endsWith('.mp3')
            ? [join(dir, d.name)]
            : [],
      )
    : [];

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dry = process.argv.includes('--dry-run');
  const { LESSONS } = await load('src/content/lessons.ts');
  const { VN } = await load('src/content/vn.ts');
  const { ENDINGS } = await load('src/content/endings.ts');
  const { ACHIEVEMENTS } = await load('src/content/achievements.ts');
  const { TALK, LINES } = await load('src/content/yuki-minigame.ts');
  const { SB_LINES } = await load('src/content/smartball.ts');
  const { voiceLines, voiceHash, yukiVoiceLines, sbVoiceLines } = await load(
    'src/content/voice-lines.ts',
  );
  const lines = [
    ...voiceLines(LESSONS, VN, ENDINGS, ACHIEVEMENTS),
    ...yukiVoiceLines(TALK, LINES),
    ...sbVoiceLines(SB_LINES),
  ];
  const made = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
  const file = (k) => join(DIR, `${k}.mp3`);
  const todo = lines.filter((l) => made[l.key] !== voiceHash(l) || !existsSync(file(l.key)));
  const keys = new Set(lines.map((l) => l.key));
  const orphans = mp3s(DIR).filter(
    (f) =>
      !keys.has(
        relative(DIR, f)
          .replace(/\\/g, '/')
          .replace(/\.mp3$/, ''),
      ),
  );
  const chars = todo.reduce((n, l) => n + toSsml(l).length, 0);
  console.log(
    `${lines.length} lines, ${todo.length} to record (${chars} characters of SSML), ${orphans.length} to remove`,
  );
  if (dry) process.exit(0);

  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION || 'japaneast';
  if (todo.length && !key) {
    console.error('Set AZURE_SPEECH_KEY (and AZURE_SPEECH_REGION) first.');
    process.exit(1);
  }
  const save = () =>
    writeFileSync(
      MANIFEST,
      JSON.stringify(Object.fromEntries(Object.entries(made).sort()), null, 2) + '\n',
    );
  for (const f of orphans) {
    rmSync(f);
    delete made[
      relative(DIR, f)
        .replace(/\\/g, '/')
        .replace(/\.mp3$/, '')
    ];
  }
  for (const k of Object.keys(made)) if (!keys.has(k)) delete made[k];
  let n = 0;
  for (const l of todo) {
    const out = file(l.key);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, await speak(toSsml(l), key, region));
    made[l.key] = voiceHash(l);
    save();
    if (++n % 20 === 0) console.log(`  ${n}/${todo.length}`);
  }
  save();
  console.log(`recorded ${n}, removed ${orphans.length}`);
}
