
/* global define */
define([
  'underscore',
  'backbone',
  'base/view',
  'base/controller',
  'modules/grid/grid_module',
  'views/patient/createCase_view',
  'views/shared/login_view',
  'views/patient/index_view',
  'views/patient/settings_view',
  'modules/grid/grid_wrapper_view',
  'views/patient/case_row_view'
], function (_, Backbone, View, Controller, Grid, CreateCaseView, LoginView, IndexView, SettingsView, GridWrapper, CaseRowView) {
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
                      zone: '.content',
                      view: new View({
                        template: 'app/templates/common/aboutUs.html'
                      })
                    });

                    this.setView({
                      zone: '.zone1',
                      view: CreateCaseView
                    });
                  }
                },
                createCase: {
                    name : 'Create New Case',
                    isVisible: function(){
                      if (app.user.get('loggedIn') == false) return true;
                      else if (app.user.getAccountType() == 'Patient') return true;
                      else return false;
                    },
                    fn: function(args) {
                      this.cleanViews();
                      if(app.user.get('loggedIn') == false){
                        this.setView({
                          zone: '.content',
                          view: new View({
                                  template: 'app/templates/common/aboutUs.html'
                                })
                        });
                      }
                        
                      this.setView({
                        view: CreateCaseView,
                        zone: '.zone1'
                      });
                    }
                },
                caseCreated: {
                  fn: function(){
                    if(!app.user.verify()) app.router.go('/');
                    else {
                      this.cleanViews();
                      this.setView( new View({ template: 'app/templates/patient/case_created.html'}));
                    }
                  }
                },
                allCases: {
                    name: 'Admin Page',
                    isVisible: function(){
                      return (app.user.getAccountType() == 'Admin');
                    },
                    fn: function(args) {
                        this.cleanViews();

                        var grid = new Grid({
                          title: 'My Cases',
                          resource: 'Cases',
                          columns: {
                            editable: 'all',
                          },
                          defaultSort: {
                            prop: '_id',
                            type: 'Int32',
                            order: 'desc'
                          }
                        });

                        this.setView(grid.getView());
                      }
                },
                viewCases: {
                  name: 'View Cases',
                  isVisible: function(){
                    if (app.user.get('loggedIn') == false) return true;
                    else if (app.user.getAccountType() == 'Doctor') return true;
                    else return false;
                  },
                  fn: function(){
                      this.cleanViews();
                      if (app.user.get('loggedIn') == true && app.user.getAccountType() != 'Doctor') app.router.go('/');

                      var wrapper = GridWrapper.extend({
                        template: 'app/templates/patient/cases.html'
                      });

                      var grid = new Grid({
                        title: 'View Cases',
                        resource: 'Cases',
                        limit: 12,
                        wrapper: wrapper,
                        row: CaseRowView,
                        columns: {
                          editable: 'all',
                        },
                        defaultSort: {
                          prop: '_id',
                          type: 'Int32',
                          order: 'desc'
                        }
                      });

                      this.setView(grid.getView());
                  }
                },
                cases: {
                    name: 'My Cases',
                    isVisible: function(){
                      return app.user.get('loggedIn'); 
                    },
                    fn: function(args) {

                      if(!app.user.verify()) app.router.go('/');
                      else {
                        this.cleanViews();

                        var wrapper = GridWrapper.extend({
                          template: 'app/templates/patient/cases.html'
                        });
                        var predicate = app.api.breeze.Predicate.create('PatientId', app.api.breeze.FilterQueryOp.Equals, app.user.getPatientId());
                        var grid = new Grid({
                          title: 'My Cases',
                          resource: 'Cases',
                          wrapper: wrapper,
                          row: CaseRowView,
                          columns: {
                            editable: 'all',
                          },
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
                login: {
                    name: 'Login',
                    isVisible: function(){
                      return (app.user.get('loggedIn')) ? false : true; 
                    },
                    fn: function(args) {
                        this.cleanViews();
                        this.setView({
                          zone: '.content',
                          view: new View({
                            template: 'app/templates/common/aboutUs.html'
                          })
                        });
                        this.setView({
                          zone: '.zone1',
                          view: LoginView
                        });
                    }
                },
                signup: {
                  name: 'Signup',
                  isVisible: function(){
                    return (app.user.get('loggedIn')) ? false : true;
                  },
                  fn: function(){
                    this.cleanViews();
                    this.setView({
                      zone: '.content',
                      view: new View({
                        template: 'app/templates/common/aboutUs.html'
                      })
                    });
                    this.setView({
                      view: app.auth.getRegisterView(),
                      zone: '.zone1'
                    });
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
