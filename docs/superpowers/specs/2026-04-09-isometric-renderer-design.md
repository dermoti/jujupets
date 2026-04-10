# JujuPets — Isometrisches Rendering & UI-Redesign

## Übersicht

Komplett-Redesign des visuellen Systems: flaches Grid-Rendering → animierte isometrische Pixel-Art mit Cutaway-Gebäude, Außengelände und warmem Holz/Pergament-UI-Theme. Betrifft Renderer, CSS, HTML-Struktur und Asset-Pipeline. Spiellogik bleibt unverändert.

## Isometrisches Grid

- **Tile-Größe:** 64x32px (2:1 Standard-Isometrie)
- **Map-Größe:** 24x24 Tiles
- **Projektion:** `screenX = (col - row) * 32 + offsetX`, `screenY = (col + row) * 16 + offsetY`
- **Canvas:** 640x480px, skaliert via `image-rendering: pixelated`
- **Kamera:** Scrollbar (Maus-Drag + WASD), begrenzt auf Map-Ränder

### Tile-Typen

| Tile-ID | Darstellung | Verwendung |
|---------|-------------|------------|
| `grass` | Grüne Raute, 2-3 Varianten | Außenfläche Standard |
| `grass_flower` | Gras mit Blumen-Akzent | Deko-Variation |
| `path` | Beiger Sandweg | Verbindungswege |
| `floor` | Holzboden-Planken | Innenräume |
| `wall_left` | Wand links (Cutaway) | Gebäude-Seitenwand |
| `wall_right` | Wand rechts (Cutaway) | Gebäude-Seitenwand |
| `wall_back` | Niedrige Rückwand | Tiefe im Cutaway |
| `fence` | Holzzaun-Segment | Außengehege-Begrenzung |
| `water` | Blaue Animation (3 Frames) | Teich/Wasserstelle |

### Tiefensortierung

Alle renderbaren Objekte (Boden-Tiles, Wände, Sprites, Deko) werden in einem Render-Array gesammelt und nach `row + col` (+ Objekt-Höhe als Tiebreaker) sortiert. Boden-Tiles werden immer vor Objekten auf dem gleichen Tile gerendert.

## Tierheim-Layout

Die 24x24 Map ist in Zonen aufgeteilt:

```
  Zeile 0-7:   Außenbereich Nord — Auslaufwiese, Bäume, Hunde-Außengehege
  Zeile 8-17:  Mittelteil — Gebäude (Cutaway) links, Katzen-/Kleintier-Gehege rechts
  Zeile 18-23: Eingangsbereich — Weg, Empfang, Parkplatz
```

### Gebäude (Cutaway-Stil)

Das Gebäude belegt ca. Spalten 2-11, Zeilen 8-17. Darstellung:
- Rückwand (Zeile 8): niedrige `wall_back`-Tiles, ~16px hoch
- Seitenwände (Spalte 2, Spalte 11): `wall_left` / `wall_right`-Tiles
- Dach fehlt bewusst (Cutaway) — man sieht direkt die Innenräume
- Bodenfläche: `floor`-Tiles

**Innenräume:**
| Raum | Position (ca.) | Inhalt |
|------|----------------|--------|
| Empfang | Zeile 16-17, Spalte 5-8 | Tresen, Stühle |
| Innenkäfige | Zeile 10-14, Spalte 3-6 | Käfig-Sprites, Tiere darin |
| Behandlungsraum | Zeile 10-13, Spalte 7-9 | Behandlungstisch, Medizin-Schrank |
| Lager | Zeile 14-16, Spalte 9-11 | Futter-Säcke, Regale |

### Außenbereich

| Zone | Position (ca.) | Inhalt |
|------|----------------|--------|
| Hunde-Auslauf | Zeile 1-6, Spalte 3-10 | Große Graszone mit Zaun |
| Katzen-Gehege | Zeile 9-13, Spalte 13-18 | Kleinere Zaun-Areale, Kletterbäume |
| Kleintier-Gehege | Zeile 14-17, Spalte 14-18 | Kleine Zaun-Areale |
| Vogel-Voliere | Zeile 9-12, Spalte 19-22 | Hohe Gitter-Sprites |
| Bäume & Deko | Verteilt | Bäume, Büsche, Bänke, Blumen |
| Wege | Verbindend | `path`-Tiles vom Eingang zu allen Bereichen |

## Sprite-System

### Sprite-Größen

| Kategorie | Größe | Frames/Animation |
|-----------|-------|------------------|
| Tiere | 32x32px | 4 |
| Personal | 32x48px | 4-6 |
| Möbel/Objekte | 64x64px | 1 (statisch) |
| Bäume/Große Deko | 64x96px | 1 (statisch) |

### Tier-Animationen

Jede Tierart hat ein Sprite-Sheet mit diesen Zeilen:

| Zeile | Animation | Trigger | Beschreibung |
|-------|-----------|---------|--------------|
| 0 | idle | Standard | Atmen, leicht bewegen |
| 1 | happy | Glück > 0.7 | Schwanz wedeln, Schnurren-Pose |
| 2 | sad | Glück < 0.3 | Kopf hängen, zusammenrollen |
| 3 | eating | Wird gefüttert | Fressanimation |

5 Tierarten × 4 Animationen × 4 Frames = 80 Tier-Sprites total.

### Personal-Animationen

| Zeile | Animation | Trigger |
|-------|-----------|---------|
| 0 | idle | Nicht zugewiesen, steht im Empfang |
| 1 | walk | Bewegt sich zum zugewiesenen Tier (4 Richtungen: S, W, N, O → je 6 Frames) |
| 2 | work | Führt Pflege/Training/Behandlung aus |

4 Rollen × 3 Animationen = 12 Personal-Animationssets.

### Bewegungssystem

- **Tiere:** Bewegen sich zufällig innerhalb ihres Geheges (2-3 Tiles Radius). Einfaches Random-Walk: wähle zufällige Nachbar-Tile innerhalb der Gehege-Zone, bewege dorthin.
- **Personal:** Bewegt sich auf dem Pfad zum zugewiesenen Tier. Einfaches Wegpunkt-System: gehe zum nächsten `path`-Tile Richtung Ziel, dann zum Gehege. Kein A* nötig — Wege sind vorgegebene Pfad-Tiles.

### Sprite-Erstellung (Hybrid-Ansatz)

- **Tiles (Boden, Wände, Zäune):** Prozedural im Code gezeichnet via Canvas-Befehle. Werden einmalig in ein Offscreen-Canvas gerendert und als Texture gecacht.
- **Tiere & Personal:** Einfache 32x32/32x48 PNG-Sprite-Sheets. Pixel-Art mit wenigen Farben, charmant-simpel. Werden als Image-Elemente geladen.
- **Möbel & Deko:** Mix — einfache Objekte prozedural, komplexere als PNG.

## UI-Redesign

### Farbpalette

| Verwendung | Farbe | Hex |
|-----------|-------|-----|
| Himmel/Hintergrund | Warmes Hellblau | `#87CEEB` |
| Gras hell | Grasgrün | `#7CB342` |
| Gras dunkel | Waldgrün | `#689F38` |
| Holz hell | Warmes Beige | `#D7A86E` |
| Holz dunkel | Sattel-Braun | `#8B4513` |
| Pergament | Creme | `#FFF8E1` |
| Text | Dunkelbraun | `#4E342E` |
| Akzent/Gold | Warmes Gold | `#F9A825` |
| Negativer Akzent | Warmes Rot | `#E53935` |
| Positiver Akzent | Warmes Grün | `#43A047` |

### Stats-Bar

- Hintergrund: Holzbalken-Textur (CSS-Gradient oder Bild)
- Pixel-Art-Icons: Münze (Geld), Stern (Reputation), Kalender (Datum)
- Schriftart: Pixel-Font
- Geschwindigkeitsbuttons: Holz-Stil, aktiver Button leuchtet gold

### Seitenpanel

- Hintergrund: Pergament-Textur (CSS-Gradient)
- Holzrahmen als Border (dunkles Braun, 3px)
- Mini-Sprite-Portraits neben Tier- und Staff-Namen
- Buttons im Holz/Leder-Look (braun, abgerundet)
- Bewerber-Liste mit Match-Score als farbige Leiste

### Event-Ticker

- Holztafel-Hintergrund
- Scrollende Laufschrift (CSS-Animation)
- Kleine Pixel-Icons je nach Event-Typ

### Dialoge

- Holzrahmen mit Pergament-Innenfläche
- Abgerundete Ecken, leichter Schatten
- Buttons passend zum Theme
- Tier-Portrait im Dialog bei Tier-bezogenen Aktionen

### Pixel-Font

Einbettung eines freien Pixel-Fonts via `@font-face` (z.B. "Press Start 2P" von Google Fonts oder ein ähnlicher freier Font als .woff2-Datei lokal eingebettet).

## Geänderte Dateien

| Datei | Art | Änderung |
|-------|-----|----------|
| `js/renderer.js` | Rewrite | Isometrisches Tile-Rendering, Kamera, Tiefensortierung |
| `css/style.css` | Rewrite | Holz/Pergament-Theme, Pixel-Font, neue Layout-Maße |
| `index.html` | Modify | Canvas 640x480, ggf. strukturelle UI-Anpassungen |
| `js/main.js` | Modify | Kamera-Steuerung anbinden, Asset-Loading |
| `tests/renderer.test.js` | Rewrite | Tests für isometrische Projektion + Layout |

## Neue Dateien

| Datei | Verantwortung |
|-------|---------------|
| `js/iso.js` | Isometrische Mathe: worldToScreen, screenToWorld, Tiefensortierung |
| `js/camera.js` | Kamera-Position, Scrolling (Drag + WASD), Begrenzung |
| `js/tilemap.js` | Tile-Map-Daten (24x24), Zonen-Definition, Tile-Typ-Lookup |
| `js/sprites.js` | Sprite-Sheet-Loading, Frame-Animation-Steuerung, Sprite-Pool |
| `js/tile-factory.js` | Prozedurale Tile-Generierung (Gras, Weg, Boden, Wand) ins Offscreen-Canvas |
| `assets/animals/dog.png` | Hund Sprite-Sheet (4 Animationen × 4 Frames) |
| `assets/animals/cat.png` | Katze Sprite-Sheet |
| `assets/animals/rabbit.png` | Kaninchen Sprite-Sheet |
| `assets/animals/smallpet.png` | Kleintier Sprite-Sheet |
| `assets/animals/bird.png` | Vogel Sprite-Sheet |
| `assets/staff/caretaker.png` | Pfleger Sprite-Sheet |
| `assets/staff/vet.png` | Tierarzt Sprite-Sheet |
| `assets/staff/trainer.png` | Trainer Sprite-Sheet |
| `assets/staff/matchmaker.png` | Vermittler Sprite-Sheet |
| `assets/ui/icons.png` | UI-Icons (Münze, Stern, Kalender, Herz, etc.) |
| `assets/fonts/pixel.woff2` | Pixel-Font |
| `tests/iso.test.js` | Tests: worldToScreen, screenToWorld, Sortierung |
| `tests/camera.test.js` | Tests: Kamera-Bounds, Scrolling-Berechnung |
| `tests/tilemap.test.js` | Tests: Tile-Lookup, Zonen-Zugehörigkeit |

## Nicht betroffen

Diese Dateien bleiben unverändert — die Spiellogik ändert sich nicht:
- `js/data.js`, `js/state.js`, `js/engine.js`
- `js/animals.js`, `js/staff.js`, `js/matching.js`
- `js/events.js`, `js/progression.js`, `js/simulation.js`
- `js/ui.js` — Modify: `formatMoney`, `formatDate`, `formatStaffEntry` bleiben. `createUI` wird angepasst für neues Theme (Mini-Portraits, Holz-Buttons). Kein Rewrite.
