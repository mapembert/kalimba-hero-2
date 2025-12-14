
import { createSong } from '../../utils';

export const pirates = createSong('pirates', 'He\'s a Pirate', 'Hans Zimmer', 'OST', 'Hard', 150, [
    // Fast triple meter feel
    {t: 500, n: 'E4'}, {t: 750, n: 'G4'}, {t: 1000, n: 'A4'}, {t: 1250, n: 'A4'},
    {t: 1500, n: 'A4'}, {t: 1750, n: 'B4'}, {t: 2000, n: 'C5'}, {t: 2250, n: 'C5'},
    {t: 2500, n: 'C5'}, {t: 2750, n: 'D5'}, {t: 3000, n: 'B4'}, {t: 3250, n: 'B4'},
    {t: 3500, n: 'A4'}, {t: 3750, n: 'G4'}, {t: 4000, n: 'A4'}, {t: 4500, n: 'E4'},
    // Repeat motif
    {t: 5000, n: 'E4'}, {t: 5250, n: 'G4'}, {t: 5500, n: 'A4'}, {t: 5750, n: 'A4'},
    {t: 6000, n: 'A4'}, {t: 6250, n: 'B4'}, {t: 6500, n: 'C5'}, {t: 6750, n: 'C5'},
    {t: 7000, n: 'C5'}, {t: 7250, n: 'D5'}, {t: 7500, n: 'B4'}, {t: 7750, n: 'B4'},
    {t: 8000, n: 'A4'}, {t: 8250, n: 'G4'}, {t: 8500, n: 'A4'}
]);
