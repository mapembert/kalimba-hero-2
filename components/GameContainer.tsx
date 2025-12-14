
import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import MainScene from '../game/MainScene';
import { Song, HitRating, AppSettings } from '../types';

interface GameContainerProps {
  song: Song;
  speed: number;
  settings: AppSettings;
  onSongComplete: (score: number) => void;
  onScoreUpdate: (score: number, combo: number, rating: HitRating | null) => void;
}

const GameContainer: React.FC<GameContainerProps> = ({ song, speed, settings, onSongComplete, onScoreUpdate }) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#111827',
      physics: {
        default: 'arcade',
        arcade: {
          debug: false,
        },
      },
      render: {
        antialias: true,
        powerPreference: 'high-performance',
        failIfMajorPerformanceCaveat: false,
        pixelArt: false,
        transparent: false,
        clearBeforeRender: true,
        preserveDrawingBuffer: false,
      },
      // Pass settings to scene
      scene: [new MainScene(song, speed, settings, onSongComplete, onScoreUpdate)],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
      }
    };
  }, [song, speed, settings]); // Re-create game if settings change heavily (though usually better to pass data, this ensures clean state)

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 z-0"
    />
  );
};

export default GameContainer;
