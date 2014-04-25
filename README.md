This is a Chrome extension lets you toggle between your regular GitHub contribution chart and an isometric pixel art version. It uses [obelisk.js](https://github.com/nosir/obelisk.js) for the isometric graphics.

Besides being sort of neat looking, this view is interesting in that it highlights the differences between the number of contributions with more granularity. This isn't meant to completely replace the standard 2D graph though, because in most ways it is actually less useful. For example, there are no axis labels, shorter bars can be hidden behind taller ones, you can't hover over a bar to see the day and count, etc.

![](http://cl.ly/image/1j0j3l1R1d2Z/content)

## Installation

### Chrome Web Store

The easiest way to install the extension is through the Chrome Web Store:

https://chrome.google.com/webstore/detail/isometric-contributions/mjoedlfflcchnleknnceiplgaeoegien?hl=en&gl=US

### Developer mode

If you want to hack on the extension, you'll need to install it manually. First clone or fork this repo. Then, on your Extensions page, make sure "Developer mode" is checked. You can then click the "Load unpacked extension..." button and browse to the `chrome` directory of this repo.

![](http://cl.ly/image/0J0p1H2u0F0E/content)

## Hacking

To hack on the extension, you'll first need to make sure you've installed it in Developer mode (see above). Once you've made changes to the extension, go back to the Extensions page and click the Reload link under the extension entry.

![](http://cl.ly/image/10370H2B2Q1G/content)

Feel free to send a pull request if you've made an improvement.

## License

This project is licensed under the [MIT License](http://opensource.org/licenses/MIT).
