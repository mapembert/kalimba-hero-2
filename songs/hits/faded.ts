
import { createSong } from '../../utils';

export const faded = createSong('faded', 'Faded', 'Alan Walker', 'Hits', 'Easy', 90, [
    // Intro/Verse motif
    {t: 500, n: 'F4'}, {t: 1000, n: 'F4'}, {t: 1500, n: 'A4'}, {t: 2000, n: 'C5'},
    {t: 2500, n: 'G4'}, {t: 3000, n: 'G4'}, {t: 3500, n: 'B4'}, {t: 4000, n: 'D5'},
    {t: 4500, n: 'A4'}, {t: 5000, n: 'A4'}, {t: 5500, n: 'C5'}, {t: 6000, n: 'E5'},
    {t: 6500, n: 'F4'}, {t: 7000, n: 'F4'}, {t: 7500, n: 'A4'}, {t: 8000, n: 'C5'},
    // Chorus "Where are you now"
    {t: 9000, n: 'F4'}, {t: 9500, n: 'F4'}, {t: 10000, n: 'F4'}, {t: 10500, n: 'E4'}, {t: 11000, n: 'D4'}, {t: 11500, n: 'C4'},
    {t: 12500, n: 'A3'}, {t: 13000, n: 'C4'}, {t: 13500, n: 'E4'}, {t: 14000, n: 'G4'}
]);
