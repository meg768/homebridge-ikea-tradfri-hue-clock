"use strict";

var Path = require('path');

module.exports = function(homebridge) {

    // Load .env
    require('dotenv').config({path: Path.join(process.env.HOME, '.homebridge/.env')});

    homebridge.registerPlatform('homebridge-ikea-tradfri-hue-clock', 'Ikea Trådfri Hue Clock', require('./src/platform.js'));
};
