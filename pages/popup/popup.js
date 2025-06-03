'use strict';

// Modern DOM element selection with validation
const elements = {
  toggleNitter: document.querySelector('#toggle-nitter'),
  instance: document.querySelector('#instance'),
  version: document.querySelector('#version')
};

// Validate required elements exist
if (!elements.toggleNitter || !elements.instance || !elements.version) {
  throw new Error('[Nitter Redirect] Required DOM elements not found');
}

const browser = globalThis.chrome || globalThis.browser;

// Strict validation for Nitter instances
const VALID_NITTER_PATTERN = /^https:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
// Verified working instances from official Nitter wiki (as of 2025)
const KNOWN_NITTER_DOMAINS = [
  "xcancel.com",
  "nitter.poast.org",
  "nitter.privacyredirect.com",
  "lightbrd.com",
  "nitter.space",
  "nitter.tiekoetter.com"
];

function isValidNitterInstance(url) {
  try {
    const urlObj = new URL(url);
    // Must be HTTPS
    if (urlObj.protocol !== "https:") {
      return false;
    }
    // Must match pattern
    if (!VALID_NITTER_PATTERN.test(url)) {
      return false;
    }
    // Check against known domains - exact match only for security
    const hostname = urlObj.hostname;
    return KNOWN_NITTER_DOMAINS.includes(hostname);
  } catch (e) {
    return false;
  }
}

const initializePopup = async () => {
  try {
    const result = await browser.storage.sync.get(['nitterDisabled', 'instance']);
    elements.toggleNitter.checked = !result.nitterDisabled;
    elements.instance.value = result.instance || '';
    elements.version.textContent = browser.runtime.getManifest().version;
  } catch (error) {
    console.error('[Nitter Redirect] Popup initialization failed:', error);
    // Show user-friendly error state
    elements.instance.disabled = true;
    elements.toggleNitter.disabled = true;
  }
};

initializePopup();

const debounce = (func, wait, immediate = false) => {
  let timeout;
  return (...args) => {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
};;

const handleInstanceChange = debounce(async () => {
  try {
    if (elements.instance.value && elements.instance.checkValidity()) {
      // Additional validation beyond HTML5 URL validation
      if (isValidNitterInstance(elements.instance.value)) {
        await browser.storage.sync.set({
          instance: new URL(elements.instance.value).origin
        });
        elements.instance.setCustomValidity('');
      } else {
        elements.instance.setCustomValidity('Please enter a valid HTTPS Nitter instance URL');
        elements.instance.reportValidity();
      }
    } else if (!elements.instance.value) {
      // Empty value is allowed (will use default)
      await browser.storage.sync.set({ instance: '' });
      elements.instance.setCustomValidity('');
    }
  } catch (error) {
    console.error('[Nitter Redirect] Failed to save instance:', error);
    elements.instance.setCustomValidity('Failed to save settings');
    elements.instance.reportValidity();
  }
}, 500);

const handleToggleChange = async (event) => {
  try {
    await browser.storage.sync.set({ nitterDisabled: !event.target.checked });
  } catch (error) {
    console.error('[Nitter Redirect] Failed to save toggle state:', error);
    // Revert the toggle on error
    event.target.checked = !event.target.checked;
  }
};

elements.instance.addEventListener('input', handleInstanceChange);
elements.toggleNitter.addEventListener('change', handleToggleChange);
