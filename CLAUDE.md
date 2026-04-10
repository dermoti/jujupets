# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

JujuPets — Kairosoft-style real-time animal shelter management sim. Pure vanilla HTML5/CSS/JS, no build step, no framework.

## Running

- Serve locally: `python3 -m http.server 8080` then open `http://localhost:8080`
- Run tests: open `http://localhost:8080/test.html`
- No npm, no bundler, no compilation needed

## Architecture

ES modules throughout (`<script type="module">`). Canvas (680x500) for pixel-art shelter view, DOM overlays for UI.

- `js/main.js` — bootstrap, wires engine + state + renderer + ui + simulation, handles dialogs
- `js/engine.js` — rAF game loop, speed control (pause/x1/x2/x3), tick dispatch
- `js/state.js` — central game state object, save/load (LocalStorage), time advancement
- `js/data.js` — all static data: species, personality axes, staff roles, events, balancing constants
- `js/animals.js` — animal factory, per-tick need decay, happiness/health logic
- `js/staff.js` — staff factory, energy regen, work effects, leveling
- `js/matching.js` — owner generation, 4-factor match score, adoption execution with return risk
- `js/events.js` — planned events (monthly/quarterly) + weighted random events
- `js/progression.js` — year-based milestone unlocks, endgame, final score
- `js/simulation.js` — orchestrates one sim tick: animals → staff → owners → events → milestones
- `js/renderer.js` — canvas rendering of shelter grid, animals, staff
- `js/ui.js` — DOM overlay management: stats bar, panels, ticker, dialogs
- `js/grid.js` — top-down grid coordinate transforms (toScreen, toGrid, TILE_SIZE, MAP_COLS, MAP_ROWS)
- `js/camera.js` — camera viewport with WASD/drag scrolling and bounds clamping
- `js/tilemap.js` — 24x24 tile map with zone definitions (dogRun, building, catEnclosure, etc.)
- `js/tile-factory.js` — procedural tile graphics drawn into offscreen canvases
- `js/sprite-factory.js` — procedural animal and staff sprite sheets with animation frames
- `js/sprites.js` — animation state controller for frame timing and animation selection
- `js/movement.js` — entity movement: animal random-walk within zones, staff waypoint navigation along paths
- `js/particles.js` — particle effects: hearts (happy), stars (adoption), notes (birds), sparkles (working/feeding)
- `js/audio.js` — procedural audio engine: Web Audio API chiptune sequencer, 10 SFX, ambient layer, 3-channel volume + master mute

## Testing

Browser-based test runner (`js/test-runner.js`). Tests are ES modules in `tests/`. Add new test files by importing them in `test.html`.

## Key Design Decisions

- Matching score: 40% personality, 25% training, 20% health+happiness, 15% matchmaker staff — with profile-based modifiers (housing/experience/household)
- Bad matches (<60%) risk animal return (30% chance), costing reputation and animal happiness
- Time: 24 ticks/day, 7 days/week, 4 weeks/month, 12 months/year, 20 years story mode
- All game data constants live in `js/data.js` BALANCING object for easy tuning
