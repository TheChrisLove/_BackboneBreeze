/* global define, app, alert, $ */
define([
    'underscore',
    'backbone',
    'base/view',
    'knockback',
    'knockout',
    'text!templates/shared/login.html'
], function(_, Backbone, View, kb, ko, template) {
    "use strict";

    var LogInItem = View.extend({

        template: _.template(template),

        events: {
            "click .js-loginButton": "login",
            "submit form": "login"
        },

        start: function() {
            if(!this.model && app && app.user) this.model = app.user;
            else this.model = new Backbone.Model();
            this.model.set("error_message", "");
            _.bindAll(
                this,
                'login',
                '_login'
            );
        },
        
        _login: function(event, modal) {
          app.modal.close();  
        },

        login: function(event, modal) {
            event.preventDefault();
            this.model.set("error_message", "");
            var btn = $('.js-loginButton', this.$el)
            btn.button('loading');
            this.model.login().then(function(){
                btn.button('reset');
            });
            
//            app.modal.show({
//                title: 'Login',
//                view: new View({
//                    template: 'app/templates/patient/login.html'
//                }),
//                buttons: [{
//                    name: 'Login',
//                    fn: this._login
//                }]
//            });

            /*
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
            */

            //TODO temp login
            

        },

    });
    return LogInItem;
});