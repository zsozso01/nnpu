// ==UserScript==
// @name           New Neptun PowerUp
// @namespace      http://example.org
// @description    New Neptun PowerUp (nnpu) - Angular Neptun kiegészítő
// @version        2.6.2
// @downloadURL    https://github.com/zsozso01/nnpu/releases/latest/download/npu.user.js
// @include        https://*neptun*/*hallgato*
// @include        https://*neptun*/*hallgato*/*
// @include        https://*neptun*/*Hallgatoi*
// @include        https://*neptun*/*Hallgatoi*/*
// @include        https://*neptun*/*oktato*/*
// @include        https://*hallgato*.*neptun*
// @include        https://*hallgato*.*neptun*/*
// @include        https://*oktato*.*neptun*/*
// @include        https://netw*.nnet.sze.hu/hallgato*
// @include        https://netw*.nnet.sze.hu/hallgato/*
// @include        https://nappw.dfad.duf.hu/hallgato*
// @include        https://nappw.dfad.duf.hu/hallgato/*
// @include        https://host.sdakft.hu/*
// @include        https://neptun.ejf.hu/ejfhw/*
// @grant          GM.xmlHttpRequest
// @grant          GM.getValue
// @grant          GM.setValue
// @grant          GM.deleteValue
// @grant          GM.info
// @require        https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js
// ==/UserScript==

/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 793:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const utils = __webpack_require__(413);

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


/***/ }),

/***/ 660:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const utils = __webpack_require__(413);

const THEME_KEY = "nnpu-theme";
const DARK_MODE_CLASS = "nnpu-dark-mode";
const TOGGLE_ID = "nnpu-theme-toggle";
const FOOTER_FLAG_ATTR = "data-nnpu-footer-active";
let toggleWatcher = null;

function getScriptVersion() {
  try {
    return GM && GM.info && GM.info.script && GM.info.script.version ? GM.info.script.version : "unknown";
  } catch (e) {
    return "unknown";
  }
}

function isAngularHallgatoiPage() {
  return /\/hallgatoi(\/|$)/i.test(window.location.pathname);
}

function getStoredTheme() {
  try {
    return window.localStorage.getItem(THEME_KEY);
  } catch (e) {
    return null;
  }
}

function getInitialDarkModeState() {
  const storedTheme = getStoredTheme();
  if (storedTheme === "dark") {
    return true;
  }
  if (storedTheme === "light") {
    return false;
  }
  return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
}

function persistTheme(isDarkMode) {
  try {
    window.localStorage.setItem(THEME_KEY, isDarkMode ? "dark" : "light");
  } catch (e) {}
}

function updateToggleLabel(button, isDarkMode) {
  if (!button) {
    return;
  }
  button.setAttribute("aria-pressed", String(isDarkMode));
  button.setAttribute("aria-label", isDarkMode ? "Vilagos tema" : "Sotet tema");
  button.title = isDarkMode ? "Valtas vilagos temara" : "Valtas sotet temara";
  button.setAttribute("data-icon", isDarkMode ? "☀" : "☾");
}

function ensureFooterStatus() {
  const footerVersion = document.querySelector(".footer__version");
  if (!footerVersion || footerVersion.getAttribute(FOOTER_FLAG_ATTR) === "1") {
    return;
  }

  footerVersion.textContent = `${footerVersion.textContent.trim()} | NNPU aktiv v${getScriptVersion()}`;
  footerVersion.setAttribute(FOOTER_FLAG_ATTR, "1");
}

function setDarkModeState(isDarkMode, persist = true) {
  if (!document.body) {
    return;
  }
  document.body.classList.toggle(DARK_MODE_CLASS, isDarkMode);
  if (persist) {
    persistTheme(isDarkMode);
  }
  updateToggleLabel(document.getElementById(TOGGLE_ID), isDarkMode);
}

function applyInitialDarkModeClass() {
  const shouldUseDarkMode = getInitialDarkModeState();

  const apply = () => {
    if (!document.body) {
      return false;
    }
    if (shouldUseDarkMode) {
      document.body.classList.add(DARK_MODE_CLASS);
    }
    return true;
  };

  if (apply()) {
    return;
  }

  const observer = new MutationObserver(() => {
    if (apply()) {
      observer.disconnect();
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

function injectStyles() {
  utils.injectCss(`
    #${TOGGLE_ID} {
      display: inline-flex;
      position: relative;
      align-items: center;
      justify-content: center;
      width: 46px;
      height: 46px;
      padding: 0;
      border: 1px solid #3a4357;
      border-radius: 50%;
      background: radial-gradient(circle at 30% 30%, #2b3447, #141b27 68%);
      color: #e0e0e0;
      font-size: 0;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.28);
      transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease, background 0.35s ease;
      z-index: 10002;
      overflow: hidden;
    }

    #${TOGGLE_ID}::before,
    #${TOGGLE_ID}::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      transition: opacity 0.35s ease, transform 0.45s ease;
    }

    #${TOGGLE_ID}::before {
      background: radial-gradient(circle at 32% 32%, rgba(255, 224, 130, 0.96), rgba(255, 180, 64, 0.9) 45%, rgba(255, 180, 64, 0) 60%);
      transform: scale(0.55);
      opacity: 0;
    }

    #${TOGGLE_ID}::after {
      content: attr(data-icon);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      color: #eef3ff;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.28);
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0));
      transform: rotate(0deg) scale(1);
    }

    #${TOGGLE_ID}[aria-pressed="true"] {
      background: radial-gradient(circle at 35% 30%, #334560, #182131 72%);
      border-color: #4c5d7d;
    }

    #${TOGGLE_ID}[aria-pressed="true"]::before {
      opacity: 1;
      transform: scale(0.9);
    }

    #${TOGGLE_ID}[aria-pressed="false"]::before {
      opacity: 0;
      transform: scale(0.4);
    }

    #${TOGGLE_ID}:hover {
      transform: translateY(-2px) scale(1.03);
      box-shadow: 0 16px 34px rgba(0, 0, 0, 0.34);
    }

    #${TOGGLE_ID}:active {
      transform: translateY(0) scale(0.96);
    }

    .login__header #${TOGGLE_ID} {
      margin-left: auto;
    }

    #${TOGGLE_ID}.nnpu-theme-toggle-dashboard {
      position: fixed;
      bottom: 80px;
      right: 16px;
      margin: 0;
    }

    @media only screen and (max-width: 992px) {
      #${TOGGLE_ID}.nnpu-theme-toggle-dashboard {
        bottom: 76px;
        right: 12px;
      }

      #${TOGGLE_ID} {
        width: 42px;
        height: 42px;
      }
    }

    .${DARK_MODE_CLASS} {
      background: #0f1319;
      color: #e0e0e0;
    }

    .${DARK_MODE_CLASS} body {
      background: #0f1319;
      color: #e0e0e0;
    }

    .${DARK_MODE_CLASS} app-root,
    .${DARK_MODE_CLASS} .layout,
    .${DARK_MODE_CLASS} .app-main,
    .${DARK_MODE_CLASS} .router-container,
    .${DARK_MODE_CLASS} .primary-bg-wrapper,
    .${DARK_MODE_CLASS} .neptun-wrapper {
      background: transparent !important;
      color: #e0e0e0;
    }

    .${DARK_MODE_CLASS} .neptun-wrapper.header {
      background: #111827 !important;
      color: #e8eefc !important;
    }

    .${DARK_MODE_CLASS} .header__left,
    .${DARK_MODE_CLASS} .header__title {
      background: transparent !important;
      color: #e8eefc !important;
    }

    .${DARK_MODE_CLASS} .header__left {
      display: flex !important;
      align-items: center !important;
      gap: 16px;
    }

    .${DARK_MODE_CLASS} .header__img-wrapper,
    .${DARK_MODE_CLASS} .header__img {
      flex: 0 0 auto;
    }

    .${DARK_MODE_CLASS} .header__img {
      border: 2px solid #29364d;
      box-shadow: 0 8px 22px rgba(0, 0, 0, 0.22);
    }

    .${DARK_MODE_CLASS} .header__title {
      padding: 0;
      line-height: 1.4;
      display: flex;
      align-items: center;
      min-height: 48px;
      width: 100%;
      overflow: hidden;
    }

    .${DARK_MODE_CLASS} .header__title *,
    .${DARK_MODE_CLASS} .header__title > * {
      overflow: hidden;
      text-overflow: ellipsis;
      display: block;
      white-space: nowrap;
    }

    .${DARK_MODE_CLASS} .institute-name {
      background: #1b1f2a !important;
      color: #dbe4ff !important;
      border-color: #323a4d !important;
    }

    .${DARK_MODE_CLASS} #background-path,
    .${DARK_MODE_CLASS} .background-path-bottom {
      opacity: 0.06;
      fill: #1b1f2a !important;
    }

    .${DARK_MODE_CLASS} header,
    .${DARK_MODE_CLASS} .header {
      background: #141a23 !important;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35) !important;
    }

    .${DARK_MODE_CLASS} .header__middle-title,
    .${DARK_MODE_CLASS} .header__menu-title,
    .${DARK_MODE_CLASS} .header__icon,
    .${DARK_MODE_CLASS} .header__back-button {
      color: #e4eaf8 !important;
    }

    .${DARK_MODE_CLASS} .search-trigger,
    .${DARK_MODE_CLASS} .menu-trigger,
    .${DARK_MODE_CLASS} .user-menu,
    .${DARK_MODE_CLASS} .header__credit-counter {
      background: #1c2533 !important;
      color: #d6e0f5 !important;
      border-color: #2e3a50 !important;
    }

    .${DARK_MODE_CLASS} .search-input,
    .${DARK_MODE_CLASS} .search,
    .${DARK_MODE_CLASS} .search .mat-mdc-text-field-wrapper,
    .${DARK_MODE_CLASS} .search .mdc-text-field,
    .${DARK_MODE_CLASS} .search .mat-mdc-form-field-flex,
    .${DARK_MODE_CLASS} .search .mat-mdc-form-field-infix,
    .${DARK_MODE_CLASS} .search .mat-mdc-form-field-focus-overlay {
      background: #1c2533 !important;
      color: #dbe6ff !important;
      border-radius: 8px !important;
    }

    .${DARK_MODE_CLASS} .search .mdc-line-ripple,
    .${DARK_MODE_CLASS} .search .mdc-line-ripple::before,
    .${DARK_MODE_CLASS} .search .mdc-line-ripple::after {
      border-bottom-color: #4f6b96 !important;
    }

    .${DARK_MODE_CLASS} .search__icon,
    .${DARK_MODE_CLASS} .search__icon i,
    .${DARK_MODE_CLASS} .icon-search {
      color: #aecdff !important;
    }

    .${DARK_MODE_CLASS} .search input::placeholder,
    .${DARK_MODE_CLASS} .mat-mdc-input-element::placeholder {
      color: #8ea5cb !important;
      opacity: 1;
    }

    .${DARK_MODE_CLASS} .widget,
    .${DARK_MODE_CLASS} .mat-expansion-panel,
    .${DARK_MODE_CLASS} .mat-accordion {
      background: #171e2a !important;
      color: #e0e0e0 !important;
    }

    .${DARK_MODE_CLASS} .widget__title,
    .${DARK_MODE_CLASS} .widget__icon,
    .${DARK_MODE_CLASS} .header__title,
    .${DARK_MODE_CLASS} .footer__version,
    .${DARK_MODE_CLASS} .footer__server-info {
      color: #d6e0f5 !important;
      opacity: 1 !important;
    }

    .${DARK_MODE_CLASS} .mat-expansion-indicator::after,
    .${DARK_MODE_CLASS} .icon-chevron-bottom {
      color: #c6d6fa !important;
      border-color: #c6d6fa !important;
    }

    .${DARK_MODE_CLASS} .mat-mdc-menu-panel,
    .${DARK_MODE_CLASS} .mdc-menu-surface,
    .${DARK_MODE_CLASS} .mat-toolbar,
    .${DARK_MODE_CLASS} .mat-toolbar-row,
    .${DARK_MODE_CLASS} .menu-header,
    .${DARK_MODE_CLASS} .enrollment-info {
      background: #171e2a !important;
      color: #dbe6ff !important;
    }

    .${DARK_MODE_CLASS} .mat-mdc-menu-panel,
    .${DARK_MODE_CLASS} .mdc-menu-surface {
      border: 1px solid #2b3851 !important;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45) !important;
    }

    .${DARK_MODE_CLASS} .menu-header__major-caption,
    .${DARK_MODE_CLASS} .menu-header__major-name,
    .${DARK_MODE_CLASS} .switch-training,
    .${DARK_MODE_CLASS} .menu-item,
    .${DARK_MODE_CLASS} .menu-item__icon {
      color: #dbe6ff !important;
    }

    .${DARK_MODE_CLASS} .mat-mdc-menu-item,
    .${DARK_MODE_CLASS} .mat-mdc-menu-item .mdc-list-item__primary-text {
      color: #dbe6ff !important;
      background: transparent !important;
    }

    .${DARK_MODE_CLASS} .mat-mdc-menu-item:hover,
    .${DARK_MODE_CLASS} .mat-mdc-menu-item:focus,
    .${DARK_MODE_CLASS} .mat-mdc-menu-item.cdk-program-focused,
    .${DARK_MODE_CLASS} .mat-mdc-menu-item.cdk-keyboard-focused,
    .${DARK_MODE_CLASS} .mat-mdc-menu-item.mdc-list-item--selected {
      background: #233047 !important;
      color: #ffffff !important;
    }

    .${DARK_MODE_CLASS} .mat-mdc-menu-item:hover .mdc-list-item__primary-text,
    .${DARK_MODE_CLASS} .mat-mdc-menu-item:focus .mdc-list-item__primary-text,
    .${DARK_MODE_CLASS} .mat-mdc-menu-item.cdk-program-focused .mdc-list-item__primary-text,
    .${DARK_MODE_CLASS} .mat-mdc-menu-item.cdk-keyboard-focused .mdc-list-item__primary-text,
    .${DARK_MODE_CLASS} .mat-mdc-menu-item:hover .menu-item,
    .${DARK_MODE_CLASS} .mat-mdc-menu-item:focus .menu-item,
    .${DARK_MODE_CLASS} .mat-mdc-menu-item:hover .menu-item__icon,
    .${DARK_MODE_CLASS} .mat-mdc-menu-item:focus .menu-item__icon {
      color: #ffffff !important;
    }

    .${DARK_MODE_CLASS} .mat-mdc-menu-item .icon-chevron-right,
    .${DARK_MODE_CLASS} .mat-mdc-menu-item .icon-open-indicator,
    .${DARK_MODE_CLASS} .mat-mdc-menu-item [class*="chevron-right"],
    .${DARK_MODE_CLASS} .mat-mdc-menu-item [class*="arrow-right"],
    .${DARK_MODE_CLASS} .menu-item .icon-chevron-right,
    .${DARK_MODE_CLASS} .menu-item .icon-open-indicator,
    .${DARK_MODE_CLASS} .menu-item__icon.icon-chevron-right,
    .${DARK_MODE_CLASS} i[class*="chevron-right"],
    .${DARK_MODE_CLASS} i[class*="arrow-right"],
    .${DARK_MODE_CLASS} span[class*="chevron-right"],
    .${DARK_MODE_CLASS} [class*="icon"] i[class*="chevron"] {
      color: #bfd6ff !important;
      border-color: #bfd6ff !important;
    }

    .${DARK_MODE_CLASS} .mat-mdc-menu-item .mat-ripple-element,
    .${DARK_MODE_CLASS} .mat-mdc-menu-item .mat-mdc-menu-ripple,
    .${DARK_MODE_CLASS} .mat-mdc-menu-item .mat-mdc-menu-ripple::before,
    .${DARK_MODE_CLASS} .mat-mdc-menu-item .mat-mdc-menu-ripple::after {
      background: rgba(114, 143, 201, 0.16) !important;
      opacity: 1 !important;
    }

    .${DARK_MODE_CLASS} .list__item_container,
    .${DARK_MODE_CLASS} .list__item,
    .${DARK_MODE_CLASS} .message__item {
      color: #d2def7 !important;
      background: transparent !important;
    }

    .${DARK_MODE_CLASS} .list__item_container--hoverable:hover,
    .${DARK_MODE_CLASS} .list__item--hoverable:hover,
    .${DARK_MODE_CLASS} .message__item:hover,
    .${DARK_MODE_CLASS} .list__item--active,
    .${DARK_MODE_CLASS} .list-item--active,
    .${DARK_MODE_CLASS} [class*="list__item_container--active"] {
      background-color: #233047 !important;
      color: #f3f7ff !important;
    }

    .${DARK_MODE_CLASS} .list__primary,
    .${DARK_MODE_CLASS} .list__secondary,
    .${DARK_MODE_CLASS} .list__tertiary,
    .${DARK_MODE_CLASS} .list__tertiary-left,
    .${DARK_MODE_CLASS} .list__tertiary-right,
    .${DARK_MODE_CLASS} .message__sender-name,
    .${DARK_MODE_CLASS} .message__subject,
    .${DARK_MODE_CLASS} .message__date,
    .${DARK_MODE_CLASS} .credits__element,
    .${DARK_MODE_CLASS} .navigation-link,
    .${DARK_MODE_CLASS} .mdc-button__label {
      color: #c8d9ff !important;
    }

    .${DARK_MODE_CLASS} .separator,
    .${DARK_MODE_CLASS} .message__item_container.separator-on-top {
      border-color: #273551 !important;
      background: transparent !important;
    }

    .${DARK_MODE_CLASS} .row.bottom-bordered {
      border-bottom-color: #25334c !important;
    }

    .${DARK_MODE_CLASS} .mdc-text-field--filled,
    .${DARK_MODE_CLASS} .mat-mdc-text-field-wrapper,
    .${DARK_MODE_CLASS} .mdc-text-field,
    .${DARK_MODE_CLASS} .mat-mdc-form-field-focus-overlay {
      background: #1f2430 !important;
      color: #e0e0e0 !important;
    }

    .${DARK_MODE_CLASS} input,
    .${DARK_MODE_CLASS} .mat-mdc-input-element {
      color: #e0e0e0 !important;
      caret-color: #8fb4ff !important;
    }

    .${DARK_MODE_CLASS} .footer {
      background: #141922 !important;
      color: #c8d4f0 !important;
    }

    .${DARK_MODE_CLASS} .footer__version {
      opacity: 0.92 !important;
    }

    .${DARK_MODE_CLASS} a,
    .${DARK_MODE_CLASS} .link,
    .${DARK_MODE_CLASS} .header__logo,
    .${DARK_MODE_CLASS} .footer__report {
      color: #9dc0ff !important;
    }

    .${DARK_MODE_CLASS} .footer * {
      color: inherit !important;
    }

    .${DARK_MODE_CLASS} #${TOGGLE_ID} {
      border-color: #4c5d7d;
      color: #e0e0e0;
    }

    .${DARK_MODE_CLASS} #${TOGGLE_ID}:hover {
      border-color: #52698b;
    }
  `);

  utils.injectCss(`
    /* === Expansion panel / accordion header hover === */
    .${DARK_MODE_CLASS} .mat-expansion-panel-header:hover,
    .${DARK_MODE_CLASS} .mat-expansion-panel-header:focus-visible {
      background: #1e2938 !important;
    }

    .${DARK_MODE_CLASS} .mat-expansion-panel-header::before {
      background: transparent !important;
    }

    .${DARK_MODE_CLASS} .mat-expansion-panel-header .mat-ripple-element,
    .${DARK_MODE_CLASS} .mat-expansion-panel-header .mat-expansion-panel-header-ripple {
      background: rgba(168, 195, 255, 0.1) !important;
    }

    /* === Message card + list-item hover (role=button rows) === */
    .${DARK_MODE_CLASS} neptun-message-card:hover .message__item_container,
    .${DARK_MODE_CLASS} neptun-message-card:focus .message__item_container,
    .${DARK_MODE_CLASS} .list-item:hover .message__item_container {
      background: #1e2b3c !important;
    }

    /* === Text colors for previously-unreadable elements === */

    /* "Tanóra" / list type label */
    .${DARK_MODE_CLASS} .primary-text,
    .${DARK_MODE_CLASS} .list__type {
      color: #7eb8ff !important;
    }

    /* Pie chart averages widget */
    .${DARK_MODE_CLASS} .overlay-data,
    .${DARK_MODE_CLASS} .averages__pie-chart__decimal,
    .${DARK_MODE_CLASS} .averages__pie-chart__text,
    .${DARK_MODE_CLASS} .chart-description {
      color: #d0deff !important;
    }

    /* Credit count */
    .${DARK_MODE_CLASS} .credits__count {
      color: #c8d9ff !important;
    }

    .${DARK_MODE_CLASS} .credits__element {
      border-color: #273551 !important;
    }

    /* Message date label */
    .${DARK_MODE_CLASS} .message__last-post-date {
      color: #8295b5 !important;
    }

    /* Empty / no-data widget states */
    .${DARK_MODE_CLASS} .empty,
    .${DARK_MODE_CLASS} .empty p,
    .${DARK_MODE_CLASS} .no-data__text,
    .${DARK_MODE_CLASS} [class*="empty"] p {
      color: #7a8daa !important;
    }

    .${DARK_MODE_CLASS} .empty i,
    .${DARK_MODE_CLASS} .no-data__icon {
      color: #4a6080 !important;
    }

    /* Badge with white background (#f2f3fb) -> dark */
    .${DARK_MODE_CLASS} .neptun-badge--background-elements {
      background-color: #253349 !important;
      color: #c0d0f0 !important;
    }

    /* User menu info text */
    .${DARK_MODE_CLASS} .user-menu__name,
    .${DARK_MODE_CLASS} .user-menu__code,
    .${DARK_MODE_CLASS} .user-menu__training,
    .${DARK_MODE_CLASS} .user-menu__code-training {
      color: #d6e0f5 !important;
    }

    .${DARK_MODE_CLASS} .user-menu,
    .${DARK_MODE_CLASS} .user-menu__block,
    .${DARK_MODE_CLASS} .user-menu__user-data {
      align-items: center !important;
    }

    .${DARK_MODE_CLASS} .user-menu__block {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-width: 0;
    }

    .${DARK_MODE_CLASS} .user-menu__user-data {
      line-height: 1.25;
      gap: 4px;
      overflow: hidden;
    }

    .${DARK_MODE_CLASS} .user-menu__name,
    .${DARK_MODE_CLASS} .user-menu__code,
    .${DARK_MODE_CLASS} .user-menu__training {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 120px;
    }

    .${DARK_MODE_CLASS} .user-menu__image {
      flex: 0 0 auto;
      margin-right: 10px;
    }

    /* Financial widget text */
    .${DARK_MODE_CLASS} .finances__debts,
    .${DARK_MODE_CLASS} .finances__debts-total,
    .${DARK_MODE_CLASS} .finances__overdue,
    .${DARK_MODE_CLASS} .finances__overdue-total,
    .${DARK_MODE_CLASS} .finances__other-debts,
    .${DARK_MODE_CLASS} .finances__text {
      color: #c8d9ff !important;
    }

    /* Scroll arrow buttons in averages widget */
    .${DARK_MODE_CLASS} .scroll__button {
      color: #8ab4f8 !important;
    }

    .${DARK_MODE_CLASS} .navigation-link i.icon-chevron-right,
    .${DARK_MODE_CLASS} .more-button i.icon-chevron-right,
    .${DARK_MODE_CLASS} .more-results i.icon-chevron-right,
    .${DARK_MODE_CLASS} .more-messages i.icon-chevron-right {
      color: #9dc0ff !important;
      border-color: #9dc0ff !important;
    }

    /* General paragraph text inside widgets */
    .${DARK_MODE_CLASS} .widget p,
    .${DARK_MODE_CLASS} .mat-expansion-panel p {
      color: #ccd8ef !important;
    }

    /* === Dialog & Overlay Styling === */
    .${DARK_MODE_CLASS} .cdk-overlay-backdrop {
      background: rgba(0, 0, 0, 0.65) !important;
    }

    .${DARK_MODE_CLASS} .cdk-global-overlay-wrapper,
    .${DARK_MODE_CLASS} .cdk-overlay-pane {
      backdrop-filter: blur(4px);
    }

    .${DARK_MODE_CLASS} .mat-mdc-dialog-container,
    .${DARK_MODE_CLASS} .mdc-dialog,
    .${DARK_MODE_CLASS} .mdc-dialog__surface,
    .${DARK_MODE_CLASS} .mat-mdc-dialog-surface {
      background: #1a212d !important;
      border-color: #2b3851 !important;
    }

    .${DARK_MODE_CLASS} .mat-mdc-dialog-title,
    .${DARK_MODE_CLASS} .mdc-dialog__title,
    .${DARK_MODE_CLASS} .mat-mdc-dialog-content,
    .${DARK_MODE_CLASS} .mdc-dialog__content {
      color: #dbe6ff !important;
    }

    .${DARK_MODE_CLASS} .mat-mdc-dialog-container h2,
    .${DARK_MODE_CLASS} .mat-h2 {
      color: #e8eefc !important;
    }

    .${DARK_MODE_CLASS} .mat-mdc-dialog-actions,
    .${DARK_MODE_CLASS} .mdc-dialog__actions {
      background: #161d28 !important;
      border-top-color: #2b3851 !important;
    }

    .${DARK_MODE_CLASS} .mat-mdc-button,
    .${DARK_MODE_CLASS} .mat-mdc-unelevated-button,
    .${DARK_MODE_CLASS} .mat-mdc-outlined-button,
    .${DARK_MODE_CLASS} .mdc-button {
      color: #dbe6ff !important;
    }

    .${DARK_MODE_CLASS} .mat-mdc-button[mat-flat-button],
    .${DARK_MODE_CLASS} .mat-flat-button {
      background: #0943d9 !important;
      color: #ffffff !important;
    }

    .${DARK_MODE_CLASS} .mat-mdc-button[mat-stroked-button],
    .${DARK_MODE_CLASS} .mat-stroked-button {
      border-color: #4f6b96 !important;
      color: #7eb8ff !important;
    }

    .${DARK_MODE_CLASS} .mat-mdc-button[mat-stroked-button]:hover,
    .${DARK_MODE_CLASS} .mat-stroked-button:hover {
      background: rgba(79, 107, 150, 0.12) !important;
    }

    .${DARK_MODE_CLASS} .neptun-button,
    .${DARK_MODE_CLASS} .icon.lightgrey {
      color: #8fa1c4 !important;
    }

    .${DARK_MODE_CLASS} .neptun-button:hover,
    .${DARK_MODE_CLASS} .icon.lightgrey:hover {
      color: #b0c4e3 !important;
    }

    .${DARK_MODE_CLASS} .mat-mdc-dialog-content .overlay-data,
    .${DARK_MODE_CLASS} .mat-mdc-dialog-content h1 {
      color: #d0deff !important;
    }

    .${DARK_MODE_CLASS} .mat-mdc-dialog-content .content__text,
    .${DARK_MODE_CLASS} .mat-mdc-dialog-content p {
      color: #c8d9ff !important;
    }

    .${DARK_MODE_CLASS} .content__description {
      color: #dbe6ff !important;
    }

    .${DARK_MODE_CLASS} .mat-mdc-dialog-container .kuixcustomicon-Big-left-arrow,
    .${DARK_MODE_CLASS} .mat-mdc-dialog-container .kuixcustomicon-Big-right-arrow,
    .${DARK_MODE_CLASS} .content__move {
      color: #7eb8ff !important;
    }
  `);
  ensureFooterStatus();
}

function waitForAnyElement(selectors, timeoutMs = 20000) {
  return new Promise(resolve => {
    const findTarget = () => selectors.map(selector => document.querySelector(selector)).find(Boolean);

    const initial = findTarget();
    if (initial) {
      resolve(initial);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = findTarget();
      if (element) {
        observer.disconnect();
        if (timer) {
          window.clearTimeout(timer);
        }
        resolve(element);
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    const timer = window.setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeoutMs);
  });
}

function mountToggleInto(container) {
  if (!container || document.getElementById(TOGGLE_ID)) {
    return;
  }

  const toggleButton = document.createElement("button");
  toggleButton.id = TOGGLE_ID;
  toggleButton.type = "button";
  toggleButton.title = "NNPU tema valtas";

  toggleButton.addEventListener("click", () => {
    const darkModeEnabled = document.body && document.body.classList.contains(DARK_MODE_CLASS);
    setDarkModeState(!darkModeEnabled, true);
  });

  if (container.matches(".login__header")) {
    toggleButton.classList.add("nnpu-theme-toggle-login");
    container.appendChild(toggleButton);
  } else {
    toggleButton.classList.add("nnpu-theme-toggle-dashboard");
    document.body.appendChild(toggleButton);
  }

  setDarkModeState(document.body && document.body.classList.contains(DARK_MODE_CLASS), false);
}

async function injectToggle() {
  const header = await waitForAnyElement(["div.login__header", "header .header__right", "#main-header-right"]);
  mountToggleInto(header);
}

function ensureToggleWatcher() {
  if (toggleWatcher) {
    return;
  }

  const observer = new MutationObserver(() => {
    if (document.getElementById(TOGGLE_ID)) {
      return;
    }
    const container = document.querySelector("div.login__header, header .header__right, #main-header-right");
    mountToggleInto(container);
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  toggleWatcher = observer;
}

function initializeLoginDarkMode() {
  if (!isAngularHallgatoiPage()) {
    return;
  }

  applyInitialDarkModeClass();
  injectStyles();
  injectToggle();
  ensureToggleWatcher();
  ensureFooterStatus();

  new MutationObserver(() => {
    ensureFooterStatus();
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

module.exports = {
  shouldActivate: () => isAngularHallgatoiPage(),
  runOutsideNeptun: true,
  initialize: () => {
    initializeLoginDarkMode();
  },
};

/***/ }),

/***/ 413:
/***/ ((module) => {

const $ = window.jQuery;

// Verify that we are indeed on a Neptun page
function isNeptunPage() {
  return document.title.toLowerCase().indexOf("neptun.net") !== -1;
}

// Returns whether we are on the login page
function isLoginPage() {
  return $("td.login_left_side").size() > 0;
}

// Returns whether we are authenticated
function isLoggedIn() {
  return !!getNeptunCode();
}

// Parses and returns the Neptun code of the current user
function getNeptunCode() {
  if ($("#upTraining_topname").size() > 0) {
    const input = $("#upTraining_topname").text();
    return input.substring(input.indexOf(" - ") + 3).toUpperCase();
  }
}

// Parses and returns the first-level domain of the site
function getDomain() {
  const host = location.host.split(".");
  const tlds = "at co com edu eu gov hu hr info int mil net org ro rs sk si ua uk".split(" ");
  let domain = "";
  for (let i = host.length - 1; i >= 0; i--) {
    domain = `${host[i]}.${domain}`;
    if (!tlds.includes(host[i])) {
      return domain.substr(0, domain.length - 1);
    }
  }
}

// Parses and returns the sanitized name of the current training
function getTraining() {
  if ($("#lblTrainingName").size() > 0) {
    return $("#lblTrainingName")
      .text()
      .replace(/[^a-zA-Z0-9]/g, "");
  }
}

// Returns the ID of the current page
function getPageId() {
  const result = /ctrl=([a-zA-Z0-9_]+)/g.exec(window.location.href);
  return result ? result[1] : null;
}

// Returns whether the specified ID is the current page
function isPageId(...ctrls) {
  return ctrls.includes(getPageId());
}

// Get the current AJAX grid instance
function getAjaxInstance(element) {
  const instanceId = getAjaxInstanceId(element);
  return instanceId && unsafeWindow[getAjaxInstanceId(element)];
}

function getAjaxInstanceId(element) {
  const ajaxGrid = $(element).closest("div[type=ajaxgrid]");
  return ajaxGrid.size() > 0 && ajaxGrid.first().attr("instanceid");
}

// Runs a function asynchronously to fix problems in certain cases
function runAsync(func) {
  window.setTimeout(func, 0);
}

// Evaluates code in the page context
function runEval(source) {
  const value = typeof source === "function" ? `(${source})();` : source;
  const script = document.createElement("script");
  script.setAttribute("type", "application/javascript");
  script.textContent = value;
  document.body.appendChild(script);
  document.body.removeChild(script);
}

// Reads the value at the provided path in a deeply nested object
function deepGetProp(o, s) {
  let c = o;
  while (s.length) {
    const n = s.shift();
    if (!(c instanceof Object && n in c)) {
      return;
    }
    c = c[n];
  }
  return c;
}

// Sets a value at the provided path in a deeply nested object
function deepSetProp(o, s, v) {
  let c = o;
  while (s.length) {
    const n = s.shift();
    if (s.length === 0) {
      if (v === null) {
        delete c[n];
      } else {
        c[n] = v;
      }
      return;
    }
    if (!(typeof c === "object" && n in c)) {
      c[n] = new Object();
    }
    c = c[n];
  }
}

// Injects a style tag into the page
function injectCss(css) {
  $("<style></style>").html(css).appendTo("head");
}

// Waits for an element to appear in asynchronously rendered DOMs.
function waitForElement(selector, options = {}) {
  const {
    root = document,
    timeoutMs = 15000,
  } = options;

  return new Promise(resolve => {
    const initial = root.querySelector(selector);
    if (initial) {
      resolve(initial);
      return;
    }

    let timeoutId;
    const observer = new MutationObserver(() => {
      const element = root.querySelector(selector);
      if (element) {
        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    timeoutId = window.setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeoutMs);
  });
}

// Parses a subject code that is in parentheses at the end of a string
function parseSubjectCode(source) {
  const str = source.trim();
  if (str.charAt(str.length - 1) === ")") {
    let depth = 0;
    for (let i = str.length - 2; i >= 0; i--) {
      const c = str.charAt(i);
      if (depth === 0 && c === "(") {
        return str.substring(i + 1, str.length - 1);
      }
      depth = c === ")" ? depth + 1 : depth;
      depth = c === "(" && depth > 0 ? depth - 1 : depth;
    }
  }
  return null;
}

// Returns if the given string stands for a passing grade
function isPassingGrade(str) {
  return [
    "jeles",
    "excellent",
    "jó",
    "good",
    "közepes",
    "satisfactory",
    "elégséges",
    "pass",
    "kiválóan megfelelt",
    "excellent",
    "megfelelt",
    "average",
  ].some(function (item) {
    return str.toLowerCase().indexOf(item) !== -1;
  });
}

// Returns if the given string stands for a failing grade
function isFailingGrade(str) {
  return [
    "elégtelen",
    "fail",
    "nem felelt meg",
    "unsatisfactory",
    "nem jelent meg",
    "did not attend",
    "nem vizsgázott",
    "did not attend",
  ].some(function (item) {
    return str.toLowerCase().indexOf(item) !== -1;
  });
}

module.exports = {
  isNeptunPage,
  isLoginPage,
  isLoggedIn,
  getNeptunCode,
  getDomain,
  getTraining,
  getPageId,
  isPageId,
  getAjaxInstance,
  getAjaxInstanceId,
  runAsync,
  runEval,
  deepGetProp,
  deepSetProp,
  injectCss,
  waitForElement,
  parseSubjectCode,
  isPassingGrade,
  isFailingGrade,
};


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
const utils = __webpack_require__(413);
/*
const storage = require("./storage");
*/

const modules = [
  // Login page
  __webpack_require__(793),
  /*
  require("./modules/autoLogin"),
  require("./modules/loginRetry"),
  */
  __webpack_require__(660),

  /*
  // Automatic redirect to the last visited page
  require("./modules/backToLastPage"),

  // All authenticated pages
  require("./modules/hideHeader"),
  require("./modules/pageTitle"),
  require("./modules/mainMenuFixes"),
  require("./modules/termSelectorFixes"),
  require("./modules/paginationFixes"),
  require("./modules/officialMessageAlert"),
  require("./modules/hideSurveyPopup"),
  require("./modules/infiniteSession"),
  require("./modules/loadingIndicator"),

  // Timetable page
  require("./modules/timetableFixes"),

  // Markbook page
  require("./modules/markListFixes"),

  // Advance page
  require("./modules/advanceListFixes"),

  // Course signup page
  require("./modules/courseListFixes"),
  require("./modules/courseAutoList"),
  require("./modules/courseStore"),

  // Exams page
  require("./modules/examListFixes"),

  // Signed exams page
  require("./modules/signedExamListFixes"),
  */
];

(async () => {
  /*
  await storage.initialize();
  */

  modules.forEach(module => {
    if (module.shouldActivate() && (utils.isNeptunPage() || module.runOutsideNeptun)) {
      module.initialize();
    }
  });
})();

/******/ })()
;