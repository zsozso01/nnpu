const utils = require("../utils");

const badgeId = "nnpu-login-active-badge";
const footerFlagAttr = "data-nnpu-version";
const outageCardId = "nnpu-login-outage-card";
const themeKey = "nnpu-theme";
const darkModeClass = "nnpu-dark-mode";
const rootFixPath = "/hallgatoi";
const recoveryAttemptKey = "nnpu-loading-recovery-attempt";
const recoveryLastAttemptKey = "nnpu-loading-recovery-last-at";
const recoveryDelayMs = 1200;
const recoveryCooldownMs = 2500;

// ─── School name resolver ─────────────────────────────────────────────────────

const SCHOOL_MAP = [
  { pattern: /\bbme\b/i,       name: "BME" },
  { pattern: /corvinus/i,      name: "Corvinus" },
  { pattern: /szte\b/i,        name: "SZTE" },
  { pattern: /\bpte\b/i,       name: "PTE" },
  { pattern: /\belte\b/i,      name: "ELTE" },
  { pattern: /\bde\b/i,        name: "DE" },
  { pattern: /\bme\b/i,        name: "ME" },
  { pattern: /\boe\b/i,        name: "ÓE" },
  { pattern: /\bsoe\b/i,       name: "SoE" },
  { pattern: /\bnke\b/i,       name: "NKE" },
  { pattern: /\bke\b/i,        name: "KE" },
  { pattern: /\bszie\b/i,      name: "SZIE" },
  { pattern: /\bbgf\b/i,       name: "BGF" },
  { pattern: /\bbge\b/i,       name: "BGE" },
  { pattern: /\bszfe\b/i,      name: "SZFE" },
  { pattern: /obuda|óbuda/i,   name: "ÓE" },
  { pattern: /miskolc/i,       name: "ME" },
  { pattern: /debrecen/i,      name: "DE" },
  { pattern: /pecs|pécs/i,     name: "PTE" },
];

function resolveSchoolName() {
  const host = window.location.hostname;
  for (const entry of SCHOOL_MAP) {
    if (entry.pattern.test(host)) {
      return entry.name;
    }
  }
  // Capitalise the leftmost meaningful subdomain part as a fallback
  const parts = host.replace(/\.neptun\..*$/, "").split(".");
  const candidate = parts[0] || parts[parts.length - 1] || "az egyetem";
  return candidate.toUpperCase();
}

// ─── Styles ──────────────────────────────────────────────────────────────────

function isAngularHallgatoiPage() {
  return /\/hallgatoi(\/|$)/i.test(window.location.pathname);
}

function isAngularLoginPage() {
  return /:\/\/.*neptun.*\/hallgatoi\/login/i.test(window.location.href);
}

function getStoredTheme() {
  try {
    return window.localStorage.getItem(themeKey);
  } catch (e) {
    return null;
  }
}

function shouldUseDarkMode() {
  const storedTheme = getStoredTheme();
  if (storedTheme === "dark") {
    return true;
  }
  if (storedTheme === "light") {
    return false;
  }
  return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
}

function applyStoredThemeClass() {
  if (!document.body) {
    return;
  }
  document.body.classList.toggle(darkModeClass, shouldUseDarkMode());
}

function getAngularRootUrl(forceReload = false) {
  const match = window.location.pathname.match(/^(.*\/hallgatoi)(?:\/.*)?$/i);
  const targetPath = ((match && match[1]) || rootFixPath).replace(/\/?$/, "/");
  return forceReload ? `${window.location.origin}${targetPath}?nnpu-recover=${Date.now()}` : `${window.location.origin}${targetPath}`;
}

function navigateToRoot(forceReload = false) {
  window.location.replace(getAngularRootUrl(forceReload));
}

function isAngularRootPath() {
  const currentPath = window.location.pathname.replace(/\/?$/, "/");
  const rootPath = new URL(getAngularRootUrl(false)).pathname.replace(/\/?$/, "/");
  return currentPath === rootPath;
}

function injectStyles() {
  utils.injectCss(`
    #${badgeId} {
      display: inline-flex;
      align-items: center;
      margin-top: 10px;
      padding: 4px 10px;
      border-radius: 999px;
      font-family: LatoWeb, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.1px;
      color: #ffffff;
      background: linear-gradient(135deg, #16a34a, #0f766e);
      box-shadow: 0 2px 8px rgba(22, 163, 74, 0.35);
      white-space: nowrap;
    }

    #${outageCardId} {
      width: min(92vw, 600px);
      padding: 20px 22px;
      border-radius: 18px;
      background: linear-gradient(145deg, rgba(255,255,255,0.97), rgba(242,243,251,0.95));
      border: 1px solid rgba(9,67,217,0.12);
      box-shadow: 0 20px 50px rgba(33,48,85,0.16);
      font-family: LatoWeb, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
      color: #213055;
    }

    #${outageCardId} .nnpu-outage-pill {
      display: inline-flex;
      align-items: center;
      padding: 5px 10px;
      border-radius: 999px;
      background: linear-gradient(135deg, #16a34a, #0f766e);
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.1px;
      margin-bottom: 12px;
    }

    #${outageCardId} h2 {
      margin: 0 0 8px;
      font-size: 22px;
      font-weight: 900;
      line-height: 1.15;
    }

    #${outageCardId} .nnpu-outage-sub {
      margin: 0 0 14px;
      font-size: 14px;
      line-height: 1.5;
      color: #425173;
    }

    #${outageCardId} .nnpu-outage-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
      margin-bottom: 18px;
    }

    #${outageCardId} .nnpu-btn {
      height: 40px;
      padding: 0 16px;
      border: 0;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
      transition: opacity 0.15s;
    }
    #${outageCardId} .nnpu-btn:hover { opacity: 0.85; }

    #${outageCardId} .nnpu-btn-primary {
      background: #0943d9;
      color: #fff;
    }

    #${outageCardId} .nnpu-outage-note {
      margin: 0;
      font-size: 12px;
      line-height: 1.5;
      color: #6a7892;
    }

    .${darkModeClass} #${outageCardId} {
      background: linear-gradient(145deg, rgba(22, 29, 41, 0.98), rgba(17, 24, 39, 0.96));
      border-color: rgba(125, 157, 214, 0.18);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
      color: #dbe6ff;
    }

    .${darkModeClass} #${outageCardId} .nnpu-outage-sub {
      color: #aebddb;
    }

    .${darkModeClass} #${outageCardId} .nnpu-outage-note {
      color: #92a3c4;
    }

    #loading-placeholder-index.nnpu-outage-mode {
      gap: 24px;
      padding: 24px;
      background:
        radial-gradient(circle at top left, rgba(9,67,217,0.08), transparent 34%),
        radial-gradient(circle at bottom right, rgba(15,118,110,0.08), transparent 34%),
        #ffffff;
    }

    .${darkModeClass} #loading-placeholder-index.nnpu-outage-mode {
      background:
        radial-gradient(circle at top left, rgba(77, 110, 173, 0.2), transparent 34%),
        radial-gradient(circle at bottom right, rgba(15, 118, 110, 0.18), transparent 34%),
        #0f1319;
    }
  `);
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function isPlaceholderOnlyState() {
  const placeholder = document.getElementById("loading-placeholder-index");
  const appRoot = document.querySelector("app-root");
  if (!placeholder || !appRoot) return false;
  return appRoot.children.length === 0;
}

function getRecoveryAttempt() {
  try {
    return parseInt(window.sessionStorage.getItem(recoveryAttemptKey) || "0", 10) || 0;
  } catch (e) {
    return 0;
  }
}

function setRecoveryAttempt(attempt) {
  try {
    window.sessionStorage.setItem(recoveryAttemptKey, String(attempt));
  } catch (e) {}
}

function getRecoveryLastAttemptAt() {
  try {
    return parseInt(window.sessionStorage.getItem(recoveryLastAttemptKey) || "0", 10) || 0;
  } catch (e) {
    return 0;
  }
}

function setRecoveryLastAttemptAt(timestamp) {
  try {
    window.sessionStorage.setItem(recoveryLastAttemptKey, String(timestamp));
  } catch (e) {}
}

function clearRecoveryAttempt() {
  try {
    window.sessionStorage.removeItem(recoveryAttemptKey);
    window.sessionStorage.removeItem(recoveryLastAttemptKey);
  } catch (e) {}
}

function triggerAutomaticRecovery() {
  const attempt = getRecoveryAttempt();
  const lastAttemptAt = getRecoveryLastAttemptAt();
  const remainingCooldownMs = Math.max(0, recoveryCooldownMs - (Date.now() - lastAttemptAt));

  if (remainingCooldownMs > 0) {
    return {
      attempt,
      status: "cooldown",
      waitMs: remainingCooldownMs,
    };
  }

  const nextAttempt = attempt + 1;
  setRecoveryAttempt(nextAttempt);
  setRecoveryLastAttemptAt(Date.now());

  window.setTimeout(() => {
    if (isAngularRootPath()) {
      window.location.reload();
      return;
    }

    navigateToRoot(false);
  }, recoveryDelayMs);

  return {
    attempt: nextAttempt,
    status: "redirecting",
    waitMs: recoveryDelayMs,
  };
}

function getRecoveryNoteText(recoveryState) {
  const fallbackState = recoveryState || {
    attempt: getRecoveryAttempt(),
    status: "redirecting",
  };

  const safeAttempt = Math.max(1, fallbackState.attempt || 1);
  if (fallbackState.status === "cooldown") {
    return `Automatikus helyreállítás folyamatban. ${safeAttempt}. próbálkozás után rövid szünetet tartok, hogy a szerver fellélegezhessen.`;
  }

  return `Automatikus helyreállítás folyamatban. ${safeAttempt}. próbálkozás: visszalépés a /hallgatoi/ gyökéroldalra.`;
}

// ─── Outage card ──────────────────────────────────────────────────────────────

async function showOutageCard(recoveryState = null) {
  const placeholder = document.getElementById("loading-placeholder-index");
  if (!placeholder || !isPlaceholderOnlyState()) {
    return;
  }

  // Mark as outage mode
  placeholder.classList.add("nnpu-outage-mode");

  const school = resolveSchoolName();
  let card = document.getElementById(outageCardId);
  let note;

  if (!card) {
    card = document.createElement("section");
    card.id = outageCardId;

    const pill = document.createElement("div");
    pill.className = "nnpu-outage-pill";
    pill.textContent = `⚡ NNPU v${GM.info.script.version} Aktív`;
    card.appendChild(pill);

    const heading = document.createElement("h2");
    heading.textContent = "A Neptun oldal most legalább stílusosan áll. 🥔";
    card.appendChild(heading);

    const sub = document.createElement("p");
    sub.className = "nnpu-outage-sub";
    sub.textContent = `Úgy tűnik, a ${school} szerverei épp valami fontosabb dologgal foglalkoznak – például léteznek. Az Angular bundle-ök ezen az oldalon nem álltak fel, ezért az NNPU automatikusan megpróbál visszalépni a tiszta /hallgatoi/ gyökéroldalra, rövid szünetekkel újrapróbálva.`;
    card.appendChild(sub);

    note = document.createElement("p");
    note.className = "nnpu-outage-note";
    card.appendChild(note);

    placeholder.appendChild(card);
  } else {
    note = card.querySelector(".nnpu-outage-note");
  }

  if (note) {
    note.textContent = getRecoveryNoteText(recoveryState);
  }
}

// ─── Footer version tag ───────────────────────────────────────────────────────

function appendFooterVersion() {
  const footerVersion = document.querySelector(".footer__version");
  if (!footerVersion || footerVersion.getAttribute(footerFlagAttr) === "1") {
    return;
  }
  footerVersion.textContent = `${footerVersion.textContent.trim()} | NNPU v${GM.info.script.version}`;
  footerVersion.setAttribute(footerFlagAttr, "1");
}

// ─── Main flow ────────────────────────────────────────────────────────────────

async function showLoginBanner() {
  if (!isAngularLoginPage()) return;

  applyStoredThemeClass();
  injectStyles();

  // Short fuse: 1 second before giving up and showing the outage card
  const caption = await utils.waitForElement("h4.login-right__caption", { timeoutMs: 1000 });
  if (!caption || document.getElementById(badgeId)) {
    // Angular didn't come up in time – show outage card and clear the
    // auto-refresh key when content successfully arrives later.
    showOutageCard();
    appendFooterVersion();
    return;
  }

  clearRecoveryAttempt();

  const badge = document.createElement("span");
  badge.id = badgeId;
  badge.textContent = `⚡ NNPU v${GM.info.script.version} Aktív`;
  caption.insertAdjacentElement("afterend", badge);
  appendFooterVersion();
}

function initializeAngularOutageRecovery() {
  if (!isAngularHallgatoiPage()) {
    return;
  }

  applyStoredThemeClass();
  injectStyles();
  let recoveryCheckTimeoutId = null;

  const scheduleRecoveryCheck = delayMs => {
    if (recoveryCheckTimeoutId !== null) {
      return;
    }

    recoveryCheckTimeoutId = window.setTimeout(() => {
      recoveryCheckTimeoutId = null;
      tryShowRecovery();
    }, delayMs);
  };

  const tryShowRecovery = () => {
    if (!isPlaceholderOnlyState()) {
      clearRecoveryAttempt();
      return false;
    }

    const recoveryState = triggerAutomaticRecovery();
    showOutageCard(recoveryState);
    appendFooterVersion();

    if (recoveryState.status === "cooldown") {
      scheduleRecoveryCheck(recoveryState.waitMs + 50);
    }

    return true;
  };

  if (tryShowRecovery()) {
    return;
  }

  const observer = new MutationObserver(() => {
    if (tryShowRecovery()) {
      observer.disconnect();
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  window.setTimeout(() => {
    observer.disconnect();
  }, 15000);
}

module.exports = {
  shouldActivate: () => isAngularHallgatoiPage() || utils.isLoginPage(),
  runOutsideNeptun: true,
  initialize: () => {
    if (document.readyState === "loading") {
      document.addEventListener(
        "DOMContentLoaded",
        () => {
          showLoginBanner();
          initializeAngularOutageRecovery();
        },
        { once: true }
      );
      return;
    }
    showLoginBanner();
    initializeAngularOutageRecovery();
  },
};
