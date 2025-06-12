# LibreTranslate Browser Extension

A browser extension that allows you to translate text and web pages using a configured LibreTranslate API instance.

## Features

-   **Translate Selected Text**:
    -   Manually trigger translation of selected text via the extension popup or context menu.
    -   Automatically translate selected text on hover/selection (configurable).
-   **Translate Entire Web Pages**: Translate the full content of a web page.
-   **Extensive Language Support**: Access to over 100 languages, depending on the configured LibreTranslate instance.
-   **RTL Language Handling**: Correctly displays and handles right-to-left languages.
-   **Dynamic Content Translation**: Attempts to translate content loaded after the initial page load and dynamically appearing elements (e.g., dropdown menus). (Note: This is best-effort and may not work on all websites or components).
-   **Progress Tracking**: View progress during full-page translations, including the number of segments processed.
-   **Loading Indicators & Error Handling**: Clear indicators for ongoing translations and specific error messages to help troubleshoot issues.
-   **Customizable API Endpoint**: Use the public LibreTranslate API, your own self-hosted instance, or other compatible LibreTranslate API providers.
-   **API Key Support**: Configure an API key if required by your chosen LibreTranslate instance.
-   **Context Menu Integration**: Quickly translate selected text or entire pages using the right-click context menu.
-   **User-Friendly Popup**: Manage settings and initiate translations from an easy-to-use popup interface.

## Installation

### Chrome

1.  Download or clone this repository (e.g., click "Code" -> "Download ZIP" and unzip it).
2.  Open Chrome and navigate to `chrome://extensions/`.
3.  Enable "Developer mode" using the toggle in the top right corner.
4.  Click the "Load unpacked" button.
5.  Select the root directory where you unzipped or cloned the repository (the directory containing `manifest.json`).

### Firefox

1.  Download or clone this repository (e.g., click "Code" -> "Download ZIP" and unzip it).
2.  Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
3.  Click "Load Temporary Add-on...".
4.  Select the `manifest.json` file from the root directory where you unzipped or cloned the repository.

## Usage

### Translating Selected Text

1.  **Using the Popup**:
    -   Select text on any webpage.
    -   Click the LibreTranslate extension icon in your browser toolbar.
    -   Click the "Translate Selection" button.
2.  **Using the Context Menu**:
    -   Select text on any webpage.
    -   Right-click on the selected text.
    -   Choose "Translate Selection" from the context menu.
3.  **Automatic Translation (On-Selection Popups)**:
    -   First, ensure "Automatic Translation" is enabled in the extension's configuration popup.
    -   Simply select text on a webpage.
    -   A small popup will appear near your selection with the translated text. Click the "×" on the popup to dismiss it.

### Translating the Entire Page

1.  **Using the Popup**:
    -   Open the webpage you want to translate.
    -   Click the LibreTranslate extension icon in your browser toolbar.
    -   Click the "Translate Page" button. A progress indicator will show the status.
2.  **Using the Context Menu**:
    -   Open the webpage you want to translate.
    -   Right-click anywhere on the page (not on selected text).
    -   Choose "Translate Page" from the context menu. A progress indicator will show the status.

## Configuration

Access the configuration options by clicking the LibreTranslate extension icon in your browser toolbar.

-   **Target Language**: Choose the language you want to translate text into. Defaults to English.
-   **API URL**: Set the URL of your LibreTranslate API instance.
    -   Defaults to `https://libretranslate.de`.
    -   You can use the public server, your own self-hosted instance (e.g., `http://localhost:5000`), or other compatible API providers.
    -   The URL should point to the base of the API, e.g., `https://your-instance.com` or `http://localhost:5000`. The extension will append `/translate`, `/languages`, etc., as needed.
-   **API Key**: Enter your API key if your LibreTranslate instance requires one (e.g., for some third-party hosting services or if you've configured it on your self-hosted instance). Leave blank if not needed.
-   **Automatic Translation**: Enable this option to automatically translate text you select on a webpage. The translation will appear in a small, non-intrusive popup near your selection.

## Troubleshooting & Notes

-   **Translations Not Working?**:
    -   Double-check your **API URL** in the extension settings. Ensure it's a valid LibreTranslate API endpoint.
    -   If your API instance requires an **API Key**, make sure it's correctly entered in the settings.
    -   Check your internet connection.
    -   Open your browser's developer console (usually F12) and look for error messages from the "LibreTranslate Extension" or related to network requests.
-   **Dynamic Content**: While the extension attempts to translate dynamically loaded content (content that appears after the page first loads) and interactive elements like dropdown menus, its effectiveness can vary depending on how the website is built. Full page translation generally works best on content that is present when the page initially loads.
-   **Error Messages**: The extension aims to provide specific error messages for issues like network problems, API configuration errors, or server-side problems from the LibreTranslate instance. Refer to these messages for guidance.
-   **Self-Hosted Instances**: If using a self-hosted LibreTranslate instance, ensure it's running, accessible from your browser, and that CORS (Cross-Origin Resource Sharing) is configured correctly if necessary (though typically for browser extensions, this is handled by manifest permissions).

## Development

The extension is built using vanilla JavaScript, HTML, and CSS.

-   `manifest.json`: The core configuration file for the browser extension, defining permissions, icons, and scripts.
-   `popup.html` & `popup.js`: Defines the structure and functionality of the extension's popup interface (for settings and manual actions).
-   `content.js`: Injected into web pages to handle all translation tasks, including text selection, page parsing, DOM manipulation for displaying translations, and communication with the LibreTranslate API.
-   `background.js`: Manages background tasks such as context menu creation and handling, and potentially future features like settings synchronization.
-   `styles.css`: Contains the CSS rules for styling the popup and any elements injected into web pages by the extension (like translation popups).

To set up for development, load the extension as "unpacked" as described in the "Installation" section. Changes to the code usually require a reload of the extension from the `chrome://extensions/` page (look for a "reload" button or toggle the extension off/on).

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.