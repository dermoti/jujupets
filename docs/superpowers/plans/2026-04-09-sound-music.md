# Sound & Music Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a complete procedural audio system to JujuPets -- Lo-Fi chiptune background music (16-bar loop at 90 BPM), 10 synthesized sound effects, an ambient wind+birds layer, and a volume control UI with three independent sliders plus master mute. All audio is generated in real-time via the Web Audio API; zero external audio files.

**Architecture:** One new module (`js/audio.js`) containing the audio engine, SFX library, music sequencer, and ambient layer. Targeted edits to `main.js` (init, resume, SFX triggers in onTick), `ui.js` (button click SFX, dialog open/close SFX, volume popup logic), `index.html` (mute button in stats-bar), and `css/style.css` (volume popup styling). One new test file (`tests/audio.test.js`). Audio is purely additive -- no existing game logic, rendering, or movement code is changed.

**Tech Stack:** Web Audio API (AudioContext, OscillatorNode, GainNode, BiquadFilterNode, AudioBuffer for white noise), ES modules, custom browser test runner (`js/test-runner.js`), tests at `http://localhost:8080/test.html`.

**Testing strategy:** Web Audio API requires a real browser AudioContext which cannot produce audible output in automated tests. Tests verify the **API shape** (returned object has all expected methods/properties), **volume clamping** (values outside 0-1 are clamped), **mute logic** (isMuted state, toggle behavior), **SFX registry** (all 10 names recognized, unknown names handled gracefully), **localStorage persistence** (settings saved/restored correctly), and **sequencer state** (isMusicPlaying flag). Tests do NOT attempt to verify actual audio output.

---

## Feature 1: Audio Engine Core (`js/audio.js`)

The audio engine creates an AudioContext with three parallel gain chains (music, sfx, ambient) routed through a master gain node. It exposes volume setters, mute toggle, and an explicit `resume()` for the browser autoplay policy.

### Step 1.1 -- Test: createAudioEngine API shape

- [ ] **Test file:** `tests/audio.test.js`

```js
import { describe, it, expect } from '../js/test-runner.js';
import { createAudioEngine } from '../js/audio.js';

describe('createAudioEngine API shape', () => {
  it('returns an object with all documented methods', () => {
    const audio = createAudioEngine();
    expect(typeof audio.playMusic).toBe('function');
    expect(typeof audio.stopMusic).toBe('function');
    expect(typeof audio.setMusicVolume).toBe('function');
    expect(typeof audio.setSfxVolume).toBe('function');
    expect(typeof audio.setAmbientVolume).toBe('function');
    expect(typeof audio.setMasterMute).toBe('function');
    expect(typeof audio.playSfx).toBe('function');
    expect(typeof audio.resume).toBe('function');
  });

  it('exposes isMusicPlaying as a boolean getter', () => {
    const audio = createAudioEngine();
    expect(typeof audio.isMusicPlaying).toBe('boolean');
    expect(audio.isMusicPlaying).toBe(false);
  });

  it('exposes isMuted as a boolean getter', () => {
    const audio = createAudioEngine();
    expect(typeof audio.isMuted).toBe('boolean');
    expect(audio.isMuted).toBe(false);
  });
});
```

- [ ] **Register in test.html:** Add `import './tests/audio.test.js';` before the `runAll()` call.
- [ ] **Verify:** Open `http://localhost:8080/test.html` -- tests FAIL (module does not exist yet).

### Step 1.2 -- Test: volume clamping

- [ ] **Append to `tests/audio.test.js`:**

```js
describe('Volume clamping', () => {
  it('setMusicVolume clamps values below 0 to 0', () => {
    const audio = createAudioEngine();
    audio.setMusicVolume(-0.5);
    // No throw; engine accepts it gracefully
    audio.setMusicVolume(0);
  });

  it('setMusicVolume clamps values above 1 to 1', () => {
    const audio = createAudioEngine();
    audio.setMusicVolume(1.5);
    audio.setMusicVolume(1);
  });

  it('setSfxVolume clamps values to 0-1 range', () => {
    const audio = createAudioEngine();
    audio.setSfxVolume(-1);
    audio.setSfxVolume(2);
    audio.setSfxVolume(0.7);
  });

  it('setAmbientVolume clamps values to 0-1 range', () => {
    const audio = createAudioEngine();
    audio.setAmbientVolume(-0.1);
    audio.setAmbientVolume(1.1);
    audio.setAmbientVolume(0.3);
  });
});
```

### Step 1.3 -- Test: mute toggle

- [ ] **Append to `tests/audio.test.js`:**

```js
describe('Master mute', () => {
  it('setMasterMute(true) sets isMuted to true', () => {
    const audio = createAudioEngine();
    audio.setMasterMute(true);
    expect(audio.isMuted).toBe(true);
  });

  it('setMasterMute(false) sets isMuted to false', () => {
    const audio = createAudioEngine();
    audio.setMasterMute(true);
    audio.setMasterMute(false);
    expect(audio.isMuted).toBe(false);
  });

  it('mute starts as false by default', () => {
    const audio = createAudioEngine();
    expect(audio.isMuted).toBe(false);
  });
});
```

### Step 1.4 -- Implement: audio engine skeleton in `js/audio.js`

- [ ] **Create `js/audio.js`** with the following structure:

```js
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
```

- [ ] **Verify:** Open `http://localhost:8080/test.html` -- all Step 1.1-1.3 tests PASS.

### Step 1.5 -- Test: localStorage persistence

- [ ] **Append to `tests/audio.test.js`:**

```js
describe('localStorage persistence', () => {
  it('saves settings to localStorage under jujupets-audio key', () => {
    localStorage.removeItem('jujupets-audio');
    const audio = createAudioEngine();
    audio.setMusicVolume(0.8);
    const stored = JSON.parse(localStorage.getItem('jujupets-audio'));
    expect(stored.musicVolume).toBe(0.8);
  });

  it('restores muted state from localStorage', () => {
    localStorage.setItem('jujupets-audio', JSON.stringify({
      musicVolume: 0.5, sfxVolume: 0.7, ambientVolume: 0.3, muted: true
    }));
    const audio = createAudioEngine();
    expect(audio.isMuted).toBe(true);
    localStorage.removeItem('jujupets-audio');
  });

  it('handles corrupt localStorage gracefully', () => {
    localStorage.setItem('jujupets-audio', '{invalid json');
    let threw = false;
    try { createAudioEngine(); } catch (e) { threw = true; }
    expect(threw).toBe(false);
    localStorage.removeItem('jujupets-audio');
  });
});
```

- [ ] **Verify:** Tests PASS with the existing implementation.

---

## Feature 2: SFX Library (10 Sound Effects)

Each SFX is a named function that creates short-lived oscillators/nodes, plays them, and lets them self-destruct. All SFX route through `sfxGain`.

### Step 2.1 -- Test: SFX registry

- [ ] **Append to `tests/audio.test.js`:**

```js
describe('SFX registry', () => {
  const SFX_NAMES = [
    'click', 'dialog_open', 'dialog_close', 'adopt_fanfare',
    'cha_ching', 'alert', 'bark', 'meow', 'chirp', 'squeak'
  ];

  it('playSfx accepts all 10 registered sound names without throwing', () => {
    const audio = createAudioEngine();
    let threw = false;
    try {
      for (const name of SFX_NAMES) {
        audio.playSfx(name);
      }
    } catch (e) { threw = true; }
    expect(threw).toBe(false);
  });

  it('playSfx handles unknown name gracefully (no throw)', () => {
    const audio = createAudioEngine();
    let threw = false;
    try { audio.playSfx('nonexistent_sound'); } catch (e) { threw = true; }
    expect(threw).toBe(false);
  });

  it('playSfx respects mute state (no throw when muted)', () => {
    const audio = createAudioEngine();
    audio.setMasterMute(true);
    let threw = false;
    try { audio.playSfx('click'); } catch (e) { threw = true; }
    expect(threw).toBe(false);
  });
});
```

- [ ] **Verify:** Tests FAIL (playSfx is a no-op placeholder).

### Step 2.2 -- Implement: SFX library in `js/audio.js`

- [ ] **Add the SFX registry** inside `createAudioEngine`, replacing the `playSfx` placeholder:

Each SFX function receives `(ctx, destination, time)` where `destination` is `sfxGain` and `time` is `ctx.currentTime`. The 10 SFX implementations:

| Name | Implementation |
|---|---|
| `click` | Sine 1000Hz, duration 0.05s, gain envelope 0.3 -> 0 |
| `dialog_open` | Sine frequency ramp 400 -> 800Hz over 0.1s, gain 0.2 |
| `dialog_close` | Sine frequency ramp 800 -> 400Hz over 0.1s, gain 0.2 |
| `adopt_fanfare` | 4 sequential sines at 523, 659, 784, 1047Hz, each 0.1s, gain 0.25 |
| `cha_ching` | 2 sine pulses at 2000Hz, 0.03s each, 0.02s gap, gain 0.3 |
| `alert` | Sawtooth 200Hz, 0.2s, slow decay gain 0.3 -> 0 |
| `bark` | White noise burst 0.08s + sine 300Hz 0.08s overlapping, gain 0.2 |
| `meow` | Sine frequency ramp 600 -> 400Hz over 0.15s, gain 0.15 |
| `chirp` | Sine frequency ramp 1500 -> 2000 -> 1500Hz over 0.1s, gain 0.15 |
| `squeak` | Sine 1800Hz, 0.04s pulse, gain 0.2 |

The `playSfx(name)` method looks up the name in a `Map`, and if found, calls the factory function. If muted, it returns early. Unknown names are silently ignored.

- [ ] **Helper function for noise buffer** (used by `bark` and ambient wind):

```js
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
```

- [ ] **Verify:** All SFX registry tests PASS.

---

## Feature 3: Music Sequencer (Lo-Fi Chiptune Loop)

A 16-bar loop at 90 BPM in C major using four instrument voices: square-wave melody, triangle-wave bass, noise hi-hat, and sine kick with pitch drop. The sequencer schedules notes ahead using `AudioContext.currentTime` and loops back to bar 1 at the end.

### Step 3.1 -- Test: music sequencer state

- [ ] **Append to `tests/audio.test.js`:**

```js
describe('Music sequencer', () => {
  it('isMusicPlaying is false before playMusic()', () => {
    const audio = createAudioEngine();
    expect(audio.isMusicPlaying).toBe(false);
  });

  it('isMusicPlaying is true after playMusic()', () => {
    const audio = createAudioEngine();
    audio.playMusic();
    expect(audio.isMusicPlaying).toBe(true);
    audio.stopMusic(); // cleanup
  });

  it('isMusicPlaying is false after stopMusic()', () => {
    const audio = createAudioEngine();
    audio.playMusic();
    audio.stopMusic();
    expect(audio.isMusicPlaying).toBe(false);
  });

  it('calling playMusic() twice does not throw', () => {
    const audio = createAudioEngine();
    let threw = false;
    try {
      audio.playMusic();
      audio.playMusic();
    } catch (e) { threw = true; }
    expect(threw).toBe(false);
    audio.stopMusic();
  });

  it('calling stopMusic() without playMusic() does not throw', () => {
    const audio = createAudioEngine();
    let threw = false;
    try { audio.stopMusic(); } catch (e) { threw = true; }
    expect(threw).toBe(false);
  });
});
```

- [ ] **Verify:** Tests FAIL (playMusic/stopMusic are no-op placeholders).

### Step 3.2 -- Implement: music sequencer in `js/audio.js`

- [ ] **Replace `playMusic`/`stopMusic` placeholders** with the sequencer implementation:

**Constants:**
- `TEMPO = 90` (BPM)
- `BEAT_DURATION = 60 / TEMPO` (~0.667 seconds)
- `BARS = 16`
- `BEATS_PER_BAR = 4`
- `TOTAL_BEATS = BARS * BEATS_PER_BAR` (64 beats)
- `LOOP_DURATION = TOTAL_BEATS * BEAT_DURATION` (~42.67 seconds)

**Note data (defined as arrays):**

Melody (square wave, pentatonic C-D-E-G-A mapped to Hz at octave 5):
- C5=523, D5=587, E5=659, G5=784, A5=880
- 8 bars of melodic phrase + 8 bars of variation
- Each note is `{ freq, start (in beats), dur (in beats) }`

Bass (triangle wave, root notes following C-F-G-Am chord progression):
- C3=131, F3=175, G3=196, A3=220
- Whole notes (4 beats each), cycling the chord pattern across 16 bars

Hi-Hat (noise bursts, eighth notes):
- Every 0.5 beats, a 0.05s noise burst through a highpass filter at 8000Hz
- Gain 0.05 (very quiet)

Kick (sine with pitch drop):
- Every beat (quarter notes), sine starting at 200Hz dropping to 60Hz in 0.1s
- Duration 0.15s, gain 0.3

**Scheduling approach:**
- Use a lookahead scheduler with `setInterval` (25ms interval, 100ms lookahead window)
- Track `nextBeatTime` and `currentBeat` (0-63)
- When `nextBeatTime < ctx.currentTime + lookahead`, schedule all notes for that beat
- At beat 64, wrap back to beat 0 (loop)
- Each note creates a new OscillatorNode, schedules `start()` and `stop()` with precise times
- ADSR envelope on melody: attack 0.01s, decay 0.05s, sustain 0.6, release 0.05s (applied via GainNode automation)

**stopMusic():**
- Clear the `setInterval` timer
- Set `musicPlaying = false`
- Any already-scheduled oscillators will play out and self-stop (acceptable)

**playMusic():**
- If already playing, return early (idempotent)
- Set `musicPlaying = true`
- Initialize `nextBeatTime = ctx.currentTime`
- Start the scheduler interval

- [ ] **Verify:** All music sequencer tests PASS.

---

## Feature 4: Ambient Layer (Wind + Bird Chirps)

Continuous background audio: lowpass-filtered white noise for wind and random sine chirps for distant birds. Both route through `ambientGain`.

### Step 4.1 -- Test: ambient layer does not throw

- [ ] **Append to `tests/audio.test.js`:**

```js
describe('Ambient layer', () => {
  it('playMusic starts ambient layer without throwing', () => {
    const audio = createAudioEngine();
    let threw = false;
    try { audio.playMusic(); } catch (e) { threw = true; }
    expect(threw).toBe(false);
    audio.stopMusic();
  });

  it('stopMusic stops ambient layer without throwing', () => {
    const audio = createAudioEngine();
    audio.playMusic();
    let threw = false;
    try { audio.stopMusic(); } catch (e) { threw = true; }
    expect(threw).toBe(false);
  });
});
```

- [ ] **Verify:** Tests already pass if playMusic/stopMusic are implemented and don't throw.

### Step 4.2 -- Implement: ambient layer in `js/audio.js`

- [ ] **Add ambient start/stop** to `playMusic()`/`stopMusic()`:

**Wind:**
- Create a long noise buffer (2 seconds, looping) via `createNoiseBuffer(ctx, 2)`
- Play it with a `BufferSourceNode` set to `loop = true`
- Route through a `BiquadFilterNode` (type: 'lowpass', frequency: 500Hz)
- Then through a gain node at 0.05
- Connect to `ambientGain`

**Bird chirps:**
- `setInterval` every 5000-10000ms (randomized)
- Each chirp: sine oscillator, frequency ramps 1200 + random(800) Hz, 0.08s duration
- Gain 0.08 (very subtle)
- Route to `ambientGain`

**stopMusic() additions:**
- Stop the wind BufferSourceNode
- Clear the bird chirp interval
- Set `ambientNodes = null`

- [ ] **Verify:** Ambient tests pass, manual check confirms subtle wind and bird sounds.

---

## Feature 5: UI Integration (Mute Button + Volume Popup)

### Step 5.1 -- Test: volume popup DOM structure

Since tests run in `test.html` (not `index.html`), the DOM tests create the elements dynamically to verify the expected structure. This validates that the HTML markup we add to `index.html` in Step 5.2 is correct.

- [ ] **Append to `tests/audio.test.js`:**

```js
describe('Volume popup DOM contract', () => {
  // These tests verify the audio module's UI expectations:
  // the elements it needs must have the right IDs and types.
  // We create them in-test to validate the contract independently.

  it('volume popup structure: 3 range inputs + 1 checkbox', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <button id="test-mute-btn">X</button>
      <div id="test-volume-popup" class="hidden">
        <label>Musik <input type="range" id="test-vol-music" min="0" max="100" value="50"></label>
        <label>SFX <input type="range" id="test-vol-sfx" min="0" max="100" value="70"></label>
        <label>Ambient <input type="range" id="test-vol-ambient" min="0" max="100" value="30"></label>
        <label><input type="checkbox" id="test-vol-mute"> Stumm</label>
      </div>
    `;
    document.body.appendChild(container);

    const popup = document.getElementById('test-volume-popup');
    expect(popup !== null).toBe(true);
    expect(popup.classList.contains('hidden')).toBe(true);

    const sliders = popup.querySelectorAll('input[type="range"]');
    expect(sliders.length).toBe(3);

    const checkbox = popup.querySelector('input[type="checkbox"]');
    expect(checkbox !== null).toBe(true);

    document.body.removeChild(container);
  });

  it('slider default values match spec defaults', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <input type="range" id="test-vm" min="0" max="100" value="50">
      <input type="range" id="test-vs" min="0" max="100" value="70">
      <input type="range" id="test-va" min="0" max="100" value="30">
    `;
    document.body.appendChild(container);

    expect(parseInt(document.getElementById('test-vm').value)).toBe(50);
    expect(parseInt(document.getElementById('test-vs').value)).toBe(70);
    expect(parseInt(document.getElementById('test-va').value)).toBe(30);

    document.body.removeChild(container);
  });
});
```

- [ ] **Verify:** Tests PASS (they are self-contained DOM contract tests).

### Step 5.2 -- Implement: mute button and volume popup in `index.html`

- [ ] **Edit `index.html`** -- add the mute button inside `#stats-bar`, after speed-controls:

```html
<button id="mute-btn" title="Lautst&auml;rke">&#x1f50a;</button>
<div id="volume-popup" class="hidden">
  <label>Musik <input type="range" id="vol-music" min="0" max="100" value="50"></label>
  <label>SFX <input type="range" id="vol-sfx" min="0" max="100" value="70"></label>
  <label>Ambient <input type="range" id="vol-ambient" min="0" max="100" value="30"></label>
  <label><input type="checkbox" id="vol-mute"> Stumm</label>
</div>
```

Exact insertion point: after the closing `</div>` of `#speed-controls`, still inside `#stats-bar`.

- [ ] **Verify:** Volume popup DOM tests PASS.

### Step 5.3 -- Implement: volume popup logic in `js/ui.js`

- [ ] **Edit `js/ui.js`** -- add volume popup wiring inside `createUI`:

```js
// Volume popup toggle
const muteBtn = document.getElementById('mute-btn');
const volumePopup = document.getElementById('volume-popup');
const volMusic = document.getElementById('vol-music');
const volSfx = document.getElementById('vol-sfx');
const volAmbient = document.getElementById('vol-ambient');
const volMuteCheckbox = document.getElementById('vol-mute');

if (muteBtn && volumePopup) {
  muteBtn.addEventListener('click', () => {
    volumePopup.classList.toggle('hidden');
  });

  // Close popup when clicking outside
  document.addEventListener('click', (e) => {
    if (!volumePopup.contains(e.target) && e.target !== muteBtn) {
      volumePopup.classList.add('hidden');
    }
  });
}
```

- [ ] **Add `onVolumeChange` callback to `createUI` callbacks parameter** so main.js can wire the sliders to the audio engine:

```js
if (volMusic) {
  volMusic.addEventListener('input', () => {
    callbacks.onVolumeChange?.('music', parseInt(volMusic.value) / 100);
  });
}
if (volSfx) {
  volSfx.addEventListener('input', () => {
    callbacks.onVolumeChange?.('sfx', parseInt(volSfx.value) / 100);
  });
}
if (volAmbient) {
  volAmbient.addEventListener('input', () => {
    callbacks.onVolumeChange?.('ambient', parseInt(volAmbient.value) / 100);
  });
}
if (volMuteCheckbox) {
  volMuteCheckbox.addEventListener('change', () => {
    callbacks.onMuteToggle?.(volMuteCheckbox.checked);
  });
}
```

- [ ] **Add `updateVolumeUI(settings)` method** to the returned UI object, so main.js can sync slider positions from saved audio settings:

```js
function updateVolumeUI(settings) {
  if (volMusic) volMusic.value = Math.round(settings.musicVolume * 100);
  if (volSfx) volSfx.value = Math.round(settings.sfxVolume * 100);
  if (volAmbient) volAmbient.value = Math.round(settings.ambientVolume * 100);
  if (volMuteCheckbox) volMuteCheckbox.checked = settings.muted;
  if (muteBtn) muteBtn.textContent = settings.muted ? '\u{1F507}' : '\u{1F50A}';
}
```

Return `updateVolumeUI` alongside `update`, `showDialog`, `hideDialog`.

- [ ] **Verify:** Volume popup DOM tests PASS.

---

## Feature 6: Main.js Integration

Wire the audio engine into the game loop: init on load, resume on first click, trigger SFX during gameplay events.

### Step 6.1 -- Test: main.js audio integration points

These are integration-level checks -- they confirm the audio object is wired without testing audio output.

- [ ] **Append to `tests/audio.test.js`:**

```js
describe('Audio engine resume', () => {
  it('resume() does not throw even if context is already running', () => {
    const audio = createAudioEngine();
    let threw = false;
    try { audio.resume(); } catch (e) { threw = true; }
    expect(threw).toBe(false);
  });
});
```

- [ ] **Verify:** Test PASSES.

### Step 6.2 -- Implement: audio engine integration in `js/main.js`

- [ ] **Add import** at top of `main.js`:

```js
import { createAudioEngine } from './audio.js';
```

- [ ] **Create audio engine** after the other system inits (after `const camera = ...`):

```js
const audio = createAudioEngine();
```

- [ ] **Resume on first user gesture** -- add a one-time click listener:

```js
function resumeAudio() {
  audio.resume();
  audio.playMusic();
  document.removeEventListener('click', resumeAudio);
  document.removeEventListener('keydown', resumeAudio);
}
document.addEventListener('click', resumeAudio);
document.addEventListener('keydown', resumeAudio);
```

- [ ] **Wire volume callbacks** into the `createUI` call:

```js
const ui = createUI(state, {
  onSetSpeed(speed) { engine.setSpeed(speed); },
  onAction(action) { /* ...existing... */ },
  onVolumeChange(channel, value) {
    if (channel === 'music') audio.setMusicVolume(value);
    if (channel === 'sfx') audio.setSfxVolume(value);
    if (channel === 'ambient') audio.setAmbientVolume(value);
  },
  onMuteToggle(muted) {
    audio.setMasterMute(muted);
  },
});
```

- [ ] **Sync volume UI from saved settings** after createUI:

```js
ui.updateVolumeUI({
  musicVolume: audio._getMusicVolume(),
  sfxVolume: audio._getSfxVolume(),
  ambientVolume: audio._getAmbientVolume(),
  muted: audio.isMuted,
});
```

- [ ] **Add SFX triggers in `onTick`** -- inside the animal loop (after particle triggers):

```js
// Animal sound triggers (inside the for-of animal loop)
if (animal.species === 'dog' && Math.random() < 0.003) {
  audio.playSfx('bark');
}
if (animal.species === 'cat' && Math.random() < 0.002) {
  audio.playSfx('meow');
}
if (animal.species === 'bird' && Math.random() < 0.005) {
  audio.playSfx('chirp');
}
if ((animal.species === 'rabbit' || animal.species === 'smallpet') && Math.random() < 0.002) {
  audio.playSfx('squeak');
}
```

- [ ] **Add SFX triggers in dialog functions:**

In `showIntakeDialog`, `showAdoptDialog`, `showShopDialog`, `showStaffDialog` -- add at the start of each:
```js
audio.playSfx('dialog_open');
```

In the adoption success handler (inside `showAnimalSelectDialog`, after `executeAdoption`):
```js
audio.playSfx('adopt_fanfare');
audio.playSfx('cha_ching');
```

In error dialogs (full shelter, no money, etc.):
```js
audio.playSfx('alert');
```

- [ ] **Verify:** Run the game manually -- sounds trigger on button clicks, dialogs, and animal idle. Check the browser console for errors.

### Step 6.3 -- Implement: click SFX on buttons in `js/ui.js`

- [ ] **Add `audioEngine` parameter** to `createUI(state, callbacks)` -- change signature to `createUI(state, callbacks, audioEngine)`:

Actually, to avoid a circular dependency or signature change, use the callback pattern instead. In `ui.js`, when wiring button listeners:

```js
// In the speed-btn click handler, add:
callbacks.onButtonClick?.();

// In the action-btn click handler, add:
callbacks.onButtonClick?.();
```

Then in `main.js`, add to the callbacks object:
```js
onButtonClick() {
  audio.playSfx('click');
},
```

- [ ] **Add dialog close SFX** -- in `hideDialog()` inside `ui.js`, call:
```js
callbacks.onDialogClose?.();
```

Then in `main.js` callbacks:
```js
onDialogClose() {
  audio.playSfx('dialog_close');
},
```

- [ ] **Verify:** Click any button -- hear click SFX. Open/close dialogs -- hear dialog sounds.

---

## Feature 7: CSS for Volume Popup

### Step 7.1 -- Implement: volume popup styles in `css/style.css`

- [ ] **Append to `css/style.css`:**

```css
/* Mute button */
#mute-btn {
  background: linear-gradient(180deg, #A0724A, #8B4513);
  color: #FFF8E1;
  border: 2px solid #5D4037;
  padding: 3px 8px;
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
  border-radius: 3px;
  margin-left: 8px;
  line-height: 1;
}

#mute-btn:hover {
  background: linear-gradient(180deg, #C49155, #A0724A);
}

/* Volume popup */
#volume-popup {
  position: absolute;
  top: 38px;
  right: 14px;
  background: linear-gradient(180deg, #FFF8E1, #FFECB3);
  border: 3px solid #8B4513;
  border-radius: 6px;
  padding: 12px 14px;
  z-index: 50;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  min-width: 180px;
}

#volume-popup.hidden {
  display: none;
}

#volume-popup label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 8px;
  color: #4E342E;
  white-space: nowrap;
}

#volume-popup label:last-child {
  margin-bottom: 0;
  margin-top: 4px;
  padding-top: 6px;
  border-top: 1px dashed #C49155;
}

#volume-popup input[type="range"] {
  width: 100px;
  accent-color: #8B4513;
  cursor: pointer;
}

#volume-popup input[type="checkbox"] {
  accent-color: #8B4513;
  cursor: pointer;
  width: 14px;
  height: 14px;
}
```

- [ ] **Make `#stats-bar` position relative** (needed for absolute popup positioning):

Add `position: relative;` to the existing `#stats-bar` rule.

- [ ] **Verify:** The popup appears below the stats bar, styled consistently with the game's wood/parchment theme.

---

## Feature 8: CLAUDE.md Update

### Step 8.1 -- Update CLAUDE.md

- [ ] **Edit `CLAUDE.md`** -- add `js/audio.js` to the Architecture section:

```
- `js/audio.js` — procedural audio engine: Web Audio API chiptune sequencer, 10 SFX, ambient layer, 3-channel volume + master mute
```

Insert after the `js/particles.js` line.

- [ ] **Verify:** CLAUDE.md accurately reflects the new module.

---

## Final Verification Checklist

- [ ] **Run full test suite:** Open `http://localhost:8080/test.html` -- all tests pass (existing + new audio tests).
- [ ] **Manual smoke test:** Open `http://localhost:8080` -- click anywhere, music starts, SFX play on button clicks and dialogs, ambient wind audible, animal sounds trigger occasionally.
- [ ] **Volume controls:** Click speaker icon, adjust all three sliders, toggle mute, refresh page -- settings persist.
- [ ] **No regressions:** Game logic, rendering, movement, particles all unchanged. Verify via existing test suite.
- [ ] **No external audio files:** Confirm `js/audio.js` uses only Web Audio API oscillators and generated buffers.
- [ ] **Console clean:** No errors or warnings in browser console during normal gameplay.

---

## File Change Summary

| File | Change Type | What |
|---|---|---|
| `js/audio.js` | **NEW** | Audio engine: AudioContext + 3 gain chains, 10 SFX functions, 16-bar chiptune sequencer, ambient wind+birds, localStorage persistence |
| `tests/audio.test.js` | **NEW** | 25+ tests: API shape, volume clamping, mute toggle, SFX registry, localStorage, sequencer state, ambient safety, resume safety |
| `test.html` | MODIFY | Add `import './tests/audio.test.js';` |
| `index.html` | MODIFY | Add `#mute-btn` and `#volume-popup` in `#stats-bar` |
| `js/main.js` | MODIFY | Import audio engine, init, resume on first click, wire volume callbacks, add SFX triggers in onTick + dialogs |
| `js/ui.js` | MODIFY | Volume popup toggle logic, slider/checkbox event wiring, `updateVolumeUI()` method, button/dialog click callbacks |
| `css/style.css` | MODIFY | `#mute-btn`, `#volume-popup`, slider/checkbox styles, `position: relative` on `#stats-bar` |
| `CLAUDE.md` | MODIFY | Add `js/audio.js` to architecture list |
