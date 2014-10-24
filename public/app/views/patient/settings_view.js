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
          'click .js_changePassword' : 'changePassword'
        },

        start: function(options){
          _.bindAll(this, 'saveChanges');
        },

        createViewModel: function(){
          return kb.viewModel(app.user.get('info').get('Patient'));
        },

        changePassword: function(){
          var view = new View({
            template: 'app/templates/shared/changePassword.html',
            renderComplete: function(){
              this.trackValidation({
                rules: {
                  password: {
                    required: true,
                  },
                  newPassword: {},
                  newPasswordConfirm : {
                    equalTo : "#newPassword"
                  }
                }
              });
            }
          });

          app.modal.show({
            title: 'Change Password',
            view: view,
            buttons: [{
              name: 'Save',
              loadingText: 'Updating Password...',
              fn: function(event, modal){
                var $form = modal.$el.find('form');
                var form = app.utils.getForm($form);
                if(!$form.valid()) return false;
                app.auth.updatePassword(app.user, form.password, form.newPassword).then(function(response){
                  if(response && response.success){
                    $.gritter.add({
                      title: 'Success',
                      text: 'Password successfully updated.'
                    })
                    app.modal.close();
                  } else $.gritter.add({
                    title: 'Oops',
                    text: 'Unable to update your password at this time. Please try again later.'
                  });
                });
              }
            }]
          })

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
