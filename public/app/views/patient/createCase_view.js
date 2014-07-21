/* global define, app */
// Basic View
// ----------

// Use this as an easy starting point for the creation of new views */
define([
  'underscore',
  'backbone',
  'base/view',
  'knockback',
  'knockout',
  'text!templates/patient/createCase.html'
], function (_, Backbone, View, kb, ko, template) {
    "use strict";

    var BasicView = View.extend({

        template: _.template(template),

        events: {
          'submit form' : 'createCase',
        },

        model : new Backbone.Model({
          newCase: new Backbone.Model({
            "Description" : '',
            "ImageUrl" : '', 
            "Zipcode" : '', 
            "PatientId" : ''
          }),
          email: '',
        }),

        start: function(options){
          _.bindAll(this, '_createCase', 'createCase');
        },

        createViewModel: function(){
          var viewModel = kb.viewModel(this.model.get('newCase'));
          viewModel.Email = kb.observable(this.model, 'email');
          viewModel.loggedIn = kb.observable(app.user, 'loggedIn');

          return viewModel;
        },

        _createCase: function(){
          this.model.get('newCase').set('PatientId', '_' + app.user.get('_id'));
          app.api.manager.createEntity('Case', this.model.get('newCase').toJSON());
          app.api.manager.saveChanges().then(function(){
            $.gritter.add({
              title: 'Success',
              text: 'Case successfully created.'
            })
          });
        },

        // TODO add validation // is current member // add gritters
        createCase: function(event){
          event.preventDefault();

          if(!app.user.get('loggedIn')){
            // Check for existing email.
            var query = app.api.breeze
              .EntityQuery
              .from('Patients')
              .where("Email", 'Equals', this.model.get('email'))
              .inlineCount()
              .using(app.api.manager);

              var _this = this;

            return query.execute().then(function(data) {
                if (data.inlineCount > 0) {
                  // Prompt user to log in
                  app.user.login(data.results[0]);
                  _this._createCase();
                } else {
                  // create user
                  app.api.manager.createEntity('Patient', {
                    Email: _this.model.get('email'),
                    Zipcode: _this.model.get('newCase').get('Zipcode')
                  });
                  app.api.manager.saveChanges().then(function(data){
                    app.user.login(data.entities[0]);
                    _this._createCase();
                  });
                }
            });


          } else this._createCase();

        },

        renderComplete: function(){
          //  TODO add validation here

        }

    });

    return BasicView;
});
