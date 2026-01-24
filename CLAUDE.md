# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GitHub Isometric Contributions is a browser extension (Chrome/Brave, Firefox, Edge) that renders GitHub contribution graphs as isometric 3D pixel art using obelisk.js. Users can toggle between the standard 2D view and the isometric 3D view.

## Commands

- `npm run build` - Build the extension with Parcel
- `npm run start` - Watch mode for development (serves from localhost)
- `npm test` - Run XO linter

## Code Style

Uses XO linter with Prettier enabled:
- No semicolons
- 2-space indentation
- ES modules (`"type": "module"` in package.json)

## Architecture

The extension is a content script that runs on `github.com/*` pages:

**src/iso.js** - Main extension logic:
- Detects GitHub profile pages via `.vcard-names-container`
- Uses MutationObserver to detect when contribution graph loads
- Scrapes contribution data from `.js-calendar-graph-table` DOM elements
- Calculates stats (total, streaks, best day, averages)
- Renders isometric cubes using obelisk.js onto a canvas
- Persists user view preference (2D/3D toggle) via `chrome.storage.local`

**src/iso.css** - Toggles visibility between 2D graph and 3D canvas based on `.ic-squares`/`.ic-cubes` classes

**src/obelisk.min.js** - Vendored isometric rendering library

**src/manifest.json** - Manifest v3 extension configuration
