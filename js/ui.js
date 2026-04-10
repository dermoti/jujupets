import { SPECIES, STAFF_ROLES, BALANCING } from './data.js';
import { calculateMatchScore } from './matching.js';

const MONTH_NAMES = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

export function formatMoney(amount) {
  if (amount < 0) return `-$${Math.abs(amount).toLocaleString('de-DE')}`;
  return `$${amount.toLocaleString('de-DE')}`;
}

export function formatDate(time) {
  const monthName = MONTH_NAMES[time.month - 1] || "???";
  return `Jahr ${time.year} - ${monthName} W${time.week}`;
}

export function formatStaffEntry(staff, animals) {
  const role = STAFF_ROLES[staff.role];
  const energyPct = Math.floor(staff.energy);
  const assigned = staff.assignedAnimalId !== null
    ? animals.find(a => a.id === staff.assignedAnimalId)?.name || '?'
    : '-';
  return `${role.name} ${staff.name} Lv.${staff.level} | E:${energyPct}% | → ${assigned}`;
}

export function createUI(state, callbacks) {
  const elements = {
    money: document.getElementById('stat-money'),
    reputation: document.getElementById('stat-reputation'),
    date: document.getElementById('stat-date'),
    staffList: document.getElementById('staff-list'),
    applicantList: document.getElementById('applicant-list'),
    ticker: document.getElementById('event-ticker'),
    dialogOverlay: document.getElementById('dialog-overlay'),
    dialogTitle: document.getElementById('dialog-title'),
    dialogContent: document.getElementById('dialog-content'),
    dialogButtons: document.getElementById('dialog-buttons'),
  };

  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const speed = parseInt(btn.dataset.speed);
      callbacks.onSetSpeed(speed);
      document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      callbacks.onButtonClick?.();
    });
  });

  document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      callbacks.onAction(action);
      callbacks.onButtonClick?.();
    });
  });

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

  function updateVolumeUI(settings) {
    if (volMusic) volMusic.value = Math.round(settings.musicVolume * 100);
    if (volSfx) volSfx.value = Math.round(settings.sfxVolume * 100);
    if (volAmbient) volAmbient.value = Math.round(settings.ambientVolume * 100);
    if (volMuteCheckbox) volMuteCheckbox.checked = settings.muted;
    if (muteBtn) muteBtn.textContent = settings.muted ? '\u{1F507}' : '\u{1F50A}';
  }

  function update(state) {
    elements.money.textContent = formatMoney(state.money);
    elements.reputation.textContent = `Rep: ${state.reputation}`;
    elements.date.textContent = formatDate(state.time);

    elements.staffList.innerHTML = state.staff.map(s =>
      `<div class="staff-entry">${formatStaffEntry(s, state.animals)}</div>`
    ).join('');

    elements.applicantList.innerHTML = state.owners.map(o => {
      const bestMatch = state.animals.reduce((best, animal) => {
        const score = calculateMatchScore(animal, o, 0);
        return score > best.score ? { score, name: animal.name } : best;
      }, { score: 0, name: '-' });
      return `<div class="applicant-entry">${o.name} | Best: ${bestMatch.name} (${Math.floor(bestMatch.score)}%)</div>`;
    }).join('') || '<div style="color:#666">Keine Bewerber</div>';

    if (state.tickerMessages.length > 0) {
      elements.ticker.textContent = state.tickerMessages[state.tickerMessages.length - 1];
    }
  }

  function showDialog(title, content, buttons) {
    elements.dialogTitle.textContent = title;
    elements.dialogContent.innerHTML = content;
    elements.dialogButtons.innerHTML = '';
    for (const btn of buttons) {
      const el = document.createElement('button');
      el.textContent = btn.label;
      el.addEventListener('click', () => {
        hideDialog();
        btn.onClick();
      });
      elements.dialogButtons.appendChild(el);
    }
    elements.dialogOverlay.classList.remove('hidden');
  }

  function hideDialog() {
    elements.dialogOverlay.classList.add('hidden');
    callbacks.onDialogClose?.();
  }

  return { update, showDialog, hideDialog, updateVolumeUI };
}
