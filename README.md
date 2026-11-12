<div align="center">

# Isometric Contributions extension

**Your GitHub contributions, in isometric pixel art.**

![Node.js CI](https://github.com/jasonlong/isometric-contributions/workflows/Node.js%20CI/badge.svg)
[![Biome code style](https://img.shields.io/badge/code_style-Biome-60a5fa.svg)](https://biomejs.dev)

<p>
  <a href="https://chrome.google.com/webstore/detail/isometric-contributions/mjoedlfflcchnleknnceiplgaeoegien?hl=en&gl=US"><img src="https://img.shields.io/badge/Install-Chrome%20%2F%20Brave-1a7f37?style=for-the-badge" alt="Install for Chrome / Brave" /></a>
  <a href="https://addons.mozilla.org/en-US/firefox/addon/github-isometric-contributions/"><img src="https://img.shields.io/badge/Install-Firefox-1a7f37?style=for-the-badge" alt="Install for Firefox" /></a>
  <a href="https://microsoftedge.microsoft.com/addons/detail/github-isometric-contribu/hcicbpfcbdpfgibhlbphodkcbojakpej"><img src="https://img.shields.io/badge/Install-Microsoft%20Edge-1a7f37?style=for-the-badge" alt="Install for Microsoft Edge" /></a>
</p>

**English** · [简体中文](README-zh.md)

[Preview](#preview) · [Installation](#installation) · [Contributing](#contributing) · [Community Forks](#community-forks) · [License](#license)

</div>

This is a browser extension for Chrome/Brave and Firefox that lets you toggle between your regular GitHub contribution chart and an isometric pixel art version. It uses [obelisk.js](https://github.com/nosir/obelisk.js) for the isometric graphics.

Besides being sort of neat looking, this view is interesting in that it highlights the differences between the number of contributions with more granularity. This isn't meant to completely replace the standard 2D graph though, because in most ways it is actually less useful. For example, there are no axis labels, shorter bars can be hidden behind taller ones, you can't hover over a bar to see the day and count, etc.

## Preview

<div align="center">

**Light theme**

<img src="img/preview.png" width="747" alt="Light theme with a highlighted contribution bar and its date and count tooltip" />

**Dark theme**

<img src="img/preview-dark.png" width="747" alt="Dark theme with a highlighted contribution bar and its date and count tooltip" />

</div>

## Installation

### Chrome/Brave

[Install from the Chrome Web Store](https://chrome.google.com/webstore/detail/isometric-contributions/mjoedlfflcchnleknnceiplgaeoegien?hl=en&gl=US)

### Firefox

[Install from Mozilla Add-ons site](https://addons.mozilla.org/en-US/firefox/addon/github-isometric-contributions/)

### Microsoft Edge

[Install from Microsoft Edge Add-ons site](https://microsoftedge.microsoft.com/addons/detail/github-isometric-contribu/hcicbpfcbdpfgibhlbphodkcbojakpej)

## Contributing

> [!IMPORTANT]
> **_Note that I don't currently have any plans for adding new features to the extension. Please contact me before submitting a PR with new functionality._**

### 1. Load the extension locally

If you want to hack on the extension, you'll need to install it manually. First clone or fork this repo. Then, on your Chrome Extensions page, make sure "Developer mode" is checked. You can then click the "Load unpacked extension..." button and browse to the `src` directory of this repo.

<img src="img/dev-mode.png" width="981" alt="Chrome Extensions page with Developer mode and Load unpacked extension controls" />

### 2. Reload after making changes

To hack on the extension, you'll first need to make sure you've installed it in Developer mode (see above). Once you've made changes to the extension, go back to the Extensions page and click the Reload link under the extension entry.

<img src="img/reload-link.png" width="410" alt="Reload link under the extension entry" />

## Community Forks

- [isometric-contributions-plus](https://github.com/Qiuner/isometric-contributions-plus) - Extended version with GitCode integration and additional features

## License

This project is licensed under the [MIT License](http://opensource.org/licenses/MIT).
