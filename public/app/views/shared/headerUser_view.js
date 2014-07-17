/* global define */
define([
    'underscore',
    'backbone',
    'base/view',
    'knockback',
    'knockout',
    'text!templates/shared/header_user.html'
], function(_, Backbone, View, kb, ko, template) {
    "use strict";

    var HeaderUser = View.extend({

        className: "header_user",

        template: _.template(template),

        events: {
            'click .js-logout': 'logout',
            'click .js-settings': 'usersettings'
        },

        logout: function() {
            this.model.logout();
        },

        usersettings: function () {
            app.router.go('/userprofile/userprofilelandingpageview');
        }

    });

    return HeaderUser;
});