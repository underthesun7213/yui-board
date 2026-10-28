/* One line plays at a time (D35): starting a new one stops the last. A
   failed play (offline before the file was cached, autoplay rules) is silent. */
let current: HTMLAudioElement | null = null;

export function playAudio(url: string) {
  current?.pause();
  current = new Audio(url);
  void current.play().catch(() => {});
}
