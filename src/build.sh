#!/usr/bin/env sh

# Compile coffeescript
coffee --compile --bare --output chrome src/iso.coffee
coffee --compile --bare --output firefox/isometric-contributions src/iso.coffee
coffee --compile --bare --output safari/isometric-contributions.safariextension src/iso.coffee

# Build .xpi for Firefox
cd firefox/isometric-contributions
rm ../isometric-contributions.xpi
zip -r ../isometric-contributions.xpi *
cd ../..
