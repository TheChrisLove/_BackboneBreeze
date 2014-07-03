/* global define, $ */
define([
  'underscore',
  'backbone',
  'base/view',
  'knockback',
  'knockout',
  'text!templates/shared/locations_breadcrumbs.html'
], function (_, Backbone, View, kb, ko, template) {
    "use strict";

    var LocationsBreadcrumbsView = View.extend({

        className: "locations_breadcrumbs",
        
        template: _.template(template),

        events: {
            'click .crumb' : 'goto',
            'mouseenter .locationGroup' : 'dropdown',
            'mouseleave .locationGroup' : 'dropdown'
        },
        
        dropdown: function(event){
            switch(event.type){
                    case 'mouseenter' :
                        $(event.currentTarget).children('ul').fadeIn('fast');
                    break;
                    case 'mouseleave' : 
                        $(event.currentTarget).children('ul').hide();
                    break;
            }
        },
        
        goto: function(event){
            this.model.setActive($(event.currentTarget).data('locationid'),$(event.currentTarget).data('locationtypeid'),false);
        }

    });

    return LocationsBreadcrumbsView;
});