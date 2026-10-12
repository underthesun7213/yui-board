/* Artwork that exists at build time. Drop a file into src/art/ under the name
   its slot expects and the gray placeholder becomes that image — no code change:
     lessons/<lid>/<nn>.webp   comic cut nn (01, 02, …) of lesson lid, 4:3
     vn/<route>/<nn>.webp      scene nn of episode 8's route, 4:3
     endings/<id>.webp         ending card, 3:2
   .png and .jpg work too. */
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
export const cutKey = (lid: string, i: number) => `lessons/${lid}/${nn(i)}`;
export const sceneKey = (route: string, i: number) => `vn/${route}/${nn(i)}`;
export const endingKey = (id: string) => `endings/${id}`;
