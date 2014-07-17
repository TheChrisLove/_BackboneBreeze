/* global define */
define([
  'underscore',
  'backbone',
  'base/view',
  'base/controller'
], function (_, Backbone, View, Controller) {
    "use strict";

    var BasicController = Controller.extend({

        title: "Activity Monitor",

        start: function (attributes, options) { },

        defaults: {
          actions: {
              index: {
                  name: "My Activity",
                  fn: function (args) {
                     
                  }
              }
          }
        }
    });

    return BasicController;
});
