/* global define */
define([
  'underscore',
  'backbone',
  'base/view',
  'base/controller',
  'modules/grid/grid_module',
  'views/shared/login_view',
 'views/patient/case_row_view',
  'modules/grid/grid_wrapper_view',
  'views/patient/settings_view'
], function (_, Backbone, View, Controller, Grid, LoginView, CaseRowView, GridWrapper, SettingsView) {
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

                    var city = (app.user.get('info') && 
                                   app.user.get('info').get('Doctor') && 
                                   app.user.get('info').get('Doctor').get('City')) ? app.user.get('info').get('Doctor').get('City') : null;
                    var predicate = (city) ? app.api.breeze.Predicate.create('City', 'Equals', city) : null;
                    var _filters = (predicate) ? { City: predicate } : {};

                    var grid = new Grid({
                        title: 'View/Search Cases',
                        resource: 'Cases',
                        wrapper: wrapper,
                        //predicate: (predicate) ? predicate : null,
                        _filters: _filters,
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
                name: 'Account Settings',
                isVisible: function(){
                  return app.user.get('loggedIn'); 
                },
                fn: function(args) {
                  if(!app.user.verify()) app.router.go('/');
                  else {
                    this.cleanViews();
                    var view = SettingsView.extend({
                      createViewModel: function(){
                        return kb.viewModel(app.user.get('info').get('Doctor'));
                      },
                      template: 'app/templates/doctors/settings.html'
                    })
                    this.setView(new view());
                  }
                }
              },
              practice: {
                fn: function(){
                  var vetLicenseNumber = app.user.get('info').get('Doctor').get('VetLicenseNumber');
                  var predicate = app.api.breeze.Predicate.create('VetLicenseNumber', 'Equals', vetLicenseNumber);

                  var grid = new Grid({
                    resource: 'Doctors',
                    predicate: predicate
                  });

                  this.cleanViews();
                  this.setView(grid.getView());

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
                    this.setView({
                      zone: '.content',
                      view: new View({
                        template: 'app/templates/common/aboutUs.html'
                      })
                    });
                    this.setView({
                      view : LoginView,
                      zone: '.zone1' 
                    });
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
