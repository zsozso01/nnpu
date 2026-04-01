const utils = require("../utils");

const DARK_MODE_CLASS = "nnpu-dark-mode";
const FOOTER_FLAG_ATTR = "data-nnpu-footer-active";
const THEME_KEY = "nnpu-theme";
const TOGGLE_ID = "nnpu-theme-toggle";
let toggleWatcher = null;

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

function ensureInitialDarkModeClass() {
  const shouldUseDarkMode = getInitialDarkModeState();
  if (!document.body) {
    return;
  }
  document.body.classList.toggle(DARK_MODE_CLASS, shouldUseDarkMode);
}

function mountToggle() {
  if (!document.body || document.getElementById(TOGGLE_ID)) {
    return;
  }

  const toggleButton = document.createElement("button");
  toggleButton.id = TOGGLE_ID;
  toggleButton.type = "button";
  toggleButton.classList.add("nnpu-theme-toggle-floating");
  toggleButton.title = "NNPU tema valtas";

  toggleButton.addEventListener("click", () => {
    const darkModeEnabled = document.body && document.body.classList.contains(DARK_MODE_CLASS);
    setDarkModeState(!darkModeEnabled, true);
  });

  document.body.appendChild(toggleButton);
  setDarkModeState(document.body.classList.contains(DARK_MODE_CLASS), false);
}

function ensureToggleWatcher() {
  if (toggleWatcher) {
    return;
  }

  toggleWatcher = new MutationObserver(() => {
    if (document.getElementById(TOGGLE_ID)) {
      return;
    }
    mountToggle();
  });

  toggleWatcher.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

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

function isAngularLoginPage() {
  const normalizedPath = window.location.pathname.replace(/\/+$/, "") || "/";
  return normalizedPath === "/hallgatoi" || normalizedPath === "/hallgatoi/login";
}

function ensureFooterStatus() {
  const footerVersion = document.querySelector(".footer__version");
  if (!footerVersion || footerVersion.getAttribute(FOOTER_FLAG_ATTR) === "1") {
    return;
  }

  footerVersion.textContent = `${footerVersion.textContent.trim()} | NNPU aktiv v${getScriptVersion()}`;
  footerVersion.setAttribute(FOOTER_FLAG_ATTR, "1");
}

function injectDashboardStyles() {
  utils.injectCss(`
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
      background: var(--nnpu-dark-surface) !important;
      color: #e8eefc !important;
      box-shadow: none !important;
    }

    .${DARK_MODE_CLASS} .header__left,
    .${DARK_MODE_CLASS} .header__title {
      background: var(--nnpu-dark-surface) !important;
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
      background: var(--nnpu-dark-surface) !important;
      box-shadow: none !important;
    }

    .${DARK_MODE_CLASS} .header__container,
    .${DARK_MODE_CLASS} .header__left,
    .${DARK_MODE_CLASS} .header__right {
      box-shadow: none !important;
    }

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
      background: var(--nnpu-dark-surface) !important;
      color: #d6e0f5 !important;
      border-color: var(--nnpu-dark-surface-border) !important;
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

    .${DARK_MODE_CLASS} .mat-mdc-autocomplete-panel.search-autocomplete,
    .${DARK_MODE_CLASS} .mat-mdc-autocomplete-panel.search-autocomplete.mdc-menu-surface,
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
    .${DARK_MODE_CLASS} .search-autocomplete .mat-mdc-option.mat-mdc-option-active,
    .${DARK_MODE_CLASS} .search-autocomplete .mat-mdc-option.mdc-list-item--focused {
      background: #1e2a3c !important;
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

    .${DARK_MODE_CLASS} .user-menu {
      align-items: center !important;
      background: var(--nnpu-dark-surface) !important;
    }

    .${DARK_MODE_CLASS} #user-menu-mobile,
    .${DARK_MODE_CLASS} .user-menu--mobile {
      display: none !important;
    }

    @media only screen and (max-width: 767px) {
      .${DARK_MODE_CLASS} #user-menu-mobile,
      .${DARK_MODE_CLASS} .user-menu--mobile {
        display: flex !important;
      }

      .${DARK_MODE_CLASS} #main-header-right > .user-menu:not(.user-menu--mobile) {
        display: none !important;
      }
    }

    .${DARK_MODE_CLASS} .user-menu__block {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      gap: 2px;
      min-width: 0;
      flex: 1 1 auto;
    }

    .${DARK_MODE_CLASS} .user-menu__user-data {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      line-height: 1.25;
      gap: 4px;
      min-width: 0;
      overflow: hidden;
    }

    .${DARK_MODE_CLASS} .user-menu__name,
    .${DARK_MODE_CLASS} .user-menu__code,
    .${DARK_MODE_CLASS} .user-menu__training {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 220px;
    }

    .${DARK_MODE_CLASS} .user-menu__training {
      display: none !important;
    }

    .${DARK_MODE_CLASS} .user-menu__block > .user-menu__training.ng-star-inserted {
      display: none !important;
    }

    .${DARK_MODE_CLASS} .user-menu__code-training {
      display: inline !important;
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

module.exports = {
  shouldActivate: () => isAngularHallgatoiPage(),
  runOutsideNeptun: false,
  initialize: () => {
    ensureInitialDarkModeClass();
    injectDashboardStyles();
    mountToggle();
    ensureToggleWatcher();

    new MutationObserver(() => {
      ensureFooterStatus();
    }).observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  },
};
