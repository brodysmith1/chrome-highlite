# Highlite

A Chrome extension that allows you to highlight, summarise and export text on any page.

## Packing for deployment

Google requires a zip of this repo for deployment. For some reason, it doesn't like the zip output
by Mac's default compressor.

Instead, run this command from the extension's root directory:

> zip -r extension.zip \*

## Files

### manifest.json

This is the main configuration file for the extension. It specifies various details such as the
extension's name, version, permissions, and content scripts.

Docs: https://developer.chrome.com/docs/extensions/mv3/manifest/

### background.js

The entry point and always-running script in the background context. Can listen to events and
perform actions on behalf of the extension, even when the extension's popup is closed. It's used for
tasks such as managing state, handling notifications, and communicating with Google's and external
APIs.

### content.js

Injected into the active webpage and can interact with the page's DOM and modify its behavior. Often
used for tasks such as injecting custom styles or adding new UI elements.
