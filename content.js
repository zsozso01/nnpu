// ============================================================================
// NNPU Content Script — Manifest V3
// New Neptun PowerUp — Angular SPA Dark Mode & DOM Utilities
// ============================================================================

(() => {
  "use strict";

  // ── Constants ─────────────────────────────────────────────────────────────

  const NNPU_VERSION = "2.6.1";
  const THEME_KEY = "nnpu-theme";
  const DARK_MODE_CLASS = "nnpu-dark-mode";
  const TOGGLE_ID = "nnpu-theme-toggle";

  // ── Route helpers ─────────────────────────────────────────────────────────

  function isAngularLoginPage() {
    const p = window.location.pathname.replace(/\/+$/, "") || "/";
    return p === "/hallgatoi" || p === "/hallgatoi/login";
  }

  function isAngularHallgatoiPage() {
    return /\/hallgatoi(\/|$)/i.test(window.location.pathname);
  }

  function isLikelyNeptunHost() {
    return /neptun/i.test(window.location.hostname);
  }

  // ── Theme persistence (localStorage) ──────────────────────────────────────

  function getStoredTheme() {
    try {
      return window.localStorage.getItem(THEME_KEY);
    } catch {
      return null;
    }
  }

  function getInitialDarkModeState() {
    const stored = getStoredTheme();
    if (stored === "dark") return true;
    if (stored === "light") return false;
    return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }

  function persistTheme(isDark) {
    try {
      window.localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
    } catch {
      // localStorage unavailable — silently ignore
    }
  }

  // ── CSS injection helper ──────────────────────────────────────────────────

  function injectCss(css, id = null) {
    if (id && document.getElementById(id)) return;
    const style = document.createElement("style");
    if (id) style.id = id;
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  // ── SPA element waiting logic ─────────────────────────────────────────────

  function waitForAnyElement(selectors, timeoutMs = 20000) {
    return new Promise((resolve) => {
      const find = () =>
        selectors.map((s) => document.querySelector(s)).find(Boolean);

      const found = find();
      if (found) {
        resolve(found);
        return;
      }

      let timer;
      const observer = new MutationObserver(() => {
        const el = find();
        if (el) {
          observer.disconnect();
          if (timer) clearTimeout(timer);
          resolve(el);
        }
      });

      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });

      timer = setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeoutMs);
    });
  }

  // ── Toggle button helpers ─────────────────────────────────────────────────

  function updateToggleLabel(btn, isDark) {
    if (!btn) return;
    btn.setAttribute("aria-pressed", String(isDark));
    btn.setAttribute("aria-label", isDark ? "Vilagos tema" : "Sotet tema");
    btn.title = isDark ? "Valtas vilagos temara" : "Valtas sotet temara";
    btn.setAttribute("data-icon", isDark ? "\u2600" : "\u263E");
  }

  function setDarkModeState(isDark, persist = true) {
    document.documentElement.classList.toggle(DARK_MODE_CLASS, isDark);
    if (!document.body) return;
    document.body.classList.toggle(DARK_MODE_CLASS, isDark);
    if (persist) persistTheme(isDark);
    updateToggleLabel(document.getElementById(TOGGLE_ID), isDark);
  }

  function applyInitialDarkModeClass() {
    const shouldDark = getInitialDarkModeState();
    document.documentElement.classList.toggle(DARK_MODE_CLASS, shouldDark);
    const apply = () => {
      if (!document.body) return false;
      document.body.classList.toggle(DARK_MODE_CLASS, shouldDark);
      return true;
    };
    if (apply()) return;
    const obs = new MutationObserver(() => {
      if (apply()) obs.disconnect();
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }

  // Inject a minimal dark palette early to reduce white flashes before full CSS loads.
  function injectEarlyDarkPreloadStyle() {
    if (getStoredTheme() !== "dark") return;
    injectCss(`
      html.${DARK_MODE_CLASS},
      html.${DARK_MODE_CLASS} body,
      html.${DARK_MODE_CLASS} app-root,
      html.${DARK_MODE_CLASS} .layout,
      html.${DARK_MODE_CLASS} .app-main,
      html.${DARK_MODE_CLASS} .router-container,
      html.${DARK_MODE_CLASS} .primary-bg-wrapper,
      html.${DARK_MODE_CLASS} .neptun-wrapper {
        background: #0f1319 !important;
        color: #dbe6ff !important;
      }

      html.${DARK_MODE_CLASS} header,
      html.${DARK_MODE_CLASS} .header,
      html.${DARK_MODE_CLASS} .neptun-wrapper.header,
      html.${DARK_MODE_CLASS} .header__container,
      html.${DARK_MODE_CLASS} .header__left,
      html.${DARK_MODE_CLASS} .header__right {
        background: #1a2538 !important;
        border-bottom-color: #304566 !important;
        color: #eaf2ff !important;
      }

      html.${DARK_MODE_CLASS} .widget,
      html.${DARK_MODE_CLASS} .mat-expansion-panel,
      html.${DARK_MODE_CLASS} .mat-accordion,
      html.${DARK_MODE_CLASS} .mat-mdc-menu-panel,
      html.${DARK_MODE_CLASS} .mdc-menu-surface {
        background: #171e2a !important;
        color: #dbe6ff !important;
      }
    `, "nnpu-early-dark-preload-style");
  }

  // ── Mount toggle button ───────────────────────────────────────────────────

  function mountToggle() {
    if (!document.body || document.getElementById(TOGGLE_ID)) return;

    const btn = document.createElement("button");
    btn.id = TOGGLE_ID;
    btn.type = "button";
    btn.classList.add("nnpu-theme-toggle-floating");
    btn.title = "NNPU tema valtas";

    btn.addEventListener("click", () => {
      const isDark = document.body.classList.contains(DARK_MODE_CLASS);
      setDarkModeState(!isDark, true);
    });

    document.body.appendChild(btn);
    setDarkModeState(document.body.classList.contains(DARK_MODE_CLASS), false);
  }

  // Ensure the toggle is re-mounted if Angular destroys it during navigation
  let toggleWatcher = null;
  function ensureToggleWatcher() {
    if (toggleWatcher) return;
    toggleWatcher = new MutationObserver(() => {
      if (!document.getElementById(TOGGLE_ID)) mountToggle();
    });
    toggleWatcher.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  // ── CSS: Toggle button styles ─────────────────────────────────────────────

  function injectToggleStyles() {
    injectCss(`
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
        z-index: 10003;
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
    `, "nnpu-toggle-style");
  }

  // ── CSS: Login page dark mode ─────────────────────────────────────────────

  function injectLoginDarkStyles() {
    injectCss(`
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

      /* Accordion / expansion panels */
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

      /* News section */
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

      /* Login main areas */
      .${DARK_MODE_CLASS} app-login,
      .${DARK_MODE_CLASS} .login,
      .${DARK_MODE_CLASS} .main-content,
      .${DARK_MODE_CLASS} .router-container,
      .${DARK_MODE_CLASS} .app-main {
        background: #0f1319 !important;
        color: #e8eefc !important;
      }

      /* Institute name bar */
      .${DARK_MODE_CLASS} .institute-name {
        background: rgba(20, 29, 42, 0.9) !important;
        color: #e8eefc !important;
        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.25);
      }

      /* SVG wave backgrounds (#F2F3FB) */
      .${DARK_MODE_CLASS} #background-path path,
      .${DARK_MODE_CLASS} .background-path-bottom path {
        fill: #172131 !important;
        opacity: 0.5 !important;
      }

      .${DARK_MODE_CLASS} .login-left {
        background-color: #00c896 !important;
      }

      /* Login right panel */
      .${DARK_MODE_CLASS} .login-right {
        background: rgba(17, 24, 36, 0.88);
        border: 1px solid #2b3851;
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 14px 38px rgba(0, 0, 0, 0.34);
      }

      /* Angular Material inputs on login */
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

      /* Language dropdown */
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

      /* Downloadable documents */
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

      /* Useful links */
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

      /* Footer */
      .${DARK_MODE_CLASS} .footer {
        background: #141b27 !important;
      }

      .${DARK_MODE_CLASS} .footer__version,
      .${DARK_MODE_CLASS} .footer__server-info,
      .${DARK_MODE_CLASS} .footer__report {
        color: #b9c9e9 !important;
        opacity: 1 !important;
      }
    `, "nnpu-login-dark-style");
  }

  // ── CSS: Dashboard dark mode ──────────────────────────────────────────────

  function injectDashboardDarkStyles() {
    injectCss(`
      .${DARK_MODE_CLASS} {
        --nnpu-dark-main: #0f1319;
        --nnpu-dark-surface: #161d28;
        --nnpu-dark-surface-border: #2b3851;
        background: var(--nnpu-dark-main) !important;
        color: #e0e0e0;
      }

      .${DARK_MODE_CLASS} app-root,
      .${DARK_MODE_CLASS} .layout,
      .${DARK_MODE_CLASS} .app-main,
      .${DARK_MODE_CLASS} .router-container,
      .${DARK_MODE_CLASS} .primary-bg-wrapper,
      .${DARK_MODE_CLASS} .neptun-wrapper {
        background: var(--nnpu-dark-main) !important;
        color: #e0e0e0;
      }

      .${DARK_MODE_CLASS} .primary-bg-wrapper,
      .${DARK_MODE_CLASS} .primary-bg-wrapper::before,
      .${DARK_MODE_CLASS} .primary-bg-wrapper::after {
        background: var(--nnpu-dark-surface) !important;
        background-image: none !important;
      }

      .${DARK_MODE_CLASS} .neptun-wrapper.header {
        background: #1a2538 !important;
        color: #e8eefc !important;
        border-bottom: 1px solid #304566 !important;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.28) !important;
      }

      .${DARK_MODE_CLASS} .header__left,
      .${DARK_MODE_CLASS} .header__title {
        background: #1a2538 !important;
        color: #e8eefc !important;
      }

      .${DARK_MODE_CLASS} .header__left {
        display: flex !important;
        align-items: center !important;
        gap: 16px;
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
        opacity: 0.16;
        fill: #1b1f2a !important;
      }

      .${DARK_MODE_CLASS} #background-path path,
      .${DARK_MODE_CLASS} .background-path-bottom path {
        fill: var(--nnpu-dark-surface) !important;
        opacity: 1 !important;
      }

      .${DARK_MODE_CLASS} .primary-bg-wrapper svg path {
        fill: var(--nnpu-dark-surface) !important;
      }

      .${DARK_MODE_CLASS} header,
      .${DARK_MODE_CLASS} .header {
        background: #1a2538 !important;
        border-bottom: 1px solid #304566 !important;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.28) !important;
      }

      .${DARK_MODE_CLASS} .header__container,
      .${DARK_MODE_CLASS} .header__left,
      .${DARK_MODE_CLASS} .header__right {
        box-shadow: none !important;
      }

      .${DARK_MODE_CLASS} .header__middle-title,
      .${DARK_MODE_CLASS} .header__menu-title,
      .${DARK_MODE_CLASS} .header__icon,
      .${DARK_MODE_CLASS} .header__back-button {
        color: #edf4ff !important;
      }

      .${DARK_MODE_CLASS} .search-trigger,
      .${DARK_MODE_CLASS} .menu-trigger,
      .${DARK_MODE_CLASS} .user-menu,
      .${DARK_MODE_CLASS} .header__credit-counter {
        background: #1f2c43 !important;
        color: #d6e0f5 !important;
        border-color: #365077 !important;
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

      .${DARK_MODE_CLASS} .menu-item__icon,
      .${DARK_MODE_CLASS} .menu-item__icon::before,
      .${DARK_MODE_CLASS} .icon-chevron-right,
      .${DARK_MODE_CLASS} .icon-chevron-right::before,
      .${DARK_MODE_CLASS} .icon-chevron-left,
      .${DARK_MODE_CLASS} .icon-chevron-left::before,
      .${DARK_MODE_CLASS} .icon-chevron-bottom,
      .${DARK_MODE_CLASS} .icon-chevron-bottom::before,
      .${DARK_MODE_CLASS} .icon-chevron-up,
      .${DARK_MODE_CLASS} .icon-chevron-up::before,
      .${DARK_MODE_CLASS} [class*="chevron-right"]::before,
      .${DARK_MODE_CLASS} [class*="chevron-left"]::before,
      .${DARK_MODE_CLASS} [class*="chevron-bottom"]::before,
      .${DARK_MODE_CLASS} [class*="chevron-up"]::before {
        color: #cfe0ff !important;
        border-color: #cfe0ff !important;
        opacity: 1 !important;
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
      .${DARK_MODE_CLASS} .mat-mdc-menu-item:hover .menu-item,
      .${DARK_MODE_CLASS} .mat-mdc-menu-item:focus .menu-item,
      .${DARK_MODE_CLASS} .mat-mdc-menu-item:hover .menu-item__icon,
      .${DARK_MODE_CLASS} .mat-mdc-menu-item:focus .menu-item__icon {
        color: #ffffff !important;
      }

      .${DARK_MODE_CLASS} .mat-mdc-menu-item .mat-ripple-element,
      .${DARK_MODE_CLASS} .mat-mdc-menu-item .mat-mdc-menu-ripple {
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
      .${DARK_MODE_CLASS} .list__item--active {
        background-color: #233047 !important;
        color: #f3f7ff !important;
      }

      .${DARK_MODE_CLASS} .list__primary,
      .${DARK_MODE_CLASS} .list__secondary,
      .${DARK_MODE_CLASS} .list__tertiary,
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

      /* Expansion panel hover */
      .${DARK_MODE_CLASS} .mat-expansion-panel-header:hover,
      .${DARK_MODE_CLASS} .mat-expansion-panel-header:focus-visible {
        background: #1e2938 !important;
      }

      .${DARK_MODE_CLASS} .mat-expansion-panel-header::before {
        background: transparent !important;
      }

      /* Primary text / list type */
      .${DARK_MODE_CLASS} .primary-text,
      .${DARK_MODE_CLASS} .list__type {
        color: #7eb8ff !important;
      }

      /* Pie chart / averages */
      .${DARK_MODE_CLASS} .overlay-data,
      .${DARK_MODE_CLASS} .averages__pie-chart__decimal,
      .${DARK_MODE_CLASS} .averages__pie-chart__text,
      .${DARK_MODE_CLASS} .chart-description {
        color: #d0deff !important;
      }

      .${DARK_MODE_CLASS} .credits__count {
        color: #c8d9ff !important;
      }

      .${DARK_MODE_CLASS} .credits__element {
        border-color: #273551 !important;
      }

      .${DARK_MODE_CLASS} .message__last-post-date {
        color: #8295b5 !important;
      }

      /* Empty states */
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

      /* Badge */
      .${DARK_MODE_CLASS} .neptun-badge--background-elements {
        background-color: #253349 !important;
        color: #c0d0f0 !important;
      }

      /* User menu */
      .${DARK_MODE_CLASS} .user-menu__name,
      .${DARK_MODE_CLASS} .user-menu__code,
      .${DARK_MODE_CLASS} .user-menu__training,
      .${DARK_MODE_CLASS} .user-menu__code-training {
        color: #d6e0f5 !important;
      }

      .${DARK_MODE_CLASS} .user-menu {
        align-items: center !important;
        background: var(--nnpu-dark-surface) !important;
      }

      /* Financial widget */
      .${DARK_MODE_CLASS} .finances__debts,
      .${DARK_MODE_CLASS} .finances__debts-total,
      .${DARK_MODE_CLASS} .finances__overdue,
      .${DARK_MODE_CLASS} .finances__overdue-total,
      .${DARK_MODE_CLASS} .finances__other-debts,
      .${DARK_MODE_CLASS} .finances__text {
        color: #c8d9ff !important;
      }

      .${DARK_MODE_CLASS} .scroll__button {
        color: #8ab4f8 !important;
      }

      .${DARK_MODE_CLASS} .navigation-link i.icon-chevron-right,
      .${DARK_MODE_CLASS} .more-button i.icon-chevron-right {
        color: #9dc0ff !important;
        border-color: #9dc0ff !important;
      }

      .${DARK_MODE_CLASS} .widget p,
      .${DARK_MODE_CLASS} .mat-expansion-panel p {
        color: #ccd8ef !important;
      }

      /* Dialog & overlay styling */
      .${DARK_MODE_CLASS} .cdk-overlay-backdrop {
        background: rgba(0, 0, 0, 0.65) !important;
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

      /* Search autocomplete */
      .${DARK_MODE_CLASS} .mat-mdc-autocomplete-panel.search-autocomplete,
      .${DARK_MODE_CLASS} .search-autocomplete {
        background: var(--nnpu-dark-surface) !important;
        border: 1px solid var(--nnpu-dark-surface-border) !important;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45) !important;
      }

      .${DARK_MODE_CLASS} .search-autocomplete .search__caption {
        color: #aecdff !important;
        background: var(--nnpu-dark-surface) !important;
      }

      .${DARK_MODE_CLASS} .search-autocomplete .mat-mdc-option,
      .${DARK_MODE_CLASS} .search-autocomplete .mdc-list-item,
      .${DARK_MODE_CLASS} .search-autocomplete .mdc-list-item__primary-text {
        background: var(--nnpu-dark-surface) !important;
        color: #dbe6ff !important;
      }

      .${DARK_MODE_CLASS} .search-autocomplete .search__option-title {
        color: #e7efff !important;
      }

      .${DARK_MODE_CLASS} .search-autocomplete .search__option-routes,
      .${DARK_MODE_CLASS} .search-autocomplete .search__option-route-item {
        color: #9cb4db !important;
      }

      .${DARK_MODE_CLASS} .search-autocomplete .mat-mdc-option:hover,
      .${DARK_MODE_CLASS} .search-autocomplete .mat-mdc-option.mdc-list-item--selected,
      .${DARK_MODE_CLASS} .search-autocomplete .mat-mdc-option.mat-mdc-option-active {
        background: #1e2a3c !important;
      }

      /* FullCalendar (Naptar) dark mode */
      .${DARK_MODE_CLASS} {
        --fc-page-bg-color: #0f1520 !important;
        --fc-neutral-bg-color: #1a2333 !important;
        --fc-neutral-text-color: #a8bedf !important;
        --fc-border-color: #334862 !important;
        --fc-list-event-hover-bg-color: #1f2f47 !important;
        --fc-button-bg-color: #1d2c43 !important;
        --fc-button-border-color: #3b5578 !important;
        --fc-button-hover-bg-color: #274060 !important;
        --fc-button-hover-border-color: #4c6d99 !important;
        --fc-button-active-bg-color: #30517a !important;
        --fc-button-active-border-color: #5e84b8 !important;
        --fc-button-text-color: #e7efff !important;
        --fc-event-bg-color: #6c8fc7 !important;
        --fc-event-border-color: #90add8 !important;
        --fc-event-text-color: #f7fbff !important;
        --fc-today-bg-color: rgba(118, 150, 70, 0.22) !important;
        --fc-now-indicator-color: #8ab7ff !important;
      }

      .${DARK_MODE_CLASS} .fc,
      .${DARK_MODE_CLASS} .fc-theme-standard,
      .${DARK_MODE_CLASS} .fc-scrollgrid,
      .${DARK_MODE_CLASS} .fc-view,
      .${DARK_MODE_CLASS} .fc-daygrid,
      .${DARK_MODE_CLASS} .fc-timegrid,
      .${DARK_MODE_CLASS} .fc-list {
        background: #101826 !important;
        color: #d9e7ff !important;
      }

      .${DARK_MODE_CLASS} .fc-theme-standard td,
      .${DARK_MODE_CLASS} .fc-theme-standard th,
      .${DARK_MODE_CLASS} .fc-scrollgrid,
      .${DARK_MODE_CLASS} .fc-scrollgrid-section > * {
        border-color: #334862 !important;
      }

      .${DARK_MODE_CLASS} .fc-col-header,
      .${DARK_MODE_CLASS} .fc-col-header-cell,
      .${DARK_MODE_CLASS} .fc-timegrid-axis,
      .${DARK_MODE_CLASS} .fc-timegrid-slot-label,
      .${DARK_MODE_CLASS} .fc-list-day-cushion {
        background: #162236 !important;
        color: #c6dcff !important;
      }

      .${DARK_MODE_CLASS} .fc-toolbar-title,
      .${DARK_MODE_CLASS} .fc-col-header-cell-cushion,
      .${DARK_MODE_CLASS} .fc-daygrid-day-number,
      .${DARK_MODE_CLASS} .fc-timegrid-axis-cushion,
      .${DARK_MODE_CLASS} .fc-timegrid-slot-label-cushion {
        color: #ddecff !important;
      }

      .${DARK_MODE_CLASS} .fc-day-other .fc-daygrid-day-number {
        color: #7c96ba !important;
        opacity: 0.9 !important;
      }

      .${DARK_MODE_CLASS} .fc .fc-button,
      .${DARK_MODE_CLASS} .fc .fc-button-primary {
        border-radius: 8px !important;
        font-weight: 700 !important;
        letter-spacing: 0.01em;
        box-shadow: none !important;
      }

      .${DARK_MODE_CLASS} .fc .fc-button:focus,
      .${DARK_MODE_CLASS} .fc .fc-button-primary:focus {
        box-shadow: 0 0 0 2px rgba(138, 183, 255, 0.35) !important;
      }

      .${DARK_MODE_CLASS} .fc .fc-timegrid-slot,
      .${DARK_MODE_CLASS} .fc .fc-daygrid-day-frame,
      .${DARK_MODE_CLASS} .fc .fc-timegrid-col-frame {
        background: #101826 !important;
      }

      .${DARK_MODE_CLASS} .fc .fc-timegrid-slot-minor {
        border-top-color: #22344d !important;
      }

      .${DARK_MODE_CLASS} .fc .fc-non-business {
        background: rgba(88, 108, 134, 0.18) !important;
      }

      .${DARK_MODE_CLASS} .fc .fc-day-today,
      .${DARK_MODE_CLASS} .fc .fc-timegrid-col.fc-day-today {
        background: rgba(108, 130, 58, 0.22) !important;
      }

      .${DARK_MODE_CLASS} .fc .fc-h-event,
      .${DARK_MODE_CLASS} .fc .fc-v-event,
      .${DARK_MODE_CLASS} .fc .fc-daygrid-event,
      .${DARK_MODE_CLASS} .fc .fc-timegrid-event {
        background: linear-gradient(180deg, #6f93ca, #5d80b4) !important;
        border-color: #9ab6df !important;
        color: #f8fbff !important;
        border-radius: 8px !important;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.26) !important;
      }

      .${DARK_MODE_CLASS} .fc .fc-event-main,
      .${DARK_MODE_CLASS} .fc .fc-event-title,
      .${DARK_MODE_CLASS} .fc .fc-event-time,
      .${DARK_MODE_CLASS} .fc .fc-list-event-title,
      .${DARK_MODE_CLASS} .fc .fc-list-event-time {
        color: #f8fbff !important;
      }

      .${DARK_MODE_CLASS} .fc .fc-daygrid-dot-event {
        background: rgba(128, 165, 216, 0.2) !important;
        border-radius: 6px !important;
      }

      .${DARK_MODE_CLASS} .fc .fc-daygrid-dot-event:hover,
      .${DARK_MODE_CLASS} .fc .fc-daygrid-event:hover,
      .${DARK_MODE_CLASS} .fc .fc-timegrid-event:hover {
        filter: brightness(1.07);
      }

      .${DARK_MODE_CLASS} .fc .fc-more-popover,
      .${DARK_MODE_CLASS} .fc .fc-popover,
      .${DARK_MODE_CLASS} .fc .fc-popover-header {
        background: #182438 !important;
        color: #dbe6ff !important;
        border-color: #355074 !important;
      }

      .${DARK_MODE_CLASS} .fc .fc-list,
      .${DARK_MODE_CLASS} .fc .fc-list-table,
      .${DARK_MODE_CLASS} .fc .fc-list-event td {
        background: #101826 !important;
        color: #d9e7ff !important;
        border-color: #334862 !important;
      }

      .${DARK_MODE_CLASS} .fc .fc-list-event:hover td {
        background: #1f2f47 !important;
      }

      .${DARK_MODE_CLASS} .fc .fc-timegrid-now-indicator-line {
        border-top-color: #8ab7ff !important;
        box-shadow: 0 0 10px rgba(138, 183, 255, 0.5);
      }

      .${DARK_MODE_CLASS} .fc .fc-timegrid-now-indicator-arrow {
        border-color: #8ab7ff !important;
      }

      .${DARK_MODE_CLASS} .fc .fc-scrollgrid-section-sticky > * {
        background: #162236 !important;
      }

      .${DARK_MODE_CLASS} .fc .fc-icon,
      .${DARK_MODE_CLASS} .fc .fc-icon::before {
        color: #d7e8ff !important;
      }

      /* Calendar page shell (outside FullCalendar itself) */
      .${DARK_MODE_CLASS} .calendar-body,
      .${DARK_MODE_CLASS} .calendar-body__container,
      .${DARK_MODE_CLASS} .calendar-module-toolbar,
      .${DARK_MODE_CLASS} .weekly-view-toolbar,
      .${DARK_MODE_CLASS} .toolbar,
      .${DARK_MODE_CLASS} .toolbar__content,
      .${DARK_MODE_CLASS} .header-buttons,
      .${DARK_MODE_CLASS} .header-buttons__download,
      .${DARK_MODE_CLASS} .calendar-filter-menu,
      .${DARK_MODE_CLASS} .header-buttons__view-menu {
        background: #121b2a !important;
        color: #dbe6ff !important;
      }

      .${DARK_MODE_CLASS} .toolbar,
      .${DARK_MODE_CLASS} .calendar-module-toolbar,
      .${DARK_MODE_CLASS} .weekly-view-toolbar {
        border: 1px solid #304461 !important;
        border-radius: 10px !important;
      }

      .${DARK_MODE_CLASS} .toolbar__navigation,
      .${DARK_MODE_CLASS} .toolbar__navigation.black,
      .${DARK_MODE_CLASS} #toolbar-actual-date-btn,
      .${DARK_MODE_CLASS} #open-calendar-download-menu-btn,
      .${DARK_MODE_CLASS} #open-calendar-filter-menu-btn,
      .${DARK_MODE_CLASS} #open-calendar-view-type-menu-btn {
        background: #1c2a40 !important;
        border-color: #3a5579 !important;
        color: #e7efff !important;
        border-radius: 8px !important;
      }

      .${DARK_MODE_CLASS} .toolbar__navigation:hover,
      .${DARK_MODE_CLASS} #toolbar-actual-date-btn:hover,
      .${DARK_MODE_CLASS} #open-calendar-download-menu-btn:hover,
      .${DARK_MODE_CLASS} #open-calendar-filter-menu-btn:hover,
      .${DARK_MODE_CLASS} #open-calendar-view-type-menu-btn:hover {
        background: #264160 !important;
        border-color: #4c6d99 !important;
      }

      .${DARK_MODE_CLASS} .toolbar__navigation .neptun-button__prefix-icon,
      .${DARK_MODE_CLASS} .toolbar__navigation .neptun-button__postfix-icon,
      .${DARK_MODE_CLASS} .header-buttons .neptun-button__prefix-icon,
      .${DARK_MODE_CLASS} .header-buttons .neptun-button__postfix-icon,
      .${DARK_MODE_CLASS} .header-buttons .neptun-button__label,
      .${DARK_MODE_CLASS} .header-buttons__download-text,
      .${DARK_MODE_CLASS} .calendar-filter-menu__label,
      .${DARK_MODE_CLASS} .toolbar h4 {
        color: #e7efff !important;
      }

      /* Calendar page title + breadcrumb title */
      .${DARK_MODE_CLASS} neptun-primary-title .main-wrapper,
      .${DARK_MODE_CLASS} neptun-primary-title .title-wrapper,
      .${DARK_MODE_CLASS} neptun-primary-title .title-wrapper h1,
      .${DARK_MODE_CLASS} .breadcrumb__item,
      .${DARK_MODE_CLASS} #breadcrumb__btn-0 {
        color: #eaf2ff !important;
      }

      .${DARK_MODE_CLASS} neptun-primary-title .title-wrapper__description {
        color: #b9cbe8 !important;
      }

      /* Calendar legend (bottom pills/chips) */
      .${DARK_MODE_CLASS} .calendar-legend,
      .${DARK_MODE_CLASS} .calendar-legend .legend,
      .${DARK_MODE_CLASS} .timetable-planner__legend,
      .${DARK_MODE_CLASS} .timetable-planner__legend .legend {
        background: #172234 !important;
        border-color: #355074 !important;
      }

      .${DARK_MODE_CLASS} .calendar-legend .legend__item,
      .${DARK_MODE_CLASS} .timetable-planner__legend .legend__item,
      .${DARK_MODE_CLASS} .calendar-legend .legend__item span,
      .${DARK_MODE_CLASS} .timetable-planner__legend .legend__item span {
        color: #deebff !important;
      }

      .${DARK_MODE_CLASS} .calendar-legend .legend__blob,
      .${DARK_MODE_CLASS} .timetable-planner__legend .legend__blob {
        box-shadow: 0 0 0 1px rgba(210, 225, 255, 0.2) !important;
      }

      /* Cards below calendar */
      .${DARK_MODE_CLASS} neptun-navigation-button.link,
      .${DARK_MODE_CLASS} .link-item,
      .${DARK_MODE_CLASS} .link-item__container,
      .${DARK_MODE_CLASS} .link-item__leading,
      .${DARK_MODE_CLASS} .link-item__main,
      .${DARK_MODE_CLASS} .link-item__trailing {
        background: #172234 !important;
        border-color: #324a6b !important;
        color: #dce8ff !important;
      }

      .${DARK_MODE_CLASS} .link-item__container {
        border: 1px solid #324a6b !important;
        border-radius: 10px !important;
      }

      .${DARK_MODE_CLASS} .link-item__container:hover,
      .${DARK_MODE_CLASS} .link-item:hover .link-item__container {
        background: #21324b !important;
        border-color: #4a6a95 !important;
      }

      .${DARK_MODE_CLASS} .link-item__title,
      .${DARK_MODE_CLASS} .link-item__description,
      .${DARK_MODE_CLASS} .link-item__icon,
      .${DARK_MODE_CLASS} .link-item__icon::before {
        color: #deebff !important;
      }

      .${DARK_MODE_CLASS} .link-item__badge.neptun-badge--warning {
        background: #f0a93c !important;
        color: #1b1305 !important;
      }

      /* Chevron icons */
      .${DARK_MODE_CLASS} i[class*="chevron-right"],
      .${DARK_MODE_CLASS} i[class*="arrow-right"],
      .${DARK_MODE_CLASS} .menu-item__icon.icon-chevron-right {
        color: #bfd6ff !important;
        border-color: #bfd6ff !important;
      }
    `, "nnpu-dashboard-dark-style");
  }

  // Re-run init hooks when Angular navigates without a full page reload.
  let spaRouteWatcherInitialized = false;
  function ensureSpaRouteWatcher() {
    if (spaRouteWatcherInitialized) return;
    spaRouteWatcherInitialized = true;

    let lastUrl = window.location.pathname + window.location.search + window.location.hash;
    const onRouteChange = () => {
      const currentUrl = window.location.pathname + window.location.search + window.location.hash;
      if (currentUrl === lastUrl) return;
      lastUrl = currentUrl;
      initLogin();
      initDashboard();
    };

    const wrapHistoryMethod = (method) => {
      const original = window.history[method];
      window.history[method] = function (...args) {
        const result = original.apply(this, args);
        setTimeout(onRouteChange, 0);
        return result;
      };
    };

    wrapHistoryMethod("pushState");
    wrapHistoryMethod("replaceState");
    window.addEventListener("popstate", onRouteChange);
    window.addEventListener("hashchange", onRouteChange);
  }

  // ── Initialization ────────────────────────────────────────────────────────

  function initLogin() {
    if (!isAngularLoginPage()) return;

    applyInitialDarkModeClass();
    injectEarlyDarkPreloadStyle();
    injectToggleStyles();
    injectLoginDarkStyles();

    waitForAnyElement([
      "div.login__header",
      "header .header__right",
      "header .header__left",
    ]).then(() => {
      mountToggle();
      ensureToggleWatcher();
    });
  }

  function initDashboard() {
    if (isAngularLoginPage() || !isAngularHallgatoiPage()) return;

    applyInitialDarkModeClass();
    injectEarlyDarkPreloadStyle();
    injectToggleStyles();
    injectDashboardDarkStyles();
    mountToggle();
    ensureToggleWatcher();
  }

  function main() {
    if (!isLikelyNeptunHost()) return;
    if (!isAngularHallgatoiPage()) return;

    console.log(`[NNPU] Content script loaded — v${NNPU_VERSION}`);
    ensureSpaRouteWatcher();

    if (document.readyState === "loading") {
      document.addEventListener(
        "DOMContentLoaded",
        () => {
          initLogin();
          initDashboard();
        },
        { once: true }
      );
    } else {
      initLogin();
      initDashboard();
    }
  }

  main();
})();
