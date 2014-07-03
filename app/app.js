/* global define, console */
define([
    'underscore', 'backbone', 'lib/util',
    'models/info', 'models/user', 'models/Authorization',
    'moment', 'knockout', 'komapping',
    'models/dictionaries',
    'modules/timer/timer',
    'bootstrap',
    'eventbroker',
    'nested',
    'queryengine',
    'collectionview',
    'kobindings',
    'jqueryUI',
    'gritter',
    'validate',
    'validateAddons',
    'validateCustomAddons',
    'validateClaimsAuthorization',
    'koamdhelpers'
], function(_, Backbone, Utils,
    Modules, User, Authorization, Moment, ko, komapping, Dictionaries, Timer) {
    "use strict";

    // Application Module
    // ------------------

    // The application instance is created using Backbone.Model, is created in main.js and assigned to the global window.app (for easy reference).
    var app = Backbone.Model.extend( /** @lends App.prototype */ {
        /**
         * @class App Globally accessible application instance. Available at window.app.
         * @constructs
         * @augments Backbone.Model
         * @requires Backbone
         * @param {object} options - Backbone.Model options
         * @property {string} root - Application root.
         * @property {Location} location - Reference to location data.
         * @property {User} user - Reference to the application user.
         * @property {Info} info - Reference to application module details.
         * @property {Utils} utils - Reference to custom utilities module.
         * @property {object} moment - Reference to the 'Moment' date manipulation library
         */
        initialize: function(options) {
            ko.mapping = komapping;
        },

        // Application Configuration
        // -------------------------

        // The root path to run the application through.
        // This is basically the only point of configuration you will need.
        // The other point of config is the base url in config.js
        root: "ESS.App/",

        // Referencing application libraries
        // ---------------------------------

        // Reference/Build global Libraries and Services
        utils: new Utils(), // Custom utility toolbelt
        dictionaries: new Dictionaries(),
        moment: Moment, // Date Manipulation Library
        timer: new Timer(),

        // Tracking User and Location Data
        // -------------------------------

        // Initialize User 
        user: new User(), // Basic user object 

        AuthorizationProfiles: {
            profiles: new Authorization() //basic authorization store data.
        },


        // Tracking Application Modules
        // ----------------------------
        // Model for holding application information and controller references/state
        // A controller not defined here can still be initialized on route match, but will
        // not populate in sidebar or any other menu referencing below application modules,
        // will not be held applicable to claims (unless specifically handled elsewhere),
        // and will not persist (when user navigates away from module).
        // TODO - double check undeclared modules do not hold references/are disposed properly
        info: new Modules({
            home: 'enterprise', // Default 'index' - router will navigate to this module if no route defined
            modules: new Backbone.Collection([{
                name: 'Login', // Displayed where module info rendered in UI (ex: #sidebar)
                url: 'auth', // Route to this controller, ie https://www.example.com/app.root/#auth
                display: false, // Whether to display where module info rendered in UI (ex: #sidebar)
                active: true, // True if the currently active controller/route
                persist: false, // If false will be disposed on route change (requiring re-initialization)
                access: true // Updated on user.login(), defines user access to module 
                // TODO - implement/check implementation of usage of access flag above
            }, {
                name: 'Enterprise Manager',
                url: 'enterprise',
                display: true,
                active: false,
                persist: false,
                access: false
            }, {
                name: 'User Manager',
                url: 'user',
                display: true,
                active: false,
                persist: false,
                access: false
            }, {
                name: 'Account Manager',
                url: 'account',
                display: false,
                active: false,
                persist: false,
                access: true
            }, {
                name: 'Appointment Manager',
                url: 'appointment',
                display: false,
                active: false,
                persist: false,
                access: false
            }, {
                name: 'Activity Monitor',
                url: 'activity',
                display: true,
                active: true,
                persist: false,
                access: true
            }, {
                name: 'Awesome Sauce', // Former Queue Manager module
                url: 'rules',
                display: false,
                active: false,
                persist: false,
                access: false
            }, {
                name: 'Media Manager',
                url: 'media',
                display: false,
                active: false,
                persist: false,
                access: false
            }, {
                name: 'Queue',
                url: 'queue',
                display: false,
                active: false,
                persist: false,
                access: true
            }])
        })
    });

    return app;
});