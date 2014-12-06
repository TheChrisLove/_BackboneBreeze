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
            "click .js-forgotPassword": "forgotPassword",
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

        forgotPassword: function(){
            app.modal.show({
                title: 'Forgot Your Password?',
                view: new View({template: 'app/templates/shared/forgotPassword.html'}),
                buttons: [{
                    name : 'Continue',
                    fn: function(){
                        var email = app.modal.$el.find('#getEmail').val();
                        $.get('/auth/resetRequest', { Email: email}, function(resp){
                            if(resp.success){
                                app.modal.$el.find('.step1').hide();
                                app.modal.$el.find('.step2').fadeIn();
                                app.modal.model.get('buttons').reset({
                                    name: 'Reset Password',
                                    fn: function(){
                                        $.get('/auth/resetConfirm', {
                                            Email: app.modal.$el.find('#getEmail').val(),
                                            resetToken: app.modal.$el.find('#getToken').val()
                                        }, function(resp){
                                            if(resp.authenticated){
                                                app.modal.show({
                                                    title: 'Password Reset',
                                                    content: 'Your password has been reset.  Please check your email for your new password.'
                                                });
                                            } else {
                                                app.modal.$el.find('.alert').fadeIn();
                                            }
                                        });
                                    }
                                })
                            } else {
                                app.modal.show({
                                    title: 'Forgot Your Password?',
                                    content: 'Oops!  That email was not found!  Please try again.'
                                });
                            }
                        });
                    }
                }]
            })

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