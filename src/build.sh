#!/usr/bin/env sh

# Compile coffeescript
coffee --compile --bare --output chrome src/iso.coffee
coffee --compile --bare --output firefox/isometric-contributions src/iso.coffee
coffee --compile --bare --output safari/isometric-contributions.safariextension src/iso.coffee

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
