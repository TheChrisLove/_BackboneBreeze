
/* global define */
define([
  'underscore',
  'backbone',
  'base/view',
  'base/controller',
  'modules/grid/grid_module',
  'views/patient/createCase_view',
  'views/patient/login_view'
], function (_, Backbone, View, Controller, Grid, CreateCaseView, LoginView) {
    "use strict";

    var BasicController = Controller.extend({

        title: "Patient",

        start: function (attributes, options) {
          this.listenTo(Backbone.EventBroker, 'user:login', function(){
            this.buildMenuActions();
          }, this);
         },

        defaults: {
            index: 'createCase',
            actions: {
                createCase: {
                    name : 'Create New Case',
                    fn: function(args) {
                      this.setView(CreateCaseView);
                    }
                },
                cases: {
                    name: 'View Cases',
                    isVisible: function(){
                      return app.user.get('loggedIn'); 
                    },
                    fn: function(args) {

                      var predicate = app.api.breeze.Predicate.create('PatientId', 'Equals', app.user.get('_id'));
                      var grid = new Grid({
                        resource: 'Cases',
                        predicate: predicate
                      });

                      this.setView(grid.getView());
                    }
                },
                login: {
                    name: 'Login',
                    isVisible: function(){
                      return (app.user.get('loggedIn')) ? false : true; 
                    },
                    fn: function(args) {
                        this.setView(LoginView);
                    }
                },
                settings: {
                    name: 'Account Settings',
                    isVisible: function(){
                      return app.user.get('loggedIn'); 
                    },
                    fn: function(args) {
                    }
                },
                logout: {
                    name: 'Logout',
                    isVisible: function(){
                      return app.user.get('loggedIn'); 
                    },
                    fn: function(args) {
                        if(app.user.get('loggedIn')) app.user.logout();
                        else app.router.go('patient/createCase/');
                    }
                }
	        }
        }
    });

    return BasicController;
});
