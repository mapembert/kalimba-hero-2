

export interface AudioConfig {
  silenceThreshold: number; // RMS value below which is considered silence
  correlationThreshold: number; // Correlation confidence (0-1) needed to accept a pitch
  gain: number; // Software amplification factor
}

export class AudioService {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private buffer: Float32Array = new Float32Array(2048);
  private isListening: boolean = false;
  private stream: MediaStream | null = null;

  // Smoothing variables
  private pitchHistory: number[] = [];
  private readonly historySize = 5;
  private lastProcessTime = 0;

  // Default Configuration
  private config: AudioConfig = {
    silenceThreshold: 0.005, 
    correlationThreshold: 0.8,
    gain: 5.0
  };

  setConfig(newConfig: Partial<AudioConfig>) {
    this.config = { ...this.config, ...newConfig };
    if (this.gainNode && this.audioContext && this.audioContext.state !== 'closed') {
        // Smooth transition for gain
        try {
            this.gainNode.gain.setTargetAtTime(this.config.gain, this.audioContext.currentTime, 0.1);
        } catch(e) {
            console.warn("Error setting gain target", e);
        }
    }
  }

  getConfig(): AudioConfig {
    return { ...this.config };
  }

  async initialize() {
    if (this.audioContext && this.audioContext.state !== 'closed') {
       if (this.audioContext.state === 'suspended') {
         await this.audioContext.resume();
       }
       return;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false 
        } 
      });
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create nodes
      this.mediaStreamSource = this.audioContext.createMediaStreamSource(this.stream);
      this.analyser = this.audioContext.createAnalyser();
      this.gainNode = this.audioContext.createGain();

      // Configure Gain based on config
      this.gainNode.gain.value = this.config.gain;

      // Configure Analyser
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.2; 

      // Connect graph: Source -> Gain -> Analyser
      this.mediaStreamSource.connect(this.gainNode);
      this.gainNode.connect(this.analyser);

      this.isListening = true;
      console.log("Microphone initialized");
    } catch (e) {
      console.error("Microphone access denied or error", e);
      throw e;
    }
  }

  getRMS(): number {
    if (!this.analyser || !this.isListening) return 0;
    this.analyser.getFloatTimeDomainData(this.buffer);
    let rms = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      rms += this.buffer[i] * this.buffer[i];
    }
    return Math.sqrt(rms / this.buffer.length);
  }

  /**
   * Improved Pitch Detection using Autocorrelation
   * Scans a specific frequency range to avoid "Infinity Hz" (offset 0) bugs.
   */
  getPitch(): number {
    if (!this.analyser || !this.isListening || !this.audioContext) return 0;

    // Throttle processing to ~60fps (16ms) to prevent over-calculation if called multiple times per frame
    const now = performance.now();
    if (now - this.lastProcessTime < 16 && this.pitchHistory.length > 0) {
        // Return last valid smoothed pitch
        return this.getSmoothedPitch();
    }
    this.lastProcessTime = now;

    this.analyser.getFloatTimeDomainData(this.buffer);
    const float32Array = this.buffer;
    const sampleRate = this.audioContext.sampleRate;

    // 1. RMS Silence Check
    let rms = 0;
    for (let i = 0; i < float32Array.length; i++) {
      rms += float32Array[i] * float32Array[i];
    }
    rms = Math.sqrt(rms / float32Array.length);
    
    if (rms < this.config.silenceThreshold) {
        this.updateHistory(0);
        return 0; 
    }

    // 2. Define Scan Range for Kalimba
    // RAISED MIN_FREQ from 80Hz to 180Hz. 
    // Reason: Standard 17-key Kalimba lowest note is C4 (261Hz).
    // Frequencies below ~200Hz are often "sub-harmonics" (octave down errors) or background rumble.
    const MAX_FREQ = 2000;
    const MIN_FREQ = 180; 
    const minOffset = Math.floor(sampleRate / MAX_FREQ);
    const maxOffset = Math.floor(sampleRate / MIN_FREQ);

    let bestOffset = -1;
    let bestCorrelation = 0;

    // 3. Autocorrelation within bounds
    for (let offset = minOffset; offset <= maxOffset; offset++) {
      let sum = 0;
      const len = float32Array.length - offset;
      
      for (let i = 0; i < len; i++) {
        sum += float32Array[i] * float32Array[i + offset];
      }
      
      const correlation = sum / len; 

      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
      }
    }

    // 4. Normalize correlation
    const confidence = bestCorrelation / (rms * rms); 

    let rawFrequency = 0;

    if (confidence > this.config.correlationThreshold && bestOffset > -1) {
      // 5. Parabolic Interpolation for precision
      let shift = 0;
      const prevC = this.getCorrelationAtOffset(float32Array, bestOffset - 1);
      const nextC = this.getCorrelationAtOffset(float32Array, bestOffset + 1);
      
      shift = (nextC - prevC) / (2 * (2 * bestCorrelation - nextC - prevC)); 
      if (isNaN(shift)) shift = 0;
      
      const preciseOffset = bestOffset + shift;
      rawFrequency = sampleRate / preciseOffset;
    }

    this.updateHistory(rawFrequency);
    return this.getSmoothedPitch();
  }

  private updateHistory(pitch: number) {
      this.pitchHistory.push(pitch);
      if (this.pitchHistory.length > this.historySize) {
          this.pitchHistory.shift();
      }
  }

  private getSmoothedPitch(): number {
      // Filter out 0s (silence) for average calculation unless mostly silent
      const validPitches = this.pitchHistory.filter(p => p > 0);
      
      // If mostly silent, return 0
      if (validPitches.length < this.pitchHistory.length / 2) {
          return 0;
      }

      // Return average of valid
      const sum = validPitches.reduce((a, b) => a + b, 0);
      return sum / validPitches.length;
  }

  private getCorrelationAtOffset(buffer: Float32Array, offset: number): number {
      if (offset < 0 || offset >= buffer.length) return 0;
      let sum = 0;
      const len = buffer.length - offset;
      for (let i = 0; i < len; i++) {
        sum += buffer[i] * buffer[i + offset];
      }
      return sum / len;
  }

  stop() {
    this.isListening = false;
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    // Cleanup nodes to prevent use-after-free in setConfig
    this.gainNode = null;
    this.analyser = null;
    this.mediaStreamSource = null;
  }
}

export const audioService = new AudioService();
