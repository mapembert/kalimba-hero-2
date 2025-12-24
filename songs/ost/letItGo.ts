
import { createSong } from '../../utils';

export const letItGo = createSong('let_it_go', 'Let It Go', 'Frozen', 'OST', 'Medium', 130, [
    // Verse "The snow glows white"
    {t: 500, n: 'G4'}, {t: 750, n: 'C5'}, {t: 1000, n: 'D5'}, {t: 1250, n: 'E5'}, {t: 1500, n: 'E5'}, {t: 2000, n: 'C5'},
    // Chorus "Let it go, let it go"
    {t: 3000, n: 'G4'}, {t: 3500, n: 'C5'}, {t: 4000, n: 'G5'}, {t: 5000, n: 'E5'},
    {t: 6000, n: 'G4'}, {t: 6500, n: 'C5'}, {t: 7000, n: 'G5'}, {t: 8000, n: 'E5'},
    // "Can't hold it back anymore"
    {t: 9000, n: 'E5'}, {t: 9250, n: 'D5'}, {t: 9500, n: 'C5'}, {t: 9750, n: 'C5'}, {t: 10000, n: 'C5'}, {t: 11000, n: 'C5'}
]);
