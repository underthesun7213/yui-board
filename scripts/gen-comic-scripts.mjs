// Writes docs/06-design/comic-scripts.md from src/content/lessons.ts: the
// script the owner draws the comic pages from (Y-J1, Y-J3). The lessons file
// is the source; run this after changing it (`node scripts/gen-comic-scripts.mjs`).
// tests/unit/domain.test.ts fails when the document is out of date.
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/* paths from the repository root, wherever the script is run from */
const root = (p) => fileURLToPath(new URL(`../${p}`, import.meta.url));
export const OUT = 'docs/06-design/comic-scripts.md';
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

/* Reads lessons.ts with the TypeScript already in devDependencies (the file
   has only type imports), so no new tool is needed and Node 20 works. */
async function loadLessons() {
  const ts = (await import('typescript')).default;
  const src = readFileSync(root('src/content/lessons.ts'), 'utf8');
  const js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const dir = mkdtempSync(join(tmpdir(), 'yunabi-'));
  const file = join(dir, 'lessons.mjs');
  writeFileSync(file, js);
  try {
    return (await import(pathToFileURL(file).href)).LESSONS;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeFileSync(root(OUT), renderComicScripts(await loadLessons()) + '\n');
  console.log(`wrote ${OUT}`);
}
