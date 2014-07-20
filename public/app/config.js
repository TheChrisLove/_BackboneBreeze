/* global require */
require.config({

    // The path where main app javascript files are located 
    baseUrl: "/app/",

    paths: {
        // Shortcut to vendor, can be utilized to pull in vendor files within app require functions
        vendor: "../vendor",
        meta : "lib/metadata",

        // Core Application Vendor libraries
        backbone: "../vendor/backbone", // Version 1.1.0, http://backbonejs.org/
        bootstrap: "../vendor/bootstrap", // Version 3.0, http://getbootstrap.com/
        jquery: "../vendor/jquery-2.0.3", // Version 2.0.3,http://jquery.com/ 
        jqueryUI: "../vendor/jquery-ui-1.10.3.custom", // Version 1.10.3,https://jqueryui.com/ 
        knockback: "../vendor/knockback", // Version 0.17.2, http://kmalakoff.github.io/knockback/
        knockout: "../vendor/knockout", // Version 3.0.0, http://knockoutjs.com/
        // Plugin for require.js to load text/html 
        text: "../vendor/extensions/RequireJS_text", // Version 2.0.10, https://github.com/requirejs/text
        underscore: "../vendor/underscore", // Version 1.5.2, http://underscorejs.org/

        // Breeze and Dataservice libraries
        breeze: "../vendor/breeze.debug", // Version 1.4.7, http://www.breezejs.com/
        mongodb: "../vendor/breeze-mongodb",
        //Q is a breeze dependancy, but is loaded/referenced as a global in app/main.js
        Q: "../vendor/q", // Version 1, https://github.com/kriskowal/q
        metadata: "metadata",
        saveQueuing: "../vendor/extensions/breeze.savequeuing",

        // Backbone Extensions
        layoutmanager: "../vendor/extensions/backbone-layoutmanager", // Version 0.9.4, https://github.com/tbranyen/backbone.layoutmanager
        eventbroker: "../vendor/extensions/backbone-eventbroker.amd", // Version 1.1.0, https://github.com/efeminella/backbone-eventbroker
        queryengine: "../vendor/extensions/backbone-queryengine", // Version 1.5.6, https://github.com/bevry/query-engine
        // Collection view has been modified from original vendor to include support for ctrl-click to select
        collectionview: "../vendor/extensions/backbone.collectionView", // Version 0.9.4, http://rotundasoftware.github.io/backbone.collectionView/
        nested: "../vendor/extensions/backbone-nested", // Version 1.1.2, https://github.com/afeld/backbone-nested
        obscura: "../vendor/extensions/backbone.obscura", // Version 0.1.7, https://github.com/jmorrell/backbone.obscura

        // jQuery plugins requiring usage of require.js shim
        gritter: "../vendor/jquery.gritter", // Version 1.7.4, http://boedesign.com/blog/2009/07/11/growl-for-jquery-gritter/
        validate: "../vendor/jquery.validate", // Version 1.11.1, http://jqueryvalidation.org/
        validateAddons: "../vendor/additional-methods", // Version 1.11.1, http://jqueryvalidation.org/
        validateCustomAddons: "../vendor/custom-validations",

        // Javascript Date manipulation library 
        moment: "../vendor/moment.min", // Version 2.4.0, http://momentjs.com/

        // FileSaver.js library
        filesaver: "../vendor/FileSaver",

        //Knockout Extensions
        komapping: "../vendor/extensions/Ko.Mapping.Plugin", // Version 2.4.1, http://knockoutjs.com/documentation/plugins-mapping.html
        kobindings: "lib/knockout-bindings", // Version ALPHA, Custom knockout binding library - Consult Sharepoint/Lake Mary for details
        koamdhelpers: "../vendor/extensions/knockout-amd-helpers",

        //Knockback extensions
        kbconfig: "../vendor/knockback.config",

        //Misc Widgets
        spinner: "../vendor/widgets/spinner.min", // Version 2.0.1 http://fgnass.github.io/spin.js/#v1.3
        idleTimer: "../vendor/idleTimer", // Version 0.8.092209 // http://github.com/paulirish/yui-misc/tree/

    },

    // For scripts that are not AMD-capable, use AMD wrapping by RequireJS
    shim: {
        "backbone": {
            // These are the two hard dependencies that will be loaded first.
            deps: ["jquery", "underscore"],

            // This maps the global `Backbone` object to `require("backbone")`.
            exports: "Backbone"
        },
        "underscore": {
            exports: "_"
        },
        "bootstrap": ["jquery"],

        "idleTimer": ["jquery"],

        // jQuery Plugins
        "jqueryUI": ["jquery"],
        "gritter": ["jquery"],
        "validate": ["jquery"],
        "validateAddons": ["jquery", "validate"],
        "validateCustomAddons": ["jquery", "validate"],

        // Backbone Extensions
        "queryengine": ["backbone"],
        "collectionview": ["backbone"],
        "nested": ["backbone"]
    }
});