# Highlite: A browser extension

An extension for Chromium browsers (Chrome, Edge, Brave) that allows you to highlight, summarise and export text on any page. Fast, secure, and helps you stay in flow.

![image](https://github.com/user-attachments/assets/8faad570-3bc1-493a-8002-5334ae49aec9)

## Installation

This extension is no longer available on the Chrome Web Store due to Google making it mandatory for developers to list their phone number and physical address publicly on the Store. No thanks!

Still, you can install it manually using the following steps:

1. Clone this repo, or download the [zip file](/highlite-extension.zip) and unzip it
2. Move the folder to a permanent location on your computer (do not delete the folder after installation)
3. Go to the extensions page (chrome://extensions)
4. Enable Developer Mode
5. Click *Load Unpacked* and select the highlight-extension folder

## Usage

1. You will need to toggle on the extension on each page/tab you want to use the highlighter
2. Once the extension is active, start higlighting text. The UI is intuitive from there.
3. Export your highlights to plain text or markdown formats.
4. Highlights are not saved or stored anywhere unless you export them. Remember to export *before* you leave or refresh the page!

## Additional notes

Google required a zip of this repo for deployment. For some reason, it didn't like the zip output
by Mac's default file compressor. Instead, run this command from the extension's root directory:

> zip -r extension.zip \*

### Files

**manifest.json**

This is the main configuration file for the extension. It specifies various details such as the
extension's name, version, permissions, and content scripts.

Docs: https://developer.chrome.com/docs/extensions/mv3/manifest/

**background.js**

The entry point and always-running script in the background context. Can listen to events and
perform actions on behalf of the extension, even when the extension's popup is closed. It's used for
tasks such as managing state, handling notifications, and communicating with Google's and external
APIs.

**content.js**

Injected into the active webpage and can interact with the page's DOM and modify its behavior. Often
used for tasks such as injecting custom styles or adding new UI elements.
