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

    // Placeholders filled in Features 2-4
    playSfx(name) { /* Feature 2 */ },
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
