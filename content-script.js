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

const browser = globalThis.chrome || globalThis.browser;

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

function redirectTwitter(url) {
  try {
    // Ensure we have a valid instance
    if (!instance || !isValidNitterInstance(instance)) {
      return null;
    }
    
    // Use proper URL construction for security
    const targetUrl = new URL(instance);
    
    // Safely handle pathname - only allow specific patterns
    let safePath = url.pathname;
    
    // Handle /tweets path specifically and securely
    if (safePath.startsWith("/") && safePath.includes("/tweets")) {
      // Only replace /tweets if it's in a valid position (after username)
      const tweetPathRegex = /^\/[^\/]+\/tweets(\/.*)?$/;
      if (tweetPathRegex.test(safePath)) {
        safePath = safePath.replace("/tweets", "");
      }
    }
    
    // Sanitize and validate the final path
    safePath = safePath.replace(/[<>'"&]/g, '');
    
    // Ensure path starts with /
    if (!safePath.startsWith("/")) {
      safePath = "/" + safePath;
    }
    
    // Set the path and search safely
    targetUrl.pathname = safePath;
    targetUrl.search = url.search.replace(/[<>'"&]/g, '');
    
    return targetUrl.href;
  } catch (e) {
    // If any error occurs, don't redirect
    console.warn("[Nitter Redirect] URL construction failed:", e);
    return null;
  }
}

const handleServiceWorkerCleanup = async () => {
  if (!navigator.serviceWorker) return;
  
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const twitterScopes = ["https://twitter.com/", "https://x.com/"];
    
    const cleanupPromises = registrations
      .filter(registration => twitterScopes.includes(registration.scope))
      .map(registration => registration.unregister());
    
    await Promise.all(cleanupPromises);
  } catch (error) {
    // Silent fail - service worker access may be restricted
    console.debug("[Nitter Redirect] Service worker cleanup skipped:", error.message);
  }
};

const performRedirectIfNeeded = async () => {
  try {
    const url = new URL(window.location);
    if (!nitterDisabled && url.host !== new URL(instance).hostname) {
      const redirect = redirectTwitter(url);
      if (redirect) {
        window.location = redirect;
      }
    }
  } catch (error) {
    console.warn("[Nitter Redirect] Redirect failed:", error);
  }
};

const initializeContentScript = async () => {
  try {
    const result = await browser.storage.sync.get(["nitterDisabled", "instance"]);
    nitterDisabled = result.nitterDisabled;
    
    // Validate stored instance before using
    instance = (result.instance && isValidNitterInstance(result.instance)) 
      ? result.instance 
      : nitterDefault;
    
    await handleServiceWorkerCleanup();
    await performRedirectIfNeeded();
  } catch (error) {
    console.error("[Nitter Redirect] Initialization failed:", error);
  }
};

initializeContentScript();
