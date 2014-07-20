/* global define, app, $, alert, breeze, console, DEBUG*/
define([
    'underscore',
    'backbone',
    'idleTimer',
], function(_, Backbone) {
    "use strict";

    var User = Backbone.Model.extend( /** @lends User.prototype */ {
        /**
         * @class User holds information pertinent to currently logged in user.
         *
         * @augments Backbone.Model
         * @constructs
         * @requires Backbone
         * @param {object} options - Backbone.Model options
         */
        initialize: function(options) {},

        title: 'User Model',

        // The below defaults are used for easy development purposes.  Password should never be stored like this!
        defaults: {
            username: "",
            password: "",
            loggingIn: false,
            loggedIn: false
        },

        /**
         * Login function retrieves user credentials
         */
        login: function(callback) {
            this.set('loggedIn', true);
        },

        /**
         * Function to create application user and navigate to home after successful login.
         */
        loginSuccess: function(userdata) {
            /**    
             * User login event triggered on successful login.
             * @event User#user:login
             */
            Backbone.EventBroker.trigger('user:login', app.user);

            $.idleTimer((parseInt(15) * 1000 * 60));
            $(document).bind("idle.idleTimer", function() {
                var counter = 45;
                app.warning.show({
                    message: 'Please note: This session will expire in <span class="warn">' + counter + '</span> seconds due to inactivity.'
                });
                app.timer.subscribe({
                    name: 'idleUser',
                    fn: function() {
                        app.warning.$el.find('.warn').text(counter--); // update the counter
                        if (counter == 0) app.user.logout();
                    }
                });
            });

            $(document).bind("active.idleTimer", function() {
                app.warning.close();
                app.timer.killSubscriber('idleUser');
            });

        },

        /**
         * Helper function to verify logged in user and user is valid
         * @returns {Boolean} If user is valid or not.
         */
        verify: function() {
            if (DEBUG === true) return true;
            if (this.get('userId')) return true;
            else return false;
        },

        /**
         * Logout current user, clear user object, and return to login page.
         * TODO: Finish this function.
         */
        logout: function() {
            /**
             * Logout event triggers on User.logout
             * @event User#user:logout
             */
            this.clear().set(this.defaults);
            Backbone.EventBroker.trigger('user:logout', this);
            // Refresh the app back to default state.
            // window.location.href = window.location.origin + window.location.pathname {Window re-direct works in all browsers};
            window.location.href = window.location.protocol + "//" + window.location.hostname + "/" + window.location.pathname;
        }

    });
    return User;
});