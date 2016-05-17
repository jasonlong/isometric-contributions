#!/usr/bin/env sh

coffee --compile --bare --output chrome src/iso.coffee
coffee --compile --bare --output firefox/isometric-contributions src/iso.coffee
coffee --compile --bare --output safari/isometric-contributions.safariextension src/iso.coffee
