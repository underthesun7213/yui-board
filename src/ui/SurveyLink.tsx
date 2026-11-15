import { SURVEY_TEXT, SURVEY_URL } from '../content/survey';
import { prefs } from '../state/prefs';
import { useStore } from '../state/useStore';
import '../styles/survey.css';

/* The link to the residents' survey, at a game's ending and on the terms
   screen. It opens the form in a new tab, with nothing of the app sent along. */
export function SurveyLink() {
  const lang = useStore(prefs, (s) => s.lang);
  const s = SURVEY_TEXT[lang];
  return (
    <a className="surveylink" href={SURVEY_URL} target="_blank" rel="noopener noreferrer">
      <b>{s.t}</b>
      <span>{s.b}</span>
    </a>
  );
}
