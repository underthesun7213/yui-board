import { ACHIEVEMENTS } from './achievements';
import { ENDINGS } from './endings';
import { LESSONS } from './lessons';
import { VN } from './vn';
import { addVoices } from './voice-files';
import { voiceLines } from './voice-lines';

/* The lessons', episode 8's and the achievements' recorded lines. Imported for
   this side effect by the lesson screen; the files found are in state/voices. */
addVoices(voiceLines(LESSONS, VN, ENDINGS, ACHIEVEMENTS));
