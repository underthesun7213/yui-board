import type * as Leaflet from 'leaflet';
import { clusterNode, meNode, pinNode, textNode } from './layers';

/* Every divIcon is made here. Its html is either a string literal or a node
   from layers.ts (text set with textContent) — never a string built from data,
   which Leaflet would put into innerHTML. */
export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

type LT = typeof Leaflet;

export const pinIcon = (L: LT, color: string, icon: string, on: boolean) =>
  L.divIcon({
    className: 'pinw' + (on ? ' on' : ''),
    html: pinNode(color, icon),
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
export const clusterIcon = (L: LT, n: number) =>
  L.divIcon({ className: 'clw', html: clusterNode(n), iconSize: [34, 34] });
export const homeIcon = (L: LT, label: string) =>
  L.divIcon({
    className: 'homew',
    html: textNode('b', label),
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
export const meIcon = (L: LT, label: string) =>
  L.divIcon({ className: 'mew', html: meNode(label), iconSize: [22, 22], iconAnchor: [11, 11] });

/* Prefecture boundaries (direction A): navy lines; prefectures with places
   tinted navy; the selected one filled butterfly-sky with a navy edge. */
export const PREF_STYLE = {
  base: { color: '#1D3E5C', weight: 1, fillColor: '#8ECDF2', fillOpacity: 0.08 },
  has: { color: '#1D3E5C', weight: 1, fillColor: '#1D3E5C', fillOpacity: 0.22 },
  on: { color: '#1D3E5C', weight: 2.5, fillColor: '#8ECDF2', fillOpacity: 0.45 },
};
