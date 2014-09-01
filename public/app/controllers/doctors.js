/* global define */
define([
  'underscore',
  'backbone',
  'base/view',
  'base/controller',
  'modules/grid/grid_module',
  'views/shared/login_view',
 'views/patient/case_row_view',
  'modules/grid/grid_wrapper_view'
], function (_, Backbone, View, Controller, Grid, LoginView, CaseRowView, GridWrapper) {
    "use strict";

    var BasicController = Controller.extend({

        title: "doctors",

        start: function (attributes, options) { },

        defaults: {
          index: 'cases',
          actions: {
              cases: {
                  name: 'View Cases',
                  fn: function(args){

                    this.cleanViews();
                    var wrapper = GridWrapper.extend({
                          template: 'app/templates/patient/cases.html'
                        });

                    var grid = new Grid({
                        title: 'View/Search Cases',
                        resource: 'Cases',
                        wrapper: wrapper,
                        row: CaseRowView,
                        defaultSort: {
                          prop: '_id',
                          type: 'Int32',
                          order: 'desc'
                        }
                    });

                    this.setView(grid.getView());

                  }
              },
              bids: {
                name: 'View Bids',
                isVisible: function(){
                  return app.user.verify();
                },
                fn: function(args){

                  this.cleanViews();

                  var predicate = app.api.breeze.Predicate.create('Bids.DoctorId', 'Equals', app.user.getDoctorId());

                  var wrapper = GridWrapper.extend({
                    template: 'app/templates/patient/cases.html'
                  });

                  var grid = new Grid({
                      title: 'View/Search Cases',
                      resource: 'Cases',
                      wrapper: wrapper,
                      predicate: predicate,
                      row: CaseRowView,
                      defaultSort: {
                        prop: '_id',
                        type: 'Int32',
                        order: 'desc'
                      }
                  });

                  this.setView(grid.getView());
                }
              },
              profile: {
                name : 'Account Settings',
                isVisible: function(){
                  return app.user.verify();
                },
                fn: function(args){

                }
              },
              login: {
                  name: "Login/Signup",
                  isVisible: function(){
                    return (app.user.verify()) ? false : true;
                  },
                  fn: function (args) {
                    // TODO differentiate between user/doctor?
                    this.cleanViews();
                    this.setView(LoginView)
                  }
              },
              logout: {
                name: 'Logout',
                isVisible: function(){
                  return app.user.verify();
                },
                fn: function(){
                  if(app.user.get('loggedIn')) app.user.logout();
                        else app.router.go('doctor/login/');
                    }
              }
          }
        }
    });

    return BasicController;
});
