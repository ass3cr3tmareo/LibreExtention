document.addEventListener('DOMContentLoaded', function() {
  // Load saved settings
  chrome.storage.sync.get(['targetLang', 'apiUrl', 'apiKey', 'autoTranslate'], function(items) {
    if (items.targetLang) document.getElementById('targetLang').value = items.targetLang;
    if (items.apiUrl) document.getElementById('apiUrl').value = items.apiUrl;
    if (items.apiKey) document.getElementById('apiKey').value = items.apiKey;
    if (items.autoTranslate) document.getElementById('autoTranslate').checked = items.autoTranslate;
  });

  // Save settings when changed
  document.getElementById('targetLang').addEventListener('change', saveSettings);
  document.getElementById('apiUrl').addEventListener('change', saveSettings);
  document.getElementById('apiKey').addEventListener('change', saveSettings);
  document.getElementById('autoTranslate').addEventListener('change', saveSettings);

  // Translate page button
  document.getElementById('translatePage').addEventListener('click', function() {
    const settings = getSettings();
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'translatePage',
        settings: settings
      });
    });
  });

  // Translate selection button
  document.getElementById('translateSelection').addEventListener('click', function() {
    const settings = getSettings();
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'translateSelection',
        settings: settings
      });
    });
  });
});

function saveSettings() {
  const settings = getSettings();
  chrome.storage.sync.set(settings, function() {
    showStatus('Settings saved', 'success');
  });
}

function getSettings() {
  return {
    targetLang: document.getElementById('targetLang').value,
    apiUrl: document.getElementById('apiUrl').value,
    apiKey: document.getElementById('apiKey').value,
    autoTranslate: document.getElementById('autoTranslate').checked
  };
}

function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = 'status ' + type;
  setTimeout(() => {
    status.textContent = '';
    status.className = 'status';
  }, 3000);
} 