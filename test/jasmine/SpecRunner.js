// Require.js allows us to configure shortcut alias, load on demand
/* global require */
(function() {
  'use strict';

  require.config({
    
    // The path where application javascript is located
      baseUrl: "/ESS.App/app/",

    paths: {
      // Shortcut to vendor
      vendor: "../vendor",

      // Testing
      urlArgs: "cb=" + Math.random(),
      boot: '../test/lib/boot',
      jasmine: "../test/lib/jasmine",
      console: "../test/lib/console",
      'jasmine-html' : "../test/lib/jasmine-html",
      spec: "../test/jasmine",
      sinon: "../test/lib/sinon",

      // Major Vendor libraries
      backbone: "../vendor/backbone", // Version 1.1.0
      bootstrap: "../vendor/bootstrap", // Version 3.0
      jquery: "../vendor/jquery-2.0.3",
      jqueryUI: "../vendor/jquery-ui-1.10.3.custom",
  	  gritter: "../vendor/jquery.gritter",
      knockback: "../vendor/knockback",
      knockout: "../vendor/knockout",
      lodash: "../vendor/lodash", // Version 2.3.0 alternative to underscore http://lodash.com
      text: "../vendor/extensions/RequireJS_text", // plugin for require.js to load text/html https://github.com/requirejs/text
      underscore: "../vendor/underscore",
      breeze: "../vendor/breeze.debug",
      moment : "../vendor/moment.min", // Javascript Date manipulation library
      // Validation
      validate: "../vendor/jquery.validate", // http://jqueryvalidation.org/
      validateAddons: "../vendor/additional-methods",
	  validateCustomAddons: "../vendor/custom-validations",

      //eventsource: "../vendor/EventSource",

      // Backbone Extensions
      layoutmanager : "../vendor/extensions/backbone-layoutmanager",
      eventbroker : "../vendor/extensions/backbone-eventbroker.amd",
      queryengine : "../vendor/extensions/backbone-queryengine",
      collectionview: "../vendor/extensions/backbone-collectionView",
      nested: "../vendor/extensions/backbone-nested",

      //Knockout Extensions
      komapping: "../vendor/extensions/Ko.Mapping.Plugin",
      kobindings: "lib/knockout-bindings"

    },

    // For scripts that are not AMD-capable, use AMD wrapping by RequireJS
    shim:{
      "backbone" : {
        // These are the two hard dependencies that will be loaded first.
        deps: ["jquery", "underscore"],

        // This maps the global `Backbone` object to `require("backbone")`.
        exports: "Backbone"
      },
      "underscore" : {
        exports: "_"
      },
      "validate" : ["jquery"],
      "validateAddons" : ["jquery", "validate"],
	  "validateCustomAddons" : ["jquery", "validate"],
      "bootstrap" : ["jquery"],
      "queryengine" : ["backbone"],
      "collectionview" : ["backbone"],
      "nested": ["backbone"],
      'jasmine': { exports: 'jasmine'},
      'jasmine-html': {
          deps: ['jasmine'],
          exports: 'jasmine'
      },
      'console' : ['jasmine'],
      'boot': {
        deps: ['jasmine', 'jasmine-html'],
        exports: 'jasmine'
      },
      'sinon': {
        exports: 'sinon'
      }
    }
  });

   // Define all of your specs here. These are RequireJS modules.
  var specs = [
    'spec/models/UserSpec',
    'spec/lib/UtilsSpec'
  ];

  // Load Jasmine - This will still create all of the normal Jasmine browser globals unless `boot.js` is re-written to use the
  // AMD or UMD specs. `boot.js` will do a bunch of configuration and attach it's initializers to `window.onload()`. Because
  // we are using RequireJS `window.onload()` has already been triggered so we have to manually call it again. This will
  // initialize the HTML Reporter and execute the environment.
  require(['boot', 'console', 'sinon'], function () {

    // Load the specs
    require(specs, function () {

      // Initialize the HTML Reporter and execute the environment (setup by `boot.js`)
      window.onload();
      
    });
  });
})();


