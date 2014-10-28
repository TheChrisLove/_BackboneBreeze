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
        initialize: function(options) {

            _.bindAll(this, 'getPatientId', 'getDoctorId', 'getAccountType');
        },

        title: 'User Model',

        // The below defaults are used for easy development purposes.  Password should never be stored like this!
        defaults: {
            username: "",
            password: "",
            authenticated: false,
            loggingIn: false,
            loggedIn: false,
            info: null,
            error_message: ""
        },

        getAccountType: function(){
            var info = this.get('info');
            if (info) return this.get('info').get('AccountType');
            else return false;
        },

        getPatientId: function(){
            return this.get('info').get('Patient').get('_id');

        },

        getDoctorId: function(){
            return this.get('info').get('Doctor').get('_id');

        },

        authenticate: function(){
            var _this = this;
            return Q.when($.get('/auth/verify', {
                username: this.get('username'),
                password: this.get('password')
            }), function(data){
                if(data.authenticated) _this.set('authenticated', data.authenticated);
                return data;
            });
        },

        /**
         * Login function retrieves user credentials
         */
        login: function(args) {
            args = (!args) ? {} : args;
            if(args.username || args.password){
                this.set({
                    username: username,
                    password: password
                });
            };

            var _this = this;

            return app.api.breeze.EntityQuery
                .from('Users')
                .using(app.api.manager)
                .where('Email', 'Equals', this.get('username'))
                .execute()
                .then(function(data){
                    // Determine user type
                    var user = data.results[0];
                    if(!user) return app.modal.show({
                        title: 'Oops',
                        content: 'Unable to log in at this time.  Please verify email and password and try again.'
                    });

                    var type = user.get('AccountType');
                    // Need to update this... firing sequence of loggin in is off
                    // the check for get type below is basically an expand, auth should happen here or not
                    app.api.breeze.EntityQuery
                        .from(type + 's')
                        .using(app.api.manager)
                        .where('UserId', 'Equals', user.get('_id'))
                        .execute()
                        .then(function(data){
                            if(!_this.get('authenticated')) _this.authenticate().then(function(authenticated){
                                if(_this.get('authenticated')) return _this.loginSuccess(user, args.noRedirect);
                                else {
                                    var modal = {
                                        title: 'Oops! Unable to login...',
                                        content: 'The password you entered does not match the password for this account.  Please try again.'
                                    };
                                    if(authenticated.locked) modal.content = 'This account is temporarily locked.  Please try again later.';
                                    app.modal.show(modal);
                                    _this.set('loggingIn', false);
                                    return false;
                                }
                            });
                            else _this.loginSuccess(user, args.noRedirect);
                        });
                });
        },



        /**
         * Function to create application user and navigate to home after successful login.
         */
        loginSuccess: function(user, noRedirect) {
            var type = user.get('AccountType');
            this.set('loggedIn', true);
            this.set('info', user);

            if(noRedirect && !_.isBoolean(noRedirect)){
                if(_.isFunction(noRedirect)) app.router.go(noRedirect());
                else if(_.isObject(noRedirect)) app.router.go(noRedirect[type]);
                else app.router.go(noRedirect);
            } else if(!noRedirect){
                if(type == 'Patient') app.router.go('patient/cases');
                else if (type == 'Doctor') app.router.go('doctors/');
                else app.router.go('/');
            }
            
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

            return true;
        },

        /**
         * Helper function to verify logged in user and user is valid
         * @returns {Boolean} If user is valid or not.
         */
        verify: function() {
            if (this.get('authenticated') && this.get('info').get('_id')) return true;
            else return false;
        },

        /**
         * Logout current user, clear user object, and return to login page.
         * TODO: Finish this function.
         */
        logout: function(redirect) {
            /**
             * Logout event triggers on User.logout
             * @event User#user:logout
             */
            this.clear().set(this.defaults);
            Backbone.EventBroker.trigger('user:logout', this);
            // Refresh the app back to default state.
            // window.location.href = window.location.origin + window.location.pathname {Window re-direct works in all browsers};
            //window.location.href = window.location.protocol + "//" + window.location.hostname + "/" + window.location.pathname;
            if(redirect !== false) window.location.reload();
        },

        resetPassword: function(){

        },

        createUser: function(email, type, set){
            var opts = {
                AccountType: type,
                Email: email
            };

            var _set = set;
            var user = app.api.manager.createEntity('User', opts);

            return app.api.manager.saveChanges([user]).then(function(data){
                var user = data.entities[0];
                
                return  Q.when($.get('/auth/create', opts), function(data){
                    // TODO not sure if anything to do here
                    if(_set) app.user.set({
                        username: opts.Email,
                        info: user, 
                        loggedIn: true,
                        authenticated: true
                    });

                    return user;
                });
            });
        }

    });
    return User;
});