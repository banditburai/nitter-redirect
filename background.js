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
    
    const rules = [
      {
        id: 1,
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
          urlFilter: "||twitter.com",
          resourceTypes: ["main_frame", "sub_frame"]
        }
      },
      {
        id: 2,
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
          urlFilter: "||www.twitter.com",
          resourceTypes: ["main_frame", "sub_frame"]
        }
      },
      {
        id: 3,
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
          urlFilter: "||x.com",
          resourceTypes: ["main_frame", "sub_frame"]
        }
      },
      {
        id: 4,
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
          urlFilter: "||www.x.com",
          resourceTypes: ["main_frame", "sub_frame"]
        }
      },
      {
        id: 5,
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
          urlFilter: "||mobile.twitter.com",
          resourceTypes: ["main_frame", "sub_frame"]
        }
      },
      {
        id: 6,
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
          urlFilter: "||mobile.x.com",
          resourceTypes: ["main_frame", "sub_frame"]
        }
      }
    ];

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
