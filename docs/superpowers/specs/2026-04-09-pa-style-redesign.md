# JujuPets — Visual Redesign: Prison Architect Style

## Übersicht

Komplettes visuelles Redesign von isometrischer Pixel-Art zu Top-Down Prison Architect-Stil. Betrifft: Rendering-Perspektive (Iso → Top-Down), Sprite-Stil (alle Entitäten), Tile-Rendering, UI-Theme (Holz/Pergament → dunkles funktionales UI), und Farbpalette. Spiellogik und Audio bleiben komplett unverändert.

Integriert auch: 4-Richtungs-Sprites, Mini-Portraits, animierter Ticker, mapOffsetX-Fix.

## Kernänderung: Iso → Top-Down

### Perspektive

Wechsel von isometrischer 2:1-Diamant-Projektion zu strikt orthogonaler Top-Down-Ansicht. Tiles sind Rechtecke statt Diamanten. Kein `worldToScreen`-Mapping mehr — Screen-Koordinaten = Welt-Koordinaten × Tile-Größe.

### Neues Grid-System

- **Tile-Größe:** 32×32px (quadratisch)
- **Map-Größe:** 24×24 Tiles (beibehalten)
- **Canvas:** 680×500px
- **Welt-Pixel:** 768×768px (24×32)
- **Kamera:** Scrollbar (WASD + Maus-Drag), begrenzt auf Map-Ränder
- **Projektion:** `screenX = col * TILE_SIZE - camera.x`, `screenY = row * TILE_SIZE - camera.y`

### Tiefensortierung

Entfällt. Top-Down hat keine Tiefenüberlappung. Zeichenreihenfolge: Boden → Deko → Entitäten → Partikel → UI-Overlays.

## Tile-Rendering

### Tile-Typen (Top-Down Stil)

| Tile | Darstellung |
|------|-------------|
| `grass` | Flaches Grün (#5a7a3a) mit subtilen dunkleren Flecken |
| `grass_flower` | Gras + kleine bunte Blumen-Punkte |
| `path` | Beige/Grau Beton (#a09080) |
| `floor` | Helles Beige (#c8b8a0) — Innenraum-Boden |
| `wall` | Dicker Rand (#333, 4px) um Gebäude-Bereiche (statt separate wall_left/right/back) |
| `fence` | Gestrichelte Linie (#333, stroke-dasharray) um Gehege |
| `water` | Blaue Fläche (#5C9CD6) mit subtiler Wellen-Animation |

### Wand-Rendering (Vereinfacht)

Statt separater `wall_left`, `wall_right`, `wall_back` Tiles wird das Gebäude als zusammenhängendes Rechteck mit dicker Außenwand gerendert. Innenwände zwischen Räumen sind dünnere Linien. Türöffnungen als Lücken in der Wandlinie.

## Sprite-Stil (Prison Architect)

### Allgemeine Merkmale

- **Große runde Köpfe** (~1/3 der Gesamthöhe)
- **Dicke schwarze Outlines** (1.5-2px) auf allen Elementen
- **Flache Farbflächen** ohne Gradienten oder Schattierung
- **Minimale Gesichtsdetails** — nur Punkt-Augen, keine Nase, optionaler Strich-Mund
- **Stummelförmige Gliedmaßen** ohne sichtbare Hände/Füße

### Tier-Sprites (PA-Stil)

| Tierart | Größe | Besonderheiten |
|---------|-------|----------------|
| Hund | 16×18px | Runder Kopf, Hängeohren, Stummel-Schwanz |
| Katze | 14×16px | Runder Kopf, Spitz-Ohren (Dreiecke), gebogener Schwanz, grüne Augen |
| Kaninchen | 12×16px | Langer ovaler Kopf, aufrechte lange Ohren |
| Kleintier | 10×12px | Kleiner runder Blob, winzige Ohren |
| Vogel | 10×10px | Kleiner runder Körper, spitzer Schnabel (orange Dreieck) |

### Personal-Sprites (PA-Stil)

| Rolle | Größe | Farbe | Besonderheiten |
|-------|-------|-------|----------------|
| Pfleger | 14×22px | Grünes Shirt (#4CAF50) | Standard-PA-Figur |
| Tierarzt | 14×22px | Weißer Kittel (#ECEFF1) | Rotes Kreuz auf dem Kittel |
| Trainer | 14×22px | Orange (#FF9800) | — |
| Vermittler | 14×22px | Lila (#CE93D8) | — |

### 4 Richtungen

Alle Entitäten (Tiere + Personal) haben 4 Blickrichtungen: Süd (unten, Standard), West (links), Nord (oben), Ost (rechts).

**Umsetzung:** Sprite-Sheet 4× breiter. Spalten 0-3 = Süd-Frames, 4-7 = West, 8-11 = Nord, 12-15 = Ost. Richtung wird aus Bewegungsvektor in `movement.js` berechnet.

**Richtungs-Unterschiede:**
- Süd/Nord: Volle Front/Rückenansicht
- Ost/West: Seitenansicht (nur 1 Auge sichtbar)
- Nord: Dunkler Farbton (Rückenansicht), keine Augen

### Animationsframes

- Tiere: 2-3 Frames pro Animation (weniger als aktuell, PA ist sparsam)
- Personal: 2-3 Frames Walk-Animation (Beine alternieren)
- Idle: 1-2 Frames (minimale Bewegung)

## Deko & Möbel (PA-Stil)

Alle Deko-Objekte als einfache Formen mit dicken Outlines:

| Objekt | Darstellung |
|--------|-------------|
| Baum | Dunkler Kreis (#4a6a2a) + Outline + Stamm-Rechteck |
| Busch | Kleiner grüner Kreis |
| Bank | Braunes Rechteck mit Outline |
| Blumenbeet | Braunes Rechteck + bunte Kreis-Punkte oben |
| Käfig | Graues Rechteck mit vertikalen Linien (Gitterstäbe) |
| Behandlungstisch | Hellgraues Rechteck |
| Tresen | Braunes breites Rechteck |
| Regal | Braunes Rechteck mit horizontalen Linien (Regalbretter) |
| Futterschale | Orangener Kreis (#FF8A65) |
| Wasserschale | Blauer Kreis (#64B5F6) |
| Kratzbaum | Braunes Rechteck mit horizontalen Plattformen |

## UI-Redesign (Funktional-Dark)

Wechsel von Holz/Pergament zu einem dunklen, funktionalen UI-Stil.

### Farbpalette UI

| Element | Farbe |
|---------|-------|
| Hintergrund (Panels) | #222 |
| Stats-Bar | #1a1a1a |
| Text (primär) | #e0e0e0 |
| Text (sekundär) | #888 |
| Buttons | #333, Border #555 |
| Button hover | #444, Border #888 |
| Button aktiv | #555, Text #fff |
| Akzent positiv | #4CAF50 |
| Akzent negativ | #E53935 |
| Akzent Warnung | #FFD54F |
| Ticker | #1a1a1a, Text #888 |

### Stats-Bar

- Dunkler Hintergrund (#1a1a1a), 1px Border unten
- Stat-Labels in Grau, Werte in Weiß
- Geld in Grün, Reputation in Gold
- Funktionale Toolbar-Buttons statt Leder-Look
- Mute-Button als reines Icon (kein Button-Rahmen)

### Seitenpanel

- Dunkler Hintergrund (#222), 1px Border links
- Panel-Headers: Graue Uppercase-Labels mit Unterstrichen
- Entries: Farbige Mini-Portraits (18×18px, rund, mit Border)
- Health-Bars als schmale farbige Balken
- Action-Buttons: Dunkelgrau, schlicht, mit Icon-Prefix

### Dialoge

- Semi-transparenter dunkler Overlay
- Dialog-Box: Dunkler Hintergrund (#2a2a2a), Border #555
- Helle Schrift, funktionale Buttons
- Kein Holzrahmen, keine Pergament-Textur

### Ticker

- Animierte Laufschrift (CSS `@keyframes`)
- Dunkler Hintergrund, gedämpfte Textfarbe
- Icons vor jeder Nachricht

### Mini-Portraits

Runde 18×18px Farbflächen mit 1.5px Border. Farbe = Tier-Körperfarbe oder Uniform-Farbe. Im Seitenpanel neben jedem Tier-/Personal-Namen.

## Partikel

Partikel bleiben als System erhalten, Rendering wird vereinfacht:
- Herzen: Rotes ♥ Unicode-Zeichen
- Sterne: Goldenes ★
- Noten: Lila ♪
- Sparkle: Weißes ✦

Einfacher als prozedurales Canvas-Drawing — direkt als `fillText` mit Unicode.

## mapOffsetX-Fix

Da Top-Down keine `mapOffsetX`-Transformation braucht (direkt `col * TILE_SIZE`), entfällt das Problem. Partikel-Positionen werden direkt aus `col * TILE_SIZE - camera.x` berechnet.

## Geänderte Dateien

| Datei | Art | Änderung |
|-------|-----|----------|
| `js/iso.js` | Rewrite → `js/grid.js` | Einfache Grid-Mathe statt Iso-Projektion: `TILE_SIZE=32`, `toScreen(col, row)`, `toGrid(sx, sy)` |
| `js/camera.js` | Modify | Vereinfachen: keine Iso-Offsets, direkte Pixel-Koordinaten |
| `js/tilemap.js` | Modify | Tile-Typen vereinfachen (wall statt wall_left/right/back), Gebäude als Rechteck |
| `js/tile-factory.js` | Rewrite | Top-Down Rechteck-Tiles statt Diamanten, PA-Farbpalette |
| `js/sprite-factory.js` | Rewrite | PA-Figuren statt Kairosoft, 4 Richtungen, 2-3 Frames |
| `js/sprites.js` | Modify | Direction-State, weniger Frames (3 statt 4-6), PA-Animation-Logic |
| `js/renderer.js` | Rewrite | Top-Down statt Iso, Layer-Rendering statt Depth-Sort, Wand-Rendering als Linien |
| `js/movement.js` | Modify | Direction-Berechnung aus Bewegungsvektor |
| `js/particles.js` | Modify | Unicode-basiertes Rendering statt Canvas-Formen |
| `js/ui.js` | Modify | Dark-Theme-DOM-Updates, Mini-Portraits, Ticker-Scrolling |
| `js/main.js` | Modify | Grid-Import statt Iso, Partikel-Position vereinfacht |
| `css/style.css` | Rewrite | Dunkles funktionales Theme, Ticker-Animation, Portrait-Styling |
| `index.html` | Modify | Canvas 680×500, Dark-Theme Klassen |
| `test.html` | Modify | Tests an neue Module anpassen |
| Tests | Modify | iso.test.js → grid.test.js, Tile/Sprite/Renderer-Tests aktualisieren |

## Nicht betroffen

- `js/data.js`, `js/state.js`, `js/engine.js`
- `js/animals.js`, `js/staff.js`, `js/matching.js`
- `js/events.js`, `js/progression.js`, `js/simulation.js`
- `js/audio.js`
- `js/test-runner.js`
