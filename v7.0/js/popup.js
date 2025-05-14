// popup.js – v2.6 (fonts dropped, font-size kept)
// -------------------------------------------------
// • Live preview via sendUpdate() when controls change
// • NO storage writes while dragging – zero quota spam
// • Save button persists only settings-menu values
// • Reset button restores all controls to defaults and persists
// • Auto-save settings-menu values on popup close
// -------------------------------------------------

const $ = sel => document.querySelector(sel);

// DOM references
const toggle           = $('#toggleExtension');
const sliders          = ['#brightness','#contrast','#saturation','#grayscale','#sepia'].map($);
const sizeControl      = $('#fontsize');
const sliderLabels     = ['#brightVal','#contrastVal','#satVal','#grayVal','#sepiaVal'].map($);
const fontSizeLabel    = $('#fontSizeVal');
const themeSelect      = $('#themeSel');
const darkToggle       = $('#darkToggle');
const switchToggle     = $('#toggleDisplaySwitch');
const settingsBtn      = $('#settingsBtn');
const settingsMenu     = $('#settingsMenu');
const closeSettingsBtn = $('#closeSettings');
const saveBtn          = $('#saveBtn');
const resetBtn         = $('#resetBtn');
const resetSlidersBtn  = $('#resetSlidersBtn');

// Update slider value labels and font size label
function updateLabels() {
  sliders.forEach((s,i) => sliderLabels[i].textContent = s.value);
  fontSizeLabel.textContent = sizeControl.value;
}

// Apply theme settings
function applyTheme() {
  document.body.className = themeSelect.value + (darkToggle.checked ? ' darkmode' : '');
}

let raf;
function scheduleUpdate() {
  if (!toggle.checked || raf) return;
  raf = requestAnimationFrame(() => { sendUpdate(); raf = null; });
}

// Send current slider and font-size settings to content script
function sendUpdate() {
  const [br,co,sa,gr,se] = sliders.map(s => +s.value);
  const fs = +sizeControl.value;
  chrome.tabs.query({active:true,currentWindow:true}, tabs => {
    if (!tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, {
      action:     'applySettings',
      brightness: br,
      contrast:   co,
      saturation: sa,
      grayscale:  gr,
      sepia:      se,
      fontSize:   fs
    });
  });
}

// Gather only settings-menu values for save
function gatherSettings() {
  return {
    theme:      themeSelect.value,
    darkMode:   darkToggle.checked,
    showSwitch: switchToggle.checked
  };
}

// Initialize UI from storage
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(null, prefs => {
    const keys = ['brightness','contrast','saturation','grayscale','sepia'];
    keys.forEach((k,i) => sliders[i].value = prefs[k] ?? (i<3?100:0));
    sizeControl.value      = prefs.fontSize ?? 100;
    themeSelect.value      = prefs.theme ?? 'light';
    darkToggle.checked     = prefs.darkMode ?? false;
    toggle.checked         = prefs.enabled ?? true;
    switchToggle.checked   = prefs.showSwitch ?? true;

    applyTheme();
    updateLabels();
    document.querySelector('label[for="toggleExtension"]').style.display = switchToggle.checked ? '' : 'none';
    scheduleUpdate();
  }, () => window.close());
});

// Live preview event listeners
sliders.forEach(s => s.addEventListener('input', () => { updateLabels(); scheduleUpdate(); }));
sizeControl.addEventListener('input', scheduleUpdate);
toggle.addEventListener('change', () => {
  if (toggle.checked) scheduleUpdate();
  else chrome.tabs.query({active:true,currentWindow:true}, tabs => {
    if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, {action:'disableEffects'});
  }, () => window.close());
});

// Theme and dark mode live preview
themeSelect.addEventListener('change', applyTheme);
darkToggle.addEventListener('change', applyTheme);
switchToggle.addEventListener('change', () => {
  document.querySelector('label[for="toggleExtension"]').style.display = switchToggle.checked ? '' : 'none';
});

// Settings menu toggle and close
settingsBtn.addEventListener('click', () => settingsMenu.hidden = !settingsMenu.hidden);
closeSettingsBtn.addEventListener('click', () => settingsMenu.hidden = true);

document.addEventListener('click', e => {
  if (!settingsMenu.hidden && !settingsMenu.contains(e.target) && e.target !== settingsBtn) {
    settingsMenu.hidden = true;
  }
});

// Save settings-menu values only
saveBtn.addEventListener('click', () => {
  chrome.storage.sync.set(gatherSettings(), () => {
    saveBtn.disabled = true;
  });
});

// Reset all controls to factory defaults
resetBtn.addEventListener('click', () => {
  ['brightness','contrast','saturation','grayscale','sepia'].forEach((_,i) => sliders[i].value = i<3?100:0);
  sizeControl.value      = 100;
  themeSelect.value      = 'light';
  darkToggle.checked     = false;
  toggle.checked         = true;
  switchToggle.checked   = true;
  applyTheme();
  updateLabels();
  scheduleUpdate();
  chrome.storage.sync.set({
    brightness: 100,
    contrast:   100,
    saturation: 100,
    grayscale:  0,
    sepia:      0,
    fontSize:   100,
    theme:      'light',
    darkMode:   false,
    enabled:    true,
    showSwitch: true
  }, () => {
    resetBtn.disabled = true;
  });
});

// Reset sliders only
resetSlidersBtn.addEventListener('click', () => {
  ['brightness','contrast','saturation','grayscale','sepia'].forEach((_,i) => sliders[i].value = i<3?100:0);
  updateLabels();
  scheduleUpdate();
});


const fontMenuToggle = document.getElementById('fontMenuToggle');
const fontMenu = document.getElementById('fontMenu');

fontMenuToggle.addEventListener('click', () => {
  const isOpen = fontMenu.hidden === false;
  fontMenu.hidden = isOpen;
  fontMenuToggle.textContent = isOpen ? 'Font size ▼' : 'Font size ▲';
});



// Save only slider values (not settings-menu)
document.getElementById('saveSlidersBtn').addEventListener('click', () => {
  const [br, co, sa, gr, se] = sliders.map(s => +s.value);
  const fs = +sizeControl.value;
  chrome.storage.sync.set({
    brightness: br,
    contrast:   co,
    saturation: sa,
    grayscale:  gr,
    sepia:      se,
    fontSize:   fs
  }, () => {
    document.getElementById('saveSlidersBtn').disabled = true;
  });
});


// Auto-save settings-menu on popup close

// Re-enable Save buttons on user interaction
[themeSelect, darkToggle, switchToggle].forEach(el => {
  el.addEventListener('change', () => {
    saveBtn.disabled = false;
  });
});

[...sliders, sizeControl].forEach(sl => {
  sl.addEventListener('input', () => {
    document.getElementById('saveSlidersBtn').disabled = false;
  });
});
