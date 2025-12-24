import React, { useEffect, useState, useRef } from 'react';
import { HitRating } from '../types';
import { audioService } from '../services/audioService';
import { getNoteFromFrequency } from '../constants';

interface UIOverlayProps {
  score: number;
  combo: number;
  lastRating: HitRating | null;
  onExit: () => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ score, combo, lastRating, onExit }) => {
  const [ratingAnim, setRatingAnim] = useState(false);
  const [debugHz, setDebugHz] = useState(0);
  const [debugVol, setDebugVol] = useState(0);
  const [debugNote, setDebugNote] = useState<string>('--');
  const reqRef = useRef<number>(0);

  useEffect(() => {
    if (lastRating) {
      setRatingAnim(true);
      const timer = setTimeout(() => setRatingAnim(false), 300);
      return () => clearTimeout(timer);
    }
  }, [lastRating, score]); 

  // Debug Loop
  useEffect(() => {
    const updateDebug = () => {
      const hz = audioService.getPitch();
      const rms = audioService.getRMS();
      setDebugHz(hz);
      setDebugVol(rms);
      
      if (hz > 0) {
        const note = getNoteFromFrequency(hz);
        setDebugNote(note ? note.name : '??');
      } else {
        setDebugNote('--');
      }
      
      reqRef.current = requestAnimationFrame(updateDebug);
    };
    updateDebug();
    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    }
  }, []);

  const getRatingColor = (r: HitRating) => {
    switch (r) {
      case HitRating.PERFECT: return 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]';
      case HitRating.GOOD: return 'text-green-400';
      case HitRating.OK: return 'text-blue-400';
      case HitRating.MISS: return 'text-red-500';
      default: return 'text-white';
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
      {/* Top Bar: Score (Left) and Monitor (Right) */}
      <div className="flex justify-between items-start w-full">
        <div className="flex flex-col">
          <span className="text-gray-400 text-sm font-bold tracking-wider">SCORE</span>
          <span className="text-4xl font-black text-white tracking-tighter tabular-nums drop-shadow-md">
            {score.toLocaleString()}
          </span>
        </div>

        <div className="flex flex-col items-end gap-2">
           {/* Real-time Debug Monitor (Moved to Top) */}
           <div className="bg-black/40 backdrop-blur px-3 py-2 rounded-lg text-right border border-white/10 shadow-lg">
             <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Input Monitor</div>
             <div className="flex items-center justify-end gap-3">
                <div className="flex flex-col items-end">
                    <span className={`text-xl font-mono font-black ${debugHz > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                        {Math.round(debugHz)} <span className="text-xs text-gray-400 font-normal">Hz</span>
                    </span>
                    <span className="text-sm font-bold text-white">{debugNote}</span>
                </div>
                {/* Mini Volume Bar */}
                <div className="h-8 w-2 bg-gray-700 rounded-full overflow-hidden flex items-end">
                   <div 
                     className="w-full bg-green-500 transition-all duration-75"
                     style={{ height: `${Math.min(100, debugVol * 500)}%` }} 
                   />
                </div>
             </div>
           </div>

            <button 
              onClick={onExit}
              className="pointer-events-auto bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full text-sm hover:bg-white/20 transition mt-2"
            >
              Exit
            </button>
        </div>
      </div>

      {/* Center Feedback */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center">
        {lastRating && (
          <div 
            key={Date.now()} // Force re-render for animation
            className={`text-6xl font-black italic transition-all duration-300 ${getRatingColor(lastRating)} ${ratingAnim ? 'scale-125 opacity-100' : 'scale-100 opacity-0'}`}
          >
            {lastRating}
          </div>
        )}
        
        {combo > 5 && (
          <div className="mt-4 text-2xl font-bold text-blue-300 animate-pulse">
            {combo} COMBO!
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="w-full flex justify-between items-end">
        <div className="text-white/30 text-xs text-left">
          Notes fall from Top to Bottom<br/>Rotate device for a wider view
        </div>
      </div>
    </div>
  );
};

export default UIOverlay;