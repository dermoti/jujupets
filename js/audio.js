const STORAGE_KEY = 'jujupets-audio';

function clamp01(v) { return Math.max(0, Math.min(1, v)); }

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return null;
}

function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) { /* ignore */ }
}

function createNoiseBuffer(ctx, duration) {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

export function createAudioEngine() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();

  // Master gain
  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);

  // Channel gains
  const musicGain = ctx.createGain();
  musicGain.connect(masterGain);

  const sfxGain = ctx.createGain();
  sfxGain.connect(masterGain);

  const ambientGain = ctx.createGain();
  ambientGain.connect(masterGain);

  // State
  let muted = false;
  let musicPlaying = false;
  let musicVolume = 0.5;
  let sfxVolume = 0.7;
  let ambientVolume = 0.3;

  // Load persisted settings
  const saved = loadSettings();
  if (saved) {
    musicVolume = clamp01(saved.musicVolume ?? 0.5);
    sfxVolume = clamp01(saved.sfxVolume ?? 0.7);
    ambientVolume = clamp01(saved.ambientVolume ?? 0.3);
    muted = !!saved.muted;
  }

  // Apply initial volumes
  musicGain.gain.value = musicVolume;
  sfxGain.gain.value = sfxVolume;
  ambientGain.gain.value = ambientVolume;
  masterGain.gain.value = muted ? 0 : 1;

  function persist() {
    saveSettings({ musicVolume, sfxVolume, ambientVolume, muted });
  }

  // Sequencer state (populated in Feature 3)
  let sequencerTimer = null;

  // Ambient state (populated in Feature 4)
  let ambientNodes = null;

  return {
    get isMusicPlaying() { return musicPlaying; },
    get isMuted() { return muted; },

    // Volume setters
    setMusicVolume(v) {
      musicVolume = clamp01(v);
      musicGain.gain.value = musicVolume;
      persist();
    },
    setSfxVolume(v) {
      sfxVolume = clamp01(v);
      sfxGain.gain.value = sfxVolume;
      persist();
    },
    setAmbientVolume(v) {
      ambientVolume = clamp01(v);
      ambientGain.gain.value = ambientVolume;
      persist();
    },

    // Mute
    setMasterMute(val) {
      muted = !!val;
      masterGain.gain.value = muted ? 0 : 1;
      persist();
    },

    // Resume (called on first user gesture)
    resume() {
      if (ctx.state === 'suspended') ctx.resume();
    },

    // SFX registry (Feature 2)
    playSfx(name) {
      if (muted) return;
      const now = ctx.currentTime;

      const sfxRegistry = new Map([
        ['click', () => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = 1000;
          g.gain.setValueAtTime(0.3, now);
          g.gain.linearRampToValueAtTime(0, now + 0.05);
          osc.connect(g);
          g.connect(sfxGain);
          osc.start(now);
          osc.stop(now + 0.05);
        }],
        ['dialog_open', () => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(400, now);
          osc.frequency.linearRampToValueAtTime(800, now + 0.1);
          g.gain.value = 0.2;
          osc.connect(g);
          g.connect(sfxGain);
          osc.start(now);
          osc.stop(now + 0.1);
        }],
        ['dialog_close', () => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, now);
          osc.frequency.linearRampToValueAtTime(400, now + 0.1);
          g.gain.value = 0.2;
          osc.connect(g);
          g.connect(sfxGain);
          osc.start(now);
          osc.stop(now + 0.1);
        }],
        ['adopt_fanfare', () => {
          const notes = [523, 659, 784, 1047];
          notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            g.gain.value = 0.25;
            osc.connect(g);
            g.connect(sfxGain);
            const start = now + i * 0.1;
            osc.start(start);
            osc.stop(start + 0.1);
          });
        }],
        ['cha_ching', () => {
          [0, 0.05].forEach(offset => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = 2000;
            g.gain.value = 0.3;
            osc.connect(g);
            g.connect(sfxGain);
            const start = now + offset;
            osc.start(start);
            osc.stop(start + 0.03);
          });
        }],
        ['alert', () => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.value = 200;
          g.gain.setValueAtTime(0.3, now);
          g.gain.linearRampToValueAtTime(0, now + 0.2);
          osc.connect(g);
          g.connect(sfxGain);
          osc.start(now);
          osc.stop(now + 0.2);
        }],
        ['bark', () => {
          // Noise burst
          const noiseSource = ctx.createBufferSource();
          noiseSource.buffer = createNoiseBuffer(ctx, 0.08);
          const noiseGain = ctx.createGain();
          noiseGain.gain.value = 0.2;
          noiseSource.connect(noiseGain);
          noiseGain.connect(sfxGain);
          noiseSource.start(now);
          noiseSource.stop(now + 0.08);
          // Overlapping sine
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = 300;
          g.gain.value = 0.2;
          osc.connect(g);
          g.connect(sfxGain);
          osc.start(now);
          osc.stop(now + 0.08);
        }],
        ['meow', () => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600, now);
          osc.frequency.linearRampToValueAtTime(400, now + 0.15);
          g.gain.value = 0.15;
          osc.connect(g);
          g.connect(sfxGain);
          osc.start(now);
          osc.stop(now + 0.15);
        }],
        ['chirp', () => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1500, now);
          osc.frequency.linearRampToValueAtTime(2000, now + 0.05);
          osc.frequency.linearRampToValueAtTime(1500, now + 0.1);
          g.gain.value = 0.15;
          osc.connect(g);
          g.connect(sfxGain);
          osc.start(now);
          osc.stop(now + 0.1);
        }],
        ['squeak', () => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = 1800;
          g.gain.value = 0.2;
          osc.connect(g);
          g.connect(sfxGain);
          osc.start(now);
          osc.stop(now + 0.04);
        }],
      ]);

      const factory = sfxRegistry.get(name);
      if (factory) factory();
    },
    playMusic() {
      if (musicPlaying) return;
      musicPlaying = true;

      // ── Sequencer constants ──────────────────────────────────────────────
      const TEMPO          = 90;
      const BEAT_DURATION  = 60 / TEMPO;          // ≈ 0.667 s
      const LOOKAHEAD      = 0.1;                 // seconds ahead to schedule
      const SCHEDULE_MS    = 25;                  // scheduler tick interval
      const TOTAL_BEATS    = 64;                  // 16 bars × 4 beats
      const BEATS_PER_BAR  = 4;
      const BARS           = TOTAL_BEATS / BEATS_PER_BAR; // 16

      // C major pentatonic – melody (square wave)
      // freq, startBeat (0-based within 64-beat loop), durationBeats
      const MELODY = [
        // Bar 1-2: ascending phrase C5-E5-G5-A5
        { f: 523, b: 0,    d: 0.75 },
        { f: 659, b: 1,    d: 0.75 },
        { f: 784, b: 2,    d: 0.75 },
        { f: 880, b: 3,    d: 0.5  },
        // Bar 3: step back G5-E5
        { f: 784, b: 4,    d: 0.5  },
        { f: 659, b: 5,    d: 0.75 },
        // Bar 4: rest, then land on D5
        { f: 587, b: 7,    d: 1.5  },
        // Bar 5-6: ornamented phrase G5-A5-G5-E5
        { f: 784, b: 8,    d: 0.5  },
        { f: 880, b: 9,    d: 0.5  },
        { f: 784, b: 10,   d: 0.5  },
        { f: 659, b: 11,   d: 0.75 },
        // Bar 7: falling A5-G5
        { f: 880, b: 12,   d: 0.75 },
        { f: 784, b: 13,   d: 0.5  },
        // Bar 8: resolve to C5
        { f: 523, b: 15,   d: 1.5  },
        // Bar 9-10: variation – start on D5
        { f: 587, b: 16,   d: 0.75 },
        { f: 659, b: 17,   d: 0.75 },
        { f: 784, b: 18,   d: 0.5  },
        { f: 880, b: 19,   d: 0.75 },
        // Bar 11: A5-G5-E5 descent
        { f: 880, b: 20,   d: 0.5  },
        { f: 784, b: 21,   d: 0.5  },
        { f: 659, b: 22,   d: 0.75 },
        // Bar 12: D5 hold
        { f: 587, b: 23,   d: 1.5  },
        // Bar 13-14: high phrase A5-A5-G5-E5
        { f: 880, b: 24,   d: 0.5  },
        { f: 880, b: 25,   d: 0.25 },
        { f: 784, b: 26,   d: 0.5  },
        { f: 659, b: 27,   d: 0.75 },
        // Bar 15: G5-D5
        { f: 784, b: 28,   d: 0.5  },
        { f: 587, b: 29,   d: 0.5  },
        // Bar 16: final C5
        { f: 523, b: 31,   d: 2.0  },
        // Bars 17-32 (repeat with slight variation – shift up by repeating same data offset +32)
        { f: 523, b: 32,   d: 0.75 },
        { f: 659, b: 33,   d: 0.75 },
        { f: 784, b: 34,   d: 0.5  },
        { f: 880, b: 35,   d: 0.5  },
        { f: 784, b: 36,   d: 0.5  },
        { f: 659, b: 37,   d: 0.75 },
        { f: 587, b: 39,   d: 1.5  },
        { f: 784, b: 40,   d: 0.5  },
        { f: 880, b: 41,   d: 0.5  },
        { f: 784, b: 42,   d: 0.5  },
        { f: 659, b: 43,   d: 0.75 },
        { f: 880, b: 44,   d: 0.75 },
        { f: 784, b: 45,   d: 0.5  },
        { f: 523, b: 47,   d: 1.5  },
        { f: 587, b: 48,   d: 0.75 },
        { f: 659, b: 49,   d: 0.75 },
        { f: 784, b: 50,   d: 0.5  },
        { f: 880, b: 51,   d: 0.75 },
        { f: 880, b: 52,   d: 0.5  },
        { f: 784, b: 53,   d: 0.5  },
        { f: 659, b: 54,   d: 0.75 },
        { f: 587, b: 55,   d: 1.5  },
        { f: 880, b: 56,   d: 0.5  },
        { f: 880, b: 57,   d: 0.25 },
        { f: 784, b: 58,   d: 0.5  },
        { f: 659, b: 59,   d: 0.75 },
        { f: 784, b: 60,   d: 0.5  },
        { f: 587, b: 61,   d: 0.5  },
        { f: 523, b: 63,   d: 2.0  },
      ];

      // Build a lookup map: beat → list of events
      const beatEvents = {};

      // Populate melody events
      for (const note of MELODY) {
        const b = note.b;
        if (!beatEvents[b]) beatEvents[b] = [];
        beatEvents[b].push({ type: 'melody', freq: note.f, dur: note.d * BEAT_DURATION });
      }

      // Bass: one whole note per bar, cycling C-F-G-Am
      const bassRoots = [131, 175, 196, 220]; // C3, F3, G3, A3
      for (let bar = 0; bar < BARS; bar++) {
        const beat = bar * BEATS_PER_BAR;
        const freq = bassRoots[bar % 4];
        if (!beatEvents[beat]) beatEvents[beat] = [];
        beatEvents[beat].push({ type: 'bass', freq, dur: BEAT_DURATION * BEATS_PER_BAR });
      }

      // Hi-hat on every half-beat (0, 0.5, 1, 1.5 …) – stored as fractional keys but we
      // schedule them together with each integer beat.
      // Kick on every beat.

      // ── Scheduling helpers ───────────────────────────────────────────────
      function scheduleMelody(freq, startTime, dur) {
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        osc.connect(env);
        env.connect(musicGain);

        const attack  = 0.01;
        const decay   = 0.05;
        const sustain = 0.6;
        const release = 0.05;
        const peakGain = 0.18;

        env.gain.setValueAtTime(0, startTime);
        env.gain.linearRampToValueAtTime(peakGain, startTime + attack);
        env.gain.linearRampToValueAtTime(peakGain * sustain, startTime + attack + decay);
        env.gain.setValueAtTime(peakGain * sustain, startTime + dur - release);
        env.gain.linearRampToValueAtTime(0, startTime + dur);

        osc.start(startTime);
        osc.stop(startTime + dur + 0.01);
      }

      function scheduleBass(freq, startTime, dur) {
        const osc = ctx.createOscillator();
        const g   = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0.22, startTime);
        g.gain.setValueAtTime(0.22, startTime + dur - 0.05);
        g.gain.linearRampToValueAtTime(0, startTime + dur);
        osc.connect(g);
        g.connect(musicGain);
        osc.start(startTime);
        osc.stop(startTime + dur + 0.01);
      }

      function scheduleHiHat(startTime) {
        const src = ctx.createBufferSource();
        src.buffer = createNoiseBuffer(ctx, 0.05);
        const hpf = ctx.createBiquadFilter();
        hpf.type = 'highpass';
        hpf.frequency.value = 8000;
        const g = ctx.createGain();
        g.gain.value = 0.05;
        src.connect(hpf);
        hpf.connect(g);
        g.connect(musicGain);
        src.start(startTime);
        src.stop(startTime + 0.05);
      }

      function scheduleKick(startTime) {
        const osc = ctx.createOscillator();
        const g   = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, startTime);
        osc.frequency.exponentialRampToValueAtTime(60, startTime + 0.15);
        g.gain.setValueAtTime(0.3, startTime);
        g.gain.linearRampToValueAtTime(0, startTime + 0.15);
        osc.connect(g);
        g.connect(musicGain);
        osc.start(startTime);
        osc.stop(startTime + 0.15);
      }

      // ── Scheduler loop ───────────────────────────────────────────────────
      let nextBeatTime  = ctx.currentTime;
      let currentBeat   = 0;

      function scheduleBeats() {
        while (nextBeatTime < ctx.currentTime + LOOKAHEAD) {
          const beatStart = nextBeatTime;

          // Kick on every beat
          scheduleKick(beatStart);

          // Hi-hat on this beat and the half-beat after
          scheduleHiHat(beatStart);
          scheduleHiHat(beatStart + BEAT_DURATION * 0.5);

          // Melodic / bass events for this beat
          const events = beatEvents[currentBeat];
          if (events) {
            for (const ev of events) {
              if (ev.type === 'melody') scheduleMelody(ev.freq, beatStart, ev.dur);
              else if (ev.type === 'bass') scheduleBass(ev.freq, beatStart, ev.dur);
            }
          }

          nextBeatTime += BEAT_DURATION;
          currentBeat   = (currentBeat + 1) % TOTAL_BEATS;
        }
      }

      sequencerTimer = setInterval(scheduleBeats, SCHEDULE_MS);
      scheduleBeats(); // kick off immediately

      // ── Ambient layer ────────────────────────────────────────────────────
      // Wind: 2 s looping noise → lowpass 500 Hz → gain 0.05
      const windBuffer = createNoiseBuffer(ctx, 2);
      const windSrc    = ctx.createBufferSource();
      windSrc.buffer   = windBuffer;
      windSrc.loop     = true;
      const windLPF    = ctx.createBiquadFilter();
      windLPF.type     = 'lowpass';
      windLPF.frequency.value = 500;
      const windGain   = ctx.createGain();
      windGain.gain.value = 0.05;
      windSrc.connect(windLPF);
      windLPF.connect(windGain);
      windGain.connect(ambientGain);
      windSrc.start();

      // Bird chirps: random interval 5–10 s
      function chirpBird() {
        const freq = 1200 + Math.random() * 800;
        const now  = ctx.currentTime;
        const dur  = 0.08;
        const osc  = ctx.createOscillator();
        const g    = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.linearRampToValueAtTime(freq * 1.25, now + dur * 0.4);
        osc.frequency.linearRampToValueAtTime(freq, now + dur);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.08, now + 0.01);
        g.gain.linearRampToValueAtTime(0, now + dur);
        osc.connect(g);
        g.connect(ambientGain);
        osc.start(now);
        osc.stop(now + dur + 0.01);
      }

      function scheduleBirdChirp() {
        if (!ambientNodes) return; // guard against race with stopMusic
        chirpBird();
        const nextDelay = 5000 + Math.random() * 5000;
        ambientNodes.birdTimer = setTimeout(scheduleBirdChirp, nextDelay);
      }

      ambientNodes = {
        windSrc,
        birdTimer: setTimeout(scheduleBirdChirp, 5000 + Math.random() * 5000),
      };
    },

    stopMusic() {
      if (!musicPlaying) return;
      musicPlaying = false;

      // Stop sequencer
      if (sequencerTimer !== null) {
        clearInterval(sequencerTimer);
        sequencerTimer = null;
      }

      // Stop ambient
      if (ambientNodes) {
        try { ambientNodes.windSrc.stop(); } catch (e) { /* already stopped */ }
        clearTimeout(ambientNodes.birdTimer);
        ambientNodes = null;
      }
    },

    // Internals exposed for other features to wire into
    _ctx: ctx,
    _sfxGain: sfxGain,
    _musicGain: musicGain,
    _ambientGain: ambientGain,
    _getMusicVolume() { return musicVolume; },
    _getSfxVolume() { return sfxVolume; },
    _getAmbientVolume() { return ambientVolume; },
  };
}
