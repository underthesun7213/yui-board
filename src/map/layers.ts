/* DOM nodes handed to Leaflet. Leaflet puts a string given to bindTooltip,
   bindPopup, setContent or divIcon({html}) into innerHTML, so anything that
   can carry text goes through here and is set with textContent. */
export function textNode(
  tag: string,
  text: string,
  className?: string,
  title?: string,
): HTMLElement {
  const el = document.createElement(tag);
  el.textContent = text;
  if (className) el.className = className;
  if (title) el.title = title;
  return el;
}

/** A category pin: colour dot plus the category icon (colour alone is not enough). */
export function pinNode(color: string, icon: string): HTMLElement {
  const el = textNode('span', icon, 'pindot');
  el.style.background = color;
  return el;
}

export const clusterNode = (n: number) => textNode('div', String(n), 'cl');
export const meNode = (label: string) => textNode('i', '', '', label);
