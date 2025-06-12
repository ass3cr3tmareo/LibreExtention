console.log("LibreTranslate extension: background.js loaded and reset.");

// All previous content has been removed as part of the project restart.
// New background service worker functionality will be built here.

// Example: Listen for installation event
chrome.runtime.onInstalled.addListener(() => {
  console.log("LibreTranslate extension installed (or updated) - background.js reset.");
});