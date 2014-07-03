/* global define, app, $, alert, breeze, console, DEBUG*/
define([
    'underscore',
    'backbone',
    'idleTimer',
    //'idleTimeout'
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
            loggingIn: false
        },

        /**
         * Login function retrieves user credentials
         * TODO: Clean up this function.
         */
        login: function(callback) {
            var _this = this;
            var _callback = callback;

            var appDataModel = {
                grant_type: "password",
                username: app.user.get('username'),
                password: app.user.get('password')
            };

            app.user.set("loggingIn", true);

            $.ajax({
                url: "/ESS.WebAPI.Security/Token",
                data: appDataModel,
                cache: false,
                type: 'POST',
                dataType: "json",
                contentType: 'application/json; charset=utf-8'
            }).done(function(userdata) {

                if (userdata.userName && userdata.access_token) {
                    _this.IsTopLevelLocationDeleted(userdata, _callback);
                } else {
                    app.user.set("error_message", "An unknown error occurred.");
                    if (_callback) _callback();
                }



            }).fail(function(data) {
                if (data.responseJSON && data.responseJSON.error_description) {
                    app.user.set("error_message", data.responseJSON.error_description);
                } else {
                    alert(data.responseText);
                    app.user.set("error_message", "An unknown error occurred.");
                }

                if (_callback) _callback();
                app.user.set("loggingIn", false);
            });
        },

        /**
         * Function to create application user and navigate to home after successful login.
         */
        loginSuccess: function(userdata) {
            app.userToken = userdata.access_token;
            app.userName = userdata.userName;
            app.parentId = userdata.topLevelLocationId;
            app.userId = userdata.userId;
            // app.activeId = data.startLocationId;
            // app.claims = JSON.parse(data.claims); // Included in app.user
            var essUserProfile = JSON.parse(userdata.essUserProfile)[0];
            app.user.set({
                access_token: userdata.access_token,
                token_type: "bearer",
                expires_in: 1209599,
                userName: userdata.userName,
                topLevelLocationId: essUserProfile.topLevelLocationId,
                topLevelLocationTypeId: essUserProfile.topLevelLocationTypeId,
                claims: JSON.parse(userdata.claims),
                userId: userdata.userId,
                startLocationId: essUserProfile.startLocationId,
                startLocationTypeId: essUserProfile.startLocationTypeId,
                authenticationType: userdata.authenticationType,
                userAuthenticationType: essUserProfile.userAuthenticationType,
                essUserId: userdata.essUserId,
                passwordExpiryDays: essUserProfile.passwordExpiryDays
                //idleTimeOut: userdata.idleTimeOut
                //.issued": " Mon, 03 Feb 2014 15: 37: 36 GMT",
                //".expires": "Mon, 17 Feb 2014 15: 37: 36 GMT"
            });
            app.user.set("isUserMgrAdmin", AuthObj.HavingProfile("User Manager","Administrator"));
            /**    
             * User login event triggered on successful login.
             * @event User#user:login
             */
            Backbone.EventBroker.trigger('user:login', app.user);



            var _this = this;
            if (essUserProfile.userAuthenticationType == "Database") {
                if (essUserProfile.passwordExpiryDays <= 0) {

                    app.router.go('/auth/passwordexpired');
                    return;
                } else if (essUserProfile.passwordExpiryDays <= 15) {
                    setTimeout(function() {
                        app.modal.show({
                            title: 'Please note: Your password will expire in ' + essUserProfile.passwordExpiryDays + ' days. Please click on Settings link to modify your password.',
                            confirmBox: true,
                            buttons: [{
                                name: 'OK',
                                fn: _this.handleClose
                            }]
                        });
                    }, 1000);
                }
            }
            if (app.user.get('LDAPUser') == 'true' && app.user.get('LDAPUserID') != null) {
                app.router.go('/user/edit/id=' + app.user.get('LDAPUserID'));
            } else if (DEBUG !== true) app.router.go(app.info.get('home'));


            $.idleTimer((parseInt(userdata.idleTimeOut) * 1000 * 60));
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

            // Start the idle timer
            /*
            $.idleTimeout('.warning', '.warning a', {
                idleAfter: (userdata.idleTimeOut * 60) - 30, // Calculation of idletimeout from DB shown message before 30 sec.
                pollingInterval: 2,
                titleMessage: 'Warning: %s seconds until log out | ',
                onTimeout: function() {
                    app.warning.close();
                    app.user.logout();
                },
                onIdle: function() {
                    app.warning.show({
                        message: 'Please note: This session will expire in <span id="#warn"></span> seconds due to inactivity. <a href="#">Click anywhere to continue</a>.'
                    }); // show the warning bar
                },
                onCountdown: function(counter) {
                    app.warning.$el.find('.warn').html(counter); // update the counter
                },
                onResume: function() {
                    app.warning.close(); // hide the warning bar
                }
            });
*/
        },

        handleClose: function() {
            app.modal.close();
        },

        /**
         * Helper function to verify logged in user and user is valid
         * TODO : Finish this function.
         * @returns {Boolean} If user is valid or not.
         */
        verify: function() {
            // TODO add verification logic here to ensure logged in user
            //return true;
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
        },

        /**
         * Function to check if user toplevel location was deleted.
         */
        IsTopLevelLocationDeleted: function(userdata, callback) {
            var essUserProfile = JSON.parse(userdata.essUserProfile)[0];
            var p1 = app.api.Predicate.create('Id', app.api.FilterQueryOp.Equals, essUserProfile.topLevelLocationId);
            var p2 = app.api.Predicate.create('IsDeleted', app.api.FilterQueryOp.Equals, false);
            var wherePredicate = app.api.Predicate.and(p1, p2);
            var _this = this;
            var _callback = callback;

            var query = app.api.breeze
                .EntityQuery
                .from('Locations')
                .where(wherePredicate)
                .take(0).inlineCount()
                .noTracking();

            app.api.manager.executeQuery(query).then(function(data) {
                // Right now the only callback being used is to reset the button, no need to do that if we get a navigate here
                //if (_callback) _callback();
                app.user.set("loggingIn", false);
                if (data.inlineCount == 1)
                    _this.loginSuccess(userdata);
                else {
                    if (userdata.authenticationType == "DirectoryService")
                        app.router.go('/auth/LDAPFirstTimeMessage');
                    else
                        app.router.show404("Your home location was deleted. Please contact your system administrator.");
                }
            }).fail(function(response) {
                if (_callback) callback();
                app.user.set("loggingIn", false);
                console.log('Ouch!');
                console.log(response);
            });
        }
    });
    return User;
});