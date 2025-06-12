# LibreTranslate Browser Extension

A browser extension that allows you to translate text and web pages using LibreTranslate.

## Features

- Translate selected text on any webpage
- Translate entire web pages
- Support for multiple languages
- Customizable API endpoint
- Optional API key support
- Context menu integration

## Installation

### Chrome

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `src` directory from this repository

### Firefox

1. Download or clone this repository
2. Open Firefox and go to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select any file from the `src` directory

## Usage

1. Click the extension icon in your browser toolbar to open the popup
2. Configure your settings:
   - Select target language
   - Set API URL (default: https://libretranslate.de)
   - Add API key if required
3. Use the extension in two ways:
   - Select text on any webpage and click "Translate Selection"
   - Click "Translate Page" to translate the entire page
   - Right-click on selected text or page and use the context menu options

## Configuration

- **Target Language**: Choose the language you want to translate to
- **API URL**: Set your LibreTranslate instance URL
- **API Key**: Add your API key if required by your LibreTranslate instance

## Development

The extension is built using vanilla JavaScript and can be modified easily. The main components are:

- `manifest.json`: Extension configuration
- `popup.html/js`: Extension popup interface
- `content.js`: Handles translation functionality in web pages
- `background.js`: Manages background tasks and context menu
- `styles.css`: Extension styling

## License

This project is licensed under the MIT License - see the LICENSE file for details. 