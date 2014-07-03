/* global define, app, console, $ */
define([
    'underscore',
    'backbone',
    'knockback',
    'knockout',
    'lib/vmUtils',
    'layoutmanager'
], function(_, Backbone, kb, ko, vmUtils) {
    "use strict";

    var BaseView = Backbone.Layout.extend( /** @lends BaseView.prototype */ {
        /**
         * @class BaseView Base view that handles the relationships between knockout/knockback/backbone
         * and in some cases Breeze.  Use as a base and overwrite/extend as needed.
         *
         * @augments Backbone.View
         * @constructs
         * @requires Backbone
         * @param {object} options - Backbone.View options
         *
         * @property {boolean} kobBindingsApplied - If KO bindings have been applied
         * @property {object|Function} [vm_model_context] - An object or function returning an object which is a nested property on this.model to be used
         * as the basis for creating this viewModel.
         * @property {object} [vm_model_context_options] - Options relating to creation of vm_context_model
         * @property {array} [vm_model_context_options.related] - References to related models to be tracked by this.vm_context_model
         * @property {Model} [vm_context_model] - Backbone.Model created during _creatViewModel if this.vm_model_context exists.
         * Scopes in the context of the viewModel.
         * @property {string} [address] - If model is a nested model, and using context model functionality, address tracks path to context model on parent model
         * @property {object} [breezeQuery] - A breeze query to be applied, the resulting model will be used on the view.
         * @property {array} [_modelListeners] - An array of subscriptions to be applied to this.model
         * @property {string} [_modelListeners.eventType] - Backbone event type
         * @property {string} [_modelListeners.trigger] - Backbone trigger type
         * @property {Function} [_modelListeners.callback] - Callback to fire when triggered
         * @property {object} [_modelListeners.context] - Context to apply to the callback
         */
        initialize: function(options) {
            _.bindAll(this, 'createViewModel', '_createViewModel', '_createViewModelHelper',
                'setViewModel', 'updateViewModel', 'getViewModel',
                '_updateContextModel', '_contextModelListen', '_getAddress',
                'setModel', '_breezeCallback', '_applyModelListeners',
                'resetBindings', 'renderBindings', 'cleanup',
                'trackValidation', 'renderComplete', 'start',
                'dispose', 'cleanup', '_cleanup');

            this.utils = new vmUtils();

            // Setup a tracker for whether or not ko bindings have been applied,
            // they can only be applied once or they throw an error.
            this.koBindingsApplied = false;

            // Post 'initialization'. 
            this.start(options);

            if (this.model) {
                // If model is not a properly setup backbone model, set it up
                if (!this.model.on) this.model = new Backbone.Model(this.model);

                // Setup any listeners being passed in
                if (options && options._modelListeners) {
                    this._modelListeners = options._modelListeners;
                    this._applyModelListeners();
                }

                // When the model syncs, we want to updat the view model and 
                // force a new render in order to ensure viewModel bindings are updated.
                this.model.on('sync', function() {
                    this.updateViewModel(true);
                }, this);
            }

            // ViewModel Creation
            // ------------------

            // Setup the viewModel
            try {
                this.setViewModel(options);
            } catch (err) {
                console.log('During view initialization viewModel creation failed: ' + err);
            }

            // Breeze Integration
            // ------------------

            // Use breezeQuery if you want to dynamically grab an entity for the view.
            // This view will sync/create view model when the breeze query resolves.

            // breezeQuery is not a standard option, but this allows us to treat it like one!
            if (options && options.breezeQuery) this.breezeQuery = options.breezeQuery;
            if (this.breezeQuery) {
                // You WILL get a console error when the view first resolves though.
                // TODO : update how bindings render to defer until callback. (to avoid console error)
                app.api.get(this.breezeQuery, {
                    callback: this._breezeCallback
                });
            }

        },

        _modelListeners: [],

        /**
         * Empty start function.  Intended to be overriden for custom logics when extending this View
         * @param {object} options - Same options passed into this.initialize
         */
        start: function(options) {},

        // View API
        // --------

        /**
         * Implementation of internal methods for cleanup.
         * @private
         */
        _cleanup: function() {
            this.$el.find("*").each(function() {
                $(this).unbind();
            });

            this.stopListening();
            this.off(null, null, null);

            // TODO check this to happen automatically on removal, check nested layouts

            //if(this.viewModel) kb.releaseOnNodeRemove(this.viewModel, this.$el);
            if (this.viewModel && this.viewModel.__kb) kb.release(this.viewModel);
            // Remove KO subscriptions and references
            //if (this.koBindingsApplied === false) ko.removeNode(this.$el[0]);
            ko.cleanNode(this.$el[0]);
            ko.removeNode(this.$el[0]);
            this.viewModel = null;
        },

        /**
         * Cleans up event bindings and viewModel.  Used by layout manager
         */
        cleanup: function(args) {
            this._cleanup();
        },

        /**
         * Removes the view from dom, cleans up ko bindings and event bindings
         */
        dispose: function() {
            this.cleanup();
            this.remove();
        },

        /**
         * Getter/Initializer for viewModel.  Will return this viewmodel (if this.viewModel has not
         * yet been created, it will be created and returned)
         * @returns {object} ViewModel utilized by this view.
         */
        getViewModel: function() {
            return (!this.viewModel) ? this.createViewModel(this.options) : this.viewModel;
        },

        /**
         * Re-sets this view to the DOM. If a view is persisted, re-rendering the view can break bindings
         * unless the view $el is updated to be associated with its new DOM parent.
         * @param {object} element - jQuery Object referencing parent node to set this view on
         */
        resetElement: function(element) {
            var reset = $('<' + ((this.tagName) ? this.tagName : 'div') + '>');
            if (this.className) reset.addClass(this.className);
            element = element instanceof Backbone.$ ? element : Backbone.$(element);
            element.append(reset);
            this.setElement(reset);
        },

        /**
         * Setup a subscription to an event occurring on this.model.
         * Can be called in advance of setting up a model on the view.
         *
         * @param {string} eventType - Backbone event type
         * @param {string} trigger - Backbone event trigger type
         * @param {Function} callback - Callback to fire on event trigger
         * @param {object} context - Context within which to fire callback
         */
        subscribe: function(eventType, trigger, callback, context) {
            if (this.model) this.model[eventType](trigger, callback, context);
            else this._modelListeners.push({
                eventType: eventType,
                trigger: trigger,
                callback: callback,
                context: context
            });
        },

        /**
         * Set a model (or new model) on this view.  Destroys existing model, sets up subscriptions, and re-creates the viewModel.
         * @returns {View} This view.
         * @param {Model} model - Backbone.Model to set on this view
         * @param {Function} callback - callback to fire after model has been applied.
         */
        setModel: function(model, callback) {
            this.model.destroy();
            this.model = model;
            this.setViewModel();
            this._applyModelListeners();
            this.model.on('sync', function() {
                this.updateViewModel(true);
            });
            if (callback) callback();
            return this;
        },

        /**
         * Triggers an update of the viewModel.
         * @param {boolean} render - If true, a re-render of the view will be forced.
         */
        updateViewModel: function(render) {
            this.setViewModel();
            return (render) ? this.render() : true;
        },

        /**
         * Setup a viewModel on this view.
         * TODO : Update this to allow a viewModel to be passed in to override existing viewModel
         * @param {object} options - Backbone.View/View options (same parameters as used in initializaiton)
         */
        setViewModel: function(options) {
            this.viewModel = this.createViewModel(options);
            if (this.model) this.viewModel.model = (this.vm_context_model) ? this.vm_context_model : this.model;
        },

        /**
         * Applies knockout bindings if a model is present and they have not yet been applied.  If bindings have been applied
         * and this is being called again (for example on a re-render), the bindings will be reset.
         */
        renderBindings: function() {
            if (this.koBindingsApplied === false) {
                //Knockback initializes here
                if (!_.isEmpty(this.viewModel)) {
                    try {
                        ko.applyBindings(this.viewModel, this.$el[0]);
                    } catch (err) {
                        this.resetBindings();
                    }
                    this.koBindingsApplied = true;
                    kb.releaseOnNodeRemove(this.viewModel, this.$el[0]);
                    this.trigger('bindingsApplied', this);
                }
            } else {
                if (!_.isEmpty(this.viewModel)) {
                    this.resetBindings();
                    this.trigger('bindingsApplied', this);
                }
            }
        },


        // Validation 
        // ----------

        /**
         * Called to begin tracking client side validation for forms.  Uses jQuery Validate.
         * We can use this area to setup application wide validation rule defaults
         * extend one or the other (defaults or passed in rules) tbd
         * ref: http://jqueryvalidation.org/jQuery.validator.addClassRules/
         * @param {object} options - jQuery validate options
         */
        trackValidation: function(options) {
            // This can give us a common place to setup default validation options.
            options = (options) ? options : {};
            this.$el.find('form').validate(options);
        },

        // Primary Functions (for extending/overwriting)
        // ---------------------------------------------

        /**
         * This function creates the viewModel.  By default utilizes this._createViewModel, but should be
         * overwritten to accomodate the needs of the view.
         * @returns {object} viewModel or empty object if no model present (!this.model)
         * @param {object} options - options passed to the View
         */
        createViewModel: function(options) {
            if (this.model) return this._createViewModel(options);
            else return {};
        },

        /**
         * Placeholder function, designed to be overwritten to accomodate specific view needs.
         * This fires after the afterRender function fires (which applies view bindings)
         */
        renderComplete: function() {},

        /**
         * Placeholder function, designed to be overwritten to accomodate specific view needs.
         * This fires just before the view is actually rendered.
         */
        beforeRender: function() {},

        // Internal Functions/Helpers
        // --------------------------

        /**
         * Callback function to apply a retrieved entity as the model for this view.
         * Triggers this.afterRender().
         * @private
         * @param {object} data - JSON result object passed from breeze
         */
        _breezeCallback: function(data) {
            if (data.results) {
                this.setModel(data.results[0]);
                this.afterRender();
            }
        },

        /**
         * Updates this.model when this.vm_context_model is updated. Requires usage of nested model extension on this.model
         * @private
         * @param {object} event - Backbone.Model change event
         */
        _updateContextModel: function(event) {
            var vm_model_context = (_.isFunction(this.vm_model_context)) ? this.vm_model_context(this.model) : this.vm_model_context;
            var address = this._getAddress();
            var _this = this;
            //This shouldnt set change if the props are unchanged (initialization)
            if (address && this.model && _.isEqual(this.model.get(address), event.changed)) return false;
            $.each(event.changed, function(k, v) {
                if (_this.address && _this.model) {
                    _this.model.set(address + '.' + k, v);
                } else vm_model_context[k] = v;
            });
        },

        /**
         * Listens for changes on this.model in order to apply updates to this.vm_context_model. Requires this.model to utilize backbone.nestedModel
         * @private
         * @param {object} event - Backbone.Model change event
         */
        _contextModelListen: function(event) {
            var address = this._getAddress();
            var changed = event.changedAttributes();
            var _this = this;
            for (var key in changed) {
                if (changed.hasOwnProperty(key)) {
                    if (key == address) {
                        var props = this.vm_context_model.attributes;
                        var changedAttributes = {};
                        $.each(changed[key], function(key, value) {
                            if (_this.exclusions.length <= 0 || $.inArray(key, _this.exclusions) < 0) {
                                if (_.isObject(value)) {
                                    if (!_.isEqual(value, props[key])) changedAttributes[key] = value;
                                } else {
                                    // Excluded props will by default not be recognized
                                    if (typeof props[key] != 'undefined' && (value != props[key])) changedAttributes[key] = value;
                                }
                            }
                        });
                        if (!_.isEmpty(changedAttributes)) this.vm_context_model.set(changedAttributes);
                    }
                }
            }
        },

        /**
         * Helper for context view model to access the address property.
         * @private
         */
        _getAddress: function() {
            if (this.address) return (this.address && _.isFunction(this.address)) ? this.address() : this.address;
            else return false;
        },

        /**
         * Recursive helper for this._createViewModel. Will look through passed in properties
         * to for simple arrays in order to set up proper knockback collectionObserveables.
         * @private
         * @param {string} key - The name of the property
         * @param {string} prop - The property to investigate
         * @param {object} viewModel - This viewModel
         * @param {string} traversed - Tracks properties that have been traversed (used within recursion only)
         */
        _createViewModelHelper: function(key, prop, viewModel, traversed) {
            if (!prop) return false;
            var attr, _this = this;

            // Is prop a collection? If so, investigate collection models for simple arrays.
            if (prop && prop.models) {
                // Right now this will only go through backbone collections
                // until it is necessary we should skip queryengines - they should
                // not be used in a viewModel context (tentative)
                if (viewModel[key]().forEach) {
                    viewModel[key]().forEach(function(nestedViewModel) {
                        if (nestedViewModel.model) {
                            attr = nestedViewModel.model().attributes;
                            $.each(attr, function(key, value) {
                                _this._createViewModelHelper(key, value, nestedViewModel, traversed);
                            });
                        }
                    });
                }
            } else if (_.isArray(prop)) {
                // So the property is an array.  Setup a collection and subscriptions so we can have
                // a functional kb.collectionObserveable for our viewModel!
                var collection = new Backbone.Collection(prop);
                viewModel[key] = kb.collectionObservable(collection);

                if (prop.arrayChanged) {
                    prop.arrayChanged.subscribe(
                        function(arrayChangedArgs) {
                            var addedEntities = arrayChangedArgs.added;
                            if (addedEntities) {
                                collection.add(addedEntities);
                            }
                            var removedEntities = arrayChangedArgs.removed;
                            if (removedEntities) collection.remove(removedEntities);
                        });
                }

                // Now that we have that one setup, dig deeper!
                viewModel[key]().forEach(function(nestedViewModel) {
                    if (nestedViewModel.model) {
                        attr = nestedViewModel.model().attributes;
                        $.each(attr, function(key, value) {
                            _this._createViewModelHelper(key, value, nestedViewModel, traversed);
                        });
                    }
                });

            } else if (prop && prop.attributes) {
                // This property is a model.  Track traversed so we dont get caught in an infinite loop for those entities with 
                // self-referencing properties.
                traversed = (traversed) ? traversed : [];
                if ($.inArray(prop.cid, traversed) < 0) {
                    traversed.push(prop.cid);
                    // Go deeper into this nested model looking for simple arrays.
                    var nestedViewModel = (viewModel[key] && viewModel[key].value && _.isFunction(viewModel[key])) ? viewModel[key]() : viewModel[key];
                    if (nestedViewModel) {
                        $.each(prop.attributes, function(key, value) {
                            _this._createViewModelHelper(key, value, nestedViewModel, traversed);
                        });
                    }
                }
            }
        },

        /**
         * Default function for creating the viewModel.  Will convert this.model into a viewModel, converting any
         * simple arrays found into kb.collectionObserveables.
         * @private
         * @returns {object} ViewModel to be consumed by the view.
         * @param {object} [options] - Same initialization options passed to the view.  Also accepts Knockback options.
         * @param {object} [options.custom] - Key/value object with custom properties to be set on the viewModel
         */
        _createViewModel: function(options) {
            var model, _this = this;

            if (this.vm_model_context) {
                var vm_context_props = (_.isFunction(this.vm_model_context)) ? this.vm_model_context(this.model) : this.vm_model_context;
                // If the context model has not been setup yet, set it up with appropriate handlers
                if (!this.vm_context_model) {
                    this.vm_context_model = new Backbone.Model(vm_context_props);
                    // This will send updates to this.model
                    this.vm_context_model.on('change', this._updateContextModel);
                    // This will send this.model updates to this.vm_context_model
                    if (this.model) this.model.on('change', this._contextModelListen);
                    // More advanced option, pass in a references to related models
                    if (this.vm_model_context_options && this.vm_model_context_options.related) {
                        for (var i = 0; i < this.vm_model_context_options.related.length; i++) {
                            this.vm_model_context_options.related[i].on('change', function(e) {
                                _this._contextModelListen(e);
                            });
                        }
                    }
                } else {
                    // If the vm_context_model already exists, just re-populate it
                    this.vm_context_model.clear({
                        silent: true
                    });
                    this.vm_context_model.set(vm_context_props);
                }
                // Use this as the model to send to kb.viewModel()
                model = this.vm_context_model;
            } else {
                model = (this.model) ? this.model : null;
            }

            // Use the good ol' kb.ViewModel factory, passing in options
            var viewModel = kb.viewModel(model, options);

            // Helper below searches for nested arrays, creates backbone collectios
            // on those arrays to track changes, and creates viewModels from array models
            // - nested arrays are not by default handled by kb.viewModel (only bb collections)
            // - if the array is a breeze array, array update subscriptions are applied
            // - remember to apply array adds to the model property, not the viewModel array observable
            // TODO deprecate this.  It is too expensive as a default.  If the dev wants a trackable array, they can create that through utils and
            // add it to the viewModel.
            /*
            if (model) {
                $.each(model.attributes, function (key, value) {
                    _this._createViewModelHelper(key, value, viewModel);
                });
            }
            */

            // Setup custom properties on the viewModel if they have been passed in.
            // custom options passed as string (for property name) or {name:'string', value:val} 
            if (options && options.custom) {
                for (var c = 0; c < options.custom.length; c++) {
                    if (typeof options.custom[c] == 'string') viewModel[options.custom[c]] = ko.observable('');
                    else viewModel[options.custom[c].name] = ko.observable(options.custom[c].value);
                }
            }

            // Setup the reference to the viewModel and return it.
            this.viewModel = viewModel;
            return viewModel;
        },

        /**
         * References this._modelListeners to setup subscriptions on the model.
         * @private
         */
        _applyModelListeners: function() {
            if (this.model) {
                for (var i = 0; i < this._modelListeners.length; i++) {
                    var listener = this._modelListeners[i];
                    this.model[listener.eventType](listener.trigger, listener.callback, listener.context);
                }
            }
        },

        /**
         * Helper function for renderBindings.  Utilizes ko.cleanNode to clear bindings on this view,
         * then re-delegates events and re-applies ko bindings.
         * @private
         */
        resetBindings: function() {
            try {
                // unbind events
                this.$el.find("*").each(function() {
                    $(this).unbind();
                });

                // TODO address this pattern, better to perhaps look a the template patten
                try {
                    ko.cleanNode(this.$el[0]);
                } catch (err) {}
                // Need to reapply view events as cleanNode wipes those as well
                this.delegateEvents();
                if (!this.viewModel || this.viewModel.__kb_released === true) this.viewModel = this.createViewModel();
                ko.applyBindings(this.viewModel, this.$el[0]);
                kb.releaseOnNodeRemove(this.viewModel, this.$el[0]);
            } catch (err) {
                console.log(err);
            }
        },

        // Inherited from Backbone.LayoutManager
        // -------------------------------------

        /**
         * Function consumed by Backbone.Layout.  This function allows for a template
         * to be set as a string (ex: this.template = 'path/to/template.html')
         * @private
         * @param {string} path - the path to the template required
         */
        fetchTemplate: function(path) {
            var done = this.async();
            $.get(path, function(contents) {
                done(_.template(contents));
            }, "text");
        },

        /**
         * Inherited from Backbone.LayoutManager.  Applies knockout/event bindings.
         * Use this.renderComplete for custom after render functionality.
         * @private
         */
        afterRender: function() {
            this.renderBindings();
            this.renderComplete();
        }

    });

    return BaseView;
});