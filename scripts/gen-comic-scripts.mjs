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
const cell = (s) => (s ? String(s).replace(/\|/g, '\\|') : '—');

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
        '| 칸 | 장면 메모 | 내레이션 | 말풍선 | 번역(ko) | 대조 |',
        '|---|---|---|---|---|---|',
      );
      page.panels.forEach((p, i) => {
        out.push(
          `| ${i + 1} | ${cell(p.s)} | ${cell(p.cap)} | ${cell(p.jp)} | ${cell(p.tr.ko)} | [ ] |`,
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
        `- 대사: **${sc.jp}**`,
        '',
        '| 선택지 | | 피드백(ko) |',
        '|---|---|---|',
      );
      for (const o of sc.opts)
        out.push(`| ${cell(o.jp)} | ${o.ok ? '○' : '×'} | ${cell(o.fb.ko)} |`);
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
      `| \`${e.id}\` | ${e.route} | ${kind} | ${cell(e.t.ko)} | ${cell(e.jp)} | ${cell(e.s)} | ${cell(e.n.ko)} |`,
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
}
