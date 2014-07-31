
/* global define */
define([
  'underscore',
  'backbone',
  'base/view',
  'base/controller',
  'modules/grid/grid_module',
  'views/patient/createCase_view',
  'views/patient/login_view',
  'views/patient/index_view',
  'views/patient/settings_view'
], function (_, Backbone, View, Controller, Grid, CreateCaseView, LoginView, IndexView, SettingsView) {
    "use strict";

    var BasicController = Controller.extend({

        title: "Patient",


        start: function (attributes, options) {
          this.listenTo(Backbone.EventBroker, 'user:login', function(){
            this.buildMenuActions();
          }, this);
         },

        defaults: {
            index: 'index',
            actions: {
                index: {
                  fn: function(){
                    this.cleanViews();
                    this.setView({
                      zone: '.zone1',
                      view: IndexView
                    });
                  }
                },
                createCase: {
                    name : 'Create New Case',
                    isVisible: function(){
                      return (this.get('currentAction') == 'index') ? false : true;
                    },
                    fn: function(args) {
                      this.cleanViews();
                      this.setView(CreateCaseView);
                    }
                },
                caseCreated: {
                  fn: function(){
                    if(!app.user.verify()) app.router.go('/');
                    else {
                      this.cleanViews();
                      this.setView(new View({
                        template: 'app/templates/patient/case_created.html'
                      }));
                    }
                  }
                },
                cases: {
                    name: 'View Cases',
                    isVisible: function(){
                      return app.user.get('loggedIn'); 
                    },
                    fn: function(args) {
                      if(!app.user.verify()) app.router.go('/');
                      else {
                        this.cleanViews();

                        var predicate = app.api.breeze.Predicate.create('PatientId', app.api.breeze.FilterQueryOp.Equals, '_' + app.user.get('_id'));
                        var grid = new Grid({
                          title: 'My Cases',
                          resource: 'Cases',
                          predicate: predicate,
                          defaultSort: {
                            prop: '_id',
                            type: 'Int32',
                            order: 'desc'
                          }
                        });

                        this.setView(grid.getView());
                      }
                    }
                },
                login: {
                    name: 'Login / Signup',
                    isVisible: function(){
                      return (app.user.get('loggedIn')) ? false : true; 
                    },
                    fn: function(args) {
                        this.cleanViews();
                        this.setView(LoginView);
                    }
                },
                settings: {
                    name: 'Account Settings',
                    isVisible: function(){
                      return app.user.get('loggedIn'); 
                    },
                    fn: function(args) {
                      if(!app.user.verify()) app.router.go('/');
                      else {
                        this.cleanViews();
                        this.setView(SettingsView);
                      }
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
