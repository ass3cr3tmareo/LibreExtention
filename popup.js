// Default API URL
const DEFAULT_API_URL = 'https://libretranslate.de';

// DOM Elements
let targetLangSelect;
let apiUrlInput;
let apiKeyInput;
let statusMessageDiv;
// let translatePageButton; // For when page translation is re-implemented

// Function to display status messages
function showStatus(message, type = 'success', duration = 2000) {
  if (!statusMessageDiv) statusMessageDiv = document.getElementById('statusMessage');
  if (statusMessageDiv) {
    statusMessageDiv.textContent = message;
    statusMessageDiv.className = `status ${type}`; // Ensure base class + type
    statusMessageDiv.style.display = 'block'; // Make it visible

    setTimeout(() => {
      statusMessageDiv.textContent = '';
      statusMessageDiv.style.display = 'none'; // Hide it again
      statusMessageDiv.className = 'status'; // Reset class
    }, duration);
  } else {
    console.log(`Status (${type}): ${message}`);
  }
}

// Load settings from storage
function loadSettings() {
  chrome.storage.sync.get(['targetLang', 'apiUrl', 'apiKey'], (items) => {
    if (targetLangSelect && items.targetLang) {
      targetLangSelect.value = items.targetLang;
    }
    if (apiUrlInput) {
      apiUrlInput.value = items.apiUrl || DEFAULT_API_URL;
    }
    if (apiKeyInput && items.apiKey) {
      apiKeyInput.value = items.apiKey;
    }
  });
}

// Save settings to storage
function saveSettings() {
  const settings = {
    targetLang: targetLangSelect ? targetLangSelect.value : 'en',
    apiUrl: apiUrlInput ? apiUrlInput.value.trim() : DEFAULT_API_URL,
    apiKey: apiKeyInput ? apiKeyInput.value.trim() : '',
  };

  // Basic validation for API URL
  if (settings.apiUrl === '') {
    showStatus('API URL cannot be empty.', 'error', 3000);
    apiUrlInput.value = DEFAULT_API_URL; // Reset to default or previous valid
    settings.apiUrl = DEFAULT_API_URL; // Ensure settings object reflects this
    // return; // Optionally prevent saving if invalid, or save default
  } else {
    try {
      new URL(settings.apiUrl); // Validate URL format
    } catch (e) {
      showStatus('Invalid API URL format.', 'error', 3000);
      // return; // Optionally prevent saving
    }
  }


  chrome.storage.sync.set(settings, () => {
    showStatus('Settings saved!', 'success');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize DOM element variables
  targetLangSelect = document.getElementById('targetLang');
  apiUrlInput = document.getElementById('apiUrl');
  apiKeyInput = document.getElementById('apiKey');
  statusMessageDiv = document.getElementById('statusMessage');
  // translatePageButton = document.getElementById('translatePageButton');

  // Load saved settings
  loadSettings();

  // Add event listeners to save settings on change
  if (targetLangSelect) {
    targetLangSelect.addEventListener('change', saveSettings);
  }
  if (apiUrlInput) {
    apiUrlInput.addEventListener('change', saveSettings);
    apiUrlInput.addEventListener('blur', saveSettings); // Also save on blur for text inputs
  }
  if (apiKeyInput) {
    apiKeyInput.addEventListener('change', saveSettings);
    apiKeyInput.addEventListener('blur', saveSettings); // Also save on blur
  }

  // TODO: Event listener for translatePageButton when functionality is added
  // if (translatePageButton) {
  //   translatePageButton.addEventListener('click', () => {
  //     // Logic for page translation will go here
  //     console.log("Translate Page button clicked - functionality to be implemented.");
  //   });
  // }

  console.log("LibreTranslate popup initialized.");
});