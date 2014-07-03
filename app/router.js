/* global define, console, $, document, app, require */
define([
    'underscore',
    'backbone',
    'base/view',
    'text!templates/shared/layout_main.html',
    'views/shared/sidebarMenu_view',
    'views/shared/locationsBreadcrumbs_view',
    'text!templates/shared/layout_generic.html',
    'views/shared/headerUser_view',
    'views/shared/warning_view',
    'views/shared/modal_view',
    'controllers/auth',
    'text!templates/shared/error.html'
], function(_, Backbone, View, layout_main, SidebarMenuView, LocationsBreadcrumbsView, layout_generic, HeaderUser, Warning, Modal, Login, error_template) {
    "use strict";

    var Router = Backbone.Router.extend( /** @lends Router.prototype */ {
        /**
         * @class Router handles all route matching, document ready .link event handlers,
         * sets basic layout (generic unless controller route is matched), and
         * initializes controllers on route match. Click <a href="tutorials/router.html">here</a> for a walk-through.
         *
         * @augments Backbone.Router
         * @requires Backbone
         * @constructs
         * @property {object} routes - Key/Value object defining route/function matches.
         */
        initialize: function() {

            // On route match, this.layouts is consulted to discover the current page layout, and determine if the page layout
            // for the route match requires rendering. 
            this.layouts = [];

            // Application Navigation
            // ----------------------

            // Apply event handlers to globally observe the ".link" class.
            // Make any item navigable by adding class "link".  
            // Use data-href and data-args tags to define navigation
            // (data-args are the variable query parameters for the URL)
            //
            // For instances wherein an anchor element should be disabled, apply ".noLink".
            $(document).ready(function() {

                $(document).on('click', '.noLink', function(e) {
                    e.preventDefault();
                });

                $(document).on('click', '.link', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var $this = $(e.currentTarget);
                    var data = $this.data();
                    var href = (data.href) ? data.href : $this.attr('href');
                    var args = (data.args) ? data.args : [];
                    app.router.go(href, args);
                });
            });
        },

        /**
         * Primary function for application navigation.
         * @param {string} href - link to the url you want to go, can contain parameters... just a regular URL
         * @param {object} [args] - Key/value object of URL parameters that will be appended to the route.
         */
        go: function(href, args) {
            return this.navigate(_.toArray(arguments).join("/"), true);
        },

        /**
         * Renders error page using 'app/templates/shared/error.html'
         * For router use only.  Utilize when route passed to default cannot be matched by a controller
         * @private
         */
        show404: function(error) {
            if (!error) error = "This application has encountered an error, please see your IT person.";
            app.info.setActive(false);
            this._setLayout({
                layout: View.extend({
                    el: "main",
                    template: _.template(error_template),
                    model: new Backbone.Model({
                        error: error
                    })
                })
            });
        },

        // Application Routing
        // -------------------

        // More routes can be configured, but should only be configured for special cases
        // the route/function below will match classical MVC style URLs
        // (ex: members/manage/memberId=123)
        routes: {
            "auth(/:action)*args": "login",
            "(:controller)(/:action)*args": "default"
        },

        // Application Route Functions
        // ---------------------------

        /**
         * Sets the layout for the login page and renders the 'login' module.
         * Utilizes {@link Info} to renderModule() after layout is set.
         */
        login: function(action, args) {
            var activeLayout = this._getActiveLayout();
            if (!activeLayout || activeLayout.name !== 'Login' || activeLayout.name === 'Login' && activeLayout.active === false) {
                this._setLayout({
                    name: 'Login',
                    layout: Backbone.Layout.extend({
                        el: "main",
                        template: _.template(layout_generic),
                    })
                });
            }

            // Defer to app.info module management for module rendering.
            app.info.renderModule({
                url: 'auth',
                action: (action) ? action : 'login',
                args: this._getArgs(args, action),
                _controller: Login
            });
        },

        // MVC Style Routing Handler
        // ------------------------

        /**
         * Default handler for MVC style routes.
         * If no module is matched, defers to {@link Info} for 'home' property to determine module.
         * Will initialize module (deferring to {@link Info} for module rendering) and trigger matched action (if any),
         * passing arguments to controller and action. Verifies user login before executing.
         *
         * @param {string} [module] - module 'url', see {@link Info} for module properties.
         * @param {string} [action] - module action to be fired. See {@link Controller} for details on actions.
         * @param {string} [args] - URL-encoded string of parameters passed from route match
         */
        default: function(module, action, args) {

            // Verify the user is logged in before even proceeding with any controller initialization
            if (app.user.verify() !== true) return this.go('auth');

            // Setup the 'Main' controller page layout (if not already setup and active)
            var activeLayout = this._getActiveLayout();
            if (!activeLayout || activeLayout.name !== 'Main' || activeLayout.name === 'Main' && activeLayout.active === false) {
                this._setLayout({
                    name: 'Main',
                    layout: Backbone.Layout.extend({
                        el: "main",
                        template: _.template(layout_main),
                        views: {
                            "#sidebar": new SidebarMenuView({
                                model: app.info
                            }),
                            "#locations_breadcrumbs": new LocationsBreadcrumbsView({
                                model: app.location
                            }),
                            "#header_user": new HeaderUser({
                                model: app.user
                            }),
                            '#peripheral': [new Modal(), new Warning()]
                        }
                    })
                });
            }

            // If not module was found in the route (ex: localhost/Ess.App/), defer to home default
            if (!module) module = app.info.get('home');

            // TODO setup navigation to default action on a controller (passing parameters) if no action defined

            // Defer module rendering to app.info (which tracks module status)
            if (!app.info.renderModule({
                url: module,
                args: this._getArgs(args, action),
                action: action
            })) {
                // However, if the module's controller script hasn't been loaded, or the module is not tracked
                // (i.e. not in the app.info.get('modules') collection) fall back to manually requiring/initializing controller.
                // Use a try statement here in the event that require.js has issues finding the applicable script.
                try {
                    // Setup our variables so that they are accessible in our require.js callback
                    var thisModule = module;
                    var thisAction = action;
                    var thisArgs = this._getArgs(args, action);

                    require(["/" + app.root + 'app/controllers/' + thisModule + ".js"], function(Controller) {
                        app.info.cleanViews();
                        app.info.setActive(thisModule);

                        // Controller now loaded. Initialize the controller, passing in route args.
                        // TODO port changes from home to pass in arguments to controller
                        var controller = new Controller({
                            url: thisModule,
                            args: thisArgs
                        });

                        // Update app.info with controller reference for tracking
                        var getModule = app.info.getModule(thisModule);
                        if (getModule) {
                            getModule.set({
                                _controller: Controller,
                                controller: controller
                            });
                        }


                        app.info.recycle();
                    });
                } catch (err) {
                    // TODO implement functionality for recycle.
                    this.show404();
                }
            }
        },


        // Internal Functions
        // ------------------

        // The following methods are all internal helper methods used by the router.
        /**
         * Helper function that returns the name of the currently active layout.
         * @private
         * @returns {Object|Boolean} Layout Name of currently active layout or false if no active layout.
         */
        _getActiveLayout: function() {
            for (var i = 0; i < this.layouts.length; i++) {
                var layout = this.layouts[i];
                if (layout.active === true) return layout;
            }
            return false;
        },

        /**
         * Sets page layout.  Will check against this.layouts to determine if requested layout has already been rendered.
         * If not, it will render the passed view (as well as update current status of other views tracked in this.layouts).
         * This function is designed to set only core or uppermost level layouts to be utilized by a suite of application methods
         * (such as controllers), or to easily define custom page layouts as needed (such as for a login page).
         *
         * @private
         * @param {object} args  - Object with information about layout to be rendered.
         * @param {string} [args.name] - The name of the layout, this will be checked against/inserted in this.layouts
         * @param {object} args.layout - instanceof Backbone.LayoutManager / Backbone.View / {@link View}
         */
        _setLayout: function(args) {
            // We want to track if args.name will need to be added to this.layouts for tracking
            var trackNew = true;
            var cleanup = [];
            // Native loops are faster than _.indexOf or $.inArray
            for (var i = 0; i < this.layouts.length; i++) {
                var layout = this.layouts[i];
                if (layout.name == args.name) {
                    trackNew = false;
                    // If args.layout is currently active, we will do nothing else,
                    // but we still need to finish our loop in order to make sure other layouts are inactive.
                    if (layout.active !== true) {
                        // args.layout is not currently rendered.
                        // We opt to create a new instance to keep things clean. 
                        if (layout.view) layout.view.remove();
                        layout.active = true;
                    }
                } else {
                    // Make sure all other layouts are marked as inactive.
                    layout.active = false;
                    if (layout.view) cleanup.push(layout);
                }
            }

            // Cleanup any old layouts
            for (var c = 0; c < cleanup.length; c++) {
                cleanup[c].view.remove();
                cleanup[c].view = null;
            }

            if ($('#main').length <= 0) $('body').append('<main id="main" role="main"></main>');

            // By default, if there is no args.name, or it wasn't found in this.layouts, we render args.layout.
            if (trackNew) {
                this.layouts.push({
                    name: args.name,
                    active: true,
                    view: new args.layout().render()
                });
            } else {
                this._getActiveLayout().view = new args.layout().render();
            }
        },

        /**
         * Helper for converting a url-encoded string of parameters into an object
         * @private
         * @param {string} args - URL encoded string of parameters (ex: "/testing=this&arg=123")
         * @param {string} [action] - Controller action name to add to returned object as '_action'
         * @returns {object} Key/Value pair converted from function arguments
         */
        _getArgs: function(args, action) {
            var argsObj = {};
            // Split up the arguments!
            if (args) {
                args = args.replace(/^\//, "").split("&");
                for (var i = 0; i < args.length; i++) {
                    //Need to check with Ben on this.
                    /* ORIGINAL CODE
                    //var arg = args[i].split("=");
                    //argsObj[arg[0]] = arg[1];
                    */

                    var j = args[i].indexOf("=");
                    var arg;
                    if (j == -1) {
                        arg = [args[i]];
                    } else {
                        arg = [args[i].substr(0, j), args[i].substr(j + 1)];
                    }
                    argsObj[arg[0]] = arg[1];
                }
            }
            // action is optional, but can be used as a shortcut (is used as a shortcut within this.default).
            if (action) argsObj._action = action;
            return argsObj;
        }



    });

    return Router;
});