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
  'text!templates/shared/updatePassword.html'
], function (_, Backbone, View, kb, ko, template) {
    "use strict";

    var BasicView = View.extend({

        template: _.template(template),

        events: {
          'submit form' : 'submit',
          'click button' : 'submit'
        },

        submit: function(){
          // TODO validation that new passwords match
          
          app.auth.updatePassword(app.utils.getForm(this.$el.find('form'))).then(function(data){
            // TODO update view to show error/confirmation;
          });
        }

    });

    return BasicView;
});
