/* global define, app, alert, $ */
define([
    'underscore',
    'backbone',
    'base/view',
    'knockback',
    'knockout',
    'text!templates/auth/login.html'
], function(_, Backbone, View, kb, ko, template) {
    "use strict";

    var LogInItem = View.extend({

        className: "login",

        template: _.template(template),

        model: new Backbone.Model({
            error_message: "",
            loggingIn: false
        }),

        events: {
            "click .js-loginButton": "login",
            "submit form": "login"
        },

        start: function() {
            this.model.set("error_message", "");
        },

        login: function(event) {
            event.preventDefault();
            this.model.set("error_message", "");
            var btn = $('.js-loginButton', this.$el)
            btn.button('loading');

            app.user.set({
                grant_type: "password",
                username: this.$el.find('input[name="username"]').val(),
                password: this.$el.find('input[name="password"]').val()
            });

            var _this = this;
            app.user.login(function() {
                btn.button('reset');
                if (app.user.get("error_message"))
                    _this.model.set("error_message", app.user.get("error_message"));
            });
        },

    });
    return LogInItem;
});