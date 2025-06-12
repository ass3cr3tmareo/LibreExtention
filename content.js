console.log("LibreTranslate extension: content.js loaded and reset.");

// All previous content has been removed as part of the project restart.
// New functionality will be built incrementally.

/**
 * Translates text using a LibreTranslate-compatible API.
 * @param {string} text The text to translate.
 * @param {string} targetLang The target language code (e.g., 'es', 'fr').
 * @param {string} apiUrl The full API endpoint URL for the translation service (e.g., 'https://libretranslate.de/translate').
 * @param {string} [apiKey] Optional API key.
 * @returns {Promise<string>} A promise that resolves with the translated text.
 * @throws {Error} If translation fails due to network issues, API errors, or invalid response.
 */
async function translateTextViaAPI(text, targetLang, apiUrl, apiKey) {
  if (!apiUrl || apiUrl.trim() === '') {
    // This case should ideally be prevented by settings validation,
    // but as a safeguard for direct calls:
    throw new Error('API URL is not provided or is empty.');
  }

  const requestBody = {
    q: text,
    source: 'auto', // Auto-detect source language
    target: targetLang,
    format: 'text' // Assuming we always want plain text
  };

  if (apiKey && apiKey.trim() !== '') {
    requestBody.api_key = apiKey;
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! Status: ${response.status}`;
      try {
        // Try to get a more specific error message from the API's JSON response
        const errorData = await response.json();
        if (errorData && errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // If the error response isn't JSON, or doesn't have an .error field,
        // the generic errorMessage will be used.
        console.warn('Could not parse error response JSON:', e);
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (data && typeof data.translatedText === 'string') {
      return data.translatedText;
    } else if (data && data.error) {
      // Handle cases where API returns 200 OK but includes an error in the JSON body
      throw new Error(data.error);
    } else {
      // Handle unexpected response structure
      console.error('Invalid response format from translation API:', data);
      throw new Error('Invalid response format from translation API.');
    }

  } catch (error) {
    // Log the error for debugging purposes
    console.error('LibreTranslate API communication error:', error.message);
    
    // Re-throw the error to be handled by the caller
    // Enrich the error message if it's a network error (fetch specific)
    if (error instanceof TypeError && error.message.toLowerCase().includes('failed to fetch')) {
      throw new Error(`Network error: Unable to connect to the translation API at ${apiUrl}. Please check the URL and your connection.`);
    }
    throw error; // Re-throw other errors (including ones from response.ok check)
  }
}