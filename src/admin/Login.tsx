import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Factor } from '@supabase/auth-js';
import { renderCaptcha } from '../platform/turnstile';
import { enroll, factors, signIn, verifyCode, type Enrolment } from './api';
import { fill } from './i18n';
import { admin, leave, resume } from './state';
import { useM } from './useM';

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '';

/* Email and password. When the CAPTCHA switch is on, Supabase asks for it on
   password sign-in too, so the widget is always here when a site key is
   built in (RFC-0003 §12.2, [검토 #5]). */
export function Login() {
  const m = useM();
  const forbidden = admin.get().forbidden;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(forbidden ? m.forbidden : null);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<{ reset(): void } | null>(null);
  useEffect(() => {
    if (!SITE_KEY || !box.current) return;
    let gone = false;
    let w: { remove(): void; reset(): void } | null = null;
    renderCaptcha(box.current, SITE_KEY, setCaptcha)
      .then((x) => (gone ? x.remove() : ((w = x), (widget.current = x))))
      .catch(() => setError(m.netError));
    return () => {
      gone = true;
      w?.remove();
    };
  }, [m.netError]);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (SITE_KEY && !captcha) return setError(m.captchaFirst);
    setBusy(true);
    setError(null);
    const r = await signIn(email.trim(), password, captcha ?? undefined);
    setBusy(false);
    setPassword('');
    if (r !== 'ok') {
      widget.current?.reset();
      setCaptcha(null);
      return setError(r === 'bad' ? m.badLogin : r === 'captcha' ? m.captchaFirst : m.netError);
    }
    admin.set({ forbidden: false });
    /* the CAPTCHA script shares this page with the new session: reload so it
       is gone before anything else happens (the session is in sessionStorage) */
    if (SITE_KEY) return location.reload();
    await resume();
  };
  return (
    <form className="panel" onSubmit={(e) => void submit(e)}>
      <label>
        {m.email}
        <input
          type="email"
          name="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label>
        {m.password}
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {SITE_KEY && <div className="captcha" ref={box} />}
      {error && (
        <p className="err" role="alert">
          {error}
        </p>
      )}
      <button className="primary" type="submit" disabled={busy}>
        {busy ? m.signingIn : m.signIn}
      </button>
    </form>
  );
}

/* After the password: the admin picks which authenticator to use, so the
   backup works when the phone is lost (R-7 ①). */
export function PickFactor() {
  const m = useM();
  const [list, setList] = useState<Factor[] | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  useEffect(() => {
    void factors().then((f) => {
      setList(f?.verified ?? []);
      if (f?.verified.length === 1) setChosen(f.verified[0]!.id);
    });
  }, []);
  if (!list) return <p className="panel">{m.loading}</p>;
  return (
    <div className="panel">
      <fieldset className="choices">
        <legend>{m.pickFactor}</legend>
        {list.map((f) => (
          <label key={f.id} className={chosen === f.id ? 'on' : ''}>
            <input
              type="radio"
              name="factor"
              value={f.id}
              checked={chosen === f.id}
              onChange={() => setChosen(f.id)}
            />
            {f.friendly_name || f.id.slice(0, 8)}
          </label>
        ))}
      </fieldset>
      {chosen && <CodeForm factorId={chosen} onDone={() => void resume()} />}
      <button className="secondary" onClick={() => void leave()}>
        {m.cancel}
      </button>
    </div>
  );
}

function CodeForm({ factorId, onDone }: { factorId: string; onDone(): void }) {
  const m = useM();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await verifyCode(factorId, code.replace(/\s/g, ''));
    setBusy(false);
    setCode('');
    if (r === 'ok') onDone();
    else setError(r === 'bad' ? m.badCode : m.netError);
  };
  return (
    <form className="codeform" onSubmit={(e) => void submit(e)}>
      <label>
        {m.code}
        <input
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,7}"
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </label>
      {error && (
        <p className="err" role="alert">
          {error}
        </p>
      )}
      <button className="primary" type="submit" disabled={busy}>
        {m.verify}
      </button>
    </form>
  );
}

/* Registers one authenticator under a name the admin chooses. */
export function EnrollOne({ name, onDone }: { name: string; onDone(): void }) {
  const m = useM();
  const [label, setLabel] = useState(name);
  const [e, setE] = useState<Enrolment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const start = async (ev: FormEvent) => {
    ev.preventDefault();
    setError(null);
    const r = await enroll(label.trim());
    if (!r) setError(m.netError);
    setE(r);
  };
  if (!e)
    return (
      <form className="codeform" onSubmit={(ev) => void start(ev)}>
        <label>
          {m.factorName}
          <input
            name="factor-name"
            required
            maxLength={40}
            value={label}
            onChange={(ev) => setLabel(ev.target.value)}
          />
        </label>
        {error && (
          <p className="err" role="alert">
            {error}
          </p>
        )}
        <button className="primary" type="submit">
          {m.enrollStart}
        </button>
      </form>
    );
  return (
    <div className="enrol">
      <p>{m.enrollScan}</p>
      <img className="qr" src={e.qr} alt="" width={180} height={180} />
      <p className="secret">
        {m.secret}: <code data-secret="">{e.secret}</code>
      </p>
      <CodeForm factorId={e.id} onDone={onDone} />
    </div>
  );
}

/* First sign-in: two authenticators before anything else (§12.2, PL-3). */
export function Enroll() {
  const m = useM();
  const [step, setStep] = useState<1 | 2>(1);
  useEffect(() => {
    void factors().then((f) => f && f.verified.length === 1 && setStep(2));
  }, []);
  return (
    <div className="panel">
      <h2>{m.enrollT}</h2>
      <p>{m.enrollB}</p>
      <p className="step">{fill(m.enrollStep, { n: step })}</p>
      {step === 1 ? (
        <EnrollOne key="1" name={m.enrollMain} onDone={() => setStep(2)} />
      ) : (
        <EnrollOne
          key="2"
          name={m.enrollBackup}
          onDone={() => {
            admin.set({ phase: 'boot' });
            void resume();
          }}
        />
      )}
      <button className="secondary" onClick={() => void leave()}>
        {m.signOut}
      </button>
    </div>
  );
}
