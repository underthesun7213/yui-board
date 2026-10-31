import { createStore } from './store';

/* The recorded lines found so far (D35): line key → file URL. Filled by
   content/voice-files.ts as screens add their lines; a line missing here has
   no play button. */
export const voices = createStore<Record<string, string>>({});
