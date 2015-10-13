particle-whoami
===============

A simple Node.JS daemon to listen for "who-am-i" requests and respond with a look-up of the device.


Installation
------------

1. Clone this repository
2. Change to repo directory (`cd particle-whoami`)
3. Run `npm install` to install dependencies
4. Run using `node ACCESS_TOKEN=XXXX particle-whoami.js` or use any process manager (nodemon, foreverjs, pm2).
 - Make note that you should supply your own `ACCESS_TOKEN`.


Options
---------

- `ACCESS_TOKEN` - (Required) Your Particle cloud access token
- `EVENT_SUBSCRIBE` - The event to listen for - default: `whoami`
- `EVENT_PUBLISH` - The event to respond as - default: `youare`
- `DEVICE_REFRESH` - Interval in seconds to refresh device list - default: `600` seconds (10 minutes)
