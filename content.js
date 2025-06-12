let translationOverlay = null;
let isTranslating = false;
let originalStyles = new Map();
let injectedStyles = null;
let translatedNodes = new Set();
let isRTL = false;
let isAutoTranslatingEnabled = false;
let observerSettings = null; // Added for storing settings for the observer

// RTL languages list
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur', 'yi', 'dv', 'ps'];

// Create and inject our styles only when needed
function injectStyles() {
  if (!injectedStyles) {
    injectedStyles = document.createElement('style');
    injectedStyles.textContent = `
      .translation-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 2147483647;
        display: none;
      }

      .translation-popup {
        position: absolute;
        background: white;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        max-width: 300px;
        z-index: 2147483647;
      }

      .translation-popup .close {
        position: absolute;
        top: 5px;
        right: 5px;
        cursor: pointer;
        font-size: 18px;
        color: #666;
      }

      .translation-popup .content {
        margin-top: 10px;
        font-size: 14px;
        line-height: 1.4;
      }

      .translation-loading {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        text-align: center;
        z-index: 2147483647;
      }

      .loading-spinner {
        width: 40px;
        height: 40px;
        margin: 0 auto 10px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #4CAF50;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      .loading-text {
        font-size: 16px;
        color: #333;
        margin-bottom: 5px;
      }

      .loading-progress {
        font-size: 14px;
        color: #666;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .translation-complete,
      .translation-error {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        text-align: center;
        z-index: 2147483647;
        font-size: 16px;
      }

      .translation-complete {
        color: #2e7d32;
      }

      .translation-error {
        color: #c62828;
      }

      [data-translated="true"] {
        direction: rtl;
        text-align: right;
      }
    `;
    document.head.appendChild(injectedStyles);
  }
}

// Remove injected styles
function removeStyles() {
  if (injectedStyles) {
    injectedStyles.remove();
    injectedStyles = null;
  }
}

// Create translation overlay
function createTranslationOverlay() {
  if (!translationOverlay) {
    translationOverlay = document.createElement('div');
    translationOverlay.className = 'translation-overlay';
    document.body.appendChild(translationOverlay);
  }
  return translationOverlay;
}

// Create loading indicator
function createLoadingIndicator() {
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'translation-loading';
  loadingDiv.innerHTML = `
    <div class="loading-spinner"></div>
    <div class="loading-text">Translating...</div>
    <div class="loading-progress">0%</div>
  `;
  return loadingDiv;
}

// Create translation popup
function createTranslationPopup(text, x, y, settings) {
  const popup = document.createElement('div');
  popup.className = 'translation-popup';
  popup.style.left = `${x}px`;
  popup.style.top = `${y}px`;

  const closeButton = document.createElement('span');
  closeButton.className = 'close';
  closeButton.textContent = '×';
  closeButton.onclick = () => popup.remove();

  const content = document.createElement('div');
  content.className = 'content';
  content.textContent = text;

  // Determine RTL based on current settings for this specific popup
  if (settings && RTL_LANGUAGES.includes(settings.targetLang)) {
    content.style.direction = 'rtl';
    content.style.textAlign = 'right';
  }

  popup.appendChild(closeButton);
  popup.appendChild(content);
  return popup;
}

// Save original styles
function saveOriginalStyles(element) {
  const styles = window.getComputedStyle(element);
  const importantStyles = {
    width: styles.width,
    height: styles.height,
    position: styles.position,
    display: styles.display,
    margin: styles.margin,
    padding: styles.padding,
    'box-sizing': styles.boxSizing,
    'font-size': styles.fontSize,
    'line-height': styles.lineHeight,
    'max-width': styles.maxWidth,
    'min-width': styles.minWidth,
    'max-height': styles.maxHeight,
    'min-height': styles.minHeight,
    'text-align': styles.textAlign,
    'direction': styles.direction
  };
  originalStyles.set(element, importantStyles);
}

// Restore original styles
function restoreOriginalStyles(element) {
  const styles = originalStyles.get(element);
  if (styles) {
    Object.entries(styles).forEach(([property, value]) => {
      if (value !== 'none' && value !== 'auto') {
        element.style[property] = value;
      }
    });
  }
}

// Clean up translation elements
function cleanupTranslation() {
  if (translationOverlay) {
    translationOverlay.remove();
    translationOverlay = null;
  }
  removeStyles();
  originalStyles.clear();
  translatedNodes.clear();
}

// Apply RTL styles to element
// Takes a boolean isLanguageRTL to determine if RTL styles should be applied.
function applyRTLStyles(element, isLanguageRTL) {
  if (isLanguageRTL) {
    element.setAttribute('data-translated', 'true');
    // Ensure existing styles are not overwritten if they are more specific
    // by checking before setting.
    if (element.style.direction !== 'rtl') {
      element.style.direction = 'rtl';
    }
    if (element.style.textAlign !== 'right') {
      element.style.textAlign = 'right';
    }
  }
}

// Translate text using LibreTranslate API with retry logic
async function translateText(text, settings, retryCount = 3) {
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      if (!settings.apiUrl) {
        throw new Error('API URL is not configured');
      }

      const apiUrl = settings.apiUrl.endsWith('/translate') 
        ? settings.apiUrl 
        : `${settings.apiUrl}/translate`;

      console.log('Translating text:', text);
      console.log('Using API URL:', apiUrl);
      console.log('Target language:', settings.targetLang);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(settings.apiKey && { 'Authorization': `Bearer ${settings.apiKey}` })
        },
        body: JSON.stringify({
          q: text,
          source: 'auto',
          target: settings.targetLang
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let specificMessage = errorData.error || `HTTP error! Status: ${response.status}`;
        if (response.status === 401) {
          specificMessage = "Authentication failed. Please check your API key if you're using one, and ensure your API URL is correct.";
        } else if (response.status === 403) {
          specificMessage = "Forbidden. You may not have permission to access this LibreTranslate instance or the API key is invalid/required.";
        } else if (response.status === 400) {
          specificMessage = "Invalid request. This might be due to an unsupported language code or invalid input text. Please check your settings and selection.";
        } else if (response.status === 429) {
          specificMessage = "Too many requests. Please try again later.";
        } else if (response.status === 500) {
          specificMessage = `LibreTranslate server error (Status: ${response.status}). Please try again later or check the server status.`;
        } else if (response.status > 500) { // Catch-all for other 5xx errors
          specificMessage = `LibreTranslate server error (Status: ${response.status}). Please try again later.`;
        }
        throw new Error(specificMessage);
      }

      const data = await response.json();
      if (!data.translatedText) {
        // This case might occur if the API returns 200 OK but an empty/invalid JSON structure for translatedText
        throw new Error('Invalid response from translation service: No translated text found.');
      }

      console.log('Translation successful:', data.translatedText);
      return data.translatedText;
    } catch (error) {
      console.error(`Translation attempt ${attempt} failed:`, error.message); // Log only message for brevity
      
      if (attempt === retryCount) {
        let detailedError = error.message;
        if (error.message.toLowerCase().includes('failed to fetch')) {
            detailedError = `Network error: Could not connect to the LibreTranslate server (${settings.apiUrl || 'URL not set'}). Please check your internet connection and the API URL in settings.`;
        } else if (error.message.includes('API URL is not configured')) {
            detailedError = "API URL is not configured. Please set it in the extension settings.";
        }
        // For other errors, error.message should already be specific from the block above.
        throw new Error(detailedError);
      }
      
      await delay(Math.min(1000 * Math.pow(2, attempt - 1), 5000)); // Backoff delay
    }
  }
}

// Translate selected text
async function translateSelection(settings) {
  if (isTranslating) return;
  isTranslating = true;

  const selection = window.getSelection();
  if (!selection.toString().trim()) {
    isTranslating = false;
    return;
  }

  injectStyles();
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  try {
    const loadingIndicator = createLoadingIndicator();
    const overlay = createTranslationOverlay();
    overlay.appendChild(loadingIndicator);
    overlay.style.display = 'block';

    const translatedText = await translateText(selection.toString(), settings);
    
    overlay.innerHTML = '';
    const popup = createTranslationPopup(
      translatedText,
      rect.left + window.scrollX,
      rect.bottom + window.scrollY + 10,
      settings // Pass settings to createTranslationPopup
    );
    overlay.appendChild(popup);
  } catch (error) {
    console.error('Translation failed:', error);
    const overlay = createTranslationOverlay();
    overlay.innerHTML = `
      <div class="translation-error">
        ${error.message}
      </div>`;
    overlay.style.display = 'block';
  } finally {
    isTranslating = false;
  }
}

// Translate a single node
async function translateNode(node, settings) {
  if (!node.textContent.trim() || translatedNodes.has(node)) {
    return;
  }

  try {
    const translatedText = await translateText(node.textContent, settings);
    node.textContent = translatedText;
    translatedNodes.add(node);
    
    const parent = node.parentElement;
    if (parent) {
      const currentIsRTL = RTL_LANGUAGES.includes(settings.targetLang);
      if (currentIsRTL) {
        applyRTLStyles(parent, true);
      }
    }
  } catch (error) {
    console.error('Translation failed for node:', error);
  }
}

// Translate entire page
async function translatePage(settings) {
  if (isTranslating) return;
  isTranslating = true;

  isRTL = RTL_LANGUAGES.includes(settings.targetLang);
  injectStyles();
  
  const textNodes = [];
  const walk = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  let node;
  while (node = walk.nextNode()) {
    if (node.textContent.trim() && 
        !node.parentElement.closest('script') && 
        !node.parentElement.closest('style') &&
        !node.parentElement.closest('noscript')) {
      textNodes.push(node);
    }
  }

  const totalNodes = textNodes.length;
  let processedNodes = 0;
  let failedNodes = 0;

  const loadingIndicator = createLoadingIndicator();
  const overlay = createTranslationOverlay();
  overlay.appendChild(loadingIndicator);
  overlay.style.display = 'block';

  textNodes.forEach(node => {
    const parent = node.parentElement;
    if (parent) {
      saveOriginalStyles(parent);
    }
  });

  try {
    const batchSize = 5;
    for (let i = 0; i < textNodes.length; i += batchSize) {
      const batch = textNodes.slice(i, i + batchSize);
      await Promise.all(batch.map(async (node) => {
        try {
          await translateNode(node, settings);
        } catch (error) {
          console.error('Translation failed for node:', error);
          failedNodes++;
        }
        processedNodes++;
        const progress = Math.round((processedNodes / totalNodes) * 100);
        const progressText = overlay.querySelector('.loading-progress');
        if (progressText) {
          progressText.textContent = `(${processedNodes}/${totalNodes}) ${progress}% (${failedNodes} failed)`;
        }
      }));

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const message = failedNodes > 0
      ? `Translation completed with ${failedNodes} errors.`
      : 'Translation completed successfully!';
    overlay.innerHTML = `<div class="translation-complete">${message}</div>`;
    setTimeout(() => {
      cleanupTranslation();
    }, 2000);
  } catch (error) {
    console.error('Translation failed:', error);
    overlay.innerHTML = `
      <div class="translation-error">
        ${error.message}
      </div>`;
  } finally {
    isTranslating = false;
  }
}

// Set up mutation observer for dynamic content
let observer = null;

function setupObserver(settings) {
  observerSettings = settings; // Store settings for the observer callback
  if (observer) {
    observer.disconnect();
  }

  observer = new MutationObserver((mutations) => {
    if (!observerSettings) {
      console.warn("Observer callback running without settings, skipping translation.");
      return;
    }
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() && !translatedNodes.has(node)) {
            if (node.parentElement && !node.parentElement.closest('script') && !node.parentElement.closest('style')) {
              translateNode(node, observerSettings);
            }
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            // Avoid processing elements if they themselves or their parents are already marked as translated (e.g. by RTL styles)
            if (node.closest('[data-translated="true"]')) return;

            const walk = document.createTreeWalker(
              node,
              NodeFilter.SHOW_TEXT,
              null,
              false
            );
            let textNode;
            while (textNode = walk.nextNode()) {
              if (textNode.textContent.trim() && !translatedNodes.has(textNode)) {
                 if (textNode.parentElement && !textNode.parentElement.closest('script') && !textNode.parentElement.closest('style')) {
                  translateNode(textNode, observerSettings);
                }
              }
            }
          }
        });
      } else if (mutation.type === 'attributes') {
        if (mutation.target.nodeType === Node.ELEMENT_NODE) {
          // Avoid re-translating an element that caused the mutation if it's already processed or part of a translated tree.
          // However, its children might have changed or become visible.
          // if (translatedNodes.has(mutation.target) || mutation.target.closest('[data-translated="true"]')) return;

          const style = window.getComputedStyle(mutation.target);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            return; // Don't process children of hidden elements
          }

          // If an attribute change made a container visible, check its text node children
          const walk = document.createTreeWalker(
            mutation.target,
            NodeFilter.SHOW_TEXT,
            null,
            false
          );
          let textNode;
          while (textNode = walk.nextNode()) {
            if (textNode.textContent.trim() && !translatedNodes.has(textNode)) {
              if (textNode.parentElement &&
                  !textNode.parentElement.closest('script') &&
                  !textNode.parentElement.closest('style') &&
                  !textNode.parentElement.closest('[data-translated="true"]')) { // Don't re-translate if parent is already done
                translateNode(textNode, observerSettings);
              }
            }
          }
        }
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    // attributeFilter: ['class', 'style'] // Consider if performance is an issue
  });
}

// Load initial autoTranslate setting
chrome.storage.sync.get('autoTranslate', (items) => {
  if (items.autoTranslate) {
    isAutoTranslatingEnabled = true;
    console.log('Auto-translation enabled on load');
  }
});

// Listen for changes in settings
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.autoTranslate) {
    isAutoTranslatingEnabled = changes.autoTranslate.newValue;
    console.log('Auto-translation setting changed to:', isAutoTranslatingEnabled);
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request);
  if (request.action === 'translateSelection') {
    translateSelection(request.settings);
  } else if (request.action === 'translatePage') {
    translatePage(request.settings);
    setupObserver(request.settings);
  }
});

// Close translation overlay when clicking outside
document.addEventListener('click', (event) => {
  if (translationOverlay && !event.target.closest('.translation-popup') && !event.target.closest('.auto-translation-popup')) {
    cleanupTranslation();
    // Also remove any auto-translation popups if click is outside
    const autoPopups = document.querySelectorAll('.auto-translation-popup');
    autoPopups.forEach(p => p.remove());
  }
});

// Function to create and show the auto-translation popup
async function showAutoTranslationPopup(selectedText, settings, x, y) {
  // Ensure styles are injected
  injectStyles();

  // Remove any existing auto-translation popups
  const existingPopups = document.querySelectorAll('.auto-translation-popup');
  existingPopups.forEach(p => p.remove());

  const popup = document.createElement('div');
  popup.className = 'translation-popup auto-translation-popup'; // Added new class for specific styling/selection
  popup.style.position = 'absolute'; // Use absolute for positioning near text
  popup.style.left = `${x}px`;
  popup.style.top = `${y}px`;
  // Potentially add a max-width or other styles to differentiate from the main popup

  const closeButton = document.createElement('span');
  closeButton.className = 'close';
  closeButton.textContent = '×';
  closeButton.onclick = () => popup.remove();

  const content = document.createElement('div');
  content.className = 'content';
  content.textContent = 'Translating...'; // Initial text

  popup.appendChild(closeButton);
  popup.appendChild(content);
  document.body.appendChild(popup); // Append to body, not overlay

  try {
    const translatedText = await translateText(selectedText, settings);
    content.textContent = translatedText;
    if (RTL_LANGUAGES.includes(settings.targetLang)) {
      content.style.direction = 'rtl';
      content.style.textAlign = 'right';
    }
  } catch (error) {
    console.error('Auto-translation failed:', error);
    content.textContent = error.message; // Display the more specific error message directly
    // Optionally auto-remove error popups after a delay
    setTimeout(() => popup.remove(), 5000);
  }
}

// Event listener for mouseup to trigger auto-translation
document.addEventListener('mouseup', async (event) => {
  if (isAutoTranslatingEnabled) {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText) {
      // Avoid triggering if interacting with an existing popup
      if (event.target.closest('.translation-popup') || event.target.closest('.auto-translation-popup')) {
        return;
      }

      console.log('Auto-translating selected text:', selectedText);
      // Get settings
      chrome.storage.sync.get(['targetLang', 'apiUrl', 'apiKey'], (settings) => {
        if (!settings.apiUrl) {
          console.warn('API URL not set, cannot auto-translate.');
          // Optionally, inform the user via a small, temporary message near selection
          return;
        }
        const currentSettings = {
          targetLang: settings.targetLang || 'en',
          apiUrl: settings.apiUrl,
          apiKey: settings.apiKey || ''
        };

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Position the popup below the selection
        // Adjustments might be needed for better positioning
        let popupX = rect.left + window.scrollX;
        let popupY = rect.bottom + window.scrollY + 5; // 5px below selection

        // Basic boundary checks (so it doesn't go off-screen)
        // A more robust solution would involve checking popup dimensions once rendered
        if (popupX + 300 > window.innerWidth) { // Assuming max-width of 300px
            popupX = window.innerWidth - 300 - 10; // Adjust with some padding
        }
        if (popupY + 100 > window.innerHeight) { // Assuming approx height
            popupY = rect.top + window.scrollY - 100 - 5; // Position above if no space below
        }
        popupX = Math.max(0, popupX); // Ensure not off-screen left
        popupY = Math.max(0, popupY); // Ensure not off-screen top


        showAutoTranslationPopup(selectedText, currentSettings, popupX, popupY);
      });
    }
  }
}); 