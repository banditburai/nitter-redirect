"use strict";

const nitterDefault = "https://xcancel.com";

// NOTE: These constants are duplicated in content-script.js and popup.js
// This is intentional to avoid script loading dependencies in a build-step-free extension
// Any updates must be synchronized across all files

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

// Domains to redirect to Nitter
const REDIRECT_DOMAINS = [
  "twitter.com",
  "www.twitter.com", 
  "x.com",
  "www.x.com",
  "mobile.twitter.com",
  "mobile.x.com"
];

async function updateRedirectRules() {
  try {
    console.log("[Nitter Redirect] Current instance:", instance);
    console.log("[Nitter Redirect] Disabled:", nitterDisabled);
    
    // Always remove existing rules first
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [1, 2, 3, 4, 5, 6]
    });
    
    if (nitterDisabled || !instance || !isValidNitterInstance(instance)) {
      console.log("[Nitter Redirect] Not adding rules - disabled or invalid instance");
      return;
    }

    // Extract hostname from instance URL for transform
    const instanceUrl = new URL(instance);
    
    // Generate redirect rules for all target domains
    const createRedirectRule = (id, domain) => ({
      id,
      priority: 1,
      action: {
        type: "redirect",
        redirect: {
          transform: {
            scheme: "https",
            host: instanceUrl.hostname
          }
        }
      },
      condition: {
        urlFilter: `||${domain}`,
        resourceTypes: ["main_frame", "sub_frame"]
      }
    });
    
    const rules = REDIRECT_DOMAINS.map((domain, index) => 
      createRedirectRule(index + 1, domain)
    );

    console.log("[Nitter Redirect] Adding rules:", JSON.stringify(rules, null, 2));
    
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: rules
    });
    
    console.log("[Nitter Redirect] Rules updated successfully");
  } catch (error) {
    console.error("[Nitter Redirect] Failed to update rules:", error);
  }
}

browser.storage.sync.get(["nitterDisabled", "instance"], async (result) => {
  nitterDisabled = result.nitterDisabled;
  if (result.instance && isValidNitterInstance(result.instance)) {
    instance = result.instance;
  } else {
    instance = nitterDefault;
  }
  await updateRedirectRules();
});

browser.storage.onChanged.addListener(async function (changes) {
  if ("instance" in changes) {
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
  await updateRedirectRules();
});
