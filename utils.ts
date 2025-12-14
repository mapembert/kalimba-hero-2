
import { Song, SongCategory, SongNote } from './types';

export const createSong = (
    id: string, 
    title: string, 
    artist: string, 
    category: SongCategory,
    difficulty: 'Easy'|'Medium'|'Hard', 
    bpm: number, 
    notesArr: Array<{t: number, n: string}>
): Song => {
    return {
        id, title, artist, category, difficulty, bpm,
        notes: notesArr.map(n => ({ time: n.t, noteName: n.n }))
    };
};
