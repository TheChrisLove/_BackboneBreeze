/* global define, console */
define([
  'underscore',
  'backbone',
  'views/shared/register_view'
], function (_, Backbone, Register) {
    "use strict";

    var Model = Backbone.Model.extend({

        defaults: {},

        initialize: function(attributes, options){
        	_.bindAll(this, 'getRegisterView');
        },

        getRegisterView: function(){
        	return new Register();
        }


    });

    return Model;
});