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
  'text!templates/patient/createCase.html',
  'models/createCase'
], function (_, Backbone, View, kb, ko, template, CaseCreationModel) {
    "use strict";

    var BasicView = View.extend({

        template: _.template(template),

        className: 'banner',

        events: {
          'submit form' : 'createCase',
        },

        model : new CaseCreationModel(),

        start: function(options){
          _.bindAll(this, 'createCase');
        },

        createViewModel: function(){
          var viewModel = kb.viewModel(this.model.get('newCase'));
          viewModel.Email = kb.observable(this.model, 'email');
          viewModel.loggedIn = kb.observable(app.user, 'loggedIn');

          return viewModel;
        },

        createCase: function(event){
          event.preventDefault();
          this.model.createCase();
        }


    });

    return BasicView;
});
