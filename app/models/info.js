/* global define, console, $ */
define([
    'underscore',
    'backbone',
    'nested'
], function(_, Backbone) {
    "use strict";

    var Info = Backbone.NestedModel.extend( /** @lends Info.prototype */ {

        /**
         * @class Info Describes application modules, renders application modules.
         *
         * @augments Backbone.Model
         * @constructs
         * @requires Backbone
         *
         * @param {object} options - Backbone.Model options
         * @property {object} defaults - Module Default Attributes
         * @property {string} defaults.home - Default module
         * @property {string} defaults.active - Currently active module
         * @property {Collection} defaults.modules - Registered App Modules
         * @property {string} defaults.modules.name - Module name (display name)
         * @property {string} defaults.modules.url - URl route and used by all get/set functions
         * @property {Boolean} defaults.modules.display - If this module should display in applicable views (ex: sidebar)
         * @property {Boolean} defaults.modules.active - If this is the currently rendered module
         * @property {Controller} defaults.modules._controller - Reference to module {@link Controller Controller} definition
         * @property {Controller} defaults.modules.controller - Reference to module {@link Controller Controller} instance
         * @property {Collection} defaults.modules.persist - Is module eligible for garbage collection
         * @property {Collection} defaults.modules.access - Does {@link User User} have access?
         */
        initialize: function(attributes, options) {
            _.bindAll(this, 'getModule', 'getController', 'getActive', 'setActive',
                'applyClaimsAccess', 'renderModule', 'recycle', 'cleanViews', 'getGrids');

            this.listenTo(Backbone.EventBroker, 'user:login', function(user) {
                this.applyClaimsAccess(user.get('claims'));
            });
        },

        title: 'Application Info Module',

        defaults: {
            home: 'index',
            active: null,
            modules: new Backbone.Collection()
        },

        // Helper Functions
        // ----------------

        /**
         * Helper function for retrieving a module object
         * @param {string} arg - module URL or Name
         * @returns {object|Boolean} - Returns fetched module or false if module not found
         */
        getModule: function(arg) {
            if (!arg) return false;
            var module = false;
            var modules = this.get('modules');
            module = modules.findWhere({
                url: arg
            });
            if (!module) module = modules.findWhere({
                name: arg
            });
            return (module) ? module : false;
        },

        /** 
         * Helper for grabbing currently rendered grids in the app
         * @returns {Array.<Backbone.Model>} grids - an array of grid models
         */
        getGrids: function() {
            var grids = [];
            var layout = this.getController(this.get('active')).get('layout');
            if (layout) {
                var views = layout.getViews()._wrapped;
                for (var v = 0; v < views.length; v++) {
                    if (views[v].grid) grids.push(views[v].grid);
                }
            }
            return grids;
        },

        /**
         * Helper function for retrieving a controller for a module
         * @param {string} arg - module URL or Name
         * @returns {object|Boolean} - Returns fetched controller or false if controller not found
         */
        getController: function(arg) {
            if (!arg) return false;
            var controller = false;
            var module = this.getModule(arg);
            if (module) controller = module.get('controller');
            return (controller) ? controller : false;
        },

        /**
         * Returns the currently active module object
         * @returns {object|Boolean} - Currently active/rendered module object, or false if no module is active
         */
        getActive: function() {
            var active = this.get('modules').findWhere({
                active: true
            });
            return (active) ? active : false;
        },

        /**
         * Set a module as the currently active module.  Function primarily serves as a helper, but may be called
         * externally where a module render call is used (ex: {@link Router Router})
         * @param {string|Boolean} url - Module URL.  If false, will set all modules to inactive.
         */
        setActive: function(url) {
            var active, modules = this.get('modules');
            // this.get('active') serves as a shortcut for discovering currently active module
            this.set('active', url);
            for (var i = 0; i < modules.models.length; i++) {
                active = (modules.models[i].get('url') == url) ? true : false;
                modules.models[i].set({
                    active: active
                });
            }
        },

        /**
         * Apply claims data (update 'access' prop) to tracked modules.  This function fires when "user:login" event is triggered.
         * @param {object} claims - Claims object passed in from the "user:login" event.  See {@link User User}.
         */
        applyClaimsAccess: function(claims) {      
            var modules = this.get('modules');      
            $.each(claims, function(key, value) {
                var module = modules.findWhere({
                    name: value.ClaimType
                });        
                if (module) module.set('access', true);      
            });    
        },

        // Module Rendering
        // ----------------

        /**
         * Primary rendering function.  Initializes controller (with action argument) for applicable module (triggering render),
         * or retrieves applicable module controller and launches referenced action (triggering render).
         * Sets the currently active module to the module referenced.
         * TODO : Update this with view disposal for previous module
         * @param {object} args - Args object containing parameters and arguments with which to launch {@link Controller Controller} and action.
         * @param {string} args.url - Module URL
         * @param {Controller} [args._controller] - Definition of a {@link Controller Controller}.
         * Optional only if module.get('_controller') returns {@link Controller Controller} instance.
         * @param {string} [args.action] - {@link Controller Controller} action to fire - if null, will utilize controller.get('index')
         * @param {object} [args.args] - Key/value object with arguments to be passed to {@link Controller Controller}/action.
         *
         * @returns {object|Boolean} - Returns module object or false if function failed to find module, controller, or action
         */
        renderModule: function(args) {
            // Check we have a module/controller to call first
            var module = this.getModule(args.url);
            if (!module) return false;
            var Controller = module.get('controller');

            // If the transitioning controller is not the current controller, clear the entityManager
            // Persistant modules should be using app.api.persistentManager (by default when using .get)
            // Entity data is only cleared at controller change (not action change)
            if (this.get('active') != args.url) {

                app.api.clear(app.api.manager);
            }

            // If not initialized, initialize the module (which will call render) by creating its controller
            if (!Controller) {
                // A controller definition is required to initialize!
                // If not in args, check for a stored definition on the module
                Controller = (args._controller) ? args._controller : module.get('_controller');
                if (!Controller) return false;

                // Remove view for any existing module that is not our current module
                this.cleanViews();

                // Setup options object to pass to the controller for initialization
                var ini = {
                    url: args.url
                };
                if (args.action) ini.action = args.action;
                if (args.args) ini.args = args.args;

                this.setActive(args.url);//***Need to check with Ben on this.

                // Update the module
                module.set({
                    // Initializing the controller will trigger render
                    controller: new Controller(ini),
                    _controller: Controller
                });
            } else {
                // The controller was previously initialized, and we have an active instanceof
                var action = (args.action) ? args.action : Controller.get('index');
                var actions = Controller.get('actions');
                // Check the requested action is valid
                if (actions[action] && _.isFunction(actions[action].fn)) {
                    var actionArgs = (args.args) ? args.args : {
                        _action: action
                    };
                    // Passing render = true to start action will force the controller layout to re-render.
                    // We only want to do this if this is not the currently active controller.
                    var active = this.getActive();
                    var render = (active && active.get('url') == args.url) ? false : true;

                    // Remove view for any existing module that is not our current module
                    if (render) this.cleanViews();

                    Controller.startAction(action, render);
                    actions[action].fn(actionArgs);
                } else return false;
            }

            this.setActive(args.url);
            this.recycle();
            return module;
        },

        // Garbage Collection
        // ---------

        /**
         * Controller view disposal
         */
        cleanViews: function() {
            var oldController = this.getController(this.get('active'));
            var oldLayout = (oldController) ? oldController.get('layout') : null;
            if (oldController && oldLayout) {
                var reset = $('<' + ((oldLayout.tagName) ? oldLayout.tagName : 'div') + ' id="main_content">');
                if (oldLayout.className) reset.addClass(oldLayout.className);
                var parent = oldLayout.$el.parent();
                oldLayout.remove();
                oldController.set('layout', null);
                parent.append(reset);
            }
        },

        /**
         * Controller Disposal.
         */
        recycle: function() {
            var trash = this.get('modules').where({
                active: false,
                persist: false
            });
            for (var can = 0; can < trash.length; can++) {
                var controller = trash[can].get('controller');
                if (controller) {
                    controller.dispose();
                    trash[can].unset('controller');
                }
            }
        }

    });

    return Info;
});