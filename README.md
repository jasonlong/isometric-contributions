Isometric Contributions
=======================

This is an extension for Chrome and Safari that lets you toggle between your regular GitHub contribution chart and an isometric pixel art version. It uses [obelisk.js](https://github.com/nosir/obelisk.js) for the isometric graphics.

![Preview](http://cl.ly/image/1j0j3l1R1d2Z/content)

Besides being sort of neat looking, this view is interesting since it highlights the differences between the number of contributions with more granularity. This isn't meant to completely replace the standard 2D graph though, because in most ways it is actually less useful. For example, there are no axis labels, shorter bars can be hidden behind taller ones, you can't hover over a bar to see the day and count, etc.

## Installation
>**NOTE:** *When installing this extension, you will likely see a warning about it needing access to all domains, not just github.com. This is required for people who are using GitHub Enterprise since it can be installed on any domain name.*

### Safari
Download the [isometric-contributions.safariextz](https://github.com/jasonlong/isometric-contributions/blob/master/safari/isometric-contributions.safariextz?raw=true) file and double-click it to install it.

### Chrome
The easiest way to install the extension is through the Chrome Web Store:

https://chrome.google.com/webstore/detail/isometric-contributions/mjoedlfflcchnleknnceiplgaeoegien?hl=en&gl=US

### Developer Mode
If you want to hack on the extension, you'll need to install it manually. First of all, clone or fork this repo. Then, on your Extensions page, make sure "Developer mode" is checked. You can then click the "Load unpacked extension..." button and browse to the `chrome` directory of this repo.

![Developer Mode](http://cl.ly/image/0J0p1H2u0F0E/content)

## Hacking
To hack on the extension, you'll first need to make sure you've installed it in Developer Mode (see [above](#developer-mode)). Once you've made changes to the extension, go back to the Extensions page and click the Reload link under the extension entry.

![Hacking](http://cl.ly/image/10370H2B2Q1G/content)

As of `v0.8.3`, this project uses CoffeeScript. To compile the iso.coffee file, use:

    $ coffee -cb iso.coffee


Feel free to send a pull request if you've made an improvement.

## License
This project is licensed under the [MIT License](http://opensource.org/licenses/MIT).
