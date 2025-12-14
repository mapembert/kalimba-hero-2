
import Phaser from 'phaser';
import { Song, HitRating, SongNote, AppSettings, NoteDefinition } from '../types';
import { GAME_CONFIG, KALIMBA_KEYS, getKeyIndex, getNoteFromFrequency } from '../constants';
import { audioService } from '../services/audioService';

export default class MainScene extends Phaser.Scene {
  private song: Song;
  private speedMultiplier: number;
  private settings: AppSettings;
  private notesGroup!: Phaser.GameObjects.Group;
  private keyZones: Phaser.GameObjects.Shape[] = [];
  private laneLines: Phaser.GameObjects.Line[] = [];
  private hitLine!: Phaser.GameObjects.Line;
  private startTime: number = 0;
  private songCompleteCallback: (score: number) => void;
  private scoreUpdateCallback: (score: number, combo: number, rating: HitRating | null) => void;
  private currentScore: number = 0;
  private currentCombo: number = 0;
  
  // Note Queues
  private spawnQueue: SongNote[] = []; // For visuals
  private audioQueue: SongNote[] = []; // For playback
  
  private gameWidth: number = 0;
  private gameHeight: number = 0;
  private laneWidth: number = 0;
  private lastPitchCheck: number = 0;
  private scrollSpeed: number = 0; // Pixels per second
  private isGameRunning: boolean = false;
  private hasFinished: boolean = false;

  // Explicitly declare properties to satisfy TypeScript
  public add!: Phaser.GameObjects.GameObjectFactory;
  public make!: Phaser.GameObjects.GameObjectCreator;
  public scale!: Phaser.Scale.ScaleManager;
  public time!: Phaser.Time.Clock;
  public tweens!: Phaser.Tweens.TweenManager;
  public cameras!: Phaser.Cameras.Scene2D.CameraManager;
  public sound!: Phaser.Sound.BaseSoundManager;
  public input!: Phaser.Input.InputPlugin;
  public textures!: Phaser.Textures.TextureManager;

  constructor(
    song: Song, 
    speed: number, 
    settings: AppSettings,
    onComplete: (score: number) => void, 
    onScoreUpdate: (s: number, c: number, r: HitRating | null) => void
  ) {
    super('MainScene');
    this.song = song;
    this.speedMultiplier = speed;
    this.settings = settings;
    this.songCompleteCallback = onComplete;
    this.scoreUpdateCallback = onScoreUpdate;
  }

  preload() {
    // Preload is for loading assets from disk. 
    // Procedural generation moved to create() to avoid Framebuffer errors.
  }

  create() {
    console.log('MainScene.create() called', this.scale.width, this.scale.height);
    // Skip texture creation - we'll use graphics objects instead
    this.updateLayoutVars(this.scale.width, this.scale.height);

    // Background
    this.add.rectangle(0, 0, 3000, 3000, 0x111827).setOrigin(0);

    // Initial Layout Construction
    this.createLayout();
    console.log('Layout created, starting countdown');

    // Note Group
    this.notesGroup = this.add.group();

    // 1. Visual Queue: Shifted by fallDuration
    this.spawnQueue = this.song.notes.map(n => ({
        ...n,
        time: (n.time / this.speedMultiplier) + GAME_CONFIG.fallDuration
    }));
    this.spawnQueue.sort((a, b) => a.time - b.time);

    // 2. Audio Queue
    this.audioQueue = [...this.spawnQueue]; 

    // Handle Resize
    this.scale.on('resize', this.handleResize, this);

    // Start Sequence
    this.startCountdown();
  }

  startCountdown() {
    console.log('startCountdown() called', this.gameWidth, this.gameHeight);
    this.isGameRunning = false;
    const centerX = this.gameWidth / 2;
    const centerY = this.gameHeight / 2;

    const countText = this.add.text(centerX, centerY, "", {
      fontSize: '120px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#4f46e5',
      strokeThickness: 8
    }).setOrigin(0.5).setDepth(100).setAlpha(0);

    this.tweens.chain({
        targets: countText,
        tweens: [
            // 3
            {
                alpha: { from: 0, to: 1 },
                scale: { from: 2, to: 1 },
                duration: 400,
                onStart: () => { 
                    countText.setText("3"); 
                    // Only start mic if in mic mode
                    if (this.settings.inputMode === 'Microphone') {
                        audioService.initialize(); 
                    }
                }
            },
            {
                alpha: 0,
                scale: 0.5,
                duration: 400,
                delay: 200
            },
            // 2
            {
                alpha: { from: 0, to: 1 },
                scale: { from: 2, to: 1 },
                duration: 400,
                onStart: () => countText.setText("2")
            },
            {
                alpha: 0,
                scale: 0.5,
                duration: 400,
                delay: 200
            },
            // 1
            {
                alpha: { from: 0, to: 1 },
                scale: { from: 2, to: 1 },
                duration: 400,
                onStart: () => countText.setText("1")
            },
            {
                alpha: 0,
                scale: 0.5,
                duration: 400,
                delay: 200
            },
            // GO
            {
                alpha: { from: 0, to: 1 },
                scale: { from: 2, to: 1 },
                duration: 300,
                onStart: () => {
                    countText.setText("GO!");
                    countText.setColor('#4ade80');
                    this.startGame();
                }
            },
            {
                alpha: 0,
                scale: 3,
                duration: 500
            }
        ]
    });
  }

  startGame() {
      this.startTime = this.time.now;
      this.isGameRunning = true;
      this.hasFinished = false;
  }

  updateLayoutVars(width: number, height: number) {
    this.gameWidth = width;
    this.gameHeight = height;
    this.laneWidth = this.gameWidth / 17;
    // Calculate speed so notes fall over 'fallDuration' milliseconds to reach the target line
    const targetY = this.gameHeight * GAME_CONFIG.hitLineY;
    this.scrollSpeed = targetY / (GAME_CONFIG.fallDuration / 1000);
  }

  createLayout() {
    const targetY = this.gameHeight * GAME_CONFIG.hitLineY;

    // Clear existing if resizing
    this.laneLines.forEach(l => l.destroy());
    this.laneLines = [];
    this.keyZones.forEach(k => {
        if((k as any).labelObj) (k as any).labelObj.destroy();
        k.destroy();
    });
    this.keyZones = [];
    if (this.hitLine) this.hitLine.destroy();

    // Create Lanes and Key Zones
    KALIMBA_KEYS.forEach((key, index) => {
      const x = index * this.laneWidth + (this.laneWidth / 2);
      
      // Vertical Lane lines (separators)
      if (index > 0) {
          const line = this.add.line(0, 0, index * this.laneWidth, 0, index * this.laneWidth, this.gameHeight, 0x374151, 0.2).setOrigin(0);
          this.laneLines.push(line);
      }

      // VIRTUAL TOUCH KEY: Extends from hitLineY to bottom
      const keyHeight = this.gameHeight - targetY;
      const keyY = targetY + (keyHeight / 2); // Center of the key area
      
      // Use a rectangle for the interactive key zone to make it look like a Kalimba tine
      const keyRect = this.add.rectangle(x, keyY, this.laneWidth - 2, keyHeight - 4, key.color, 0.3)
         .setStrokeStyle(2, key.color);

      // Add hit circle (visual target) at the top of the key
      const zoneRadius = Math.min(this.laneWidth * 0.4, 20);
      const hitCircle = this.add.circle(x, targetY, zoneRadius, key.color)
        .setAlpha(0.6)
        .setStrokeStyle(1, 0xffffff);

      // Label (put on the key)
      const label = this.add.text(x, targetY + 30, key.label, { 
        fontSize: '14px', 
        fontFamily: 'monospace',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      // Interactions for Virtual Mode
      if (this.settings.inputMode === 'Touch') {
          keyRect.setInteractive();
          keyRect.on('pointerdown', () => {
              this.handleTouchInput(key, keyRect);
          });
      }

      // Group elements for cleanup
      (keyRect as any).labelObj = label;
      (keyRect as any).hitCircle = hitCircle;
      this.keyZones.push(keyRect);
    });

    // Hit Line (Visual Guide across screen)
    this.hitLine = this.add.line(0, 0, 0, targetY, this.gameWidth, targetY, 0xffffff, 0.5).setOrigin(0);
  }

  handleTouchInput(keyDef: NoteDefinition, keyRect: Phaser.GameObjects.Rectangle) {
      // 1. Visual Feedback
      keyRect.setAlpha(0.8);
      this.tweens.add({
          targets: keyRect,
          alpha: 0.3,
          duration: 150
      });

      // 2. Audio Feedback (Always play in touch mode)
      this.playTone(keyDef.frequency, 1.0); // Full volume for user interaction

      // 3. Logic Check
      const songTime = this.time.now - this.startTime;
      this.validateHit(keyDef, songTime);
  }

  handleResize(gameSize: Phaser.Structs.Size) {
    this.updateLayoutVars(gameSize.width, gameSize.height);
    this.createLayout(); // Re-draw static elements

    // Re-position active notes
    this.notesGroup.getChildren().forEach((gameObject: any) => {
       const note = gameObject as Phaser.GameObjects.Container;
       const keyIndex = note.getData('keyIndex');
       const x = keyIndex * this.laneWidth + (this.laneWidth / 2);
       note.x = x;
    });
  }

  update(time: number, delta: number) {
    if (!this.isGameRunning || this.hasFinished) return;

    const songTime = time - this.startTime;

    // 1. Spawn Visual Notes
    if (this.spawnQueue.length > 0) {
      if (this.spawnQueue[0].time - GAME_CONFIG.fallDuration <= songTime) { 
         const noteData = this.spawnQueue.shift();
         if (noteData) {
            this.spawnNote(noteData);
         }
      }
    }

    // 2. Play Audio Guide (Automated)
    if (this.settings.enableGuideAudio && this.audioQueue.length > 0) {
        if (this.audioQueue[0].time <= songTime) {
            const noteData = this.audioQueue.shift();
            if (noteData) {
                const def = KALIMBA_KEYS[getKeyIndex(noteData.noteName)];
                if (def) {
                    this.playTone(def.frequency, this.settings.guideVolume);
                }
            }
        }
    } else if (!this.settings.enableGuideAudio && this.audioQueue.length > 0) {
        if (this.audioQueue[0].time <= songTime) {
            this.audioQueue.shift();
        }
    }

    // 3. Move Notes
    const targetY = this.gameHeight * GAME_CONFIG.hitLineY;
    const missThreshold = targetY + (this.gameHeight * 0.1); 
    
    this.notesGroup.getChildren().forEach((gameObject: any) => {
      const note = gameObject as Phaser.GameObjects.Container;
      const msUntilHit = note.getData('time') - songTime;
      
      // Calculate Y position
      const y = targetY - (msUntilHit / 1000) * this.scrollSpeed;
      note.y = y;

      // Simple perspective scale
      const progress = Phaser.Math.Clamp(y / targetY, 0, 1.2);
      const scale = 0.8 + (progress * 0.4);
      note.setScale(scale);

      // Miss detection
      if (y > missThreshold && !note.getData('hit') && !note.getData('missed')) {
        note.setData('missed', true);
        note.setAlpha(0.5);
        note.each((child: any) => {
          if (child.setFillStyle) child.setFillStyle(0x555555);
        });
        this.handleMiss();
      }

      // Cleanup
      if (y > this.gameHeight + 100) {
        note.destroy();
      }
    });

    // 4. Pitch Detection (Only if in Microphone Mode)
    if (this.settings.inputMode === 'Microphone') {
        if (time > this.lastPitchCheck + 50) {
          const detectedFreq = audioService.getPitch();
          if (detectedFreq > 0) {
            const detectedNoteObj = getNoteFromFrequency(detectedFreq);
            if (detectedNoteObj) {
                this.validateHit(detectedNoteObj, songTime);
            }
          }
          this.lastPitchCheck = time;
        }
    }
    
    // Check for song end
    if (this.spawnQueue.length === 0 && this.notesGroup.getLength() === 0) {
       this.hasFinished = true;
       this.time.delayedCall(2000, () => {
          this.songCompleteCallback(this.currentScore);
       });
    }
  }

  playTone(frequency: number, volume: number) {
      if (!this.sound.context) return;
      
      const ctx = this.sound.context as AudioContext;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      
      // Simple Envelope: Quick Attack, Decay
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume * 0.5, ctx.currentTime + 0.05); // Attack
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0); // Decay
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 1.0);
  }

  spawnNote(noteData: SongNote) {
    const keyIndex = getKeyIndex(noteData.noteName);
    if (keyIndex === -1) return;

    const x = keyIndex * this.laneWidth + (this.laneWidth / 2);
    const def = KALIMBA_KEYS[keyIndex];

    const note = this.add.container(x, -100); 
    
    const radius = Math.min(this.laneWidth * 0.35, 25);
    const circle = this.add.circle(0, 0, radius, def.color);
    circle.setStrokeStyle(2, 0xffffff);
    
    const tailHeight = Math.min(this.laneWidth, 40);
    const tail = this.add.rectangle(0, -tailHeight/2, radius, tailHeight, def.color, 0.5);
    
    note.add([tail, circle]);
    
    note.setData('time', noteData.time);
    note.setData('keyIndex', keyIndex);
    note.setData('frequency', def.frequency);
    note.setData('name', def.name);
    note.setData('hit', false);
    note.setData('missed', false);

    this.notesGroup.add(note);
  }

  // Generalized hit validation for both Mic and Touch
  validateHit(detectedNote: NoteDefinition, songTime: number) {
    const hitWindow = GAME_CONFIG.hitWindow;
    
    // Time validation
    const timeCandidates = this.notesGroup.getChildren().filter((obj: any) => {
      const noteTime = obj.getData('time');
      const isHit = obj.getData('hit');
      const isMissed = obj.getData('missed');
      const timeDiff = Math.abs(noteTime - songTime);
      return timeDiff < hitWindow && !isHit && !isMissed;
    });

    if (timeCandidates.length === 0) return;

    // Frequency/Note Name validation
    const hitNote = timeCandidates.find((obj: any) => {
        const noteFreq = obj.getData('frequency');
        const noteName = obj.getData('name');
        
        // Exact name match (Touch) OR Frequency match (Mic)
        if (noteName === detectedNote.name) return true;

        // If Mic mode, allow harmonics
        if (this.settings.inputMode === 'Microphone') {
            const freqDiff = Math.abs(noteFreq - detectedNote.frequency);
            const octaveDownDiff = Math.abs((detectedNote.frequency * 2) - noteFreq);
            const octaveUpDiff = Math.abs((detectedNote.frequency / 2) - noteFreq);
            const allowedDiff = noteFreq * 0.06;

            if (freqDiff < allowedDiff || octaveDownDiff < allowedDiff || octaveUpDiff < allowedDiff) {
                return true;
            }
        }
        return false;
    });

    if (hitNote) {
      this.handleHit(hitNote, songTime);
    }
  }

  handleHit(note: any, songTime: number) {
    note.setData('hit', true);
    const diff = Math.abs(note.getData('time') - songTime);
    
    let rating = HitRating.OK;
    let scoreAdd = 50;
    let burstColor = 0x3b82f6; 
    
    if (diff < GAME_CONFIG.perfectWindow) {
      rating = HitRating.PERFECT;
      scoreAdd = 300;
      burstColor = 0xFFD700;
    } else if (diff < GAME_CONFIG.goodWindow) {
      rating = HitRating.GOOD;
      scoreAdd = 100;
      burstColor = 0x4ade80;
    }
    
    this.createBurst(note.x, note.y, burstColor, rating === HitRating.PERFECT); 
    this.currentCombo++;
    const multiplier = Math.min(4, 1 + Math.floor(this.currentCombo / 10));
    this.currentScore += scoreAdd * multiplier;
    this.scoreUpdateCallback(this.currentScore, this.currentCombo, rating);

    // Visual feedback
    this.tweens.add({
      targets: note,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 200,
      onComplete: () => note.destroy()
    });

    // Flash key zone
    const keyIndex = note.getData('keyIndex');
    if (this.keyZones[keyIndex]) {
       const zone = this.keyZones[keyIndex];
       zone.setAlpha(0.8);
       this.tweens.add({
         targets: zone,
         alpha: 0.3,
         duration: 200
       });
    }
  }

  handleMiss() {
    this.currentCombo = 0;
    this.scoreUpdateCallback(this.currentScore, 0, HitRating.MISS);
    this.cameras.main.shake(100, 0.005);
  }

  createBurst(x: number, y: number, color: number, big: boolean) {
    const count = big ? 20 : 10;
    for(let i=0; i<count; i++) {
      // Use graphics circle instead of texture-based particle
      const p = this.add.circle(x, y, 4, color);
      const angle = Phaser.Math.Between(0, 360);
      const speed = Phaser.Math.Between(50, big ? 200 : 100);
      
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0.1,
        duration: 500,
        onComplete: () => p.destroy()
      });
    }
  }
}
