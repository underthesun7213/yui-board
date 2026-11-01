import { useEffect, useState } from 'react';
import {
  dropDraft,
  explain,
  findSpot,
  type FindResult,
  loadOwn,
  openDraft,
  pickHere,
  savePlace,
  showPick,
  saveDraft,
  startPick,
  stopPick,
} from '../../actions/write';
import { back } from '../../app/router';
import { CAT } from '../../domain/categories';
import { CATEGORIES, LANGS, type Lang, type Place } from '../../domain/types';
import { checkPlace, LIMITS, type PlaceInput } from '../../domain/validation';
import { LANG_NAME } from '../../i18n';
import { useT } from '../../i18n/useT';
import { MapSlot } from '../../map/MapSlot';
import { data } from '../../state/data';
import { mapUi } from '../../state/mapUi';
import { net } from '../../state/net';
import { prefs } from '../../state/prefs';
import { session } from '../../state/session';
import { useStore } from '../../state/useStore';
import { FirstPostNote } from '../../ui/FirstPostNote';
import { BackBar } from '../../ui/BackBar';
import { Captcha } from '../../ui/Captcha';
import { describedBy, Field, WriteBlocked } from '../../ui/Field';

type Fields = Omit<PlaceInput, 'lat' | 'lng'>;

/* Editing: the public copy, or — for one's own item that is hidden — the
   owner's copy from the server (Y-E1). */
export function PlaceForm({ id }: { id?: number }) {
  const m = useT();
  const places = useStore(data, (s) => s.places);
  const mine = useStore(session, (s) => (id ? !!s.minePlaces[id] : true));
  const pub = id ? places.find((p) => p.id === id) : undefined;
  const [own, setOwn] = useState<Place | null | undefined>(undefined);
  useEffect(() => {
    if (id && !pub) void loadOwn<Place>('place', id).then(setOwn);
  }, [id, pub]);
  /* once resolved, the form keeps that copy: a poll that hides the item while
     it is being edited must not take the form away (React's "adjust state
     while rendering" pattern) */
  const [kept, setKept] = useState<Place | undefined>(undefined);
  const found = pub ?? own ?? undefined;
  if (found && !kept) setKept(found);
  if (id && !kept && !pub && own === undefined) return <BackBar title={m.editPlace} />;
  const editing = kept ?? found;
  return (
    <PlaceFormBody key={editing?.id ?? 'new'} id={id} editing={editing} mine={mine || !!own} />
  );
}

function PlaceFormBody({ id, editing, mine }: { id?: number; editing?: Place; mine: boolean }) {
  const m = useT();
  const lang = useStore(prefs, (s) => s.lang);
  const hasAccount = useStore(session, (s) => s.hasAccount);
  const framed = useStore(session, (s) => s.framed);
  const online = useStore(net, (s) => s.online);
  /* the CAPTCHA switch is on: wait for the check */
  const waitCaptcha = useStore(session, (s) => s.captchaRequired && !s.captchaReady);
  const pick = useStore(mapUi, (s) => s.pick);

  const [draft] = useState(() =>
    editing
      ? {
          token: '',
          fields: {
            name: editing.name,
            category: editing.category,
            description: editing.description,
            gmaps_url: editing.gmaps_url ?? '',
            lang: editing.lang,
          } as Fields,
        }
      : openDraft<Fields>('place', {
          name: '',
          category: '',
          description: '',
          gmaps_url: '',
          lang,
        }),
  );
  const [f, setF] = useState<Fields>(draft.fields);
  const [err, setErr] = useState<{ field: string | null; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState(false);
  const [agree, setAgree] = useState(false);

  /* the shared map becomes a location picker while this form is open */
  useEffect(() => {
    startPick(editing ? { lat: editing.lat, lng: editing.lng } : null);
    return stopPick;
    // the place's position is read once, when the form opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!id) saveDraft('place', { token: draft.token, fields: f });
  }, [id, draft.token, f]);

  if (id && (!editing || !mine)) {
    return (
      <>
        <BackBar title={m.editPlace} />
        <p className="empty">{m.eNotFound}</p>
      </>
    );
  }

  const set = <K extends keyof Fields>(k: K, v: Fields[K]) => setF((x) => ({ ...x, [k]: v }));
  const fieldErr = (k: string) => (err?.field === k ? err.msg : null);
  const nameErr = fieldErr('name') ?? fieldErr('name_latin');
  const input: PlaceInput = { ...f, lat: pick?.lat ?? null, lng: pick?.lng ?? null };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const bad = checkPlace(input);
    if (bad) return setErr({ field: bad, msg: m.inv[bad as keyof typeof m.inv] ?? m.inv.other });
    setBusy(true);
    const r = await savePlace(input, { id, token: draft.token });
    setBusy(false);
    const why = explain(r);
    if (why) setErr({ field: r.status === 'invalid' ? (r.field ?? null) : null, msg: why });
  }

  const blocked = !online || framed;
  return (
    <>
      <BackBar title={id ? m.editPlace : m.addPlace} />
      <form className="form" onSubmit={submit} noValidate>
        <Field id="pf-loc" label={m.fLocation} error={fieldErr('location')}>
          <p className="hint" id="pf-loc-hint">
            {pick ? m.pickSet : m.pickHint}
          </p>
        </Field>
        <MapSlot loading={m.mapLoading} />
        <FindSpot
          onLink={(u) => {
            if (!f.gmaps_url) set('gmaps_url', u);
          }}
        />
        {!warn ? (
          <button type="button" className="secondary wide" onClick={() => setWarn(true)}>
            {m.useHere}
          </button>
        ) : (
          <div className="warnbox" role="group" aria-labelledby="pf-warn-t">
            <b id="pf-warn-t">{m.hereWarnT}</b>
            <p>{m.hereWarnB}</p>
            <label className="check">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              {m.hereAgree}
            </label>
            <div className="btns">
              <button
                type="button"
                className="primary"
                disabled={!agree}
                onClick={async () => {
                  if (await pickHere()) setWarn(false);
                }}
              >
                {m.hereConfirm}
              </button>
              <button type="button" className="secondary" onClick={() => setWarn(false)}>
                {m.cancel}
              </button>
            </div>
          </div>
        )}

        <Field
          id="pf-name"
          label={m.fName}
          hint={m.fNameHint}
          error={nameErr}
          count={[[...f.name].length, LIMITS.name]}
        >
          <input
            id="pf-name"
            value={f.name}
            maxLength={LIMITS.name}
            autoComplete="off"
            aria-invalid={!!nameErr}
            aria-describedby={describedBy('pf-name', true, nameErr)}
            onChange={(e) => set('name', e.target.value)}
          />
        </Field>

        <fieldset className={'field' + (fieldErr('category') ? ' bad' : '')}>
          <legend>{m.fCategory}</legend>
          <div className="chiprow">
            {CATEGORIES.map((c) => (
              <label key={c} className={'fchip' + (f.category === c ? ' on' : '')}>
                <input
                  type="radio"
                  name="pf-cat"
                  value={c}
                  checked={f.category === c}
                  onChange={() => set('category', c)}
                />
                <span aria-hidden="true">{CAT[c].icon}</span> {m.cats[c]}
              </label>
            ))}
          </div>
          {fieldErr('category') && (
            <p className="err" role="alert">
              {fieldErr('category')}
            </p>
          )}
        </fieldset>

        <Field
          id="pf-desc"
          label={m.fDesc}
          optional
          error={fieldErr('description')}
          count={[[...f.description].length, LIMITS.description]}
        >
          <textarea
            id="pf-desc"
            rows={4}
            value={f.description}
            maxLength={LIMITS.description}
            aria-invalid={!!fieldErr('description')}
            onChange={(e) => set('description', e.target.value)}
          />
        </Field>

        <Field
          id="pf-link"
          label={m.fLink}
          optional
          hint={m.fLinkHint}
          error={fieldErr('gmaps_url')}
        >
          <input
            id="pf-link"
            type="url"
            inputMode="url"
            value={f.gmaps_url}
            maxLength={500}
            autoComplete="off"
            aria-invalid={!!fieldErr('gmaps_url')}
            aria-describedby={describedBy('pf-link', true, fieldErr('gmaps_url'))}
            onChange={(e) => set('gmaps_url', e.target.value)}
          />
        </Field>

        <Field id="pf-lang" label={m.fLang} error={fieldErr('lang')}>
          <select id="pf-lang" value={f.lang} onChange={(e) => set('lang', e.target.value as Lang)}>
            {LANGS.map((l) => (
              <option key={l} value={l}>
                {LANG_NAME[l]}
              </option>
            ))}
          </select>
        </Field>

        {!hasAccount && !id && <FirstPostNote />}
        <WriteBlocked online={online} framed={framed} />
        <Captcha />
        {err && !err.field && (
          <p className="err" role="alert">
            {err.msg}
          </p>
        )}
        <div className="btns">
          <button type="submit" className="primary" disabled={busy || blocked || waitCaptcha}>
            {busy ? m.saving : m.save}
          </button>
          {!id && (
            <button
              type="button"
              className="secondary"
              onClick={() => {
                dropDraft('place');
                back();
              }}
            >
              {m.cancel}
            </button>
          )}
        </div>
      </form>
    </>
  );
}

/* A Google Maps link or the two numbers from a long press, pasted here,
   puts the pin there (Y-BL-02): for those who add a place later, from home,
   rather than standing at it. The pin moves for the person to check, with a
   way back; nothing is saved until the form is. */
function FindSpot({ onLink }: { onLink(u: string): void }) {
  const m = useT();
  const pick = useStore(mapUi, (s) => s.pick);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ r: FindResult; before: typeof pick } | null>(null);

  async function find() {
    if (!text.trim() || busy) return;
    const before = pick;
    setBusy(true);
    const r = await findSpot(text);
    setBusy(false);
    setRes({ r, before });
    if (r === 'ok' && /^https:/.test(text.trim())) onLink(text.trim());
  }
  const err = res && res.r !== 'ok' ? m.findErr[res.r] : null;
  return (
    <div className="field findspot">
      <label htmlFor="pf-find">{m.findT}</label>
      <p className="hint" id="pf-find-hint">
        {m.findHint}
      </p>
      <div className="findrow">
        <input
          id="pf-find"
          type="text"
          inputMode="url"
          value={text}
          maxLength={500}
          autoComplete="off"
          placeholder={m.findPh}
          aria-invalid={!!err}
          aria-describedby={'pf-find-hint' + (err || res ? ' pf-find-out' : '')}
          onChange={(e) => {
            setText(e.target.value);
            setRes(null);
          }}
          onKeyDown={(e) => {
            /* Enter finds, it does not send the form */
            if (e.key === 'Enter') {
              e.preventDefault();
              void find();
            }
          }}
        />
        <button
          type="button"
          className="secondary"
          disabled={busy || !text.trim()}
          onClick={() => void find()}
        >
          {busy ? m.finding : m.findGo}
        </button>
      </div>
      {res?.r === 'ok' && (
        <p className="hint ok" id="pf-find-out" role="status">
          {m.findOk}{' '}
          <button
            type="button"
            className="link"
            onClick={() => {
              showPick(res.before);
              setRes(null);
            }}
          >
            {m.findUndo}
          </button>
        </p>
      )}
      {err && (
        <p className="err" id="pf-find-out" role="alert">
          {err}
        </p>
      )}
    </div>
  );
}
