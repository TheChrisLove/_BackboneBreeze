/* global define, app, $ */
/*  */
define([
    'underscore',
    'backbone',
    'base/view',
    'knockback',
    'knockout',
    'text!templates/shared/modal.html'
], function(_, Backbone, View, kb, ko, template) {
    "use strict";

    var Modal = View.extend( /** @lends Modal.prototype */ {
        /**
         * @class Modal Application modal.  Accessible from app.modal.  Use show() to bring up the modal with your options.
         *
         * @augments View
         * @constructs
         * @requires Backbone
         * @requires View
         * @param {object} options - Backbone.View options
         *
         * @property {Model} model - Backbone.Model tracking modal options.
         * @property {Boolean} [model.confirmbox=false] - If true, will use smaller confirm box.
         * @property {string} [model.title] - Title to display in title area of modal.
         * @property {string} [model.content] - Content to display in modal message body.
         * @property {string} [model.btnDefault="btn btn-primary"] - Default classes to apply to buttons with no classes property.
         * @property {boolean} [model.persist=false] - If false (default), any view passed to modal will be disposed on close.
         * @property {boolean} [model.noReject=false] - Suppress the call to rejectChanges() on modal close
         * @property {Collection} [model.buttons] - Backbone.Collection holding data for modal buttons.
         * @property {string} [model.buttons.name] - Display name for the button
         * @property {string} [model.buttons.classes] - Classes to apply to the button (ex: 'btn btn-warning')
         * @property {Function} [model.buttons.fn] - Function to fire when button is clicked.
         */
        start: function() {
            _.bindAll(this, '_modalOnClose', 'show', 'close', '_buttonClick');

            // Automatically applies default class for new buttons (if classes not defined)
            this.model.get('buttons').on('add reset', function(model) {
                // TODO : update buttons using default classes if default is changed
                // This function may fire on collection or model (add for model, rest for collection).
                // Check model case first.

                var buttons = (model.cid) ? [model] : model.models;

                // Fired for the reset event, apply defaults to each button if no classes defined.
                for (var i = 0; i < buttons.length; i++) {
                    var classes = (buttons[i].get('classes')) ? buttons[i].get('classes') : this.model.get('btnDefault');
                    var loadingText = (buttons[i].get('loadingtext')) ? buttons[i].get('loadingtext') : '';
                    buttons[i].set({
                        classes: classes,
                        loadingtext: loadingText
                    });
                }
            }, this);
        },

        template: _.template(template),

        /**
         * On render complete, modal subscribes to the modal close event to fire this._modalOnClose.
         * Also sets up a reference to itself on the app global.
         */
        renderComplete: function() {
            this.$el.find('.modal').on('hidden.bs.modal', this._modalOnClose);
            app.modal = this;
        },

        // Modal Options
        // -------------

        model: new Backbone.Model({
            confirmBox: false,
            title: 'Modal Title',
            content: 'Modal Content',
            btnDefault: 'btn btn-primary',
            persist: false,
            noReject: false,
            buttons: new Backbone.Collection([])
        }),

        // Modal Public Functions
        // ----------------------

        /**
         * Primary function.  Call this to bring up the modal.
         * If no arguments are passed, the modal box will display with any existing content.
         *
         * @param {object} [args] - Options to be set on this.model
         * @param {Boolean} [args.confirmbox] - If true, will use smaller confirm box.
         * @param {string} [args.title] - Title to display in title area of modal.
         * @param {string} [args.content] - Content to display in modal message body.
         * @param {string} [args.btnDefault] - Default classes to apply to buttons with no classes property.
         * @param {boolean} [args.persist] - If false (default), any view passed to modal will be disposed on close.
         * @param {Collection} [args.buttons] - Backbone.Collection holding data for modal buttons.
         * @param {string} [args.buttons.name] - Display name for the button
         * @param {string} [args.buttons.classes] - Classes to apply to the button (ex: 'btn btn-warning')
         * @param {Function} [args.buttons.fn] - Function to fire when button is clicked.
         * @param {string} [args.buttons.loadingText] - Enable bootstrap loading state on the button and this text will be displayed in button during onclick. To prevent user from clicking on same button multiple times.
         */
        show: function(args) {
            if (args) {
                this.model.set({
                    confirmBox: (args.confirmBox) ? args.confirmBox : false,
                    title: (args.title) ? args.title : null,
                    content: (args.content) ? args.content : null,
                    persist: (args.persist) ? args.persist : false,
                    noReject: (args.noReject) ? args.noReject : false
                });

                if (args.buttons) this.model.get('buttons').reset(args.buttons);
                else this.model.get('buttons').reset();

                if (args.view) this.setContentView(args.view);
                else this.removeView('.modal_content');
            }

            this.$el.find('.modal').modal();
        },

        /**
         * Set a view as the modal main content.
         * @param {View} view - An instance of a view to apply to the main content area of the modal.
         */
        setContentView: function(view) {
            this.setView('.modal_content', view);
            this.renderViews();
        },

        /**
         * Close the modal, triggering modal close event.
         */
        close: function() {
            this.$el.find('.modal').modal('hide');
            // Review to get entity if rejectChanges starts causing any problems
            // Also can have user pass in a rejectChanges function to be used here
            if (!this.model.get('confirmBox') && this.model.get('noReject')) {
                if (app.api.manager.hasChanges()) app.api.manager.rejectChanges();
            }
        },

        // Modal Events
        // ------------

        events: {
            'click .modal-dynamic-buttons button': '_buttonClick'
        },

        /**
         * Event handler for modal button click event ('click .modal-dynamic-buttons button').
         * All buttons will share this same handler. Will pass on event to button 'fn' property if it exists.
         * @private
         * @param {object} event - jQuery event for click event
         */
        _buttonClick: function(event) {
            var button = $(event.currentTarget);
            var data = button.data();
            // We do not want to set the loading state on all buttons, Set loading state on button only if property has some value
            if (data.loadingText != '')
                button.button('loading');
            var name = data.name;

            var fn = this.model.get('buttons').findWhere({
                name: name
            }).get('fn');
            if (fn) fn(event, this);
        },

        /**
         * Method fires when modal closes, by default disposes view.
         * If this.model.get('persist') == true, the any assigned view will persist.
         * @private
         */
        _modalOnClose: function() {

            if (!this.model.get('persist')) this.removeView('.content');
            //this.$el.find(".btn").button
        }
    });

    return Modal;
});