import { useStore } from '../state/useStore';
import { ADMIN_MESSAGES } from './i18n';
import { admin } from './state';

export const useM = () => ADMIN_MESSAGES[useStore(admin, (s) => s.lang)];

/** A date and time in Japan, in the console's language. */
export function useWhen() {
  const lang = useStore(admin, (s) => s.lang);
  return (iso: string | null | undefined) =>
    iso
      ? new Intl.DateTimeFormat(lang, {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: 'Asia/Tokyo',
        }).format(new Date(iso))
      : '';
}
