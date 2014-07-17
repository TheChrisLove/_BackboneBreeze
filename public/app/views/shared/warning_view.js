/* global define, app, $ */
/*  */
define([
    'underscore',
    'backbone',
    'base/view',
    'knockback',
    'knockout',
    'text!templates/shared/warning.html'
], function(_, Backbone, View, kb, ko, template) {
    "use strict";

    var Warning = View.extend( /** @lends Warning.prototype */ {
        /**
         * @class Warning Application alert.  Accessible from app.Warning.  Use show() to bring up the warning with your options.
         *
         * @augments View
         * @constructs
         * @requires Backbone
         * @requires View
         * @param {object} options - Backbone.View options
         *
         * @property {Model} model - Backbone.Model tracking warning options.
         * @property {Boolean} [model.confirmbox=false] - If true, will use smaller confirm box.
         * @property {string} [model.content] - Content to display in warning message body.
         * @property {boolean} [model.persist=false] - If false (default), any view passed to warning will be disposed on close.
         * @property {boolean} [model.noReject=false] - Suppress the call to rejectChanges() on warning close
         */
        start: function() {
            _.bindAll(this, 'show', 'close');
        },

        template: _.template(template),

        /**
         * On render complete, warning subscribes to the warning close event to fire this._warningOnClose.
         * Also sets up a reference to itself on the app global.
         */
        renderComplete: function() {
            app.warning = this;
        },

        // Warning Options
        // -------------

        model: new Backbone.Model({
            message: 'Please note: This session will expire in <span class="warn"></span>&nbsp;seconds due to inactivity. <a href="#">Click anywhere to continue</a>.'
        }),

        // Warning Public Functions
        // ----------------------

        /**
         * Primary function.  Call this to bring up the warning.
         * If no arguments are passed, the warning box will display with any existing message.
         *
         * @param {object} [args] - Options to be set on this.model
         * @param {string} [args.message] - Content to display in warning message body.
         * @param {string} [args.btnDefault] - Default classes to apply to buttons with no classes property.
         * @param {boolean} [args.persist] - If false (default), any view passed to warning will be disposed on close.
         */
        show: function (args) {
            if (args) {
                this.model.set({
                    message: (args.message) ? args.message : null
                });
            }

            this.$el.find('.warning').slideDown();
        },

        /**
         * Close the warning, triggering warning close event.
         */
        close: function () {
            this.$el.find('.warning').slideUp();
        },

    });

    return Warning;
});