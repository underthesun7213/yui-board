import { SURVEY_TEXT, SURVEY_URL, surveyOpen } from '../content/survey';
import { prefs } from '../state/prefs';
import { useStore } from '../state/useStore';
import '../styles/survey.css';

/* The link to the residents' survey, at a game's ending and on the terms
   screen, until the survey closes. It opens the form in a new tab, with
   nothing of the app sent along. Whether it is open is read once, when this
   code loads with those screens: a tab left open past the deadline may show
   it a little longer, and the form itself is closed by then. */
const open = surveyOpen(Date.now());

export function SurveyLink() {
  const lang = useStore(prefs, (s) => s.lang);
  if (!open) return null;
  const s = SURVEY_TEXT[lang];
  return (
    <a className="surveylink" href={SURVEY_URL} target="_blank" rel="noopener noreferrer">
      <b>{s.t}</b>
      <span>{s.b}</span>
    </a>
  );
}
