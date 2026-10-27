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

/* The art direction every prompt starts with (2026-10-28, Gemini). The
   owner's pictures in docs/06-design/characters/ show the style. */
const STYLE =
  'Style: Korean-webtoon anime illustration, clean dark line art, soft painterly cel shading, muted natural colours, natural proportions (not chibi). Everyday places in Kansai, Japan, drawn as they really look, with detailed backgrounds.';
/* Each comic level has its own student, so no face has to stay the same
   across levels — only across a level's two pages, drawn in one chat. Level
   7's student says his name, James. */
const STUDENTS = {
  l1: 'Mali, a Thai exchange student, a woman about 20, long straight black hair, warm brown skin, oversized cream sweatshirt, wide-leg jeans, tote bag',
  l2: 'Diego, a Mexican exchange student, a man about 20, short dark curly hair, light-brown skin, denim jacket over a grey T-shirt, black trousers, sneakers',
  l3: 'Amelia, a British exchange student of Ghanaian descent, a Black woman about 20, natural coily hair in a puff, dark skin, mustard cardigan, long black skirt, glasses',
  l4: 'Minjun, a Korean exchange student, a man about 20, short black hair, light skin, black puffer vest over a white hoodie, grey joggers',
  l5: 'Priya, an Indian exchange student, a woman about 20, long dark wavy hair in a braid, medium-brown skin, light denim jacket, maroon top, black jeans',
  l6: 'Lin, a Chinese exchange student, a woman about 20, black bob with bangs, light skin, beige trench coat over a striped top; with two friends from the dorm (a tall man with glasses, a woman with short red hair)',
  l7: 'James, an American exchange student, a white man about 20, short wavy light-brown hair, navy hoodie over a white T-shirt, dark jeans, grey backpack',
};

/** Prompts to paste into Gemini, one per picture, built from the scene notes
    and lines so they stay in step with the content. */
export function renderImagePrompts(lessons, vn, endings) {
  const block = (lines) => ['```text', ...lines, '```', ''];
  const out = [
    '# 그림 생성 프롬프트 (Gemini)',
    '',
    '> **생성 문서 — 고치지 말 것.** 대본(`lessons.ts`·`vn.ts`·`endings.ts`)과 `scripts/gen-comic-scripts.mjs` 의 그림체·학생 설정에서 만든다. 대사나 장면 메모를 바꾸면 다시 생성한다.',
    '',
    '## 순서',
    '',
    '1. 만화: 레벨마다 학생이 다르다(D36). **한 레벨의 1쪽과 2쪽은 같은 Gemini 대화에서** 이어 만든다 — 2쪽 프롬프트가 1쪽의 학생을 그대로 쓰라고 한다. 레벨이 바뀌면 새 대화.',
    '2. 게임 장면과 엔딩 카드는 **사람 없는 배경**이다. 친구의 이름과 대사는 앱이 그림 아래에 보여 준다.',
    '3. 그림체를 맞추려면 `docs/06-design/characters/bg-osaka-shinsekai.webp` 를 첨부하고 "이 그림체로" 라고 덧붙여도 된다(선택).',
    '4. 만화의 일본어 글자가 틀리면 같은 프롬프트 끝에 `Leave every speech balloon and caption box empty.` 를 붙여 다시 만들고, 글자는 편집기에서 넣는다(글자는 대본의 **말풍선**과 똑같이).',
    '5. 저장: 만화 `src/art/lessons/<id>/p1`·`p2`(세로 2:3, 짧은 변 1000px 이상, 400KB 이하), 게임 `src/art/vn/<친구>/<nn>`(가로 4:3), 엔딩 `src/art/endings/<id>`(가로 3:2). `.webp`·`.png`·`.jpg`. 크기·이름은 맞추지 못해도 파일을 주면 맞춰 넣는다.',
    '',
    '## 만화 (레벨 1~7)',
    '',
  ];
  for (const l of lessons) {
    if (l.vn) continue;
    l.pages.forEach((page, pi) => {
      out.push(
        `### 레벨 ${l.lv} ${l.t.ko} — ${pi + 1}쪽 → \`src/art/lessons/${l.id}/p${pi + 1}\``,
        '',
      );
      const lines = [
        STYLE,
        pi === 0
          ? `"The student" below is ${STUDENTS[l.id]}.`
          : '"The student" below is the same person as on the previous page, in the same clothes.',
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

  const place = (ratio, note) => [
    STYLE,
    `One horizontal background illustration, aspect ratio ${ratio}, of the place where this happens, seen at eye level: ${note}.`,
    'Draw the place only: no people in the foreground, at most a few small distant passers-by with no visible faces. No text, signs left blank or unreadable, no speech balloons.',
  ];
  out.push('## 게임 장면 (레벨 8)', '');
  for (const [route, r] of Object.entries(vn)) {
    r.scenes.forEach((sc, i) => {
      out.push(
        `### ${r.name.ko} 장면 ${i + 1} → \`src/art/vn/${route}/${String(i + 1).padStart(2, '0')}\``,
        '',
      );
      out.push(...block(place('4:3', sc.s)));
    });
  }
  out.push('## 엔딩 카드', '');
  for (const e of endings) {
    out.push(`### ${e.t.ko} → \`src/art/endings/${e.id}\``, '');
    out.push(...block([...place('3:2', e.s), 'Make it feel like the last shot of a good day.']));
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
