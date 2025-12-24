
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
      type: Phaser.WEBGL, // Try WebGL explicitly with better config
      parent: containerRef.current,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#111827',
      render: {
        antialias: false,
        antialiasGL: false,
        mipmapFilter: 'LINEAR',
        roundPixels: true,
        pixelArt: false,
        transparent: false,
        clearBeforeRender: true,
        preserveDrawingBuffer: false,
        premultipliedAlpha: true,
        failIfMajorPerformanceCaveat: false,
        powerPreference: 'default',
        batchSize: 4096,
        maxTextures: -1, // Let Phaser detect automatically
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
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      disableContextMenu: true,
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
      style={{ width: '100%', height: '100%', overflow: 'hidden' }}
    />
  );
};

export default GameContainer;
