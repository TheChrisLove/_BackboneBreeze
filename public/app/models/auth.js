/* global define, console */
define([
  'underscore',
  'backbone',
  'views/shared/register_view',
  'views/shared/updatePassword_view'
], function (_, Backbone, Register) {
    "use strict";

    var Model = Backbone.Model.extend({

        defaults: {},

        initialize: function(attributes, options){
        	_.bindAll(this, 'getRegisterView');
        },

        createAuthenticatedUser: function(){

        },

        getRegisterView: function(){
        	return new Register();
        },

        resetPassword: function(token){

        },

        updatePassword: function(user, password, newPassword){
          return Q.when($.get('/auth/update', {
            username: user.get('username'),
            password: password,
            newPassword: newPassword
          }));
        },

        getUpdatePasswordView: function(){
          return new UpdatePasswordView()
        }

    });

    return Model;
});