/* Artwork that exists at build time. Drop a file into src/art/ under the name
   its slot expects and the gray placeholder becomes that image — no code change:
     lessons/<lid>/p1, p2      the two comic pages of levels 1–7: portrait 2:3,
                               short side at least 1000 px, at most 400 KB.
                               Balloons carry the panel's `jp`, caption boxes
                               its `cap`, read right to left, top to bottom
                               (docs/06-design/comic-scripts.md)
     vn/<route>/<nn>           scene nn of episode 8's route, 4:3
     endings/<id>              ending card, 3:2
     achievements/<id>         achievement illustration (src/content/achievements.ts), 3:2
     minigames/yuki/<name>     유우키 미니게임: street, table, tease (src/content/yuki-minigame.ts), 4:3
   Each as .webp, .png or .jpg (one file per slot; tests/unit/domain.test.ts
   checks the names, sizes and shapes). Comic pages are built into
   assets/comic/ and cached by the service worker the first time they are
   seen, not on install (src/sw.ts). */
const files = import.meta.glob<string>('/src/art/**/*.{webp,png,jpg}', {
  eager: true,
  query: '?url',
  import: 'default',
});

export const ART: Record<string, string> = {};
for (const [path, url] of Object.entries(files)) {
  const key = path.replace(/^\/src\/art\//, '').replace(/\.(webp|png|jpg)$/, '');
  ART[key] = url;
}

const nn = (i: number) => String(i + 1).padStart(2, '0');
export const pageKey = (lid: string, n: 1 | 2) => `lessons/${lid}/p${n}`;
export const sceneKey = (route: string, i: number) => `vn/${route}/${nn(i)}`;
export const endingKey = (id: string) => `endings/${id}`;
export const achievementKey = (id: string) => `achievements/${id}`;
