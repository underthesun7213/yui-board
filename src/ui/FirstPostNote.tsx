import { go } from '../actions/nav';
import { useT } from '../i18n/useT';

/* Under a form before this browser's first post (SYS-04): what posting
   means, with the terms and privacy policy one tap away. */
export function FirstPostNote() {
  const m = useT();
  return (
    <p className="note">
      {m.accountNote} {m.legalAgree}{' '}
      <button type="button" className="textlink" onClick={() => go({ name: 'legal' })}>
        {m.legalLink} ›
      </button>
    </p>
  );
}
