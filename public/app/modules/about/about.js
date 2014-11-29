/* global define, console */
define([
  'underscore',
  'backbone',
], function (_, Backbone) {
    "use strict";

    var Model = Backbone.Model.extend({

        defaults: {},

        actions: {
        	about: {
        		fn: {

        			console.log(this.get('controller'))

        		}
        	}
        },

        initialize: function(attributes, options){


        }

    });

    return Model;
});