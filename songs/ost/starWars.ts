
import { createSong } from '../../utils';

export const starWars = createSong('star_wars', 'Star Wars Theme', 'John Williams', 'OST', 'Medium', 110, [
    // Triplet feel intro
    {t: 500, n: 'C4'}, {t: 1000, n: 'G4'}, {t: 1500, n: 'F4'}, {t: 1650, n: 'E4'}, {t: 1800, n: 'D4'}, {t: 2000, n: 'C5'}, {t: 2500, n: 'G4'},
    {t: 3000, n: 'F4'}, {t: 3150, n: 'E4'}, {t: 3300, n: 'D4'}, {t: 3500, n: 'C5'}, {t: 4000, n: 'G4'},
    {t: 4500, n: 'F4'}, {t: 4650, n: 'E4'}, {t: 4800, n: 'F4'}, {t: 5000, n: 'D4'}
]);
