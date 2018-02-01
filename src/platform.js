"use strict";

var Events           = require('events');
var Path             = require('path');
var isObject         = require('yow/is').isObject;
var isString         = require('yow/is').isString;
var isFunction       = require('yow/is').isFunction;
var sprintf          = require('yow/sprintf');
var isString         = require('yow/is').isString;
var Timer            = require('yow/timer');

var Lightbulb          = require('./lightbulb.js');
var Gateway            = require('./gateway.js');
var Ikea               = require('node-tradfri-client');


var Accessory, Service, Characteristic, UUIDGen;


module.exports = class Platform extends Gateway {

    constructor(log, config, homebridge) {

        Accessory = homebridge.platformAccessory;
        Service = homebridge.hap.Service;
        Characteristic = homebridge.hap.Characteristic;
        UUIDGen = homebridge.hap.uuid;

        super(log, config);

        this.homebridge = homebridge;
        this.clock = undefined;

    }

    deviceUpdated(device) {
        if (this.clock && this.clock.device.instanceId == device.instanceId) {
            this.clock.device = device;
            this.clock.deviceChanged();
        }
    }




    setup() {
        for (var id in this.gateway.devices) {
            var device = this.gateway.devices[id];

            if (device.type === Ikea.AccessoryTypes.lightbulb) {

                if (device.name == this.config.lightbulb) {
                    //device.name = this.config.displayName;
                    this.log('Creating new clock!!');
                    this.clock = new Lightbulb(this, device);
                }
            }
        }

        return Promise.resolve();

    }

    accessories(callback) {

        this.connect().then(() => {
            return this.setup();
        })
        .then(() => {
            if (this.clock == undefined)
                throw new Error('Clock not found.');


            callback([this.clock]);
        })
        .catch((error) => {
            // Display error and make sure to stop.
            // If we just return an empty array, all our automation
            // rules and scenarios will be removed from the Home App.
            console.log(error);
            throw error;
        })


    }


}
