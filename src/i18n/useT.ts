import { prefs } from '../state/prefs';
import { useStore } from '../state/useStore';
import { t, type Messages } from './index';

/** The current language's messages; re-renders only when the language changes. */
export function useT(): Messages {
  return t(useStore(prefs, (s) => s.lang));
}
