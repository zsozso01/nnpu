// NNPU Background Service Worker (Manifest V3)
// Future: GetNewTokens keep-alive, session management, API orchestration.

chrome.runtime.onInstalled.addListener(() => {
  console.log("[NNPU] Background service worker initialized — v2.6.1");
});
