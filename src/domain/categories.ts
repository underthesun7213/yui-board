import type { Category } from './types';

/* Design direction A: each passes 4.5:1 against white and white text on it.
   Food (red) and study (green) are hard to tell apart for red-green colour
   vision, so every pin and chip also carries the icon. */
export const CAT: Record<Category, { color: string; icon: string }> = {
  transit: { color: '#1D3E5C', icon: '🚉' },
  daily: { color: '#1769AA', icon: '🛒' },
  food: { color: '#B53D2E', icon: '🍜' },
  study: { color: '#2B7A4B', icon: '📚' },
  admin: { color: '#6A4C9C', icon: '📄' },
  health: { color: '#9A5B00', icon: '➕' },
};
