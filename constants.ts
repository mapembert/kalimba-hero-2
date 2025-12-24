
import { NoteDefinition, Song } from './types';
import { twinkle } from './songs/classic/twinkle';
import { happyBirthday } from './songs/classic/happyBirthday';
import { jingleBells } from './songs/classic/jingleBells';
import { odeToJoy } from './songs/classic/odeToJoy';
import { sunshine } from './songs/classic/sunshine';
import { amazingGrace } from './songs/classic/amazingGrace';
import { maryLamb } from './songs/classic/maryLamb';
import { rowBoat } from './songs/classic/rowBoat';
import { hallelujah } from './songs/classic/hallelujah';
import { cantHelpFalling } from './songs/classic/cantHelpFalling';
import { overRainbow } from './songs/classic/overRainbow';

import { perfect } from './songs/hits/perfect';
import { allOfMe } from './songs/hits/allOfMe';
import { faded } from './songs/hits/faded';
import { shapeOfYou } from './songs/hits/shapeOfYou';
import { believer } from './songs/hits/believer';
import { goldenHuntr } from './songs/hits/goldenHuntr';
import { someoneYouLoved } from './songs/hits/someoneYouLoved';
import { memories } from './songs/hits/memories';

import { myHeartWillGoOn } from './songs/ost/myHeartWillGoOn';
import { letItGo } from './songs/ost/letItGo';
import { pirates } from './songs/ost/pirates';
import { superMarioBros } from './songs/ost/superMarioBros';
import { zelda } from './songs/ost/zelda';
import { jurassic } from './songs/ost/jurassic';
import { hobbits } from './songs/ost/hobbits';
import { megalovania } from './songs/ost/megalovania';
import { starWars } from './songs/ost/starWars';

// Standard 17-Key C Major Tuning (Center C4, alternating L/R)
// From Left (Lowest index) to Right (Highest index) visually on the instrument usually goes:
// D6, B5, G5, E5, C5, A4, F4, D4, [C4], E4, G4, B4, D5, F5, A5, C6, E6
export const KALIMBA_KEYS: NoteDefinition[] = [
  { name: 'D6', frequency: 1174.66, label: '2**', color: 0x60A5FA }, // Left 8
  { name: 'B5', frequency: 987.77, label: '7*', color: 0xA78BFA }, // Left 7
  { name: 'G5', frequency: 783.99, label: '5*', color: 0xF472B6 }, // Left 6
  { name: 'E5', frequency: 659.25, label: '3*', color: 0x34D399 }, // Left 5
  { name: 'C5', frequency: 523.25, label: '1*', color: 0xFBBF24 }, // Left 4
  { name: 'A4', frequency: 440.00, label: '6', color: 0x60A5FA }, // Left 3
  { name: 'F4', frequency: 349.23, label: '4', color: 0xA78BFA }, // Left 2
  { name: 'D4', frequency: 293.66, label: '2', color: 0xF472B6 }, // Left 1
  { name: 'C4', frequency: 261.63, label: '1', color: 0xFF0000 }, // Center (Red usually)
  { name: 'E4', frequency: 329.63, label: '3', color: 0xF472B6 }, // Right 1
  { name: 'G4', frequency: 392.00, label: '5', color: 0xA78BFA }, // Right 2
  { name: 'B4', frequency: 493.88, label: '7', color: 0x60A5FA }, // Right 3
  { name: 'D5', frequency: 587.33, label: '2*', color: 0xFBBF24 }, // Right 4
  { name: 'F5', frequency: 698.46, label: '4*', color: 0x34D399 }, // Right 5
  { name: 'A4', frequency: 440.00, label: '6', color: 0xF472B6 }, // Right 6
  { name: 'C6', frequency: 1046.50, label: '1**', color: 0xA78BFA }, // Right 7
  { name: 'E6', frequency: 1318.51, label: '3**', color: 0x60A5FA }, // Right 8
];
// Note: The above array is used for visual layout L->R. 
// A5 (880) is usually Right 6. 
// Correcting the duplicate label in the array to ensure lookup works for standard C-Major 17 key.
KALIMBA_KEYS[14] = { name: 'A5', frequency: 880.00, label: '6*', color: 0xF472B6 }; // Right 6


// Helper to find key index by name
export const getKeyIndex = (noteName: string): number => {
  return KALIMBA_KEYS.findIndex(k => k.name === noteName);
};

// Helper to find note from frequency (for Sound Test)
export const getNoteFromFrequency = (freq: number): NoteDefinition | null => {
    let closestNote: NoteDefinition | null = null;
    let minDiff = Infinity;

    KALIMBA_KEYS.forEach(note => {
        const diff = Math.abs(note.frequency - freq);
        if (diff < minDiff) {
            minDiff = diff;
            closestNote = note;
        }
    });

    // Only return if it's within a reasonable margin (e.g. 5%)
    if (closestNote && minDiff < (closestNote as NoteDefinition).frequency * 0.05) {
        return closestNote;
    }
    return null;
}

export const GAME_CONFIG = {
  // scrollSpeed is now calculated dynamically based on screen height
  fallDuration: 3000, // ms to fall from top to target
  hitWindow: 200, // ms +/- for a HIT (Total window)
  okWindow: 200, // ms +/- for OK
  goodWindow: 120, // ms +/- for GOOD
  perfectWindow: 50, // ms +/- for PERFECT
  noteSize: 20,
  hitLineY: 0.8, // Percentage of screen height where the hit line is (Moved up to allow virtual keys)
};

export const SONGS: Song[] = [
  // --- CLASSIC ---
  twinkle,
  happyBirthday,
  jingleBells,
  odeToJoy,
  sunshine,
  amazingGrace,
  maryLamb,
  rowBoat,
  hallelujah,
  cantHelpFalling,
  overRainbow,

  // --- HITS ---
  perfect,
  allOfMe,
  faded,
  shapeOfYou,
  believer,
  goldenHuntr,
  someoneYouLoved,
  memories,

  // --- OST ---
  myHeartWillGoOn,
  letItGo,
  pirates,
  superMarioBros,
  zelda,
  jurassic,
  hobbits,
  megalovania,
  starWars
];
