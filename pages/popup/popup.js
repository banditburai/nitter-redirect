'use strict';

let toggleNitter = document.querySelector('#toggle-nitter');
let instance = document.querySelector('#instance');
let version = document.querySelector('#version');

window.browser = window.browser || window.chrome;

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
    // Check against known domains
    const hostname = urlObj.hostname;
    return KNOWN_NITTER_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith("." + domain)
    );
  } catch (e) {
    return false;
  }
}

browser.storage.sync.get(['nitterDisabled', 'instance'], (result) => {
  toggleNitter.checked = !result.nitterDisabled;
  instance.value = result.instance || '';
});

version.textContent = browser.runtime.getManifest().version;

function debounce(func, wait, immediate) {
  let timeout;
  return function () {
    let context = this, args = arguments;
    let later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    let callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

let instanceChange = debounce(() => {
  if (instance.value && instance.checkValidity()) {
    // Additional validation beyond HTML5 URL validation
    if (isValidNitterInstance(instance.value)) {
      browser.storage.sync.set({
        instance: new URL(instance.value).origin
      });
      instance.setCustomValidity('');
    } else {
      instance.setCustomValidity('Please enter a valid HTTPS Nitter instance URL');
      instance.reportValidity();
    }
  } else if (!instance.value) {
    // Empty value is allowed (will use default)
    browser.storage.sync.set({ instance: '' });
    instance.setCustomValidity('');
  }
}, 500);
instance.addEventListener('input', instanceChange);

toggleNitter.addEventListener('change', (event) => {
  browser.storage.sync.set({ nitterDisabled: !event.target.checked });
});
