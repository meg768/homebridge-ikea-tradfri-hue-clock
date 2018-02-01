"use strict";
var sprintf  = require('yow/sprintf');
var isString = require('yow/is').isString;
var isNumber = require('yow/is').isNumber;
var Device   = require('./device.js');
var ColorConvert = require('color-convert');

module.exports = class Lightbulb extends Device {

    constructor(platform, device) {
        super(platform, device);

        this.log('Creating new lightbulb %s (%s)...', this.name, this.id);
        this.lightbulb = new this.Service.Lightbulb(this.name, this.uuid);


        this.hue = 0;
        this.saturation = 0;
        this.luminance = 50;
        this.power = 0;
        this.brightness = 0;


        this.enablePower();
        this.enableBrightness();
        this.enableStatus();
        this.updateHue();
        this.updateSaturation();

        this.installClock();

        this.addService(this.lightbulb);

    }

    deviceChanged(device) {
        super.deviceChanged();

        this.updatePower();
        this.updateBrightness();
        this.updateStatus();
        this.updateHue();
        this.updateSaturation();
    }

    displayClock(callback) {
        var now = new Date();
        var hue = this.lightbulb.getCharacteristic(this.Characteristic.Hue);
        var saturation = this.lightbulb.getCharacteristic(this.Characteristic.Saturation);

        this.saturation = 100;
        this.luminance = 50;
        this.hue = ((((now.getHours()-4) % 12) * 60) + now.getMinutes()) / 2;
        hue.updateValue(this.hue);
        saturation.updateValue(this.saturation);

        this.log('Setting hue to (%s,%s,%s) on lightbulb \'%s\'', this.hue, this.saturation, this.luminance, this.name);

        this.platform.gateway.operateLight(this.device, {
            color: ColorConvert.hsl.hex(this.hue, this.saturation, this.luminance),
            transitionTime: 0.1
        })
        .catch((error) => {
            this.log(error);
        })
        .then(() => {
            if (callback)
                callback();
        });
    }

    installClock() {
        this.displayClock();
        setInterval(this.displayClock.bind(this), 60000);


    }

    enablePower() {
        var power = this.lightbulb.getCharacteristic(this.Characteristic.On);

        power.on('get', (callback) => {
            callback(null, this.power);
        });

        power.on('set', (value, callback) => {
            this.log('Setting power to %s on lightbulb \'%s\'', value ? 'ON' : 'OFF', this.name);
            this.power = value;

            this.platform.gateway.operateLight(this.device, {
                onOff: this.power
            })
            .then(() => {
                if (callback)
                    callback();
            })
            .catch((error) => {
                this.log(error);
            });
        });

        this.updatePower();

    }

    enableBrightness() {
        var brightness = this.lightbulb.addCharacteristic(this.Characteristic.Brightness);

        brightness.on('get', (callback) => {
            callback(null, this.brightness);
        });

        brightness.on('set', (value, callback) => {
            this.log('Setting brightness to %s on lightbulb \'%s\'', value, this.name);
            this.brightness = value;

            this.platform.gateway.operateLight(this.device, {
                dimmer: this.brightness
            })
            .then(() => {
                if (callback)
                    callback();
            });
        });

        this.updateBrightness();
    }

    enableStatus() {
        var alive = this.lightbulb.addCharacteristic(this.Characteristic.StatusActive);

        alive.on('get', (callback) => {
            this.log('Light %s in currently %s.', this.name, this.device.alive ? 'ALIVE' : 'DEAD');
            callback(null, this.device.alive);
        });

        this.updateStatus();


    }


    updatePower() {
        var light = this.device.lightList[0];
        var power = this.lightbulb.getCharacteristic(this.Characteristic.On);

        this.power = light.onOff;

        this.log('Updating power to %s on lightbulb \'%s\'', this.power ? 'ON' : 'OFF', this.name);
        power.updateValue(this.power);
    }

    updateBrightness() {
        var light = this.device.lightList[0];
        var brightness = this.lightbulb.getCharacteristic(this.Characteristic.Brightness);

        this.brightness = light.dimmer;

        this.log('Updating brightness to %s%% on lightbulb \'%s\'', this.brightness, this.name);
        brightness.updateValue(this.brightness);

    }

    updateStatus() {
        var alive = this.lightbulb.getCharacteristic(this.Characteristic.StatusActive);

        this.log('Updating active status to %s on lightbulb \'%s\'', this.device.alive ? 'ALIVE' : 'DEAD', this.name);
        alive.updateValue(this.device.alive);
    }


    updateHue() {
        var light = this.device.lightList[0];
        var hue = this.lightbulb.getCharacteristic(this.Characteristic.Hue);
        var color = ColorConvert.hex.hsl(light.color);

        hue.updateValue(this.hue = color[0]);
        this.log('Updating to color %s (%s, %s, %s) on lightbulb \'%s\'', light.color, this.hue, this.saturation, this.luminance, this.name);
    }

    updateSaturation() {
        var light = this.device.lightList[0];
        var saturation = this.lightbulb.getCharacteristic(this.Characteristic.Saturation);
        var color = ColorConvert.hex.hsl(light.color);

        saturation.updateValue(this.saturation = this.saturation = color[1]);
        this.log('Updating to color %s (%s, %s, %s) on lightbulb \'%s\'', light.color, this.hue, this.saturation, this.luminance, this.name);
    }

    enableHue() {
        var hue = this.lightbulb.getCharacteristic(this.Characteristic.Hue);

        this.updateHue();

        hue.on('get', (callback) => {
            callback(null, this.hue);
        });

        hue.on('set', (value, callback) => {
            // Set value
            this.hue = value;
            this.log('Setting hue to %s on lightbulb \'%s\'', this.hue, this.name);

            this.platform.gateway.operateLight(this.device, {
                color: ColorConvert.hsl.hex(this.hue, this.saturation, this.luminance),
                transitionTime: 0.1
            })
            .then(() => {
                if (callback)
                    callback();
            })
        });
    }


    enableSaturation() {
        var saturation = this.lightbulb.getCharacteristic(this.Characteristic.Saturation);

        this.updateSaturation();

        saturation.on('get', (callback) => {
            callback(null, this.saturation);
        });

        saturation.on('set', (value, callback) => {
            // Set value
            this.saturation = value;
            this.log('Setting saturation to %s on lightbulb \'%s\'', this.saturation, this.name);

            this.platform.gateway.operateLight(this.device, {
                color: ColorConvert.hsl.hex(this.hue, this.saturation, this.luminance),
                transitionTime: 0.1
            })
            .then(() => {
                if (callback)
                    callback();
            })
        });
    }



};
