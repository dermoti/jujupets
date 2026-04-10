# JujuPets — Sound & Musik

## Übersicht

Vollständiges Audio-System mit prozedural erzeugtem Lo-Fi Chiptune Soundtrack, Sound-Effekten für UI/Gameplay/Tiere, und Ambient-Layer. Alles über die Web Audio API — keine externen Audio-Dateien. Drei unabhängige Volume-Regler (Musik, SFX, Ambient).

## Audio-Engine

### Neues Modul: `js/audio.js`

Zentrales Audio-Modul das einen `AudioContext` verwaltet. Drei parallele Signal-Ketten:
1. **Musik:** Sequencer → GainNode (musicVolume)
2. **SFX:** On-Demand Oszillatoren → GainNode (sfxVolume)
3. **Ambient:** Dauerhaft laufende Noise-Generatoren → GainNode (ambientVolume)

Alle drei GainNodes → Master GainNode → AudioContext.destination.

### Schnittstelle

```
createAudioEngine() → {
  playMusic()              // Startet den Chiptune-Loop
  stopMusic()              // Stoppt die Musik
  setMusicVolume(0-1)      // Musiklautstärke
  setSfxVolume(0-1)        // SFX-Lautstärke
  setAmbientVolume(0-1)    // Ambient-Lautstärke
  setMasterMute(bool)      // Master-Mute-Toggle
  playSfx(name)            // Spielt einen benannten Sound-Effekt
  get isMusicPlaying        // Boolean
  get isMuted               // Boolean
  resume()                  // AudioContext resume nach User-Geste
}
```

### Browser-Einschränkung

`AudioContext` startet in `suspended` State und muss nach einer User-Geste (Klick/Tastendruck) mit `resume()` aktiviert werden. `resume()` wird beim ersten Klick auf einen beliebigen Game-Button aufgerufen.

## Musik — Lo-Fi Chiptune Loop

Prozedural erzeugter, ruhiger Chiptune-Loop (~16 Takte, endlos wiederholend).

### Instrumente

| Instrument | Oszillator | Rolle |
|---|---|---|
| Melodie | Square-Wave (Rechteck) | Hauptmelodie, gedämpft für Lo-Fi-Charakter |
| Bass | Triangle-Wave (Dreieck) | Warme Bassline, tiefe Oktave |
| Hi-Hat | Noise + Highpass-Filter | Rhythmus, sehr leise |
| Kick | Sine-Wave mit schnellem Pitch-Drop (200→60Hz) | Rhythmus-Basis |

### Musikalische Parameter

- **Tempo:** 90 BPM (gemütlich)
- **Tonart:** C-Dur (warm, freundlich)
- **Taktart:** 4/4
- **Loop-Länge:** 16 Takte (~42 Sekunden)
- **Melodie:** Einfache pentatonische Phrase (C-D-E-G-A), 8 Takte Melodie + 8 Takte Variation
- **Bass:** Grundtöne der Akkordfolge (C-F-G-Am), ganze Noten
- **Hi-Hat:** Achtel-Noten, 50% Velocity
- **Kick:** Viertelnoten

### Sequencer-Logik

Noten werden als Arrays definiert:
```
melody = [{freq: 523, dur: 0.25}, {freq: 587, dur: 0.25}, ...]  // Hz + Beats
bass   = [{freq: 131, dur: 1.0}, {freq: 175, dur: 1.0}, ...]
```

Der Sequencer nutzt `AudioContext.currentTime` für präzises Timing. Jede Note wird als kurzlebiger Oszillator erzeugt (create → start → stop) mit einer Attack-Decay-Sustain-Release Hüllkurve über GainNode.

Am Ende der 16 Takte: Loop springt zurück zu Takt 1.

## Sound-Effekte (SFX)

Jeder SFX wird on-demand als kurzlebiger Oszillator erzeugt. Kein Pre-Loading nötig.

### SFX-Katalog

| Name | Trigger | Erzeugung |
|---|---|---|
| `click` | Jeder Button-Klick | Sinus-Pulse 1000Hz, 50ms, schneller Decay |
| `dialog_open` | Dialog wird geöffnet | Aufsteigender Sinus 400→800Hz, 100ms |
| `dialog_close` | Dialog wird geschlossen | Absteigender Sinus 800→400Hz, 100ms |
| `adopt_fanfare` | Erfolgreiche Adoption | Aufsteigende Tonfolge C5-E5-G5-C6 (523-659-784-1047Hz), je 100ms |
| `cha_ching` | Geld erhalten (Adoption, Spende) | Heller Sinus-Doppelschlag 2000Hz, 2×30ms mit 20ms Pause |
| `alert` | Krankheit, neg. Inspektion, Rückgabe | Tiefer Sawtooth 200Hz, 200ms, langsamer Decay |
| `bark` | Hund idle (zufällig, selten) | Noise-Burst 80ms + Sinus 300Hz 80ms |
| `meow` | Katze idle (zufällig, selten) | Gleitender Sinus 600→400Hz, 150ms |
| `chirp` | Vogel idle (zufällig, selten) | Sinus-Triller 1500→2000→1500Hz, 100ms |
| `squeak` | Kleintier/Kaninchen idle (selten) | Hoher kurzer Pulse 1800Hz, 40ms |

### Tier-Sound-Trigger

Tier-Sounds werden im `onTick`-Callback mit niedriger Wahrscheinlichkeit pro Tick ausgelöst (ähnlich wie Partikel-Trigger):
- Hund: 0.3% pro Tick
- Katze: 0.2% pro Tick
- Vogel: 0.5% pro Tick (häufiger, subtiler)
- Kleintier/Kaninchen: 0.2% pro Tick

## Ambient-Layer

Subtile Hintergrundgeräusche die dauerhaft laufen (wenn nicht gemutet).

### Ambient-Sounds

| Sound | Erzeugung | Lautstärke |
|---|---|---|
| Wind | Weißes Rauschen → Lowpass-Filter (Cutoff 500Hz) → GainNode (0.05) | Sehr leise, dauerhaft |
| Hintergrund-Vögel | Zufällige kurze Sinus-Chirps (1200-2000Hz) alle 5-10 Sekunden | Leise, unabhängig von Spielvögeln |

Ambient wird über eine eigene GainNode gesteuert, unabhängig von Musik und SFX. Default-Volume: 30%.

## Volume-Steuerung & UI

### Drei Regler + Mute

| Regler | Default | Scope |
|---|---|---|
| Musik | 50% | Hintergrundmusik-Loop |
| SFX | 70% | Alle Sound-Effekte (UI + Tier + Event) |
| Ambient | 30% | Wind + Hintergrund-Vögel |
| Mute-Toggle | Off | Master-Mute (schaltet alles stumm) |

### UI-Integration

Ein Lautsprecher-Icon (🔊) in der Stats-Bar. Klick öffnet ein kleines Volume-Popup mit drei Slidern und einem Mute-Checkbox. Settings werden in `localStorage` persistiert (Key: `jujupets-audio`).

## Geänderte/Neue Dateien

| Datei | Art | Änderung |
|---|---|---|
| `js/audio.js` | **Neu** | Audio-Engine: Sequencer, SFX-Library, Ambient, Volume-Kontrolle |
| `js/main.js` | Modify | AudioEngine erstellen, resume() bei erstem Klick, SFX-Triggers in onTick + Dialogen |
| `js/ui.js` | Modify | Klick-Sound auf Buttons, Dialog-Open/Close-Sound, Volume-Popup-Logik |
| `css/style.css` | Modify | Mute-Button + Volume-Popup Styling |
| `index.html` | Modify | Mute-Button in Stats-Bar |
| `tests/audio.test.js` | **Neu** | Tests: SFX-Registry, Volume-Clamping, Mute-Toggle, API-Shape |

## Nicht betroffen

Spiellogik, Rendering, Bewegungssystem, Partikelsystem — alles bleibt unverändert. Audio ist rein additiv.
