// Create context menu items
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'translateSelection',
    title: 'Translate Selection',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'translatePage',
    title: 'Translate Page',
    contexts: ['page']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'translateSelection') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'translateSelection',
      settings: {
        targetLang: 'en', // Default to English
        apiUrl: 'https://libretranslate.de'
      }
    });
  } else if (info.menuItemId === 'translatePage') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'translatePage',
      settings: {
        targetLang: 'en', // Default to English
        apiUrl: 'https://libretranslate.de'
      }
    });
  }
}); 