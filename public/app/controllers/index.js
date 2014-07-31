
/* global define */
define([
  'underscore',
  'backbone',
  'base/view',
  'base/controller',
  'modules/grid/grid_module',
  'views/patient/createCase_view',
  'views/patient/login_view',
  'text!templates/shared/theme.html'
], function (_, Backbone, View, Controller, Grid, CreateCaseView, LoginView, template) {
    "use strict";

    var IndexController = Controller.extend({

        title: "PetBidClinic",

        start: function (attributes, options) {
            
         },

         defaults: {
          template: template

         },
        
        renderComplete: function() {
            /***********************  Slider Revolution  ***************************/
            /*
            if($('.banner', this.$el).length) {
                $('.banner', this.$el).revolution({
                    startheight:500,
                    startwidth:1200,
                    onHoverStop: "on",
                    hideThumbs:1,
                    navigationType: "bullet",
                    navigationStyle: "round",
                    shadow:0,
                });    
            }
            */
        }
    });

    return IndexController;
});
