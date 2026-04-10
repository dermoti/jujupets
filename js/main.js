import { createEngine } from './engine.js';
import { createNewState, loadState, saveState } from './state.js';
import { createRenderer } from './renderer.js';
import { createTileMap } from './tilemap.js';
import { createCamera } from './camera.js';
import { createUI } from './ui.js';
import { simulateTick } from './simulation.js';
import { createAnimal } from './animals.js';
import { createStaff, assignStaff, unassignStaff } from './staff.js';
import { calculateMatchScore, executeAdoption, createOwner } from './matching.js';
import { enableEndless, calculateFinalScore } from './progression.js';
import { SPECIES, STAFF_ROLES, BALANCING } from './data.js';
import { worldToScreen, TILE_W, TILE_H } from './iso.js';

const canvas = document.getElementById('shelter-canvas');
const tileMap = createTileMap();
const renderer = createRenderer(canvas, tileMap);
const worldSize = renderer.getWorldSize();
const camera = createCamera(canvas.width, canvas.height, worldSize.w, worldSize.h);

const buildingCenter = worldToScreen(7, 13, TILE_W, TILE_H);
camera.centerOn(buildingCenter.x + worldSize.w / 4, buildingCenter.y);

const engine = createEngine();
engine.setMsPerTick(BALANCING.msPerTick);

let state = loadState() || createNewState();
let autoSaveCounter = 0;

const ui = createUI(state, {
  onSetSpeed(speed) { engine.setSpeed(speed); },
  onAction(action) {
    switch (action) {
      case 'intake': showIntakeDialog(); break;
      case 'adopt':  showAdoptDialog();  break;
      case 'shop':   showShopDialog();   break;
      case 'staff':  showStaffDialog();  break;
    }
  },
});

// Camera controls
const keys = {};
document.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; });
document.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

let dragging = false;
let dragStartX = 0, dragStartY = 0;
canvas.addEventListener('mousedown', e => {
  dragging = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
});
document.addEventListener('mousemove', e => {
  if (!dragging) return;
  const dx = dragStartX - e.clientX;
  const dy = dragStartY - e.clientY;
  camera.move(dx, dy);
  dragStartX = e.clientX;
  dragStartY = e.clientY;
});
document.addEventListener('mouseup', () => { dragging = false; });

engine.onTick = (ticks) => {
  const scrollSpeed = 4;
  if (keys['w'] || keys['arrowup']) camera.move(0, -scrollSpeed);
  if (keys['s'] || keys['arrowdown']) camera.move(0, scrollSpeed);
  if (keys['a'] || keys['arrowleft']) camera.move(-scrollSpeed, 0);
  if (keys['d'] || keys['arrowright']) camera.move(scrollSpeed, 0);

  for (let i = 0; i < ticks; i++) {
    simulateTick(state);
  }
  autoSaveCounter += ticks;
  if (autoSaveCounter > BALANCING.ticksPerDay * 7) {
    saveState(state);
    autoSaveCounter = 0;
  }
  if (state.gameOver && !state.endless) {
    engine.setSpeed(0);
    showGameOverDialog();
  }
};

engine.onRender = (dt) => {
  renderer.render(state, camera, dt);
  ui.update(state);
};

function showIntakeDialog() {
  if (state.animals.length >= state.maxAnimals) {
    ui.showDialog('Kein Platz', 'Das Tierheim ist voll! Vermittle erst Tiere oder erweitere.', [
      { label: 'OK', onClick() {} }
    ]);
    return;
  }
  const available = state.unlockedSpecies;
  const content = available.map(key => {
    const sp = SPECIES[key];
    return `<button class="action-btn" data-species="${key}">${sp.name} (Kosten: $${Math.floor(sp.baseAdoptionFee * 0.3)})</button>`;
  }).join('');
  ui.showDialog('Tier aufnehmen', content, [{ label: 'Abbrechen', onClick() {} }]);
  document.querySelectorAll('[data-species]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.species;
      const cost = Math.floor(SPECIES[key].baseAdoptionFee * 0.3);
      if (state.money < cost) {
        ui.showDialog('Zu teuer', 'Nicht genug Geld.', [{ label: 'OK', onClick() {} }]);
        return;
      }
      state.money -= cost;
      const animal = createAnimal(key, state.nextId++);
      state.animals.push(animal);
      state.tickerMessages.push(`${animal.name} (${SPECIES[key].name}) aufgenommen!`);
      ui.hideDialog();
    });
  });
}

function showAdoptDialog() {
  if (state.owners.length === 0) {
    ui.showDialog('Keine Bewerber', 'Aktuell keine Adoptionsbewerber. Steigere deine Reputation!', [{ label: 'OK', onClick() {} }]);
    return;
  }
  if (state.animals.length === 0) {
    ui.showDialog('Keine Tiere', 'Keine Tiere im Tierheim.', [{ label: 'OK', onClick() {} }]);
    return;
  }
  let content = '<div style="margin-bottom:8px"><b>Bewerber w\u00e4hlen:</b></div>';
  for (const owner of state.owners) {
    content += `<button class="action-btn" data-owner="${owner.id}">${owner.name} (${owner.profile.housing}, ${owner.profile.experience})</button>`;
  }
  ui.showDialog('Vermittlung', content, [{ label: 'Abbrechen', onClick() {} }]);
  document.querySelectorAll('[data-owner]').forEach(btn => {
    btn.addEventListener('click', () => {
      const ownerId = parseInt(btn.dataset.owner);
      const owner = state.owners.find(o => o.id === ownerId);
      if (!owner) return;
      ui.hideDialog();
      showAnimalSelectDialog(owner);
    });
  });
}

function showAnimalSelectDialog(owner) {
  const matchmakerBonus = state.staff.filter(s => s.role === 'matchmaker').reduce((max, s) => Math.max(max, 0.3 + s.level * 0.1), 0);
  let content = `<div style="margin-bottom:8px"><b>${owner.name}</b> sucht ein Tier:</div>`;
  for (const animal of state.animals) {
    const score = calculateMatchScore(animal, owner, matchmakerBonus);
    const color = score >= 85 ? '#43A047' : score >= 60 ? '#F9A825' : '#E53935';
    content += `<button class="action-btn" data-animal="${animal.id}">${animal.name} (${SPECIES[animal.species].name}) \u2014 <span style="color:${color}">Match: ${Math.floor(score)}%</span></button>`;
  }
  ui.showDialog('Tier w\u00e4hlen', content, [{ label: 'Abbrechen', onClick() {} }]);
  document.querySelectorAll('[data-animal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const animalId = parseInt(btn.dataset.animal);
      const animal = state.animals.find(a => a.id === animalId);
      if (!animal) return;
      const score = calculateMatchScore(animal, owner, matchmakerBonus);
      const result = executeAdoption(state, animal, owner, score);
      state.tickerMessages.push(`${animal.name} vermittelt an ${owner.name}! Match: ${Math.floor(score)}%, Geb\u00fchr: $${result.fee}`);
      ui.hideDialog();
    });
  });
}

function showShopDialog() {
  const content = `
    <button class="action-btn" data-buy="food">Futter-Vorrat ($${BALANCING.dailyFoodCost * 7})</button>
    <button class="action-btn" data-buy="medicine">Medizin-Vorrat ($${BALANCING.dailyMedicineCost * 7})</button>
  `;
  ui.showDialog('Einkaufen', content, [{ label: 'Schlie\u00dfen', onClick() {} }]);
  document.querySelectorAll('[data-buy]').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.dataset.buy;
      const cost = item === 'food' ? BALANCING.dailyFoodCost * 7 : BALANCING.dailyMedicineCost * 7;
      if (state.money < cost) return;
      state.money -= cost;
      const need = item === 'food' ? 'food' : 'medicine';
      for (const animal of state.animals) animal.needs[need] = Math.min(1, animal.needs[need] + 0.3);
      state.tickerMessages.push(`${item === 'food' ? 'Futter' : 'Medizin'} eingekauft!`);
    });
  });
}

function showStaffDialog() {
  let content = '<div style="margin-bottom:8px"><b>Personal verwalten:</b></div>';
  content += '<div style="margin-bottom:8px"><u>Einstellen:</u></div>';
  for (const roleKey of state.unlockedRoles) {
    const role = STAFF_ROLES[roleKey];
    content += `<button class="action-btn" data-hire="${roleKey}">${role.name} einstellen ($${role.salary}/Wo)</button>`;
  }
  if (state.staff.length > 0 && state.animals.length > 0) {
    content += '<div style="margin-top:8px; margin-bottom:8px"><u>Zuweisen:</u></div>';
    for (const staff of state.staff) {
      const role = STAFF_ROLES[staff.role];
      content += `<div style="margin-bottom:4px"><b>${role.name} ${staff.name}</b> \u2192 `;
      content += `<select data-assign="${staff.id}" style="font-family:inherit;font-size:9px;padding:2px;">`;
      content += `<option value="">Niemand</option>`;
      for (const animal of state.animals) {
        const selected = staff.assignedAnimalId === animal.id ? 'selected' : '';
        content += `<option value="${animal.id}" ${selected}>${animal.name}</option>`;
      }
      content += `</select></div>`;
    }
  }
  ui.showDialog('Personal', content, [{ label: 'Schlie\u00dfen', onClick() {} }]);
  document.querySelectorAll('[data-hire]').forEach(btn => {
    btn.addEventListener('click', () => {
      const roleKey = btn.dataset.hire;
      const staff = createStaff(roleKey, state.nextId++);
      state.staff.push(staff);
      state.tickerMessages.push(`${STAFF_ROLES[roleKey].name} ${staff.name} eingestellt!`);
      ui.hideDialog();
      showStaffDialog();
    });
  });
  document.querySelectorAll('[data-assign]').forEach(select => {
    select.addEventListener('change', () => {
      const staffId = parseInt(select.dataset.assign);
      const staff = state.staff.find(s => s.id === staffId);
      if (!staff) return;
      const animalId = select.value ? parseInt(select.value) : null;
      if (animalId) assignStaff(staff, animalId); else unassignStaff(staff);
    });
  });
}

function showGameOverDialog() {
  const score = calculateFinalScore(state);
  const content = `
    <div style="text-align:center; line-height:2.2;">
      <div>Adoptionen: <b>${score.totalAdoptions}</b></div>
      <div>R\u00fcckgaben: <b>${score.totalReturns}</b></div>
      <div>Reputation: <b>${score.reputation}</b></div>
      <div>Geld: <b>$${score.money.toLocaleString('de-DE')}</b></div>
      <div style="margin-top:8px; font-size:12px; color:#F9A825;">Punktzahl: <b>${score.score}</b></div>
    </div>
  `;
  ui.showDialog('20 Jahre vorbei!', content, [
    { label: 'Endlos-Modus', onClick() { enableEndless(state); engine.setSpeed(1); } },
    { label: 'Neues Spiel', onClick() { state = createNewState(); saveState(state); } },
  ]);
}

if (state.animals.length === 0 && state.staff.length === 0) {
  state.animals.push(createAnimal('dog', state.nextId++));
  state.animals.push(createAnimal('cat', state.nextId++));
  state.staff.push(createStaff('caretaker', state.nextId++));
  state.tickerMessages.push('Willkommen bei JujuPets! Dein Tierheim-Abenteuer beginnt.');
}

engine.start();
