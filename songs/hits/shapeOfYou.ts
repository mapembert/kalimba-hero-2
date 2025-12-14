
import { createSong } from '../../utils';

export const shapeOfYou = createSong('shape_of_you', 'Shape of You', 'Ed Sheeran', 'Hits', 'Medium', 96, [
    // Marimba riff simplified
    {t: 500, n: 'C4'}, {t: 750, n: 'E4'}, {t: 1000, n: 'C4'}, {t: 1250, n: 'E4'}, 
    {t: 1500, n: 'C4'}, {t: 1750, n: 'E4'}, {t: 2000, n: 'B3'}, {t: 2250, n: 'E4'},
    // Repeat
    {t: 2500, n: 'C4'}, {t: 2750, n: 'E4'}, {t: 3000, n: 'C4'}, {t: 3250, n: 'E4'}, 
    {t: 3500, n: 'C4'}, {t: 3750, n: 'E4'}, {t: 4000, n: 'B3'}, {t: 4250, n: 'E4'},
    // Verse "Club isn't the best place"
    {t: 5000, n: 'A4'}, {t: 5250, n: 'A4'}, {t: 5500, n: 'B4'}, {t: 5750, n: 'C5'}, {t: 6000, n: 'B4'}, {t: 6250, n: 'A4'}, {t: 6500, n: 'B4'}, {t: 6750, n: 'A4'},
    {t: 7500, n: 'G4'}, {t: 8000, n: 'E4'}
]);
