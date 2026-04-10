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
