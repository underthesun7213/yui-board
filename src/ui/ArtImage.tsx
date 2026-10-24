import { ART } from '../content/art';

/* The artwork for a slot if the file exists, otherwise a plain gray box (D15). */
export function ArtImage({ k, alt, className }: { k: string; alt: string; className: string }) {
  const src = ART[k];
  return <div className={className}>{src ? <img src={src} alt={alt} loading="lazy" /> : null}</div>;
}
