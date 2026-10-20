# NNPU — Manifest V3 Migration Tracker

## Architecture & Setup
- [x] Initialize MV3 architecture (`manifest.json`, `background.js`, `content.js`).
- [x] Purge all legacy userscript metadata and obsolete features.

## Feature Porting
- [x] Port the Angular SPA DOM loading/waiting logic.
- [x] Port the Dark Mode login feature and CSS injections.

## Documentation
- [x] Update `README.md` to reflect the MV3 clean slate while retaining original credits.

## Future Work
- [ ] **Future:** Implement Main World Injection for 2FA/Auto-login bypass.
- [ ] **Future:** Implement Background Service Worker for `GetNewTokens` keep-alive.
- [ ] **Future:** Automate 1-click subject registration via API loop.
