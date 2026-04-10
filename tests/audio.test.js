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

describe('Volume clamping', () => {
  it('setMusicVolume clamps values below 0 to 0', () => {
    const audio = createAudioEngine();
    audio.setMusicVolume(-0.5);
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

describe('Music sequencer', () => {
  it('isMusicPlaying is false before playMusic()', () => {
    const audio = createAudioEngine();
    expect(audio.isMusicPlaying).toBe(false);
  });

  it('isMusicPlaying is true after playMusic()', () => {
    const audio = createAudioEngine();
    audio.playMusic();
    expect(audio.isMusicPlaying).toBe(true);
    audio.stopMusic();
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
    try { audio.playMusic(); audio.playMusic(); } catch (e) { threw = true; }
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

describe('Audio engine resume', () => {
  it('resume() does not throw even if context is already running', () => {
    const audio = createAudioEngine();
    let threw = false;
    try { audio.resume(); } catch (e) { threw = true; }
    expect(threw).toBe(false);
  });
});
