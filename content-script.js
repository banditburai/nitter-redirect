"use strict";

const nitterDefault = "https://xcancel.com";

// Strict validation pattern for Nitter instances
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

let nitterDisabled;
let instance;

const browser = chrome;

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

function redirectTwitter(url) {
  try {
    // Ensure we have a valid instance
    if (!instance || !isValidNitterInstance(instance)) {
      return null;
    }
    
    // Sanitize pathname to prevent injection
    const sanitizedPathname = url.pathname.replace(/[<>'"]/g, '');
    const sanitizedSearch = url.search.replace(/[<>'"]/g, '');
    
    if (sanitizedPathname.includes("tweets")) {
      return `${instance}${sanitizedPathname.replace("/tweets", "")}${sanitizedSearch}`;
    } else {
      return `${instance}${sanitizedPathname}${sanitizedSearch}`;
    }
  } catch (e) {
    // If any error occurs, don't redirect
    return null;
  }
}

browser.storage.sync.get(["nitterDisabled", "instance"], (result) => {
  nitterDisabled = result.nitterDisabled;
  
  // Validate stored instance before using
  if (result.instance && isValidNitterInstance(result.instance)) {
    instance = result.instance;
  } else {
    instance = nitterDefault;
  }
  
  // Unregister Twitter/X service workers to prevent tracking
  if (navigator.serviceWorker) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (let registration of registrations) {
        if (registration.scope === "https://twitter.com/" || 
            registration.scope === "https://x.com/") {
          registration.unregister();
          // Service worker unregistered successfully
        }
      }
    }).catch(() => {
      // Ignore errors in service worker access
    });
  }
  
  // Perform redirect if enabled
  try {
    const url = new URL(window.location);
    if (!nitterDisabled && url.host !== instance) {
      const redirect = redirectTwitter(url);
      if (redirect) {
        // Redirect happening - logging removed for security
        window.location = redirect;
      }
    }
  } catch (e) {
    // If URL parsing fails, don't redirect
  }
});
