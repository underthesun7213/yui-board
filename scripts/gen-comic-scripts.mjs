// Writes docs/06-design/comic-scripts.md from src/content/lessons.ts, and
// docs/06-design/game-script.md from src/content/vn.ts and endings.ts: the
// scripts the owner reviews and draws from (Y-J1, Y-J3). The content files are
// the source; run this after changing them (`node scripts/gen-comic-scripts.mjs`).
// tests/unit/domain.test.ts fails when a document is out of date.
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/* paths from the repository root, wherever the script is run from */
const root = (p) => fileURLToPath(new URL(`../${p}`, import.meta.url));
export const OUT = 'docs/06-design/comic-scripts.md';
export const GAME_OUT = 'docs/06-design/game-script.md';
export const PROMPTS_OUT = 'docs/06-design/image-prompts.md';
const cell = (s) => (s ? String(s).replace(/\|/g, '\\|') : '—');
/* furigana markup {漢字|かんじ} (src/content/ruby.ts): the plain text as the
   artwork shows it, and a reading form for review, 漢字(かんじ) */
const RUBY = /\{([^|{}]+)\|([^|{}]+)\}/g;
const plain = (s) => s && s.replace(RUBY, '$1');
const read = (s) => s && s.replace(RUBY, '$1($2)');

/** The document for these lessons (comic levels only). */
export function renderComicScripts(lessons) {
  const out = [
    '# 만화 콘티 대본 (레벨 1~7)',
    '',
    '> **생성 문서 — 고치지 말 것.** `src/content/lessons.ts` 에서 `node scripts/gen-comic-scripts.mjs` 로 만든다. 대사를 바꾸려면 lessons.ts 를 고치고 다시 생성한다.',
    '',
    '## 파일 규칙 (Y-J3)',
    '',
    '- 레벨마다 2쪽: `src/art/lessons/<레벨 id>/p1`, `p2` — `.webp`·`.png`·`.jpg` 중 하나(한 쪽에 파일 하나).',
    '- **세로 2:3**(오차 1%), 짧은 변 **1000px 이상**, 한 장 **400KB 이하**(넘으면 webp 로). 맞지 않으면 단위 시험이 실패한다.',
    '- 말풍선 글자 = 아래 표의 **말풍선**과 글자까지 같게. 네모 상자(내레이션) = **내레이션** — 괄호 없이.',
    '- **읽기** = 앱이 그림 아래 대사에 다는 후리가나(한자 뒤 괄호). 그림에는 넣지 않아도 된다.',
    '- 칸 나누기와 배치는 책임자의 콘티대로. 칸 번호는 읽는 순서(일본 만화식: 오른쪽→왼쪽, 위→아래)이고, 앱은 그림 아래에 그 순서로 대사와 번역을 보여 준다.',
    '- 그림 생성기(Gemini 등)가 일본어 글자를 틀리게 그리면, 그림만 만들고 글자는 편집기에서 넣는 것을 권한다.',
    '- 확인: 그림을 넣은 뒤 표의 **대조** 칸에 표시.',
    '',
  ];
  for (const l of lessons) {
    if (l.vn) continue;
    out.push(`## 레벨 ${l.lv} · ${l.t.ja} / ${l.t.ko} (\`${l.id}\`)`, '', `${l.d.ko}`, '');
    l.pages.forEach((page, pi) => {
      out.push(
        `### ${pi + 1}쪽 — \`src/art/lessons/${l.id}/p${pi + 1}\``,
        '',
        '| 칸 | 장면 메모 | 내레이션 | 말풍선 | 읽기 | 번역(ko) | 대조 |',
        '|---|---|---|---|---|---|---|',
      );
      page.panels.forEach((p, i) => {
        const rd = [p.cap, p.jp].filter(Boolean).map(read).join(' / ');
        out.push(
          `| ${i + 1} | ${cell(p.s)} | ${cell(plain(p.cap))} | ${cell(plain(p.jp))} | ${cell(rd)} | ${cell(p.tr.ko)} | [ ] |`,
        );
      });
      out.push('');
    });
  }
  return out.join('\n');
}

/** The document for episode 8: every scene with its line and choices (and the
    feedback each choice gets), then the ending cards. */
export function renderGameScript(vn, endings, bestMisses) {
  const out = [
    '# 대화 게임 대본 (레벨 8)',
    '',
    '> **생성 문서 — 고치지 말 것.** `src/content/vn.ts`·`endings.ts` 에서 `node scripts/gen-comic-scripts.mjs` 로 만든다. 대사를 바꾸려면 그 파일을 고치고 다시 생성한다.',
    '',
    '## 그림 규칙 (Y-J3)',
    '',
    '- 장면: `src/art/vn/<친구>/<nn>` — **가로 4:3**. 엔딩 카드: `src/art/endings/<id>` — **가로 3:2**. `.webp`·`.png`·`.jpg`, 한 장 400KB 이하 권장.',
    '- 그림에는 글자를 넣지 않는다. 대사와 선택지는 앱이 그림 아래에 보여 준다.',
    '- ○ = 자연스러운 답(점수), × = 어색한 답. 피드백은 고른 뒤에 보인다.',
    '- 한자 뒤 괄호 = 앱이 다는 후리가나.',
    `- 엔딩: 놓친 선택이 ${bestMisses}개 이하면 좋은 엔딩, 그보다 많으면 보통 엔딩. 두 친구의 엔딩을 하나씩 모으면 \`e_both\`.`,
    '',
  ];
  for (const [route, r] of Object.entries(vn)) {
    out.push(`## ${r.name.ko} — \`${route}\``, '', r.blurb.ko, '');
    r.scenes.forEach((sc, i) => {
      out.push(
        `### 장면 ${i + 1} — \`src/art/vn/${route}/${String(i + 1).padStart(2, '0')}\``,
        '',
        `- 장면 메모: ${sc.s}`,
        `- 대사: **${read(sc.jp)}**`,
        '',
        '| 선택지 | | 피드백(ko) |',
        '|---|---|---|',
      );
      for (const o of sc.opts)
        out.push(`| ${cell(read(o.jp))} | ${o.ok ? '○' : '×'} | ${cell(o.fb.ko)} |`);
      out.push('');
    });
  }
  out.push(
    '## 엔딩 카드',
    '',
    '| id | 친구 | 종류 | 제목 | 대사 | 장면 메모 | 설명(ko) |',
    '|---|---|---|---|---|---|---|',
  );
  for (const e of endings) {
    const kind = e.route === 'both' ? '수집' : e.best ? '좋음' : '보통';
    out.push(
      `| \`${e.id}\` | ${e.route} | ${kind} | ${cell(e.t.ko)} | ${cell(read(e.jp))} | ${cell(e.s)} | ${cell(e.n.ko)} |`,
    );
  }
  return out.join('\n');
}

/* The art direction every prompt starts with, set by the owner's reference
   pictures in docs/06-design/characters/ (2026-10-27, Gemini). */
const REFS = 'docs/06-design/characters/';
const STYLE =
  'Style: match the attached reference pictures. Korean-webtoon anime illustration, clean dark line art, soft painterly cel shading, muted natural colours, natural proportions (not chibi). Everyday places in Kansai, Japan, drawn as they really look, with detailed backgrounds.';
/* Each person: who they are (face, hair, manner — the same in every picture),
   the pictures to attach, the pronoun, and what they wear. Clothes change
   with the day: one outfit for a whole game route (one day out), another for
   the comics; Ayano's kimono is in the reference for her face only. */
const CAST = {
  james: {
    look: 'James: an American exchange student, about 20, short wavy light-brown hair, friendly open face.',
    attach: `${REFS}james-sheet`,
    he: 'he',
    wear: { comic: 'navy hoodie over a white T-shirt, dark jeans, grey backpack' },
  },
  you: {
    look: 'The player: a female exchange student, about 20, shoulder-length dark hair in a low ponytail. Shown only from behind or from the side, face never shown.',
    attach: `${REFS}player-sheet`,
    he: 'she',
    wear: { game: 'beige coat, small cross-body bag' },
  },
  osaka: {
    look: 'Yuki (Osaka, face and hair as in the reference): a young man, about 20, curly ash-blond hair with dark roots, warm brown eyes; loud, quick, laughs easily.',
    attach: `${REFS}yuki-front.webp, ${REFS}yuki-back-laugh.webp`,
    he: 'he',
    wear: {
      game: 'olive-green zip jacket over a black and white layered T-shirt, thin gold chain, loose grey jeans, black boots (as in the reference)',
      comic: 'oversized black hoodie, light-wash jeans, white sneakers',
    },
  },
  kyoto: {
    look: 'Ayano (Kyoto, face and hair as in the reference — not the kimono): a young woman, about 20, dark brown hair in a low bun with straight bangs, a small red hair ornament; quiet, graceful, small gestures.',
    attach: `${REFS}ayano-front.webp, ${REFS}ayano-pose.webp`,
    he: 'she',
    wear: {
      game: 'everyday clothes: cream knit sweater, long navy pleated skirt, beige trench coat, small leather shoulder bag, loafers',
      comic: 'everyday clothes: white blouse, soft grey cardigan, long camel skirt',
    },
  },
};
/** The person as drawn in one kind of picture ('comic' or 'game'). */
const person = (k, where) => `${CAST[k].look} Wearing: ${CAST[k].wear[where]}.`;
/* comic levels where the game's two friends appear too (level 6: the izakaya
   party of three) */
const FRIENDS_IN = new Set(['l6']);

/** Prompts to paste into Gemini, one per picture: the two sheets still to
    make, then each comic page, game scene and ending card, built from the
    scene notes and lines so they stay in step with the content. */
export function renderImagePrompts(lessons, vn, endings) {
  const block = (lines) => ['```text', ...lines, '```', ''];
  const attach = (keys) => 'Attach: ' + keys.map((k) => CAST[k].attach).join(', ') + '.';
  const out = [
    '# 그림 생성 프롬프트 (Gemini)',
    '',
    '> **생성 문서 — 고치지 말 것.** 대본(`lessons.ts`·`vn.ts`·`endings.ts`)과 `scripts/gen-comic-scripts.mjs` 의 그림체·인물 설정에서 만든다. 대사나 장면 메모를 바꾸면 다시 생성한다.',
    '',
    '## 순서',
    '',
    '1. 기준 그림: 유우키·아야노와 그림체는 `docs/06-design/characters/` 의 책임자 그림이다. **제임스와 플레이어 시트 2장**만 먼저 만들어 같은 폴더에 `james-sheet`·`player-sheet` 로 저장한다(아래 "인물").',
    '2. 그림마다 새 대화에서 프롬프트를 붙여 넣고, **첫 줄 `Attach:` 의 그림을 함께 첨부**한다.',
    '3. 만화의 일본어 글자가 틀리면 같은 프롬프트 끝에 `Leave every speech balloon and caption box empty.` 를 붙여 다시 만들고, 글자는 편집기에서 넣는다(글자는 대본의 **말풍선**과 똑같이).',
    '4. 저장: 만화 `src/art/lessons/<id>/p1`·`p2`(세로 2:3, 짧은 변 1000px 이상, 400KB 이하), 게임 `src/art/vn/<친구>/<nn>`(가로 4:3), 엔딩 `src/art/endings/<id>`(가로 3:2). `.webp`·`.png`·`.jpg`. 크기·이름은 맞추지 못해도 파일을 주면 맞춰 넣는다.',
    '',
    '## 인물',
    '',
  ];
  for (const [k, where, name] of [
    ['james', 'comic', '제임스 (만화 레벨 1~7 의 학생) → `james-sheet`'],
    ['you', 'game', '플레이어 (게임, 뒷모습만) → `player-sheet`'],
  ]) {
    out.push(`### ${name}`, '');
    out.push(
      ...block([
        `Attach: ${REFS}yuki-front.webp (for the style only).`,
        STYLE,
        person(k, where),
        'Make a character reference sheet on a plain light-grey background: the same person front, three-quarter and back view, full body, plus three head shots (smiling, surprised, thinking). No text.',
      ]),
    );
  }

  out.push('## 만화 (레벨 1~7)', '');
  for (const l of lessons) {
    if (l.vn) continue;
    const cast = FRIENDS_IN.has(l.id) ? ['james', 'osaka', 'kyoto'] : ['james'];
    l.pages.forEach((page, pi) => {
      out.push(
        `### 레벨 ${l.lv} ${l.t.ko} — ${pi + 1}쪽 → \`src/art/lessons/${l.id}/p${pi + 1}\``,
        '',
      );
      const lines = [
        attach(cast),
        STYLE,
        ...cast.map((k) => person(k, 'comic')),
        'James is "the student" below.' +
          (cast.length > 1 ? ' Yuki and Ayano are his friends, the rest of his party.' : ''),
        'One vertical comic page, aspect ratio 2:3. Four panels in a 2×2 grid with thin white gutters, read in Japanese order: panel 1 top right, panel 2 top left, panel 3 bottom right, panel 4 bottom left.',
      ];
      page.panels.forEach((p, i) => {
        let t = `Panel ${i + 1}: ${p.s}.`;
        if (p.cap) t += ` Rectangular caption box, Japanese text exactly: ${plain(p.cap)}`;
        if (p.jp)
          t += ` Speech balloon from the person speaking, Japanese text exactly: 「${plain(p.jp)}」`;
        lines.push(t);
      });
      lines.push(
        'Write the Japanese exactly as given, horizontally or vertically, nothing else: no other text, sound effects, panel numbers or signature.',
      );
      out.push(...block(lines));
    });
  }

  out.push('## 게임 장면 (레벨 8)', '');
  for (const [route, r] of Object.entries(vn)) {
    const name = route === 'osaka' ? 'Yuki' : 'Ayano';
    r.scenes.forEach((sc, i) => {
      out.push(
        `### ${r.name.ko} 장면 ${i + 1} → \`src/art/vn/${route}/${String(i + 1).padStart(2, '0')}\``,
        '',
      );
      out.push(
        ...block([
          attach([route, 'you']),
          STYLE,
          person(route, 'game'),
          person('you', 'game'),
          `One horizontal illustration, aspect ratio 4:3, seen from the player's point of view: ${name} faces the viewer; if the player appears, only from behind. ${sc.s}.`,
          `Mood of the moment (do not write it): ${CAST[route].he} has just said 「${plain(sc.jp)}」`,
          'No text, no speech balloons.',
        ]),
      );
    });
  }

  out.push('## 엔딩 카드', '');
  for (const e of endings) {
    const who = e.route === 'both' ? ['osaka', 'kyoto'] : [e.route];
    out.push(`### ${e.t.ko} → \`src/art/endings/${e.id}\``, '');
    out.push(
      ...block([
        attach([...who, 'you']),
        STYLE,
        ...who.map((k) => person(k, 'game')),
        person('you', 'game'),
        `One horizontal illustration, aspect ratio 3:2, a memorable closing shot: ${e.s}. The player only from behind or the side.`,
        'No text, no speech balloons.',
      ]),
    );
  }
  return out.join('\n');
}

/* Reads a content file with the TypeScript already in devDependencies (these
   files have only type imports), so no new tool is needed and Node 20 works. */
async function load(path) {
  const ts = (await import('typescript')).default;
  const src = readFileSync(root(path), 'utf8');
  const js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const dir = mkdtempSync(join(tmpdir(), 'yunabi-'));
  const file = join(dir, 'content.mjs');
  writeFileSync(file, js);
  try {
    return await import(pathToFileURL(file).href);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { LESSONS } = await load('src/content/lessons.ts');
  writeFileSync(root(OUT), renderComicScripts(LESSONS) + '\n');
  console.log(`wrote ${OUT}`);
  const { VN, BEST_MISSES } = await load('src/content/vn.ts');
  const { ENDINGS } = await load('src/content/endings.ts');
  writeFileSync(root(GAME_OUT), renderGameScript(VN, ENDINGS, BEST_MISSES) + '\n');
  console.log(`wrote ${GAME_OUT}`);
  writeFileSync(root(PROMPTS_OUT), renderImagePrompts(LESSONS, VN, ENDINGS) + '\n');
  console.log(`wrote ${PROMPTS_OUT}`);
}
