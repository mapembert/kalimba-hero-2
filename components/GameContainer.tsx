
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

    // Small delay to ensure container has dimensions
    const initGame = setTimeout(() => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.CANVAS, // Use Canvas to avoid WebGL framebuffer issues
        parent: containerRef.current,
        width: rect.width || window.innerWidth,
        height: rect.height || window.innerHeight,
        backgroundColor: '#111827',
        render: {
          transparent: false,
        },
        fps: {
          target: 60,
          forceSetTimeOut: false
        },
        physics: {
          default: 'arcade',
          arcade: {
            debug: false,
          },
        },
        // Pass settings to scene
        scene: [new MainScene(song, speed, settings, onSongComplete, onScoreUpdate)],
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        disableContextMenu: true,
        banner: false,
        audio: {
          disableWebAudio: false,
          noAudio: false,
        }
      };

      gameRef.current = new Phaser.Game(config);
    }, 100);

    return () => {
      clearTimeout(initGame);
      if (gameRef.current) {
        gameRef.current.destroy(true);
      }
    };
  }, [song, speed, settings]); // Re-create game if settings change heavily (though usually better to pass data, this ensures clean state)

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 z-0"
      style={{ width: '100%', height: '100%', overflow: 'hidden' }}
    />
  );
};

export default GameContainer;
