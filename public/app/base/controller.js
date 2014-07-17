/* global define, app, $ */
define([
    'underscore',
    'backbone',
    'knockback',
    'base/view',
    'views/shared/submenu_view',
    'text!templates/shared/layout_controller.html',
    'queryengine',
    'layoutmanager'
], function(_, Backbone, kb, View, SubmenuView, layout_template) {
    "use strict";

    var Controller = Backbone.Model.extend( /** @lends Controller.prototype */ {
        /**
         * @class Controller The base controller class from which all controllers extend.  Provides methods for managing views, layouts,
         * accessing data in and across views, and handling route actions.  Controllers are initialized within {@link Info Info} model or
         * within {@link Router Router} on route match.  Controller information for an extand module is available through {@link Info Info}.
         *
         * @augments Backbone.Model
         * @constructs
         * @requires Backbone
         * @param {object} [attributes] - Attributes to be set on the controller
         * @param {object} [options] - Backbone.Model options
         *
         * @property {object} defaults - Technically, defaults are not used (extending a controller with new defaults would override these defaults).
         * Rather, the following default properties are set during initialization if a value for the given property is not present.
         * @property {string} defaults.title - Title is displayed in default controller layout template
         * @property {string} defaults.index - The default action to fire if not action is matched on a route
         * @property {string} defaults.views - Key/value object referencing persisted views on this controller
         * @property {Collection} defaults.menu_actions - A helper collection built from actions, buitl for and consumed by the menu view
         * @property {View} defaults._layout - A view defintion to for this controller's layout.
         * @property {object} actions - Actions available via route match for this controller
         * @property {string} [actions.name] - If a name is present, this name will be displayed in the menu view, linking to this action
         * @property {Function} [actions.isVisible] - Whenever the menu is rendered, this will evaluate (function needs to returns boolean).
         * If the function returns false, this menu action will not be rendered in the menu view (and will render with a result of true.)
         * @property {Function} actions.fn - The function that fires when an action route is matched.  URL args are passed in as 'args'
         * @property {text} template - Reference to the template file to use for controller layout
         * @property {String} currentAction - current action for this controller
         * @property {Array.<String>} lockedViews - Views (by zone selector), that should persist through the controller's rendered lifecycle (will not be cleaned until layout removed)
         */
        initialize: function(attributes, options) {
            _.bindAll(this, 'setView', 'getView', 'renderLayout', 'verifyAction',
                'buildMenuActions', '_prepActions', 'startAction',
                'start', 'dispose', 'cleanViews');
            // Bind actions.isVisible functions to this controller context

            // Setup Controller 'Defaults'
            // ---------------------------

            // Set defaults manually, allows for easier overriding of defaults
            this.set({
                "views": (this.get("views")) ? this.get("views") : {},
                "index": (this.get("index")) ? this.get("index") : 'index',
                "template": (this.get("template")) ? this.get("template") : layout_template,
                "title": this.title,
                "actions": (this.get("actions")) ? this.get("actions") : {},
                "lockedViews": (this.get("lockedViews")) ? this.get("lockedViews") : ['menu'],
                "menu_actions": new Backbone.Collection([]),
            }, {
                silent: true
            });

            this._prepActions();
            var _this = this;

            // If a _layout was not passed in, use a default setup.  We only want to call this as needed,
            // as it creates an instance of a sub menu view by default.
            if (!this.get('_layout')) {
                this.set('_layout', View.extend({
                    el: "#main_content",
                    template: _.template(this.get('template')),
                    renderComplete: function() {
                        this.setView(".menu", new SubmenuView({
                            model: _this
                        })).render();
                    },
                    createViewModel: function() {
                        return {};
                    } // By default no observeables used
                }));
            }

            // Controller specific initialization
            // ----------------------------------

            // "Post Initialization".
            // Any logic specific to controller initialization is initiated here.
            this.start(attributes, options);

            // Controller layout rendering
            // ---------------------

            // Helper for submenuView actions
            this.buildMenuActions(attributes);
            // Render this._layout
            // TODO : add a setLayout function that initializes but does not immediately render
            this.renderLayout();

            // By default fire home action if no action passed in
            var args = this.get('args');
            if (args && args._action) this.set('action', args._action);
            var action = (this.verifyAction(this.get('action'))) ? this.get('action') : this.get('index');
            var actions = this.get('actions');

            // If the action is valid, fire it.
            if (action && actions[action] && _.isFunction(actions[action].fn)) {
                var actionArgs = (attributes.args) ? attributes.args : {
                    _action: action
                };
                // Always preface an action fire with startAction to properly update/track actions for the controller
                this.startAction(action);
                actions[action].fn(actionArgs);
            }
        },

        title: "",

        /**
         * Performs requested action
         * @params {String} action - action name
         * @params {Object} args - arguments to pass to function
         */
        go: function(action, args) {
            if (this.verifyAction(action)) {
                this.startAction(action);
                this.get('actions')[action].fn(args);
            }
        },

        /**
         * Verify that an action method is available for this controller
         * @param {String} action - The action to be verified
         * @returns {Boolean} True if verfied, false if not
         */
        verifyAction: function(action) {
            var actions = this.get('actions');
            if (action && actions[action] && _.isFunction(actions[action].fn)) return true;
            else return false;
        },

        /**
         * Binds controller actions to controller context.
         * @private
         */
        _prepActions: function() {
            var _this = this;
            var actions = $.extend(true, {}, this.get('actions'));
            $.each(actions, function(k, v) {
                v.fn = _.bind(v.fn, _this);
                if (v.isVisible) v.isVisible = _.bind(v.isVisible, _this);
            });
            this.set('actions', actions);
        },

        /**
         * Empty placeholder.  Override start in an implementation to add 'initialization' logic for that implementation
         * @param {object} attributes - Attributes passed into initialize
         * @param {object} options - Options passed into initialize
         */
        start: function(attributes, options) {},

        /**
         * Builds/Updates menu actions (that are bound to the sub menu view). Updates this.get('menu_actions').
         * Call this function as needed to re-initialize menu actions (for example if logic is involved in hiding an action).
         * @param {object} [attributes] - Attributes passed in from initialize.
         * @param {string} [attributes.action] - If an action passed in, it will be flagged as active
         */
        buildMenuActions: function() {
            var _this = this;
            var menu_actions = [];
            $.each(this.get('actions'), function(k, v) {
                if (v.name) {
                    if (!v.isVisible || v.isVisible && v.isVisible() === true) {
                        var action = {
                            name: v.name,
                            action: k,
                            active: false
                        };
                        if (_this.get('currentAction') == k) action.active = true;
                        menu_actions.push(action);
                    }
                }
            });
            this.get('menu_actions').reset(menu_actions);
        },

        /**
         * Render this controllers layout.  Called by default on Initialization (TODO: udpate initialization to be able to supress this).
         * References this.get('layout') to re-render an extant layout, or if not found, uses this.get('_layout') for a definition of the layout to render.
         */
        renderLayout: function() {
            var layout = this.get('layout');
            // If layout exists, just re-render the layout.  Make sure to re-set the element (setElement)
            // for all bindings to work properly.
            if (layout) {
                layout.setElement($('#' + layout.el.id));
                layout.render();
            } else {
                // Get our layout definition and render it, passing the view as a value to this.get('layout')
                var Layout = this.get('_layout');
                this.set('layout', new Layout().render());
            }
        },

        /**
         * Initialization for an action.  Fire this before executing an action function.
         * TODO : Update this to also fire the action, precluding the need for a call to this and the action in places like {@link Router Router}.
         * @param {string} action - The action to be fired
         * @param {boolean} render - If true, the controller layout will re-render
         */
        startAction: function(action, render) {
            app.api.manager.rejectChanges();
            this.set('currentAction', action);
            this.buildMenuActions({
                action: action
            });
            if (render) this.renderLayout();
        },

        /**
         * Removes and cleans up specified views
         * @params {String|Array.<String>} views - zone selector(s) for views to be removed
         * @returns {Controller} the controller for htis context
         */
        cleanViews: function(views) {
            var _this = this;
            var layout = this.get('layout');
            if (!views) {
                layout.removeView(function(view) {
                    if (_.intersection(view.$el.parent().prop('class').split(' '), _this.get('lockedViews')).length == 0) {
                        return view;
                    }
                });
                return this;
            }

            if (!views.length) views = [views];
            for (var v = 0; v < views.length; v++) {
                layout.removeView(views[v]);
            }
            return this;
        },

        /**
         * Primary method for rendering a view from the controller. Removes the current view, retrieves persisted view if found or initializes
         * a new view if view definition passed.
         * @param {object|string|View} args - Options relating to the view to be rendered,
         * or the name of a persisted view to render,
         * or a definition of view to render.
         *
         * @param {string} [args.zone=.content] - Zone to set this view on.  Only applicable if using a custom controller layout with more zones.
         * @param {View} [args.view] - A definition of the view to be set (used if the view is not persisted/initialized).
         * @param {Model} [args.model] - A Backbone.Model passed to this.getView() (for view initialization if applicable)
         * @param {object} [args.options] - Options passed through to this.getView() (for view initialization if applicable)
         */
        setView: function(args) {
            var name = (_.isObject(args)) ? args.name : args;
            var zone = (args.zone) ? args.zone : '.content';
            var layout = this.get('layout');
            layout.removeView(zone);
            var view = this.getView(name);
            if (view) {
                // View exists, updated dom Node so bindings properly update and set the view
                view.resetElement(layout.$el.find(zone));
                layout.setView(zone, view).render();
            } else {
                view = (args.view) ? args.view : args;
                var options = (args.options) ? args.options : null;
                view = this.getView(name, view, args.model, options);
                layout.setView(zone, view).render();
            }
        },

        /**
         * Accessor for retrieving/initializing views.  If the view is currently active or persisted in this.get('views'),
         * that view object will be returned.  Otherwise, a new view object will be created from the definition passed in and returned.
         *
         * @returns {View|Boolean} View Object to be consumed by setView or other methods. Returns false if no view found and no view passed in.
         *
         * @param {string} [name] - The name of the view, only needed if you plan on persisting the view.
         * @param {View} [View] - A definition of the view.  If you are only checking on the existance of an existing view, this would be optional.
         * @param {Model} [model] - A model to pass to view initialization, should the view need to be initialized.
         * @param {object} [options] - Backbone.View options to be passed to the view should the view need to be initialized.
         */
        getView: function(name, View, model, options) {
            var views = this.get('views');
            if (typeof views[name] == 'undefined') {
                if (View) {
                    var newView;
                    if (_.isFunction(View)) {
                        // A view definition has been passed in.
                        // Consolidate arguments into single object of options for the view.
                        var newOptions = (options) ? options : {};
                        if (model) newOptions.model = model;
                        newView = new View(newOptions);
                    } else {
                        newView = View;
                    }

                    // Track the view if a name was passed
                    if (name) {
                        var updateViews = $.extend({}, true, views);
                        updateViews[name] = newView;
                        this.set('views', updateViews);
                    }
                    return newView;
                } else {
                    return false;
                }
            } else {
                return views[name];
            }
        },

        /**
         * Dispose function to clean up the controller.
         * TODO : Implement this.  Will be called primarily from {@link Info Info}.
         */
        dispose: function() {
            if (this._disposed) return true;
            //this.get('layout').remove();
            var _this = this;
            this.stopListening();
            $.each(this.attributes, function(key, value) {
                var get = _this.get(key);
                if (get && get.off) get.off();
                if (get && get.stopListening) get.stopListening();
                if (get && get.dispose) get.dispose();
                //else if (get && get.remove) get.remove();
            });
            this.off();
            this.clear();
        },

    });

    return Controller;
});