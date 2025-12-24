
export interface NoteDefinition {
  name: string; // e.g., "C4", "D4"
  frequency: number;
  label: string; // Number notation "1", "2", etc.
  color: number; // Hex color for Phaser
}

export interface SongNote {
  time: number; // Time in ms
  noteName: string;
  duration?: number;
}

export type SongCategory = 'Classic' | 'Hits' | 'OST';

export interface Song {
  id: string;
  title: string;
  artist: string;
  category: SongCategory;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  bpm: number;
  notes: SongNote[];
}

export interface GameState {
  score: number;
  combo: number;
  multiplier: number;
  health: number;
  isPlaying: boolean;
  isPaused: boolean;
  gameStarted: boolean;
}

export interface AppSettings {
  enableGuideAudio: boolean;
  guideVolume: number; // 0 to 1
  micGain: number;
  micSilenceThreshold: number;
  micCorrelationThreshold: number;
  inputMode: 'Microphone' | 'Touch';
}

export enum HitRating {
  PERFECT = 'PERFECT',
  GOOD = 'GOOD',
  OK = 'OK',
  MISS = 'MISS'
}
