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
  'text!templates/patient/settings.html'
], function (_, Backbone, View, kb, ko, template) {
    "use strict";

    var BasicView = View.extend({

        template: _.template(template),

        className: 'banner',

        events: {
          'submit form' : 'saveChanges',
        },

        start: function(options){
          _.bindAll(this, 'saveChanges');
        },

        createViewModel: function(){
          return kb.viewModel(app.user.get('info').get('Patient'));
        },

        saveChanges: function(event){
          event.preventDefault();
          // TODO not going to work, app.user using either persistant manager or not at all
          app.api.manager.saveChanges().then(function(){
            $.gritter.add({
              title: 'Success',
              text: 'Settings successfully updated.'
            })
          });
        }

    });

    return BasicView;
});
