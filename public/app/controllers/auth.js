
/* global define */
define([
  'underscore',
  'backbone',
  'base/view',
  'base/controller',
  'text!templates/auth/login_controller.html',
  'views/auth/login_view'
], function (_, Backbone, View, Controller, layout_template, LoginView) {
    "use strict";

    var BasicController = Controller.extend({

        title: "Login",

        start: function (attributes, options) { },

        ddefaults: {
            index: 'login',
            _layout: View.extend({
                el: "#main_content",
                template: _.template(layout_template),
            }),
            actions: {
                login: {
                    fn: function(args) {
                        this.setView(LoginView);
                    }
                }
	        }
        }
    });

    return BasicController;
});
