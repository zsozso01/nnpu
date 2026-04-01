const utils = require("../utils");

const THEME_KEY = "nnpu-theme";
const DARK_MODE_CLASS = "nnpu-dark-mode";
const TOGGLE_ID = "nnpu-theme-toggle";
let toggleWatcher = null;

function isAngularLoginPage() {
  const normalizedPath = window.location.pathname.replace(/\/+$/, "") || "/";
  return normalizedPath === "/hallgatoi" || normalizedPath === "/hallgatoi/login";
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

function injectLoginStyles() {
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

    #${TOGGLE_ID}.nnpu-theme-toggle-floating {
      position: fixed;
      right: 18px;
      top: 18px;
      margin: 0;
      z-index: 10003;
    }

    @media only screen and (max-width: 767px) {
      #${TOGGLE_ID}.nnpu-theme-toggle-floating {
        right: 12px;
        top: 12px;
      }
    }

    .${DARK_MODE_CLASS} {
      background: #0f1319;
      color: #e0e0e0;
    }

    .${DARK_MODE_CLASS} .login-panel {
      background: #161d2a !important;
      border-color: #2b3851 !important;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45) !important;
    }

    .${DARK_MODE_CLASS} .login-panel::before {
      background: linear-gradient(180deg, #00d99f, #00a878) !important;
    }

    .${DARK_MODE_CLASS} .login-right__caption {
      color: #e8eefc !important;
    }

    .${DARK_MODE_CLASS} .preview-form label {
      color: #aebddb !important;
    }

    .${DARK_MODE_CLASS} .preview-form input {
      background: #1f2430 !important;
      color: #e0e0e0 !important;
      border-color: #3a4557 !important;
      caret-color: #8fb4ff !important;
    }

    .${DARK_MODE_CLASS} .preview-form input::placeholder {
      color: #8ea5cb !important;
      opacity: 1;
    }

    .${DARK_MODE_CLASS} .preview-form input:focus {
      border-color: #4f6b96 !important;
      background: #232a37 !important;
    }

    .${DARK_MODE_CLASS} .preview-submit {
      background: #0943d9 !important;
      color: #ffffff !important;
    }

    .${DARK_MODE_CLASS} .preview-submit:hover {
      background: #0535a8 !important;
    }

    .${DARK_MODE_CLASS} .preview-alt {
      background: #1a2235 !important;
      color: #7eb8ff !important;
      border: 1px solid #3a4f6b !important;
    }

    .${DARK_MODE_CLASS} .preview-alt:hover {
      background: #212d40 !important;
      border-color: #4f6b96 !important;
    }

    .${DARK_MODE_CLASS} .footer-preview {
      background: #161d28 !important;
      border-top-color: #2b3851 !important;
      color: #c8d4f0 !important;
    }

    .${DARK_MODE_CLASS} .footer-preview a {
      color: #9dc0ff !important;
    }

    .${DARK_MODE_CLASS} .mat-accordion,
    .${DARK_MODE_CLASS} .mat-expansion-panel {
      background: transparent !important;
    }

    .${DARK_MODE_CLASS} .mat-expansion-panel-header,
    .${DARK_MODE_CLASS} .mat-expansion-panel-header.mat-expanded,
    .${DARK_MODE_CLASS} .mat-expansion-panel-content,
    .${DARK_MODE_CLASS} .mat-expansion-panel-body {
      background: #161d28 !important;
      border-color: #2b3851 !important;
      color: #dbe6ff !important;
    }

    .${DARK_MODE_CLASS} .mat-expansion-panel-body,
    .${DARK_MODE_CLASS} .mat-expansion-panel-body * {
      color: #d8e6ff !important;
    }

    .${DARK_MODE_CLASS} .mat-expansion-panel-header h4,
    .${DARK_MODE_CLASS} .mat-expansion-panel-header-title,
    .${DARK_MODE_CLASS} .mat-expansion-panel-header-title h4,
    .${DARK_MODE_CLASS} .icon-chevron-bottom {
      color: #dbe6ff !important;
      border-color: #dbe6ff !important;
    }

    .${DARK_MODE_CLASS} .news__title,
    .${DARK_MODE_CLASS} .news__text,
    .${DARK_MODE_CLASS} .news__date,
    .${DARK_MODE_CLASS} .news__open-button .neptun-button__label,
    .${DARK_MODE_CLASS} .news__open-button .neptun-button__postfix-icon,
    .${DARK_MODE_CLASS} .more-button .neptun-button__label {
      color: #cfe0ff !important;
    }

    .${DARK_MODE_CLASS} .news__open-button,
    .${DARK_MODE_CLASS} .more-button button {
      border-color: #3a4f6b !important;
      background: #1a2234 !important;
    }

    .${DARK_MODE_CLASS} .news,
    .${DARK_MODE_CLASS} .news-list,
    .${DARK_MODE_CLASS} .news__item,
    .${DARK_MODE_CLASS} .news__data,
    .${DARK_MODE_CLASS} neptun-news-list,
    .${DARK_MODE_CLASS} .mat-expansion-panel-content {
      background: #161d28 !important;
    }

    .${DARK_MODE_CLASS} .news__item {
      border-bottom: 1px solid #2b3851 !important;
    }

    .${DARK_MODE_CLASS} .news__title {
      color: #e7efff !important;
    }

    .${DARK_MODE_CLASS} .news__date {
      color: #9cb4db !important;
    }

    .${DARK_MODE_CLASS} .news__text,
    .${DARK_MODE_CLASS} .news__text *,
    .${DARK_MODE_CLASS} .news__text p,
    .${DARK_MODE_CLASS} .news__text span,
    .${DARK_MODE_CLASS} .news__text div,
    .${DARK_MODE_CLASS} .news__data p,
    .${DARK_MODE_CLASS} .news__data span,
    .${DARK_MODE_CLASS} .news__data div {
      color: #ccdbf4 !important;
    }

    .${DARK_MODE_CLASS} .news__text a,
    .${DARK_MODE_CLASS} .news__data a,
    .${DARK_MODE_CLASS} .mat-expansion-panel-body a {
      color: #98c3ff !important;
      text-decoration-color: rgba(152, 195, 255, 0.45) !important;
    }

    .${DARK_MODE_CLASS} .news__open-button.link.primary,
    .${DARK_MODE_CLASS} .more-button .primary.stroked,
    .${DARK_MODE_CLASS} .more-button .neptun-button {
      background: #1a2234 !important;
      border: 1px solid #3a4f6b !important;
      color: #cfe0ff !important;
      box-shadow: none !important;
    }

    .${DARK_MODE_CLASS} .news__open-button:hover,
    .${DARK_MODE_CLASS} .more-button button:hover {
      background: #223049 !important;
    }

    .${DARK_MODE_CLASS} .news__item,
    .${DARK_MODE_CLASS} .news__data,
    .${DARK_MODE_CLASS} .news__title,
    .${DARK_MODE_CLASS} .news__date,
    .${DARK_MODE_CLASS} .news__text,
    .${DARK_MODE_CLASS} .mat-expansion-panel-body,
    .${DARK_MODE_CLASS} .mat-expansion-panel-content,
    .${DARK_MODE_CLASS} .mat-expansion-panel-content * {
      color: #cfe0ff !important;
    }

    .${DARK_MODE_CLASS} app-login,
    .${DARK_MODE_CLASS} .login,
    .${DARK_MODE_CLASS} .main-content,
    .${DARK_MODE_CLASS} .router-container,
    .${DARK_MODE_CLASS} .app-main {
      background: #0f1319 !important;
      color: #e8eefc !important;
    }

    .${DARK_MODE_CLASS} .institute-name {
      background: rgba(20, 29, 42, 0.9) !important;
      color: #e8eefc !important;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.25);
    }

    .${DARK_MODE_CLASS} #background-path path,
    .${DARK_MODE_CLASS} .background-path-bottom path {
      fill: #172131 !important;
      opacity: 0.5 !important;
    }

    .${DARK_MODE_CLASS} .login-left {
      background-color: #00c896 !important;
    }

    .${DARK_MODE_CLASS} .login-right {
      background: rgba(17, 24, 36, 0.88);
      border: 1px solid #2b3851;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 14px 38px rgba(0, 0, 0, 0.34);
    }

    .${DARK_MODE_CLASS} .login-right .mat-mdc-text-field-wrapper,
    .${DARK_MODE_CLASS} .login-right .mdc-text-field,
    .${DARK_MODE_CLASS} .login-right .mat-mdc-form-field-focus-overlay,
    .${DARK_MODE_CLASS} .login-right .mat-mdc-form-field-infix,
    .${DARK_MODE_CLASS} .login-right .mat-mdc-form-field-flex {
      background: #1d2738 !important;
      color: #e0e8fb !important;
      border-color: #334765 !important;
    }

    .${DARK_MODE_CLASS} .login-right input,
    .${DARK_MODE_CLASS} .login-right .mat-mdc-input-element,
    .${DARK_MODE_CLASS} .login-right .mat-mdc-input-element::placeholder,
    .${DARK_MODE_CLASS} .login-right .mdc-floating-label,
    .${DARK_MODE_CLASS} .login-right i {
      color: #dbe6ff !important;
    }

    .${DARK_MODE_CLASS} #login-button {
      background: #0a56ff !important;
      color: #ffffff !important;
    }

    .${DARK_MODE_CLASS} #login-button:hover {
      background: #0a46cf !important;
    }

    .${DARK_MODE_CLASS} #forgotten-password-button .neptun-button__label {
      color: #8fb8ff !important;
    }

    .${DARK_MODE_CLASS} .menu-trigger.language-dropdown--has-globe-icon,
    .${DARK_MODE_CLASS} .menu-trigger.flat.lightgrey {
      background-color: #1b2534 !important;
      color: #dbe6ff !important;
      box-shadow: none !important;
      border: 1px solid #2d3b52 !important;
    }

    .${DARK_MODE_CLASS} .menu-trigger .globe-icon,
    .${DARK_MODE_CLASS} .menu-trigger .icon-globe1,
    .${DARK_MODE_CLASS} .menu-trigger .text-uppercase,
    .${DARK_MODE_CLASS} .menu-trigger .icon-open-indicator,
    .${DARK_MODE_CLASS} .menu-trigger .icon-chevron-bottom,
    .${DARK_MODE_CLASS} .menu-trigger .neptun-button__label,
    .${DARK_MODE_CLASS} .menu-trigger .neptun-button__body,
    .${DARK_MODE_CLASS} .neptun-language-dropdown .neptun-button__label,
    .${DARK_MODE_CLASS} .footer__language .neptun-button__label,
    .${DARK_MODE_CLASS} .footer__language .menu-trigger {
      color: #dbe6ff !important;
    }

    .${DARK_MODE_CLASS} .mat-mdc-menu-panel,
    .${DARK_MODE_CLASS} .mdc-menu-surface {
      background: #1b2534 !important;
      border: 1px solid #2d3b52 !important;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45) !important;
      color: #dbe6ff !important;
    }

    .${DARK_MODE_CLASS} .mat-mdc-menu-item,
    .${DARK_MODE_CLASS} .mat-mdc-menu-item .mdc-list-item__primary-text {
      color: #dbe6ff !important;
      background: transparent !important;
    }

    .${DARK_MODE_CLASS} .mat-mdc-menu-item:hover,
    .${DARK_MODE_CLASS} .mat-mdc-menu-item:focus {
      background: #233047 !important;
      color: #ffffff !important;
    }

    /* === Letölthető dokumentumok (file items) === */
    .${DARK_MODE_CLASS} .file {
      background-color: #1c2533 !important;
      color: #dbe6ff !important;
    }

    .${DARK_MODE_CLASS} .file__name,
    .${DARK_MODE_CLASS} .file__extension,
    .${DARK_MODE_CLASS} .file__metadata,
    .${DARK_MODE_CLASS} .file__size {
      color: #c8d9ff !important;
    }

    .${DARK_MODE_CLASS} .file__info-trigger__button {
      color: #7eb8ff !important;
    }

    .${DARK_MODE_CLASS} .file__icon--red { color: #ff6b6b !important; }
    .${DARK_MODE_CLASS} .file__icon--green { color: #6bde8a !important; }
    .${DARK_MODE_CLASS} .file__icon--blue { color: #6bb8ff !important; }
    .${DARK_MODE_CLASS} .file__icon--warning { color: #f2994a !important; }

    .${DARK_MODE_CLASS} .additional {
      background-color: #1c2533 !important;
      color: #c8d9ff !important;
    }

    .${DARK_MODE_CLASS} .additional__label {
      color: #9cb4db !important;
    }

    .${DARK_MODE_CLASS} .additional__value {
      color: #dbe6ff !important;
    }

    .${DARK_MODE_CLASS} .additional__actions {
      border-top-color: #2b3851 !important;
    }

    /* === Hasznos linkek (useful links) === */
    .${DARK_MODE_CLASS} .useful-links__link {
      color: #98c3ff !important;
    }

    .${DARK_MODE_CLASS} .useful-links__description {
      color: #9cb4db !important;
    }

    .${DARK_MODE_CLASS} .useful-links__wrapper:hover {
      background-color: #1c2533 !important;
    }

    .${DARK_MODE_CLASS} .list-wrapper a {
      color: #98c3ff !important;
    }

    .${DARK_MODE_CLASS} .footer {
      background: #141b27 !important;
    }

    .${DARK_MODE_CLASS} .footer__version,
    .${DARK_MODE_CLASS} .footer__server-info,
    .${DARK_MODE_CLASS} .footer__report {
      color: #b9c9e9 !important;
      opacity: 1 !important;
    }
  `);
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
  if (document.getElementById(TOGGLE_ID) || !document.body) {
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

  toggleButton.classList.add("nnpu-theme-toggle-floating");
  document.body.appendChild(toggleButton);

  setDarkModeState(document.body && document.body.classList.contains(DARK_MODE_CLASS), false);
}

async function injectToggle() {
  const header = await waitForAnyElement(["div.login__header", "header .header__right", "header .header__left"]);
  mountToggleInto(header);
}

function ensureToggleWatcher() {
  if (toggleWatcher) {
    return;
  }

  toggleWatcher = new MutationObserver(() => {
    if (document.getElementById(TOGGLE_ID)) {
      return;
    }

    const container = document.querySelector("div.login__header, header .header__right, header .header__left");
    mountToggleInto(container);
  });

  toggleWatcher.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

function initializeLoginDarkMode() {
  if (!isAngularLoginPage()) {
    return;
  }

  applyInitialDarkModeClass();
  injectLoginStyles();
  injectToggle();
  ensureToggleWatcher();
}

module.exports = {
  shouldActivate: () => isAngularLoginPage(),
  runOutsideNeptun: true,
  initialize: () => {
    initializeLoginDarkMode();
  },
};
