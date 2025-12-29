
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
      
      const parentRect = containerRef.current.parentElement?.getBoundingClientRect();
      if (!parentRect) return;
      
      const gameWidth = (parentRect.width * settings.gameWidthPercent) / 100;
      const gameHeight = parentRect.height;

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.CANVAS, // Use Canvas to avoid WebGL framebuffer issues
        parent: containerRef.current,
        width: gameWidth,
        height: gameHeight,
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
      className="z-0"
      style={{ 
        width: `${settings.gameWidthPercent}%`, 
        height: '100%',
        margin: '0 auto'
      }}
    />
  );
};

export default GameContainer;
