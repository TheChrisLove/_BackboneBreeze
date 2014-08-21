/* global define, console */
define([
  'underscore',
  'backbone',
  'views/shared/login_view'
], function (_, Backbone, LoginView) {
    "use strict";

    var Model = Backbone.Model.extend({

        defaults: {
	    	newCase: new Backbone.Model({
	            "Description" : '',
	            "ImageUrl" : '', 
	            "Zipcode" : '', 
	            "PatientId" : '',
              "Created" : null,
              "PatientEmail" : null
	          }),
	          email: '',
	          user: app.user
        },

        start: function (attributes, options) {
          _.bindAll(this, '_createCase', 'createCase')
         },

        _createCase: function(){
          this.get('newCase').set('PatientId', this.get('user').get('info').get('Patient').get('_id'));
          this.get('newCase').set('PatientId', this.get('user').get('info').get('Patient').get('Email'));
          this.get('newCase').set("Created", new Date());
          var newCase = app.api.manager.createEntity('Case', this.get('newCase').toJSON());
          return app.api.manager.saveChanges([newCase]).then(function(){
             app.router.go('/patient/caseCreated/');
          });
        },

        // TODO add validation // is current member // add gritters
        createCase: function(){

          if(!this.get('user').get('loggedIn')){
            // Check for existing email.
            var query = app.api.breeze
              .EntityQuery
              .from('Patients')
              .where("Email", 'Equals', this.get('email'))
              .inlineCount()
              .using(app.api.manager);

              var _this = this;

            return query.execute().then(function(data) {
                if (data.inlineCount > 0) {
                  // Prompt user to log in

                  //app.user.login(data.results[0]);
                  //_this._createCase();
                  _this.get('user').set('username', _this.get('email'));
                  app.modal.show({
                    view: new LoginView({
                      template: 'app/templates/shared/login_skinny.html'
                    }),
                    title: 'Welcome Back! Please login to continue...',
                    buttons: [{
                      name: 'Login and Create Case',
                      fn: function(){
                        _this.get('user').login({noRedirect: true}).then(function(){
                          _this._createCase().then(function(){
                            app.modal.close();
                          });
                        })
                      }
                    }]
                  })
                } else {
                  // create user
                  var user = app.api.manager.createEntity('User', {
                    AccountType: 'Patient',
                    Email: _this.get('email')
                  });

                  app.api.manager.saveChanges([user]).then(function(data){
                    var patient = app.api.manager.createEntity('Patient', {
                      Email: _this.get('email'),
                      Zipcode: _this.get('newCase').get('Zipcode'),
                      UserId: user.get('_id')
                    });

                    app.api.manager.saveChanges([patient]).then(function(data){
                      _this.get('user').set({
                        info:  user, 
                        loggedIn: true
                      });
                      _this._createCase();

                    });
                  });
                }
            });
          } else this._createCase();
        }

    });

    return Model;
});