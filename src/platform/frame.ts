/* Inside another page's frame, a click could be tricked into a post or a
   delete (clickjacking, T-24); the meta CSP cannot forbid framing. */
export function isFramed(): boolean {
  try {
    return window.top !== window.self;
  } catch {
    return true;
  }
}
