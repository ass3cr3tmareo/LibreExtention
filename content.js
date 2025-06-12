let translationOverlay = null;
let isTranslating = false;
let originalStyles = new Map();
let injectedStyles = null;
let translatedNodes = new Set();
let isRTL = false;

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
function createTranslationPopup(text, x, y) {
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
  if (isRTL) {
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
function applyRTLStyles(element) {
  if (isRTL) {
    element.setAttribute('data-translated', 'true');
    element.style.direction = 'rtl';
    element.style.textAlign = 'right';
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
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.translatedText) {
        throw new Error('Invalid response from translation service');
      }

      console.log('Translation successful:', data.translatedText);
      return data.translatedText;
    } catch (error) {
      console.error(`Translation attempt ${attempt} failed:`, error);
      
      if (attempt === retryCount) {
        throw new Error(`Translation failed after ${retryCount} attempts: ${error.message}`);
      }
      
      await delay(Math.min(1000 * Math.pow(2, attempt - 1), 5000));
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
      rect.bottom + window.scrollY + 10
    );
    overlay.appendChild(popup);
  } catch (error) {
    console.error('Translation failed:', error);
    const overlay = createTranslationOverlay();
    overlay.innerHTML = `
      <div class="translation-error">
        Translation failed: ${error.message}<br>
        Please check your API URL and try again.
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
      applyRTLStyles(parent);
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
          progressText.textContent = `${progress}% (${failedNodes} failed)`;
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
        Translation failed: ${error.message}<br>
        Please check your API URL and try again.
      </div>`;
  } finally {
    isTranslating = false;
  }
}

// Set up mutation observer for dynamic content
let observer = null;

function setupObserver(settings) {
  if (observer) {
    observer.disconnect();
  }

  observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
            translateNode(node, settings);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const walk = document.createTreeWalker(
              node,
              NodeFilter.SHOW_TEXT,
              null,
              false
            );

            let textNode;
            while (textNode = walk.nextNode()) {
              if (textNode.textContent.trim()) {
                translateNode(textNode, settings);
              }
            }
          }
        });
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

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
  if (translationOverlay && !event.target.closest('.translation-popup')) {
    cleanupTranslation();
  }
}); 