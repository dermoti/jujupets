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
    playMusic() { /* Feature 3 */ },
    stopMusic() { /* Feature 3 */ },

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
