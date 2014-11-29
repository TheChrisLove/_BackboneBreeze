/* global define, app, alert, $ */
define([
    'base/view',
    'text!templates/shared/register.html',
    'views/shared/login_view'
], function(View, template, LoginView) {
    "use strict";

    var LogInItem = View.extend({

        template: _.template(template),

        model: new Backbone.Model({
            Step: 1
        }),

        events: {
            "click .js-checkEmail" : "checkEmail",
            "click .js-continue": "continueRegistration",
            "click .js-register" : "createDoctor",
            "submit form": "die"
        },

        die: function(e){
            e.preventDefault();
        },

        continueRegistration: function(e){
            // If Doctor, continue with step 2 - x
            var step = this.model.get('Step');
            $('.register_step_' + step, this.$el).hide();
            $('.register_step_' + ++step, this.$el).hide().removeClass('hidden').show();
            this.model.set('Step', step);
        },

        checkEmail: function(){
            if(!app.user.get('loggedIn')) app.user.logout(false);

            var _this = this;
            var type = this.$el.find('select[name="AccountType"]').val();
            var email = this.$el.find('input[name="Email"]').val();
            var city = this.$el.find('input[name="City"]').val(); 

            // Check for existing email.
            var query = app.api.breeze
              .EntityQuery
              .from('Users')
              .where("Email", 'Equals', email)
              .inlineCount()
              .using(app.api.manager);

              var _this = this;

            return query.execute().then(function(data) {
                if (data.inlineCount > 0) {
                  // Prompt user to log in
                  app.user.set('username', email);
                  app.modal.show({
                    view: new LoginView({
                      model: app.user,
                      template: 'app/templates/shared/login_skinny.html'
                    }),
                    title: 'Email already in use?!',
                    content: 'It appears you may have already registered with this email... or someone has!  Enter your password to login, or please use a new email for account creation.',
                    buttons: [{
                      name: 'Login', 
                      fn: function(){
                        app.modal.close();
                        app.user.login();                     }
                    }]
                  })
                } else { 
                    if(type == 'Patient') _this._createPatient(email, city);
                    else _this.continueRegistration()
                }
            });
        },

        _createPatient: function(email, city){
          // create user
          app.user.createUser(email, 'Patient').then(function(user){

              var patient = app.api.manager.createEntity('Patient', {
                Email: email,
                City: city,
                UserId: user.get('_id')
              });

              app.api.manager.saveChanges([patient]).then(function(data){

                app.user.set({
                  info:  user, 
                  loggedIn: true,
                  authenticated: true
                });
                app.user.loginSuccess(user, {
                  Patient: 'patient/createCase',
                  Doctor: 'doctors/cases'
                });

              });

          })
        },


        start: function() {
            _.bindAll(this, 'createDoctor', 'continueRegistration', '_createPatient');
        },
        
        createDoctor: function(event, modal) {
          var opts = app.utils.getForm(this.$el.find('form[name="register_now"]'));

          app.user.createUser(opts.Email, 'Doctor').then(function(user){
            opts.UserId = user.get('_id');
            var doctor = app.api.manager.createEntity('Doctor', opts);

            app.api.manager.saveChanges([doctor]).then(function(data){

              app.user.set({
                info:  user, 
                loggedIn: true
              });
              app.user.loginSuccess(user, {
                Patient: 'patient/createCase',
                Doctor: 'doctors/cases'
              });

            });
          });
        }



    });
    return LogInItem;
});