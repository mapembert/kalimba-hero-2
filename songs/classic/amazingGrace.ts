
import { createSong } from '../../utils';

// Tabs: 2=C4, 3=D4, 5=F4, 6=G4, 7=A4
// Line 1: 2-5-7-5-7 6 5 3 2 (Amazing Grace, how sweet the sound)
// Line 2: 2 5 7-5-7 6 2 (That saved a wretch like me)
// Line 3: 7-2-7-2-7-5 2 3-5-5-3-2 (I once was lost, but now am found)

export const amazingGrace = createSong('amazing_grace', 'Amazing Grace', 'Spiritual', 'Classic', 'Medium', 80, [
    // Line 1: Amazing Grace, how sweet the sound
    {t: 500, n: 'C4'}, {t: 1000, n: 'F4'}, {t: 1500, n: 'A4'}, {t: 1750, n: 'F4'},
    {t: 2000, n: 'A4'}, {t: 2500, n: 'G4'}, {t: 3000, n: 'F4'}, {t: 3500, n: 'D4'},
    {t: 4000, n: 'C4'},
    
    // Line 2: That saved a wretch like me
    {t: 5000, n: 'C4'}, {t: 5750, n: 'F4'}, {t: 6500, n: 'A4'}, {t: 6750, n: 'F4'},
    {t: 7000, n: 'A4'}, {t: 7500, n: 'G4'}, {t: 8500, n: 'C4'},
    
    // Line 3: I once was lost, but now am found
    {t: 10000, n: 'A4'}, {t: 10500, n: 'C4'}, {t: 11000, n: 'A4'}, {t: 11500, n: 'C4'},
    {t: 12000, n: 'A4'}, {t: 12500, n: 'F4'}, {t: 13500, n: 'C4'}, 
    {t: 14250, n: 'D4'}, {t: 14750, n: 'F4'}, {t: 15000, n: 'F4'}, {t: 15250, n: 'D4'}, {t: 15500, n: 'C4'},
    
    // Line 4: Was blind but now I see
    {t: 17000, n: 'C4'}, {t: 17750, n: 'F4'}, {t: 18500, n: 'A4'}, {t: 18750, n: 'F4'},
    {t: 19000, n: 'A4'}, {t: 19750, n: 'G4'}, {t: 20250, n: 'F4'}
]);
