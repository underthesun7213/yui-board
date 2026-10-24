import { useT } from '../i18n/useT';
import { Butterfly } from './Butterfly';
import { LangMenu } from './LangMenu';

export function Header() {
  const m = useT();
  return (
    <header className="apphead">
      <div className="crest">
        <Butterfly />
        <div className="crest-text">
          <b>{m.appName}</b>
          <span>{m.appSub}</span>
        </div>
        <LangMenu />
      </div>
    </header>
  );
}
