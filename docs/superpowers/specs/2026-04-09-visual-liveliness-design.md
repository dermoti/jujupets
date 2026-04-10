# JujuPets — Visuelle Lebendigkeit

## Übersicht

Die isometrische Szene wird lebendig: Tiere wandern in ihren Gehegen umher, Personal läuft sichtbar zu zugewiesenen Tieren, Deko-Objekte und Möbel füllen die Karte, Partikel-Effekte geben visuelles Feedback, Wasser animiert sich, und die Wall-Tiles werden korrekt gezeichnet. Spiellogik bleibt unverändert — alle Änderungen sind rein visuell/renderer-seitig.

## 1. Bewegungssystem

### Neues Modul: `js/movement.js`

Verwaltet `worldPos` (float col/row für Interpolation) und `targetTile` (ganzzahlig) für alle Entitäten.

### Tier-Bewegung (Random Walk)

- Jedes Tier hat `worldPos: {col: float, row: float}` und `targetTile: {col: int, row: int}`
- Initialisierung: Position basierend auf Gehege-Zone und `animal.id` (wie bisher in renderer.js)
- Alle 3-5 Sekunden (randomisiert): neues Ziel-Tile innerhalb des Geheges, 1-2 Tiles entfernt
- Bewegungsgeschwindigkeit: 0.5 Tiles/Sekunde
- Beim Ankommen: Pause 2-4 Sekunden, dann neues Ziel
- Ziel muss innerhalb der Gehege-Zone liegen (kein Fence-Tile, kein Überlaufen)
- Wenn Tier gefüttert wird oder Pfleger arbeitet: Tier bleibt stehen (Pause verlängert)

### Personal-Bewegung (Wegpunkt-System)

- Personal hat `worldPos`, `targetTile`, und `waypoints: [{col, row}]`
- Berechnung der Wegpunkte: aktuelle Position → nächstes `path`-Tile → entlang der `path`-Tiles zum Ziel-Gehege → neben dem zugewiesenen Tier
- Wegpunkt-Algorithmus: Von aktuellem Tile, finde benachbartes `path`-Tile (4 Richtungen). Folge den `path`-Tiles Richtung Ziel (Greedy: wähle das path-Tile mit geringstem Manhattan-Abstand zum Ziel). Kein A* nötig.
- Bewegungsgeschwindigkeit: 1.0 Tiles/Sekunde
- Am Ziel: `_working = true` auf dem Staff-Objekt setzen, Work-Animation spielt
- Wenn Zuweisung aufgehoben: Wegpunkte zum Empfang (col: 6, row: 17), am Empfang: `_working = false`
- Idle-Personal steht im Empfangsbereich (Zeile 16-17, Spalte 5-8)

### Integration mit Renderer

`renderer.js` liest `worldPos` aus dem Bewegungssystem statt Positionen selbst zu berechnen. Die Funktionen `getAnimalPosition` und `getStaffPosition` werden durch Lookups ins Bewegungssystem ersetzt.

### Modul-Schnittstelle

```
createMovementSystem(tileMap) → {
  initAnimal(animal, zone)           // Setzt Startposition im Gehege
  initStaff(staff)                   // Setzt Startposition im Empfang
  removeEntity(id)                   // Entfernt Entität (bei Adoption/Entlassung)
  update(dt, state)                  // Tick: bewegt alle Entitäten, berechnet Wegpunkte
  getPosition(id) → {col, row}      // Aktuelle float-Position für Rendering
  isMoving(id) → boolean            // Für Animations-Auswahl
}
```

## 2. Deko & Möbel

### Erweiterung: `js/tilemap.js`

Neue Funktion `getDecoMap()` gibt ein 24x24 Array zurück mit Deko-Objekt-IDs (oder `null`). Die Deko-Map wird beim Erstellen der Tile-Map mitgeneriert. Deko liegt ÜBER den Boden-Tiles und wird als separate Render-Schicht mit `depthKey(col, row, 1)` gerendert.

### Deko-Typen

| ID | Größe | Wo | Beschreibung |
|---|---|---|---|
| `tree_oak` | 64x96px | Außenbereich, verstreut | Eiche mit runder Krone |
| `tree_pine` | 64x96px | Ränder der Karte | Nadelbaum |
| `bush` | 32x32px | Neben Wegen | Kleiner grüner Busch |
| `bench` | 64x32px | Am Hauptweg | Holzbank |
| `flower_bed` | 64x32px | Vor dem Gebäude | Blumenbeet |
| `cage` | 64x64px | Innenkäfige-Raum (Zeile 10-14, Spalte 3-6) | Offener Käfig |
| `treatment_table` | 64x64px | Behandlungsraum (Zeile 10-13, Spalte 7-9) | Edelstahl-Tisch |
| `counter` | 64x64px | Empfang (Zeile 16-17, Spalte 5-8) | Holztresen |
| `shelf` | 64x64px | Lager (Zeile 14-16, Spalte 9-11) | Regal mit Futtersäcken |
| `food_bowl` | 32x16px | In jedem Gehege, 1-2 pro Zone | Futterschale |
| `water_bowl` | 32x16px | In jedem Gehege, 1-2 pro Zone | Wasserschale |
| `climbing_tree` | 32x64px | Katzen-Gehege | Kratzbaum |

### Sprite-Erstellung

Neue Funktion `createDecoSpriteSheet()` in `js/sprite-factory.js`. Zeichnet alle Deko-Sprites prozedural in ein gecachtes Canvas. Rückgabe: Objekt mit `{[decoId]: {canvas, w, h}}`.

### Platzierung

Deko-Positionen sind fest in `tilemap.js` definiert (nicht zufällig). Bäume an den Rändern, Möbel in den definierten Raum-Positionen, Schalen in den Gehegen.

## 3. Partikel-Effekte

### Neues Modul: `js/particles.js`

Leichtgewichtiges 2D-Partikelsystem das direkt auf dem Canvas rendert.

### Partikel-Datenstruktur

```
{
  x, y,           // Screen-Position (Pixel)
  vx, vy,         // Geschwindigkeit (Pixel/Sekunde)
  life,           // Verbleibende Lebensdauer (ms)
  maxLife,         // Maximale Lebensdauer (ms)
  type,           // 'heart' | 'star' | 'note' | 'sparkle'
  size,           // Pixelgröße
  color            // Hex-Farbe
}
```

### Partikel-Typen

| Typ | Form | Farbe | Verhalten |
|---|---|---|---|
| `heart` | Kleines Herz (5x5px) | #E91E63 | Steigt langsam auf, leichtes Schwanken |
| `star` | Stern-Form (7x7px) | #F9A825 | Schießt nach oben+außen, rotiert |
| `note` | Musiknote (5x7px) | #7E57C2 | Steigt auf, schwingt seitlich |
| `sparkle` | Punkt (3x3px) | #FFFFFF | Steigt schnell, fadet schnell |

### Emitter-Triggers

| Spielereignis | Partikel | Menge | Intervall |
|---|---|---|---|
| Tier Glück > 0.7 | heart | 1 | alle 3 Sekunden |
| Erfolgreiche Adoption | star | 5 auf einmal | einmalig |
| Füttern (Shop) | sparkle | 1 pro Tier | einmalig |
| Vogel idle | note | 1 | alle 4 Sekunden |
| Personal arbeitet | sparkle | 1 | alle 2 Sekunden |

### Performance

- Maximum: 50 aktive Partikel gleichzeitig
- Älteste Partikel werden entfernt wenn Limit erreicht
- Kein Sprite-Sheet — Partikel werden als simple Canvas-Formen gezeichnet (fillRect, arc)

### Modul-Schnittstelle

```
createParticleSystem() → {
  emit(type, x, y, count)      // Erzeugt count Partikel vom Typ an Position
  update(dt)                    // Bewegt und altert Partikel
  render(ctx)                   // Zeichnet alle aktiven Partikel
  get count                     // Anzahl aktiver Partikel
}
```

### Rendering

Partikel werden NACH der depth-sortierten Tile/Sprite-Schicht gerendert (immer im Vordergrund). `renderer.js` ruft `particles.render(ctx)` am Ende des Render-Loops auf.

## 4. Wasser-Animation

### Änderung in `js/tile-factory.js`

`drawWater()` erzeugt 3 Canvas-Varianten mit unterschiedlichen Wellen-Positionen:
- Frame 0: Welle links
- Frame 1: Welle mittig
- Frame 2: Welle rechts

`createTileCache()` gibt `water` als Array `[canvas0, canvas1, canvas2]` zurück statt einzelnes Canvas.

### Änderung in `js/renderer.js`

Wasser-Tiles erhalten den Frame-Index über einen zeitbasierten Counter: `Math.floor(Date.now() / 500) % 3`. Alle Wasser-Tiles auf der Map animieren synchron.

## 5. Wall-Tile-Fix

### Änderung in `js/tile-factory.js`

In `drawWallBack`, `drawWallLeft`, `drawWallRight`: Die `drawDiamond()`-Aufrufe für die Dachfläche werden von `y = 0` nach `y = wallH - TILE_H` verschoben, sodass die Dachfläche am oberen Rand der Wand sitzt und nicht die Wandfläche überlappt.

Die aktuelle Zeichenreihenfolge malt die Wandfläche zuerst und die Dachraute (Diamond) danach bei y=0. Dadurch überdeckt die Raute den oberen Teil der Wand. Korrektur: Die Wandflächen-Vertices müssen so angepasst werden, dass sie von `y = TILE_H` (untere Hälfte der Dachraute) bis `y = wallH` reichen, damit Dachraute und Wandfläche nahtlos anschließen ohne sich zu überdecken.

## Geänderte Dateien

| Datei | Art | Änderung |
|---|---|---|
| `js/movement.js` | **Neu** | Bewegungssystem (Random-Walk + Wegpunkt-Navigation) |
| `js/particles.js` | **Neu** | Partikelsystem mit Emittern und Rendering |
| `js/tilemap.js` | Modify | `getDecoMap()` hinzufügen mit festen Deko-Positionen |
| `js/tile-factory.js` | Modify | Wasser 3 Frames, Wall-Fix |
| `js/sprite-factory.js` | Modify | `createDecoSpriteSheet()` hinzufügen |
| `js/renderer.js` | Modify | Bewegungspositionen lesen, Deko rendern, Partikel rendern, Wasser-Animation |
| `js/simulation.js` | Modify | `movement.update(dt, state)` pro Tick aufrufen |
| `js/main.js` | Modify | Bewegungs- + Partikelsystem initialisieren und in Engine-Loop einbinden |
| `tests/movement.test.js` | **Neu** | Tests: initAnimal, initStaff, update, getPosition, Gehege-Grenzen |
| `tests/particles.test.js` | **Neu** | Tests: emit, update lifecycle, count limit, render callback |

## Nicht betroffen

Spiellogik-Module bleiben unverändert:
- `js/data.js`, `js/state.js`, `js/engine.js`
- `js/animals.js`, `js/staff.js`, `js/matching.js`
- `js/events.js`, `js/progression.js`
- `js/iso.js`, `js/camera.js`
- `js/ui.js` (nur DOM-Updates, keine Render-Änderungen)
