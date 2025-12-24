


import React, { useState, useCallback, useEffect, useRef } from 'react';
import GameContainer from './components/GameContainer';
import UIOverlay from './components/UIOverlay';
import { Song, HitRating, GameState, NoteDefinition, SongCategory, AppSettings } from './types';
import { SONGS, KALIMBA_KEYS, getNoteFromFrequency } from './constants';
import { audioService } from './services/audioService';

// --- Components ---

const SettingsModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    settings: AppSettings; 
    onSave: (s: AppSettings) => void; 
    onOpenTuner: () => void;
}> = ({ isOpen, onClose, settings, onSave, onOpenTuner }) => {
    if (!isOpen) return null;

    // Local state for editing before save
    const [localSettings, setLocalSettings] = useState<AppSettings>(settings);

    const handleSave = () => {
        onSave(localSettings);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh]">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="text-3xl">⚙️</span> Settings
                </h2>

                {/* Input Mode */}
                <div className="mb-6 p-4 bg-slate-900/50 rounded-xl">
                    <h3 className="text-lg font-bold text-green-400 mb-4 border-b border-green-500/30 pb-2">Input Mode</h3>
                    <div className="flex gap-2 bg-slate-800 p-1 rounded-lg">
                        <button 
                           onClick={() => setLocalSettings(p => ({...p, inputMode: 'Microphone'}))}
                           className={`flex-1 py-2 rounded-md font-bold text-sm transition-all ${localSettings.inputMode === 'Microphone' ? 'bg-green-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                        >
                            🎤 Mic
                        </button>
                        <button 
                           onClick={() => setLocalSettings(p => ({...p, inputMode: 'Touch'}))}
                           className={`flex-1 py-2 rounded-md font-bold text-sm transition-all ${localSettings.inputMode === 'Touch' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                        >
                            👆 Touch
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 italic">
                        {localSettings.inputMode === 'Microphone' 
                         ? 'Use your real Kalimba. The microphone listens for notes.'
                         : 'Play on-screen. Tap the bars at the bottom.'}
                    </p>
                </div>

                {/* Guide Audio Section */}
                <div className="mb-6 p-4 bg-slate-900/50 rounded-xl">
                    <h3 className="text-lg font-bold text-blue-400 mb-4 border-b border-blue-500/30 pb-2">Guide Audio</h3>
                    
                    <div className="flex items-center justify-between mb-4">
                        <label className="text-white font-medium">Play Song Melody</label>
                        <button 
                            onClick={() => setLocalSettings(prev => ({ ...prev, enableGuideAudio: !prev.enableGuideAudio }))}
                            className={`w-12 h-6 rounded-full transition-colors relative ${localSettings.enableGuideAudio ? 'bg-green-500' : 'bg-gray-600'}`}
                        >
                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${localSettings.enableGuideAudio ? 'translate-x-6' : ''}`} />
                        </button>
                    </div>

                    <div className={`transition-opacity ${localSettings.enableGuideAudio ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                        <div className="flex justify-between mb-2">
                            <label className="text-sm text-gray-300">Volume</label>
                            <span className="text-xs text-gray-400">{Math.round(localSettings.guideVolume * 100)}%</span>
                        </div>
                        <input 
                            type="range" min="0" max="1" step="0.05"
                            value={localSettings.guideVolume}
                            onChange={(e) => setLocalSettings(prev => ({ ...prev, guideVolume: parseFloat(e.target.value) }))}
                            className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>
                </div>

                {/* Tools Section (Only enable if Mic mode, or always show but disable) */}
                <div className="mb-8">
                     <h3 className="text-lg font-bold text-purple-400 mb-4 border-b border-purple-500/30 pb-2">Tools</h3>
                     <button
                        onClick={onOpenTuner}
                        disabled={localSettings.inputMode !== 'Microphone'}
                        className={`w-full bg-slate-700 border border-slate-500 text-white py-3 px-4 rounded-xl flex items-center justify-between group transition-colors ${localSettings.inputMode !== 'Microphone' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-600'}`}
                     >
                         <span className="font-bold">🎙️ Sound Check / Tuner</span>
                         <span className="text-gray-400 group-hover:text-white">→</span>
                     </button>
                </div>

                <div className="flex gap-4">
                    <button onClick={onClose} className="flex-1 py-3 text-gray-400 font-bold hover:text-white transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all">
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
};

const SoundCheck: React.FC<{ onBack: () => void, settings: AppSettings, onUpdateSettings: (s: AppSettings) => void }> = ({ onBack, settings, onUpdateSettings }) => {
    const [volume, setVolume] = useState(0);
    const [frequency, setFrequency] = useState(0);
    const [detectedNote, setDetectedNote] = useState<NoteDefinition | null>(null);
    const [config, setConfig] = useState(settings);
    const reqRef = useRef<number>(0);

    useEffect(() => {
        const init = async () => {
            try {
                await audioService.initialize();
                audioService.setConfig({
                    gain: settings.micGain,
                    silenceThreshold: settings.micSilenceThreshold,
                    correlationThreshold: settings.micCorrelationThreshold
                });

                const update = () => {
                    const rms = audioService.getRMS();
                    const freq = audioService.getPitch();
                    
                    const visualVol = Math.min(1, Math.log10(1 + rms * 100) / 2);
                    setVolume(visualVol);
                    setFrequency(freq);
                    
                    if (freq > 0) {
                        setDetectedNote(getNoteFromFrequency(freq));
                    }
                    reqRef.current = requestAnimationFrame(update);
                };
                update();
            } catch (e) {
                alert("Could not access microphone.");
            }
        };
        init();

        return () => {
            if (reqRef.current) cancelAnimationFrame(reqRef.current);
        };
    }, []);

    const handleConfigChange = (key: keyof AppSettings, value: number) => {
        const newConfig = { ...config, [key]: value };
        setConfig(newConfig);
        audioService.setConfig({
             gain: newConfig.micGain,
             silenceThreshold: newConfig.micSilenceThreshold,
             correlationThreshold: newConfig.micCorrelationThreshold
        });
    };

    const handleSaveBack = () => {
        onUpdateSettings(config); // Save back to main app state
        onBack();
    };

    return (
        <div className="fixed inset-0 z-[60] bg-slate-900 text-white flex flex-col p-6 overflow-y-auto overflow-x-hidden no-scrollbar">
            <h2 className="text-3xl font-bold mb-4 text-purple-400 text-center shrink-0">Sound Check</h2>
            
            <div className="flex flex-col md:flex-row gap-6 w-full max-w-4xl mx-auto shrink-0 pb-10">
                {/* Visuals */}
                <div className="flex-1 flex flex-col items-center">
                    <div className="w-full max-w-xs mb-6">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Input Level</span>
                            <span>{Math.round(volume * 100)}%</span>
                        </div>
                        <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden relative">
                             <div 
                                className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-10"
                                style={{ left: `${Math.min(1, Math.log10(1 + config.micSilenceThreshold * 100) / 2) * 100}%` }}
                             />
                            <div 
                                className="h-full bg-gradient-to-r from-green-400 to-red-500 transition-all duration-75"
                                style={{ width: `${volume * 100}%` }}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center w-56 h-56 rounded-full border-4 border-slate-700 bg-slate-800 mb-6 relative shadow-2xl shrink-0 transition-colors duration-200" style={{ borderColor: detectedNote ? '#' + detectedNote.color.toString(16) : '#334155' }}>
                        <div className="text-sm text-gray-500 uppercase tracking-widest absolute top-8">Detected</div>
                        {detectedNote ? (
                            <>
                                <div className="text-7xl font-black text-white" style={{ color: '#' + detectedNote.color.toString(16) }}>
                                    {detectedNote.name}
                                </div>
                                <div className="text-lg text-gray-400 font-mono mt-2">{Math.round(frequency)} Hz</div>
                            </>
                        ) : (
                            <>
                                <div className="text-gray-600 italic text-xl">...</div>
                                {frequency > 0 && <div className="text-xs text-gray-500 font-mono mt-2 absolute bottom-8">{Math.round(frequency)} Hz</div>}
                            </>
                        )}
                    </div>
                </div>

                {/* Controls */}
                <div className="flex-1 bg-slate-800/50 rounded-2xl p-6 border border-slate-700 h-fit">
                    <h3 className="text-lg font-bold text-gray-300 mb-4 border-b border-gray-700 pb-2">Microphone Calibration</h3>
                    
                    <div className="mb-6">
                        <div className="flex justify-between mb-2">
                            <label className="text-sm font-bold text-purple-300">Boost (Gain)</label>
                            <span className="text-xs font-mono bg-slate-900 px-2 py-1 rounded">{config.micGain.toFixed(1)}x</span>
                        </div>
                        <input 
                            type="range" min="1" max="10" step="0.5"
                            value={config.micGain}
                            onChange={(e) => handleConfigChange('micGain', parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-purple-500 touch-pan-x"
                        />
                    </div>

                    <div className="mb-6">
                        <div className="flex justify-between mb-2">
                            <label className="text-sm font-bold text-blue-300">Sensitivity</label>
                            <span className="text-xs font-mono bg-slate-900 px-2 py-1 rounded">{config.micSilenceThreshold.toFixed(4)}</span>
                        </div>
                        <input 
                            type="range" min="0.0001" max="0.05" step="0.0001"
                            value={config.micSilenceThreshold}
                            onChange={(e) => handleConfigChange('micSilenceThreshold', parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500 touch-pan-x"
                        />
                    </div>

                    <div className="mb-6">
                        <div className="flex justify-between mb-2">
                            <label className="text-sm font-bold text-green-300">Strictness</label>
                            <span className="text-xs font-mono bg-slate-900 px-2 py-1 rounded">{config.micCorrelationThreshold.toFixed(2)}</span>
                        </div>
                        <input 
                            type="range" min="0.5" max="0.99" step="0.01"
                            value={config.micCorrelationThreshold}
                            onChange={(e) => handleConfigChange('micCorrelationThreshold', parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-green-500 touch-pan-x"
                        />
                    </div>

                    <button onClick={handleSaveBack} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-8 rounded-full transition-all w-full">
                        Save & Close Tuner
                    </button>
                </div>
            </div>
        </div>
    );
}

const App: React.FC = () => {
  const [activeSong, setActiveSong] = useState<Song | null>(null);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [activeTab, setActiveTab] = useState<SongCategory>('Classic');
  const [lastRating, setLastRating] = useState<HitRating | null>(null);
  const [showResult, setShowResult] = useState(false);
  
  // UI States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTunerOpen, setIsTunerOpen] = useState(false);

  // Settings State with Persistence
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
      const saved = localStorage.getItem('kalimba_settings');
      if (saved) {
          const parsed = JSON.parse(saved);
          // Backwards compatibility for new inputMode field
          if (!parsed.inputMode) parsed.inputMode = 'Microphone';
          return parsed;
      }
      return {
          enableGuideAudio: false,
          guideVolume: 0.5,
          micGain: 5.0,
          micSilenceThreshold: 0.005,
          micCorrelationThreshold: 0.8,
          inputMode: 'Microphone'
      };
  });

  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    combo: 0,
    multiplier: 1,
    health: 100,
    isPlaying: false,
    isPaused: false,
    gameStarted: false,
  });

  const handleSaveSettings = (newSettings: AppSettings) => {
      setAppSettings(newSettings);
      localStorage.setItem('kalimba_settings', JSON.stringify(newSettings));
      
      // Update audio service immediately
      audioService.setConfig({
          gain: newSettings.micGain,
          silenceThreshold: newSettings.micSilenceThreshold,
          correlationThreshold: newSettings.micCorrelationThreshold
      });
  };

  const startGame = async (song: Song) => {
    try {
        if (appSettings.inputMode === 'Microphone') {
            await audioService.initialize();
            // Ensure settings are applied on start
            audioService.setConfig({
                 gain: appSettings.micGain,
                 silenceThreshold: appSettings.micSilenceThreshold,
                 correlationThreshold: appSettings.micCorrelationThreshold
            });
        }

        setActiveSong(song);
        setGameState({
            score: 0,
            combo: 0,
            multiplier: 1,
            health: 100,
            isPlaying: true,
            isPaused: false,
            gameStarted: true
        });
        setShowResult(false);
    } catch(err) {
        alert("Microphone access is required to play in Mic mode! Please allow permissions or switch to Touch mode in settings.");
    }
  };

  const handleScoreUpdate = useCallback((score: number, combo: number, rating: HitRating | null) => {
    setGameState(prev => ({
      ...prev,
      score,
      combo
    }));
    setLastRating(rating);
  }, []);

  const handleGameComplete = useCallback((finalScore: number) => {
    setGameState(prev => ({ ...prev, isPlaying: false }));
    setShowResult(true);
    audioService.stop();
  }, []);

  const exitGame = () => {
    setActiveSong(null);
    setGameState(prev => ({ ...prev, isPlaying: false, gameStarted: false }));
    audioService.stop();
  };

  const getFilteredSongs = () => {
      return SONGS.filter(s => s.category === activeTab);
  };

  // Render Logic
  
  if (isTunerOpen) {
      return (
        <SoundCheck 
            settings={appSettings}
            onBack={() => setIsTunerOpen(false)}
            onUpdateSettings={handleSaveSettings}
        />
      );
  }

  // Main Menu
  if (!gameState.gameStarted) {
    return (
      <div className="h-screen bg-slate-900 text-white flex flex-col items-center p-6 relative overflow-y-auto no-scrollbar">
        {/* Settings Modal */}
        <SettingsModal 
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            settings={appSettings}
            onSave={handleSaveSettings}
            onOpenTuner={() => { setIsSettingsOpen(false); setIsTunerOpen(true); }}
        />

        {/* Gear Icon */}
        <button 
            onClick={() => setIsSettingsOpen(true)}
            className="absolute top-6 right-6 z-40 bg-slate-800 p-3 rounded-full hover:bg-slate-700 transition-colors shadow-lg border border-slate-700 group"
        >
            <svg className="w-6 h-6 text-gray-300 group-hover:text-white transition-colors group-hover:rotate-90 duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        </button>

        {/* Background blobs */}
        <div className="fixed top-[-10%] left-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob pointer-events-none"></div>
        <div className="fixed top-[-10%] right-[-10%] w-96 h-96 bg-yellow-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 pointer-events-none"></div>

        <div className="flex flex-col items-center my-auto w-full max-w-md z-10 py-10 shrink-0">
            <h1 className="text-5xl md:text-7xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 drop-shadow-lg text-center">
            KALIMBA HERO
            </h1>
            <p className="text-gray-400 mb-8 text-center max-w-md">
                {appSettings.inputMode === 'Microphone' 
                 ? "Place your device above your 17-key Kalimba. Play the notes as they cross the line!"
                 : "Tap the keys on the bottom of the screen to play along virtually!"}
            </p>

            <div className="w-full space-y-4">
            
            {/* Speed Dial */}
            <div className="bg-slate-800/80 backdrop-blur rounded-2xl p-4 border border-slate-700 shadow-lg">
                <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-purple-300 uppercase tracking-wider">Practice Speed</span>
                <span className="text-xl font-black text-white">{speedMultiplier.toFixed(1)}x</span>
                </div>
                <input 
                type="range" min="0.5" max="1.5" step="0.1" 
                value={speedMultiplier}
                onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-purple-500 touch-pan-x"
                />
            </div>

            {/* Tab Categories */}
            <div className="flex space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
                {(['Classic', 'Hits', 'OST'] as SongCategory[]).map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveTab(cat)}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                            activeTab === cat 
                            ? 'bg-purple-600 text-white shadow-lg' 
                            : 'text-gray-400 hover:text-white hover:bg-slate-700'
                        }`}
                    >
                        {cat === 'OST' ? 'OST' : cat}
                    </button>
                ))}
            </div>

            {/* Song List */}
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-2 mb-2">Select Song</div>
            <div className="space-y-3 w-full">
                {getFilteredSongs().map(song => (
                    <button 
                    key={song.id}
                    onClick={() => startGame(song)}
                    className="w-full bg-slate-800/50 hover:bg-slate-700/80 backdrop-blur-sm border border-slate-700 hover:border-purple-500 p-4 rounded-2xl flex items-center justify-between group transition-all duration-300 shadow-lg hover:shadow-purple-500/20 hover:-translate-y-1"
                    >
                    <div className="text-left">
                        <div className="font-bold text-lg group-hover:text-purple-300 transition-colors">{song.title}</div>
                        <div className="text-sm text-gray-400">{song.artist} • {song.difficulty}</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                        </svg>
                    </div>
                    </button>
                ))}
            </div>
            
            <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-xs text-yellow-200 text-center">
                Mode: <span className="font-bold uppercase">{appSettings.inputMode}</span><br/>
                Use the Gear Icon ⚙️ to switch input modes.
            </div>
            </div>
        </div>
      </div>
    );
  }

  // Result Screen
  if (showResult) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 z-50 relative">
             <h2 className="text-4xl font-bold mb-4">Song Complete!</h2>
             <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-8">
                 {gameState.score.toLocaleString()} pts
             </div>
             
             <div className="flex gap-4">
                 <button 
                    onClick={() => startGame(activeSong!)}
                    className="bg-purple-600 hover:bg-purple-700 px-8 py-3 rounded-full font-bold shadow-lg shadow-purple-500/30 transition-all"
                 >
                    Replay
                 </button>
                 <button 
                    onClick={exitGame}
                    className="bg-gray-700 hover:bg-gray-600 px-8 py-3 rounded-full font-bold transition-all"
                 >
                    Menu
                 </button>
             </div>
        </div>
      )
  }

  // Game View
  return (
    <div className="relative w-full h-full overflow-hidden">
      {activeSong && (
        <GameContainer 
          song={activeSong} 
          speed={speedMultiplier}
          settings={appSettings}
          onSongComplete={handleGameComplete}
          onScoreUpdate={handleScoreUpdate}
        />
      )}
      
      <UIOverlay 
        score={gameState.score} 
        combo={gameState.combo}
        lastRating={lastRating}
        onExit={exitGame}
      />
    </div>
  );
};

export default App;
