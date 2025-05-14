// content.js – v2.1 (persisted filters + robust resets)
// ----------------------------------------------------
// • Applies saved filters, font size & family on page load if extension is enabled.
// • Clears font styles when fontType is empty.
// • No change to messaging API – stays compatible with popup.js.
// ----------------------------------------------------

// Inject @font-face definitions once per tab
const linkId = 'screenix-fonts-css';
if (!document.getElementById(linkId)) {
  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('font.css');
  document.head.appendChild(link);
}

const htmlEl = document.documentElement;

// Apply persisted settings on first load
chrome.storage.sync.get(
  [
    'enabled',
    'brightness',
    'contrast',
    'saturation',
    'grayscale',
    'sepia',
    'fontSize',
    'fontType'
  ],
  cfg => {
    if (!cfg.enabled) return; // effects disabled → leave page untouched

    const br = cfg.brightness ?? 100;
    const co = cfg.contrast   ?? 100;
    const sa = cfg.saturation ?? 100;
    const gr = cfg.grayscale  ?? 0;
    const se = cfg.sepia      ?? 0;

    htmlEl.style.filter =
      `brightness(${br}%) ` +
      `contrast(${co}%) `   +
      `saturate(${sa}%) `   +
      `grayscale(${gr}%) `  +
      `sepia(${se}%)`;

    htmlEl.style.fontSize   = cfg.fontSize ? cfg.fontSize + '%' : '';
    htmlEl.style.fontFamily = cfg.fontType || '';
  }
);

// Listen for updates from popup.js
chrome.runtime.onMessage.addListener(msg => {
  switch (msg.action) {
    case 'applySettings': {
      const br = msg.brightness ?? 100;
      const co = msg.contrast   ?? 100;
      const sa = msg.saturation ?? 100;
      const gr = msg.grayscale  ?? 0;
      const se = msg.sepia      ?? 0;

      htmlEl.style.filter =
        `brightness(${br}%) ` +
        `contrast(${co}%) `   +
        `saturate(${sa}%) `   +
        `grayscale(${gr}%) `  +
        `sepia(${se}%)`;

      htmlEl.style.fontSize   = msg.fontSize ? msg.fontSize + '%' : '';
      htmlEl.style.fontFamily = msg.fontType || '';
      break;
    }

    case 'disableEffects': {
      htmlEl.style.filter     = 'none';
      htmlEl.style.fontSize   = '';
      htmlEl.style.fontFamily = '';
      break;
    }
  }
});
