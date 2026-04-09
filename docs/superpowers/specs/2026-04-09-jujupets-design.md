# JujuPets — Tierheim-Wirtschaftssimulation

## Übersicht

JujuPets ist eine Echtzeit-Wirtschaftssimulation im Kairosoft-Stil (Game Dev Story), in der der Spieler ein Tierheim leitet. Ziel ist es, Tiere aufzunehmen, gut zu versorgen und an passende Besitzer zu vermitteln. Pixel-Art-Grafik, Single-View-UI, 20-Jahres-Story-Modus gefolgt von Endlos-Spiel.

## Technologie

- **Pure HTML5 Canvas + Vanilla JS** — kein Framework, kein Build-Step
- **Canvas** (480x320, skaliert via `image-rendering: pixelated`) für die Pixel-Art-Tierheim-Ansicht
- **DOM-Overlays** für UI-Elemente (Stats, Menüs, Dialoge)
- **LocalStorage** für Spielstände (Auto-Save + manuelle Saves, JSON-Export)

## Core Gameplay Loop

```
Tier kommt an → Aufnahme (Kosten) → Pflege & Training → Matching mit Interessenten → Adoption (Belohnung)
     ↑                                    ↓
     └──── Reputation steigt ← ── Erfolgreiche Vermittlung
```

Jedes Tier ist ein individuelles "Projekt" mit eigenem Fortschritt. Der Spieler entscheidet, welches Personal welchem Tier zugewiesen wird, wann ein Tier bereit für die Vermittlung ist, und welchem Bewerber es zugewiesen wird.

## Spieltempo

- Echtzeit-Simulation (Kairosoft-Stil): Zeit läuft kontinuierlich, Spieler greift an Schlüsselstellen ein
- Geschwindigkeiten: Pause / x1 / x2 / x3
- 20 In-Game-Jahre im Story-Modus (~2-3 Stunden Spielzeit)

## Tiere

### Tierarten (freischaltbar)

| Tierart | Freischaltung |
|---------|--------------|
| Hunde | Von Anfang an |
| Katzen | Von Anfang an |
| Kaninchen | Jahr 3-4 |
| Kleintiere (Hamster, Meerschweinchen) | Jahr 5-6 |
| Vögel (Wellensittiche, Kanarienvögel) | Jahr 7-8 |

### Tier-Attribute

**Stats (veränderbar durch Pflege):**
- Gesundheit
- Glück
- Training
- Sozialverhalten

**Bedürfnisse (variieren nach Tierart):**
- Futter
- Medizin
- Auslauf
- Zuwendung

**Persönlichkeit (4 Achsen, fest bei Aufnahme):**
- Ruhig ↔ Aktiv
- Scheu ↔ Zutraulich
- Verspielt ↔ Gemütlich
- Eigensinnig ↔ Folgsam

## Ressourcen

| Ressource | Quelle | Verwendung |
|-----------|--------|------------|
| **Geld** | Adoptionsgebühren, Spenden, Events | Futter, Medizin, Gehälter, Upgrades |
| **Reputation** | Erfolgreiche Adoptionen, Events, Inspektionen | Schaltet Tierarten frei, zieht bessere Bewerber an, erhöht Spendenrate |
| **Tierglück** (pro Tier) | Gute Pflege, Training, Auslauf | Beeinflusst Adoptionserfolg und Reputation |
| **Personal-Energie** (pro Mitarbeiter) | Regeneriert über Zeit | Begrenzt Aktionen pro Tag |

## Personal

| Rolle | Freischaltung | Skill | Effekt |
|-------|--------------|-------|--------|
| Pfleger | Von Anfang an | Füttern, Säubern | Grundbedürfnisse der Tiere |
| Tierarzt | Jahr 3-4 | Behandeln, Impfen | Gesundheit, Krankheiten heilen |
| Trainer | Jahr 5-6 | Trainieren, Sozialisieren | Training-Stat + Sozialverhalten |
| Vermittler | Jahr 7-8 | Matching, Beratung | Bessere Adoption-Matches, schnellere Vermittlung |

Jeder Mitarbeiter hat **Level + Erfahrung** — verbessert sich durch Arbeit und kann durch Investitionen trainiert werden.

## Matching-System & Adoption

### Potenzielle Besitzer

Erscheinen periodisch (häufiger bei hoher Reputation). Jeder hat:
- **Persönlichkeits-Präferenzen:** Gewünschte Eigenschaften auf den 4 Persönlichkeitsachsen
- **Profil:** Wohnsituation (Wohnung/Haus/Garten), Erfahrung (Erstbesitzer/Erfahren), Haushalt (Kinder/Allein/Senioren)
- **Geduld:** Wie lange sie warten, bevor sie abspringen

### Matching-Score

- Tier-Persönlichkeit ↔ Besitzer-Präferenzen: 40%
- Tier-Trainingslevel: 25%
- Tier-Gesundheit & Glück: 20%
- Vermittler-Skill: 15%

### Adoptionsergebnis

| Match-Qualität | Effekt |
|----------------|--------|
| Perfekt (>85%) | Hohe Adoptionsgebühr + großer Reputationsbonus + Chance auf Weiterempfehlung |
| Gut (60-85%) | Normale Gebühr + normaler Reputationsgewinn |
| Schlecht (<60%) | Geringe Gebühr + Reputationsverlust + Risiko der Tier-Rückgabe |

**Tier-Rückgabe:** Tier verliert Glück, Reputation sinkt, Tier blockiert erneut einen Platz. Erzeugt die Kern-Entscheidungsspannung: schnell vermitteln vs. auf besseren Match warten.

## Progression (Story-Modus — 20 Jahre)

| Jahr | Meilenstein |
|------|-------------|
| 1-2 | Tutorial, Hunde & Katzen, 1 Pfleger, kleines Tierheim |
| 3-4 | Tierarzt einstellbar, Kaninchen freigeschaltet |
| 5-6 | Trainer einstellbar, Kleintiere freigeschaltet |
| 7-8 | Vermittler einstellbar, Vögel freigeschaltet |
| 9-11 | Tierheim-Erweiterung Stufe 1 (mehr Plätze), Personal-Spezialisierungen (z.B. Pfleger → Experte für Kleintiere) |
| 12-14 | Tierheim-Erweiterung Stufe 2, Premium-Ausstattung (bessere Gehege, Trainingsplatz, Krankenstation) |
| 15-17 | Außenstelle (zweiter Standort mit eigenen Plätzen, passiv verwaltet), Transfer-System zwischen Standorten |
| 18-20 | Finale Events, Endwertung, Hall of Fame |

**Endlos-Modus:** Nach Jahr 20 freigeschaltet. Alle Features verfügbar, kein Zeitlimit, Fokus auf Highscore (meiste Adoptionen, höchste Reputation).

## Events

### Geplante Events

| Event | Rhythmus | Effekt |
|-------|----------|--------|
| Adoptionsfest | Monatlich | Mehr Besucher, Bonus-Adoptionen |
| Tierschutz-Inspektion | Quartalsweise | Reputation +/- je nach Tierheim-Zustand |

### Zufalls-Events

| Event | Effekt |
|-------|--------|
| Ausgesetztes Tier | Neues Tier mit schlechten Stats, kostenlose Aufnahme |
| Krankheitsausbruch | Mehrere Tiere krank, Tierarzt-Bedarf steigt |
| Promi-Besuch | Großer Reputationsbonus oder Spende |
| Spenden-Aktion | Einmaliger Geldzufluss |
| Pressebericht | Reputation +/- je nach aktuellem Zustand |

## UI-Layout (Single View, Kairosoft-Stil)

```
┌─────────────────────────────────────────────────────────┐
│ 💰 $12,450    ⭐ Rep: 72    📅 Jahr 3 - Mär W2   ▶▶ x2 │  ← Stats-Leiste (DOM)
├────────────────────────────────────┬────────────────────┤
│                                    │ PERSONAL           │
│    TIERHEIM-ANSICHT (Canvas)       │ Max Lv.3 ⚡80%     │
│                                    │ Dr. Mia Lv.2 ⚡45% │
│    Pixel-Art-Darstellung der       │                    │  ← Seitenpanel (DOM)
│    Gehege, Tiere, Personal         │ BEWERBER           │
│                                    │ Fam. Klein 🏠🌳   │
│                                    │ Match: 82%         │
│                                    │                    │
│                                    │ [Aufnehmen]        │
│                                    │ [Vermitteln]       │
│                                    │ [Einkaufen]        │
│                                    │ [Personal]         │
├────────────────────────────────────┴────────────────────┤
│ 📢 Adoptionsfest in 2 Wochen! | Luna ist wieder gesund! │  ← Event-Ticker (DOM)
└─────────────────────────────────────────────────────────┘
```

## Projektstruktur

```
index.html          — Einstiegspunkt
css/style.css       — UI-Styles
js/engine.js        — Game Loop, Timing, Geschwindigkeitssteuerung
js/state.js         — Zentraler Spielzustand, Save/Load
js/simulation.js    — Tick-Logik (Tiere, Personal, Events)
js/renderer.js      — Canvas-Rendering (Pixel-Art Tierheim)
js/ui.js            — DOM-Overlays, Menüs, Dialoge
js/matching.js      — Adoption-Matching-Algorithmus
js/data.js          — Tierarten, Besitzertypen, Events, Balancing-Werte
assets/sprites/     — Pixel-Art Sprites (Tiere, Personal, Gebäude)
```
