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

let instance;
let nitterDisabled;

window.browser = window.browser || window.chrome;

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

browser.storage.sync.get(["nitterDisabled", "instance"], (result) => {
  nitterDisabled = result.nitterDisabled;
  // Validate stored instance before using
  if (result.instance && isValidNitterInstance(result.instance)) {
    instance = result.instance;
  } else {
    instance = nitterDefault;
  }
});

browser.storage.onChanged.addListener(function (changes) {
  if ("instance" in changes) {
    // Validate new instance before using
    const newInstance = changes.instance.newValue;
    if (newInstance && isValidNitterInstance(newInstance)) {
      instance = newInstance;
    } else {
      instance = nitterDefault;
    }
  }
  if ("nitterDisabled" in changes) {
    nitterDisabled = changes.nitterDisabled.newValue;
  }
});

function redirectTwitter(url) {
  if (nitterDisabled || !instance) {
    return null;
  }
  
  try {
    // Ensure we have a valid instance
    if (!isValidNitterInstance(instance)) {
      return null;
    }
    
    // Sanitize pathname to prevent injection
    const sanitizedPathname = url.pathname.replace(/[<>'"]/g, '');
    const sanitizedSearch = url.search.replace(/[<>'"]/g, '');
    
    if (url.host.split(".")[0] === "pbs") {
      // For image URLs, encode the entire URL properly
      return `${instance}/pic/${encodeURIComponent(url.href)}`;
    } else if (url.host.split(".")[0] === "video") {
      // For video URLs, encode the entire URL properly
      return `${instance}/gif/${encodeURIComponent(url.href)}`;
    } else if (sanitizedPathname.includes("tweets")) {
      // Remove /tweets from path
      return `${instance}${sanitizedPathname.replace("/tweets", "")}${sanitizedSearch}`;
    } else {
      // Regular Twitter URLs
      return `${instance}${sanitizedPathname}${sanitizedSearch}`;
    }
  } catch (e) {
    // If any error occurs, don't redirect
    return null;
  }
}

browser.webRequest.onBeforeRequest.addListener(
  (details) => {
    const url = new URL(details.url);
    let redirect;
    redirect = { redirectUrl: redirectTwitter(url) };
    // Logging removed for security - was exposing sensitive URLs
    return redirect;
  },
  {
    urls: [
      "*://twitter.com/*",
      "*://www.twitter.com/*",
      "*://mobile.twitter.com/*",
      "*://x.com/*",
      "*://www.x.com/*",
      "*://mobile.x.com/*",
      "*://pbs.twimg.com/*",
      "*://video.twimg.com/*",
    ],
  },
  ["blocking"]
);
