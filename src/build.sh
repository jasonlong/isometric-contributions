#!/usr/bin/env sh

cp src/iso.js chrome/
cp src/iso.js firefox/isometric-contributions/

# Build .zip for Chrome
cd chrome
rm ../chrome.zip
zip -r ../chrome.zip *
cd ..

# Build .zip for Firefox
cd firefox/isometric-contributions
rm ../isometric-contributions.zip
zip -r ../isometric-contributions.zip *
cd ..
